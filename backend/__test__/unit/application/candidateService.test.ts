/**
 * addCandidate — unit tests (CS-01..CS-06 per candidateService_unit_test_plan.md).
 * Given: mocks + payload. When: one addCandidate call. Then: resolves / rejects only.
 */

jest.mock('../../../src/application/validator', () => ({
    validateCandidateData: jest.fn(),
}));

jest.mock('../../../src/domain/models/Candidate', () => ({
    Candidate: jest.fn(),
}));

jest.mock('../../../src/domain/models/Education', () => ({
    Education: jest.fn(),
}));

jest.mock('../../../src/domain/models/WorkExperience', () => ({
    WorkExperience: jest.fn(),
}));

jest.mock('../../../src/domain/models/Resume', () => ({
    Resume: jest.fn(),
}));

import { validateCandidateData } from '../../../src/application/validator';
import { Candidate } from '../../../src/domain/models/Candidate';
import { Education } from '../../../src/domain/models/Education';
import { WorkExperience } from '../../../src/domain/models/WorkExperience';
import { Resume } from '../../../src/domain/models/Resume';
import { addCandidate } from '../../../src/application/services/candidateService';

const MockCandidate = Candidate as unknown as jest.Mock;
const MockEducation = Education as unknown as jest.Mock;
const MockWorkExperience = WorkExperience as unknown as jest.Mock;
const MockResume = Resume as unknown as jest.Mock;

const savedCore = (id: number) => ({
    id,
    firstName: 'Ana',
    lastName: 'Lopez',
    email: 'ana@example.com',
});

beforeEach(() => {
    jest.clearAllMocks();
    (validateCandidateData as jest.Mock).mockImplementation(() => undefined);
    MockCandidate.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedCore(1)),
        education: [] as unknown[],
        workExperience: [] as unknown[],
        resumes: [] as unknown[],
    }));
    MockEducation.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ id: 1 }),
        candidateId: undefined as number | undefined,
    }));
    MockWorkExperience.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ id: 1 }),
        candidateId: undefined as number | undefined,
    }));
    MockResume.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ id: 1 }),
        candidateId: undefined as number | undefined,
    }));
});

describe('addCandidate', () => {
    it('CS-01 validation failure surfaces as throw', async () => {
        // Given
        (validateCandidateData as jest.Mock).mockImplementation(() => {
            throw new Error('Invalid email');
        });
        const payload = { firstName: 'Ana', lastName: 'Lopez', email: 'bad' };
        // When / Then
        await expect(addCandidate(payload)).rejects.toThrow(/Invalid email/);
    });

    it('CS-02 minimal success returns saved core row', async () => {
        // Given
        const saved = savedCore(1);
        MockCandidate.mockImplementation(() => ({
            save: jest.fn().mockResolvedValue(saved),
            education: [],
            workExperience: [],
            resumes: [],
        }));
        const payload = { firstName: 'Ana', lastName: 'Lopez', email: 'ana@example.com' };
        // When
        const result = await addCandidate(payload);
        // Then
        expect(result).toEqual(saved);
    });

    it('CS-03 one happy path with educations, work, and non-empty cv', async () => {
        // Given
        const saved = savedCore(2);
        MockCandidate.mockImplementation(() => ({
            save: jest.fn().mockResolvedValue(saved),
            education: [],
            workExperience: [],
            resumes: [],
        }));
        const payload = {
            firstName: 'Ana',
            lastName: 'Lopez',
            email: 'ana@example.com',
            educations: [
                {
                    institution: 'Uni',
                    title: 'BSc',
                    startDate: '2018-09-01',
                },
            ],
            workExperiences: [
                {
                    company: 'Acme',
                    position: 'Dev',
                    startDate: '2021-01-01',
                },
            ],
            cv: { filePath: '/uploads/cv.pdf', fileType: 'application/pdf' },
        };
        // When
        const result = await addCandidate(payload);
        // Then
        expect(result).toEqual(saved);
    });

    it('CS-04 cv {} skips resume; still succeeds', async () => {
        // Given
        const saved = savedCore(3);
        MockCandidate.mockImplementation(() => ({
            save: jest.fn().mockResolvedValue(saved),
            education: [],
            workExperience: [],
            resumes: [],
        }));
        MockResume.mockImplementation(() => {
            throw new Error('Resume must not be constructed when cv is empty object');
        });
        const payload = {
            firstName: 'Ana',
            lastName: 'Lopez',
            email: 'ana@example.com',
            cv: {} as Record<string, never>,
        };
        // When
        const result = await addCandidate(payload);
        // Then
        expect(result).toEqual(saved);
        expect(MockResume).not.toHaveBeenCalled();
    });

    it('CS-05 P2002 on candidate save maps to duplicate-email message', async () => {
        // Given
        const err = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
        MockCandidate.mockImplementation(() => ({
            save: jest.fn().mockRejectedValue(err),
            education: [],
            workExperience: [],
            resumes: [],
        }));
        const payload = { firstName: 'Ana', lastName: 'Lopez', email: 'ana@example.com' };
        // When / Then
        await expect(addCandidate(payload)).rejects.toThrow(
            'The email already exists in the database',
        );
    });

    it('CS-06 other error on candidate save is rethrown', async () => {
        // Given
        MockCandidate.mockImplementation(() => ({
            save: jest.fn().mockRejectedValue(new Error('db down')),
            education: [],
            workExperience: [],
            resumes: [],
        }));
        const payload = { firstName: 'Ana', lastName: 'Lopez', email: 'ana@example.com' };
        // When / Then
        await expect(addCandidate(payload)).rejects.toThrow('db down');
    });
});
