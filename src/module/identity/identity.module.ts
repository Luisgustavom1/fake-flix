import { Module } from '@nestjs/common';
import { UserManagementService } from './core/service/user-management.service';
import { AuthResolver } from './http/graphql/auth.resolver';
import { UserResolver } from './http/graphql/user.resolver';
import { UserRepository } from './persistence/repository/user.repository';
import { AuthService } from '@identityModule/core/service/authentication.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DomainModuleIntegration } from '@sharedModule/integration/domain-module.integration';
import { BillingSubscriptionApi } from '@sharedModule/integration/interface/billing-integration.interface';
import { IdentityPersistenceModule } from './persistence/identity-persistence.module';
import { BillingSubscriptionHttpClient } from '@sharedModule/integration/client/billing-subscription-http.client';
import { AuthModule } from '@sharedModule/auth/auth.module';

@Module({
  imports: [
    IdentityPersistenceModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      driver: ApolloDriver,
    }),
    DomainModuleIntegration,
    AuthModule,
  ],
  providers: [
    AuthService,
    AuthResolver,
    UserResolver,
    UserManagementService,
    UserRepository,
    {
      provide: BillingSubscriptionApi,
      useExisting: BillingSubscriptionHttpClient,
    },
  ],
})
export class IdentityModule {}
