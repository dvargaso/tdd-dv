/** Used by `Resume.test.ts` — `jest.mock('@prisma/client')` returns this from `new PrismaClient()`. */
export const resumeModelPrismaMock = {
    resume: {
        create: jest.fn(),
    },
};
