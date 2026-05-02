#Rules building prompts

I want to build a couple rules one for unit tests and one  integration tests. 
These are just relevant to the backend. 
I want you to propose simple rules for each, following insdustry standards and testing good practices. 
I want the rules to be very simple and concise. Keep them short
unit tests should cover only logic at the function level
Integration tests will cover full use cases, potentially using multiple functions
We are gonna write tests for existing code
Ask me any questions to fill any gaps before creating the rule files

# Integration Testing Approach

You are my integration test building assistant. Act as a senior QA engineer

I want to write integration test for the use cases around receiving candidate data and saving it in the dv. 

I want to start by identifuing the acceptance criteria around those use cases.  
This is an ATS system and this is one of the very few features implement it. 

Analyze the use case an present a set of proposed acceptance criteria for me to review. 





#Integration Test Rules
---
description: Backend integration tests — wiring, mocked DB, gated AC/BDD process
globs: backend/__test__/integration/**/*.test.ts
alwaysApply: false
---

# Backend integration tests

## What to test

- Exercise a **flow across several units** at **code boundaries** (not HTTP or a real DB).
- **Mock DB and other I/O**; assert **repository/data helpers are invoked** as expected—**no real reads/writes**. Also assert **observable outcomes** (return values, errors), not only calls.
- **Deterministic**; slower than unit is fine.
- Each **`it`**: **Given / When / Then** — nested `describe` **or** `// Given` · `// When` · `// Then` above setup, action, assertions.

## Process (existing code — do not trust implementation)

Work **one flow per slice** (e.g. one service entrypoint and its collaborators). **Do not write test code** until the gates below are satisfied.

1. **Acceptance criteria** — Infer high-level use cases and draft **acceptance criteria** from the code; **present to the user** and wait for approve/refine. Wrong or missing rules are **discovered here** and updated before tests exist.
2. **BDD scenarios** — From approved AC, propose scenarios in **Given / When / Then**. **One happy path per use case** (unless the user asked for more). **Non-happy:** ≥**3** if the slice is **tiny** (little validation, few branches); ≥**5** with more validation or branching (invalid / incomplete data). **Present for review**; wait for approve/refine.
3. **Implementation** — Only after scenario approval; mirror approved scenarios in **Given / When / Then** in code.

## When a test fails

Default: possible **AC/spec gap** — **align with the user first**, then fix **code** or **test** as agreed.

After agreed changes to **AC**, **scenarios**, or **code**, **sync tests**. Wrong **business rule** → **add or tweak a scenario** so it does not recur.

## Production code

- **Do not** change **`backend/src`** only to **ease tests** or **make them pass**. Change production code **only** after **explicit user agreement** (aligned AC, agreed fix—see **When a test fails**).




#Unit Test Rules

---
description: Backend unit tests — function-level logic, standalone process
globs: backend/__test__/unit/**/*.test.ts
alwaysApply: false
---

# Backend unit tests

## What to test

- **One function at a time**: its **inputs, branches, return values, and errors**—inner logic in isolation.
- Mock **all** collaborators (DB, HTTP, fs, time, etc.). **Fast, deterministic**; no real network or database.
- **AAA** as **Given / When / Then**; each **`it`**: nested `describe` **or** `// Given` · `// When` · `// Then` before arrange / act / assert.
- Names describe **behavior**, not internals.
- For **existing code**, start at the smallest stable entry point.

## Process

- Derive cases from the **function under test** (signature, branches, guards, edge values)—not from another test layer.
- **Before implementing:** send a **compact case list**; wait for user acknowledgment (short list, not a full BDD document).

## Production code

- **Do not** change **`backend/src`** only to **ease tests** or **make them pass**. Change production code **only** after **explicit user agreement**.


# Integration Test Plan 

# Add candidate — acceptance criteria and test plan

For **`addCandidate`**; tests live under **`backend/__test__/integration/`** and follow **`.cursor/rules/backend-integration-tests.mdc`**: **mock** persistence (no HTTP, no real DB), assert **invocations + outcomes**, each **`it`** with **Given / When / Then**; process **AC → BDD scenarios → code**; this slice needs **≥ 5** non-happy scenarios.

**In scope:** `addCandidate` (`candidateService.ts`), `validateCandidateData` (`validator.ts`), Prisma schema as mock contract. **Out of scope:** HTTP `POST /candidates`, `POST /upload`, unused `addCandidateController`, real DB, `prisma.$transaction` (not used today).

**Binding:** Rules = `validator.ts` + Prisma + observable `addCandidate`; OpenAPI non-authoritative. Tests = **service integration + mocks**. Return = core **`savedCandidate`** only (no nested relations required). **`id` present:** no app validation; core **update**; `educations` / `workExperiences` / `cv` loops may still **create** children without re-validating those arrays. **No** cross-step transactional guarantee. Validation rethrow **`throw new Error(error)`** may surface messages like **`Error: <inner>`** — assert **actual** shape or fix code separately.

---

## Acceptance criteria

### AC-1 — Create: minimal valid payload

**Given** a candidate payload with `firstName`, `lastName`, and `email` satisfying `validator.ts`, **without** `id`, **without** `educations` / `workExperiences` / non-empty `cv`, **when** `addCandidate` runs with mocks configured so candidate persist succeeds, **then** it completes without throw and returns the **saved candidate** shape (including `id` and core fields) consistent with the mock’s resolved value.

### AC-2 — Create: optional core fields

**Given** a valid create payload **with** optional `phone` and `address` passing validation, **when** `addCandidate` succeeds under mocks, **then** the persistence helper for the candidate is invoked with data matching those fields and the returned value reflects the saved candidate.

### AC-3 — Create: education records

**Given** a valid create payload with one or more `educations` entries passing `validateEducation`, **when** `addCandidate` succeeds, **then** for each entry the education persist path is invoked **with** `candidateId` matching the saved candidate’s `id` (and observable outcome / call args align with payload).

### AC-4 — Create: work experience records

**Given** a valid create payload with one or more `workExperiences` entries passing `validateExperience`, **when** `addCandidate` succeeds, **then** for each entry the work-experience persist path is invoked **with** `candidateId` matching the saved candidate’s `id`.

### AC-5 — Create: resume (CV metadata)

**Given** a valid create payload with a non-empty `cv` object with string `filePath` and `fileType`, **when** `addCandidate` succeeds, **then** the resume persist path is invoked **with** `candidateId` matching the saved candidate’s `id` and CV fields from the payload (upload timestamp set by domain model as implemented).

### AC-6 — Create: validation failures (before persist)

**Given** a create payload **without** `id`, **when** `validateCandidateData` fails, **then** `addCandidate` **throws** and **candidate persist is not invoked** (mocks show no candidate create/update from this call). Assert **observable error message** per binding row on validation error stringification.

### AC-7 — Create: duplicate email (constraint)

**Given** mocks such that the **first** candidate persist throws Prisma **unique** failure (`P2002` on email) as in production, **when** `addCandidate` runs with an otherwise valid create payload, **then** it throws with message **`The email already exists in the database`** (per `candidateService.ts`).

### AC-8 — Path with `id` present (no application validation)

**Given** a payload **with** `id`, **when** `addCandidate` runs, **then** `validateCandidateData` does not run field checks; the **core** candidate goes through **update** semantics in `Candidate.save()` when `id` is set. If `educations`, `workExperiences`, or non-empty `cv` are present, **child persist paths may still run** as **creates** without application re-validation of those arrays — document in scenarios if you cover this path.

---

**HTTP (not required for this suite):** `candidateRoutes.ts` — **201** + `addCandidate` result; **400** + `{ message }` on `Error`; **500** + generic message otherwise. Cover elsewhere if needed (e.g. E2E).

---

## Test cases (mirror in code after BDD scenario approval)

Status: **Draft** — link each `it` to an ID. Mocks per rules above.

| ID | AC | Summary | Type |
|----|-----|---------|------|
| TC-01 | AC-1 | Minimal valid create: mock success, assert return shape and no education/work/resume persist calls | Happy |
| TC-02 | AC-2 | Optional `phone` / `address`: candidate persist receives matching fields | Happy |
| TC-03 | AC-3 | One education: assert education persist with correct `candidateId` | Happy |
| TC-04 | AC-3 | Multiple educations: assert N persist calls / args | Happy |
| TC-05 | AC-4 | One work experience: assert persist with correct `candidateId` | Happy |
| TC-06 | AC-4 | Multiple work experiences: assert N persist calls / args | Happy |
| TC-07 | AC-5 | Non-empty `cv`: resume persist invoked with expected fields | Happy |
| TC-08 | AC-5 | Absent or empty `cv`: no resume persist | Happy |
| TC-09 | AC-6 | Invalid core field (e.g. email): throw before candidate persist; assert message per binding note | Negative |
| TC-10 | AC-6 | Invalid education: throw before or without completing all child writes as implemented | Negative |
| TC-11 | AC-6 | Invalid work experience: throw; assert no inconsistent outcome vs chosen mock strategy | Negative |
| TC-12 | AC-6 | Invalid `cv` object: throw; assert candidate persist not reached if validation runs first | Negative |
| TC-13 | AC-7 | Mock `P2002` on candidate create; expect duplicate-email message | Negative |
| TC-14 | AC-8 | Optional: payload with `id` + mocks for update + optional child creates — assert validator skipped and update/create invocations match intent | Edge |

TC-09…TC-13 = **5** non-happy (meets **≥ 5**). TC-14 optional.

---

## BDD scenarios (Given / When / Then)

**Status:** Draft for review. Each scenario maps to a **TC-ID**. Implement each `it` with explicit **Given / When / Then** (comments or nested `describe`). **Validation order** in code: core fields → `educations[]` → `workExperiences[]` → `cv` (only if `cv` is non-empty object); negative examples below match that order so “persist not invoked” stays accurate.

**Implementation note (mocks):** Scenarios describe **observable** `addCandidate` behavior. Tests must mock/stub persistence used by `Candidate`, `Education`, `WorkExperience`, and `Resume` (e.g. Prisma) so there are **no real DB writes**—exact wiring is up to the test author, not these steps.

### Happy paths

**S-01 — TC-01 Minimal create**

- **Given** a payload with `firstName` `Ana`, `lastName` `López`, `email` `ana.lopez@example.com`, no `id`, no `educations`, no `workExperiences`, no `cv` (or `cv` absent / empty object `{}` so CV validation and resume path are skipped),
- **And** mocks are configured so **candidate create** resolves to `{ id: 1, firstName: 'Ana', lastName: 'López', email: 'ana.lopez@example.com', phone: null, address: null }`,
- **When** `addCandidate` is called with that payload,
- **Then** it resolves without throwing,
- **And** the returned value equals the mocked saved candidate (core fields + `id`),
- **And** no education, work-experience, or resume persist calls occur for this invocation.

**S-02 — TC-02 Optional phone and address**

- **Given** a valid payload as in S-01 plus `phone` `612345678` and `address` `Calle Mayor 1`,
- **And** candidate create resolves including those fields on the saved record,
- **When** `addCandidate` is called,
- **Then** it resolves,
- **And** the candidate persist path received `phone` and `address` consistent with the payload (per mock spy or stub contract).

**S-03 — TC-03 One education**

- **Given** a valid payload with core fields as in S-01 and `educations` containing one item: `institution` `Universidad X`, `title` `Grado`, `startDate` `2018-09-01`, `endDate` `2022-06-30`,
- **And** candidate create resolves with `id` `42`,
- **And** education persist succeeds for `candidateId` `42`,
- **When** `addCandidate` is called,
- **Then** it resolves and the return value is still the **core** saved candidate from the first step (no nested collections required),
- **And** education persist was invoked with `candidateId` `42` and payload-aligned fields.

**S-04 — TC-04 Multiple educations**

- **Given** a valid payload with two `educations` entries (both valid per `validator.ts` dates and lengths),
- **And** candidate create resolves with `id` `7`,
- **When** `addCandidate` is called,
- **Then** education persist runs **twice**, each with `candidateId` `7` and args matching the respective array element.

**S-05 — TC-05 One work experience**

- **Given** a valid payload with core fields and one `workExperiences` item (`company`, `position`, `startDate` valid; `description` optional within limit),
- **And** candidate create resolves with `id` `3`,
- **When** `addCandidate` is called,
- **Then** it resolves,
- **And** work-experience persist was invoked once with `candidateId` `3` and matching fields.

**S-06 — TC-06 Multiple work experiences**

- **Given** a valid payload with two valid `workExperiences` entries,
- **And** candidate create resolves with `id` `9`,
- **When** `addCandidate` is called,
- **Then** work-experience persist runs twice with `candidateId` `9`.

**S-07 — TC-07 Resume with non-empty `cv`**

- **Given** a valid payload with core fields and `cv` `{ filePath: '/uploads/1-cv.pdf', fileType: 'application/pdf' }` (non-empty object),
- **And** candidate create resolves with `id` `5`,
- **And** resume persist succeeds,
- **When** `addCandidate` is called,
- **Then** resume persist was invoked with `candidateId` `5`, the given `filePath` and `fileType`, and upload time behavior as implemented by `Resume`.

**S-08 — TC-08 No resume when `cv` absent or empty**

- **Given** a valid payload with core fields and **no** `cv` key **or** `cv` `{}`,
- **When** `addCandidate` is called,
- **Then** it resolves,
- **And** resume persist was **not** invoked.

### Non-happy paths

**S-09 — TC-09 Invalid core field (email)**

- **Given** a payload identical to S-01 except `email` `not-an-email`,
- **When** `addCandidate` is called,
- **Then** it **rejects** / throws,
- **And** candidate persist was **not** invoked,
- **And** the thrown message matches the **actual** service behavior for caught validator errors (see binding: often contains `Invalid email`, possibly prefixed by `Error:` depending on `throw new Error(error)`).

**S-10 — TC-10 Invalid education**

- **Given** a payload with valid core fields and `educations` with one item whose `startDate` is invalid (e.g. `not-a-date`),
- **When** `addCandidate` is called,
- **Then** it throws before candidate persist,
- **And** candidate persist was **not** invoked.

**S-11 — TC-11 Invalid work experience**

- **Given** a payload with valid core fields, **no** `educations` key, and `workExperiences` containing one invalid item (e.g. missing `company` or `startDate` not matching `YYYY-MM-DD`),
- **When** `addCandidate` is called,
- **Then** it throws during validation (before `candidate.save()`),
- **And** candidate persist was **not** invoked.

**S-12 — TC-12 Invalid `cv`**

- **Given** a payload with valid core, no `educations`, no `workExperiences`, and `cv` a **non-empty** object that fails `validateCV` (e.g. `{ filePath: '/x' }` missing `fileType`, or `fileType` not a string),
- **When** `addCandidate` is called,
- **Then** it throws,
- **And** candidate persist was **not** invoked.

**S-13 — TC-13 Duplicate email (`P2002`)**

- **Given** an otherwise valid minimal payload as in S-01,
- **And** the candidate create / persist mock rejects with an error whose `code` is **`P2002`** (unique violation on email),
- **When** `addCandidate` is called,
- **Then** it throws with message **`The email already exists in the database`**.

### Edge (optional)

**S-14 — TC-14 Payload with `id` (update + optional children)**

- **Given** a payload with `id` `100` and changed core fields, with **no** `educations` / `workExperiences` / `cv` (simplest case),
- **And** candidate update mock resolves to the updated row,
- **When** `addCandidate` is called,
- **Then** it resolves,
- **And** **update** (not create) was used for the core candidate with `id` `100`,
- **And** no validator rejection occurred for empty optional sections (validator short-circuits when `id` is present).

*(Extended TC-14 variant, if in scope: same as above **plus** `educations` / `workExperiences` / `cv` present — expect child persists without application validation of those arrays; assert create/update invocations per mocks.)*

---

**Next:** Approve **BDD scenarios** above → implement under `backend/__test__/integration/`.

**Revision:** (initial); 2026-05-02 — rules alignment + tighten + BDD scenarios (self-audit: S-11 uses no `educations` + invalid work so validation fails before `candidate.save()`; S-12 uses non-empty invalid `cv`; S-09 documents `throw new Error(error)` message shape).

---------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------

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


---------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------
# Unit test plan — `fileUploadService`

Unit tests for [backend/src/application/services/fileUploadService.ts](backend/src/application/services/fileUploadService.ts), following [.cursor/rules/backend-unit-tests.mdc](.cursor/rules/backend-unit-tests.mdc). Cases derived from **branches in that file**, not from another test layer. **Suggested test file:** `backend/__test__/unit/application/fileUploadService.test.ts` (matches `globs: backend/__test__/unit/**/*.test.ts`; existing stub under `__test__/src/...` can be retired or redirected when you implement).

---

## Units under test

| Export | Role | Collaborators to mock |
|--------|------|------------------------|
| `uploadFile(req, res)` | Invokes Multer `upload.single('file')`, then in the callback branches on `err`, `req.file`, and success JSON | **`multer`** (module factory / `single` middleware behavior), **`res`** (`status`, `json` chain), **`req`** (mutated or left without `file` per scenario) |
| `sum(a, b)` | Pure `return a + b` | None |

---

## Branches (from source)

**`uploadFile`** (callback `function (err)`):

1. `err instanceof multer.MulterError` → `res.status(500).json({ error: err.message })`.
2. `err` truthy but not `MulterError` → `res.status(500).json({ error: err.message })`.
3. No `err`, `!req.file` → `res.status(400).json({ error: 'Invalid file type, only PDF and DOCX are allowed!' })`.
4. No `err`, `req.file` present → `res.status(200).json({ filePath: req.file.path, fileType: req.file.mimetype })`.

**`sum`:** no branches—single return.

**Not exported (module-private):** `fileFilter`, `storage`, `upload` instance. Their behavior is only observable through **`uploadFile`** when Multer runs the composed middleware; **do not** change `backend/src` to export them for tests ([.cursor/rules/backend-unit-tests.mdc](.cursor/rules/backend-unit-tests.mdc) production rule). Indirect coverage: UF-04 (no file) aligns with filter rejection / no file attached.

---

## Test cases (compact list)

**Given** = mocks + inputs; **When** = one call into the unit under test; **Then** = assert **HTTP outcome only** (`res.status` / `res.json` args), or return value for `sum`. **After each `it`:** self-audit, run Jest for that case (`--testNamePattern`), pass before adding the next.

### `uploadFile` (mock `multer` so `single('file')` returns a function `(req, res, cb) => { … }` you control per test)

| ID | Behavior | Given | When | Then |
|----|-----------|-------|------|------|
| UF-01 | Success returns path and MIME | `req` with `file: { path: '/tmp/1-x.pdf', mimetype: 'application/pdf' }`; `res` chain mock; uploader calls `cb(null)` | `uploadFile(req, res)` | `status(200)`, `json({ filePath, fileType })` matching `req.file` |
| UF-02 | MulterError maps to 500 + message | `cb` invoked with `Object.assign(new multer.MulterError(...), { code: 'LIMIT_FILE_SIZE', message: '...' })` or real `MulterError` if available from mocked multer | `uploadFile(req, res)` | `status(500)`, `json({ error: <message> })` |
| UF-03 | Non-Multer error maps to 500 + message | `cb` invoked with `new Error('disk full')` | `uploadFile(req, res)` | `status(500)`, `json({ error: 'disk full' })` |
| UF-04 | No file after callback (e.g. type rejected) | `cb(null)`; `req.file` undefined | `uploadFile(req, res)` | `status(400)`, `json({ error: 'Invalid file type, only PDF and DOCX are allowed!' })` |

### `sum`

| ID | Behavior | Given | When | Then |
|----|-----------|-------|------|------|
| UF-05 | Adds two positive integers | none | `sum(2, 3)` | `5` |
| UF-06 | Adds negative and positive | none | `sum(-1, 4)` | `3` |
| UF-07 | Zero edge | none | `sum(0, 0)` | `0` |

---

## Structure

- `describe('uploadFile', …)` with four `it` blocks (UF-01..UF-04).
- `describe('sum', …)` with three `it` blocks (UF-05..UF-07).
- Each `it`: `// Given` · `// When` · `// Then` (or nested `describe` per case id).

## Verification

- Per case: `cd backend && npm test -- --testPathPattern=fileUploadService --testNamePattern='UF-0N'`
- Full: `cd backend && npm test`




---------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------
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




---------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------

# Unit test plan — domain `Candidate` model

Unit tests for [backend/src/domain/models/Candidate.ts](backend/src/domain/models/Candidate.ts), following [.cursor/rules/backend-unit-tests.mdc](.cursor/rules/backend-unit-tests.mdc). Cases come from **that class’s** constructor, `save`, and `findOne` only. **Suggested file:** `backend/__test__/unit/domain/models/Candidate.test.ts` (under `backend/__test__/unit/**/*.test.ts`).

---

## Units under test

| Member | Role | Collaborators to mock |
|--------|------|-------------------------|
| `constructor(data)` | Copies scalar fields; sets `education` / `workExperience` / `resumes` from `data` or `[]` | None |
| `save()` | Builds Prisma `data` (optional nested `create` for related rows), then `prisma.candidate.create` **or** `prisma.candidate.update`; maps some errors to user-facing `Error` messages | **`PrismaClient`** instance used by the module (`candidate.create`, `candidate.update`) |
| `static findOne(id)` | `prisma.candidate.findUnique`; returns `null` or `new Candidate(data)` | **`prisma.candidate.findUnique`** |

**No `backend/src` changes** only to ease tests ([.cursor/rules/backend-unit-tests.mdc](.cursor/rules/backend-unit-tests.mdc)). Mock **`@prisma/client`** so `new PrismaClient()` returns an object whose `candidate.create` / `candidate.update` / `candidate.findUnique` are `jest.fn()`. Use **`jest.requireActual('@prisma/client')`** and spread `…actual` so **`Prisma.PrismaClientInitializationError`** remains the real class for `instanceof` checks in `save`’s catch blocks.

---

## Branches (from source)

**Constructor**

- Assigns `id`, `firstName`, `lastName`, `email`, `phone`, `address` from `data`.
- `education` / `workExperience` / `resumes` default to `[]` when missing or falsy on `data`.

**`save()` — build `candidateData`**

- Scalar fields: include only if `!== undefined` (`firstName`, `lastName`, `email`, `phone`, `address`).
- If `this.education.length > 0`: set `candidateData.educations = { create: [...] }` mapped from each item’s `institution`, `title`, `startDate`, `endDate`.
- If `this.workExperience.length > 0`: set `workExperiences.create` with `company`, `position`, `description`, `startDate`, `endDate`.
- If `this.resumes.length > 0`: set `resumes.create` with `filePath`, `fileType`.

**`save()` — dispatch**

- **`this.id` truthy:** `prisma.candidate.update({ where: { id: this.id }, data: candidateData })`.
- **Else:** `prisma.candidate.create({ data: candidateData })`.

**`save()` — `update` catch**

- `instanceof Prisma.PrismaClientInitializationError` → throw Spanish DB connection message.
- `error.code === 'P2025'` → throw Spanish “record not found” message.
- Else → rethrow.

**`save()` — `create` catch**

- `instanceof Prisma.PrismaClientInitializationError` → same Spanish connection message.
- Else → rethrow (no `P2025` branch on create).

**`findOne`**

- `findUnique({ where: { id } })`; if falsy → `null`; else `new Candidate(data)`.

**Not given separate `it`s:** “only phone set”, “only nested education without work/resume”, and “two rows in one nested array” — same mapping logic as CM-02 with a smaller or larger fixture; optional scalar omission is implied by CM-02’s minimal create. **Overlap:** persistence orchestration for full add-candidate flow stays in [addCandidate.integration.test.ts](backend/__test__/integration/addCandidate.integration.test.ts); this file targets **Candidate** mapping and error branches in isolation.

---

## Test cases

**Given** = Prisma mock behavior + `Candidate` construction inputs (for `save` / `findOne`, arrange instance or call static with mocked `findUnique`). **When** = one `await candidate.save()` or `await Candidate.findOne(id)`. **Then** = **resolved value**, **rejection message**, and/or **first argument** to `create` / `update` / `findUnique` where that is the observable contract of the mapping (same idea as asserting `res.json` in service tests). After each `it`: self-audit, `npm test -- --testNamePattern='CM-xx'`, pass before next.

| ID | Behavior | Given (summary) | Then |
|----|-----------|-----------------|------|
| CM-01 | Constructor defaults related arrays | `new Candidate({ firstName, lastName, email })` without `education` / `workExperience` / `resumes` | `education`, `workExperience`, `resumes` are each `[]` |
| CM-02 | `save` create — minimal scalars | Instance **without** `id`; empty `education` / `workExperience` / `resumes`; `create` resolves e.g. `{ id: 1, firstName, lastName, email }` | `create` called once with `data` containing **only** scalar fields present on the instance (no `educations` / `workExperiences` / `resumes` keys); `resolves` to mocked return |
| CM-03 | `save` create — nested `create` blocks | No `id`; push one plain object per array (duck-typed fields matching mapper); `create` resolves | `create` `data` includes `educations.create`, `workExperiences.create`, `resumes.create` with expected nested objects; `resolves` to mocked return |
| CM-04 | `save` update path | Instance with `id: 5` set; empty related arrays; `update` resolves row | **`update`** called with `where: { id: 5 }` and scalar `data`; **`create` not** called; `resolves` to mocked return |
| CM-05 | `save` update — `P2025` | `id` set; `update` rejects with `Object.assign(new Error('…'), { code: 'P2025' })` | `rejects` with message **`No se pudo encontrar el registro del candidato con el ID proporcionado.`** |
| CM-06 | `save` create — `PrismaClientInitializationError` | No `id`; `create` rejects with **`new Prisma.PrismaClientInitializationError(...)`** (from `requireActual`) | `rejects` with **`No se pudo conectar con la base de datos. Por favor, asegúrese de que el servidor de base de datos esté en ejecución.`** |
| CM-07 | `save` update — `PrismaClientInitializationError` | `id` set; `update` rejects with same init error class | Same Spanish **connection** message as CM-06 |
| CM-08 | `save` create — other error rethrown | No `id`; `create` rejects e.g. `Object.assign(new Error('dup'), { code: 'P2002' })` | `rejects` with **same** error / message (rethrow branch) |
| CM-09 | `save` update — other error rethrown | `id` set; `update` rejects `new Error('constraint')` without `P2025` / not init error | `rejects` with **`constraint`** (or same `Error`) |
| CM-10 | `findOne` — not found | `findUnique` resolves `null` | `resolves` to **`null`**; `findUnique` called with `where: { id }` |
| CM-11 | `findOne` — found | `findUnique` resolves `{ id, firstName, lastName, email, … }` | `resolves` to **`Candidate`** instance whose scalars match input row |

**Total: 11 cases** (CM-01..CM-11).

---

## Implementation notes

- **Import order:** `jest.mock('@prisma/client', …)` before importing `Candidate` from the model module (so the module’s `new PrismaClient()` receives the mock).
- **`console.log`:** the `update` catch logs errors; **spy** `console.log` and silence in `beforeEach` / restore in `afterAll` if logs pollute CI (same pattern as [addCandidate.integration.test.ts](backend/__test__/integration/addCandidate.integration.test.ts)).
- **Nested fixtures in CM-03:** plain objects on `candidate.education` / `workExperience` / `resumes` are enough; no need to `new Education(...)` unless you want constructor side effects — `save` only reads listed properties.
- **`id` for update branch:** use a **truthy** numeric `id` (e.g. `5`); avoid relying on `id: 0` if that could be ambiguous for the `if (this.id)` check.

## Structure

- `describe('Candidate', () => { describe('constructor', …); describe('save', …); describe('findOne', …); })`
- One `it` per **CM-xx** id; `// Given` · `// When` · `// Then` in each.

## Verification

- Per case: `cd backend && npm test -- --testPathPattern=Candidate --testNamePattern='CM-xx'`
- File pattern: `--testPathPattern='unit/domain/models/Candidate'` if needed to avoid matching other `Candidate` strings.
- Full: `cd backend && npm test`







---------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------

# Unit test plan — domain `Education`, `WorkExperience`, `Resume`

Single tracking document for unit tests of:

- [backend/src/domain/models/Education.ts](backend/src/domain/models/Education.ts)
- [backend/src/domain/models/WorkExperience.ts](backend/src/domain/models/WorkExperience.ts)
- [backend/src/domain/models/Resume.ts](backend/src/domain/models/Resume.ts)

Follow [.cursor/rules/backend-unit-tests.mdc](.cursor/rules/backend-unit-tests.mdc).

**Layout (same pattern as [Candidate.test.ts](backend/__test__/unit/domain/models/Candidate.test.ts)):** **one test file per model**, each colocated with a small Prisma mock helper so `jest.mock('@prisma/client', …)` can `require` a stable object before importing the model under test.

| Model | Suggested test file | Suggested Prisma mock helper |
|-------|---------------------|------------------------------|
| Education | [backend/__test__/unit/domain/models/Education.test.ts](backend/__test__/unit/domain/models/Education.test.ts) | `backend/__test__/unit/domain/models/educationModelPrismaMock.ts` (`education.create` / `education.update`) |
| WorkExperience | [backend/__test__/unit/domain/models/WorkExperience.test.ts](backend/__test__/unit/domain/models/WorkExperience.test.ts) | `backend/__test__/unit/domain/models/workExperienceModelPrismaMock.ts` (`workExperience.create` / `workExperience.update`) |
| Resume | [backend/__test__/unit/domain/models/Resume.test.ts](backend/__test__/unit/domain/models/Resume.test.ts) | `backend/__test__/unit/domain/models/resumeModelPrismaMock.ts` (`resume.create`) |

This document remains the **single tracking plan** for all three sources; implementation is **three** medium-sized suites, not one combined file.

---

## Shared testing approach

**No `backend/src` changes** only to ease tests. In **each** test file, mock **`@prisma/client`** so `new PrismaClient()` returns an object that exposes **only** the Prisma delegate(s) that **that** model module uses (`education`, `workExperience`, or `resume`). Each suite imports **one** domain file, so the mock does **not** need the other models’ delegates on the same object.

**Import order:** `jest.mock('@prisma/client', …)` before importing the model class under test (the module calls `new PrismaClient()` at load time).

**`Resume.create`:** contains `console.log(this)` — **spy** `console.log` and silence during tests (restore in `afterAll`), same idea as Candidate / integration tests.

**Overlap:** Full add-candidate persistence remains in [addCandidate.integration.test.ts](backend/__test__/integration/addCandidate.integration.test.ts). These tests target **each model’s** constructor + `save` / `create` mapping in isolation.

**Not given separate `it`s:** duplicate “only `candidateId` differs” matrices across Education vs WorkExperience beyond one create-with and one create-without each; “invalid date string” constructor behavior; `Resume` `id: 0` edge for `if (!this.id)` (same falsy branch as “no id”; treat as optional if product clarifies).

---

## Units under test (summary)

| File | Members | Collaborators to mock |
|------|---------|-------------------------|
| **Education** | `constructor`, `save` | `prisma.education.create`, `prisma.education.update` |
| **WorkExperience** | `constructor`, `save` | `prisma.workExperience.create`, `prisma.workExperience.update` |
| **Resume** | `constructor`, `save`, `create` | `prisma.resume.create` |

---

## Branches (from source)

### Education

**Constructor:** assigns `id`, `institution`, `title`, `startDate` as `new Date(data.startDate)`, `endDate` as `data.endDate ? new Date(data.endDate) : undefined`, `candidateId`.

**`save()`:** builds `educationData` with `institution`, `title`, `startDate`, `endDate`; if `this.candidateId !== undefined`, adds `candidateId`. If **`this.id` truthy** → `prisma.education.update({ where: { id }, data })`; else → `prisma.education.create({ data })`. No local `catch` — Prisma errors propagate.

### WorkExperience

Same structure as Education: **`workExperienceData`** includes `company`, `position`, `description`, `startDate`, `endDate`; optional `candidateId` when `!== undefined`; **`this.id`** chooses `workExperience.update` vs `create`.

### Resume

**Constructor:** `this.id = data?.id` (and optional fields via `?.`); **`this.uploadDate = new Date()`** (always “now” at construction, not from `data`).

**`save()`:** if **`!this.id`** → `return await this.create()`; else → **`throw new Error('No se permite la actualización de un currículum existente.')`**.

**`create()`:** `prisma.resume.create({ data: { candidateId, filePath, fileType, uploadDate } })`; returns **`new Resume(createdResume)`**.

---

## Test cases

**Given** = Prisma mock behavior + model construction. **When** = one `await instance.save()` or `await instance.create()` (only where the plan names `create` directly). **Then** = resolved value, rejection message, and/or Prisma call arguments as specified. **After each `it`:** self-audit, run Jest with `--testNamePattern` for that suite’s case id (`EDU-xx`, `WRK-xx`, or `RES-xx`), pass before next.

### Education (`Education.test.ts` — e.g. `describe('Education', …)`)

| ID | Behavior | Given (summary) | Then |
|----|-----------|-----------------|------|
| EDU-01 | Constructor — `endDate` omitted when falsy | `new Education({ …, startDate: '2020-01-01' })` without `endDate` | `startDate` is `Date`; `endDate` is **`undefined`** |
| EDU-02 | Constructor — `endDate` set when provided | `endDate: '2021-06-01'` | `endDate` is `Date` reflecting that value |
| EDU-03 | `save` create — no `candidateId` on instance | No `id`; `candidateId` left `undefined`; `create` resolves row | **`create`** once with `data` **without** `candidateId`; **`update`** not called; resolves to mocked return |
| EDU-04 | `save` create — includes `candidateId` | `candidateId: 7` set; `create` resolves | `create` `data` includes **`candidateId: 7`** |
| EDU-05 | `save` update path | `id: 4` truthy; empty optional branch same as create payload; `update` resolves | **`update`** with `where: { id: 4 }` and full `data` object; **`create`** not called; resolves to mocked return |

### WorkExperience (`WorkExperience.test.ts`)

| ID | Behavior | Given (summary) | Then |
|----|-----------|-----------------|------|
| WRK-01 | Constructor — optional `endDate` / `description` absent | `startDate` only; no `endDate` / `description` | `endDate` **`undefined`**; `description` **`undefined`** (or not set on instance per source) |
| WRK-02 | Constructor — `endDate` and `description` set | Both provided | Both present on instance with `Date` for `endDate` |
| WRK-03 | `save` create — no `candidateId` | No `id`; `candidateId` undefined; `create` resolves | `create` `data` **without** `candidateId`; `update` not called |
| WRK-04 | `save` create — with `candidateId` | `candidateId: 9`; `create` resolves | `data` includes **`candidateId: 9`** |
| WRK-05 | `save` update path | `id: 2` truthy; `update` resolves | **`update`** with `where: { id: 2 }` and full `data` object (`company`, `position`, `description`, `startDate`, `endDate`, optional `candidateId` per instance); **`create`** not called; resolves to mocked return |

### Resume (`Resume.test.ts`)

| ID | Behavior | Given (summary) | Then |
|----|-----------|-----------------|------|
| RES-01 | `save` without id delegates to persist | `new Resume({ candidateId: 1, filePath: '/a.pdf', fileType: 'application/pdf' })` (no / falsy `id`); `resume.create` resolves DB-shaped row | **`create`** invoked with `data` matching **`candidateId`**, **`filePath`**, **`fileType`**, **`uploadDate`** (same reference as instance’s `uploadDate`); resolves to **`Resume`** instance built from mocked return |
| RES-02 | `save` with id forbids update | Instance with **truthy** `id` (e.g. `1`) | **`rejects`** / throws with **`No se permite la actualización de un currículum existente.`**; **`resume.create` not** called |
| RES-03 | `create` returns wrapped row | Call **`await instance.create()`** only (not via `save`); mock returns `{ id, candidateId, filePath, fileType, uploadDate: … }` | Resolves to **`Resume`**; key fields match Prisma return |
| RES-04 | `create` propagates Prisma failure | `resume.create` rejects e.g. `new Error('db')` | **`rejects`** with **`db`** (or same error) |

**Totals:** Education **5**, WorkExperience **5**, Resume **4** — **14 cases** (EDU-01..05, WRK-01..05, RES-01..04).

---

## Implementation notes

- **One Prisma mock shape per suite:** each `*ModelPrismaMock.ts` only needs the delegate for that file’s model; `jest.mock('@prisma/client')` returns `{ ...actual, PrismaClient: jest.fn(() => yourMock) }` like [Candidate.test.ts](backend/__test__/unit/domain/models/Candidate.test.ts).
- **Education / WorkExperience `id`:** use truthy numeric ids for update tests (avoid `id: 0` ambiguity with `if (this.id)`).
- **Resume RES-02:** use numeric `id >= 1` to match “existing resume” intent.
- **Resume `uploadDate`:** assert `create` mock received `uploadDate` strictly as `instance.uploadDate` (reference equality) or `expect.any(Date)` plus same `getTime()` if clock stability matters — prefer **reference** to instance field when comparing `create.mock.calls[0][0].data.uploadDate`.

## Structure

Per model file, nested `describe` blocks are optional; keep **one `it` per case id** and `// Given` · `// When` · `// Then`.

```text
Education.test.ts          → EDU-01..EDU-05
WorkExperience.test.ts       → WRK-01..WRK-05
Resume.test.ts               → RES-01..RES-04
```

Each `it` title includes the case id (`EDU-03`, …).

## Verification

Run one suite:

```bash
cd backend && npm test -- --testPathPattern='unit/domain/models/Education'
cd backend && npm test -- --testPathPattern='unit/domain/models/WorkExperience'
cd backend && npm test -- --testPathPattern='unit/domain/models/Resume'
```

Per case (example — Education):

```bash
cd backend && npm test -- --testPathPattern='unit/domain/models/Education' --testNamePattern='EDU-03'
```




