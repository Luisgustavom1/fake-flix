import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserManagementService } from './core/service/user-management.service';
import { AuthResolver } from './http/graphql/auth.resolver';
import { UserResolver } from './http/graphql/user.resolver';
import { UserRepository } from './persistence/repository/user.repository';
import {
  AuthService,
  jwtConstants,
} from '@identityModule/core/service/authentication.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { DomainModuleIntegration } from '@sharedModule/integration/interface/domain-module-integration';
import { BillingSubscriptionApi } from '@sharedModule/integration/interface/billing-integration.interface';
import { BillingSubscriptionProvider } from '@billingModule/core/integration/provider/billing-subscription-status.provider';
import { IdentityPersistenceModule } from './persistence/identity-persistence.module';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60m' },
    }),
    IdentityPersistenceModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      driver: ApolloDriver,
    }),
    DomainModuleIntegration,
  ],
  providers: [
    AuthService,
    AuthResolver,
    UserResolver,
    UserManagementService,
    UserRepository,
    {
      provide: BillingSubscriptionApi,
      useExisting: BillingSubscriptionProvider,
    },
  ],
})
export class IdentityModule {}
