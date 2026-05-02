/** Prisma client shape used by `Candidate.ts` — `jest.mock('@prisma/client')` returns this from `new PrismaClient()`. */
export const candidateModelPrismaMock = {
    candidate: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
    },
};
