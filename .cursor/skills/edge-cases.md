# Identifying Edge Cases

Use this alongside `tdd.md` and `defensive-programming.md` whenever deciding what the NEXT test case should be, for any function, API route, or component in this project. Where `tdd.md` covers the Red → Green → Refactor process, this file covers *what to actually test* — how to systematically think through likely edge cases instead of guessing at random. Where `defensive-programming.md` covers *how to defend* (validation, error shape, layer ownership), each relevant category here becomes a concrete defensive test in the TDD loop.

---

## The core principle: categories, not creativity

Don't try to "brainstorm" edge cases from nothing. Instead, walk through the fixed categories below, one at a time, and ask **"does this category apply to what I'm building right now, and if so, what should happen?"**

This is a checklist to run through, not a creativity exercise.

---

## The 8 categories

### 1. Boundary values
If a rule involves a number, length, or limit, test right at the edge, one below, and one above.
*Example: `item_description` has a 500-character limit — test at exactly 500 (should pass), 501 (should fail); `agreed_price` must be `> 0` — test at 0 (should fail) and the smallest valid positive value (should pass).*

### 2. Empty / null / missing
What happens when something that's supposed to have a value doesn't?
*Example: empty vendor `name`, missing `registration_number`, `actual_delivery_date` left `NULL` before a delivery occurs. This project draws a hard line between "no data yet" (`NULL`) and "measured zero" (`0`) — a metric with zero eligible transactions must stay `NULL`, not be computed as `0`.*

### 3. Wrong type / malformed data
What if the data isn't even the shape expected?
*Example: `vendor_id` arrives as a string instead of a number on a transaction payload; `agreed_price` arrives as the string `"100"` instead of a number; a bulk-upload row has a date column that isn't a parseable date.*

### 4. Duplicate / conflicting state
What if something that should be unique isn't, or two pieces of data contradict each other?
*Example: creating a vendor whose name is a 90%-similar match to an existing vendor's name (per the SDD's 85% similarity threshold, this should surface the match for confirmation, not silently create a duplicate); or a second metric-computation run for the same `(report_id, vendor_id, period_start)` hitting the composite unique constraint.*

### 5. Permission / authorization edge cases
What if the right action is attempted by the wrong person or role?
*Example: a request without a valid Entra ID Bearer token attempting to call any route — every route on this platform requires authentication even though there is no role-based gating (all three roles — Procurement Staff, Report Reviewer, System Administrator — are currently performed by the same single user, per the SDD).*

### 6. Extreme scale
What if there's far more (or less) data than typically expected?
*Example: a bulk transaction upload containing thousands of rows; a Scorecard Dashboard with hundreds of vendors sorted by a metric column.*

### 7. Concurrent / timing issues
What if two things happen at nearly the same moment?
*Example: two `POST /api/reports/:id/generate` requests firing for the same report at nearly the same time — a real, explicitly-flagged risk in this project (the SDD requires the second request be rejected with a message that generation is already in progress).*

### 8. Security-hostile input
What if the input is deliberately malicious, not just accidentally wrong?
*Example: script tags or HTML in a transaction's `item_description`; SQL-injection-shaped strings in a vendor's `contact_info`; a bulk-upload CSV cell crafted as a spreadsheet-formula-injection payload.*

---

## The judgment call — do NOT apply all 8 blindly

Not every category is relevant to every function. Testing all 8 categories for every single piece of logic, regardless of actual risk or likelihood, wastes effort and violates the "pre-agreed seams" principle in `tdd.md` — testing effort should land on the seams and categories that actually matter, not everywhere uniformly.

**Before writing a test for a given category, ask:**
1. **Can this situation actually happen**, given how this function is really called and what upstream validation already exists? If a value is already guaranteed non-null by the time it reaches this function, don't test this function for `null` — that seam belongs elsewhere (e.g. the API route, or wherever the guarantee is enforced). See layer ownership in `defensive-programming.md`.
2. **Does it matter if this goes wrong?** Low-stakes, internal-only, low-traffic features may reasonably skip categories like "extreme scale" or "concurrent timing" if the realistic risk is negligible.
3. **Is this genuinely a new behavior, or does it duplicate an existing test?** If two categories would produce the same underlying test (e.g. two different "invalid input" tests that both get rejected by the same validation line), consolidate rather than pad the test count.

**When a category's relevance is unclear, ask the user rather than assuming.** State which category you're considering and why, and let the user confirm it's worth a test before writing one. A skipped category is a legitimate, deliberate decision — not an oversight — as long as it was actually considered and consciously set aside, not simply never thought of.

---

## Applying this in a TDD cycle

When starting a new domain function or expanding an existing one:

1. State the seam being tested (per `tdd.md`).
2. List invariants and decide which layer owns each defense (per `defensive-programming.md`).
3. Walk the 8 categories mentally against that seam. For each one that plausibly applies, note it and the defensive technique (see edge category → defensive technique table in `defensive-programming.md`).
4. Present the candidate list to the user before writing tests — e.g. "For `validateVendorInput`, categories 2 (empty name), 4 (duplicate `registration_number`), and 8 (security-hostile `contact_info`) seem relevant; boundary values and concurrency don't apply to this function. Want to proceed with those three?"
5. Once agreed, take them one at a time as separate Red → Green cycles — never write tests for multiple categories at once (this would violate the vertical-slicing rule in `tdd.md`).