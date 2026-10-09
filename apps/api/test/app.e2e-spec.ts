import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { Prisma } from '../src/generated/prisma/client.js';

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  const prisma = {
    user: {
      create: vi.fn<(args: Prisma.UserCreateArgs) => Promise<unknown>>(),
    },
  };

  const validUser = {
    name: 'Foo',
    email: 'foo@example.com',
    password: 'Senha@123',
  };

  beforeEach(async () => {
    prisma.user.create.mockReset();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/users (POST) cadastra usuário com email normalizado e senha com hash', async () => {
    prisma.user.create.mockResolvedValue({ id: '1', name: 'Foo' });

    await request(app.getHttpServer())
      .post('/users')
      .send({ ...validUser, name: '  Foo  ', email: '  Foo@Example.COM ' })
      .expect(201)
      .expect({ id: '1', name: 'Foo' });

    const { data } = prisma.user.create.mock.calls[0][0];
    expect(data.name).toBe('Foo');
    expect(data.email).toBe('foo@example.com');
    expect(data.password).not.toBe(validUser.password);
    expect(data.password).toMatch(/^\$2[aby]\$/);
  });

  const uniqueViolation = (index: string) =>
    new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: Prisma.prismaVersion.client,
      meta: {
        modelName: 'User',
        driverAdapterError: {
          name: 'DriverAdapterError',
          cause: {
            kind: 'UniqueConstraintViolation',
            constraint: { index },
            table: 'users',
          },
        },
      },
    });

  it('/users (POST) retorna 409 para email já cadastrado', () => {
    prisma.user.create.mockRejectedValue(uniqueViolation('users_email_key'));

    return request(app.getHttpServer())
      .post('/users')
      .send(validUser)
      .expect(409);
  });

  it('/users (POST) não trata violação de outro campo único como email', () => {
    prisma.user.create.mockRejectedValue(uniqueViolation('users_username_key'));

    return request(app.getHttpServer())
      .post('/users')
      .send(validUser)
      .expect(500);
  });

  it('/users (POST) rejeita payload inválido', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Foo', email: 'invalido', password: 'fraca' })
      .expect(400);
  });

  it('/users (POST) rejeita nome só com espaços', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ ...validUser, name: '   ' })
      .expect(400);
  });

  it('/users (POST) rejeita senha acima de 72 bytes', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ ...validUser, password: 'Aa1@' + 'é'.repeat(35) })
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
