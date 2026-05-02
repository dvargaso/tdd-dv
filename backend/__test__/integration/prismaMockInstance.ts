/** Shared Prisma client mock — `jest.mock('@prisma/client')` returns this instance for every `new PrismaClient()`. */
export const prismaMock = {
    candidate: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
    },
    education: {
        create: jest.fn(),
        update: jest.fn(),
    },
    workExperience: {
        create: jest.fn(),
        update: jest.fn(),
    },
    resume: {
        create: jest.fn(),
    },
};
