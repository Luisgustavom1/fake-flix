import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { IdentityModule } from '@identityModule/identity.module';
import { createNestApp } from '@testInfra/test-e2e.setup';
import { testDbClient } from '@testInfra/knex.database';
import { Tables } from '@testInfra/enum/tables.enum';
import * as nock from 'nock';
import { userFactory } from '@identityModule/__test__/factory/user.factory';
// eslint-disable-next-line import/no-restricted-paths
import { subscriptionFactory } from '@billingModule/__test__/factory/subscription.factory';
// eslint-disable-next-line import/no-restricted-paths
import { planFactory } from '@billingModule/__test__/factory/plan.factory';
// eslint-disable-next-line import/no-restricted-paths
import { SubscriptionStatus } from '@billingModule/subscription/core/enum/subscription-status.enum';

describe('AuthResolver (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([IdentityModule]);
    app = nestTestSetup.app;
    module = nestTestSetup.module;
  });

  beforeEach(async () => {
    await testDbClient(Tables.User).del();
    await testDbClient(Tables.Subscription).del();
    await testDbClient(Tables.Plan).del();
  });

  afterAll(async () => {
    await testDbClient(Tables.User).del();
    await testDbClient(Tables.Subscription).del();
    await testDbClient(Tables.Plan).del();
    await module.close();
  });

  describe('signIn mutation', () => {
    it('returns the authenticated user - USING HTTP for module to module calls', async () => {
      const signInInput = {
        email: 'johndoe@example.com',
        password: 'password123',
      };
      const user = userFactory.build({
        firstName: 'John',
        lastName: 'Doe',
        email: signInInput.email,
      });
      await testDbClient(Tables.User).insert(user);
      nock('https://localhost:3000', {
        encodedQueryParams: true,
      })
        .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
        .get(`/subscription/user/${user.id}/active`)
        .reply(200, {
          isActive: true,
        });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              signIn(SignInInput: {
                email: "${signInInput.email}",
                password: "${signInInput.password}"
              }) {
                accessToken
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.signIn.accessToken).toBeDefined();
    });

    it('returns unauthorized if the user does not exist', async () => {
      const signInInput = {
        email: 'johndoe@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              signIn(SignInInput: {
                email: "${signInInput.email}",
                password: "${signInInput.password}"
              }) {
                accessToken
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors[0].message).toEqual(
        'Cannot authorize user: johndoe@example.com',
      );
    });

    it('returns unauthorized if the subscription is not active', async () => {
      const signInInput = {
        email: 'johndoe@example.com',
        password: 'password123',
      };

      const user = userFactory.build({
        firstName: 'John',
        lastName: 'Doe',
        email: signInInput.email,
      });
      await testDbClient(Tables.User).insert(user);
      const plan = planFactory.build();
      const subscription = subscriptionFactory.build({
        planId: plan.id,
        status: SubscriptionStatus.Active,
        userId: user.id,
      });
      await testDbClient(Tables.Plan).insert(plan);
      await testDbClient(Tables.Subscription).insert(subscription);

      nock('https://localhost:3000', {
        encodedQueryParams: true,
      })
        .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
        .get(`/subscription/user/${user.id}/active`)
        .reply(200, {
          isActive: false,
        });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              signIn(SignInInput: {
                email: "${signInInput.email}",
                password: "${signInInput.password}"
              }) {
                accessToken
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors[0].message).toEqual(
        'User johndoe@example.com does not have an active subscription.',
      );
    });
  });

  describe('getProfile query', () => {
    //Used in examples about module to module calls, its skiped because the default is to use local calls
    it('returns the authenticated user - USING HTTP for module to module calls', async () => {
      const signInInput = {
        email: 'johndoe@example.com',
        password: 'password123',
      };
      const user = userFactory.build({
        firstName: 'John',
        lastName: 'Doe',
        email: signInInput.email,
      });
      await testDbClient(Tables.User).insert(user);
      nock('https://localhost:3000', {
        encodedQueryParams: true,
      })
        .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
        .get(`/subscription/user/${user.id}/active`)
        .reply(200, {
          isActive: true,
        });

      const plan = planFactory.build();
      const subscription = subscriptionFactory.build({
        planId: plan.id,
        status: SubscriptionStatus.Active,
        userId: user.id,
      });
      await testDbClient(Tables.Plan).insert(plan);
      await testDbClient(Tables.Subscription).insert(subscription);

      const acessTokenResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              signIn(SignInInput: {
                email: "${signInInput.email}",
                password: "${signInInput.password}"
              }) {
                accessToken
              }
            }
          `,
        });
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set(
          'Authorization',
          `Bearer ${acessTokenResponse.body.data.signIn.accessToken}`,
        )
        .send({
          query: `
            query {
              getProfile {
                email
              }
            }
          `,
        });

      const { email } = response.body.data.getProfile;

      expect(email).toEqual(signInInput.email);
    });
    it('returns unauthorized for invalid tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer fake-token`)
        .send({
          query: `
            query {
              getProfile {
                email
              }
            }
          `,
        });

      expect(response.body.errors[0].message).toEqual('Unauthorized');
    });
  });
});
