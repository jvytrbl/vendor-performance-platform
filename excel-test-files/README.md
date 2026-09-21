# Bulk Upload Test Files — Phase 2

Real vendor IDs used: 2 (Gamuda Berhad), 4 (Gamuda Land), 6 (Trisystem Engineering Sdn Bhd) — pulled from your actual VENDORS table. 999 is used throughout as a deliberately nonexistent vendor ID.

| File | Tests | Expected result |
|---|---|---|
| 01_valid_all_rows.csv | Happy path — all rows valid, mix of optional fields present/absent | All 5 rows inserted, zero errors |
| 02_missing_required_column.csv | FR-SH-007 — agreed_price column entirely missing from header | Whole file rejected before any row processing, error names the missing column |
| 03_mixed_valid_invalid_rows.csv | FR-SH-010 — per-row skip and report | 4 rows valid and inserted; 4 rows rejected (empty description, nonexistent vendor 999, negative price, unparseable date) each with correct `{row, error, code, field}` |
| 04_all_invalid_rows.csv | Every row fails for a different reason | Zero rows inserted, 5 distinct per-row errors returned |
| 05_boundary_values.csv | Category 1 — boundaries: 2000-01-01 date floor, exactly 500-char description (pass), 501-char (fail), price/quantity = 0 (fail), delivery before transaction date (fail), future-dated transaction (fail) | Row 1 valid; rows 2 valid (500 chars exactly); rows 3, 4, 5, 6, 7 rejected |
| 06_security_hostile_input.csv | Category 8 — script tags, HTML, SQL-injection-shaped strings, embedded commas/quotes | All rows should be accepted as literal text (stored safely, never executed/interpreted) — confirms parameterized queries + auto-escaping, not sanitization-by-stripping |
| 07_wrong_types_malformed.csv | Category 3 — non-numeric vendor_id, decimal vendor_id, non-numeric price, negative quantity, impossible calendar date (31/02) | All 5 rows rejected with type/format-specific error messages |
| 08_row_cap_over_1000.csv | Cursor's proposed 1000-row threshold (1001 rows) | Confirm with Cursor what should happen at this specific number before treating a result as pass/fail |
| 09_large_valid_batch_500rows.csv | A large but valid batch, clearly under any proposed cap | All 500 rows process successfully — sanity check that normal large files aren't accidentally penalized |
| 10_row_cap_over_NFR014_50000.csv | NFR-014's explicit 50,000-row ceiling (50,001 rows, ~3.2MB — under the 10MB size limit so this isolates the row-count check specifically) | Whole file rejected before row-level processing begins, per NFR-014 |
| 11_valid_and_vendor_check_native_xlsx.xlsx | Real .xlsx (not CSV renamed) — native Excel date-typed cells, mixed valid rows, nonexistent vendor, empty description | Use this to empirically verify exceljs's actual date-cell return type before writing the .xlsx-path test, per Cursor's own flagged unknown |

## Notes

- File 10 is large (~3.2MB) — expect it to take a moment to open/upload.
- Files 08 and 10 are randomly generated with a fixed seed (42) — re-running the generation script would reproduce identical content, useful if a file needs regenerating.
- None of these files have been run against your actual system yet — they're built directly from FR-SH-007, FR-SH-010, NFR-014, and the edge-case categories your project already uses, not guessed generically.
