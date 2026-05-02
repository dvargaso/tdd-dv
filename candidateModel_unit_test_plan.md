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


