# Unit test plan — `validator.ts`

Unit tests for [backend/src/application/validator.ts](backend/src/application/validator.ts), following [.cursor/rules/backend-unit-tests.mdc](.cursor/rules/backend-unit-tests.mdc). Function-level, deterministic, Given / When / Then. Cases derived from **branches in `validator.ts`**; `it` titles describe behavior.

**Function under test:** exported `validateCandidateData(data)` (smallest stable entry point). Module-private helpers (`validateName`, `validateEmail`, `validatePhone`, `validateAddress`, `validateDate`, `validateEducation`, `validateExperience`, `validateCV`) are exercised through it — no `backend/src` changes.
**Test file (on approval):** `backend/__test__/unit/application/validator.test.ts`. **Mocks:** none.

**Branches (from [validator.ts](backend/src/application/validator.ts)):**

- Early return when `data.id` is truthy.
- Name rules: required, length 2..100, regex allowing Spanish accents (applied to `firstName` + `lastName`).
- Email required + regex.
- Phone optional; when present, pattern `^(6|7|9)\d{8}$`.
- Address optional; ≤ 100 chars.
- Educations loop: `institution` non-empty ≤ 100; `title` non-empty ≤ 100; `startDate` `YYYY-MM-DD`; optional `endDate` `YYYY-MM-DD`.
- WorkExperiences loop: `company` non-empty ≤ 100; `position` non-empty ≤ 100; `description` optional ≤ 200; `startDate` / `endDate` same as above.
- CV validated only when `cv && Object.keys(cv).length > 0`: object with non-empty string `filePath` and string `fileType`.

**Error literals:** `Invalid name`, `Invalid email`, `Invalid phone`, `Invalid address`, `Invalid date`, `Invalid end date`, `Invalid institution`, `Invalid title`, `Invalid company`, `Invalid position`, `Invalid description`, `Invalid CV data`.

## Test cases

Valid inputs: `not.toThrow()`. Invalid: `toThrow(/<literal>/)`. Negative cases keep earlier fields valid so exactly one branch throws.

| ID | Branch cluster | Behavior | Expected |
|----|----------------|----------|----------|
| U-01 | first/last name | accepts a simple name `"Ana"` | no throw |
| U-02 | first/last name | accepts a name with Spanish accents and spaces (`"José María"`) | no throw |
| U-03 | first/last name | rejects a missing / empty name | throws `Invalid name` |
| U-04 | first/last name | rejects a single-character name | throws `Invalid name` |
| U-05 | first/last name | rejects a 101-character name | throws `Invalid name` |
| U-06 | first/last name | rejects a name containing digits | throws `Invalid name` |
| U-07 | email | accepts a well-formed email | no throw |
| U-08 | email | rejects a missing email | throws `Invalid email` |
| U-09 | email | rejects a malformed email | throws `Invalid email` |
| U-10 | phone | accepts an absent phone | no throw |
| U-11 | phone | accepts a valid phone `"612345678"` | no throw |
| U-12 | phone | rejects a phone not matching the national pattern | throws `Invalid phone` |
| U-13 | address | accepts an absent address | no throw |
| U-14 | address | accepts a 100-character address (boundary) | no throw |
| U-15 | address | rejects a 101-character address | throws `Invalid address` |
| U-16 | date (via education/work) | accepts `YYYY-MM-DD` dates | no throw |
| U-17 | date (via education/work) | rejects a missing `startDate` | throws `Invalid date` |
| U-18 | date (via education/work) | rejects a `startDate` not in `YYYY-MM-DD` | throws `Invalid date` |
| U-19 | education entry | accepts a fully valid education entry | no throw |
| U-20 | education entry | rejects a missing `institution` | throws `Invalid institution` |
| U-21 | education entry | rejects an `institution` longer than 100 chars | throws `Invalid institution` |
| U-22 | education entry | rejects a missing `title` | throws `Invalid title` |
| U-23 | education entry | rejects a `title` longer than 100 chars | throws `Invalid title` |
| U-24 | education entry | rejects a missing `startDate` | throws `Invalid date` |
| U-25 | education entry | rejects a malformed `endDate` when provided | throws `Invalid end date` |
| U-26 | education entry | accepts an entry without `endDate` | no throw |
| U-27 | work experience entry | accepts a fully valid work entry | no throw |
| U-28 | work experience entry | rejects a missing `company` | throws `Invalid company` |
| U-29 | work experience entry | rejects a `company` longer than 100 chars | throws `Invalid company` |
| U-30 | work experience entry | rejects a missing `position` | throws `Invalid position` |
| U-31 | work experience entry | rejects a `position` longer than 100 chars | throws `Invalid position` |
| U-32 | work experience entry | rejects a `description` longer than 200 chars | throws `Invalid description` |
| U-33 | work experience entry | rejects a missing `startDate` | throws `Invalid date` |
| U-34 | work experience entry | rejects a malformed `endDate` when provided | throws `Invalid end date` |
| U-35 | cv object | accepts a valid cv object with string `filePath` and `fileType` | no throw |
| U-36 | cv object | rejects a cv missing `filePath` | throws `Invalid CV data` |
| U-37 | cv object | rejects a cv whose `filePath` is not a string | throws `Invalid CV data` |
| U-38 | cv object | rejects a cv missing `fileType` | throws `Invalid CV data` |
| U-39 | cv object | rejects a cv whose `fileType` is not a string | throws `Invalid CV data` |
| U-40 | aggregate | accepts a minimal valid payload (`firstName` / `lastName` / `email`) | no throw |
| U-41 | aggregate | accepts a full valid payload (educations + workExperiences + non-empty cv) | no throw |
| U-42 | aggregate | surfaces the first failing core field (invalid email) | throws `Invalid email` |
| U-43 | aggregate | surfaces a failure from an item in `educations` (invalid date) | throws `Invalid date` |
| U-44 | aggregate | surfaces a failure from an item in `workExperiences` (missing company) | throws `Invalid company` |
| U-45 | aggregate | skips cv validation when `cv` is an empty object `{}` | no throw |
| U-46 | aggregate | returns without running field validation when `id` is truthy, even if other fields are invalid | no throw |

## Structure

Top-level `describe('validateCandidateData', …)`, nested `describe` per branch cluster, one `it` per case with Given / When / Then comments:

```typescript
describe('first/last name', () => {
    it('rejects a name containing digits', () => {
        // Given
        const data = { firstName: 'Ana1', lastName: 'Lopez', email: 'a@b.co' };
        // When / Then
        expect(() => validateCandidateData(data)).toThrow(/Invalid name/);
    });
});
```

## Verification

`cd backend && npm test -- --testPathPattern=validator`; then full `npm test` (integration suite must still pass).

## Status

**Implemented:** [backend/__test__/unit/application/validator.test.ts](backend/__test__/unit/application/validator.test.ts) — U-01..U-46, one `it` each; Given / When / Then; no mocks; assertions are `not.toThrow()` / `toThrow('<literal>')` only.

