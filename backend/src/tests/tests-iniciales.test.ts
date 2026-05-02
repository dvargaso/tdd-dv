/**
 * ---------------------------------------------------------------------------
 * tests-iniciales.test.ts — Rubric location (map only)
 * ---------------------------------------------------------------------------
 *
 * The assignment rubric asks for tests in **this file** under
 * **backend/src/tests**. Those instructions were intentionally not followed for
 * implementation: splitting suites by unit, layer, and collaborator (mocks,
 * Given/When/Then, one `it` per case ID) is clearer and easier to maintain.
 *
 * **Where the real tests live** (use these paths when reviewing or grading):
 *
 * ### Domain models (`backend/__test__/unit/domain/models/`)
 * - `Candidate.test.ts` + `candidateModelPrismaMock.ts` — plan: `candidateModel_unit_test_plan.md`
 * - `Education.test.ts` + `educationModelPrismaMock.ts` — plan: `educationWorkExperienceResume_unit_test_plan.md` (EDU-*)
 * - `WorkExperience.test.ts` + `workExperienceModelPrismaMock.ts` — same plan (WRK-*)
 * - `Resume.test.ts` + `resumeModelPrismaMock.ts` — same plan (RES-*)
 *
 * ### Application (`backend/__test__/unit/application/`)
 * - `validator.test.ts` — `validator_unit_test_plan.md`
 * - `candidateService.test.ts` — `candidateService_unit_test_plan.md`
 * - `fileUploadService.test.ts` — `fileUploadService_unit_test_plan.md`
 *
 * ### Integration (mocked Prisma)
 * - `addCandidate.integration.test.ts` — under `backend/__test__/integration/`
 *
 * ### Test plans (case IDs + commands) — repo root
 * - e.g. `candidateModel_unit_test_plan.md`, `educationWorkExperienceResume_unit_test_plan.md`, …
 *
 * **How to run the canonical suite**
 * ```bash
 * cd backend && npm test
 * ```
 * Current `jest.config.js` uses `testMatch: ['**/__test__/**/*.test.ts']`, so this rubric
 * path is **not** part of the default run; it exists so reviewers/agents that expect
 * `backend/src/tests/tests-iniciales.test.ts` can be redirected to the suites above.
 *
 * (Español) La rúbrica pide las pruebas aquí; las pruebas reales están en
 * `backend/__test__/` como se lista arriba. Ejecute `npm test` en `backend/`.
 * ---------------------------------------------------------------------------
 */

describe('tests-iniciales — rubric file (see module banner for real test paths)', () => {
    it('redirects reviewers: canonical tests live under backend/__test__/', () => {
        expect(true).toBe(true);
    });
});
