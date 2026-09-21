# Test-Driven Development (TDD)

Use this whenever building a new feature or fixing a bug in vendor-performance-platform test-first — especially for `lib/domain/**` business logic (vendor validation, transaction scoring, performance calculations, etc.).

TDD is the **red → green → refactor** loop. This file is the reference that makes that loop produce tests worth keeping: what a good test is, where tests belong, common mistakes to avoid, and the rules of the loop itself. Consult this **before and during** the loop — not just once at the start and then forgotten.

Use alongside `edge-cases.md` (what to test next) and `defensive-programming.md` (how to make the system safe by design — validation, error handling, layer boundaries). Each TDD cycle often implements a specific defensive behavior identified from the edge-case categories.

---

## What a Good Test Actually Is

A good test verifies **behavior through the public interface**, not internal implementation details. The code inside a function can be rewritten entirely — the test shouldn't need to change, as long as the outward behavior stays the same.

A good test reads like a specification. Its name should describe **what capability exists**, not how it's built.

```typescript
// GOOD — describes WHAT, in plain business terms
test("recording a delivery updates the transaction's actual delivery date", async () => {
  const transaction = createTransaction({ agreedDeliveryDate: "2026-09-01" });
  const updated = await recordDelivery(transaction.id, "2026-09-03");
  expect(updated.actualDeliveryDate).toBe("2026-09-03");
});
```

```typescript
// BAD — describes HOW, coupled to internal steps
test("recordDelivery calls updateTransactionDelivery with correct arguments", async () => {
  const spy = jest.spyOn(repo, "updateTransactionDelivery");
  await recordDelivery(transaction.id, "2026-09-03");
  expect(spy).toHaveBeenCalledWith(transaction.id, "2026-09-03");
});
```

The first test survives a refactor (e.g. changing which repository method gets called internally). The second one breaks the moment you refactor internals, even though nothing about actual behavior changed — a false alarm that trains you to stop trusting your own tests.

**Characteristics of a good test:**
- Tests behavior a real user or calling code actually cares about
- Uses only the public API (the exported function, the API route, the component's visible output) — never reaches into private/internal pieces
- Survives internal refactors untouched
- One clear, logical assertion focus per test
- Named like a sentence describing a capability, not a function's internal steps

---

## Seams — Where Tests Belong

A **seam** is a public boundary: the interface where you can observe behavior from the outside, without reaching inside to check internal steps. Tests live at seams — never against internals.

**In vendor-performance-platform, typical seams look like:**
- A pure function in `lib/domain/**` (e.g. `validateVendorInput`, `calculateVendorScore`, `createVendor`) — the seam is its inputs and return value
- An API route in `app/api/**` — the seam is the request in, the response out (status code + JSON body)
- A React component — the seam is what renders on screen / what a user can click, not internal state variables

Defensive guarantees (validation, error codes, safe responses) should be testable at these same seams — see `defensive-programming.md`.

**Agree on the seam before writing the test.** Before writing any test, be clear (even just to yourself, or state it in your Cursor prompt) about exactly what boundary you're testing. You can't test everything — deciding the seam up front is what keeps testing effort on the behavior that actually matters (the on-time delivery calculation, the fuzzy vendor-name match, the Draft → Finalized report transition) instead of scattering effort across every trivial internal detail.

A useful question to ask yourself before every test: *"What's the public interface here, and what seam am I actually testing?"*

---

## Mocking — When to Fake Something

Mock only at **system boundaries** — the edges of your code where it talks to something outside your control:

- External APIs (Google Gemini API, Azure Key Vault, Microsoft Entra ID's JWKS endpoint)
- The database (`mssql` calls) — prefer a real test database/schema when practical; mock only when that's not feasible
- Time or randomness (e.g. `new Date()` when computing the current quarterly period boundaries)
- The file system, if ever touched directly

**Do NOT mock:**
- Your own domain logic functions (`lib/domain/**`)
- Internal collaborators within the same module
- Anything you actually control and can just run for real in a test

**Plain rule of thumb:** if faking it means you'd be testing "did I call the fake correctly" instead of "did the real behavior happen," you're mocking the wrong thing.

### Designing code so it's easy to mock later

**1. Pass dependencies in, don't create them inside the function**

```typescript
// EASY to test — dependency passed in, can swap a fake in tests
function generateNarrative(metrics, aiClient) {
  return aiClient.generateContent(buildPrompt(metrics));
}

// HARD to test — creates its own dependency internally, can't substitute it
function generateNarrative(metrics) {
  const aiClient = new GeminiClient(process.env.GEMINI_API_KEY);
  return aiClient.generateContent(buildPrompt(metrics));
}
```

**2. Prefer specific, named functions over one generic catch-all**

```typescript
// GOOD — each call is independently mockable, one clear shape per function
const vendorsApi = {
  getVendor: (id) => fetch(`/api/vendors/${id}`),
  createVendor: (input) => fetch(`/api/vendors`, { method: "POST", body: JSON.stringify(input) }),
};

// BAD — one generic function, mocking requires conditional logic to figure out which "kind" of call it is
const vendorsApi = {
  call: (endpoint, options) => fetch(endpoint, options),
};
```

---

## Anti-Patterns to Avoid

**Implementation-coupled tests** — mocking your own internal collaborators, testing private/unexported functions, or verifying success by checking a side channel (e.g. querying the SQL table directly) instead of going through the real interface.

```typescript
// BAD — bypasses the actual interface to check the database directly
test("createVendor saves to database", async () => {
  await createVendor(vendorInput);
  const row = await db.query("SELECT * FROM VENDORS WHERE registration_number = ?", [vendorInput.registrationNumber]);
  expect(row.name).toBe(vendorInput.name);
});

// GOOD — verifies through the same interface the app actually uses
test("createVendor makes the vendor retrievable via getVendor", async () => {
  const created = await createVendor(vendorInput);
  const vendor = await getVendor(created.id);
  expect(vendor.name).toBe(vendorInput.name);
});
```
The tell-tale sign of this anti-pattern: the test breaks when you refactor, even though real behavior hasn't changed.

**Tautological tests** — the expected value is calculated the same way the code calculates it, so the test can never actually catch a wrong calculation. It passes by construction, not because the logic is correct.

```typescript
// BAD — expected value is computed with the same formula as the code under test
test("calculateOnTimeDeliveryRate computes correctly", () => {
  const transactions = [{ onTime: true }, { onTime: true }, { onTime: false }, { onTime: true }];
  const expected = (transactions.filter((t) => t.onTime).length / transactions.length) * 100;
  expect(calculateOnTimeDeliveryRate(transactions)).toBe(expected);
});

// GOOD — expected value is an independent, hand-picked known number
test("calculateOnTimeDeliveryRate computes correctly", () => {
  const transactions = [{ onTime: true }, { onTime: true }, { onTime: false }, { onTime: true }];
  expect(calculateOnTimeDeliveryRate(transactions)).toBe(75); // 3 of 4 on time = 75%
});
```

**Horizontal slicing** — writing ALL the tests for a feature first, then writing ALL the implementation afterward. This is the single most common mistake an AI coding assistant makes with TDD if not explicitly told otherwise.

Why it's a trap: tests written this way verify *imagined* behavior — what you guessed the code should do — rather than behavior confirmed step by step as it's actually built. The tests tend to check the general *shape* of things rather than real edge cases, and by the time you write the implementation, you're locked into a test structure decided before you understood the problem.

**The correct approach — vertical slicing:** one seam → one test → the minimal code to pass it → repeat. Each cycle is a small, complete round trip, and each new test is informed by what the previous cycle taught you — not planned out in bulk beforehand.

---

## The Rules of the Loop

1. **Red before green.** Always write the failing test first. Run it. Confirm it actually fails before writing any implementation. Don't write test and implementation in the same breath.
2. **Minimal implementation only.** Write just enough code to make the current failing test pass — nothing more. Don't add functionality "while you're in there" that no test is asking for yet.
3. **One slice at a time.** One seam, one test, one minimal implementation, per cycle. Resist the urge to write several tests upfront (horizontal slicing).
4. **Confirm before moving on.** After Red, confirm the test actually fails. After Green, confirm it actually passes. Never assume — actually run `npx vitest run` at each step.
5. **Refactor is a separate, optional step — after green, not instead of green.** Once a test passes, you may clean up naming/structure without changing behavior, then re-run the test to confirm it's still green. Don't skip straight to "make it elegant" before it even works.

---

## Applying This Day-to-Day in vendor-performance-platform

When asking Cursor (or any AI assistant) to build something in this project:

- Point it at the specific seam first — e.g. "let's build `validateVendorInput` in `lib/domain/vendors/`, the seam is: given raw vendor input, it returns validated data or explicit validation errors."
- Walk edge-case categories per `edge-cases.md` and defensive rules per `defensive-programming.md` — agree which failure modes to defend first.
- Ask for ONE failing test only, and stop there.
- Run it yourself (`npx vitest run`) — don't just trust a claim that it "should fail."
- Once confirmed Red, ask for the minimal implementation — nothing extra.
- Run the test again yourself to confirm Green.
- Only then, optionally, ask for a refactor pass — and re-run the test afterward to confirm it's still passing.
- Repeat for the next behavior (e.g. "what happens if registration_number is duplicated" — that's the next seam/test, not something to add speculatively into the first implementation).