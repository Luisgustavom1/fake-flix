import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@sharedModule/auth/guard/auth.guard';
import { plainToInstance } from 'class-transformer';
import { SubscriptionBillingService } from '@billingModule/subscription/core/service/subscription-billing.service';
import { SubscriptionPlanChangeService } from '@billingModule/subscription/core/service/subscription-plan-change.service';
import { AddOnManagerService } from '@billingModule/subscription/core/service/add-on-manager.service';
import { ChangePlanUseCase } from '@billingModule/subscription/core/use-case/change-plan.use-case';
import { ChangePlanRequestDto } from '@billingModule/subscription/http/rest/dto/request/change-plan-request.dto';
import { AddSubscriptionAddOnRequestDto } from '@billingModule/subscription/http/rest/dto/request/add-subscription-add-on-request.dto';
import { RemoveAddOnRequestDto } from '@billingModule/subscription/http/rest/dto/request/remove-add-on-request.dto';
import { ChangePlanResponseDto } from '@billingModule/subscription/http/rest/dto/response/change-plan-response.dto';
import {
  ChangePlanAsyncResponseDto,
  PlanChangeStatusResponseDto,
} from '@billingModule/subscription/http/rest/dto/response/change-plan-async-response.dto';
import { SubscriptionAddOnResponseDto } from '@billingModule/subscription/http/rest/dto/response/add-on-response.dto';
import { RemoveAddOnResponseDto } from '@billingModule/subscription/http/rest/dto/response/remove-add-on-response.dto';

/**
 * Feature flag for switching between implementations
 *
 * TODO: Move to configuration service
 */
const USE_NEW_IMPLEMENTATION = process.env.USE_CHANGE_PLAN_USE_CASE === 'true';

@Controller('subscription')
@UseGuards(AuthGuard)
export class SubscriptionBillingController {
  constructor(
    private readonly subscriptionBillingService: SubscriptionBillingService,
    private readonly subscriptionPlanChangeService: SubscriptionPlanChangeService,
    private readonly addOnManagerService: AddOnManagerService,
    private readonly changePlanUseCase: ChangePlanUseCase, // 🆕 Use Case
  ) {}

  /**
   * Change subscription plan (async - invoice generated asynchronously)
   *
   * This endpoint initiates a plan change and returns immediately.
   * The invoice will be generated asynchronously - use GET /plan-change/:id/status
   * to check the status and retrieve the invoice ID once ready.
   *
   * @param subscriptionId - Subscription ID
   * @param dto - Change plan request
   * @returns Plan change result with planChangeRequestId for tracking
   */
  @Post(':id/change-plan')
  @HttpCode(200)
  async changePlan(
    @Param('id') subscriptionId: string,
    @Body() dto: ChangePlanRequestDto,
  ): Promise<ChangePlanAsyncResponseDto> {
    // TODO: Get userId from request context/auth token
    const userId = dto.userId || 'current-user-id';

    const result = await this.subscriptionPlanChangeService.changePlanForUser(
      userId,
      subscriptionId,
      dto.newPlanId,
      {
        effectiveDate: dto.effectiveDate
          ? new Date(dto.effectiveDate)
          : undefined,
        chargeImmediately: dto.chargeImmediately ?? true,
        keepAddOns: dto.keepAddOns ?? false,
      },
    );

    return plainToInstance(
      ChangePlanAsyncResponseDto,
      {
        subscriptionId: result.subscription.id,
        planChangeRequestId: result.planChangeRequestId,
        oldPlanId: result.oldPlanId,
        newPlanId: result.newPlanId,
        prorationCredit: result.prorationCredit,
        prorationCharge: result.prorationCharge,
        estimatedCharge: result.estimatedCharge,
        addOnsRemoved: result.addOnsRemoved,
        nextBillingDate: result.nextBillingDate,
        invoiceStatus: result.invoiceStatus,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  /**
   * Get the status of a plan change request
   *
   * Use this endpoint to check if the invoice has been generated
   * for a plan change request.
   *
   * @param planChangeRequestId - Plan change request ID
   * @returns Status and invoice ID (if ready)
   */
  @Get('plan-change/:id/status')
  async getPlanChangeStatus(
    @Param('id') planChangeRequestId: string,
  ): Promise<PlanChangeStatusResponseDto> {
    const status =
      await this.subscriptionPlanChangeService.getPlanChangeStatus(
        planChangeRequestId,
      );

    if (!status) {
      throw new NotFoundException('Plan change request not found');
    }

    return plainToInstance(
      PlanChangeStatusResponseDto,
      {
        planChangeRequestId,
        status: status.status,
        invoiceId: status.invoiceId,
        errorMessage: status.errorMessage,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  /**
   * Change subscription plan (sync - waits for invoice generation)
   *
   * @deprecated Use POST /:id/change-plan for better performance
   *
   * This endpoint maintains backward compatibility by waiting for
   * the invoice to be generated before returning.
   *
   * Supports dual implementation:
   * - NEW: ChangePlanUseCase (Rich Domain Model)
   * - OLD: SubscriptionBillingService (Transaction Script)
   *
   * Toggle via environment variable: USE_CHANGE_PLAN_USE_CASE=true
   *
   * @param subscriptionId - Subscription ID
   * @param dto - Change plan request
   * @returns Complete result including invoice
   */
  @Post(':id/change-plan-sync')
  @HttpCode(200)
  async changePlanSync(
    @Param('id') subscriptionId: string,
    @Body() dto: ChangePlanRequestDto,
  ): Promise<ChangePlanResponseDto> {
    // TODO: Get userId from request context/auth token
    const userId = dto.userId || 'current-user-id';

    if (USE_NEW_IMPLEMENTATION) {
      // ✅ NEW: Use Case (Rich Domain Model)
      const result = await this.changePlanUseCase.execute({
        userId,
        subscriptionId,
        newPlanId: dto.newPlanId,
        effectiveDate: dto.effectiveDate
          ? new Date(dto.effectiveDate)
          : undefined,
        chargeImmediately: dto.chargeImmediately ?? true,
        keepAddOns: dto.keepAddOns ?? false,
      });

      return ChangePlanResponseDto.fromUseCaseResult(result);
    } else {
      // ✅ OLD: Transaction Script (legacy)
      const result = await this.subscriptionBillingService.changePlanForUser(
        userId,
        subscriptionId,
        dto.newPlanId,
        {
          effectiveDate: dto.effectiveDate
            ? new Date(dto.effectiveDate)
            : undefined,
          chargeImmediately: dto.chargeImmediately ?? true,
          keepAddOns: dto.keepAddOns ?? false,
        },
      );

      return ChangePlanResponseDto.fromServiceResult(result);
    }
  }

  @Post(':id/add-ons')
  async addAddOn(
    @Param('id') subscriptionId: string,
    @Body() dto: AddSubscriptionAddOnRequestDto,
  ): Promise<SubscriptionAddOnResponseDto> {
    const result = await this.subscriptionBillingService.addAddOn(
      subscriptionId,
      dto.addOnId,
      {
        quantity: dto.quantity ?? 1,
        effectiveDate: dto.effectiveDate
          ? new Date(dto.effectiveDate)
          : undefined,
      },
    );

    return plainToInstance(
      SubscriptionAddOnResponseDto,
      {
        id: result.subscriptionAddOn.id,
        addOn: result.subscriptionAddOn.addOn,
        quantity: result.subscriptionAddOn.quantity,
        prorationCharge: result.charge,
        startDate: result.subscriptionAddOn.startDate,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Delete(':id/add-ons/:addOnId')
  async removeAddOn(
    @Param('id') subscriptionId: string,
    @Param('addOnId') addOnId: string,
    @Body() dto: RemoveAddOnRequestDto,
  ): Promise<RemoveAddOnResponseDto> {
    const result = await this.addOnManagerService.removeAddOnByIds(
      subscriptionId,
      addOnId,
      {
        effectiveDate: dto.effectiveDate
          ? new Date(dto.effectiveDate)
          : undefined,
      },
    );

    return plainToInstance(RemoveAddOnResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }
}
