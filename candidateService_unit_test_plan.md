# Unit test plan — `candidateService` (`addCandidate`)

Unit tests for **`addCandidate`** in [backend/src/application/services/candidateService.ts](backend/src/application/services/candidateService.ts), following [.cursor/rules/backend-unit-tests.mdc](.cursor/rules/backend-unit-tests.mdc). Cases from **that function’s** control flow only. **Suggested file:** `backend/__test__/unit/application/candidateService.test.ts`.

---

## Function under test

**Export:** `addCandidate(candidateData: any): Promise<unknown>` (returns `savedCandidate` from `candidate.save()`).

**Collaborators (mock all):**

| Dependency | Role |
|------------|------|
| `validateCandidateData` | [validator.ts](backend/src/application/validator.ts) — may throw before any persist |
| `Candidate` | `new Candidate(candidateData)` → `save()` |
| `Education` | Per `candidateData.educations` entry when array is truthy |
| `WorkExperience` | Per `candidateData.workExperiences` when truthy |
| `Resume` | When `cv` is non-empty object |

**No `backend/src` changes**; use **`jest.mock`** on `../validator` and domain model modules so constructors expose **`save`** as `jest.fn()`.

---

## Branches (from source)

1. **Validate:** `validateCandidateData` throws → `throw new Error(error)` (as implemented).
2. **Core:** `candidate.save()` → `candidateId`; loops for `educations` / `workExperiences`; optional `Resume` when `cv` non-empty; **return** `savedCandidate` only.
3. **Catch:** `error.code === 'P2002'` → `The email already exists in the database`; else rethrow.

**Not given separate `it`s:** `educations: []` (zero iterations) and “only education / only work / only cv” variants — same branches as CS-03 with a smaller payload or covered by [addCandidate.integration.test.ts](backend/__test__/integration/addCandidate.integration.test.ts). **Dropped:** dedicated **`P2002` on child `save`** case (misleading product signal; fix belongs in product/code, not a unit regression target).

---

## Test cases

**Given** = mocks + payload; **When** = `await addCandidate(payload)`; **Then** = **resolved value** or **rejection / message** only. After each `it`: self-audit, `npm test -- --testNamePattern='CS-xx'`, pass before next.

| ID | Behavior | Given (summary) | Then |
|----|-----------|-----------------|------|
| CS-01 | Validation failure surfaces as throw | Mock `validateCandidateData` throws `Error('Invalid email')` | `rejects` (assert **observable** wrapped message from `throw new Error(error)`) |
| CS-02 | Minimal success returns saved core row | Validator resolves; `Candidate#save` resolves `{ id: 1, … }`; payload without `educations` / `workExperiences` / `cv` | `resolves` to that object |
| CS-03 | One happy path with educations, work, and non-empty `cv` | Validator ok; candidate `save` resolves `{ id: 2, … }`; one education + one work + `cv` with keys; all child `save` fns resolve | `resolves` to **core** `{ id: 2, …}` (return unchanged by children) |
| CS-04 | `cv` `{}` skips resume; still succeeds | Validator ok; candidate `save` resolves; `cv: {}` | `resolves` to saved row; **Resume** path not exercised (no `save` / no ctor call required if mocks fail on unexpected use) |
| CS-05 | `P2002` on **candidate** `save` → duplicate-email message | `Candidate#save` rejects object with `code: 'P2002'` | `rejects` with **`The email already exists in the database`** |
| CS-06 | Other error on **candidate** `save` is rethrown | `save` rejects `Error('db down')` without `code` | `rejects` / `throws` with **`db down`** (message or same error per runtime) |

**Total: 6 cases** (was CS-01..CS-12; removed overlapping happy paths, child `P2002`, and empty-array-only `it`).
