/**
 * Education domain model — unit tests (EDU-01..EDU-05 per educationWorkExperienceResume_unit_test_plan.md).
 */

jest.mock('@prisma/client', () => {
    const actual = jest.requireActual('@prisma/client') as typeof import('@prisma/client');
    const { educationModelPrismaMock } =
        require('./educationModelPrismaMock') as typeof import('./educationModelPrismaMock');
    return {
        ...actual,
        PrismaClient: jest.fn(() => educationModelPrismaMock),
    };
});

import { Education } from '../../../../src/domain/models/Education';
import { educationModelPrismaMock as prismaMock } from './educationModelPrismaMock';

const { create, update } = prismaMock.education;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Education', () => {
    it('EDU-01 constructor omits endDate when data.endDate is falsy', () => {
        // Given / When
        const e = new Education({
            institution: 'Uni',
            title: 'BSc',
            startDate: '2020-01-01',
        });
        // Then
        expect(e.startDate).toBeInstanceOf(Date);
        expect(e.startDate.toISOString().startsWith('2020-01-01')).toBe(true);
        expect(e.endDate).toBeUndefined();
    });

    it('EDU-02 constructor sets endDate when provided', () => {
        // Given / When
        const e = new Education({
            institution: 'Uni',
            title: 'BSc',
            startDate: '2020-01-01',
            endDate: '2021-06-01',
        });
        // Then
        expect(e.endDate).toBeInstanceOf(Date);
        expect(e.endDate!.toISOString().startsWith('2021-06-01')).toBe(true);
    });

    it('EDU-03 save create without candidateId', async () => {
        // Given
        const row = { id: 1, institution: 'Uni', title: 'BSc', startDate: new Date('2020-01-01') };
        create.mockResolvedValue(row);
        const e = new Education({
            institution: 'Uni',
            title: 'BSc',
            startDate: '2020-01-01',
        });
        // When
        const result = await e.save();
        // Then
        expect(result).toEqual(row);
        expect(create).toHaveBeenCalledTimes(1);
        expect(update).not.toHaveBeenCalled();
        const data = create.mock.calls[0][0].data;
        expect(data).toMatchObject({
            institution: 'Uni',
            title: 'BSc',
            startDate: e.startDate,
            endDate: undefined,
        });
        expect(data).not.toHaveProperty('candidateId');
    });

    it('EDU-04 save create includes candidateId', async () => {
        // Given
        const row = { id: 2, institution: 'Uni', title: 'BSc', startDate: new Date('2020-01-01'), candidateId: 7 };
        create.mockResolvedValue(row);
        const e = new Education({
            institution: 'Uni',
            title: 'BSc',
            startDate: '2020-01-01',
            candidateId: 7,
        });
        // When
        await e.save();
        // Then
        expect(create.mock.calls[0][0].data).toMatchObject({
            institution: 'Uni',
            title: 'BSc',
            startDate: e.startDate,
            endDate: undefined,
            candidateId: 7,
        });
    });

    it('EDU-05 save update path', async () => {
        // Given
        const updated = {
            id: 4,
            institution: 'Uni',
            title: 'MSc',
            startDate: new Date('2019-09-01'),
            endDate: new Date('2022-05-01'),
        };
        update.mockResolvedValue(updated);
        const e = new Education({
            id: 4,
            institution: 'Uni',
            title: 'MSc',
            startDate: '2019-09-01',
            endDate: '2022-05-01',
        });
        // When
        const result = await e.save();
        // Then
        expect(result).toEqual(updated);
        expect(update).toHaveBeenCalledWith({
            where: { id: 4 },
            data: {
                institution: 'Uni',
                title: 'MSc',
                startDate: e.startDate,
                endDate: e.endDate,
            },
        });
        expect(create).not.toHaveBeenCalled();
    });
});
