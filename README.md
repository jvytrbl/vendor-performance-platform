# Vantage

Vantage (the Vendor Performance Platform) is a signed-in web application for recording vendor transactions and producing periodic vendor performance reports. The application computes every performance figure from recorded transactions; an AI model is used only to write the narrative that explains those figures, and it cannot introduce a number that was not supplied to it. A finalized report is an immutable record, not a draft.

## Features

- **Vendor management** — vendors have a name, a unique registration number, and contact information. A vendor referenced by a transaction or report cannot be deleted. Creating a vendor with a name very similar to an existing one requires confirmation.
- **Transactions** — recorded by bulk CSV/Excel upload (up to 10MB / 50,000 rows) or one row at a time. A transaction referenced by a finalized report cannot be edited or deleted.
- **Performance reports** — a report covers a quarter or a custom date range for selected vendors. For each vendor the application computes nine metrics (on-time delivery rate, average delay, overcharge rate, average overcharge, undercharge rate, shortfall rate, average shortfall, over-delivery rate, average over-delivery) for the current period, the prior period, and the peer average of the other vendors in the report. A metric with no eligible transactions is left undefined, never shown as zero.
- **AI-generated narrative** — four report sections (Vendor Summary, Delivery Performance, Pricing Analysis, Order Accuracy) are drafted by Google Gemini from the computed figures only, validated against the supplied data, and are editable before finalizing.
- **AI Comparative Analysis** — for reports with two or more vendors, a fifth section ranks vendors by delivery, pricing, order accuracy, and overall. The ranking itself is always computed in code (never by the model); the model only explains the trade-offs. The read-only report view rebuilds a ranking table from the report's stored metrics at render time.
- **Draft and finalize workflow** — a draft can be edited or deleted and cannot be finalized while any required section is empty. A finalized report is locked against edits and deletes by a database trigger and can be exported as PDF or Word.
- **Audit log** — every report, vendor, and transaction mutation is recorded in an append-only log (database trigger rejects any update or delete of a log row), viewable and exportable to PDF by approved administrators.
- **Authentication** — Microsoft Entra ID sign-in, restricted by an allowed-tenant list and an allowed-domain/allowed-email list, verified server-side on every request.

## Design principles

- **Deterministic-first, AI only explains.** Every metric and every ranking is computed by the application; the AI model is given the computed values and may only narrate them. Generated narrative that states a number not present in the supplied data is rejected and regenerated.
- **NULL means no data; zero means a measured zero.** A metric with no eligible transactions is left undefined rather than defaulted to zero, so a genuinely good (or bad) zero is never confused with an absence of data.
- **Immutable finalized reports.** Once a report is finalized, a database trigger rejects any update or delete against it, regardless of application-layer logic.
- **Append-only, fail-closed audit log.** Audit log rows cannot be updated or deleted once written (enforced by a database trigger), and an audit row is written in the same database transaction as the action it records — if the audit write fails, the action it would have recorded is rolled back too.

## Tech stack and architecture

- **Framework:** Next.js 16 (App Router), React 19, TypeScript.
- **Styling:** Tailwind CSS v4.
- **Database:** Azure SQL, accessed via the `mssql` driver with hand-written SQL (no ORM).
- **Secrets:** the SQL connection string is stored in Azure Key Vault and retrieved at connection time via `DefaultAzureCredential`; it is never held in an environment variable.
- **Authentication:** Microsoft Entra ID via `@azure/msal-browser`/`@azure/msal-react` on the client. There is no auth middleware — every API route verifies the bearer token's signature, issuer, audience, tenant, and email allow-list itself (via a shared `withAuth` wrapper), per Next.js's own guidance that proxy-level checks are not a substitute for verification at the data layer.
- **AI narrative generation:** Google Gemini (`gemini-3.5-flash-lite`), called directly via its REST API (no SDK dependency).
- **Exports:** `pdf-lib` for PDF generation, `docx` for Word generation.
- **Testing:** Vitest for unit/integration tests, Playwright for end-to-end tests, Stryker for mutation testing.

## Getting started

### Prerequisites

- Node.js (an LTS version; the CI workflow uses `lts/*`)
- Access to the project's Azure SQL database, Azure Key Vault, and Microsoft Entra ID app registration
- A Google Gemini API key

### Install

```bash
npm install
```

### Environment variables

Create a `.env.local` file (see `.gitignore` — `.env*` files are never committed). The variable names below are read directly from `process.env` in the code; values, tenant IDs, and email addresses are not reproduced here.

| Variable | Purpose |
| --- | --- |
| `AZURE_KEY_VAULT_URL` | Key Vault URL used to retrieve the `sql-connection-string` secret |
| `AZURE_CLIENT_ID` | Server-side Entra ID app registration client ID; used as the expected audience when verifying sign-in tokens |
| `NEXT_PUBLIC_AZURE_CLIENT_ID` | The same app registration's client ID, exposed to the browser for MSAL sign-in |
| `ALLOWED_TENANT_IDS` | Comma-separated Entra ID tenant IDs permitted to sign in |
| `ALLOWED_EMAIL_DOMAIN` | Email domain permitted to sign in |
| `ALLOWED_EMAILS` | Comma-separated individual email addresses permitted to sign in outside the allowed domain |
| `AUDIT_LOG_ADMIN_EMAILS` | Comma-separated email addresses permitted to view and export the audit log |
| `GEMINI_API_KEY` | Google Gemini API key used server-side to generate report narratives |

Key Vault and Azure SQL access additionally depend on Azure credentials resolved by `DefaultAzureCredential` (for example, `az login` locally, or a managed identity / service principal in deployment). This codebase does not read those credentials via explicit `process.env` calls, so no specific variable names are asserted here — see the Azure Identity SDK documentation for the credential type in use.

### Database migrations

Schema changes are plain, numbered SQL files in `db/migrations/`, applied manually and in order against Azure SQL — there is no migration runner. A rollback file exists alongside a migration where one has been written (currently `004_audit_log` and `005_ai_comparative_analysis`); earlier migrations have no rollback file.

### Run

```bash
npm run dev    # start the development server
npm run build  # production build
npm start      # run a production build
```

### Test

```bash
npm test                  # Vitest unit/integration tests
npx playwright test       # end-to-end tests (needs a running dev server, E2E_TEST_EMAIL/E2E_TEST_PASSWORD, and a real sign-in)
npx stryker run           # mutation testing (currently scoped to one module; see stryker.config.mjs)
```

The Playwright suite runs against a real dev server and real Azure SQL/Gemini calls — it is not isolated or mocked, and `.github/workflows/playwright.yml` runs it on every push and pull request to `main`.

## Project structure

```
app/            Next.js App Router pages and API routes
components/     React components, grouped by feature area
lib/            Domain logic, repositories, auth, AI, exports, and UI helpers
  domain/       Pure business logic (metrics, ranking, validation)
  repositories/ Database access (mssql queries)
  ai/           Gemini prompt construction and calls
  exports/      PDF/Word report and audit log generation
  auth/         Audit-log admin check and related auth helpers
db/
  migrations/   Numbered, manually-applied SQL migrations and rollbacks
  seed/         Test data seed script
tests/          Playwright end-to-end specs
excel-test-files/  Sample upload files referenced in the requirements document
.adocument/     Requirements and design documentation
```

## Deployment

The application is deployed to Vercel. It depends on externally hosted Azure services that are provisioned separately: Azure SQL (data), Azure Key Vault (the SQL connection string secret), and a Microsoft Entra ID app registration (sign-in). Database migrations are applied manually against Azure SQL; they are not run as part of deployment.

## Security overview

- Sign-in is rejected by default if neither `ALLOWED_EMAIL_DOMAIN` nor `ALLOWED_EMAILS` is configured (fail closed).
- Every API route verifies the bearer token itself — signature, issuer shape, audience, tenant allow-list, and email allow-list — rather than relying on a proxy or middleware check.
- The SQL connection string is stored in Azure Key Vault, not in an environment variable.
- The audit log is append-only at the database level (a trigger rejects any update or delete of a log row) and is written in the same transaction as the action it records.
- A finalized report is locked against edits and deletes by a database trigger, independent of application-layer checks.

## Documentation

- [User Requirements Document](.adocument/URD-PERSONAL-004%201.md)
- [Software Design Document](.adocument/SDD-PERSONAL-002.md)
- [Metrics Reference](.adocument/METRICS-REFERENCE.md) — how the nine metrics, the peer average, the vendor ranking and the narrative checks work ([PDF](.adocument/METRICS-REFERENCE.pdf))

## Project status

The reporting module; vendor and transaction management, report generation with the AI Comparative Analysis section, finalize/export, and the audit log is built and covered by unit, integration, and end-to-end tests. Module 2 (an all-time, cross-report Vendor Scorecard Dashboard) is documented in the requirements but has not been started: `PRODUCT.md` lists it explicitly as out of scope for the current build, and no scorecard-related code exists in `app/`, `components/`, or `lib/`.
