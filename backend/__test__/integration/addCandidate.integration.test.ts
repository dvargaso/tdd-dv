/**
 * addCandidate — integration tests (mocked Prisma).
 * Mirrors add_candidate_test_plan.md: S-01…S-14 / TC-01…TC-14.
 * Each it: Given / When / Then per backend-integration-tests rule.
 */

jest.mock('@prisma/client', () => {
    const actual = jest.requireActual('@prisma/client') as typeof import('@prisma/client');
    const { prismaMock } = require('./prismaMockInstance') as typeof import('./prismaMockInstance');
    return {
        ...actual,
        PrismaClient: jest.fn(() => prismaMock),
    };
});

import { addCandidate } from '../../src/application/services/candidateService';
import { prismaMock } from './prismaMockInstance';

const minimalValidPayload = () => ({
    firstName: 'Ana',
    lastName: 'López',
    email: 'ana.lopez@example.com',
});

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

describe('addCandidate (integration, mocked Prisma)', () => {
    describe('S-01 TC-01 — minimal create', () => {
        it('resolves with saved candidate and does not persist education, work, or resume', async () => {
            // Given: valid minimal payload (plan S-01) and candidate.create succeeds
            const saved = {
                id: 1,
                firstName: 'Ana',
                lastName: 'López',
                email: 'ana.lopez@example.com',
                phone: null,
                address: null,
            };
            prismaMock.candidate.create.mockResolvedValue(saved as never);

            // When
            const result = await addCandidate(minimalValidPayload());

            // Then
            expect(result).toEqual(saved);
            expect(prismaMock.candidate.create).toHaveBeenCalledTimes(1);
            expect(prismaMock.candidate.create.mock.calls[0][0]).toMatchObject({
                data: expect.objectContaining({
                    firstName: 'Ana',
                    lastName: 'López',
                    email: 'ana.lopez@example.com',
                }),
            });
            expect(prismaMock.education.create).not.toHaveBeenCalled();
            expect(prismaMock.workExperience.create).not.toHaveBeenCalled();
            expect(prismaMock.resume.create).not.toHaveBeenCalled();
        });
    });

    describe('S-02 TC-02 — optional phone and address', () => {
        it('passes phone and address into candidate.create data', async () => {
            // Given
            const saved = {
                id: 2,
                firstName: 'Ana',
                lastName: 'López',
                email: 'ana.lopez@example.com',
                phone: '612345678',
                address: 'Calle Mayor 1',
            };
            prismaMock.candidate.create.mockResolvedValue(saved as never);
            const payload = {
                ...minimalValidPayload(),
                phone: '612345678',
                address: 'Calle Mayor 1',
            };

            // When
            const result = await addCandidate(payload);

            // Then
            expect(result).toEqual(saved);
            expect(prismaMock.candidate.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    phone: '612345678',
                    address: 'Calle Mayor 1',
                }),
            });
        });
    });

    describe('S-03 TC-03 — one education', () => {
        it('creates candidate then education with candidateId from first save', async () => {
            // Given
            const savedCandidate = {
                id: 42,
                firstName: 'Ana',
                lastName: 'López',
                email: 'ana.lopez@example.com',
                phone: null,
                address: null,
            };
            prismaMock.candidate.create.mockResolvedValue(savedCandidate as never);
            prismaMock.education.create.mockResolvedValue({ id: 1, candidateId: 42 } as never);

            const payload = {
                ...minimalValidPayload(),
                educations: [
                    {
                        institution: 'Universidad X',
                        title: 'Grado',
                        startDate: '2018-09-01',
                        endDate: '2022-06-30',
                    },
                ],
            };

            // When
            const result = await addCandidate(payload);

            // Then
            expect(result).toEqual(savedCandidate);
            expect(prismaMock.education.create).toHaveBeenCalledTimes(1);
            const eduArg = prismaMock.education.create.mock.calls[0][0].data;
            expect(eduArg.candidateId).toBe(42);
            expect(eduArg.institution).toBe('Universidad X');
            expect(eduArg.title).toBe('Grado');
            expect(eduArg.startDate).toBeInstanceOf(Date);
            expect(eduArg.endDate).toBeInstanceOf(Date);
        });
    });

    describe('S-04 TC-04 — multiple educations', () => {
        it('invokes education.create twice with same candidateId', async () => {
            // Given
            prismaMock.candidate.create.mockResolvedValue({
                id: 7,
                firstName: 'Ana',
                lastName: 'López',
                email: 'ana.lopez@example.com',
                phone: null,
                address: null,
            } as never);
            prismaMock.education.create.mockResolvedValue({ id: 1 } as never);

            const payload = {
                ...minimalValidPayload(),
                educations: [
                    {
                        institution: 'Uni A',
                        title: 'Title A',
                        startDate: '2018-09-01',
                        endDate: '2020-06-01',
                    },
                    {
                        institution: 'Uni B',
                        title: 'Title B',
                        startDate: '2020-09-01',
                        endDate: '2022-06-01',
                    },
                ],
            };

            // When
            await addCandidate(payload);

            // Then
            expect(prismaMock.education.create).toHaveBeenCalledTimes(2);
            expect(prismaMock.education.create.mock.calls[0][0].data.candidateId).toBe(7);
            expect(prismaMock.education.create.mock.calls[1][0].data.candidateId).toBe(7);
            expect(prismaMock.education.create.mock.calls[0][0].data.institution).toBe('Uni A');
            expect(prismaMock.education.create.mock.calls[1][0].data.institution).toBe('Uni B');
        });
    });

    describe('S-05 TC-05 — one work experience', () => {
        it('invokes workExperience.create once with candidateId', async () => {
            // Given
            prismaMock.candidate.create.mockResolvedValue({
                id: 3,
                firstName: 'Ana',
                lastName: 'López',
                email: 'ana.lopez@example.com',
                phone: null,
                address: null,
            } as never);
            prismaMock.workExperience.create.mockResolvedValue({ id: 1 } as never);

            const payload = {
                ...minimalValidPayload(),
                workExperiences: [
                    {
                        company: 'Acme',
                        position: 'Dev',
                        startDate: '2021-01-01',
                        endDate: '2023-01-01',
                    },
                ],
            };

            // When
            await addCandidate(payload);

            // Then
            expect(prismaMock.workExperience.create).toHaveBeenCalledTimes(1);
            const wx = prismaMock.workExperience.create.mock.calls[0][0].data;
            expect(wx.candidateId).toBe(3);
            expect(wx.company).toBe('Acme');
            expect(wx.position).toBe('Dev');
        });
    });

    describe('S-06 TC-06 — multiple work experiences', () => {
        it('invokes workExperience.create twice with same candidateId', async () => {
            // Given
            prismaMock.candidate.create.mockResolvedValue({
                id: 9,
                firstName: 'Ana',
                lastName: 'López',
                email: 'ana.lopez@example.com',
                phone: null,
                address: null,
            } as never);
            prismaMock.workExperience.create.mockResolvedValue({ id: 1 } as never);

            const payload = {
                ...minimalValidPayload(),
                workExperiences: [
                    {
                        company: 'A',
                        position: 'P1',
                        startDate: '2020-01-01',
                    },
                    {
                        company: 'B',
                        position: 'P2',
                        startDate: '2022-01-01',
                    },
                ],
            };

            // When
            await addCandidate(payload);

            // Then
            expect(prismaMock.workExperience.create).toHaveBeenCalledTimes(2);
            expect(prismaMock.workExperience.create.mock.calls[0][0].data.candidateId).toBe(9);
            expect(prismaMock.workExperience.create.mock.calls[1][0].data.candidateId).toBe(9);
        });
    });

    describe('S-07 TC-07 — resume with cv', () => {
        it('invokes resume.create with candidateId and cv fields', async () => {
            // Given
            prismaMock.candidate.create.mockResolvedValue({
                id: 5,
                firstName: 'Ana',
                lastName: 'López',
                email: 'ana.lopez@example.com',
                phone: null,
                address: null,
            } as never);
            prismaMock.resume.create.mockResolvedValue({
                id: 1,
                candidateId: 5,
                filePath: '/uploads/1-cv.pdf',
                fileType: 'application/pdf',
                uploadDate: new Date(),
            } as never);

            const payload = {
                ...minimalValidPayload(),
                cv: { filePath: '/uploads/1-cv.pdf', fileType: 'application/pdf' },
            };

            // When
            await addCandidate(payload);

            // Then
            expect(prismaMock.resume.create).toHaveBeenCalledTimes(1);
            const data = prismaMock.resume.create.mock.calls[0][0].data;
            expect(data.candidateId).toBe(5);
            expect(data.filePath).toBe('/uploads/1-cv.pdf');
            expect(data.fileType).toBe('application/pdf');
            expect(data.uploadDate).toBeInstanceOf(Date);
        });
    });

    describe('S-08 TC-08 — no resume when cv absent or empty', () => {
        it.each([
            ['no cv key', () => ({ ...minimalValidPayload() })],
            [
                'empty cv object',
                () => ({
                    ...minimalValidPayload(),
                    cv: {} as Record<string, never>,
                }),
            ],
        ])('%s', async (_label, buildPayload) => {
            // Given
            prismaMock.candidate.create.mockResolvedValue({
                id: 1,
                ...minimalValidPayload(),
                phone: null,
                address: null,
            } as never);

            // When
            await addCandidate(buildPayload());

            // Then
            expect(prismaMock.resume.create).not.toHaveBeenCalled();
        });
    });

    describe('S-09 TC-09 — invalid email', () => {
        it('throws before candidate.create; message contains Invalid email', async () => {
            // Given
            const payload = { ...minimalValidPayload(), email: 'not-an-email' };

            // When / Then
            await expect(addCandidate(payload)).rejects.toThrow(/Invalid email/);
            expect(prismaMock.candidate.create).not.toHaveBeenCalled();
        });
    });

    describe('S-10 TC-10 — invalid education', () => {
        it('throws before candidate.create', async () => {
            // Given: valid core, invalid education startDate
            const payload = {
                ...minimalValidPayload(),
                educations: [
                    {
                        institution: 'Universidad X',
                        title: 'Grado',
                        startDate: 'not-a-date',
                    },
                ],
            };

            // When / Then
            await expect(addCandidate(payload)).rejects.toThrow(/Invalid date/);
            expect(prismaMock.candidate.create).not.toHaveBeenCalled();
        });
    });

    describe('S-11 TC-11 — invalid work experience', () => {
        it('throws before candidate.create when no educations', async () => {
            // Given: valid core, no educations, invalid work (missing company)
            const payload = {
                ...minimalValidPayload(),
                workExperiences: [
                    {
                        position: 'Dev',
                        startDate: '2021-01-01',
                    },
                ],
            };

            // When / Then
            await expect(addCandidate(payload)).rejects.toThrow(/Invalid company/);
            expect(prismaMock.candidate.create).not.toHaveBeenCalled();
        });
    });

    describe('S-12 TC-12 — invalid cv', () => {
        it('throws before candidate.create for non-empty invalid cv', async () => {
            // Given
            const payload = {
                ...minimalValidPayload(),
                cv: { filePath: '/x' },
            };

            // When / Then
            await expect(addCandidate(payload)).rejects.toThrow(/Invalid CV data/);
            expect(prismaMock.candidate.create).not.toHaveBeenCalled();
        });
    });

    describe('S-13 TC-13 — duplicate email P2002', () => {
        it('maps P2002 to friendly message', async () => {
            // Given
            const err = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
            prismaMock.candidate.create.mockRejectedValue(err);

            // When / Then
            await expect(addCandidate(minimalValidPayload())).rejects.toThrow(
                'The email already exists in the database',
            );
        });
    });

    describe('S-14 TC-14 — payload with id (update, no children)', () => {
        it('uses candidate.update, not create, and skips nested writes when absent', async () => {
            // Given
            const updated = {
                id: 100,
                firstName: 'Updated',
                lastName: 'Name',
                email: 'ana.lopez@example.com',
                phone: null,
                address: null,
            };
            prismaMock.candidate.update.mockResolvedValue(updated as never);

            const payload = {
                id: 100,
                firstName: 'Updated',
                lastName: 'Name',
                email: 'ana.lopez@example.com',
            };

            // When
            const result = await addCandidate(payload);

            // Then
            expect(result).toEqual(updated);
            expect(prismaMock.candidate.update).toHaveBeenCalledWith({
                where: { id: 100 },
                data: expect.objectContaining({
                    firstName: 'Updated',
                    lastName: 'Name',
                    email: 'ana.lopez@example.com',
                }),
            });
            expect(prismaMock.candidate.create).not.toHaveBeenCalled();
            expect(prismaMock.education.create).not.toHaveBeenCalled();
            expect(prismaMock.workExperience.create).not.toHaveBeenCalled();
            expect(prismaMock.resume.create).not.toHaveBeenCalled();
        });
    });
});
