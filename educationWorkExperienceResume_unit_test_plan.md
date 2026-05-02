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

