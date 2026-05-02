/**
 * Candidate domain model — unit tests (CM-01..CM-11 per candidateModel_unit_test_plan.md).
 * Given: Prisma mock + instance. When: one constructor / save / findOne. Then: outcomes + Prisma args where specified.
 */

jest.mock('@prisma/client', () => {
    const actual = jest.requireActual('@prisma/client') as typeof import('@prisma/client');
    const { candidateModelPrismaMock } =
        require('./candidateModelPrismaMock') as typeof import('./candidateModelPrismaMock');
    return {
        ...actual,
        PrismaClient: jest.fn(() => candidateModelPrismaMock),
    };
});

import { Prisma } from '@prisma/client';
import { Candidate } from '../../../../src/domain/models/Candidate';
import { candidateModelPrismaMock as prismaMock } from './candidateModelPrismaMock';

const { create, update, findUnique } = prismaMock.candidate;

let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
    consoleLogSpy.mockRestore();
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Candidate', () => {
    describe('constructor', () => {
        it('CM-01 defaults related arrays when keys omitted', () => {
            // Given / When
            const c = new Candidate({
                firstName: 'Ana',
                lastName: 'Lopez',
                email: 'ana@example.com',
            });
            // Then
            expect(c.education).toEqual([]);
            expect(c.workExperience).toEqual([]);
            expect(c.resumes).toEqual([]);
        });
    });

    describe('save', () => {
        it('CM-02 create — minimal scalars, no nested keys', async () => {
            // Given
            const saved = { id: 1, firstName: 'Ana', lastName: 'Lopez', email: 'ana@example.com' };
            create.mockResolvedValue(saved);
            const c = new Candidate({
                firstName: 'Ana',
                lastName: 'Lopez',
                email: 'ana@example.com',
            });
            // When
            const result = await c.save();
            // Then
            expect(result).toEqual(saved);
            expect(create).toHaveBeenCalledTimes(1);
            expect(update).not.toHaveBeenCalled();
            expect(create.mock.calls[0][0]).toEqual({
                data: {
                    firstName: 'Ana',
                    lastName: 'Lopez',
                    email: 'ana@example.com',
                },
            });
            expect(create.mock.calls[0][0].data).not.toHaveProperty('phone');
            expect(create.mock.calls[0][0].data).not.toHaveProperty('address');
            expect(create.mock.calls[0][0].data).not.toHaveProperty('educations');
            expect(create.mock.calls[0][0].data).not.toHaveProperty('workExperiences');
            expect(create.mock.calls[0][0].data).not.toHaveProperty('resumes');
        });

        it('CM-03 create — nested educations, workExperiences, resumes', async () => {
            // Given
            const saved = { id: 2, firstName: 'Ana', lastName: 'Lopez', email: 'ana@example.com' };
            create.mockResolvedValue(saved);
            const c = new Candidate({
                firstName: 'Ana',
                lastName: 'Lopez',
                email: 'ana@example.com',
            });
            c.education.push({
                institution: 'Uni',
                title: 'BSc',
                startDate: new Date('2018-09-01'),
                endDate: undefined,
            } as never);
            c.workExperience.push({
                company: 'Acme',
                position: 'Dev',
                description: 'Build',
                startDate: new Date('2021-01-01'),
                endDate: undefined,
            } as never);
            c.resumes.push({
                filePath: '/uploads/cv.pdf',
                fileType: 'application/pdf',
            } as never);
            // When
            const result = await c.save();
            // Then
            expect(result).toEqual(saved);
            expect(create.mock.calls[0][0].data).toMatchObject({
                firstName: 'Ana',
                lastName: 'Lopez',
                email: 'ana@example.com',
                educations: {
                    create: [
                        {
                            institution: 'Uni',
                            title: 'BSc',
                            startDate: c.education[0].startDate,
                            endDate: undefined,
                        },
                    ],
                },
                workExperiences: {
                    create: [
                        {
                            company: 'Acme',
                            position: 'Dev',
                            description: 'Build',
                            startDate: c.workExperience[0].startDate,
                            endDate: undefined,
                        },
                    ],
                },
                resumes: {
                    create: [{ filePath: '/uploads/cv.pdf', fileType: 'application/pdf' }],
                },
            });
        });

        it('CM-04 update path, create not called', async () => {
            // Given
            const updated = { id: 5, firstName: 'Ana', lastName: 'Lopez', email: 'ana@example.com' };
            update.mockResolvedValue(updated);
            const c = new Candidate({
                id: 5,
                firstName: 'Ana',
                lastName: 'Lopez',
                email: 'ana@example.com',
            });
            // When
            const result = await c.save();
            // Then
            expect(result).toEqual(updated);
            expect(update).toHaveBeenCalledWith({
                where: { id: 5 },
                data: {
                    firstName: 'Ana',
                    lastName: 'Lopez',
                    email: 'ana@example.com',
                },
            });
            expect(create).not.toHaveBeenCalled();
        });

        it('CM-05 update — P2025 maps to Spanish not-found message', async () => {
            // Given
            const err = Object.assign(new Error('Record not found'), { code: 'P2025' });
            update.mockRejectedValue(err);
            const c = new Candidate({
                id: 5,
                firstName: 'Ana',
                lastName: 'Lopez',
                email: 'ana@example.com',
            });
            // When / Then
            await expect(c.save()).rejects.toThrow(
                'No se pudo encontrar el registro del candidato con el ID proporcionado.',
            );
        });

        it('CM-06 create — PrismaClientInitializationError maps to connection message', async () => {
            // Given
            const err = new Prisma.PrismaClientInitializationError('init fail', '5.0.0');
            create.mockRejectedValue(err);
            const c = new Candidate({
                firstName: 'Ana',
                lastName: 'Lopez',
                email: 'ana@example.com',
            });
            // When / Then
            await expect(c.save()).rejects.toThrow(
                'No se pudo conectar con la base de datos. Por favor, asegúrese de que el servidor de base de datos esté en ejecución.',
            );
        });

        it('CM-07 update — PrismaClientInitializationError maps to connection message', async () => {
            // Given
            const err = new Prisma.PrismaClientInitializationError('init fail', '5.0.0');
            update.mockRejectedValue(err);
            const c = new Candidate({
                id: 5,
                firstName: 'Ana',
                lastName: 'Lopez',
                email: 'ana@example.com',
            });
            // When / Then
            await expect(c.save()).rejects.toThrow(
                'No se pudo conectar con la base de datos. Por favor, asegúrese de que el servidor de base de datos esté en ejecución.',
            );
        });

        it('CM-08 create — other error rethrown', async () => {
            // Given
            const err = Object.assign(new Error('dup'), { code: 'P2002' });
            create.mockRejectedValue(err);
            const c = new Candidate({
                firstName: 'Ana',
                lastName: 'Lopez',
                email: 'ana@example.com',
            });
            // When / Then
            await expect(c.save()).rejects.toThrow('dup');
        });

        it('CM-09 update — other error rethrown', async () => {
            // Given
            update.mockRejectedValue(new Error('constraint'));
            const c = new Candidate({
                id: 5,
                firstName: 'Ana',
                lastName: 'Lopez',
                email: 'ana@example.com',
            });
            // When / Then
            await expect(c.save()).rejects.toThrow('constraint');
        });
    });

    describe('findOne', () => {
        it('CM-10 resolves null when not found', async () => {
            // Given
            findUnique.mockResolvedValue(null);
            // When
            const result = await Candidate.findOne(99);
            // Then
            expect(result).toBeNull();
            expect(findUnique).toHaveBeenCalledWith({ where: { id: 99 } });
        });

        it('CM-11 resolves Candidate when row exists', async () => {
            // Given
            const row = {
                id: 3,
                firstName: 'Bo',
                lastName: 'Kim',
                email: 'bo@example.com',
            };
            findUnique.mockResolvedValue(row);
            // When
            const result = await Candidate.findOne(3);
            // Then
            expect(result).toBeInstanceOf(Candidate);
            expect(result!.firstName).toBe('Bo');
            expect(result!.lastName).toBe('Kim');
            expect(result!.email).toBe('bo@example.com');
            expect(result!.id).toBe(3);
            expect(findUnique).toHaveBeenCalledWith({ where: { id: 3 } });
        });
    });
});
