# Defensive Programming

Use this alongside `tdd.md` and `edge-cases.md` whenever building or reviewing code in the vendor-performance-platform. Where `tdd.md` covers *how* to build test-first and `edge-cases.md` covers *what* to test next, this file covers *how to make the system safe by design* — validate at boundaries, fail explicitly, never leak internals, never trust input.

Consult this **before writing implementation** and **during review** — not only after something breaks in production.

---

## Core principle: assume hostility and failure

Every layer must assume:

- **Input may be missing, wrong type, malicious, or duplicated**
- **Dependencies (SQL, Key Vault, network) may fail**
- **Callers may misuse your function if the type system allows it**

Defensive code **detects** these situations early, **responds** with an explicit outcome, and **never** corrupts data or expose internal details.

---

## Architecture: defense in layers

```
UI → API routes → Domain → Repository → Infrastructure (lib/db.ts)
```

| Layer | Location | Defensive responsibility |
|-------|----------|---------------------------|
| Infrastructure | `lib/db.ts`, env config | Fail fast on missing secrets/config; connection pooling |
| Repository | `lib/repositories/**` | Parameterized SQL only; map DB errors to domain errors |
| Domain | `lib/domain/**` | Business rules, invariants, validation; pure where possible |
| API | `app/api/**` | Parse HTTP safely; map errors to status codes; never leak stack traces |
| UI | `app/**` components | Show safe error messages; prevent double-submit; loading/error states |

**Rule:** validate at the **trust boundary** where untrusted data enters. Do not duplicate the same validation at every layer — decide which seam owns which guarantee (see judgment rules in `edge-cases.md`).

---

## The 10 defensive rules

### 1. Validate at boundaries

Untrusted data enters at API routes (HTTP body, query params) and eventually the UI. Parse with a schema (e.g. Zod) or explicit checks **before** calling domain logic.

### 2. Domain owns business rules

Required fields, uniqueness, score formulas, "vendor must exist" — these live in `lib/domain/**`, not in SQL strings or React components.

### 3. Parameterized queries only

Never concatenate user input into SQL. Always use `.input()` bindings via `mssql`.

### 4. Explicit outcomes — no silent failure

Return success, expected failure (validation, not found, conflict), or unexpected failure. Never swallow errors or return partial success without signaling.

### 5. Safe error responses

- **4xx:** safe, specific messages for the client (`{ error, code, details? }`)
- **5xx:** generic message only; log full error server-side
- Never return `error.message` from caught exceptions directly to the client

### 6. Types are defenses

Avoid `any`. Use `unknown` at catch boundaries. Domain functions accept validated types, not raw JSON.

### 7. Fail fast on configuration

Missing env vars or secrets → throw on first use with a clear message (see `lib/db.ts`). Do not proceed with half-configured state.

### 8. Dependencies point inward

`app/api` → `lib/domain` → `lib/repositories` → `lib/db`. Domain must not import Next.js or SQL drivers.

### 9. Inject dependencies at system boundaries

Pass repositories/mailers/clients into functions that need them — enables testing without mocking your own domain logic (see `tdd.md` mocking section).

### 10. Let the database enforce what it should

Use UNIQUE constraints, NOT NULL, FK constraints as a **last line of defense**. Domain should check first; DB catches races.

---

## Standard API error shape

```typescript
// Success
{ data: T }

// Client error (4xx)
{ error: string; code: string; details?: Record<string, string> }

// Server error (5xx)
{ error: string; code: string }
```

| Situation | HTTP | Code example |
|-----------|------|--------------|
| Malformed JSON | 400 | `INVALID_JSON` |
| Validation failed | 400 | `VALIDATION_FAILED` |
| Resource not found | 404 | `VENDOR_NOT_FOUND` |
| Duplicate / conflict | 409 | `DUPLICATE_REGISTRATION` |
| Unauthorized | 401 / 403 | `UNAUTHORIZED` / `FORBIDDEN` |
| Internal failure | 500 | `INTERNAL_ERROR` |

Only `lib/errors/mapErrorToResponse.ts` (or equivalent) converts domain/infrastructure errors to HTTP. Routes call domain, catch, map — they do not format ad hoc error JSON.

---

## Combining with TDD and edge cases

**Workflow for every new function or route:**

1. **State the seam** (`tdd.md`)
2. **List invariants** — what must always be true?
3. **Walk the 8 edge-case categories** (`edge-cases.md`) — note which apply
4. **Present candidate defenses to the user** before writing tests
5. **One category → one Red → Green → Refactor cycle** — never batch
6. **First tests are often failure cases** — defend before happy path when risk is high (validation, security, duplicates)

### Edge category → defensive technique

| Category | Technique |
|----------|-----------|
| 1 Boundary | Schema min/max, length limits, pagination caps |
| 2 Empty/null | Required field validation at boundary |
| 3 Wrong type | Schema parsing; reject before domain |
| 4 Duplicate/conflict | Domain check + DB unique constraint |
| 5 Permission | Auth check at API boundary |
| 6 Scale | Pagination, `TOP`/`OFFSET`, query timeouts |
| 7 Concurrency | Transactions, idempotency keys, optimistic locking |
| 8 Security-hostile | Parameterized SQL, sanitize/limit text fields, no error leak |

---

## Anti-patterns (do not do this)

**Leaking internals in API responses**

```typescript
// BAD
catch (e: any) {
  return NextResponse.json({ error: e.message }, { status: 500 });
}
```

**Validation only in the UI**

Client-side validation is UX; server-side validation is security. Always validate at the API/domain boundary.

**Business logic in API routes**

```typescript
// BAD — untestable, mixes concerns
export async function POST(req) {
  const body = await req.json();
  if (!body.name) return ...;
  await pool.query(`INSERT INTO VENDORS ... '${body.name}'`);
}
```

**Trusting upstream without documenting the guarantee**

If domain assumes `name` is non-empty, either validate there or document that only validated callers may invoke it — and test at the seam that enforces it.

**Defensive duplication**

Checking the same rule in route, domain, and repository without reason. Pick the owning layer.

---

## Pre-PR defensive checklist

Before opening a PR, confirm:

- [ ] User input validated at API or domain boundary
- [ ] All SQL uses parameterized queries
- [ ] No `any` at HTTP/DB boundaries
- [ ] 4xx vs 5xx used correctly; no stack traces or Key Vault/SQL details in responses
- [ ] Domain logic in `lib/domain/**`, not in routes
- [ ] Tests cover agreed edge-case categories at the stated seam
- [ ] `npx vitest run` passes

---

## Vendor platform specifics

**Entities:** Vendors, Transactions (extend as built)

**Known invariants (enforce in domain + DB where applicable):**

- Vendor `name` required, reasonable max length
- `registration_number` required and unique
- `contact_info` optional but bounded; reject obvious XSS payloads
- Transaction must reference an existing vendor
- Performance scores: deterministic, testable pure functions in domain

**Infrastructure already defensive:**

- `lib/db.ts` — cached pool, env check, Key Vault secret check

---

## When asking Cursor to build something

Include all three references:

> "Build `validateVendorInput` in `lib/domain/vendors/`. Follow `tdd.md` (one failing test first), `edge-cases.md` (categories 2, 3, 8), and `defensive-programming.md` (validate at domain seam, explicit validation errors). Stop after the first Red test."

This keeps the assistant aligned with the full professional workflow.
