/** Used by `Education.test.ts` — `jest.mock('@prisma/client')` returns this from `new PrismaClient()`. */
export const educationModelPrismaMock = {
    education: {
        create: jest.fn(),
        update: jest.fn(),
    },
};
