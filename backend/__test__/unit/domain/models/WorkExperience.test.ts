/**
 * WorkExperience domain model — unit tests (WRK-01..WRK-05 per educationWorkExperienceResume_unit_test_plan.md).
 */

jest.mock('@prisma/client', () => {
    const actual = jest.requireActual('@prisma/client') as typeof import('@prisma/client');
    const { workExperienceModelPrismaMock } =
        require('./workExperienceModelPrismaMock') as typeof import('./workExperienceModelPrismaMock');
    return {
        ...actual,
        PrismaClient: jest.fn(() => workExperienceModelPrismaMock),
    };
});

import { WorkExperience } from '../../../../src/domain/models/WorkExperience';
import { workExperienceModelPrismaMock as prismaMock } from './workExperienceModelPrismaMock';

const { create, update } = prismaMock.workExperience;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('WorkExperience', () => {
    it('WRK-01 constructor omits endDate and description when absent', () => {
        // Given / When
        const w = new WorkExperience({
            company: 'Acme',
            position: 'Dev',
            startDate: '2021-01-01',
        });
        // Then
        expect(w.startDate).toBeInstanceOf(Date);
        expect(w.endDate).toBeUndefined();
        expect(w.description).toBeUndefined();
    });

    it('WRK-02 constructor sets endDate and description when provided', () => {
        // Given / When
        const w = new WorkExperience({
            company: 'Acme',
            position: 'Dev',
            startDate: '2021-01-01',
            endDate: '2023-12-31',
            description: 'Build things',
        });
        // Then
        expect(w.endDate).toBeInstanceOf(Date);
        expect(w.endDate!.toISOString().startsWith('2023-12-31')).toBe(true);
        expect(w.description).toBe('Build things');
    });

    it('WRK-03 save create without candidateId', async () => {
        // Given
        const row = {
            id: 1,
            company: 'Acme',
            position: 'Dev',
            startDate: new Date('2021-01-01'),
        };
        create.mockResolvedValue(row);
        const w = new WorkExperience({
            company: 'Acme',
            position: 'Dev',
            startDate: '2021-01-01',
        });
        // When
        const result = await w.save();
        // Then
        expect(result).toEqual(row);
        expect(create).toHaveBeenCalledTimes(1);
        expect(update).not.toHaveBeenCalled();
        const data = create.mock.calls[0][0].data;
        expect(data).toMatchObject({
            company: 'Acme',
            position: 'Dev',
            description: undefined,
            startDate: w.startDate,
            endDate: undefined,
        });
        expect(data).not.toHaveProperty('candidateId');
    });

    it('WRK-04 save create includes candidateId', async () => {
        // Given
        const row = {
            id: 2,
            company: 'Acme',
            position: 'Dev',
            startDate: new Date('2021-01-01'),
            candidateId: 9,
        };
        create.mockResolvedValue(row);
        const w = new WorkExperience({
            company: 'Acme',
            position: 'Dev',
            startDate: '2021-01-01',
            candidateId: 9,
        });
        // When
        await w.save();
        // Then
        expect(create.mock.calls[0][0].data).toMatchObject({
            company: 'Acme',
            position: 'Dev',
            description: undefined,
            startDate: w.startDate,
            endDate: undefined,
            candidateId: 9,
        });
    });

    it('WRK-05 save update path', async () => {
        // Given
        const updated = {
            id: 2,
            company: 'Acme',
            position: 'Lead',
            description: 'Lead team',
            startDate: new Date('2021-01-01'),
            endDate: new Date('2024-06-01'),
        };
        update.mockResolvedValue(updated);
        const w = new WorkExperience({
            id: 2,
            company: 'Acme',
            position: 'Lead',
            description: 'Lead team',
            startDate: '2021-01-01',
            endDate: '2024-06-01',
        });
        // When
        const result = await w.save();
        // Then
        expect(result).toEqual(updated);
        expect(update).toHaveBeenCalledWith({
            where: { id: 2 },
            data: {
                company: 'Acme',
                position: 'Lead',
                description: 'Lead team',
                startDate: w.startDate,
                endDate: w.endDate,
            },
        });
        expect(create).not.toHaveBeenCalled();
    });
});
