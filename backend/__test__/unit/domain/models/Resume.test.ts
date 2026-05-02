/**
 * Resume domain model — unit tests (RES-01..RES-04 per educationWorkExperienceResume_unit_test_plan.md).
 */

jest.mock('@prisma/client', () => {
    const actual = jest.requireActual('@prisma/client') as typeof import('@prisma/client');
    const { resumeModelPrismaMock } =
        require('./resumeModelPrismaMock') as typeof import('./resumeModelPrismaMock');
    return {
        ...actual,
        PrismaClient: jest.fn(() => resumeModelPrismaMock),
    };
});

import { Resume } from '../../../../src/domain/models/Resume';
import { resumeModelPrismaMock as prismaMock } from './resumeModelPrismaMock';

const { create } = prismaMock.resume;

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

describe('Resume', () => {
    it('RES-01 save without id delegates to prisma.resume.create', async () => {
        // Given
        const createdRow = {
            id: 10,
            candidateId: 1,
            filePath: '/a.pdf',
            fileType: 'application/pdf',
            uploadDate: new Date('2026-01-15T12:00:00.000Z'),
        };
        create.mockResolvedValue(createdRow);
        const r = new Resume({
            candidateId: 1,
            filePath: '/a.pdf',
            fileType: 'application/pdf',
        });
        // When
        const result = await r.save();
        // Then
        expect(create).toHaveBeenCalledTimes(1);
        expect(create.mock.calls[0][0].data).toEqual({
            candidateId: 1,
            filePath: '/a.pdf',
            fileType: 'application/pdf',
            uploadDate: r.uploadDate,
        });
        expect(result).toBeInstanceOf(Resume);
        expect(result.id).toBe(10);
        expect(result.candidateId).toBe(1);
        expect(result.filePath).toBe('/a.pdf');
        expect(result.fileType).toBe('application/pdf');
    });

    it('RES-02 save with id forbids update', async () => {
        // Given
        const r = new Resume({
            id: 1,
            candidateId: 1,
            filePath: '/a.pdf',
            fileType: 'application/pdf',
        });
        // When / Then
        await expect(r.save()).rejects.toThrow(
            'No se permite la actualización de un currículum existente.',
        );
        expect(create).not.toHaveBeenCalled();
    });

    it('RES-03 create returns Resume wrapping prisma row', async () => {
        // Given
        const createdRow = {
            id: 11,
            candidateId: 2,
            filePath: '/b.pdf',
            fileType: 'application/pdf',
            uploadDate: new Date('2026-02-01T00:00:00.000Z'),
        };
        create.mockResolvedValue(createdRow);
        const r = new Resume({
            candidateId: 2,
            filePath: '/b.pdf',
            fileType: 'application/pdf',
        });
        // When — call `create()` directly (not via `save`) per plan
        const result = await r.create();
        // Then
        expect(result).toBeInstanceOf(Resume);
        expect(result.id).toBe(11);
        expect(result.candidateId).toBe(2);
        expect(result.filePath).toBe('/b.pdf');
        expect(result.fileType).toBe('application/pdf');
    });

    it('RES-04 create propagates prisma failure', async () => {
        // Given
        create.mockRejectedValue(new Error('db'));
        const r = new Resume({
            candidateId: 1,
            filePath: '/a.pdf',
            fileType: 'application/pdf',
        });
        // When / Then
        await expect(r.create()).rejects.toThrow('db');
    });
});
