import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1768134034598 implements MigrationInterface {
  name = 'Migration1768134034598';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "PlanChangeRequest" DROP CONSTRAINT "FK_plan_change_request_subscription"`,
    );
    await queryRunner.query(
      `ALTER TABLE "PlanChangeRequest" DROP CONSTRAINT "FK_plan_change_request_old_plan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "PlanChangeRequest" DROP CONSTRAINT "FK_plan_change_request_new_plan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "PlanChangeRequest" DROP CONSTRAINT "FK_plan_change_request_invoice"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_plan_change_request_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_plan_change_request_subscription"`,
    );
    await queryRunner.query(`ALTER TABLE "Plan" DROP COLUMN "allowedAddOns"`);
    await queryRunner.query(
      `ALTER TABLE "Plan" DROP COLUMN "includedUsageQuotas"`,
    );
    await queryRunner.query(`ALTER TABLE "Plan" DROP COLUMN "features"`);
    await queryRunner.query(`ALTER TABLE "Plan" DROP COLUMN "metadata"`);
    await queryRunner.query(`ALTER TABLE "Plan" DROP COLUMN "taxCategoryId"`);
    await queryRunner.query(
      `ALTER TABLE "Subscription" DROP COLUMN "currentPeriodStart"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" DROP COLUMN "currentPeriodEnd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" DROP COLUMN "canceledAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" DROP COLUMN "cancelAtPeriodEnd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" DROP COLUMN "trialEndsAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" DROP COLUMN "billingAddress"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" DROP COLUMN "metadata"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" DROP COLUMN "taxRegionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Plan" ADD "taxCategoryId" character varying(255)`,
    );
    await queryRunner.query(`ALTER TABLE "Plan" ADD "allowedAddOns" json`);
    await queryRunner.query(
      `ALTER TABLE "Plan" ADD "includedUsageQuotas" json`,
    );
    await queryRunner.query(`ALTER TABLE "Plan" ADD "features" json`);
    await queryRunner.query(`ALTER TABLE "Plan" ADD "metadata" json`);
    await queryRunner.query(
      `ALTER TABLE "Subscription" ADD "currentPeriodStart" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" ADD "currentPeriodEnd" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" ADD "canceledAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" ADD "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" ADD "trialEndsAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" ADD "billingAddress" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" ADD "taxRegionId" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "Subscription" ADD "metadata" json`);
    await queryRunner.query(
      `ALTER TABLE "PlanChangeRequest" ADD CONSTRAINT "FK_2a6892272664808bbed46426175" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "PlanChangeRequest" ADD CONSTRAINT "FK_e925dc5232f4f10aa5885ee74bc" FOREIGN KEY ("oldPlanId") REFERENCES "Plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "PlanChangeRequest" ADD CONSTRAINT "FK_32ff3ec06cc928ea339015556b1" FOREIGN KEY ("newPlanId") REFERENCES "Plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "PlanChangeRequest" ADD CONSTRAINT "FK_da3d86bbd07986e9806183cc906" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "PlanChangeRequest" DROP CONSTRAINT "FK_da3d86bbd07986e9806183cc906"`,
    );
    await queryRunner.query(
      `ALTER TABLE "PlanChangeRequest" DROP CONSTRAINT "FK_32ff3ec06cc928ea339015556b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "PlanChangeRequest" DROP CONSTRAINT "FK_e925dc5232f4f10aa5885ee74bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "PlanChangeRequest" DROP CONSTRAINT "FK_2a6892272664808bbed46426175"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" DROP COLUMN "metadata"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" DROP COLUMN "taxRegionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" DROP COLUMN "billingAddress"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" DROP COLUMN "trialEndsAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" DROP COLUMN "cancelAtPeriodEnd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" DROP COLUMN "canceledAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" DROP COLUMN "currentPeriodEnd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" DROP COLUMN "currentPeriodStart"`,
    );
    await queryRunner.query(`ALTER TABLE "Plan" DROP COLUMN "metadata"`);
    await queryRunner.query(`ALTER TABLE "Plan" DROP COLUMN "features"`);
    await queryRunner.query(
      `ALTER TABLE "Plan" DROP COLUMN "includedUsageQuotas"`,
    );
    await queryRunner.query(`ALTER TABLE "Plan" DROP COLUMN "allowedAddOns"`);
    await queryRunner.query(`ALTER TABLE "Plan" DROP COLUMN "taxCategoryId"`);
    await queryRunner.query(
      `ALTER TABLE "Subscription" ADD "taxRegionId" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "Subscription" ADD "metadata" json`);
    await queryRunner.query(
      `ALTER TABLE "Subscription" ADD "billingAddress" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" ADD "trialEndsAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" ADD "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" ADD "canceledAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" ADD "currentPeriodEnd" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "Subscription" ADD "currentPeriodStart" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Plan" ADD "taxCategoryId" character varying(255)`,
    );
    await queryRunner.query(`ALTER TABLE "Plan" ADD "metadata" json`);
    await queryRunner.query(`ALTER TABLE "Plan" ADD "features" json`);
    await queryRunner.query(
      `ALTER TABLE "Plan" ADD "includedUsageQuotas" json`,
    );
    await queryRunner.query(`ALTER TABLE "Plan" ADD "allowedAddOns" json`);
    await queryRunner.query(
      `CREATE INDEX "IDX_plan_change_request_subscription" ON "PlanChangeRequest" ("subscriptionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_plan_change_request_status" ON "PlanChangeRequest" ("status") `,
    );
    await queryRunner.query(
      `ALTER TABLE "PlanChangeRequest" ADD CONSTRAINT "FK_plan_change_request_invoice" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "PlanChangeRequest" ADD CONSTRAINT "FK_plan_change_request_new_plan" FOREIGN KEY ("newPlanId") REFERENCES "Plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "PlanChangeRequest" ADD CONSTRAINT "FK_plan_change_request_old_plan" FOREIGN KEY ("oldPlanId") REFERENCES "Plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "PlanChangeRequest" ADD CONSTRAINT "FK_plan_change_request_subscription" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
