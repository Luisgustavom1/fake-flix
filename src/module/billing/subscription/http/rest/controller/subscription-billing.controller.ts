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
import { ChangePlanUseCase } from '@billingModule/subscription/core/use-case/change-plan.use-case';
import { AddAddOnUseCase } from '@billingModule/subscription/core/use-case/add-add-on.use-case';
import { RemoveAddOnUseCase } from '@billingModule/subscription/core/use-case/remove-add-on.use-case';
import { CancelSubscriptionUseCase } from '@billingModule/subscription/core/use-case/cancel-subscription.use-case';
import { ActivateSubscriptionUseCase } from '@billingModule/subscription/core/use-case/activate-subscription.use-case';
import { ChangePlanRequestDto } from '@billingModule/subscription/http/rest/dto/request/change-plan-request.dto';
import { AddSubscriptionAddOnRequestDto } from '@billingModule/subscription/http/rest/dto/request/add-subscription-add-on-request.dto';
import { RemoveAddOnRequestDto } from '@billingModule/subscription/http/rest/dto/request/remove-add-on-request.dto';
import { ChangePlanResponseDto } from '@billingModule/subscription/http/rest/dto/response/change-plan-response.dto';
import {
  ChangePlanAsyncResponseDto,
  PlanChangeStatusResponseDto,
} from '@billingModule/subscription/http/rest/dto/response/change-plan-async-response.dto';
import { AddAddOnResponseDto } from '@billingModule/subscription/http/rest/dto/response/add-add-on-response.dto';
import { RemoveAddOnResponseDto } from '@billingModule/subscription/http/rest/dto/response/remove-add-on-response.dto';
import { CancelSubscriptionResponseDto } from '@billingModule/subscription/http/rest/dto/response/cancel-subscription-response.dto';
import { ActivateSubscriptionResponseDto } from '@billingModule/subscription/http/rest/dto/response/activate-subscription-response.dto';

@Controller('subscription')
@UseGuards(AuthGuard)
export class SubscriptionBillingController {
  constructor(
    private readonly subscriptionBillingService: SubscriptionBillingService, // ⚠️ Deprecated - kept for backward compatibility
    private readonly subscriptionPlanChangeService: SubscriptionPlanChangeService,
    private readonly changePlanUseCase: ChangePlanUseCase,
    private readonly addAddOnUseCase: AddAddOnUseCase,
    private readonly removeAddOnUseCase: RemoveAddOnUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private readonly activateSubscriptionUseCase: ActivateSubscriptionUseCase,
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
   * Uses ChangePlanUseCase (Rich Domain Model) pattern.
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
  }

  /**
   * Add add-on to subscription
   *
   * Uses AddAddOnUseCase (Rich Domain Model) pattern.
   *
   * @param subscriptionId - Subscription ID
   * @param dto - Add add-on request
   * @returns Add-on details
   */
  @Post(':id/add-ons')
  @HttpCode(201)
  async addAddOn(
    @Param('id') subscriptionId: string,
    @Body() dto: AddSubscriptionAddOnRequestDto,
  ): Promise<AddAddOnResponseDto> {
    // TODO: Get userId from request context/auth token
    const userId = dto.userId || 'current-user-id';

    const result = await this.addAddOnUseCase.execute({
      userId,
      subscriptionId,
      addOnId: dto.addOnId,
      quantity: dto.quantity,
    });

    return AddAddOnResponseDto.from(result);
  }

  /**
   * Remove add-on from subscription
   *
   * Uses RemoveAddOnUseCase (Rich Domain Model) pattern.
   *
   * @param subscriptionId - Subscription ID
   * @param addOnId - Add-on ID to remove
   * @param dto - Remove options
   * @returns Removal confirmation
   */
  @Delete(':id/add-ons/:addOnId')
  @HttpCode(200)
  async removeAddOn(
    @Param('id') subscriptionId: string,
    @Param('addOnId') addOnId: string,
    @Body() dto: RemoveAddOnRequestDto,
  ): Promise<RemoveAddOnResponseDto> {
    // TODO: Get userId from request context/auth token
    const userId = dto.userId || 'current-user-id';

    const result = await this.removeAddOnUseCase.execute({
      userId,
      subscriptionId,
      addOnId,
    });

    return plainToInstance(RemoveAddOnResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Cancel subscription
   *
   * Uses CancelSubscriptionUseCase (Rich Domain Model) pattern.
   *
   * @param subscriptionId - Subscription ID
   * @param dto - Cancellation options
   * @returns Cancellation confirmation
   */
  @Delete(':id')
  @HttpCode(200)
  async cancelSubscription(
    @Param('id') subscriptionId: string,
    @Body() dto: { userId?: string; reason?: string },
  ): Promise<CancelSubscriptionResponseDto> {
    // TODO: Get userId from request context/auth token
    const userId = dto.userId || 'current-user-id';

    const result = await this.cancelSubscriptionUseCase.execute({
      userId,
      subscriptionId,
      reason: dto.reason,
    });

    return CancelSubscriptionResponseDto.from(result);
  }

  /**
   * Activate subscription
   *
   * Uses ActivateSubscriptionUseCase (Rich Domain Model) pattern.
   *
   * @param subscriptionId - Subscription ID
   * @returns Activation confirmation
   */
  @Post(':id/activate')
  @HttpCode(200)
  async activateSubscription(
    @Param('id') subscriptionId: string,
    @Body() dto: { userId?: string },
  ): Promise<ActivateSubscriptionResponseDto> {
    // TODO: Get userId from request context/auth token
    const userId = dto.userId || 'current-user-id';

    const result = await this.activateSubscriptionUseCase.execute({
      userId,
      subscriptionId,
    });

    return ActivateSubscriptionResponseDto.from(result);
  }
}
