# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Register

product

## Users

One person uses this as a personal capstone. That person enters vendor records and transaction history, then reviews, edits, and finalizes performance reports. The requirements name three jobs — procurement staff, report reviewer, and system administrator — but they are the same person, not separate access levels.

## Product Purpose

Record vendor transactions and produce periodic performance reports a reviewer can check and finalize. Success means every figure and every narrative claim can be traced to stored transactions, and a finalized report stays unchanged.

## Positioning

The application computes the performance numbers from recorded transactions. The model writes an explanation of those numbers and cannot introduce a number that was not supplied. A report tool that lets the model calculate or invent the metrics could not make this claim.

## Operating Context

A signed-in desktop web app. The working loop is: maintain vendors, record transactions by bulk file or single entry, create a quarterly or custom-period report for selected vendors, read the generated narrative, edit the draft if needed, finalize it, and export PDF or Word.

## Capabilities and Constraints

Vendors have a name, a unique registration number, and contact information. A vendor referenced by a transaction or report cannot be deleted. A new vendor whose name is very similar to an existing one must be confirmed before it is created.

Transactions record the vendor, date, item or service, agreed and actual price, agreed and actual delivery date, and quantity ordered and received. Entry is bulk CSV or Excel, or one row at a time. A transaction referenced by a finalized report cannot be edited or deleted. Uploads are limited to 10MB and 50,000 rows.

A report covers a quarter (the default) or a custom date range, for vendors the user selects. It has four sections: Vendor Summary, Delivery Performance, Pricing Analysis, and Order Accuracy. For each vendor the application computes on-time delivery rate, average delay in days, overcharge rate, average overcharge percentage, undercharge rate, shortfall rate, average shortfall in units, over-delivery rate, and average over-delivery in units, for the current period, the prior period of equal length, and the peer average of the other vendors in that report. A blank field is left out of that metric. A metric with no eligible transactions is undefined, not zero.

The model receives those named values and explains them. Narrative that contains a number not in the supplied data is rejected and generated again. A characterization such as improving or declining must compare the vendor with their prior period and with the current peer average.

A draft can be edited and deleted. It cannot be finalized while any of the four sections is empty. A finalized report cannot be edited or deleted, and it can be exported as PDF or Word from the server. If a draft save fails because the sign-in expired, only the four section texts are kept in the browser session and restored after sign-in again.

Sign-in is Microsoft Entra ID for one user. Google Gemini runs only on the server. If generation for a report is already running, another request for that report is rejected. A rate-limit response is retried at 1s, 2s, and 4s, then the user is told generation is unavailable. Database access is Azure SQL. Credentials belong in Azure Key Vault. The app stays within the free tier of its cloud and AI providers.

Still out of scope: bid comparison, judging quality of goods or services or vendor responsiveness, multi-user access control, integration with procurement, ERP, or accounting systems, and an all-time vendor scorecard.

## Brand Commitments

The display name is Vantage. The requirements document's official name is Vendor Performance Platform; that longer name may appear as a descriptor, not as the wordmark. Vendor Performance Intelligence Platform is historical and should not be restored.

This is a work tool. Design serves the job. No extra personality commitment.

## Evidence on Hand

Requirements are in `.adocument/URD-PERSONAL-004 1.md` (document reference URD-PERSONAL-002, version 4.0, 3 September 2026, prepared by Hakimi Azizi, status Pending Review, classification Internal — Personal Learning Use). The technical specification is `.adocument/SDD-PERSONAL-002.md`. Sample upload files are in `excel-test-files/`.

There are no customer testimonials, pricing pages, or public case studies. Do not invent them.

## Product Principles

- Every performance judgement traces to a recorded transaction.
- The application computes the numbers. The model only explains them.
- A finalized report is a record, not a draft.
- One signed-in person does the whole job until access control is a deliberate later change.
