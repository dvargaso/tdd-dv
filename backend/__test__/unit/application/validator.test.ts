/**
 * validateCandidateData — unit tests (U-01..U-46 per unit_test_plan.md).
 * Given: inputs only (no mocks). When: one call. Then: throw or not.
 */

import { validateCandidateData } from '../../../src/application/validator';

const validCore = () => ({
    firstName: 'Ana',
    lastName: 'Lopez',
    email: 'a@b.co',
});

describe('validateCandidateData', () => {
    describe('first/last name', () => {
        it('U-01 accepts a simple name "Ana"', () => {
            // Given: inputs only (no collaborators to mock)
            const data = { firstName: 'Ana', lastName: 'Lopez', email: 'a@b.co' };
            // When / Then
            expect(() => validateCandidateData(data)).not.toThrow();
        });

        it('U-02 accepts a name with Spanish accents and spaces ("José María")', () => {
            // Given
            const data = { firstName: 'José María', lastName: 'Lopez', email: 'a@b.co' };
            // When / Then
            expect(() => validateCandidateData(data)).not.toThrow();
        });

        it('U-03 rejects a missing / empty name', () => {
            // Given
            const data = { firstName: '', lastName: 'Lopez', email: 'a@b.co' };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid name');
        });

        it('U-04 rejects a single-character name', () => {
            // Given
            const data = { firstName: 'A', lastName: 'Lopez', email: 'a@b.co' };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid name');
        });

        it('U-05 rejects a 101-character name', () => {
            // Given
            const data = { firstName: 'a'.repeat(101), lastName: 'Lopez', email: 'a@b.co' };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid name');
        });

        it('U-06 rejects a name containing digits', () => {
            // Given
            const data = { firstName: 'Ana1', lastName: 'Lopez', email: 'a@b.co' };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid name');
        });
    });

    describe('email', () => {
        it('U-07 accepts a well-formed email', () => {
            // Given
            const data = validCore();
            // When / Then
            expect(() => validateCandidateData(data)).not.toThrow();
        });

        it('U-08 rejects a missing email', () => {
            // Given
            const data = { firstName: 'Ana', lastName: 'Lopez', email: '' };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid email');
        });

        it('U-09 rejects a malformed email', () => {
            // Given
            const data = { ...validCore(), email: 'not-an-email' };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid email');
        });
    });

    describe('phone', () => {
        it('U-10 accepts an absent phone', () => {
            // Given
            const data = validCore();
            // When / Then
            expect(() => validateCandidateData(data)).not.toThrow();
        });

        it('U-11 accepts a valid phone "612345678"', () => {
            // Given
            const data = { ...validCore(), phone: '612345678' };
            // When / Then
            expect(() => validateCandidateData(data)).not.toThrow();
        });

        it('U-12 rejects a phone not matching the national pattern', () => {
            // Given
            const data = { ...validCore(), phone: '12345' };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid phone');
        });
    });

    describe('address', () => {
        it('U-13 accepts an absent address', () => {
            // Given
            const data = validCore();
            // When / Then
            expect(() => validateCandidateData(data)).not.toThrow();
        });

        it('U-14 accepts a 100-character address (boundary)', () => {
            // Given
            const data = { ...validCore(), address: 'M'.repeat(100) };
            // When / Then
            expect(() => validateCandidateData(data)).not.toThrow();
        });

        it('U-15 rejects a 101-character address', () => {
            // Given
            const data = { ...validCore(), address: 'M'.repeat(101) };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid address');
        });
    });

    describe('date (via education/work)', () => {
        it('U-16 accepts YYYY-MM-DD dates', () => {
            // Given
            const data = {
                ...validCore(),
                educations: [
                    {
                        institution: 'Uni',
                        title: 'BSc',
                        startDate: '2018-09-01',
                        endDate: '2022-06-30',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).not.toThrow();
        });

        it('U-17 rejects a missing startDate (education)', () => {
            // Given
            const data = {
                ...validCore(),
                educations: [
                    {
                        institution: 'Uni',
                        title: 'BSc',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid date');
        });

        it('U-18 rejects a startDate not in YYYY-MM-DD', () => {
            // Given
            const data = {
                ...validCore(),
                educations: [
                    {
                        institution: 'Uni',
                        title: 'BSc',
                        startDate: 'not-a-date',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid date');
        });
    });

    describe('education entry', () => {
        it('U-19 accepts a fully valid education entry', () => {
            // Given
            const data = {
                ...validCore(),
                educations: [
                    {
                        institution: 'Universidad X',
                        title: 'Grado',
                        startDate: '2018-09-01',
                        endDate: '2022-06-30',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).not.toThrow();
        });

        it('U-20 rejects a missing institution', () => {
            // Given
            const data = {
                ...validCore(),
                educations: [
                    {
                        title: 'Grado',
                        startDate: '2018-09-01',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid institution');
        });

        it('U-21 rejects an institution longer than 100 chars', () => {
            // Given
            const data = {
                ...validCore(),
                educations: [
                    {
                        institution: 'U'.repeat(101),
                        title: 'Grado',
                        startDate: '2018-09-01',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid institution');
        });

        it('U-22 rejects a missing title', () => {
            // Given
            const data = {
                ...validCore(),
                educations: [
                    {
                        institution: 'Uni',
                        startDate: '2018-09-01',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid title');
        });

        it('U-23 rejects a title longer than 100 chars', () => {
            // Given
            const data = {
                ...validCore(),
                educations: [
                    {
                        institution: 'Uni',
                        title: 'T'.repeat(101),
                        startDate: '2018-09-01',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid title');
        });

        it('U-24 rejects a missing startDate', () => {
            // Given
            const data = {
                ...validCore(),
                educations: [
                    {
                        institution: 'Uni',
                        title: 'Grado',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid date');
        });

        it('U-25 rejects a malformed endDate when provided', () => {
            // Given
            const data = {
                ...validCore(),
                educations: [
                    {
                        institution: 'Uni',
                        title: 'Grado',
                        startDate: '2018-09-01',
                        endDate: 'bad-end',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid end date');
        });

        it('U-26 accepts an entry without endDate', () => {
            // Given
            const data = {
                ...validCore(),
                educations: [
                    {
                        institution: 'Uni',
                        title: 'Grado',
                        startDate: '2018-09-01',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).not.toThrow();
        });
    });

    describe('work experience entry', () => {
        it('U-27 accepts a fully valid work entry', () => {
            // Given
            const data = {
                ...validCore(),
                workExperiences: [
                    {
                        company: 'Acme',
                        position: 'Dev',
                        startDate: '2021-01-01',
                        endDate: '2023-01-01',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).not.toThrow();
        });

        it('U-28 rejects a missing company', () => {
            // Given
            const data = {
                ...validCore(),
                workExperiences: [
                    {
                        position: 'Dev',
                        startDate: '2021-01-01',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid company');
        });

        it('U-29 rejects a company longer than 100 chars', () => {
            // Given
            const data = {
                ...validCore(),
                workExperiences: [
                    {
                        company: 'C'.repeat(101),
                        position: 'Dev',
                        startDate: '2021-01-01',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid company');
        });

        it('U-30 rejects a missing position', () => {
            // Given
            const data = {
                ...validCore(),
                workExperiences: [
                    {
                        company: 'Acme',
                        startDate: '2021-01-01',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid position');
        });

        it('U-31 rejects a position longer than 100 chars', () => {
            // Given
            const data = {
                ...validCore(),
                workExperiences: [
                    {
                        company: 'Acme',
                        position: 'P'.repeat(101),
                        startDate: '2021-01-01',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid position');
        });

        it('U-32 rejects a description longer than 200 chars', () => {
            // Given
            const data = {
                ...validCore(),
                workExperiences: [
                    {
                        company: 'Acme',
                        position: 'Dev',
                        description: 'D'.repeat(201),
                        startDate: '2021-01-01',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid description');
        });

        it('U-33 rejects a missing startDate', () => {
            // Given
            const data = {
                ...validCore(),
                workExperiences: [
                    {
                        company: 'Acme',
                        position: 'Dev',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid date');
        });

        it('U-34 rejects a malformed endDate when provided', () => {
            // Given
            const data = {
                ...validCore(),
                workExperiences: [
                    {
                        company: 'Acme',
                        position: 'Dev',
                        startDate: '2021-01-01',
                        endDate: 'not-a-date',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid end date');
        });
    });

    describe('cv object', () => {
        it('U-35 accepts a valid cv object with string filePath and fileType', () => {
            // Given
            const data = {
                ...validCore(),
                cv: { filePath: '/uploads/cv.pdf', fileType: 'application/pdf' },
            };
            // When / Then
            expect(() => validateCandidateData(data)).not.toThrow();
        });

        it('U-36 rejects a cv missing filePath', () => {
            // Given
            const data = {
                ...validCore(),
                cv: { fileType: 'application/pdf' },
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid CV data');
        });

        it('U-37 rejects a cv whose filePath is not a string', () => {
            // Given
            const data = {
                ...validCore(),
                cv: { filePath: 1 as unknown as string, fileType: 'application/pdf' },
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid CV data');
        });

        it('U-38 rejects a cv missing fileType', () => {
            // Given
            const data = {
                ...validCore(),
                cv: { filePath: '/x' },
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid CV data');
        });

        it('U-39 rejects a cv whose fileType is not a string', () => {
            // Given
            const data = {
                ...validCore(),
                cv: { filePath: '/x', fileType: 1 as unknown as string },
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid CV data');
        });
    });

    describe('aggregate', () => {
        it('U-40 accepts a minimal valid payload (firstName / lastName / email)', () => {
            // Given
            const data = { firstName: 'Ana', lastName: 'Lopez', email: 'a@b.co' };
            // When / Then
            expect(() => validateCandidateData(data)).not.toThrow();
        });

        it('U-41 accepts a full valid payload (educations + workExperiences + non-empty cv)', () => {
            // Given
            const data = {
                ...validCore(),
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
                cv: { filePath: '/p', fileType: 'application/pdf' },
            };
            // When / Then
            expect(() => validateCandidateData(data)).not.toThrow();
        });

        it('U-42 surfaces the first failing core field (invalid email)', () => {
            // Given
            const data = { ...validCore(), email: 'bad' };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid email');
        });

        it('U-43 surfaces a failure from an item in educations (invalid date)', () => {
            // Given
            const data = {
                ...validCore(),
                educations: [
                    {
                        institution: 'Uni',
                        title: 'BSc',
                        startDate: 'invalid',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid date');
        });

        it('U-44 surfaces a failure from an item in workExperiences (missing company)', () => {
            // Given
            const data = {
                ...validCore(),
                workExperiences: [
                    {
                        position: 'Dev',
                        startDate: '2021-01-01',
                    },
                ],
            };
            // When / Then
            expect(() => validateCandidateData(data)).toThrow('Invalid company');
        });

        it('U-45 skips cv validation when cv is an empty object', () => {
            // Given
            const data = { ...validCore(), cv: {} };
            // When / Then
            expect(() => validateCandidateData(data)).not.toThrow();
        });

        it('U-46 returns without running field validation when id is truthy, even if other fields are invalid', () => {
            // Given
            const data = {
                id: 99,
                firstName: '',
                lastName: '',
                email: 'not-an-email',
            };
            // When / Then
            expect(() => validateCandidateData(data)).not.toThrow();
        });
    });
});
