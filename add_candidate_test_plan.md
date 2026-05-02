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

## Test cases (implemented)

Status: **Implemented** — each row maps to a `describe` / `it` in `addCandidate.integration.test.ts` (S-01…S-14, TC-01…TC-14; TC-08 covers two cases via `it.each`).

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

**Status:** **Implemented** in `addCandidate.integration.test.ts` (Given / When / Then comments per `it`). **Validation order** in code: core fields → `educations[]` → `workExperiences[]` → `cv` (only if `cv` is non-empty object); negative examples match that order so “persist not invoked” stays accurate.

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

## Wrap-up

- **AC:** Approved. **BDD:** Implemented and passing locally via Jest + mocked `@prisma/client`.
- **When tests fail:** follow `.cursor/rules/backend-integration-tests.mdc` — treat as possible AC/spec gap; align with stakeholders before changing **`backend/src`** only for test convenience.
- **Out of band:** HTTP route and real DB behavior remain **out of scope** for this suite; add E2E or DB-backed tests separately if product requires them.

**Revision:** (initial); 2026-05-02 — rules alignment + tighten + BDD scenarios (self-audit: S-11/S-12/S-09); **wrap-up** — mark test cases + BDD implemented, add paths and `npm test` hint.
