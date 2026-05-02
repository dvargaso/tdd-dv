/** Used by `WorkExperience.test.ts` — `jest.mock('@prisma/client')` returns this from `new PrismaClient()`. */
export const workExperienceModelPrismaMock = {
    workExperience: {
        create: jest.fn(),
        update: jest.fn(),
    },
};
