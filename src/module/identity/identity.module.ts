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
import { PersistenceModule } from '@sharedModule/persistence/prisma/persistence.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { BillingSubscriptionRepository } from '@identityModule/persistence/repository/external/billing-subscription.repository';
import { DomainModuleIntegration } from '@sharedModule/integration/interface/domain-module-integration';
import { BillingSubscriptionStatusApiProvider } from '@sharedModule/integration/interface/billing-integration.interface';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60m' },
    }),
    PersistenceModule,
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
    BillingSubscriptionStatusApiProvider,
    BillingSubscriptionRepository,
  ],
})
export class IdentityModule {}
