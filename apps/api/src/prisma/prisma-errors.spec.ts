import { Prisma } from '../generated/prisma/client.js';
import { isUniqueViolationOn } from './prisma-errors.js';

const prismaError = (code: string, cause?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError('erro', {
    code,
    clientVersion: Prisma.prismaVersion.client,
    meta: cause && { driverAdapterError: { cause } },
  });

describe('isUniqueViolationOn', () => {
  it('reconhece o campo pelo nome do índice', () => {
    const error = prismaError('P2002', {
      table: 'users',
      constraint: { index: 'users_email_key' },
    });

    expect(isUniqueViolationOn(error, 'email')).toBe(true);
    expect(isUniqueViolationOn(error, 'username')).toBe(false);
  });

  it('reconhece o campo pela lista de fields', () => {
    const error = prismaError('P2002', {
      constraint: { fields: ['email'] },
    });

    expect(isUniqueViolationOn(error, 'email')).toBe(true);
    expect(isUniqueViolationOn(error, 'username')).toBe(false);
  });

  it('retorna false sem informação da constraint', () => {
    expect(isUniqueViolationOn(prismaError('P2002'), 'email')).toBe(false);
  });

  it('retorna false para outros erros', () => {
    expect(isUniqueViolationOn(prismaError('P2025'), 'email')).toBe(false);
    expect(isUniqueViolationOn(new Error('x'), 'email')).toBe(false);
  });
});
