## USER REQUIREMENTS DOCUMENT

## Vendor Performance Intelligence Platform

Recurring Reporting | AI-Assisted Analysis | Vendor Scorecard Dashboard

| Field | Value |
| --- | --- |
| Document Reference | URD-PERSONAL-002 |
| Version | 4.0 |
| Date | 3 September 2026 |
| Prepared by | Hakimi Azizi |
| Project | Personal Capstone — Vendor Performance Intelligence Platform |
| Status | Pending Review |
| Classification | Internal — Personal Learning Use |


## 1. Introduction

## 1.1 Purpose

This User Requirements Document (URD) defines the functional and non-functional requirements for the Vendor Performance Intelligence Platform, a system for tracking, analysing, and reporting on vendor performance based on recorded transaction history. The document serves as the authoritative reference for the developer and reviewing stakeholder to ensure the delivered system meets the intended requirements for vendor performance monitoring, evidence- based reporting, and quantitative vendor comparison.

The system is designed around a core principle: vendor performance judgements, whether presented as computed figures or as AI-generated narrative, must be traceable to actual recorded transaction data rather than general assumptions. This principle governs the design of both modules described in this document.

## 1.2 Scope

The platform covers the recording of vendor transaction data, the periodic generation of AI-assisted performance reports, and a continuously available performance dashboard. Vendor and transaction data entry is treated as shared infrastructure supporting both modules described below.

The following are in scope:

- Recording of vendor records and their transaction history via bulk file upload or manual single-entry

- Computation of quantitative performance metrics across three benchmarks: delivery timing, pricing consistency, and order accuracy

- Periodic generation of AI-assisted vendor performance reports, combining computed metrics with narrative explanation

- A continuously available dashboard summarising all-time vendor performance across all recorded vendors, with drill-down to individual transaction history

The following are out of scope:

- Bid comparison or competing-vendor evaluation

- Multi-user access control or department-based data segregation

- Evaluation of vendor quality of goods/services or vendor responsiveness

- Integration with external procurement, ERP, or accounting systems

## 1.3 Intended Audience

| Audience | Purpose |
| --- | --- |
| Developer | Primary implementation reference |
| Senior Engineer | Technical review and sign-off |
| Future Developer (self, subsequent modules) | Reference for extending or building upon this system's data model and reporting patterns |


## 2. System Overview

## 2.1 Module Context

The platform is composed of one shared data layer and two functional modules, all delivered as a single Next.js application:

- Vendor & Transaction Data Management — the shared data entry layer through which vendor records and their transaction history enter the system, via bulk file upload or manual single-entry. Both functional modules described below read from this same underlying data.

- Module 1 — Recurring Vendor Performance Reports — generates a periodic report per vendor, quantifying delivery timing, pricing consistency, and order accuracy for a selected reporting period, with AI-generated narrative explanation comparing the vendor's current-period metrics against their own prior period and against the average of other vendors included in the same report.

- Module 2 — Vendor Scorecard Dashboard — provides a continuously available, sortable, and filterable view of all-time vendor performance across all recorded vendors, with drill-down to a vendor's complete transaction history. This module performs no AI generation.

Microsoft Entra ID (Azure AD) provides authentication for the platform. Google Gemini serves as the AI provider for Module 1's narrative generation, invoked exclusively from server-side application code.

## 2.2 Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend/Backend | Next.js (App Router) |
| Authentication | Microsoft Entra ID (Azure AD), via MSAL |
| Database | Azure SQL Database |
| AI Integration | Google Gemini API (server-side only) |
| Styling | Tailwind CSS |

## 2.3 User Roles

| Role | Description | Access Level |
| --- | --- | --- |
| Procurement Staff | Maintains vendor records and transaction history via bulk upload or manual entry; the primary source of data entering the system. | Create, Edit (vendors, transactions) |
| Report Reviewer | Generates performance reports, reviews and edits AI-drafted narrative content, and finalizes reports once satisfied with accuracy | View, Edit (Draft reports), Finalize |
| System Administrator | Resolves ambiguous vendor, matches during data entry, manages vendor master data governance, and maintains underlying system configuration | Full Administrative access |

This platform is currently implemented for single-user operation, with one individual performing all roles described above. The roles are defined separately to reflect the distinct responsibilities genuinely present in the platform's workflow; data entry, report generation and review, report consumption, and system administration, even though they are not yet enforced as separate access levels. Role-based access control, restricting each role to only its corresponding functionality, is identified as a candidate enhancement for a future phase, should the platform be extended to multiple concurrent users.


## 3. Functional Requirements

The following sections define the detailed functional requirements for each component of the platform. Requirements are assigned a unique ID and priority for traceability.

Priority Key: H = High (Must Have) | M = Medium (Should Have) | L = Low (Nice to Have)

## 3.1 Shared Data Entities

| ID | Requirement | Priority | Source |
| --- | --- | --- | --- |
| FR-SH-001 | The system shall maintain a list of vendors, each with a name, registration number, and contact information. Registration number shall be unique per vendor. | H | Developer |
| FR-SH-002 | Before a new vendor record is created, the system shall compare the entered name against existing vendor names using a defined string-similarity method. A similarity score of 85% or higher shall be presented to the user for confirmation before a new record is created. | M | Technical Review |
| FR-SH-003 | A vendor record shall not be deletable while referenced by any transaction or report. | H | Developer |
| FR-SH-004 | The system shall support adding vendor transaction records via bulk file upload (CSV/Excel) and via manual single-entry. | H | Developer |
| FR-SH-005 | Each transaction record shall capture: vendor, transaction date, item/service description, agreed price, actual price, agreed delivery date, actual delivery date, quantity ordered, and quantity received. | H | Developer |
| FR-SH-006 | During bulk upload processing, each row’s vendor name shall be compared against existing vendor records using the method defined in FR-SH-002. | H | Technical Review |
| FR-SH-007 | Prior to row-level processing, an uploaded file's column headers shall be checked against the full set of required fields (FR-SH-005). If any required column is absent, the entire upload shall be rejected, and the user informed which columns are missing. Columns present beyond the required set shall be ignored without causing failure. | H | Technical Review |
| FR-SH-008 | A transaction record shall be editable or deletable while no report referencing it has been Finalized | H | Developer |
| FR-SH-009 | A transaction record referenced by a Finalized report shall not be editable or deletable, to preserve the integrity of the figures used in the report. | H | Developer |
| FR-SH-010 | Where uploaded file headers match the required structure, but an individual row contains an invalid data type, an invalid date, or a value violating a defined business rule, that row shall be skipped and reported to the user with its row number and reason. Valid rows within the same file shall be processed and saved regardless of other rows’ validity. | H | Technical Review |
| FR-SH-011 | When a user attempts to edit or delete a transaction record referenced by a Finalized report, the system shall reject the action and display a message stating that the transaction is locked because it is referenced by a Finalized report, identifying the report by its reference number | H | Developer |

## 3.2 Module 1 — Recurring Vendor Performance Reports

| ID | Requirement | Priority | Source |
| --- | --- | --- | --- |
| FR-M1-001 | The user shall be able to generate a Vendor Performance Report for a Quarterly period (default) or a Custom date range. | H | Developer |
| FR-M1-002 | The user shall select which vendors to include in a report before generation. | H | Developer |


| ID | Requirement | Priority | Source |
| --- | --- | --- | --- |
| FR-M1-003 | A report shall contain the following sections: Vendor Summary, Delivery Performance, Pricing Analysis, and Order Accuracy. | H | Developer |
| FR-M1-004 | For each included vendor, the system shall compute the following metrics for the selected period and for the immediately preceding period of equal length: on-time delivery rate, average delay (days), overcharge rate, average overcharge percentage, undercharge rate, shortfall rate, average shortfall (units), over-delivery rate, and average over-delivery (units). Metric computation shall be performed by application logic. Transactions with a NULL value in the field relevant to a given metric shall be excluded from that metric’s calculation rather than treated as a failing or zero result. Where a metric has no eligible transactions in the period, the result shall be recorded as undefined | H | Technical Review |
| FR-M1-005 | The system shall compute the average of each metric across all other vendors included in the same report and period, as a peer comparison baseline. | H | Technical Review |
| FR-M1-006 | Computed metrics (current period, prior period, peer average) shall be supplied to the AI model as a structured data object containing named fields for each metric. The AI model shall generate narrative text explaining these values and shall not introduce any numeric value absent from the supplied data. | H | Technical Review |
| FR-M1-007 | Prior to being shown to the user, generated narrative content shall be checked by extracting every numeric value it contains and confirming each one matches a value present in the structured data supplied for that generation. Narrative content containing a numeric value not found in the supplied data shall be rejected, and generation shall be retried rather than shown to the user. | M | Technical Review |
| FR-M1-008 | Narrative characterizations of vendor performance (e.g. improving, declining, stable) shall reference comparison against both the vendor's prior-period metrics and the current-period peer average; a characterization shall not be generated without an accompanying comparison justifying it. | H | Technical Review |
| FR-M1-009 | Generated report content shall be presented as an editable Draft. The user shall be able to edit any section before marking the report Finalized. | H | Developer |
| FR-M1-010 | The system shall retain a historical archive of all reports, supporting period- over-period comparison. | H | Developer |
| FR-M1-011 | A Finalized report shall be exportable as PDF and as Word (.docx). File generation shall be performed server-side from the report's stored content; generated files shall not be produced or assembled in the browser. | H | Developer |
| FR-M1-012 | A report in Draft status shall be deletable. A Finalized report shall not be deletable. | H | Developer |
| FR-M1-013 | A report shall not be permitted to transition to Finalized status while any of its four section fields (Vendor Summary, Delivery Performance, Pricing Analysis, Order Accuracy) remain empty. | H | Technical Review |


## 3.3 Module 2 — Vendor Scorecard Dashboard

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-M2-001 | The system shall display a dashboard listing all vendors with at least one recorded transaction, showing each vendor's all-time on-time delivery rate, overcharge rate, shortfall rate, and over- delivery rate. | H |
| FR-M2-002 | The dashboard shall be sortable by any metric column, ascending or descending. Vendors with insufficient data for the selected sort column shall be grouped separately at the end of the list, regardless of sort direction, rather than being ordered as if they held a real value. | H |
| FR-M2-003 | The dashboard shall allow the user to set a minimum valid-record threshold. For each displayed metric independently, if the number of transactions containing valid data for that specific metric falls below the threshold, that metric shall be shown as insufficient data rather than a calculated value, regardless of the vendor's total transaction count. | M |
| FR-M2-004 | Selecting a vendor on the dashboard shall open a detail view listing that vendor's complete transaction history. | H |

## 4. Non-Functional Requirements

| ID | Category | Requirement |
| --- | --- | --- |
| NFR-001 | Security | All application data shall be accessible only to authenticated users via Azure AD SSO. |
| NFR-002 | Security | AI API credentials and database connection string shall be stored in Azure Key Vault; application code shall retrieve them at startup and cache in memory, rather than storing them directly as a plaintext environment variable or re-fetching them on every request. |
| NFR-003 | Security | All database queries shall use parameterized statements. |
| NFR-004 | Security | Uploaded files shall be validated for expected structure prior to processing (FR-SH-007). Displayed text shall rely on the frontend framework's default escaping, never raw HTML rendering. Exported PDF/Word content shall use the export library's safe text-insertion method, not direct string concatenation. |
| NFR-005 | Usability | AI generation and file processing operations shall display a loading indicator. |
| NFR-006 | Usability | Validation errors, including bulk upload row-level errors, shall identify the specific row and field at fault. |
| NFR-007 | Reliability | AI report generation shall be structured to complete within the hosting platform's execution time limit. Content shall only be saved after the AI response is fully received and validated (FR-M1-007); no partial content shall be written. If generation times out, the system shall report that nothing was saved and allow retry. |
| NFR-008 | Cost | The application shall operate within the free-tier limits of its cloud and AI service providers. |
| NFR-009 | Data Integrity | Finalized reports shall be immutable and non-deletable, enforced at both the application layer (rejecting edits before they reach the database) and the database layer (a trigger blocking modification of any Finalized row, regardless of source). Vendor records referenced by any transaction or report shall not be deletable. |
| NFR-010 | Accuracy | All quantitative metrics presented to the user shall be computed by deterministic application logic, not by the AI model. |
| NFR-011 | Reliability | If a save operation on a Draft report fails due to an expired authentication session, the system shall retain the unsaved content in browser session storage, redirect the user to re- authenticate, and restore the retained content into the form upon successful re- authentication. The retained content shall consist solely of the report’s editable text fields. Authentication tokens or credentials shall never be included in this retained content. |
| NFR-012 | Cost Control | The system shall prevent duplicate or rapid repeated AI generation requests for the same report arising from accidental resubmission, to avoid unnecessary consumption of AI API quota. This shall be enforced by checking whether a generation is already in progress for |


| ID | Category | Requirement |
| --- | --- | --- |
|   |   | the given report before starting a new one. While a generation is in progress, further generation requests for that report shall be rejected with a message indicating that generation is already underway |
| NFR-013 | Reliability | If the AI provider returns a rate-limit error (HTTP 429), the system shall retry the request using exponential backoff. It’s starting at 1-second delay and doubling after each subsequent failure (1s, 2s, 4s), up to maximum of 3 retry attempts. If all attempts fail, the system shall inform the user that AI generation is temporarily unavailable rather than continuing to retry. |
| NFR-014 | Reliability | Bulk file upload shall be limited to a maximum file size of 10MB and a maximum of 50,000 rows per file. Files exceeding either limit shall be rejected before any row-level processing begins, with a message stating which limit was exceeded. |

## 5. Data Requirements

## 5.1 VENDORS

| Column | Type | Null | Description |
| --- | --- | --- | --- |
| id | int | NO | Primary key, IDENTITY(1,1) |
| name | nvarchar(200) NO |   | Vendor name |
| registration_number | nvarchar(50) | NO | Business registration number; UNIQUE |
| contact_info | nvarchar(500) NO |   | Contact details |
| created_at | datetime2 | NO | Default GETUTCDATE() |

## 5.2 VENDOR_TRANSACTIONS

| Column | Type | Null | Description |
| --- | --- | --- | --- |
| id | int | NO | Primary key, IDENTITY(1,1) |
| vendor_id | int | NO | FK to VENDORS, ON DELETE RESTRICT |
| transaction_date | date | NO | Date of transaction |
| item_description | nvarchar(500) NO |   | Item/service description |
| agreed_price | decimal(12,2) | NO | Agreed price |
| actual_price | decimal(12,2) | YES | Actual price charged; NULL until delivery/invoice is recorded |
| agreed_delivery_date date |   | NO | Promised delivery date |
| actual_delivery_date | date | YES | Actual delivery date; NULL until delivery occurs |
| quantity_ordered | decimal(10,2) | NO | Quantity ordered |
| quantity_received | decimal(10,2) | YES | Quantity actually received; NULL until delivery occurs |
| created_at | datetime2 | NO | Default GETUTCDATE() |


## 5.3 VENDOR_PERFORMANCE_REPORTS

| Column | Type | Null | Description |
| --- | --- | --- | --- |
| id | int | NO | Primary key, IDENTITY(1,1) |
| reference_number | nvarchar(30) | NO | Human-readable reference |
| period_type | nvarchar(20) | NO | 'Quarterly' or 'Custom' |
| period_start | date | NO | Report period start |
| period_end | date | NO | Report period end |
| status | nvarchar(20) | NO | 'Draft' or 'Finalized', default 'Draft' |
| vendor_summary | nvarchar(MAX) YES |   | Report section content |
|   | delivery_performance nvarchar(MAX) YES |   | Report section content |
| pricing_analysis | nvarchar(MAX) YES |   | Report section content |
| order_accuracy | nvarchar(MAX) YES |   | Report section content |
| created_at | datetime2 | NO | Default GETUTCDATE() |
| finalized_at | datetime2 | YES | Timestamp when finalized |

## 5.4 VENDOR_PERFORMANCE_REPORT_VENDORS

Linking table associating reports with the vendors included in them.

| Column | Type | Null | Description |
| --- | --- | --- | --- |
| report_id | int | NO | FK to VENDOR_PERFORMANCE_REPORTS |
| vendor_id | int | NO | FK to VENDORS |


## 5.5 VENDOR_PERFORMANCE_METRICS

Stores computed metrics per vendor per period. Populated both when a report is generated and, for dashboard purposes, as an all-time aggregate per vendor.

| Column | Type | Null | Description |
| --- | --- | --- | --- |
| id | int | NO | Primary key, IDENTITY(1,1) |
| report_id | int | YES | FK to VENDOR_PERFORMANCE_REPORTS; NULL for dashboard aggregation. Part of composite unique constraint. |
| vendor_id | int | NO | FK to VENDORS. Part of composite unique constraint |
| period_start | date | NO | Period covered. Part of composite unique constraint |
| period_end | date | NO | Period covered |
| on_time_delivery_rate decimal(5,2) |   | YES | NULL if no completed deliveries in period |
| avg_delay_days | decimal(6,2) | YES | NULL if no completed deliveries; 0 if completed but none late |
| overcharge_rate | decimal(5,2) | YES | NULL if no priced transactions in period |
| avg_overcharge_pct | decimal(6,2) | YES | NULL if no priced transactions; 0 if priced but none overcharged |
| undercharge_rate | decimal(5,2) | YES | NULL if no priced transactions in period |
| shortfall_rate | decimal(5,2) | YES | NULL if no transactions with recorded quantity in period |
| avg_shortfall_units | decimal(10,2) | YES | NULL if no recorded quantity; 0 if none fell short |
| overdelivery_rate | decimal(5,2) | YES | NULL if no transactions with recorded quantity in period |
| avg_overdelivery_units decimal(10,2) |   | YES | NULL if no recorded quantity; 0 if none over-delivered |
| transaction_count | int | NO | Number of transactions in period |

Note: A composite unique constraint (report_id, vendor_id, period_start) shall be enforced on this table to prevent duplicate metric rows from multiple report generation runs for the same vendor and period.

## 6. Assumptions & Constraints

## 6.1 Assumptions

- The user maintains vendor transaction records in a working file (e.g. spreadsheet) prior to entry into the system as part of normal working practice, which is periodically uploaded into the platform. This is the basis for treating bulk upload, rather than manual single-entry, as the primary data-entry method.

- The procurement domain modelled by this platform is one broadly applicable to organisations that rely on external vendors for goods or services, and is not tied to the data structures or systems of any specific organisation.

- All data used with the platform during development and demonstration is non-production and does not contain real vendor or transaction information.

- The platform is operated by a single user, and no requirement in this document assumes or depends on multiple concurrent users with differentiated access.

- The Google Gemini API is assumed to remain available under its published free-tier terms for the duration of the platform's development and use; changes to those terms by the provider are outside the platform's control.


## 6.2 Constraints

- The application shall operate entirely within the free-tier limits of all cloud and AI services used, including Azure Active Directory, Azure SQL Database, and the Google Gemini API.

- Vendor performance is evaluated only across the three benchmarks defined in this document: delivery timing, pricing consistency, and order accuracy. Quality of goods or services and vendor responsiveness are not evaluated, as the current data model does not capture either.

- AI-generated content is limited to explanatory narrative of metrics computed in advance by deterministic application logic; the AI model does not perform calculation, estimation, or inference of numeric values.

- The platform's hosting environment imposes a maximum execution time per server-side operation; AI report generation is designed with this constraint in mind, as reflected in NFR-007.

- The platform uses its own dedicated authentication tenancy and database, independent of any other system or organisation's infrastructure.

## 7. Glossary

| Term | Definition |
| --- | --- |
| Vendor | An external supplier from whom goods or services are procured. |
| Transaction | A single recorded instance of a vendor order, including agreed and actual price, delivery dates, and quantities. |
| Benchmark | One of three measured dimensions of vendor performance: delivery timing, pricing consistency, and order accuracy. |
| Peer average | The average value of a metric across all other vendors included in a given report and period. |
| Draft | The initial, editable status of a generated report, prior to finalization. |
| Finalized | The locked, immutable, and permanently retained status of a report once confirmed by the user. |
| Grounding | The practice of constraining AI-generated output to explicitly supplied, pre-verified data, preventing the introduction of unsupported or fabricated figures. |
| MSAL | Microsoft Authentication Library — the library used to integrate Azure Active Directory sign-in into the platform. |
| SSO | Single Sign-On — authentication using an existing Microsoft account across the platform, without a separate username and password. |

## 8. Management Approval

This User Requirements Document requires review and sign-off from the following reviewer before development proceeds.

| Name | Designation | Signature | Date |
| --- | --- | --- | --- |
| Geogory Mui | Senior Software Developer |   |   |

By signing above, the reviewer confirms they have reviewed this User Requirements Document and its associated functional, non-functional, and data requirements.


## 9. Document Revision History

| Rev. | Date | Author | Notes |
| --- | --- | --- | --- |
| 1.0 | 14 Aug 2026 Software | Developer | Initial draft — three-module system covering recurring reporting, cross- department synthesis, and bid comparison. |
| 2.0 | 17 Aug 2026 | Software Developer | Removed cross-department synthesis module as redundant with recurring reporting; introduced explicit AI grounding requirements for narrative generation. |
| 3.0 | 23 Aug 2026 | Software Developer | Replaced bid comparison module with a non-AI vendor scorecard dashboard following review of AI necessity; expanded performance metrics from a blended five-metric set to a precisely defined nine-metric set across three benchmarks; reprioritized bulk upload as the primary data-entry workflow; corrected schema fields identified as incorrectly nullable. |
| 4.0 | 3 September 2026 | Software Developer | Restructured document to align with organisational URD format, including expanded Introduction, System Overview, and Assumptions & Constraints sections; added Glossary and Management Approval sections; updated document date and revision history to reflect status. |
