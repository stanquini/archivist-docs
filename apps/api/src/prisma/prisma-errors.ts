import { Prisma } from '../generated/prisma/client.js';

// Código de erro do Prisma para violação de campo @unique
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

// Formato (não documentado) que o driver adapter preenche no meta do erro;
// com adapter, o Prisma 7 não preenche meta.target
type DriverAdapterErrorMeta = {
  driverAdapterError?: {
    cause?: {
      table?: string;
      constraint?: { index?: string; fields?: string[] };
    };
  };
};

/**
 * Indica se o erro é uma violação de @unique no campo informado (nome da
 * coluna). O Postgres informa só o nome do índice, então o campo é inferido
 * pela convenção padrão do Prisma: `{tabela}_{coluna}_key`.
 */
export function isUniqueViolationOn(error: unknown, field: string): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== UNIQUE_CONSTRAINT_VIOLATION
  ) {
    return false;
  }

  const cause = (error.meta as DriverAdapterErrorMeta | undefined)
    ?.driverAdapterError?.cause;
  const constraint = cause?.constraint;

  if (constraint?.fields) {
    return constraint.fields.includes(field);
  }
  return (
    cause?.table !== undefined &&
    constraint?.index === `${cause.table}_${field}_key`
  );
}
