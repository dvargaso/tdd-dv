import { formatCandidateDisplayName } from '../../../src/services/candidateService';

describe('formatCandidateDisplayName', () => {
    it('joins trimmed first and last names', () => {
        expect(formatCandidateDisplayName(' Jane ', ' Doe')).toBe('Jane Doe');
    });
});
