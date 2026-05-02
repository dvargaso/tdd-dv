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

