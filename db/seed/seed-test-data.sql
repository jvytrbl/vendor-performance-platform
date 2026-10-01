/*
  Seed 20 vendors and ~422 transactions for report-generation tests.

  Vendors use registration numbers REG-2026-1001 through REG-2026-1020.
  Transactions resolve vendor_id from that number, so the script works
  whether the vendor row is new or already present.

  Dates stay on or before 2026-09-23 (today) so
  CK_VENDOR_TRANSACTIONS_transaction_date (transaction_date <= GETDATE())
  still passes; Q4 2026 cannot be seeded yet because it hasn't started.

  Coverage: Q4 2025, Q1 2026, Q2 2026, and Q3 2026 (capped at 2026-09-23),
  5 transactions per vendor per quarter, grouped into reliable/inconsistent/
  poor performance archetypes (see the comment above the bulk-expansion
  block below) so the Metrics table's severity coloring and the report
  narrative's prior-period comparison both have real, varied data to work
  with instead of a handful of one-off rows.

  Safe to run again: vendors skip an existing registration_number, and
  transactions skip the same vendor, date, and item description.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;

INSERT INTO dbo.VENDORS (name, registration_number, contact_info)
SELECT
    vendor.name,
    vendor.registration_number,
    vendor.contact_info
FROM (VALUES
    (N'Syarikat Perkhidmatan Nadi Sdn Bhd', N'REG-2026-1001', N'+60 3-2141 8801, procurement@nadi.example'),
    (N'Kilang Papan Utara Sdn Bhd', N'REG-2026-1002', N'+60 4-502 3310, orders@papanutara.example'),
    (N'Restoran Warisan Selera Sdn Bhd', N'REG-2026-1003', N'+60 3-7880 4412, kitchen@selera.example'),
    (N'Teknologi Awan Merdeka Sdn Bhd', N'REG-2026-1004', N'+60 3-6201 2290, accounts@awanmerdeka.example'),
    (N'Pembinaan Jaya Raya Sdn Bhd', N'REG-2026-1005', N'+60 7-355 9088, site@jayaraya.example'),
    (N'Logistik Selat Melaka Sdn Bhd', N'REG-2026-1006', N'+60 6-283 7741, dispatch@selatmelaka.example'),
    (N'Farmasi Sejahtera Sdn Bhd', N'REG-2026-1007', N'+60 3-4102 5560, supply@sejahtera.example'),
    (N'Percetakan Harmoni Sdn Bhd', N'REG-2026-1008', N'+60 3-9172 3344, print@harmoni.example'),
    (N'Bekalan Pejabat Cemerlang Sdn Bhd', N'REG-2026-1009', N'+60 3-5633 1180, sales@cemerlang.example'),
    (N'Kejuruteraan Tenaga Hijau Sdn Bhd', N'REG-2026-1010', N'+60 9-512 6602, projects@tenagahijau.example'),
    (N'Borong Hasil Laut Penang Sdn Bhd', N'REG-2026-1011', N'+60 4-261 4455, coldstore@hasillaut.example'),
    (N'Sistem Keselamatan Wira Sdn Bhd', N'REG-2026-1012', N'+60 3-8024 7719, service@wirasecurity.example'),
    (N'Katering Istana Mini Sdn Bhd', N'REG-2026-1013', N'+60 3-4256 9090, events@istanamini.example'),
    (N'Tekstil Warisan Johor Sdn Bhd', N'REG-2026-1014', N'+60 7-221 6633, mill@warisanjohor.example'),
    (N'Perkakasan Elektrik Mega Berhad', N'REG-2026-1015', N'+60 3-7491 2208, wholesale@megalektrik.example'),
    (N'Pengangkutan Darat Semenanjung Berhad', N'REG-2026-1016', N'+60 3-3344 8080, fleet@daratsemenanjung.example'),
    (N'Kimia Industri Pantai Timur Sdn Bhd', N'REG-2026-1017', N'+60 9-622 1500, lab@pantaitimur.example'),
    (N'Perabot Pejabat Lestari Sdn Bhd', N'REG-2026-1018', N'+60 3-5882 4411, showroom@lestarifurniture.example'),
    (N'Penyelenggaraan Bangunan Aman Sdn Bhd', N'REG-2026-1019', N'+60 3-2166 3030, fm@bangunanaman.example'),
    (N'Bekalan Perubatan Sihat Sdn Bhd', N'REG-2026-1020', N'+60 3-7806 1212, tenders@perubatansihat.example')
) AS vendor(name, registration_number, contact_info)
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.VENDORS AS existing
    WHERE existing.registration_number = vendor.registration_number
);

INSERT INTO dbo.VENDOR_TRANSACTIONS (
    vendor_id,
    transaction_date,
    item_description,
    agreed_price,
    actual_price,
    agreed_delivery_date,
    actual_delivery_date,
    quantity_ordered,
    quantity_received
)
SELECT
    vendor.id,
    txn.transaction_date,
    txn.item_description,
    txn.agreed_price,
    txn.actual_price,
    txn.agreed_delivery_date,
    txn.actual_delivery_date,
    txn.quantity_ordered,
    txn.quantity_received
FROM (VALUES
    /* 1001 Q2: on time, agreed price, exact quantity */
    (N'REG-2026-1001', CAST('2026-04-06' AS date), N'A4 copy paper, 80gsm, carton of 5 reams',
        CAST(480.00 AS decimal(12, 2)), CAST(480.00 AS decimal(12, 2)),
        CAST('2026-04-13' AS date), CAST('2026-04-13' AS date),
        CAST(50.00 AS decimal(10, 2)), CAST(50.00 AS decimal(10, 2))),
    /* 1001 Q3: late, overcharged, short */
    (N'REG-2026-1001', CAST('2026-07-06' AS date), N'Toner cartridge set, black and colour',
        CAST(520.00 AS decimal(12, 2)), CAST(598.00 AS decimal(12, 2)),
        CAST('2026-07-13' AS date), CAST('2026-07-20' AS date),
        CAST(40.00 AS decimal(10, 2)), CAST(32.00 AS decimal(10, 2))),

    /* 1002 Q2: late, overcharged, short */
    (N'REG-2026-1002', CAST('2026-04-14' AS date), N'Plywood sheet 18mm, 4 by 8 feet',
        CAST(3200.00 AS decimal(12, 2)), CAST(3680.00 AS decimal(12, 2)),
        CAST('2026-04-21' AS date), CAST('2026-05-02' AS date),
        CAST(20.00 AS decimal(10, 2)), CAST(16.00 AS decimal(10, 2))),
    /* 1002 Q3: on time, agreed price, exact quantity */
    (N'REG-2026-1002', CAST('2026-07-15' AS date), N'Hardwood door frame, standard size',
        CAST(3100.00 AS decimal(12, 2)), CAST(3100.00 AS decimal(12, 2)),
        CAST('2026-07-22' AS date), CAST('2026-07-22' AS date),
        CAST(18.00 AS decimal(10, 2)), CAST(18.00 AS decimal(10, 2))),

    /* 1003 Q2: early, undercharged, over-delivered */
    (N'REG-2026-1003', CAST('2026-05-04' AS date), N'Catering pack, nasi lemak, 100 pax',
        CAST(1500.00 AS decimal(12, 2)), CAST(1350.00 AS decimal(12, 2)),
        CAST('2026-05-18' AS date), CAST('2026-05-12' AS date),
        CAST(100.00 AS decimal(10, 2)), CAST(112.00 AS decimal(10, 2))),
    /* 1003 Q3: on time, overcharged, exact quantity */
    (N'REG-2026-1003', CAST('2026-08-03' AS date), N'Bottled drinking water, 500ml, carton',
        CAST(1600.00 AS decimal(12, 2)), CAST(1680.00 AS decimal(12, 2)),
        CAST('2026-08-10' AS date), CAST('2026-08-10' AS date),
        CAST(80.00 AS decimal(10, 2)), CAST(80.00 AS decimal(10, 2))),

    /* 1004 Q2: on time, overcharged, short */
    (N'REG-2026-1004', CAST('2026-05-11' AS date), N'Managed laptop, 14 inch, 16GB RAM',
        CAST(890.00 AS decimal(12, 2)), CAST(979.00 AS decimal(12, 2)),
        CAST('2026-05-18' AS date), CAST('2026-05-18' AS date),
        CAST(30.00 AS decimal(10, 2)), CAST(24.00 AS decimal(10, 2))),
    /* 1004 Q3: late, undercharged, over-delivered */
    (N'REG-2026-1004', CAST('2026-08-10' AS date), N'Network switch, 24 port, gigabit',
        CAST(910.00 AS decimal(12, 2)), CAST(819.00 AS decimal(12, 2)),
        CAST('2026-08-17' AS date), CAST('2026-08-24' AS date),
        CAST(25.00 AS decimal(10, 2)), CAST(30.00 AS decimal(10, 2))),

    /* 1005 Q2: late, agreed price, exact quantity */
    (N'REG-2026-1005', CAST('2026-06-02' AS date), N'Ready-mix concrete, grade 30, cubic metre',
        CAST(2400.00 AS decimal(12, 2)), CAST(2400.00 AS decimal(12, 2)),
        CAST('2026-06-09' AS date), CAST('2026-06-16' AS date),
        CAST(12.00 AS decimal(10, 2)), CAST(12.00 AS decimal(10, 2))),
    /* 1005 Q3: on time, overcharged, short */
    (N'REG-2026-1005', CAST('2026-08-18' AS date), N'Steel reinforcement bar, 12mm, tonne',
        CAST(2500.00 AS decimal(12, 2)), CAST(2875.00 AS decimal(12, 2)),
        CAST('2026-08-25' AS date), CAST('2026-08-25' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(8.00 AS decimal(10, 2))),

    /* 1006 Q2: on time, undercharged, over-delivered */
    (N'REG-2026-1006', CAST('2026-06-08' AS date), N'Palletised carton freight, Klang Valley',
        CAST(760.00 AS decimal(12, 2)), CAST(684.00 AS decimal(12, 2)),
        CAST('2026-06-15' AS date), CAST('2026-06-15' AS date),
        CAST(60.00 AS decimal(10, 2)), CAST(66.00 AS decimal(10, 2))),
    /* 1006 Q3: late, agreed price, short */
    (N'REG-2026-1006', CAST('2026-09-01' AS date), N'Cross-dock transfer, Johor to Selangor',
        CAST(800.00 AS decimal(12, 2)), CAST(800.00 AS decimal(12, 2)),
        CAST('2026-09-08' AS date), CAST('2026-09-15' AS date),
        CAST(40.00 AS decimal(10, 2)), CAST(30.00 AS decimal(10, 2))),

    /* 1007-1010 Q3: pending. Actuals NULL so metric logic excludes them. */
    (N'REG-2026-1007', CAST('2026-07-08' AS date), N'Paracetamol 500mg, box of 100',
        CAST(540.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-07-22' AS date), CAST(NULL AS date),
        CAST(35.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    (N'REG-2026-1008', CAST('2026-08-05' AS date), N'Annual report booklet, 32 pages, saddle stitch',
        CAST(410.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-08-19' AS date), CAST(NULL AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    (N'REG-2026-1009', CAST('2026-09-04' AS date), N'Ergonomic office chair, mesh back',
        CAST(1750.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-18' AS date), CAST(NULL AS date),
        CAST(6.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    (N'REG-2026-1010', CAST('2026-09-08' AS date), N'Solar inverter, 5kW, single phase',
        CAST(290.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-16' AS date), CAST(NULL AS date),
        CAST(100.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),

    /* 1011 Q2: late, overcharged, short */
    (N'REG-2026-1011', CAST('2026-04-20' AS date), N'Frozen prawn, 31/40, kilogram',
        CAST(430.00 AS decimal(12, 2)), CAST(494.50 AS decimal(12, 2)),
        CAST('2026-04-27' AS date), CAST('2026-05-06' AS date),
        CAST(200.00 AS decimal(10, 2)), CAST(170.00 AS decimal(10, 2))),
    /* 1012 Q2: on time, agreed price, exact quantity */
    (N'REG-2026-1012', CAST('2026-05-18' AS date), N'CCTV camera, 4 megapixel, outdoor',
        CAST(1200.00 AS decimal(12, 2)), CAST(1200.00 AS decimal(12, 2)),
        CAST('2026-05-25' AS date), CAST('2026-05-25' AS date),
        CAST(15.00 AS decimal(10, 2)), CAST(15.00 AS decimal(10, 2))),
    /* 1013 Q2: early, undercharged, over-delivered */
    (N'REG-2026-1013', CAST('2026-06-15' AS date), N'Staff lunch bento, chicken rice',
        CAST(560.00 AS decimal(12, 2)), CAST(504.00 AS decimal(12, 2)),
        CAST('2026-06-29' AS date), CAST('2026-06-22' AS date),
        CAST(80.00 AS decimal(10, 2)), CAST(90.00 AS decimal(10, 2))),
    /* 1014 Q2: on time, overcharged, exact quantity */
    (N'REG-2026-1014', CAST('2026-06-22' AS date), N'Cotton drill uniform cloth, metre',
        CAST(2100.00 AS decimal(12, 2)), CAST(2310.00 AS decimal(12, 2)),
        CAST('2026-06-29' AS date), CAST('2026-06-29' AS date),
        CAST(8.00 AS decimal(10, 2)), CAST(8.00 AS decimal(10, 2))),

    /* 1015 Q3: late, undercharged, short */
    (N'REG-2026-1015', CAST('2026-07-20' AS date), N'LED tube, 18W, 4 feet',
        CAST(670.00 AS decimal(12, 2)), CAST(603.00 AS decimal(12, 2)),
        CAST('2026-07-27' AS date), CAST('2026-08-03' AS date),
        CAST(45.00 AS decimal(10, 2)), CAST(36.00 AS decimal(10, 2))),
    /* 1016 Q3: on time, agreed price, over-delivered */
    (N'REG-2026-1016', CAST('2026-09-02' AS date), N'Line-haul trip, Shah Alam to Ipoh',
        CAST(980.00 AS decimal(12, 2)), CAST(980.00 AS decimal(12, 2)),
        CAST('2026-09-09' AS date), CAST('2026-09-09' AS date),
        CAST(22.00 AS decimal(10, 2)), CAST(26.00 AS decimal(10, 2))),

    /* --- Below: bulk expansion, 5 transactions per vendor per quarter across
       Q4 2025, Q1 2026, Q2 2026, and Q3 2026 (capped at 2026-09-23 by
       CK_VENDOR_TRANSACTIONS_transaction_date). Vendors are grouped into
       three performance archetypes so the report Metrics table's severity
       coloring (lib/ui/reports/getMetricSeverity.ts) actually spans
       success/warning/danger instead of clustering on one band, and two
       vendors (1003 improving, 1015 declining) trend deliberately across
       quarters so a report's prior-period narrative has something real to
       describe:
         reliable:     1001, 1004, 1007, 1009, 1012, 1016, 1018
         inconsistent: 1002, 1005, 1008, 1011, 1014, 1017, 1020
         poor:         1003 (improving), 1006, 1010, 1013, 1015 (declining), 1019
       One row per vendor per quarter is left pending (actuals NULL) to keep
       exercising the "undefined, not zero" distinction alongside the rest. */

    /* 1001 Q4'25: early, agreed price, over-delivered */
    (N'REG-2026-1001', CAST('2025-10-08' AS date), N'A4 copy paper, 80gsm, carton of 5 reams',
        CAST(503.00 AS decimal(12, 2)), CAST(503.00 AS decimal(12, 2)),
        CAST('2025-10-15' AS date), CAST('2025-10-13' AS date),
        CAST(51.00 AS decimal(10, 2)), CAST(58.00 AS decimal(10, 2))),
    /* 1001 Q4'25: on time, agreed price, over-delivered */
    (N'REG-2026-1001', CAST('2025-10-25' AS date), N'Toner cartridge set, black and colour',
        CAST(570.00 AS decimal(12, 2)), CAST(570.00 AS decimal(12, 2)),
        CAST('2025-11-01' AS date), CAST('2025-11-01' AS date),
        CAST(25.00 AS decimal(10, 2)), CAST(27.00 AS decimal(10, 2))),
    /* 1001 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1001', CAST('2025-11-09' AS date), N'Desk stationery bundle, starter pack',
        CAST(225.00 AS decimal(12, 2)), CAST(225.00 AS decimal(12, 2)),
        CAST('2025-11-16' AS date), CAST('2025-11-16' AS date),
        CAST(31.00 AS decimal(10, 2)), CAST(31.00 AS decimal(10, 2))),
    /* 1001 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1001', CAST('2025-11-26' AS date), N'Printer paper, glossy photo A4, pack of 50',
        CAST(98.00 AS decimal(12, 2)), CAST(98.00 AS decimal(12, 2)),
        CAST('2025-12-03' AS date), CAST('2025-12-03' AS date),
        CAST(24.00 AS decimal(10, 2)), CAST(24.00 AS decimal(10, 2))),
    /* 1001 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1001', CAST('2025-12-21' AS date), N'A4 copy paper, 80gsm, carton of 5 reams',
        CAST(461.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-28' AS date), CAST(NULL AS date),
        CAST(58.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1001 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1001', CAST('2026-01-03' AS date), N'A4 copy paper, 80gsm, carton of 5 reams',
        CAST(423.00 AS decimal(12, 2)), CAST(423.00 AS decimal(12, 2)),
        CAST('2026-01-10' AS date), CAST('2026-01-10' AS date),
        CAST(31.00 AS decimal(10, 2)), CAST(31.00 AS decimal(10, 2))),
    /* 1001 Q1'26: early, agreed price, exact quantity */
    (N'REG-2026-1001', CAST('2026-01-19' AS date), N'Toner cartridge set, black and colour',
        CAST(594.00 AS decimal(12, 2)), CAST(594.00 AS decimal(12, 2)),
        CAST('2026-01-26' AS date), CAST('2026-01-24' AS date),
        CAST(43.00 AS decimal(10, 2)), CAST(43.00 AS decimal(10, 2))),
    /* 1001 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1001', CAST('2026-02-07' AS date), N'Desk stationery bundle, starter pack',
        CAST(221.00 AS decimal(12, 2)), CAST(221.00 AS decimal(12, 2)),
        CAST('2026-02-14' AS date), CAST('2026-02-14' AS date),
        CAST(19.00 AS decimal(10, 2)), CAST(19.00 AS decimal(10, 2))),
    /* 1001 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1001', CAST('2026-03-02' AS date), N'Printer paper, glossy photo A4, pack of 50',
        CAST(114.00 AS decimal(12, 2)), CAST(114.00 AS decimal(12, 2)),
        CAST('2026-03-09' AS date), CAST('2026-03-09' AS date),
        CAST(21.00 AS decimal(10, 2)), CAST(21.00 AS decimal(10, 2))),
    /* 1001 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1001', CAST('2026-03-16' AS date), N'A4 copy paper, 80gsm, carton of 5 reams',
        CAST(463.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-23' AS date), CAST(NULL AS date),
        CAST(42.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1001 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1001', CAST('2026-04-01' AS date), N'A4 copy paper, 80gsm, carton of 5 reams',
        CAST(490.00 AS decimal(12, 2)), CAST(490.00 AS decimal(12, 2)),
        CAST('2026-04-08' AS date), CAST('2026-04-08' AS date),
        CAST(39.00 AS decimal(10, 2)), CAST(39.00 AS decimal(10, 2))),
    /* 1001 Q2'26: early, agreed price, over-delivered */
    (N'REG-2026-1001', CAST('2026-04-20' AS date), N'Toner cartridge set, black and colour',
        CAST(608.00 AS decimal(12, 2)), CAST(608.00 AS decimal(12, 2)),
        CAST('2026-04-27' AS date), CAST('2026-04-26' AS date),
        CAST(28.00 AS decimal(10, 2)), CAST(30.00 AS decimal(10, 2))),
    /* 1001 Q2'26: early, agreed price, exact quantity */
    (N'REG-2026-1001', CAST('2026-05-08' AS date), N'Desk stationery bundle, starter pack',
        CAST(222.00 AS decimal(12, 2)), CAST(222.00 AS decimal(12, 2)),
        CAST('2026-05-15' AS date), CAST('2026-05-13' AS date),
        CAST(35.00 AS decimal(10, 2)), CAST(35.00 AS decimal(10, 2))),
    /* 1001 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1001', CAST('2026-05-29' AS date), N'Printer paper, glossy photo A4, pack of 50',
        CAST(99.00 AS decimal(12, 2)), CAST(99.00 AS decimal(12, 2)),
        CAST('2026-06-05' AS date), CAST('2026-06-05' AS date),
        CAST(31.00 AS decimal(10, 2)), CAST(31.00 AS decimal(10, 2))),
    /* 1001 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1001', CAST('2026-06-16' AS date), N'A4 copy paper, 80gsm, carton of 5 reams',
        CAST(513.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-23' AS date), CAST(NULL AS date),
        CAST(46.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1001 Q3'26: early, agreed price, exact quantity */
    (N'REG-2026-1001', CAST('2026-07-05' AS date), N'A4 copy paper, 80gsm, carton of 5 reams',
        CAST(492.00 AS decimal(12, 2)), CAST(492.00 AS decimal(12, 2)),
        CAST('2026-07-12' AS date), CAST('2026-07-09' AS date),
        CAST(42.00 AS decimal(10, 2)), CAST(42.00 AS decimal(10, 2))),
    /* 1001 Q3'26: on time, agreed price, over-delivered */
    (N'REG-2026-1001', CAST('2026-07-22' AS date), N'Toner cartridge set, black and colour',
        CAST(531.00 AS decimal(12, 2)), CAST(531.00 AS decimal(12, 2)),
        CAST('2026-07-29' AS date), CAST('2026-07-29' AS date),
        CAST(37.00 AS decimal(10, 2)), CAST(40.00 AS decimal(10, 2))),
    /* 1001 Q3'26: on time, agreed price, over-delivered */
    (N'REG-2026-1001', CAST('2026-08-03' AS date), N'Desk stationery bundle, starter pack',
        CAST(243.00 AS decimal(12, 2)), CAST(243.00 AS decimal(12, 2)),
        CAST('2026-08-10' AS date), CAST('2026-08-10' AS date),
        CAST(28.00 AS decimal(10, 2)), CAST(32.00 AS decimal(10, 2))),
    /* 1001 Q3'26: early, agreed price, exact quantity */
    (N'REG-2026-1001', CAST('2026-08-21' AS date), N'Printer paper, glossy photo A4, pack of 50',
        CAST(101.00 AS decimal(12, 2)), CAST(101.00 AS decimal(12, 2)),
        CAST('2026-08-28' AS date), CAST('2026-08-26' AS date),
        CAST(26.00 AS decimal(10, 2)), CAST(26.00 AS decimal(10, 2))),
    /* 1001 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1001', CAST('2026-09-13' AS date), N'A4 copy paper, 80gsm, carton of 5 reams',
        CAST(424.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-20' AS date), CAST(NULL AS date),
        CAST(51.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1002 Q4'25: late, undercharged, short */
    (N'REG-2026-1002', CAST('2025-10-02' AS date), N'Plywood sheet 18mm, 4 by 8 feet',
        CAST(3034.00 AS decimal(12, 2)), CAST(2760.94 AS decimal(12, 2)),
        CAST('2025-10-09' AS date), CAST('2025-10-18' AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(12.00 AS decimal(10, 2))),
    /* 1002 Q4'25: late, overcharged, short */
    (N'REG-2026-1002', CAST('2025-10-25' AS date), N'Hardwood door frame, standard size',
        CAST(2975.00 AS decimal(12, 2)), CAST(3451.00 AS decimal(12, 2)),
        CAST('2025-11-01' AS date), CAST('2025-11-10' AS date),
        CAST(12.00 AS decimal(10, 2)), CAST(10.00 AS decimal(10, 2))),
    /* 1002 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1002', CAST('2025-11-11' AS date), N'Particle board panel, 12mm',
        CAST(1629.00 AS decimal(12, 2)), CAST(1629.00 AS decimal(12, 2)),
        CAST('2025-11-18' AS date), CAST('2025-11-18' AS date),
        CAST(27.00 AS decimal(10, 2)), CAST(27.00 AS decimal(10, 2))),
    /* 1002 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1002', CAST('2025-11-30' AS date), N'Timber batten, treated pine, 3m length',
        CAST(854.00 AS decimal(12, 2)), CAST(854.00 AS decimal(12, 2)),
        CAST('2025-12-07' AS date), CAST('2025-12-07' AS date),
        CAST(26.00 AS decimal(10, 2)), CAST(26.00 AS decimal(10, 2))),
    /* 1002 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1002', CAST('2025-12-17' AS date), N'Plywood sheet 18mm, 4 by 8 feet',
        CAST(3301.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-24' AS date), CAST(NULL AS date),
        CAST(23.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1002 Q1'26: early, agreed price, exact quantity */
    (N'REG-2026-1002', CAST('2026-01-02' AS date), N'Plywood sheet 18mm, 4 by 8 feet',
        CAST(3025.00 AS decimal(12, 2)), CAST(3025.00 AS decimal(12, 2)),
        CAST('2026-01-09' AS date), CAST('2026-01-06' AS date),
        CAST(18.00 AS decimal(10, 2)), CAST(18.00 AS decimal(10, 2))),
    /* 1002 Q1'26: late, overcharged, short */
    (N'REG-2026-1002', CAST('2026-01-26' AS date), N'Hardwood door frame, standard size',
        CAST(3116.00 AS decimal(12, 2)), CAST(3521.08 AS decimal(12, 2)),
        CAST('2026-02-02' AS date), CAST('2026-02-10' AS date),
        CAST(22.00 AS decimal(10, 2)), CAST(18.00 AS decimal(10, 2))),
    /* 1002 Q1'26: late, overcharged, short */
    (N'REG-2026-1002', CAST('2026-02-12' AS date), N'Particle board panel, 12mm',
        CAST(1515.00 AS decimal(12, 2)), CAST(1696.80 AS decimal(12, 2)),
        CAST('2026-02-19' AS date), CAST('2026-02-24' AS date),
        CAST(29.00 AS decimal(10, 2)), CAST(24.00 AS decimal(10, 2))),
    /* 1002 Q1'26: late, overcharged, short */
    (N'REG-2026-1002', CAST('2026-02-23' AS date), N'Timber batten, treated pine, 3m length',
        CAST(849.00 AS decimal(12, 2)), CAST(950.88 AS decimal(12, 2)),
        CAST('2026-03-02' AS date), CAST('2026-03-07' AS date),
        CAST(28.00 AS decimal(10, 2)), CAST(22.00 AS decimal(10, 2))),
    /* 1002 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1002', CAST('2026-03-16' AS date), N'Plywood sheet 18mm, 4 by 8 feet',
        CAST(3306.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-23' AS date), CAST(NULL AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1002 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1002', CAST('2026-04-09' AS date), N'Plywood sheet 18mm, 4 by 8 feet',
        CAST(3066.00 AS decimal(12, 2)), CAST(3066.00 AS decimal(12, 2)),
        CAST('2026-04-16' AS date), CAST('2026-04-16' AS date),
        CAST(21.00 AS decimal(10, 2)), CAST(21.00 AS decimal(10, 2))),
    /* 1002 Q2'26: early, agreed price, over-delivered */
    (N'REG-2026-1002', CAST('2026-04-26' AS date), N'Hardwood door frame, standard size',
        CAST(3292.00 AS decimal(12, 2)), CAST(3292.00 AS decimal(12, 2)),
        CAST('2026-05-03' AS date), CAST('2026-05-01' AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(18.00 AS decimal(10, 2))),
    /* 1002 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1002', CAST('2026-05-14' AS date), N'Particle board panel, 12mm',
        CAST(1475.00 AS decimal(12, 2)), CAST(1475.00 AS decimal(12, 2)),
        CAST('2026-05-21' AS date), CAST('2026-05-21' AS date),
        CAST(26.00 AS decimal(10, 2)), CAST(26.00 AS decimal(10, 2))),
    /* 1002 Q2'26: late, undercharged, short */
    (N'REG-2026-1002', CAST('2026-05-26' AS date), N'Timber batten, treated pine, 3m length',
        CAST(753.00 AS decimal(12, 2)), CAST(707.82 AS decimal(12, 2)),
        CAST('2026-06-02' AS date), CAST('2026-06-09' AS date),
        CAST(26.00 AS decimal(10, 2)), CAST(23.00 AS decimal(10, 2))),
    /* 1002 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1002', CAST('2026-06-15' AS date), N'Plywood sheet 18mm, 4 by 8 feet',
        CAST(3093.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-22' AS date), CAST(NULL AS date),
        CAST(18.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1002 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1002', CAST('2026-07-02' AS date), N'Plywood sheet 18mm, 4 by 8 feet',
        CAST(2913.00 AS decimal(12, 2)), CAST(2913.00 AS decimal(12, 2)),
        CAST('2026-07-09' AS date), CAST('2026-07-09' AS date),
        CAST(21.00 AS decimal(10, 2)), CAST(21.00 AS decimal(10, 2))),
    /* 1002 Q3'26: late, overcharged, short */
    (N'REG-2026-1002', CAST('2026-07-25' AS date), N'Hardwood door frame, standard size',
        CAST(2850.00 AS decimal(12, 2)), CAST(3220.50 AS decimal(12, 2)),
        CAST('2026-08-01' AS date), CAST('2026-08-09' AS date),
        CAST(19.00 AS decimal(10, 2)), CAST(16.00 AS decimal(10, 2))),
    /* 1002 Q3'26: late, undercharged, short */
    (N'REG-2026-1002', CAST('2026-08-06' AS date), N'Particle board panel, 12mm',
        CAST(1475.00 AS decimal(12, 2)), CAST(1327.50 AS decimal(12, 2)),
        CAST('2026-08-13' AS date), CAST('2026-08-20' AS date),
        CAST(23.00 AS decimal(10, 2)), CAST(20.00 AS decimal(10, 2))),
    /* 1002 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1002', CAST('2026-08-21' AS date), N'Timber batten, treated pine, 3m length',
        CAST(937.00 AS decimal(12, 2)), CAST(937.00 AS decimal(12, 2)),
        CAST('2026-08-28' AS date), CAST('2026-08-28' AS date),
        CAST(26.00 AS decimal(10, 2)), CAST(26.00 AS decimal(10, 2))),
    /* 1002 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1002', CAST('2026-09-11' AS date), N'Plywood sheet 18mm, 4 by 8 feet',
        CAST(3318.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-18' AS date), CAST(NULL AS date),
        CAST(23.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1003 Q4'25: late, overcharged, short */
    (N'REG-2026-1003', CAST('2025-10-05' AS date), N'Catering pack, nasi lemak, 100 pax',
        CAST(1510.00 AS decimal(12, 2)), CAST(1676.10 AS decimal(12, 2)),
        CAST('2025-10-12' AS date), CAST('2025-10-20' AS date),
        CAST(100.00 AS decimal(10, 2)), CAST(87.00 AS decimal(10, 2))),
    /* 1003 Q4'25: late, undercharged, short */
    (N'REG-2026-1003', CAST('2025-10-27' AS date), N'Bottled drinking water, 500ml, carton',
        CAST(1476.00 AS decimal(12, 2)), CAST(1372.68 AS decimal(12, 2)),
        CAST('2025-11-03' AS date), CAST('2025-11-07' AS date),
        CAST(91.00 AS decimal(10, 2)), CAST(77.00 AS decimal(10, 2))),
    /* 1003 Q4'25: late, undercharged, short */
    (N'REG-2026-1003', CAST('2025-11-08' AS date), N'Buffet catering pack, mixed cuisine, 150 pax',
        CAST(2109.00 AS decimal(12, 2)), CAST(1898.10 AS decimal(12, 2)),
        CAST('2025-11-15' AS date), CAST('2025-11-22' AS date),
        CAST(142.00 AS decimal(10, 2)), CAST(115.00 AS decimal(10, 2))),
    /* 1003 Q4'25: late, overcharged, short */
    (N'REG-2026-1003', CAST('2025-11-28' AS date), N'High tea set, finger food, 60 pax',
        CAST(1098.00 AS decimal(12, 2)), CAST(1284.66 AS decimal(12, 2)),
        CAST('2025-12-05' AS date), CAST('2025-12-13' AS date),
        CAST(53.00 AS decimal(10, 2)), CAST(45.00 AS decimal(10, 2))),
    /* 1003 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1003', CAST('2025-12-15' AS date), N'Catering pack, nasi lemak, 100 pax',
        CAST(1509.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-22' AS date), CAST(NULL AS date),
        CAST(101.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1003 Q1'26: late, undercharged, short */
    (N'REG-2026-1003', CAST('2026-01-04' AS date), N'Catering pack, nasi lemak, 100 pax',
        CAST(1512.00 AS decimal(12, 2)), CAST(1391.04 AS decimal(12, 2)),
        CAST('2026-01-11' AS date), CAST('2026-01-22' AS date),
        CAST(92.00 AS decimal(10, 2)), CAST(79.00 AS decimal(10, 2))),
    /* 1003 Q1'26: late, overcharged, short */
    (N'REG-2026-1003', CAST('2026-01-23' AS date), N'Bottled drinking water, 500ml, carton',
        CAST(1600.00 AS decimal(12, 2)), CAST(1888.00 AS decimal(12, 2)),
        CAST('2026-01-30' AS date), CAST('2026-02-03' AS date),
        CAST(93.00 AS decimal(10, 2)), CAST(74.00 AS decimal(10, 2))),
    /* 1003 Q1'26: late, overcharged, short */
    (N'REG-2026-1003', CAST('2026-02-05' AS date), N'Buffet catering pack, mixed cuisine, 150 pax',
        CAST(2135.00 AS decimal(12, 2)), CAST(2348.50 AS decimal(12, 2)),
        CAST('2026-02-12' AS date), CAST('2026-02-22' AS date),
        CAST(133.00 AS decimal(10, 2)), CAST(102.00 AS decimal(10, 2))),
    /* 1003 Q1'26: late, undercharged, short */
    (N'REG-2026-1003', CAST('2026-03-03' AS date), N'High tea set, finger food, 60 pax',
        CAST(1073.00 AS decimal(12, 2)), CAST(976.43 AS decimal(12, 2)),
        CAST('2026-03-10' AS date), CAST('2026-03-15' AS date),
        CAST(50.00 AS decimal(10, 2)), CAST(43.00 AS decimal(10, 2))),
    /* 1003 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1003', CAST('2026-03-17' AS date), N'Catering pack, nasi lemak, 100 pax',
        CAST(1625.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-24' AS date), CAST(NULL AS date),
        CAST(106.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1003 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1003', CAST('2026-04-08' AS date), N'Catering pack, nasi lemak, 100 pax',
        CAST(1646.00 AS decimal(12, 2)), CAST(1646.00 AS decimal(12, 2)),
        CAST('2026-04-15' AS date), CAST('2026-04-15' AS date),
        CAST(103.00 AS decimal(10, 2)), CAST(103.00 AS decimal(10, 2))),
    /* 1003 Q2'26: late, overcharged, short */
    (N'REG-2026-1003', CAST('2026-04-26' AS date), N'Bottled drinking water, 500ml, carton',
        CAST(1616.00 AS decimal(12, 2)), CAST(1777.60 AS decimal(12, 2)),
        CAST('2026-05-03' AS date), CAST('2026-05-12' AS date),
        CAST(94.00 AS decimal(10, 2)), CAST(76.00 AS decimal(10, 2))),
    /* 1003 Q2'26: late, overcharged, short */
    (N'REG-2026-1003', CAST('2026-05-14' AS date), N'Buffet catering pack, mixed cuisine, 150 pax',
        CAST(2386.00 AS decimal(12, 2)), CAST(2672.32 AS decimal(12, 2)),
        CAST('2026-05-21' AS date), CAST('2026-06-01' AS date),
        CAST(147.00 AS decimal(10, 2)), CAST(115.00 AS decimal(10, 2))),
    /* 1003 Q2'26: on time, undercharged, exact quantity */
    (N'REG-2026-1003', CAST('2026-05-29' AS date), N'High tea set, finger food, 60 pax',
        CAST(1145.00 AS decimal(12, 2)), CAST(1087.75 AS decimal(12, 2)),
        CAST('2026-06-05' AS date), CAST('2026-06-05' AS date),
        CAST(51.00 AS decimal(10, 2)), CAST(51.00 AS decimal(10, 2))),
    /* 1003 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1003', CAST('2026-06-14' AS date), N'Catering pack, nasi lemak, 100 pax',
        CAST(1538.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-21' AS date), CAST(NULL AS date),
        CAST(112.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1003 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1003', CAST('2026-07-02' AS date), N'Catering pack, nasi lemak, 100 pax',
        CAST(1483.00 AS decimal(12, 2)), CAST(1483.00 AS decimal(12, 2)),
        CAST('2026-07-09' AS date), CAST('2026-07-09' AS date),
        CAST(94.00 AS decimal(10, 2)), CAST(94.00 AS decimal(10, 2))),
    /* 1003 Q3'26: late, overcharged, short */
    (N'REG-2026-1003', CAST('2026-07-25' AS date), N'Bottled drinking water, 500ml, carton',
        CAST(1568.00 AS decimal(12, 2)), CAST(1787.52 AS decimal(12, 2)),
        CAST('2026-08-01' AS date), CAST('2026-08-12' AS date),
        CAST(83.00 AS decimal(10, 2)), CAST(64.00 AS decimal(10, 2))),
    /* 1003 Q3'26: late, overcharged, short */
    (N'REG-2026-1003', CAST('2026-08-10' AS date), N'Buffet catering pack, mixed cuisine, 150 pax',
        CAST(2399.00 AS decimal(12, 2)), CAST(2662.89 AS decimal(12, 2)),
        CAST('2026-08-17' AS date), CAST('2026-08-23' AS date),
        CAST(140.00 AS decimal(10, 2)), CAST(116.00 AS decimal(10, 2))),
    /* 1003 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1003', CAST('2026-08-26' AS date), N'High tea set, finger food, 60 pax',
        CAST(985.00 AS decimal(12, 2)), CAST(985.00 AS decimal(12, 2)),
        CAST('2026-09-02' AS date), CAST('2026-09-02' AS date),
        CAST(68.00 AS decimal(10, 2)), CAST(68.00 AS decimal(10, 2))),
    /* 1003 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1003', CAST('2026-09-10' AS date), N'Catering pack, nasi lemak, 100 pax',
        CAST(1483.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-17' AS date), CAST(NULL AS date),
        CAST(95.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1004 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1004', CAST('2025-10-04' AS date), N'Managed laptop, 14 inch, 16GB RAM',
        CAST(872.00 AS decimal(12, 2)), CAST(872.00 AS decimal(12, 2)),
        CAST('2025-10-11' AS date), CAST('2025-10-11' AS date),
        CAST(34.00 AS decimal(10, 2)), CAST(34.00 AS decimal(10, 2))),
    /* 1004 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1004', CAST('2025-10-28' AS date), N'Network switch, 24 port, gigabit',
        CAST(968.00 AS decimal(12, 2)), CAST(968.00 AS decimal(12, 2)),
        CAST('2025-11-04' AS date), CAST('2025-11-04' AS date),
        CAST(17.00 AS decimal(10, 2)), CAST(17.00 AS decimal(10, 2))),
    /* 1004 Q4'25: early, agreed price, exact quantity */
    (N'REG-2026-1004', CAST('2025-11-15' AS date), N'Cloud backup subscription, 1TB, annual',
        CAST(240.00 AS decimal(12, 2)), CAST(240.00 AS decimal(12, 2)),
        CAST('2025-11-22' AS date), CAST('2025-11-20' AS date),
        CAST(34.00 AS decimal(10, 2)), CAST(34.00 AS decimal(10, 2))),
    /* 1004 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1004', CAST('2025-11-29' AS date), N'Wireless access point, dual-band',
        CAST(397.00 AS decimal(12, 2)), CAST(397.00 AS decimal(12, 2)),
        CAST('2025-12-06' AS date), CAST('2025-12-06' AS date),
        CAST(25.00 AS decimal(10, 2)), CAST(25.00 AS decimal(10, 2))),
    /* 1004 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1004', CAST('2025-12-20' AS date), N'Managed laptop, 14 inch, 16GB RAM',
        CAST(852.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-27' AS date), CAST(NULL AS date),
        CAST(35.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1004 Q1'26: late, overcharged, short */
    (N'REG-2026-1004', CAST('2026-01-04' AS date), N'Managed laptop, 14 inch, 16GB RAM',
        CAST(856.00 AS decimal(12, 2)), CAST(950.16 AS decimal(12, 2)),
        CAST('2026-01-11' AS date), CAST('2026-01-22' AS date),
        CAST(27.00 AS decimal(10, 2)), CAST(21.00 AS decimal(10, 2))),
    /* 1004 Q1'26: early, agreed price, over-delivered */
    (N'REG-2026-1004', CAST('2026-01-25' AS date), N'Network switch, 24 port, gigabit',
        CAST(873.00 AS decimal(12, 2)), CAST(873.00 AS decimal(12, 2)),
        CAST('2026-02-01' AS date), CAST('2026-01-30' AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(18.00 AS decimal(10, 2))),
    /* 1004 Q1'26: early, agreed price, exact quantity */
    (N'REG-2026-1004', CAST('2026-02-09' AS date), N'Cloud backup subscription, 1TB, annual',
        CAST(234.00 AS decimal(12, 2)), CAST(234.00 AS decimal(12, 2)),
        CAST('2026-02-16' AS date), CAST('2026-02-13' AS date),
        CAST(48.00 AS decimal(10, 2)), CAST(48.00 AS decimal(10, 2))),
    /* 1004 Q1'26: early, agreed price, exact quantity */
    (N'REG-2026-1004', CAST('2026-03-02' AS date), N'Wireless access point, dual-band',
        CAST(406.00 AS decimal(12, 2)), CAST(406.00 AS decimal(12, 2)),
        CAST('2026-03-09' AS date), CAST('2026-03-08' AS date),
        CAST(17.00 AS decimal(10, 2)), CAST(17.00 AS decimal(10, 2))),
    /* 1004 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1004', CAST('2026-03-13' AS date), N'Managed laptop, 14 inch, 16GB RAM',
        CAST(943.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-20' AS date), CAST(NULL AS date),
        CAST(23.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1004 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1004', CAST('2026-04-09' AS date), N'Managed laptop, 14 inch, 16GB RAM',
        CAST(888.00 AS decimal(12, 2)), CAST(888.00 AS decimal(12, 2)),
        CAST('2026-04-16' AS date), CAST('2026-04-16' AS date),
        CAST(22.00 AS decimal(10, 2)), CAST(22.00 AS decimal(10, 2))),
    /* 1004 Q2'26: on time, agreed price, over-delivered */
    (N'REG-2026-1004', CAST('2026-04-28' AS date), N'Network switch, 24 port, gigabit',
        CAST(929.00 AS decimal(12, 2)), CAST(929.00 AS decimal(12, 2)),
        CAST('2026-05-05' AS date), CAST('2026-05-05' AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(17.00 AS decimal(10, 2))),
    /* 1004 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1004', CAST('2026-05-13' AS date), N'Cloud backup subscription, 1TB, annual',
        CAST(191.00 AS decimal(12, 2)), CAST(191.00 AS decimal(12, 2)),
        CAST('2026-05-20' AS date), CAST('2026-05-20' AS date),
        CAST(49.00 AS decimal(10, 2)), CAST(49.00 AS decimal(10, 2))),
    /* 1004 Q2'26: early, agreed price, exact quantity */
    (N'REG-2026-1004', CAST('2026-05-30' AS date), N'Wireless access point, dual-band',
        CAST(419.00 AS decimal(12, 2)), CAST(419.00 AS decimal(12, 2)),
        CAST('2026-06-06' AS date), CAST('2026-06-03' AS date),
        CAST(25.00 AS decimal(10, 2)), CAST(25.00 AS decimal(10, 2))),
    /* 1004 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1004', CAST('2026-06-13' AS date), N'Managed laptop, 14 inch, 16GB RAM',
        CAST(873.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-20' AS date), CAST(NULL AS date),
        CAST(29.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1004 Q3'26: early, agreed price, exact quantity */
    (N'REG-2026-1004', CAST('2026-07-01' AS date), N'Managed laptop, 14 inch, 16GB RAM',
        CAST(943.00 AS decimal(12, 2)), CAST(943.00 AS decimal(12, 2)),
        CAST('2026-07-08' AS date), CAST('2026-07-07' AS date),
        CAST(21.00 AS decimal(10, 2)), CAST(21.00 AS decimal(10, 2))),
    /* 1004 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1004', CAST('2026-07-21' AS date), N'Network switch, 24 port, gigabit',
        CAST(925.00 AS decimal(12, 2)), CAST(925.00 AS decimal(12, 2)),
        CAST('2026-07-28' AS date), CAST('2026-07-28' AS date),
        CAST(26.00 AS decimal(10, 2)), CAST(26.00 AS decimal(10, 2))),
    /* 1004 Q3'26: early, agreed price, exact quantity */
    (N'REG-2026-1004', CAST('2026-08-04' AS date), N'Cloud backup subscription, 1TB, annual',
        CAST(182.00 AS decimal(12, 2)), CAST(182.00 AS decimal(12, 2)),
        CAST('2026-08-11' AS date), CAST('2026-08-09' AS date),
        CAST(33.00 AS decimal(10, 2)), CAST(33.00 AS decimal(10, 2))),
    /* 1004 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1004', CAST('2026-08-24' AS date), N'Wireless access point, dual-band',
        CAST(363.00 AS decimal(12, 2)), CAST(363.00 AS decimal(12, 2)),
        CAST('2026-08-31' AS date), CAST('2026-08-31' AS date),
        CAST(15.00 AS decimal(10, 2)), CAST(15.00 AS decimal(10, 2))),
    /* 1004 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1004', CAST('2026-09-12' AS date), N'Managed laptop, 14 inch, 16GB RAM',
        CAST(924.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-19' AS date), CAST(NULL AS date),
        CAST(31.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1005 Q4'25: on time, undercharged, exact quantity */
    (N'REG-2026-1005', CAST('2025-10-03' AS date), N'Ready-mix concrete, grade 30, cubic metre',
        CAST(2383.00 AS decimal(12, 2)), CAST(2240.02 AS decimal(12, 2)),
        CAST('2025-10-10' AS date), CAST('2025-10-10' AS date),
        CAST(13.00 AS decimal(10, 2)), CAST(13.00 AS decimal(10, 2))),
    /* 1005 Q4'25: early, agreed price, over-delivered */
    (N'REG-2026-1005', CAST('2025-10-22' AS date), N'Steel reinforcement bar, 12mm, tonne',
        CAST(2806.00 AS decimal(12, 2)), CAST(2806.00 AS decimal(12, 2)),
        CAST('2025-10-29' AS date), CAST('2025-10-27' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(11.00 AS decimal(10, 2))),
    /* 1005 Q4'25: late, overcharged, short */
    (N'REG-2026-1005', CAST('2025-11-11' AS date), N'Cement, OPC 50kg bag, pallet of 40',
        CAST(1746.00 AS decimal(12, 2)), CAST(1903.14 AS decimal(12, 2)),
        CAST('2025-11-18' AS date), CAST('2025-11-25' AS date),
        CAST(12.00 AS decimal(10, 2)), CAST(9.00 AS decimal(10, 2))),
    /* 1005 Q4'25: on time, agreed price, over-delivered */
    (N'REG-2026-1005', CAST('2025-11-29' AS date), N'Scaffolding rental, standard frame, monthly',
        CAST(1558.00 AS decimal(12, 2)), CAST(1558.00 AS decimal(12, 2)),
        CAST('2025-12-06' AS date), CAST('2025-12-06' AS date),
        CAST(11.00 AS decimal(10, 2)), CAST(12.00 AS decimal(10, 2))),
    /* 1005 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1005', CAST('2025-12-18' AS date), N'Ready-mix concrete, grade 30, cubic metre',
        CAST(2315.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-25' AS date), CAST(NULL AS date),
        CAST(11.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1005 Q1'26: late, undercharged, short */
    (N'REG-2026-1005', CAST('2026-01-09' AS date), N'Ready-mix concrete, grade 30, cubic metre',
        CAST(2512.00 AS decimal(12, 2)), CAST(2235.68 AS decimal(12, 2)),
        CAST('2026-01-16' AS date), CAST('2026-01-24' AS date),
        CAST(13.00 AS decimal(10, 2)), CAST(10.00 AS decimal(10, 2))),
    /* 1005 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1005', CAST('2026-01-20' AS date), N'Steel reinforcement bar, 12mm, tonne',
        CAST(2782.00 AS decimal(12, 2)), CAST(2782.00 AS decimal(12, 2)),
        CAST('2026-01-27' AS date), CAST('2026-01-27' AS date),
        CAST(13.00 AS decimal(10, 2)), CAST(13.00 AS decimal(10, 2))),
    /* 1005 Q1'26: late, undercharged, short */
    (N'REG-2026-1005', CAST('2026-02-13' AS date), N'Cement, OPC 50kg bag, pallet of 40',
        CAST(1642.00 AS decimal(12, 2)), CAST(1510.64 AS decimal(12, 2)),
        CAST('2026-02-20' AS date), CAST('2026-02-26' AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(14.00 AS decimal(10, 2))),
    /* 1005 Q1'26: late, undercharged, short */
    (N'REG-2026-1005', CAST('2026-03-03' AS date), N'Scaffolding rental, standard frame, monthly',
        CAST(1459.00 AS decimal(12, 2)), CAST(1342.28 AS decimal(12, 2)),
        CAST('2026-03-10' AS date), CAST('2026-03-15' AS date),
        CAST(9.00 AS decimal(10, 2)), CAST(7.00 AS decimal(10, 2))),
    /* 1005 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1005', CAST('2026-03-20' AS date), N'Ready-mix concrete, grade 30, cubic metre',
        CAST(2518.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-27' AS date), CAST(NULL AS date),
        CAST(12.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1005 Q2'26: late, overcharged, short */
    (N'REG-2026-1005', CAST('2026-04-09' AS date), N'Ready-mix concrete, grade 30, cubic metre',
        CAST(2589.00 AS decimal(12, 2)), CAST(2873.79 AS decimal(12, 2)),
        CAST('2026-04-16' AS date), CAST('2026-04-23' AS date),
        CAST(13.00 AS decimal(10, 2)), CAST(11.00 AS decimal(10, 2))),
    /* 1005 Q2'26: late, overcharged, short */
    (N'REG-2026-1005', CAST('2026-04-26' AS date), N'Steel reinforcement bar, 12mm, tonne',
        CAST(2502.00 AS decimal(12, 2)), CAST(2777.22 AS decimal(12, 2)),
        CAST('2026-05-03' AS date), CAST('2026-05-10' AS date),
        CAST(8.00 AS decimal(10, 2)), CAST(6.00 AS decimal(10, 2))),
    /* 1005 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1005', CAST('2026-05-12' AS date), N'Cement, OPC 50kg bag, pallet of 40',
        CAST(1820.00 AS decimal(12, 2)), CAST(1820.00 AS decimal(12, 2)),
        CAST('2026-05-19' AS date), CAST('2026-05-19' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(10.00 AS decimal(10, 2))),
    /* 1005 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1005', CAST('2026-05-31' AS date), N'Scaffolding rental, standard frame, monthly',
        CAST(1358.00 AS decimal(12, 2)), CAST(1358.00 AS decimal(12, 2)),
        CAST('2026-06-07' AS date), CAST('2026-06-07' AS date),
        CAST(7.00 AS decimal(10, 2)), CAST(7.00 AS decimal(10, 2))),
    /* 1005 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1005', CAST('2026-06-17' AS date), N'Ready-mix concrete, grade 30, cubic metre',
        CAST(2320.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-24' AS date), CAST(NULL AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1005 Q3'26: late, overcharged, short */
    (N'REG-2026-1005', CAST('2026-07-06' AS date), N'Ready-mix concrete, grade 30, cubic metre',
        CAST(2470.00 AS decimal(12, 2)), CAST(2840.50 AS decimal(12, 2)),
        CAST('2026-07-13' AS date), CAST('2026-07-19' AS date),
        CAST(14.00 AS decimal(10, 2)), CAST(11.00 AS decimal(10, 2))),
    /* 1005 Q3'26: late, overcharged, short */
    (N'REG-2026-1005', CAST('2026-07-20' AS date), N'Steel reinforcement bar, 12mm, tonne',
        CAST(2548.00 AS decimal(12, 2)), CAST(2981.16 AS decimal(12, 2)),
        CAST('2026-07-27' AS date), CAST('2026-08-06' AS date),
        CAST(9.00 AS decimal(10, 2)), CAST(8.00 AS decimal(10, 2))),
    /* 1005 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1005', CAST('2026-08-06' AS date), N'Cement, OPC 50kg bag, pallet of 40',
        CAST(1616.00 AS decimal(12, 2)), CAST(1616.00 AS decimal(12, 2)),
        CAST('2026-08-13' AS date), CAST('2026-08-13' AS date),
        CAST(20.00 AS decimal(10, 2)), CAST(20.00 AS decimal(10, 2))),
    /* 1005 Q3'26: late, undercharged, short */
    (N'REG-2026-1005', CAST('2026-08-26' AS date), N'Scaffolding rental, standard frame, monthly',
        CAST(1451.00 AS decimal(12, 2)), CAST(1291.39 AS decimal(12, 2)),
        CAST('2026-09-02' AS date), CAST('2026-09-11' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(8.00 AS decimal(10, 2))),
    /* 1005 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1005', CAST('2026-09-08' AS date), N'Ready-mix concrete, grade 30, cubic metre',
        CAST(2406.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-15' AS date), CAST(NULL AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1006 Q4'25: late, overcharged, short */
    (N'REG-2026-1006', CAST('2025-10-05' AS date), N'Palletised carton freight, Klang Valley',
        CAST(804.00 AS decimal(12, 2)), CAST(884.40 AS decimal(12, 2)),
        CAST('2025-10-12' AS date), CAST('2025-10-22' AS date),
        CAST(61.00 AS decimal(10, 2)), CAST(54.00 AS decimal(10, 2))),
    /* 1006 Q4'25: late, overcharged, short */
    (N'REG-2026-1006', CAST('2025-10-27' AS date), N'Cross-dock transfer, Johor to Selangor',
        CAST(789.00 AS decimal(12, 2)), CAST(923.13 AS decimal(12, 2)),
        CAST('2025-11-03' AS date), CAST('2025-11-14' AS date),
        CAST(43.00 AS decimal(10, 2)), CAST(38.00 AS decimal(10, 2))),
    /* 1006 Q4'25: late, overcharged, short */
    (N'REG-2026-1006', CAST('2025-11-08' AS date), N'Warehousing pallet storage, monthly',
        CAST(50.00 AS decimal(12, 2)), CAST(55.00 AS decimal(12, 2)),
        CAST('2025-11-15' AS date), CAST('2025-11-24' AS date),
        CAST(96.00 AS decimal(10, 2)), CAST(85.00 AS decimal(10, 2))),
    /* 1006 Q4'25: late, overcharged, short */
    (N'REG-2026-1006', CAST('2025-11-27' AS date), N'Last-mile delivery run, Klang Valley',
        CAST(194.00 AS decimal(12, 2)), CAST(228.92 AS decimal(12, 2)),
        CAST('2025-12-04' AS date), CAST('2025-12-12' AS date),
        CAST(70.00 AS decimal(10, 2)), CAST(53.00 AS decimal(10, 2))),
    /* 1006 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1006', CAST('2025-12-18' AS date), N'Palletised carton freight, Klang Valley',
        CAST(761.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-25' AS date), CAST(NULL AS date),
        CAST(52.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1006 Q1'26: late, overcharged, short */
    (N'REG-2026-1006', CAST('2026-01-06' AS date), N'Palletised carton freight, Klang Valley',
        CAST(793.00 AS decimal(12, 2)), CAST(888.16 AS decimal(12, 2)),
        CAST('2026-01-13' AS date), CAST('2026-01-20' AS date),
        CAST(54.00 AS decimal(10, 2)), CAST(47.00 AS decimal(10, 2))),
    /* 1006 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1006', CAST('2026-01-23' AS date), N'Cross-dock transfer, Johor to Selangor',
        CAST(817.00 AS decimal(12, 2)), CAST(817.00 AS decimal(12, 2)),
        CAST('2026-01-30' AS date), CAST('2026-01-30' AS date),
        CAST(40.00 AS decimal(10, 2)), CAST(40.00 AS decimal(10, 2))),
    /* 1006 Q1'26: late, overcharged, short */
    (N'REG-2026-1006', CAST('2026-02-10' AS date), N'Warehousing pallet storage, monthly',
        CAST(42.00 AS decimal(12, 2)), CAST(45.78 AS decimal(12, 2)),
        CAST('2026-02-17' AS date), CAST('2026-02-21' AS date),
        CAST(97.00 AS decimal(10, 2)), CAST(82.00 AS decimal(10, 2))),
    /* 1006 Q1'26: late, overcharged, short */
    (N'REG-2026-1006', CAST('2026-02-27' AS date), N'Last-mile delivery run, Klang Valley',
        CAST(233.00 AS decimal(12, 2)), CAST(256.30 AS decimal(12, 2)),
        CAST('2026-03-06' AS date), CAST('2026-03-17' AS date),
        CAST(84.00 AS decimal(10, 2)), CAST(68.00 AS decimal(10, 2))),
    /* 1006 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1006', CAST('2026-03-15' AS date), N'Palletised carton freight, Klang Valley',
        CAST(849.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-22' AS date), CAST(NULL AS date),
        CAST(57.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1006 Q2'26: late, overcharged, short */
    (N'REG-2026-1006', CAST('2026-04-09' AS date), N'Palletised carton freight, Klang Valley',
        CAST(715.00 AS decimal(12, 2)), CAST(800.80 AS decimal(12, 2)),
        CAST('2026-04-16' AS date), CAST('2026-04-26' AS date),
        CAST(66.00 AS decimal(10, 2)), CAST(52.00 AS decimal(10, 2))),
    /* 1006 Q2'26: late, overcharged, short */
    (N'REG-2026-1006', CAST('2026-04-28' AS date), N'Cross-dock transfer, Johor to Selangor',
        CAST(756.00 AS decimal(12, 2)), CAST(876.96 AS decimal(12, 2)),
        CAST('2026-05-05' AS date), CAST('2026-05-14' AS date),
        CAST(39.00 AS decimal(10, 2)), CAST(32.00 AS decimal(10, 2))),
    /* 1006 Q2'26: late, overcharged, short */
    (N'REG-2026-1006', CAST('2026-05-16' AS date), N'Warehousing pallet storage, monthly',
        CAST(47.00 AS decimal(12, 2)), CAST(51.23 AS decimal(12, 2)),
        CAST('2026-05-23' AS date), CAST('2026-06-04' AS date),
        CAST(116.00 AS decimal(10, 2)), CAST(95.00 AS decimal(10, 2))),
    /* 1006 Q2'26: late, overcharged, short */
    (N'REG-2026-1006', CAST('2026-05-28' AS date), N'Last-mile delivery run, Klang Valley',
        CAST(257.00 AS decimal(12, 2)), CAST(282.70 AS decimal(12, 2)),
        CAST('2026-06-04' AS date), CAST('2026-06-12' AS date),
        CAST(76.00 AS decimal(10, 2)), CAST(65.00 AS decimal(10, 2))),
    /* 1006 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1006', CAST('2026-06-14' AS date), N'Palletised carton freight, Klang Valley',
        CAST(757.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-21' AS date), CAST(NULL AS date),
        CAST(56.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1006 Q3'26: late, overcharged, short */
    (N'REG-2026-1006', CAST('2026-07-08' AS date), N'Palletised carton freight, Klang Valley',
        CAST(790.00 AS decimal(12, 2)), CAST(876.90 AS decimal(12, 2)),
        CAST('2026-07-15' AS date), CAST('2026-07-21' AS date),
        CAST(60.00 AS decimal(10, 2)), CAST(54.00 AS decimal(10, 2))),
    /* 1006 Q3'26: late, overcharged, short */
    (N'REG-2026-1006', CAST('2026-07-21' AS date), N'Cross-dock transfer, Johor to Selangor',
        CAST(756.00 AS decimal(12, 2)), CAST(854.28 AS decimal(12, 2)),
        CAST('2026-07-28' AS date), CAST('2026-08-08' AS date),
        CAST(37.00 AS decimal(10, 2)), CAST(31.00 AS decimal(10, 2))),
    /* 1006 Q3'26: late, undercharged, short */
    (N'REG-2026-1006', CAST('2026-08-07' AS date), N'Warehousing pallet storage, monthly',
        CAST(42.00 AS decimal(12, 2)), CAST(37.80 AS decimal(12, 2)),
        CAST('2026-08-14' AS date), CAST('2026-08-24' AS date),
        CAST(81.00 AS decimal(10, 2)), CAST(68.00 AS decimal(10, 2))),
    /* 1006 Q3'26: late, undercharged, short */
    (N'REG-2026-1006', CAST('2026-08-23' AS date), N'Last-mile delivery run, Klang Valley',
        CAST(232.00 AS decimal(12, 2)), CAST(220.40 AS decimal(12, 2)),
        CAST('2026-08-30' AS date), CAST('2026-09-11' AS date),
        CAST(63.00 AS decimal(10, 2)), CAST(49.00 AS decimal(10, 2))),
    /* 1006 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1006', CAST('2026-09-07' AS date), N'Palletised carton freight, Klang Valley',
        CAST(846.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-14' AS date), CAST(NULL AS date),
        CAST(67.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1007 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1007', CAST('2025-10-04' AS date), N'Paracetamol 500mg, box of 100',
        CAST(518.00 AS decimal(12, 2)), CAST(518.00 AS decimal(12, 2)),
        CAST('2025-10-11' AS date), CAST('2025-10-11' AS date),
        CAST(44.00 AS decimal(10, 2)), CAST(44.00 AS decimal(10, 2))),
    /* 1007 Q4'25: on time, undercharged, exact quantity */
    (N'REG-2026-1007', CAST('2025-10-23' AS date), N'Vitamin C tablets 1000mg, bottle of 100',
        CAST(306.00 AS decimal(12, 2)), CAST(284.58 AS decimal(12, 2)),
        CAST('2025-10-30' AS date), CAST('2025-10-30' AS date),
        CAST(45.00 AS decimal(10, 2)), CAST(45.00 AS decimal(10, 2))),
    /* 1007 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1007', CAST('2025-11-11' AS date), N'Surgical face masks, box of 50',
        CAST(47.00 AS decimal(12, 2)), CAST(47.00 AS decimal(12, 2)),
        CAST('2025-11-18' AS date), CAST('2025-11-18' AS date),
        CAST(135.00 AS decimal(10, 2)), CAST(135.00 AS decimal(10, 2))),
    /* 1007 Q4'25: early, agreed price, exact quantity */
    (N'REG-2026-1007', CAST('2025-11-29' AS date), N'Hand sanitizer 500ml, carton of 24',
        CAST(397.00 AS decimal(12, 2)), CAST(397.00 AS decimal(12, 2)),
        CAST('2025-12-06' AS date), CAST('2025-12-05' AS date),
        CAST(28.00 AS decimal(10, 2)), CAST(28.00 AS decimal(10, 2))),
    /* 1007 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1007', CAST('2025-12-13' AS date), N'Paracetamol 500mg, box of 100',
        CAST(504.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-20' AS date), CAST(NULL AS date),
        CAST(43.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1007 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1007', CAST('2026-01-08' AS date), N'Paracetamol 500mg, box of 100',
        CAST(576.00 AS decimal(12, 2)), CAST(576.00 AS decimal(12, 2)),
        CAST('2026-01-15' AS date), CAST('2026-01-15' AS date),
        CAST(44.00 AS decimal(10, 2)), CAST(44.00 AS decimal(10, 2))),
    /* 1007 Q1'26: early, agreed price, exact quantity */
    (N'REG-2026-1007', CAST('2026-01-25' AS date), N'Vitamin C tablets 1000mg, bottle of 100',
        CAST(293.00 AS decimal(12, 2)), CAST(293.00 AS decimal(12, 2)),
        CAST('2026-02-01' AS date), CAST('2026-01-29' AS date),
        CAST(55.00 AS decimal(10, 2)), CAST(55.00 AS decimal(10, 2))),
    /* 1007 Q1'26: early, agreed price, over-delivered */
    (N'REG-2026-1007', CAST('2026-02-11' AS date), N'Surgical face masks, box of 50',
        CAST(45.00 AS decimal(12, 2)), CAST(45.00 AS decimal(12, 2)),
        CAST('2026-02-18' AS date), CAST('2026-02-16' AS date),
        CAST(156.00 AS decimal(10, 2)), CAST(170.00 AS decimal(10, 2))),
    /* 1007 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1007', CAST('2026-02-24' AS date), N'Hand sanitizer 500ml, carton of 24',
        CAST(381.00 AS decimal(12, 2)), CAST(381.00 AS decimal(12, 2)),
        CAST('2026-03-03' AS date), CAST('2026-03-03' AS date),
        CAST(26.00 AS decimal(10, 2)), CAST(26.00 AS decimal(10, 2))),
    /* 1007 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1007', CAST('2026-03-14' AS date), N'Paracetamol 500mg, box of 100',
        CAST(551.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-21' AS date), CAST(NULL AS date),
        CAST(33.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1007 Q2'26: early, agreed price, exact quantity */
    (N'REG-2026-1007', CAST('2026-04-09' AS date), N'Paracetamol 500mg, box of 100',
        CAST(560.00 AS decimal(12, 2)), CAST(560.00 AS decimal(12, 2)),
        CAST('2026-04-16' AS date), CAST('2026-04-13' AS date),
        CAST(38.00 AS decimal(10, 2)), CAST(38.00 AS decimal(10, 2))),
    /* 1007 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1007', CAST('2026-04-23' AS date), N'Vitamin C tablets 1000mg, bottle of 100',
        CAST(329.00 AS decimal(12, 2)), CAST(329.00 AS decimal(12, 2)),
        CAST('2026-04-30' AS date), CAST('2026-04-30' AS date),
        CAST(48.00 AS decimal(10, 2)), CAST(48.00 AS decimal(10, 2))),
    /* 1007 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1007', CAST('2026-05-10' AS date), N'Surgical face masks, box of 50',
        CAST(63.00 AS decimal(12, 2)), CAST(63.00 AS decimal(12, 2)),
        CAST('2026-05-17' AS date), CAST('2026-05-17' AS date),
        CAST(121.00 AS decimal(10, 2)), CAST(121.00 AS decimal(10, 2))),
    /* 1007 Q2'26: early, agreed price, exact quantity */
    (N'REG-2026-1007', CAST('2026-05-26' AS date), N'Hand sanitizer 500ml, carton of 24',
        CAST(383.00 AS decimal(12, 2)), CAST(383.00 AS decimal(12, 2)),
        CAST('2026-06-02' AS date), CAST('2026-05-30' AS date),
        CAST(36.00 AS decimal(10, 2)), CAST(36.00 AS decimal(10, 2))),
    /* 1007 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1007', CAST('2026-06-17' AS date), N'Paracetamol 500mg, box of 100',
        CAST(545.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-24' AS date), CAST(NULL AS date),
        CAST(44.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1007 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1007', CAST('2026-07-08' AS date), N'Paracetamol 500mg, box of 100',
        CAST(563.00 AS decimal(12, 2)), CAST(563.00 AS decimal(12, 2)),
        CAST('2026-07-15' AS date), CAST('2026-07-15' AS date),
        CAST(34.00 AS decimal(10, 2)), CAST(34.00 AS decimal(10, 2))),
    /* 1007 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1007', CAST('2026-07-17' AS date), N'Vitamin C tablets 1000mg, bottle of 100',
        CAST(310.00 AS decimal(12, 2)), CAST(310.00 AS decimal(12, 2)),
        CAST('2026-07-24' AS date), CAST('2026-07-24' AS date),
        CAST(58.00 AS decimal(10, 2)), CAST(58.00 AS decimal(10, 2))),
    /* 1007 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1007', CAST('2026-08-10' AS date), N'Surgical face masks, box of 50',
        CAST(56.00 AS decimal(12, 2)), CAST(56.00 AS decimal(12, 2)),
        CAST('2026-08-17' AS date), CAST('2026-08-17' AS date),
        CAST(140.00 AS decimal(10, 2)), CAST(140.00 AS decimal(10, 2))),
    /* 1007 Q3'26: on time, agreed price, over-delivered */
    (N'REG-2026-1007', CAST('2026-08-21' AS date), N'Hand sanitizer 500ml, carton of 24',
        CAST(383.00 AS decimal(12, 2)), CAST(383.00 AS decimal(12, 2)),
        CAST('2026-08-28' AS date), CAST('2026-08-28' AS date),
        CAST(30.00 AS decimal(10, 2)), CAST(33.00 AS decimal(10, 2))),
    /* 1007 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1007', CAST('2026-09-12' AS date), N'Paracetamol 500mg, box of 100',
        CAST(561.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-19' AS date), CAST(NULL AS date),
        CAST(34.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1008 Q4'25: late, overcharged, short */
    (N'REG-2026-1008', CAST('2025-10-09' AS date), N'Annual report booklet, 32 pages, saddle stitch',
        CAST(395.00 AS decimal(12, 2)), CAST(426.60 AS decimal(12, 2)),
        CAST('2025-10-16' AS date), CAST('2025-10-21' AS date),
        CAST(13.00 AS decimal(10, 2)), CAST(11.00 AS decimal(10, 2))),
    /* 1008 Q4'25: late, undercharged, short */
    (N'REG-2026-1008', CAST('2025-10-19' AS date), N'Business card printing, 500 pcs, matte',
        CAST(129.00 AS decimal(12, 2)), CAST(117.39 AS decimal(12, 2)),
        CAST('2025-10-26' AS date), CAST('2025-11-07' AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(12.00 AS decimal(10, 2))),
    /* 1008 Q4'25: early, agreed price, exact quantity */
    (N'REG-2026-1008', CAST('2025-11-14' AS date), N'Banner printing, PVC, 3 by 6 feet',
        CAST(153.00 AS decimal(12, 2)), CAST(153.00 AS decimal(12, 2)),
        CAST('2025-11-21' AS date), CAST('2025-11-19' AS date),
        CAST(12.00 AS decimal(10, 2)), CAST(12.00 AS decimal(10, 2))),
    /* 1008 Q4'25: early, agreed price, over-delivered */
    (N'REG-2026-1008', CAST('2025-12-02' AS date), N'Letterhead stationery, box of 500',
        CAST(263.00 AS decimal(12, 2)), CAST(263.00 AS decimal(12, 2)),
        CAST('2025-12-09' AS date), CAST('2025-12-07' AS date),
        CAST(15.00 AS decimal(10, 2)), CAST(17.00 AS decimal(10, 2))),
    /* 1008 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1008', CAST('2025-12-21' AS date), N'Annual report booklet, 32 pages, saddle stitch',
        CAST(407.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-28' AS date), CAST(NULL AS date),
        CAST(12.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1008 Q1'26: late, overcharged, short */
    (N'REG-2026-1008', CAST('2026-01-01' AS date), N'Annual report booklet, 32 pages, saddle stitch',
        CAST(410.00 AS decimal(12, 2)), CAST(463.30 AS decimal(12, 2)),
        CAST('2026-01-08' AS date), CAST('2026-01-17' AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(13.00 AS decimal(10, 2))),
    /* 1008 Q1'26: late, undercharged, short */
    (N'REG-2026-1008', CAST('2026-01-21' AS date), N'Business card printing, 500 pcs, matte',
        CAST(103.00 AS decimal(12, 2)), CAST(93.73 AS decimal(12, 2)),
        CAST('2026-01-28' AS date), CAST('2026-02-08' AS date),
        CAST(23.00 AS decimal(10, 2)), CAST(19.00 AS decimal(10, 2))),
    /* 1008 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1008', CAST('2026-02-06' AS date), N'Banner printing, PVC, 3 by 6 feet',
        CAST(154.00 AS decimal(12, 2)), CAST(154.00 AS decimal(12, 2)),
        CAST('2026-02-13' AS date), CAST('2026-02-13' AS date),
        CAST(13.00 AS decimal(10, 2)), CAST(13.00 AS decimal(10, 2))),
    /* 1008 Q1'26: late, overcharged, short */
    (N'REG-2026-1008', CAST('2026-02-25' AS date), N'Letterhead stationery, box of 500',
        CAST(285.00 AS decimal(12, 2)), CAST(316.35 AS decimal(12, 2)),
        CAST('2026-03-04' AS date), CAST('2026-03-11' AS date),
        CAST(11.00 AS decimal(10, 2)), CAST(9.00 AS decimal(10, 2))),
    /* 1008 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1008', CAST('2026-03-15' AS date), N'Annual report booklet, 32 pages, saddle stitch',
        CAST(434.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-22' AS date), CAST(NULL AS date),
        CAST(15.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1008 Q2'26: early, agreed price, exact quantity */
    (N'REG-2026-1008', CAST('2026-04-01' AS date), N'Annual report booklet, 32 pages, saddle stitch',
        CAST(391.00 AS decimal(12, 2)), CAST(391.00 AS decimal(12, 2)),
        CAST('2026-04-08' AS date), CAST('2026-04-06' AS date),
        CAST(14.00 AS decimal(10, 2)), CAST(14.00 AS decimal(10, 2))),
    /* 1008 Q2'26: late, undercharged, short */
    (N'REG-2026-1008', CAST('2026-04-22' AS date), N'Business card printing, 500 pcs, matte',
        CAST(110.00 AS decimal(12, 2)), CAST(97.90 AS decimal(12, 2)),
        CAST('2026-04-29' AS date), CAST('2026-05-10' AS date),
        CAST(20.00 AS decimal(10, 2)), CAST(16.00 AS decimal(10, 2))),
    /* 1008 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1008', CAST('2026-05-15' AS date), N'Banner printing, PVC, 3 by 6 feet',
        CAST(173.00 AS decimal(12, 2)), CAST(173.00 AS decimal(12, 2)),
        CAST('2026-05-22' AS date), CAST('2026-05-22' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(10.00 AS decimal(10, 2))),
    /* 1008 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1008', CAST('2026-05-26' AS date), N'Letterhead stationery, box of 500',
        CAST(307.00 AS decimal(12, 2)), CAST(307.00 AS decimal(12, 2)),
        CAST('2026-06-02' AS date), CAST('2026-06-02' AS date),
        CAST(17.00 AS decimal(10, 2)), CAST(17.00 AS decimal(10, 2))),
    /* 1008 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1008', CAST('2026-06-15' AS date), N'Annual report booklet, 32 pages, saddle stitch',
        CAST(396.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-22' AS date), CAST(NULL AS date),
        CAST(18.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1008 Q3'26: late, overcharged, short */
    (N'REG-2026-1008', CAST('2026-07-02' AS date), N'Annual report booklet, 32 pages, saddle stitch',
        CAST(434.00 AS decimal(12, 2)), CAST(473.06 AS decimal(12, 2)),
        CAST('2026-07-09' AS date), CAST('2026-07-15' AS date),
        CAST(19.00 AS decimal(10, 2)), CAST(16.00 AS decimal(10, 2))),
    /* 1008 Q3'26: late, overcharged, short */
    (N'REG-2026-1008', CAST('2026-07-19' AS date), N'Business card printing, 500 pcs, matte',
        CAST(131.00 AS decimal(12, 2)), CAST(144.10 AS decimal(12, 2)),
        CAST('2026-07-26' AS date), CAST('2026-07-31' AS date),
        CAST(21.00 AS decimal(10, 2)), CAST(17.00 AS decimal(10, 2))),
    /* 1008 Q3'26: late, undercharged, short */
    (N'REG-2026-1008', CAST('2026-08-04' AS date), N'Banner printing, PVC, 3 by 6 feet',
        CAST(165.00 AS decimal(12, 2)), CAST(153.45 AS decimal(12, 2)),
        CAST('2026-08-11' AS date), CAST('2026-08-19' AS date),
        CAST(12.00 AS decimal(10, 2)), CAST(9.00 AS decimal(10, 2))),
    /* 1008 Q3'26: early, agreed price, over-delivered */
    (N'REG-2026-1008', CAST('2026-08-24' AS date), N'Letterhead stationery, box of 500',
        CAST(275.00 AS decimal(12, 2)), CAST(275.00 AS decimal(12, 2)),
        CAST('2026-08-31' AS date), CAST('2026-08-29' AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(18.00 AS decimal(10, 2))),
    /* 1008 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1008', CAST('2026-09-08' AS date), N'Annual report booklet, 32 pages, saddle stitch',
        CAST(432.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-15' AS date), CAST(NULL AS date),
        CAST(14.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1009 Q4'25: on time, agreed price, over-delivered */
    (N'REG-2026-1009', CAST('2025-10-08' AS date), N'Ergonomic office chair, mesh back',
        CAST(1795.00 AS decimal(12, 2)), CAST(1795.00 AS decimal(12, 2)),
        CAST('2025-10-15' AS date), CAST('2025-10-15' AS date),
        CAST(8.00 AS decimal(10, 2)), CAST(9.00 AS decimal(10, 2))),
    /* 1009 Q4'25: early, agreed price, exact quantity */
    (N'REG-2026-1009', CAST('2025-10-27' AS date), N'Filing cabinet, 4-drawer, steel',
        CAST(564.00 AS decimal(12, 2)), CAST(564.00 AS decimal(12, 2)),
        CAST('2025-11-03' AS date), CAST('2025-11-02' AS date),
        CAST(13.00 AS decimal(10, 2)), CAST(13.00 AS decimal(10, 2))),
    /* 1009 Q4'25: early, agreed price, exact quantity */
    (N'REG-2026-1009', CAST('2025-11-11' AS date), N'Whiteboard, magnetic, 4 by 6 feet',
        CAST(308.00 AS decimal(12, 2)), CAST(308.00 AS decimal(12, 2)),
        CAST('2025-11-18' AS date), CAST('2025-11-15' AS date),
        CAST(9.00 AS decimal(10, 2)), CAST(9.00 AS decimal(10, 2))),
    /* 1009 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1009', CAST('2025-11-29' AS date), N'Desk organizer set, bamboo',
        CAST(94.00 AS decimal(12, 2)), CAST(94.00 AS decimal(12, 2)),
        CAST('2025-12-06' AS date), CAST('2025-12-06' AS date),
        CAST(21.00 AS decimal(10, 2)), CAST(21.00 AS decimal(10, 2))),
    /* 1009 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1009', CAST('2025-12-16' AS date), N'Ergonomic office chair, mesh back',
        CAST(1787.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-23' AS date), CAST(NULL AS date),
        CAST(5.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1009 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1009', CAST('2026-01-08' AS date), N'Ergonomic office chair, mesh back',
        CAST(1750.00 AS decimal(12, 2)), CAST(1750.00 AS decimal(12, 2)),
        CAST('2026-01-15' AS date), CAST('2026-01-15' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(10.00 AS decimal(10, 2))),
    /* 1009 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1009', CAST('2026-01-21' AS date), N'Filing cabinet, 4-drawer, steel',
        CAST(587.00 AS decimal(12, 2)), CAST(587.00 AS decimal(12, 2)),
        CAST('2026-01-28' AS date), CAST('2026-01-28' AS date),
        CAST(12.00 AS decimal(10, 2)), CAST(12.00 AS decimal(10, 2))),
    /* 1009 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1009', CAST('2026-02-06' AS date), N'Whiteboard, magnetic, 4 by 6 feet',
        CAST(335.00 AS decimal(12, 2)), CAST(335.00 AS decimal(12, 2)),
        CAST('2026-02-13' AS date), CAST('2026-02-13' AS date),
        CAST(7.00 AS decimal(10, 2)), CAST(7.00 AS decimal(10, 2))),
    /* 1009 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1009', CAST('2026-02-28' AS date), N'Desk organizer set, bamboo',
        CAST(70.00 AS decimal(12, 2)), CAST(70.00 AS decimal(12, 2)),
        CAST('2026-03-07' AS date), CAST('2026-03-07' AS date),
        CAST(23.00 AS decimal(10, 2)), CAST(23.00 AS decimal(10, 2))),
    /* 1009 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1009', CAST('2026-03-17' AS date), N'Ergonomic office chair, mesh back',
        CAST(1663.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-24' AS date), CAST(NULL AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1009 Q2'26: early, undercharged, exact quantity */
    (N'REG-2026-1009', CAST('2026-04-05' AS date), N'Ergonomic office chair, mesh back',
        CAST(1725.00 AS decimal(12, 2)), CAST(1673.25 AS decimal(12, 2)),
        CAST('2026-04-12' AS date), CAST('2026-04-09' AS date),
        CAST(8.00 AS decimal(10, 2)), CAST(8.00 AS decimal(10, 2))),
    /* 1009 Q2'26: early, agreed price, exact quantity */
    (N'REG-2026-1009', CAST('2026-04-21' AS date), N'Filing cabinet, 4-drawer, steel',
        CAST(604.00 AS decimal(12, 2)), CAST(604.00 AS decimal(12, 2)),
        CAST('2026-04-28' AS date), CAST('2026-04-25' AS date),
        CAST(13.00 AS decimal(10, 2)), CAST(13.00 AS decimal(10, 2))),
    /* 1009 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1009', CAST('2026-05-08' AS date), N'Whiteboard, magnetic, 4 by 6 feet',
        CAST(297.00 AS decimal(12, 2)), CAST(297.00 AS decimal(12, 2)),
        CAST('2026-05-15' AS date), CAST('2026-05-15' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(10.00 AS decimal(10, 2))),
    /* 1009 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1009', CAST('2026-06-01' AS date), N'Desk organizer set, bamboo',
        CAST(86.00 AS decimal(12, 2)), CAST(86.00 AS decimal(12, 2)),
        CAST('2026-06-08' AS date), CAST('2026-06-08' AS date),
        CAST(26.00 AS decimal(10, 2)), CAST(26.00 AS decimal(10, 2))),
    /* 1009 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1009', CAST('2026-06-20' AS date), N'Ergonomic office chair, mesh back',
        CAST(1662.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-27' AS date), CAST(NULL AS date),
        CAST(5.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1009 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1009', CAST('2026-07-03' AS date), N'Ergonomic office chair, mesh back',
        CAST(1848.00 AS decimal(12, 2)), CAST(1848.00 AS decimal(12, 2)),
        CAST('2026-07-10' AS date), CAST('2026-07-10' AS date),
        CAST(7.00 AS decimal(10, 2)), CAST(7.00 AS decimal(10, 2))),
    /* 1009 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1009', CAST('2026-07-17' AS date), N'Filing cabinet, 4-drawer, steel',
        CAST(553.00 AS decimal(12, 2)), CAST(553.00 AS decimal(12, 2)),
        CAST('2026-07-24' AS date), CAST('2026-07-24' AS date),
        CAST(11.00 AS decimal(10, 2)), CAST(11.00 AS decimal(10, 2))),
    /* 1009 Q3'26: early, agreed price, exact quantity */
    (N'REG-2026-1009', CAST('2026-08-07' AS date), N'Whiteboard, magnetic, 4 by 6 feet',
        CAST(316.00 AS decimal(12, 2)), CAST(316.00 AS decimal(12, 2)),
        CAST('2026-08-14' AS date), CAST('2026-08-11' AS date),
        CAST(7.00 AS decimal(10, 2)), CAST(7.00 AS decimal(10, 2))),
    /* 1009 Q3'26: on time, undercharged, exact quantity */
    (N'REG-2026-1009', CAST('2026-08-20' AS date), N'Desk organizer set, bamboo',
        CAST(76.00 AS decimal(12, 2)), CAST(72.20 AS decimal(12, 2)),
        CAST('2026-08-27' AS date), CAST('2026-08-27' AS date),
        CAST(26.00 AS decimal(10, 2)), CAST(26.00 AS decimal(10, 2))),
    /* 1009 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1009', CAST('2026-09-10' AS date), N'Ergonomic office chair, mesh back',
        CAST(1692.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-17' AS date), CAST(NULL AS date),
        CAST(8.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1010 Q4'25: late, overcharged, short */
    (N'REG-2026-1010', CAST('2025-10-07' AS date), N'Solar inverter, 5kW, single phase',
        CAST(301.00 AS decimal(12, 2)), CAST(343.14 AS decimal(12, 2)),
        CAST('2025-10-14' AS date), CAST('2025-10-24' AS date),
        CAST(97.00 AS decimal(10, 2)), CAST(82.00 AS decimal(10, 2))),
    /* 1010 Q4'25: late, overcharged, short */
    (N'REG-2026-1010', CAST('2025-10-19' AS date), N'Solar panel, 450W monocrystalline',
        CAST(550.00 AS decimal(12, 2)), CAST(599.50 AS decimal(12, 2)),
        CAST('2025-10-26' AS date), CAST('2025-11-05' AS date),
        CAST(68.00 AS decimal(10, 2)), CAST(54.00 AS decimal(10, 2))),
    /* 1010 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1010', CAST('2025-11-12' AS date), N'Battery storage unit, 5kWh lithium',
        CAST(4313.00 AS decimal(12, 2)), CAST(4313.00 AS decimal(12, 2)),
        CAST('2025-11-19' AS date), CAST('2025-11-19' AS date),
        CAST(8.00 AS decimal(10, 2)), CAST(8.00 AS decimal(10, 2))),
    /* 1010 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1010', CAST('2025-11-27' AS date), N'Solar mounting rail kit, aluminium',
        CAST(195.00 AS decimal(12, 2)), CAST(195.00 AS decimal(12, 2)),
        CAST('2025-12-04' AS date), CAST('2025-12-04' AS date),
        CAST(43.00 AS decimal(10, 2)), CAST(43.00 AS decimal(10, 2))),
    /* 1010 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1010', CAST('2025-12-15' AS date), N'Solar inverter, 5kW, single phase',
        CAST(313.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-22' AS date), CAST(NULL AS date),
        CAST(94.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1010 Q1'26: late, overcharged, short */
    (N'REG-2026-1010', CAST('2026-01-05' AS date), N'Solar inverter, 5kW, single phase',
        CAST(302.00 AS decimal(12, 2)), CAST(344.28 AS decimal(12, 2)),
        CAST('2026-01-12' AS date), CAST('2026-01-21' AS date),
        CAST(103.00 AS decimal(10, 2)), CAST(89.00 AS decimal(10, 2))),
    /* 1010 Q1'26: late, overcharged, short */
    (N'REG-2026-1010', CAST('2026-01-24' AS date), N'Solar panel, 450W monocrystalline',
        CAST(536.00 AS decimal(12, 2)), CAST(600.32 AS decimal(12, 2)),
        CAST('2026-01-31' AS date), CAST('2026-02-11' AS date),
        CAST(45.00 AS decimal(10, 2)), CAST(36.00 AS decimal(10, 2))),
    /* 1010 Q1'26: late, overcharged, short */
    (N'REG-2026-1010', CAST('2026-02-12' AS date), N'Battery storage unit, 5kWh lithium',
        CAST(4612.00 AS decimal(12, 2)), CAST(5165.44 AS decimal(12, 2)),
        CAST('2026-02-19' AS date), CAST('2026-02-23' AS date),
        CAST(8.00 AS decimal(10, 2)), CAST(6.00 AS decimal(10, 2))),
    /* 1010 Q1'26: early, undercharged, exact quantity */
    (N'REG-2026-1010', CAST('2026-02-26' AS date), N'Solar mounting rail kit, aluminium',
        CAST(221.00 AS decimal(12, 2)), CAST(205.53 AS decimal(12, 2)),
        CAST('2026-03-05' AS date), CAST('2026-03-04' AS date),
        CAST(35.00 AS decimal(10, 2)), CAST(35.00 AS decimal(10, 2))),
    /* 1010 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1010', CAST('2026-03-13' AS date), N'Solar inverter, 5kW, single phase',
        CAST(317.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-20' AS date), CAST(NULL AS date),
        CAST(108.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1010 Q2'26: early, agreed price, exact quantity */
    (N'REG-2026-1010', CAST('2026-04-01' AS date), N'Solar inverter, 5kW, single phase',
        CAST(319.00 AS decimal(12, 2)), CAST(319.00 AS decimal(12, 2)),
        CAST('2026-04-08' AS date), CAST('2026-04-06' AS date),
        CAST(115.00 AS decimal(10, 2)), CAST(115.00 AS decimal(10, 2))),
    /* 1010 Q2'26: late, overcharged, short */
    (N'REG-2026-1010', CAST('2026-04-21' AS date), N'Solar panel, 450W monocrystalline',
        CAST(551.00 AS decimal(12, 2)), CAST(606.10 AS decimal(12, 2)),
        CAST('2026-04-28' AS date), CAST('2026-05-04' AS date),
        CAST(69.00 AS decimal(10, 2)), CAST(54.00 AS decimal(10, 2))),
    /* 1010 Q2'26: late, overcharged, short */
    (N'REG-2026-1010', CAST('2026-05-12' AS date), N'Battery storage unit, 5kWh lithium',
        CAST(4449.00 AS decimal(12, 2)), CAST(4893.90 AS decimal(12, 2)),
        CAST('2026-05-19' AS date), CAST('2026-05-30' AS date),
        CAST(5.00 AS decimal(10, 2)), CAST(4.00 AS decimal(10, 2))),
    /* 1010 Q2'26: early, agreed price, over-delivered */
    (N'REG-2026-1010', CAST('2026-05-27' AS date), N'Solar mounting rail kit, aluminium',
        CAST(192.00 AS decimal(12, 2)), CAST(192.00 AS decimal(12, 2)),
        CAST('2026-06-03' AS date), CAST('2026-05-31' AS date),
        CAST(44.00 AS decimal(10, 2)), CAST(46.00 AS decimal(10, 2))),
    /* 1010 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1010', CAST('2026-06-20' AS date), N'Solar inverter, 5kW, single phase',
        CAST(298.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-27' AS date), CAST(NULL AS date),
        CAST(111.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1010 Q3'26: late, overcharged, short */
    (N'REG-2026-1010', CAST('2026-07-08' AS date), N'Solar inverter, 5kW, single phase',
        CAST(297.00 AS decimal(12, 2)), CAST(350.46 AS decimal(12, 2)),
        CAST('2026-07-15' AS date), CAST('2026-07-25' AS date),
        CAST(83.00 AS decimal(10, 2)), CAST(75.00 AS decimal(10, 2))),
    /* 1010 Q3'26: late, overcharged, short */
    (N'REG-2026-1010', CAST('2026-07-21' AS date), N'Solar panel, 450W monocrystalline',
        CAST(556.00 AS decimal(12, 2)), CAST(617.16 AS decimal(12, 2)),
        CAST('2026-07-28' AS date), CAST('2026-08-02' AS date),
        CAST(41.00 AS decimal(10, 2)), CAST(35.00 AS decimal(10, 2))),
    /* 1010 Q3'26: late, undercharged, short */
    (N'REG-2026-1010', CAST('2026-08-06' AS date), N'Battery storage unit, 5kWh lithium',
        CAST(4216.00 AS decimal(12, 2)), CAST(3920.88 AS decimal(12, 2)),
        CAST('2026-08-13' AS date), CAST('2026-08-25' AS date),
        CAST(5.00 AS decimal(10, 2)), CAST(4.00 AS decimal(10, 2))),
    /* 1010 Q3'26: late, undercharged, short */
    (N'REG-2026-1010', CAST('2026-08-23' AS date), N'Solar mounting rail kit, aluminium',
        CAST(198.00 AS decimal(12, 2)), CAST(182.16 AS decimal(12, 2)),
        CAST('2026-08-30' AS date), CAST('2026-09-06' AS date),
        CAST(27.00 AS decimal(10, 2)), CAST(21.00 AS decimal(10, 2))),
    /* 1010 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1010', CAST('2026-09-08' AS date), N'Solar inverter, 5kW, single phase',
        CAST(319.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-15' AS date), CAST(NULL AS date),
        CAST(120.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1011 Q4'25: late, overcharged, short */
    (N'REG-2026-1011', CAST('2025-10-05' AS date), N'Frozen prawn, 31/40, kilogram',
        CAST(448.00 AS decimal(12, 2)), CAST(488.32 AS decimal(12, 2)),
        CAST('2025-10-12' AS date), CAST('2025-10-18' AS date),
        CAST(212.00 AS decimal(10, 2)), CAST(161.00 AS decimal(10, 2))),
    /* 1011 Q4'25: early, agreed price, exact quantity */
    (N'REG-2026-1011', CAST('2025-10-24' AS date), N'Frozen squid, cleaned, kilogram',
        CAST(317.00 AS decimal(12, 2)), CAST(317.00 AS decimal(12, 2)),
        CAST('2025-10-31' AS date), CAST('2025-10-29' AS date),
        CAST(143.00 AS decimal(10, 2)), CAST(143.00 AS decimal(10, 2))),
    /* 1011 Q4'25: late, overcharged, short */
    (N'REG-2026-1011', CAST('2025-11-08' AS date), N'Fresh fish fillet, dory, kilogram',
        CAST(239.00 AS decimal(12, 2)), CAST(277.24 AS decimal(12, 2)),
        CAST('2025-11-15' AS date), CAST('2025-11-21' AS date),
        CAST(111.00 AS decimal(10, 2)), CAST(97.00 AS decimal(10, 2))),
    /* 1011 Q4'25: late, overcharged, short */
    (N'REG-2026-1011', CAST('2025-12-01' AS date), N'Frozen crab meat, kilogram',
        CAST(533.00 AS decimal(12, 2)), CAST(580.97 AS decimal(12, 2)),
        CAST('2025-12-08' AS date), CAST('2025-12-15' AS date),
        CAST(74.00 AS decimal(10, 2)), CAST(66.00 AS decimal(10, 2))),
    /* 1011 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1011', CAST('2025-12-14' AS date), N'Frozen prawn, 31/40, kilogram',
        CAST(452.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-21' AS date), CAST(NULL AS date),
        CAST(217.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1011 Q1'26: late, undercharged, short */
    (N'REG-2026-1011', CAST('2026-01-01' AS date), N'Frozen prawn, 31/40, kilogram',
        CAST(457.00 AS decimal(12, 2)), CAST(411.30 AS decimal(12, 2)),
        CAST('2026-01-08' AS date), CAST('2026-01-19' AS date),
        CAST(176.00 AS decimal(10, 2)), CAST(148.00 AS decimal(10, 2))),
    /* 1011 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1011', CAST('2026-01-21' AS date), N'Frozen squid, cleaned, kilogram',
        CAST(338.00 AS decimal(12, 2)), CAST(338.00 AS decimal(12, 2)),
        CAST('2026-01-28' AS date), CAST('2026-01-28' AS date),
        CAST(124.00 AS decimal(10, 2)), CAST(124.00 AS decimal(10, 2))),
    /* 1011 Q1'26: late, undercharged, short */
    (N'REG-2026-1011', CAST('2026-02-06' AS date), N'Fresh fish fillet, dory, kilogram',
        CAST(280.00 AS decimal(12, 2)), CAST(257.60 AS decimal(12, 2)),
        CAST('2026-02-13' AS date), CAST('2026-02-23' AS date),
        CAST(108.00 AS decimal(10, 2)), CAST(86.00 AS decimal(10, 2))),
    /* 1011 Q1'26: on time, undercharged, exact quantity */
    (N'REG-2026-1011', CAST('2026-02-27' AS date), N'Frozen crab meat, kilogram',
        CAST(533.00 AS decimal(12, 2)), CAST(495.69 AS decimal(12, 2)),
        CAST('2026-03-06' AS date), CAST('2026-03-06' AS date),
        CAST(60.00 AS decimal(10, 2)), CAST(60.00 AS decimal(10, 2))),
    /* 1011 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1011', CAST('2026-03-19' AS date), N'Frozen prawn, 31/40, kilogram',
        CAST(442.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-26' AS date), CAST(NULL AS date),
        CAST(210.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1011 Q2'26: early, agreed price, exact quantity */
    (N'REG-2026-1011', CAST('2026-04-07' AS date), N'Frozen prawn, 31/40, kilogram',
        CAST(418.00 AS decimal(12, 2)), CAST(418.00 AS decimal(12, 2)),
        CAST('2026-04-14' AS date), CAST('2026-04-12' AS date),
        CAST(211.00 AS decimal(10, 2)), CAST(211.00 AS decimal(10, 2))),
    /* 1011 Q2'26: late, overcharged, short */
    (N'REG-2026-1011', CAST('2026-04-20' AS date), N'Frozen squid, cleaned, kilogram',
        CAST(291.00 AS decimal(12, 2)), CAST(331.74 AS decimal(12, 2)),
        CAST('2026-04-27' AS date), CAST('2026-05-06' AS date),
        CAST(141.00 AS decimal(10, 2)), CAST(107.00 AS decimal(10, 2))),
    /* 1011 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1011', CAST('2026-05-16' AS date), N'Fresh fish fillet, dory, kilogram',
        CAST(267.00 AS decimal(12, 2)), CAST(267.00 AS decimal(12, 2)),
        CAST('2026-05-23' AS date), CAST('2026-05-23' AS date),
        CAST(135.00 AS decimal(10, 2)), CAST(135.00 AS decimal(10, 2))),
    /* 1011 Q2'26: on time, undercharged, exact quantity */
    (N'REG-2026-1011', CAST('2026-05-28' AS date), N'Frozen crab meat, kilogram',
        CAST(492.00 AS decimal(12, 2)), CAST(462.48 AS decimal(12, 2)),
        CAST('2026-06-04' AS date), CAST('2026-06-04' AS date),
        CAST(98.00 AS decimal(10, 2)), CAST(98.00 AS decimal(10, 2))),
    /* 1011 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1011', CAST('2026-06-15' AS date), N'Frozen prawn, 31/40, kilogram',
        CAST(414.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-22' AS date), CAST(NULL AS date),
        CAST(161.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1011 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1011', CAST('2026-07-03' AS date), N'Frozen prawn, 31/40, kilogram',
        CAST(400.00 AS decimal(12, 2)), CAST(400.00 AS decimal(12, 2)),
        CAST('2026-07-10' AS date), CAST('2026-07-10' AS date),
        CAST(155.00 AS decimal(10, 2)), CAST(155.00 AS decimal(10, 2))),
    /* 1011 Q3'26: late, overcharged, short */
    (N'REG-2026-1011', CAST('2026-07-19' AS date), N'Frozen squid, cleaned, kilogram',
        CAST(325.00 AS decimal(12, 2)), CAST(364.00 AS decimal(12, 2)),
        CAST('2026-07-26' AS date), CAST('2026-07-30' AS date),
        CAST(147.00 AS decimal(10, 2)), CAST(122.00 AS decimal(10, 2))),
    /* 1011 Q3'26: late, overcharged, short */
    (N'REG-2026-1011', CAST('2026-08-08' AS date), N'Fresh fish fillet, dory, kilogram',
        CAST(254.00 AS decimal(12, 2)), CAST(276.86 AS decimal(12, 2)),
        CAST('2026-08-15' AS date), CAST('2026-08-23' AS date),
        CAST(142.00 AS decimal(10, 2)), CAST(125.00 AS decimal(10, 2))),
    /* 1011 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1011', CAST('2026-08-27' AS date), N'Frozen crab meat, kilogram',
        CAST(544.00 AS decimal(12, 2)), CAST(544.00 AS decimal(12, 2)),
        CAST('2026-09-03' AS date), CAST('2026-09-03' AS date),
        CAST(89.00 AS decimal(10, 2)), CAST(89.00 AS decimal(10, 2))),
    /* 1011 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1011', CAST('2026-09-06' AS date), N'Frozen prawn, 31/40, kilogram',
        CAST(435.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-13' AS date), CAST(NULL AS date),
        CAST(156.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1012 Q4'25: early, agreed price, over-delivered */
    (N'REG-2026-1012', CAST('2025-10-10' AS date), N'CCTV camera, 4 megapixel, outdoor',
        CAST(1238.00 AS decimal(12, 2)), CAST(1238.00 AS decimal(12, 2)),
        CAST('2025-10-17' AS date), CAST('2025-10-15' AS date),
        CAST(19.00 AS decimal(10, 2)), CAST(20.00 AS decimal(10, 2))),
    /* 1012 Q4'25: early, agreed price, exact quantity */
    (N'REG-2026-1012', CAST('2025-10-27' AS date), N'Access control system, card reader set',
        CAST(1516.00 AS decimal(12, 2)), CAST(1516.00 AS decimal(12, 2)),
        CAST('2025-11-03' AS date), CAST('2025-10-31' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(10.00 AS decimal(10, 2))),
    /* 1012 Q4'25: on time, agreed price, over-delivered */
    (N'REG-2026-1012', CAST('2025-11-15' AS date), N'Alarm sensor kit, motion and door',
        CAST(378.00 AS decimal(12, 2)), CAST(378.00 AS decimal(12, 2)),
        CAST('2025-11-22' AS date), CAST('2025-11-22' AS date),
        CAST(25.00 AS decimal(10, 2)), CAST(27.00 AS decimal(10, 2))),
    /* 1012 Q4'25: early, agreed price, exact quantity */
    (N'REG-2026-1012', CAST('2025-11-25' AS date), N'NVR recorder, 16 channel',
        CAST(1859.00 AS decimal(12, 2)), CAST(1859.00 AS decimal(12, 2)),
        CAST('2025-12-02' AS date), CAST('2025-11-30' AS date),
        CAST(9.00 AS decimal(10, 2)), CAST(9.00 AS decimal(10, 2))),
    /* 1012 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1012', CAST('2025-12-15' AS date), N'CCTV camera, 4 megapixel, outdoor',
        CAST(1244.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-22' AS date), CAST(NULL AS date),
        CAST(18.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1012 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1012', CAST('2026-01-03' AS date), N'CCTV camera, 4 megapixel, outdoor',
        CAST(1195.00 AS decimal(12, 2)), CAST(1195.00 AS decimal(12, 2)),
        CAST('2026-01-10' AS date), CAST('2026-01-10' AS date),
        CAST(19.00 AS decimal(10, 2)), CAST(19.00 AS decimal(10, 2))),
    /* 1012 Q1'26: early, agreed price, exact quantity */
    (N'REG-2026-1012', CAST('2026-01-19' AS date), N'Access control system, card reader set',
        CAST(1643.00 AS decimal(12, 2)), CAST(1643.00 AS decimal(12, 2)),
        CAST('2026-01-26' AS date), CAST('2026-01-25' AS date),
        CAST(14.00 AS decimal(10, 2)), CAST(14.00 AS decimal(10, 2))),
    /* 1012 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1012', CAST('2026-02-07' AS date), N'Alarm sensor kit, motion and door',
        CAST(374.00 AS decimal(12, 2)), CAST(374.00 AS decimal(12, 2)),
        CAST('2026-02-14' AS date), CAST('2026-02-14' AS date),
        CAST(26.00 AS decimal(10, 2)), CAST(26.00 AS decimal(10, 2))),
    /* 1012 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1012', CAST('2026-02-24' AS date), N'NVR recorder, 16 channel',
        CAST(1889.00 AS decimal(12, 2)), CAST(1889.00 AS decimal(12, 2)),
        CAST('2026-03-03' AS date), CAST('2026-03-03' AS date),
        CAST(7.00 AS decimal(10, 2)), CAST(7.00 AS decimal(10, 2))),
    /* 1012 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1012', CAST('2026-03-20' AS date), N'CCTV camera, 4 megapixel, outdoor',
        CAST(1221.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-27' AS date), CAST(NULL AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1012 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1012', CAST('2026-04-02' AS date), N'CCTV camera, 4 megapixel, outdoor',
        CAST(1237.00 AS decimal(12, 2)), CAST(1237.00 AS decimal(12, 2)),
        CAST('2026-04-09' AS date), CAST('2026-04-09' AS date),
        CAST(12.00 AS decimal(10, 2)), CAST(12.00 AS decimal(10, 2))),
    /* 1012 Q2'26: late, undercharged, short */
    (N'REG-2026-1012', CAST('2026-04-21' AS date), N'Access control system, card reader set',
        CAST(1454.00 AS decimal(12, 2)), CAST(1352.22 AS decimal(12, 2)),
        CAST('2026-04-28' AS date), CAST('2026-05-04' AS date),
        CAST(8.00 AS decimal(10, 2)), CAST(7.00 AS decimal(10, 2))),
    /* 1012 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1012', CAST('2026-05-14' AS date), N'Alarm sensor kit, motion and door',
        CAST(347.00 AS decimal(12, 2)), CAST(347.00 AS decimal(12, 2)),
        CAST('2026-05-21' AS date), CAST('2026-05-21' AS date),
        CAST(24.00 AS decimal(10, 2)), CAST(24.00 AS decimal(10, 2))),
    /* 1012 Q2'26: on time, undercharged, over-delivered */
    (N'REG-2026-1012', CAST('2026-05-25' AS date), N'NVR recorder, 16 channel',
        CAST(1848.00 AS decimal(12, 2)), CAST(1737.12 AS decimal(12, 2)),
        CAST('2026-06-01' AS date), CAST('2026-06-01' AS date),
        CAST(5.00 AS decimal(10, 2)), CAST(6.00 AS decimal(10, 2))),
    /* 1012 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1012', CAST('2026-06-18' AS date), N'CCTV camera, 4 megapixel, outdoor',
        CAST(1220.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-25' AS date), CAST(NULL AS date),
        CAST(14.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1012 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1012', CAST('2026-07-02' AS date), N'CCTV camera, 4 megapixel, outdoor',
        CAST(1249.00 AS decimal(12, 2)), CAST(1249.00 AS decimal(12, 2)),
        CAST('2026-07-09' AS date), CAST('2026-07-09' AS date),
        CAST(19.00 AS decimal(10, 2)), CAST(19.00 AS decimal(10, 2))),
    /* 1012 Q3'26: early, agreed price, over-delivered */
    (N'REG-2026-1012', CAST('2026-07-23' AS date), N'Access control system, card reader set',
        CAST(1511.00 AS decimal(12, 2)), CAST(1511.00 AS decimal(12, 2)),
        CAST('2026-07-30' AS date), CAST('2026-07-28' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(11.00 AS decimal(10, 2))),
    /* 1012 Q3'26: on time, undercharged, exact quantity */
    (N'REG-2026-1012', CAST('2026-08-08' AS date), N'Alarm sensor kit, motion and door',
        CAST(391.00 AS decimal(12, 2)), CAST(375.36 AS decimal(12, 2)),
        CAST('2026-08-15' AS date), CAST('2026-08-15' AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(16.00 AS decimal(10, 2))),
    /* 1012 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1012', CAST('2026-08-20' AS date), N'NVR recorder, 16 channel',
        CAST(1658.00 AS decimal(12, 2)), CAST(1658.00 AS decimal(12, 2)),
        CAST('2026-08-27' AS date), CAST('2026-08-27' AS date),
        CAST(5.00 AS decimal(10, 2)), CAST(5.00 AS decimal(10, 2))),
    /* 1012 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1012', CAST('2026-09-12' AS date), N'CCTV camera, 4 megapixel, outdoor',
        CAST(1234.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-19' AS date), CAST(NULL AS date),
        CAST(14.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1013 Q4'25: late, overcharged, short */
    (N'REG-2026-1013', CAST('2025-10-04' AS date), N'Staff lunch bento, chicken rice',
        CAST(564.00 AS decimal(12, 2)), CAST(626.04 AS decimal(12, 2)),
        CAST('2025-10-11' AS date), CAST('2025-10-22' AS date),
        CAST(85.00 AS decimal(10, 2)), CAST(75.00 AS decimal(10, 2))),
    /* 1013 Q4'25: late, overcharged, short */
    (N'REG-2026-1013', CAST('2025-10-26' AS date), N'Buffet catering pack, western, 80 pax',
        CAST(1670.00 AS decimal(12, 2)), CAST(1820.30 AS decimal(12, 2)),
        CAST('2025-11-02' AS date), CAST('2025-11-10' AS date),
        CAST(79.00 AS decimal(10, 2)), CAST(59.00 AS decimal(10, 2))),
    /* 1013 Q4'25: late, overcharged, short */
    (N'REG-2026-1013', CAST('2025-11-07' AS date), N'High tea set, kuih and pastries, 50 pax',
        CAST(802.00 AS decimal(12, 2)), CAST(898.24 AS decimal(12, 2)),
        CAST('2025-11-14' AS date), CAST('2025-11-25' AS date),
        CAST(48.00 AS decimal(10, 2)), CAST(36.00 AS decimal(10, 2))),
    /* 1013 Q4'25: late, overcharged, short */
    (N'REG-2026-1013', CAST('2025-11-24' AS date), N'Event canapé service, 100 pax',
        CAST(2259.00 AS decimal(12, 2)), CAST(2620.44 AS decimal(12, 2)),
        CAST('2025-12-01' AS date), CAST('2025-12-11' AS date),
        CAST(94.00 AS decimal(10, 2)), CAST(73.00 AS decimal(10, 2))),
    /* 1013 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1013', CAST('2025-12-14' AS date), N'Staff lunch bento, chicken rice',
        CAST(587.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-21' AS date), CAST(NULL AS date),
        CAST(78.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1013 Q1'26: late, overcharged, short */
    (N'REG-2026-1013', CAST('2026-01-02' AS date), N'Staff lunch bento, chicken rice',
        CAST(565.00 AS decimal(12, 2)), CAST(649.75 AS decimal(12, 2)),
        CAST('2026-01-09' AS date), CAST('2026-01-20' AS date),
        CAST(88.00 AS decimal(10, 2)), CAST(75.00 AS decimal(10, 2))),
    /* 1013 Q1'26: late, undercharged, short */
    (N'REG-2026-1013', CAST('2026-01-21' AS date), N'Buffet catering pack, western, 80 pax',
        CAST(1625.00 AS decimal(12, 2)), CAST(1495.00 AS decimal(12, 2)),
        CAST('2026-01-28' AS date), CAST('2026-02-04' AS date),
        CAST(87.00 AS decimal(10, 2)), CAST(68.00 AS decimal(10, 2))),
    /* 1013 Q1'26: late, undercharged, short */
    (N'REG-2026-1013', CAST('2026-02-08' AS date), N'High tea set, kuih and pastries, 50 pax',
        CAST(786.00 AS decimal(12, 2)), CAST(715.26 AS decimal(12, 2)),
        CAST('2026-02-15' AS date), CAST('2026-02-26' AS date),
        CAST(48.00 AS decimal(10, 2)), CAST(41.00 AS decimal(10, 2))),
    /* 1013 Q1'26: late, undercharged, short */
    (N'REG-2026-1013', CAST('2026-02-24' AS date), N'Event canapé service, 100 pax',
        CAST(2217.00 AS decimal(12, 2)), CAST(1995.30 AS decimal(12, 2)),
        CAST('2026-03-03' AS date), CAST('2026-03-14' AS date),
        CAST(103.00 AS decimal(10, 2)), CAST(91.00 AS decimal(10, 2))),
    /* 1013 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1013', CAST('2026-03-17' AS date), N'Staff lunch bento, chicken rice',
        CAST(597.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-24' AS date), CAST(NULL AS date),
        CAST(86.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1013 Q2'26: late, overcharged, short */
    (N'REG-2026-1013', CAST('2026-04-03' AS date), N'Staff lunch bento, chicken rice',
        CAST(580.00 AS decimal(12, 2)), CAST(684.40 AS decimal(12, 2)),
        CAST('2026-04-10' AS date), CAST('2026-04-15' AS date),
        CAST(92.00 AS decimal(10, 2)), CAST(79.00 AS decimal(10, 2))),
    /* 1013 Q2'26: late, overcharged, short */
    (N'REG-2026-1013', CAST('2026-04-22' AS date), N'Buffet catering pack, western, 80 pax',
        CAST(1807.00 AS decimal(12, 2)), CAST(1951.56 AS decimal(12, 2)),
        CAST('2026-04-29' AS date), CAST('2026-05-09' AS date),
        CAST(71.00 AS decimal(10, 2)), CAST(55.00 AS decimal(10, 2))),
    /* 1013 Q2'26: late, overcharged, short */
    (N'REG-2026-1013', CAST('2026-05-13' AS date), N'High tea set, kuih and pastries, 50 pax',
        CAST(754.00 AS decimal(12, 2)), CAST(852.02 AS decimal(12, 2)),
        CAST('2026-05-20' AS date), CAST('2026-05-27' AS date),
        CAST(53.00 AS decimal(10, 2)), CAST(46.00 AS decimal(10, 2))),
    /* 1013 Q2'26: late, overcharged, short */
    (N'REG-2026-1013', CAST('2026-05-25' AS date), N'Event canapé service, 100 pax',
        CAST(2340.00 AS decimal(12, 2)), CAST(2574.00 AS decimal(12, 2)),
        CAST('2026-06-01' AS date), CAST('2026-06-11' AS date),
        CAST(114.00 AS decimal(10, 2)), CAST(97.00 AS decimal(10, 2))),
    /* 1013 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1013', CAST('2026-06-19' AS date), N'Staff lunch bento, chicken rice',
        CAST(521.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-26' AS date), CAST(NULL AS date),
        CAST(94.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1013 Q3'26: late, undercharged, short */
    (N'REG-2026-1013', CAST('2026-07-05' AS date), N'Staff lunch bento, chicken rice',
        CAST(534.00 AS decimal(12, 2)), CAST(485.94 AS decimal(12, 2)),
        CAST('2026-07-12' AS date), CAST('2026-07-20' AS date),
        CAST(100.00 AS decimal(10, 2)), CAST(79.00 AS decimal(10, 2))),
    /* 1013 Q3'26: late, overcharged, short */
    (N'REG-2026-1013', CAST('2026-07-23' AS date), N'Buffet catering pack, western, 80 pax',
        CAST(1890.00 AS decimal(12, 2)), CAST(2097.90 AS decimal(12, 2)),
        CAST('2026-07-30' AS date), CAST('2026-08-08' AS date),
        CAST(89.00 AS decimal(10, 2)), CAST(79.00 AS decimal(10, 2))),
    /* 1013 Q3'26: late, overcharged, short */
    (N'REG-2026-1013', CAST('2026-08-07' AS date), N'High tea set, kuih and pastries, 50 pax',
        CAST(793.00 AS decimal(12, 2)), CAST(872.30 AS decimal(12, 2)),
        CAST('2026-08-14' AS date), CAST('2026-08-22' AS date),
        CAST(59.00 AS decimal(10, 2)), CAST(50.00 AS decimal(10, 2))),
    /* 1013 Q3'26: late, overcharged, short */
    (N'REG-2026-1013', CAST('2026-08-23' AS date), N'Event canapé service, 100 pax',
        CAST(2416.00 AS decimal(12, 2)), CAST(2778.40 AS decimal(12, 2)),
        CAST('2026-08-30' AS date), CAST('2026-09-08' AS date),
        CAST(107.00 AS decimal(10, 2)), CAST(94.00 AS decimal(10, 2))),
    /* 1013 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1013', CAST('2026-09-09' AS date), N'Staff lunch bento, chicken rice',
        CAST(569.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-16' AS date), CAST(NULL AS date),
        CAST(79.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1014 Q4'25: early, agreed price, exact quantity */
    (N'REG-2026-1014', CAST('2025-10-01' AS date), N'Cotton drill uniform cloth, metre',
        CAST(2049.00 AS decimal(12, 2)), CAST(2049.00 AS decimal(12, 2)),
        CAST('2025-10-08' AS date), CAST('2025-10-05' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(10.00 AS decimal(10, 2))),
    /* 1014 Q4'25: early, agreed price, over-delivered */
    (N'REG-2026-1014', CAST('2025-10-25' AS date), N'Polyester fabric roll, metre',
        CAST(1303.00 AS decimal(12, 2)), CAST(1303.00 AS decimal(12, 2)),
        CAST('2025-11-01' AS date), CAST('2025-10-30' AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(17.00 AS decimal(10, 2))),
    /* 1014 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1014', CAST('2025-11-08' AS date), N'Dye batch, industrial grade, drum',
        CAST(1896.00 AS decimal(12, 2)), CAST(1896.00 AS decimal(12, 2)),
        CAST('2025-11-15' AS date), CAST('2025-11-15' AS date),
        CAST(6.00 AS decimal(10, 2)), CAST(6.00 AS decimal(10, 2))),
    /* 1014 Q4'25: late, overcharged, short */
    (N'REG-2026-1014', CAST('2025-11-26' AS date), N'Canvas fabric roll, heavy duty, metre',
        CAST(1519.00 AS decimal(12, 2)), CAST(1701.28 AS decimal(12, 2)),
        CAST('2025-12-03' AS date), CAST('2025-12-10' AS date),
        CAST(13.00 AS decimal(10, 2)), CAST(11.00 AS decimal(10, 2))),
    /* 1014 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1014', CAST('2025-12-20' AS date), N'Cotton drill uniform cloth, metre',
        CAST(2151.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-27' AS date), CAST(NULL AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1014 Q1'26: late, overcharged, short */
    (N'REG-2026-1014', CAST('2026-01-04' AS date), N'Cotton drill uniform cloth, metre',
        CAST(2145.00 AS decimal(12, 2)), CAST(2359.50 AS decimal(12, 2)),
        CAST('2026-01-11' AS date), CAST('2026-01-20' AS date),
        CAST(12.00 AS decimal(10, 2)), CAST(11.00 AS decimal(10, 2))),
    /* 1014 Q1'26: late, undercharged, short */
    (N'REG-2026-1014', CAST('2026-01-18' AS date), N'Polyester fabric roll, metre',
        CAST(1193.00 AS decimal(12, 2)), CAST(1073.70 AS decimal(12, 2)),
        CAST('2026-01-25' AS date), CAST('2026-02-01' AS date),
        CAST(17.00 AS decimal(10, 2)), CAST(14.00 AS decimal(10, 2))),
    /* 1014 Q1'26: late, undercharged, short */
    (N'REG-2026-1014', CAST('2026-02-05' AS date), N'Dye batch, industrial grade, drum',
        CAST(1926.00 AS decimal(12, 2)), CAST(1714.14 AS decimal(12, 2)),
        CAST('2026-02-12' AS date), CAST('2026-02-17' AS date),
        CAST(6.00 AS decimal(10, 2)), CAST(5.00 AS decimal(10, 2))),
    /* 1014 Q1'26: late, undercharged, short */
    (N'REG-2026-1014', CAST('2026-03-02' AS date), N'Canvas fabric roll, heavy duty, metre',
        CAST(1596.00 AS decimal(12, 2)), CAST(1420.44 AS decimal(12, 2)),
        CAST('2026-03-09' AS date), CAST('2026-03-20' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(9.00 AS decimal(10, 2))),
    /* 1014 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1014', CAST('2026-03-17' AS date), N'Cotton drill uniform cloth, metre',
        CAST(2134.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-24' AS date), CAST(NULL AS date),
        CAST(11.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1014 Q2'26: late, overcharged, short */
    (N'REG-2026-1014', CAST('2026-04-10' AS date), N'Cotton drill uniform cloth, metre',
        CAST(2228.00 AS decimal(12, 2)), CAST(2562.20 AS decimal(12, 2)),
        CAST('2026-04-17' AS date), CAST('2026-04-23' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(8.00 AS decimal(10, 2))),
    /* 1014 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1014', CAST('2026-04-25' AS date), N'Polyester fabric roll, metre',
        CAST(1227.00 AS decimal(12, 2)), CAST(1227.00 AS decimal(12, 2)),
        CAST('2026-05-02' AS date), CAST('2026-05-02' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(10.00 AS decimal(10, 2))),
    /* 1014 Q2'26: late, overcharged, short */
    (N'REG-2026-1014', CAST('2026-05-08' AS date), N'Dye batch, industrial grade, drum',
        CAST(1861.00 AS decimal(12, 2)), CAST(2121.54 AS decimal(12, 2)),
        CAST('2026-05-15' AS date), CAST('2026-05-26' AS date),
        CAST(9.00 AS decimal(10, 2)), CAST(8.00 AS decimal(10, 2))),
    /* 1014 Q2'26: early, agreed price, exact quantity */
    (N'REG-2026-1014', CAST('2026-05-31' AS date), N'Canvas fabric roll, heavy duty, metre',
        CAST(1538.00 AS decimal(12, 2)), CAST(1538.00 AS decimal(12, 2)),
        CAST('2026-06-07' AS date), CAST('2026-06-06' AS date),
        CAST(11.00 AS decimal(10, 2)), CAST(11.00 AS decimal(10, 2))),
    /* 1014 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1014', CAST('2026-06-18' AS date), N'Cotton drill uniform cloth, metre',
        CAST(2020.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-25' AS date), CAST(NULL AS date),
        CAST(11.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1014 Q3'26: late, undercharged, short */
    (N'REG-2026-1014', CAST('2026-07-06' AS date), N'Cotton drill uniform cloth, metre',
        CAST(2162.00 AS decimal(12, 2)), CAST(2032.28 AS decimal(12, 2)),
        CAST('2026-07-13' AS date), CAST('2026-07-23' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(9.00 AS decimal(10, 2))),
    /* 1014 Q3'26: on time, undercharged, exact quantity */
    (N'REG-2026-1014', CAST('2026-07-22' AS date), N'Polyester fabric roll, metre',
        CAST(1184.00 AS decimal(12, 2)), CAST(1148.48 AS decimal(12, 2)),
        CAST('2026-07-29' AS date), CAST('2026-07-29' AS date),
        CAST(15.00 AS decimal(10, 2)), CAST(15.00 AS decimal(10, 2))),
    /* 1014 Q3'26: late, overcharged, short */
    (N'REG-2026-1014', CAST('2026-08-06' AS date), N'Dye batch, industrial grade, drum',
        CAST(1828.00 AS decimal(12, 2)), CAST(2010.80 AS decimal(12, 2)),
        CAST('2026-08-13' AS date), CAST('2026-08-25' AS date),
        CAST(7.00 AS decimal(10, 2)), CAST(5.00 AS decimal(10, 2))),
    /* 1014 Q3'26: early, agreed price, exact quantity */
    (N'REG-2026-1014', CAST('2026-08-24' AS date), N'Canvas fabric roll, heavy duty, metre',
        CAST(1664.00 AS decimal(12, 2)), CAST(1664.00 AS decimal(12, 2)),
        CAST('2026-08-31' AS date), CAST('2026-08-29' AS date),
        CAST(14.00 AS decimal(10, 2)), CAST(14.00 AS decimal(10, 2))),
    /* 1014 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1014', CAST('2026-09-10' AS date), N'Cotton drill uniform cloth, metre',
        CAST(2138.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-17' AS date), CAST(NULL AS date),
        CAST(7.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1015 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1015', CAST('2025-10-02' AS date), N'LED tube, 18W, 4 feet',
        CAST(685.00 AS decimal(12, 2)), CAST(685.00 AS decimal(12, 2)),
        CAST('2025-10-09' AS date), CAST('2025-10-09' AS date),
        CAST(58.00 AS decimal(10, 2)), CAST(58.00 AS decimal(10, 2))),
    /* 1015 Q4'25: late, undercharged, short */
    (N'REG-2026-1015', CAST('2025-10-24' AS date), N'Circuit breaker, 32A, single pole',
        CAST(58.00 AS decimal(12, 2)), CAST(51.04 AS decimal(12, 2)),
        CAST('2025-10-31' AS date), CAST('2025-11-07' AS date),
        CAST(112.00 AS decimal(10, 2)), CAST(92.00 AS decimal(10, 2))),
    /* 1015 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1015', CAST('2025-11-10' AS date), N'Extension cable reel, 25m',
        CAST(119.00 AS decimal(12, 2)), CAST(119.00 AS decimal(12, 2)),
        CAST('2025-11-17' AS date), CAST('2025-11-17' AS date),
        CAST(32.00 AS decimal(10, 2)), CAST(32.00 AS decimal(10, 2))),
    /* 1015 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1015', CAST('2025-11-24' AS date), N'LED floodlight, 50W, outdoor',
        CAST(213.00 AS decimal(12, 2)), CAST(213.00 AS decimal(12, 2)),
        CAST('2025-12-01' AS date), CAST('2025-12-01' AS date),
        CAST(23.00 AS decimal(10, 2)), CAST(23.00 AS decimal(10, 2))),
    /* 1015 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1015', CAST('2025-12-20' AS date), N'LED tube, 18W, 4 feet',
        CAST(646.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-27' AS date), CAST(NULL AS date),
        CAST(52.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1015 Q1'26: early, undercharged, exact quantity */
    (N'REG-2026-1015', CAST('2026-01-07' AS date), N'LED tube, 18W, 4 feet',
        CAST(651.00 AS decimal(12, 2)), CAST(605.43 AS decimal(12, 2)),
        CAST('2026-01-14' AS date), CAST('2026-01-11' AS date),
        CAST(48.00 AS decimal(10, 2)), CAST(48.00 AS decimal(10, 2))),
    /* 1015 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1015', CAST('2026-01-26' AS date), N'Circuit breaker, 32A, single pole',
        CAST(53.00 AS decimal(12, 2)), CAST(53.00 AS decimal(12, 2)),
        CAST('2026-02-02' AS date), CAST('2026-02-02' AS date),
        CAST(125.00 AS decimal(10, 2)), CAST(125.00 AS decimal(10, 2))),
    /* 1015 Q1'26: on time, undercharged, exact quantity */
    (N'REG-2026-1015', CAST('2026-02-10' AS date), N'Extension cable reel, 25m',
        CAST(120.00 AS decimal(12, 2)), CAST(116.40 AS decimal(12, 2)),
        CAST('2026-02-17' AS date), CAST('2026-02-17' AS date),
        CAST(39.00 AS decimal(10, 2)), CAST(39.00 AS decimal(10, 2))),
    /* 1015 Q1'26: early, agreed price, exact quantity */
    (N'REG-2026-1015', CAST('2026-02-23' AS date), N'LED floodlight, 50W, outdoor',
        CAST(192.00 AS decimal(12, 2)), CAST(192.00 AS decimal(12, 2)),
        CAST('2026-03-02' AS date), CAST('2026-02-28' AS date),
        CAST(27.00 AS decimal(10, 2)), CAST(27.00 AS decimal(10, 2))),
    /* 1015 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1015', CAST('2026-03-14' AS date), N'LED tube, 18W, 4 feet',
        CAST(668.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-21' AS date), CAST(NULL AS date),
        CAST(58.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1015 Q2'26: early, agreed price, exact quantity */
    (N'REG-2026-1015', CAST('2026-04-01' AS date), N'LED tube, 18W, 4 feet',
        CAST(681.00 AS decimal(12, 2)), CAST(681.00 AS decimal(12, 2)),
        CAST('2026-04-08' AS date), CAST('2026-04-06' AS date),
        CAST(59.00 AS decimal(10, 2)), CAST(59.00 AS decimal(10, 2))),
    /* 1015 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1015', CAST('2026-04-22' AS date), N'Circuit breaker, 32A, single pole',
        CAST(49.00 AS decimal(12, 2)), CAST(49.00 AS decimal(12, 2)),
        CAST('2026-04-29' AS date), CAST('2026-04-29' AS date),
        CAST(92.00 AS decimal(10, 2)), CAST(92.00 AS decimal(10, 2))),
    /* 1015 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1015', CAST('2026-05-07' AS date), N'Extension cable reel, 25m',
        CAST(110.00 AS decimal(12, 2)), CAST(110.00 AS decimal(12, 2)),
        CAST('2026-05-14' AS date), CAST('2026-05-14' AS date),
        CAST(36.00 AS decimal(10, 2)), CAST(36.00 AS decimal(10, 2))),
    /* 1015 Q2'26: late, overcharged, short */
    (N'REG-2026-1015', CAST('2026-05-29' AS date), N'LED floodlight, 50W, outdoor',
        CAST(182.00 AS decimal(12, 2)), CAST(211.12 AS decimal(12, 2)),
        CAST('2026-06-05' AS date), CAST('2026-06-14' AS date),
        CAST(34.00 AS decimal(10, 2)), CAST(29.00 AS decimal(10, 2))),
    /* 1015 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1015', CAST('2026-06-17' AS date), N'LED tube, 18W, 4 feet',
        CAST(633.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-24' AS date), CAST(NULL AS date),
        CAST(58.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1015 Q3'26: late, overcharged, short */
    (N'REG-2026-1015', CAST('2026-07-06' AS date), N'LED tube, 18W, 4 feet',
        CAST(677.00 AS decimal(12, 2)), CAST(737.93 AS decimal(12, 2)),
        CAST('2026-07-13' AS date), CAST('2026-07-22' AS date),
        CAST(43.00 AS decimal(10, 2)), CAST(37.00 AS decimal(10, 2))),
    /* 1015 Q3'26: late, overcharged, short */
    (N'REG-2026-1015', CAST('2026-07-22' AS date), N'Circuit breaker, 32A, single pole',
        CAST(53.00 AS decimal(12, 2)), CAST(60.42 AS decimal(12, 2)),
        CAST('2026-07-29' AS date), CAST('2026-08-08' AS date),
        CAST(126.00 AS decimal(10, 2)), CAST(112.00 AS decimal(10, 2))),
    /* 1015 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1015', CAST('2026-08-06' AS date), N'Extension cable reel, 25m',
        CAST(112.00 AS decimal(12, 2)), CAST(112.00 AS decimal(12, 2)),
        CAST('2026-08-13' AS date), CAST('2026-08-13' AS date),
        CAST(39.00 AS decimal(10, 2)), CAST(39.00 AS decimal(10, 2))),
    /* 1015 Q3'26: late, overcharged, short */
    (N'REG-2026-1015', CAST('2026-08-21' AS date), N'LED floodlight, 50W, outdoor',
        CAST(220.00 AS decimal(12, 2)), CAST(242.00 AS decimal(12, 2)),
        CAST('2026-08-28' AS date), CAST('2026-09-03' AS date),
        CAST(31.00 AS decimal(10, 2)), CAST(26.00 AS decimal(10, 2))),
    /* 1015 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1015', CAST('2026-09-12' AS date), N'LED tube, 18W, 4 feet',
        CAST(686.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-19' AS date), CAST(NULL AS date),
        CAST(44.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1016 Q4'25: early, agreed price, exact quantity */
    (N'REG-2026-1016', CAST('2025-10-03' AS date), N'Line-haul trip, Shah Alam to Ipoh',
        CAST(1025.00 AS decimal(12, 2)), CAST(1025.00 AS decimal(12, 2)),
        CAST('2025-10-10' AS date), CAST('2025-10-08' AS date),
        CAST(22.00 AS decimal(10, 2)), CAST(22.00 AS decimal(10, 2))),
    /* 1016 Q4'25: early, agreed price, exact quantity */
    (N'REG-2026-1016', CAST('2025-10-26' AS date), N'Container haulage, Port Klang to Penang',
        CAST(1848.00 AS decimal(12, 2)), CAST(1848.00 AS decimal(12, 2)),
        CAST('2025-11-02' AS date), CAST('2025-10-31' AS date),
        CAST(9.00 AS decimal(10, 2)), CAST(9.00 AS decimal(10, 2))),
    /* 1016 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1016', CAST('2025-11-11' AS date), N'Fuel surcharge trip, regional route',
        CAST(230.00 AS decimal(12, 2)), CAST(230.00 AS decimal(12, 2)),
        CAST('2025-11-18' AS date), CAST('2025-11-18' AS date),
        CAST(40.00 AS decimal(10, 2)), CAST(40.00 AS decimal(10, 2))),
    /* 1016 Q4'25: on time, undercharged, exact quantity */
    (N'REG-2026-1016', CAST('2025-12-01' AS date), N'Reefer truck trip, cold chain',
        CAST(1504.00 AS decimal(12, 2)), CAST(1443.84 AS decimal(12, 2)),
        CAST('2025-12-08' AS date), CAST('2025-12-08' AS date),
        CAST(15.00 AS decimal(10, 2)), CAST(15.00 AS decimal(10, 2))),
    /* 1016 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1016', CAST('2025-12-13' AS date), N'Line-haul trip, Shah Alam to Ipoh',
        CAST(1029.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-20' AS date), CAST(NULL AS date),
        CAST(22.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1016 Q1'26: early, undercharged, exact quantity */
    (N'REG-2026-1016', CAST('2026-01-09' AS date), N'Line-haul trip, Shah Alam to Ipoh',
        CAST(997.00 AS decimal(12, 2)), CAST(957.12 AS decimal(12, 2)),
        CAST('2026-01-16' AS date), CAST('2026-01-14' AS date),
        CAST(27.00 AS decimal(10, 2)), CAST(27.00 AS decimal(10, 2))),
    /* 1016 Q1'26: early, agreed price, exact quantity */
    (N'REG-2026-1016', CAST('2026-01-22' AS date), N'Container haulage, Port Klang to Penang',
        CAST(1886.00 AS decimal(12, 2)), CAST(1886.00 AS decimal(12, 2)),
        CAST('2026-01-29' AS date), CAST('2026-01-26' AS date),
        CAST(13.00 AS decimal(10, 2)), CAST(13.00 AS decimal(10, 2))),
    /* 1016 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1016', CAST('2026-02-06' AS date), N'Fuel surcharge trip, regional route',
        CAST(233.00 AS decimal(12, 2)), CAST(233.00 AS decimal(12, 2)),
        CAST('2026-02-13' AS date), CAST('2026-02-13' AS date),
        CAST(34.00 AS decimal(10, 2)), CAST(34.00 AS decimal(10, 2))),
    /* 1016 Q1'26: on time, undercharged, exact quantity */
    (N'REG-2026-1016', CAST('2026-02-28' AS date), N'Reefer truck trip, cold chain',
        CAST(1405.00 AS decimal(12, 2)), CAST(1320.70 AS decimal(12, 2)),
        CAST('2026-03-07' AS date), CAST('2026-03-07' AS date),
        CAST(14.00 AS decimal(10, 2)), CAST(14.00 AS decimal(10, 2))),
    /* 1016 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1016', CAST('2026-03-18' AS date), N'Line-haul trip, Shah Alam to Ipoh',
        CAST(1000.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-25' AS date), CAST(NULL AS date),
        CAST(27.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1016 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1016', CAST('2026-04-03' AS date), N'Line-haul trip, Shah Alam to Ipoh',
        CAST(999.00 AS decimal(12, 2)), CAST(999.00 AS decimal(12, 2)),
        CAST('2026-04-10' AS date), CAST('2026-04-10' AS date),
        CAST(20.00 AS decimal(10, 2)), CAST(20.00 AS decimal(10, 2))),
    /* 1016 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1016', CAST('2026-04-22' AS date), N'Container haulage, Port Klang to Penang',
        CAST(1830.00 AS decimal(12, 2)), CAST(1830.00 AS decimal(12, 2)),
        CAST('2026-04-29' AS date), CAST('2026-04-29' AS date),
        CAST(14.00 AS decimal(10, 2)), CAST(14.00 AS decimal(10, 2))),
    /* 1016 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1016', CAST('2026-05-14' AS date), N'Fuel surcharge trip, regional route',
        CAST(244.00 AS decimal(12, 2)), CAST(244.00 AS decimal(12, 2)),
        CAST('2026-05-21' AS date), CAST('2026-05-21' AS date),
        CAST(33.00 AS decimal(10, 2)), CAST(33.00 AS decimal(10, 2))),
    /* 1016 Q2'26: early, agreed price, exact quantity */
    (N'REG-2026-1016', CAST('2026-05-25' AS date), N'Reefer truck trip, cold chain',
        CAST(1456.00 AS decimal(12, 2)), CAST(1456.00 AS decimal(12, 2)),
        CAST('2026-06-01' AS date), CAST('2026-05-31' AS date),
        CAST(15.00 AS decimal(10, 2)), CAST(15.00 AS decimal(10, 2))),
    /* 1016 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1016', CAST('2026-06-21' AS date), N'Line-haul trip, Shah Alam to Ipoh',
        CAST(941.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-28' AS date), CAST(NULL AS date),
        CAST(24.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1016 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1016', CAST('2026-07-06' AS date), N'Line-haul trip, Shah Alam to Ipoh',
        CAST(975.00 AS decimal(12, 2)), CAST(975.00 AS decimal(12, 2)),
        CAST('2026-07-13' AS date), CAST('2026-07-13' AS date),
        CAST(22.00 AS decimal(10, 2)), CAST(22.00 AS decimal(10, 2))),
    /* 1016 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1016', CAST('2026-07-19' AS date), N'Container haulage, Port Klang to Penang',
        CAST(2089.00 AS decimal(12, 2)), CAST(2089.00 AS decimal(12, 2)),
        CAST('2026-07-26' AS date), CAST('2026-07-26' AS date),
        CAST(13.00 AS decimal(10, 2)), CAST(13.00 AS decimal(10, 2))),
    /* 1016 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1016', CAST('2026-08-04' AS date), N'Fuel surcharge trip, regional route',
        CAST(266.00 AS decimal(12, 2)), CAST(266.00 AS decimal(12, 2)),
        CAST('2026-08-11' AS date), CAST('2026-08-11' AS date),
        CAST(34.00 AS decimal(10, 2)), CAST(34.00 AS decimal(10, 2))),
    /* 1016 Q3'26: early, agreed price, exact quantity */
    (N'REG-2026-1016', CAST('2026-08-26' AS date), N'Reefer truck trip, cold chain',
        CAST(1606.00 AS decimal(12, 2)), CAST(1606.00 AS decimal(12, 2)),
        CAST('2026-09-02' AS date), CAST('2026-09-01' AS date),
        CAST(13.00 AS decimal(10, 2)), CAST(13.00 AS decimal(10, 2))),
    /* 1016 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1016', CAST('2026-09-07' AS date), N'Line-haul trip, Shah Alam to Ipoh',
        CAST(957.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-14' AS date), CAST(NULL AS date),
        CAST(24.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1017 Q4'25: late, undercharged, short */
    (N'REG-2026-1017', CAST('2025-10-10' AS date), N'Industrial solvent, drum 200L',
        CAST(1449.00 AS decimal(12, 2)), CAST(1304.10 AS decimal(12, 2)),
        CAST('2025-10-17' AS date), CAST('2025-10-23' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(8.00 AS decimal(10, 2))),
    /* 1017 Q4'25: late, overcharged, short */
    (N'REG-2026-1017', CAST('2025-10-25' AS date), N'Cleaning chemical concentrate, 20L',
        CAST(390.00 AS decimal(12, 2)), CAST(440.70 AS decimal(12, 2)),
        CAST('2025-11-01' AS date), CAST('2025-11-08' AS date),
        CAST(29.00 AS decimal(10, 2)), CAST(23.00 AS decimal(10, 2))),
    /* 1017 Q4'25: late, undercharged, short */
    (N'REG-2026-1017', CAST('2025-11-08' AS date), N'Lab reagent kit, standard assay',
        CAST(793.00 AS decimal(12, 2)), CAST(737.49 AS decimal(12, 2)),
        CAST('2025-11-15' AS date), CAST('2025-11-23' AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(13.00 AS decimal(10, 2))),
    /* 1017 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1017', CAST('2025-11-24' AS date), N'Industrial degreaser, 20L drum',
        CAST(470.00 AS decimal(12, 2)), CAST(470.00 AS decimal(12, 2)),
        CAST('2025-12-01' AS date), CAST('2025-12-01' AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(16.00 AS decimal(10, 2))),
    /* 1017 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1017', CAST('2025-12-20' AS date), N'Industrial solvent, drum 200L',
        CAST(1357.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-27' AS date), CAST(NULL AS date),
        CAST(15.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1017 Q1'26: late, overcharged, short */
    (N'REG-2026-1017', CAST('2026-01-04' AS date), N'Industrial solvent, drum 200L',
        CAST(1371.00 AS decimal(12, 2)), CAST(1480.68 AS decimal(12, 2)),
        CAST('2026-01-11' AS date), CAST('2026-01-18' AS date),
        CAST(14.00 AS decimal(10, 2)), CAST(12.00 AS decimal(10, 2))),
    /* 1017 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1017', CAST('2026-01-24' AS date), N'Cleaning chemical concentrate, 20L',
        CAST(407.00 AS decimal(12, 2)), CAST(407.00 AS decimal(12, 2)),
        CAST('2026-01-31' AS date), CAST('2026-01-31' AS date),
        CAST(32.00 AS decimal(10, 2)), CAST(32.00 AS decimal(10, 2))),
    /* 1017 Q1'26: early, agreed price, exact quantity */
    (N'REG-2026-1017', CAST('2026-02-10' AS date), N'Lab reagent kit, standard assay',
        CAST(715.00 AS decimal(12, 2)), CAST(715.00 AS decimal(12, 2)),
        CAST('2026-02-17' AS date), CAST('2026-02-16' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(10.00 AS decimal(10, 2))),
    /* 1017 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1017', CAST('2026-02-28' AS date), N'Industrial degreaser, 20L drum',
        CAST(491.00 AS decimal(12, 2)), CAST(491.00 AS decimal(12, 2)),
        CAST('2026-03-07' AS date), CAST('2026-03-07' AS date),
        CAST(23.00 AS decimal(10, 2)), CAST(23.00 AS decimal(10, 2))),
    /* 1017 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1017', CAST('2026-03-16' AS date), N'Industrial solvent, drum 200L',
        CAST(1412.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-23' AS date), CAST(NULL AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1017 Q2'26: early, agreed price, exact quantity */
    (N'REG-2026-1017', CAST('2026-04-06' AS date), N'Industrial solvent, drum 200L',
        CAST(1346.00 AS decimal(12, 2)), CAST(1346.00 AS decimal(12, 2)),
        CAST('2026-04-13' AS date), CAST('2026-04-11' AS date),
        CAST(12.00 AS decimal(10, 2)), CAST(12.00 AS decimal(10, 2))),
    /* 1017 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1017', CAST('2026-04-22' AS date), N'Cleaning chemical concentrate, 20L',
        CAST(381.00 AS decimal(12, 2)), CAST(381.00 AS decimal(12, 2)),
        CAST('2026-04-29' AS date), CAST('2026-04-29' AS date),
        CAST(33.00 AS decimal(10, 2)), CAST(33.00 AS decimal(10, 2))),
    /* 1017 Q2'26: late, overcharged, short */
    (N'REG-2026-1017', CAST('2026-05-07' AS date), N'Lab reagent kit, standard assay',
        CAST(656.00 AS decimal(12, 2)), CAST(728.16 AS decimal(12, 2)),
        CAST('2026-05-14' AS date), CAST('2026-05-23' AS date),
        CAST(16.00 AS decimal(10, 2)), CAST(14.00 AS decimal(10, 2))),
    /* 1017 Q2'26: late, overcharged, short */
    (N'REG-2026-1017', CAST('2026-06-02' AS date), N'Industrial degreaser, 20L drum',
        CAST(507.00 AS decimal(12, 2)), CAST(557.70 AS decimal(12, 2)),
        CAST('2026-06-09' AS date), CAST('2026-06-14' AS date),
        CAST(18.00 AS decimal(10, 2)), CAST(14.00 AS decimal(10, 2))),
    /* 1017 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1017', CAST('2026-06-14' AS date), N'Industrial solvent, drum 200L',
        CAST(1322.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-21' AS date), CAST(NULL AS date),
        CAST(13.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1017 Q3'26: on time, undercharged, over-delivered */
    (N'REG-2026-1017', CAST('2026-07-09' AS date), N'Industrial solvent, drum 200L',
        CAST(1350.00 AS decimal(12, 2)), CAST(1282.50 AS decimal(12, 2)),
        CAST('2026-07-16' AS date), CAST('2026-07-16' AS date),
        CAST(15.00 AS decimal(10, 2)), CAST(16.00 AS decimal(10, 2))),
    /* 1017 Q3'26: late, overcharged, short */
    (N'REG-2026-1017', CAST('2026-07-20' AS date), N'Cleaning chemical concentrate, 20L',
        CAST(400.00 AS decimal(12, 2)), CAST(436.00 AS decimal(12, 2)),
        CAST('2026-07-27' AS date), CAST('2026-08-07' AS date),
        CAST(24.00 AS decimal(10, 2)), CAST(21.00 AS decimal(10, 2))),
    /* 1017 Q3'26: late, undercharged, short */
    (N'REG-2026-1017', CAST('2026-08-07' AS date), N'Lab reagent kit, standard assay',
        CAST(654.00 AS decimal(12, 2)), CAST(588.60 AS decimal(12, 2)),
        CAST('2026-08-14' AS date), CAST('2026-08-19' AS date),
        CAST(13.00 AS decimal(10, 2)), CAST(10.00 AS decimal(10, 2))),
    /* 1017 Q3'26: late, overcharged, short */
    (N'REG-2026-1017', CAST('2026-08-22' AS date), N'Industrial degreaser, 20L drum',
        CAST(448.00 AS decimal(12, 2)), CAST(515.20 AS decimal(12, 2)),
        CAST('2026-08-29' AS date), CAST('2026-09-03' AS date),
        CAST(25.00 AS decimal(10, 2)), CAST(20.00 AS decimal(10, 2))),
    /* 1017 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1017', CAST('2026-09-10' AS date), N'Industrial solvent, drum 200L',
        CAST(1374.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-17' AS date), CAST(NULL AS date),
        CAST(9.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1018 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1018', CAST('2025-10-03' AS date), N'Office desk, L-shape, laminate',
        CAST(799.00 AS decimal(12, 2)), CAST(799.00 AS decimal(12, 2)),
        CAST('2025-10-10' AS date), CAST('2025-10-10' AS date),
        CAST(8.00 AS decimal(10, 2)), CAST(8.00 AS decimal(10, 2))),
    /* 1018 Q4'25: late, overcharged, short */
    (N'REG-2026-1018', CAST('2025-10-27' AS date), N'Filing cabinet, 3-drawer, wood veneer',
        CAST(475.00 AS decimal(12, 2)), CAST(527.25 AS decimal(12, 2)),
        CAST('2025-11-03' AS date), CAST('2025-11-12' AS date),
        CAST(17.00 AS decimal(10, 2)), CAST(14.00 AS decimal(10, 2))),
    /* 1018 Q4'25: on time, undercharged, exact quantity */
    (N'REG-2026-1018', CAST('2025-11-06' AS date), N'Ergonomic chair set, executive',
        CAST(1406.00 AS decimal(12, 2)), CAST(1321.64 AS decimal(12, 2)),
        CAST('2025-11-13' AS date), CAST('2025-11-13' AS date),
        CAST(9.00 AS decimal(10, 2)), CAST(9.00 AS decimal(10, 2))),
    /* 1018 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1018', CAST('2025-11-29' AS date), N'Meeting table, 8-seater',
        CAST(2185.00 AS decimal(12, 2)), CAST(2185.00 AS decimal(12, 2)),
        CAST('2025-12-06' AS date), CAST('2025-12-06' AS date),
        CAST(3.00 AS decimal(10, 2)), CAST(3.00 AS decimal(10, 2))),
    /* 1018 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1018', CAST('2025-12-13' AS date), N'Office desk, L-shape, laminate',
        CAST(847.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-20' AS date), CAST(NULL AS date),
        CAST(11.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1018 Q1'26: on time, undercharged, exact quantity */
    (N'REG-2026-1018', CAST('2026-01-07' AS date), N'Office desk, L-shape, laminate',
        CAST(835.00 AS decimal(12, 2)), CAST(776.55 AS decimal(12, 2)),
        CAST('2026-01-14' AS date), CAST('2026-01-14' AS date),
        CAST(8.00 AS decimal(10, 2)), CAST(8.00 AS decimal(10, 2))),
    /* 1018 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1018', CAST('2026-01-21' AS date), N'Filing cabinet, 3-drawer, wood veneer',
        CAST(461.00 AS decimal(12, 2)), CAST(461.00 AS decimal(12, 2)),
        CAST('2026-01-28' AS date), CAST('2026-01-28' AS date),
        CAST(11.00 AS decimal(10, 2)), CAST(11.00 AS decimal(10, 2))),
    /* 1018 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1018', CAST('2026-02-08' AS date), N'Ergonomic chair set, executive',
        CAST(1572.00 AS decimal(12, 2)), CAST(1572.00 AS decimal(12, 2)),
        CAST('2026-02-15' AS date), CAST('2026-02-15' AS date),
        CAST(6.00 AS decimal(10, 2)), CAST(6.00 AS decimal(10, 2))),
    /* 1018 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1018', CAST('2026-02-24' AS date), N'Meeting table, 8-seater',
        CAST(2004.00 AS decimal(12, 2)), CAST(2004.00 AS decimal(12, 2)),
        CAST('2026-03-03' AS date), CAST('2026-03-03' AS date),
        CAST(4.00 AS decimal(10, 2)), CAST(4.00 AS decimal(10, 2))),
    /* 1018 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1018', CAST('2026-03-21' AS date), N'Office desk, L-shape, laminate',
        CAST(795.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-28' AS date), CAST(NULL AS date),
        CAST(9.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1018 Q2'26: early, agreed price, exact quantity */
    (N'REG-2026-1018', CAST('2026-04-03' AS date), N'Office desk, L-shape, laminate',
        CAST(857.00 AS decimal(12, 2)), CAST(857.00 AS decimal(12, 2)),
        CAST('2026-04-10' AS date), CAST('2026-04-08' AS date),
        CAST(13.00 AS decimal(10, 2)), CAST(13.00 AS decimal(10, 2))),
    /* 1018 Q2'26: on time, agreed price, over-delivered */
    (N'REG-2026-1018', CAST('2026-04-21' AS date), N'Filing cabinet, 3-drawer, wood veneer',
        CAST(456.00 AS decimal(12, 2)), CAST(456.00 AS decimal(12, 2)),
        CAST('2026-04-28' AS date), CAST('2026-04-28' AS date),
        CAST(11.00 AS decimal(10, 2)), CAST(12.00 AS decimal(10, 2))),
    /* 1018 Q2'26: on time, undercharged, exact quantity */
    (N'REG-2026-1018', CAST('2026-05-14' AS date), N'Ergonomic chair set, executive',
        CAST(1574.00 AS decimal(12, 2)), CAST(1463.82 AS decimal(12, 2)),
        CAST('2026-05-21' AS date), CAST('2026-05-21' AS date),
        CAST(8.00 AS decimal(10, 2)), CAST(8.00 AS decimal(10, 2))),
    /* 1018 Q2'26: early, agreed price, exact quantity */
    (N'REG-2026-1018', CAST('2026-05-27' AS date), N'Meeting table, 8-seater',
        CAST(2001.00 AS decimal(12, 2)), CAST(2001.00 AS decimal(12, 2)),
        CAST('2026-06-03' AS date), CAST('2026-06-02' AS date),
        CAST(3.00 AS decimal(10, 2)), CAST(3.00 AS decimal(10, 2))),
    /* 1018 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1018', CAST('2026-06-16' AS date), N'Office desk, L-shape, laminate',
        CAST(837.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-23' AS date), CAST(NULL AS date),
        CAST(12.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1018 Q3'26: early, agreed price, exact quantity */
    (N'REG-2026-1018', CAST('2026-07-06' AS date), N'Office desk, L-shape, laminate',
        CAST(816.00 AS decimal(12, 2)), CAST(816.00 AS decimal(12, 2)),
        CAST('2026-07-13' AS date), CAST('2026-07-11' AS date),
        CAST(10.00 AS decimal(10, 2)), CAST(10.00 AS decimal(10, 2))),
    /* 1018 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1018', CAST('2026-07-20' AS date), N'Filing cabinet, 3-drawer, wood veneer',
        CAST(514.00 AS decimal(12, 2)), CAST(514.00 AS decimal(12, 2)),
        CAST('2026-07-27' AS date), CAST('2026-07-27' AS date),
        CAST(14.00 AS decimal(10, 2)), CAST(14.00 AS decimal(10, 2))),
    /* 1018 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1018', CAST('2026-08-07' AS date), N'Ergonomic chair set, executive',
        CAST(1528.00 AS decimal(12, 2)), CAST(1528.00 AS decimal(12, 2)),
        CAST('2026-08-14' AS date), CAST('2026-08-14' AS date),
        CAST(6.00 AS decimal(10, 2)), CAST(6.00 AS decimal(10, 2))),
    /* 1018 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1018', CAST('2026-08-23' AS date), N'Meeting table, 8-seater',
        CAST(2077.00 AS decimal(12, 2)), CAST(2077.00 AS decimal(12, 2)),
        CAST('2026-08-30' AS date), CAST('2026-08-30' AS date),
        CAST(3.00 AS decimal(10, 2)), CAST(3.00 AS decimal(10, 2))),
    /* 1018 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1018', CAST('2026-09-07' AS date), N'Office desk, L-shape, laminate',
        CAST(831.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-14' AS date), CAST(NULL AS date),
        CAST(12.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1019 Q4'25: late, overcharged, short */
    (N'REG-2026-1019', CAST('2025-10-07' AS date), N'Aircon servicing, split unit, per unit',
        CAST(125.00 AS decimal(12, 2)), CAST(141.25 AS decimal(12, 2)),
        CAST('2025-10-14' AS date), CAST('2025-10-25' AS date),
        CAST(38.00 AS decimal(10, 2)), CAST(31.00 AS decimal(10, 2))),
    /* 1019 Q4'25: late, undercharged, short */
    (N'REG-2026-1019', CAST('2025-10-22' AS date), N'Plumbing repair job, per callout',
        CAST(232.00 AS decimal(12, 2)), CAST(208.80 AS decimal(12, 2)),
        CAST('2025-10-29' AS date), CAST('2025-11-04' AS date),
        CAST(19.00 AS decimal(10, 2)), CAST(15.00 AS decimal(10, 2))),
    /* 1019 Q4'25: on time, agreed price, exact quantity */
    (N'REG-2026-1019', CAST('2025-11-14' AS date), N'General maintenance callout, per visit',
        CAST(192.00 AS decimal(12, 2)), CAST(192.00 AS decimal(12, 2)),
        CAST('2025-11-21' AS date), CAST('2025-11-21' AS date),
        CAST(32.00 AS decimal(10, 2)), CAST(32.00 AS decimal(10, 2))),
    /* 1019 Q4'25: late, overcharged, short */
    (N'REG-2026-1019', CAST('2025-12-01' AS date), N'Electrical wiring repair, per job',
        CAST(341.00 AS decimal(12, 2)), CAST(388.74 AS decimal(12, 2)),
        CAST('2025-12-08' AS date), CAST('2025-12-18' AS date),
        CAST(17.00 AS decimal(10, 2)), CAST(15.00 AS decimal(10, 2))),
    /* 1019 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1019', CAST('2025-12-18' AS date), N'Aircon servicing, split unit, per unit',
        CAST(122.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-25' AS date), CAST(NULL AS date),
        CAST(40.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1019 Q1'26: late, undercharged, short */
    (N'REG-2026-1019', CAST('2026-01-05' AS date), N'Aircon servicing, split unit, per unit',
        CAST(108.00 AS decimal(12, 2)), CAST(101.52 AS decimal(12, 2)),
        CAST('2026-01-12' AS date), CAST('2026-01-22' AS date),
        CAST(48.00 AS decimal(10, 2)), CAST(36.00 AS decimal(10, 2))),
    /* 1019 Q1'26: late, overcharged, short */
    (N'REG-2026-1019', CAST('2026-01-20' AS date), N'Plumbing repair job, per callout',
        CAST(211.00 AS decimal(12, 2)), CAST(246.87 AS decimal(12, 2)),
        CAST('2026-01-27' AS date), CAST('2026-02-02' AS date),
        CAST(27.00 AS decimal(10, 2)), CAST(20.00 AS decimal(10, 2))),
    /* 1019 Q1'26: late, overcharged, short */
    (N'REG-2026-1019', CAST('2026-02-10' AS date), N'General maintenance callout, per visit',
        CAST(158.00 AS decimal(12, 2)), CAST(178.54 AS decimal(12, 2)),
        CAST('2026-02-17' AS date), CAST('2026-02-22' AS date),
        CAST(28.00 AS decimal(10, 2)), CAST(22.00 AS decimal(10, 2))),
    /* 1019 Q1'26: late, overcharged, short */
    (N'REG-2026-1019', CAST('2026-02-24' AS date), N'Electrical wiring repair, per job',
        CAST(350.00 AS decimal(12, 2)), CAST(388.50 AS decimal(12, 2)),
        CAST('2026-03-03' AS date), CAST('2026-03-10' AS date),
        CAST(17.00 AS decimal(10, 2)), CAST(15.00 AS decimal(10, 2))),
    /* 1019 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1019', CAST('2026-03-13' AS date), N'Aircon servicing, split unit, per unit',
        CAST(105.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-20' AS date), CAST(NULL AS date),
        CAST(36.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1019 Q2'26: late, overcharged, short */
    (N'REG-2026-1019', CAST('2026-04-07' AS date), N'Aircon servicing, split unit, per unit',
        CAST(110.00 AS decimal(12, 2)), CAST(124.30 AS decimal(12, 2)),
        CAST('2026-04-14' AS date), CAST('2026-04-25' AS date),
        CAST(39.00 AS decimal(10, 2)), CAST(34.00 AS decimal(10, 2))),
    /* 1019 Q2'26: late, undercharged, short */
    (N'REG-2026-1019', CAST('2026-04-22' AS date), N'Plumbing repair job, per callout',
        CAST(251.00 AS decimal(12, 2)), CAST(223.39 AS decimal(12, 2)),
        CAST('2026-04-29' AS date), CAST('2026-05-09' AS date),
        CAST(21.00 AS decimal(10, 2)), CAST(18.00 AS decimal(10, 2))),
    /* 1019 Q2'26: on time, agreed price, over-delivered */
    (N'REG-2026-1019', CAST('2026-05-14' AS date), N'General maintenance callout, per visit',
        CAST(154.00 AS decimal(12, 2)), CAST(154.00 AS decimal(12, 2)),
        CAST('2026-05-21' AS date), CAST('2026-05-21' AS date),
        CAST(31.00 AS decimal(10, 2)), CAST(34.00 AS decimal(10, 2))),
    /* 1019 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1019', CAST('2026-05-31' AS date), N'Electrical wiring repair, per job',
        CAST(367.00 AS decimal(12, 2)), CAST(367.00 AS decimal(12, 2)),
        CAST('2026-06-07' AS date), CAST('2026-06-07' AS date),
        CAST(15.00 AS decimal(10, 2)), CAST(15.00 AS decimal(10, 2))),
    /* 1019 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1019', CAST('2026-06-20' AS date), N'Aircon servicing, split unit, per unit',
        CAST(102.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-27' AS date), CAST(NULL AS date),
        CAST(45.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1019 Q3'26: late, overcharged, short */
    (N'REG-2026-1019', CAST('2026-07-04' AS date), N'Aircon servicing, split unit, per unit',
        CAST(102.00 AS decimal(12, 2)), CAST(114.24 AS decimal(12, 2)),
        CAST('2026-07-11' AS date), CAST('2026-07-16' AS date),
        CAST(48.00 AS decimal(10, 2)), CAST(38.00 AS decimal(10, 2))),
    /* 1019 Q3'26: late, overcharged, short */
    (N'REG-2026-1019', CAST('2026-07-23' AS date), N'Plumbing repair job, per callout',
        CAST(186.00 AS decimal(12, 2)), CAST(208.32 AS decimal(12, 2)),
        CAST('2026-07-30' AS date), CAST('2026-08-09' AS date),
        CAST(21.00 AS decimal(10, 2)), CAST(16.00 AS decimal(10, 2))),
    /* 1019 Q3'26: late, overcharged, short */
    (N'REG-2026-1019', CAST('2026-08-08' AS date), N'General maintenance callout, per visit',
        CAST(201.00 AS decimal(12, 2)), CAST(225.12 AS decimal(12, 2)),
        CAST('2026-08-15' AS date), CAST('2026-08-19' AS date),
        CAST(20.00 AS decimal(10, 2)), CAST(18.00 AS decimal(10, 2))),
    /* 1019 Q3'26: early, agreed price, exact quantity */
    (N'REG-2026-1019', CAST('2026-08-27' AS date), N'Electrical wiring repair, per job',
        CAST(317.00 AS decimal(12, 2)), CAST(317.00 AS decimal(12, 2)),
        CAST('2026-09-03' AS date), CAST('2026-09-01' AS date),
        CAST(11.00 AS decimal(10, 2)), CAST(11.00 AS decimal(10, 2))),
    /* 1019 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1019', CAST('2026-09-09' AS date), N'Aircon servicing, split unit, per unit',
        CAST(128.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-16' AS date), CAST(NULL AS date),
        CAST(39.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1020 Q4'25: late, undercharged, short */
    (N'REG-2026-1020', CAST('2025-10-02' AS date), N'Surgical gloves, box of 100, nitrile',
        CAST(75.00 AS decimal(12, 2)), CAST(70.50 AS decimal(12, 2)),
        CAST('2025-10-09' AS date), CAST('2025-10-14' AS date),
        CAST(165.00 AS decimal(10, 2)), CAST(134.00 AS decimal(10, 2))),
    /* 1020 Q4'25: late, overcharged, short */
    (N'REG-2026-1020', CAST('2025-10-24' AS date), N'Syringe pack, 5ml, box of 100',
        CAST(112.00 AS decimal(12, 2)), CAST(120.96 AS decimal(12, 2)),
        CAST('2025-10-31' AS date), CAST('2025-11-04' AS date),
        CAST(117.00 AS decimal(10, 2)), CAST(91.00 AS decimal(10, 2))),
    /* 1020 Q4'25: late, overcharged, short */
    (N'REG-2026-1020', CAST('2025-11-07' AS date), N'Medical gauze roll, sterile, box of 50',
        CAST(113.00 AS decimal(12, 2)), CAST(131.08 AS decimal(12, 2)),
        CAST('2025-11-14' AS date), CAST('2025-11-21' AS date),
        CAST(99.00 AS decimal(10, 2)), CAST(80.00 AS decimal(10, 2))),
    /* 1020 Q4'25: late, overcharged, short */
    (N'REG-2026-1020', CAST('2025-11-27' AS date), N'Digital thermometer, infrared, unit',
        CAST(84.00 AS decimal(12, 2)), CAST(97.44 AS decimal(12, 2)),
        CAST('2025-12-04' AS date), CAST('2025-12-11' AS date),
        CAST(65.00 AS decimal(10, 2)), CAST(57.00 AS decimal(10, 2))),
    /* 1020 Q4'25: pending (no actuals yet) */
    (N'REG-2026-1020', CAST('2025-12-20' AS date), N'Surgical gloves, box of 100, nitrile',
        CAST(56.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2025-12-27' AS date), CAST(NULL AS date),
        CAST(164.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1020 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1020', CAST('2026-01-01' AS date), N'Surgical gloves, box of 100, nitrile',
        CAST(65.00 AS decimal(12, 2)), CAST(65.00 AS decimal(12, 2)),
        CAST('2026-01-08' AS date), CAST('2026-01-08' AS date),
        CAST(135.00 AS decimal(10, 2)), CAST(135.00 AS decimal(10, 2))),
    /* 1020 Q1'26: late, overcharged, short */
    (N'REG-2026-1020', CAST('2026-01-23' AS date), N'Syringe pack, 5ml, box of 100',
        CAST(97.00 AS decimal(12, 2)), CAST(104.76 AS decimal(12, 2)),
        CAST('2026-01-30' AS date), CAST('2026-02-11' AS date),
        CAST(96.00 AS decimal(10, 2)), CAST(85.00 AS decimal(10, 2))),
    /* 1020 Q1'26: on time, agreed price, exact quantity */
    (N'REG-2026-1020', CAST('2026-02-11' AS date), N'Medical gauze roll, sterile, box of 50',
        CAST(124.00 AS decimal(12, 2)), CAST(124.00 AS decimal(12, 2)),
        CAST('2026-02-18' AS date), CAST('2026-02-18' AS date),
        CAST(62.00 AS decimal(10, 2)), CAST(62.00 AS decimal(10, 2))),
    /* 1020 Q1'26: late, overcharged, short */
    (N'REG-2026-1020', CAST('2026-02-24' AS date), N'Digital thermometer, infrared, unit',
        CAST(80.00 AS decimal(12, 2)), CAST(93.60 AS decimal(12, 2)),
        CAST('2026-03-03' AS date), CAST('2026-03-13' AS date),
        CAST(67.00 AS decimal(10, 2)), CAST(52.00 AS decimal(10, 2))),
    /* 1020 Q1'26: pending (no actuals yet) */
    (N'REG-2026-1020', CAST('2026-03-17' AS date), N'Surgical gloves, box of 100, nitrile',
        CAST(71.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-03-24' AS date), CAST(NULL AS date),
        CAST(130.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1020 Q2'26: late, undercharged, short */
    (N'REG-2026-1020', CAST('2026-04-01' AS date), N'Surgical gloves, box of 100, nitrile',
        CAST(59.00 AS decimal(12, 2)), CAST(54.28 AS decimal(12, 2)),
        CAST('2026-04-08' AS date), CAST('2026-04-14' AS date),
        CAST(147.00 AS decimal(10, 2)), CAST(125.00 AS decimal(10, 2))),
    /* 1020 Q2'26: on time, undercharged, exact quantity */
    (N'REG-2026-1020', CAST('2026-04-23' AS date), N'Syringe pack, 5ml, box of 100',
        CAST(116.00 AS decimal(12, 2)), CAST(109.04 AS decimal(12, 2)),
        CAST('2026-04-30' AS date), CAST('2026-04-30' AS date),
        CAST(129.00 AS decimal(10, 2)), CAST(129.00 AS decimal(10, 2))),
    /* 1020 Q2'26: on time, agreed price, exact quantity */
    (N'REG-2026-1020', CAST('2026-05-16' AS date), N'Medical gauze roll, sterile, box of 50',
        CAST(121.00 AS decimal(12, 2)), CAST(121.00 AS decimal(12, 2)),
        CAST('2026-05-23' AS date), CAST('2026-05-23' AS date),
        CAST(67.00 AS decimal(10, 2)), CAST(67.00 AS decimal(10, 2))),
    /* 1020 Q2'26: early, agreed price, exact quantity */
    (N'REG-2026-1020', CAST('2026-05-26' AS date), N'Digital thermometer, infrared, unit',
        CAST(84.00 AS decimal(12, 2)), CAST(84.00 AS decimal(12, 2)),
        CAST('2026-06-02' AS date), CAST('2026-05-31' AS date),
        CAST(49.00 AS decimal(10, 2)), CAST(49.00 AS decimal(10, 2))),
    /* 1020 Q2'26: pending (no actuals yet) */
    (N'REG-2026-1020', CAST('2026-06-13' AS date), N'Surgical gloves, box of 100, nitrile',
        CAST(61.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-06-20' AS date), CAST(NULL AS date),
        CAST(180.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2))),
    /* 1020 Q3'26: on time, agreed price, over-delivered */
    (N'REG-2026-1020', CAST('2026-07-06' AS date), N'Surgical gloves, box of 100, nitrile',
        CAST(58.00 AS decimal(12, 2)), CAST(58.00 AS decimal(12, 2)),
        CAST('2026-07-13' AS date), CAST('2026-07-13' AS date),
        CAST(166.00 AS decimal(10, 2)), CAST(186.00 AS decimal(10, 2))),
    /* 1020 Q3'26: late, overcharged, short */
    (N'REG-2026-1020', CAST('2026-07-20' AS date), N'Syringe pack, 5ml, box of 100',
        CAST(98.00 AS decimal(12, 2)), CAST(112.70 AS decimal(12, 2)),
        CAST('2026-07-27' AS date), CAST('2026-08-02' AS date),
        CAST(86.00 AS decimal(10, 2)), CAST(67.00 AS decimal(10, 2))),
    /* 1020 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1020', CAST('2026-08-08' AS date), N'Medical gauze roll, sterile, box of 50',
        CAST(117.00 AS decimal(12, 2)), CAST(117.00 AS decimal(12, 2)),
        CAST('2026-08-15' AS date), CAST('2026-08-15' AS date),
        CAST(75.00 AS decimal(10, 2)), CAST(75.00 AS decimal(10, 2))),
    /* 1020 Q3'26: on time, agreed price, exact quantity */
    (N'REG-2026-1020', CAST('2026-08-24' AS date), N'Digital thermometer, infrared, unit',
        CAST(81.00 AS decimal(12, 2)), CAST(81.00 AS decimal(12, 2)),
        CAST('2026-08-31' AS date), CAST('2026-08-31' AS date),
        CAST(55.00 AS decimal(10, 2)), CAST(55.00 AS decimal(10, 2))),
    /* 1020 Q3'26: pending (no actuals yet) */
    (N'REG-2026-1020', CAST('2026-09-08' AS date), N'Surgical gloves, box of 100, nitrile',
        CAST(69.00 AS decimal(12, 2)), CAST(NULL AS decimal(12, 2)),
        CAST('2026-09-15' AS date), CAST(NULL AS date),
        CAST(163.00 AS decimal(10, 2)), CAST(NULL AS decimal(10, 2)))
) AS txn(
    registration_number,
    transaction_date,
    item_description,
    agreed_price,
    actual_price,
    agreed_delivery_date,
    actual_delivery_date,
    quantity_ordered,
    quantity_received
)
INNER JOIN dbo.VENDORS AS vendor
    ON vendor.registration_number = txn.registration_number
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.VENDOR_TRANSACTIONS AS existing
    WHERE existing.vendor_id = vendor.id
        AND existing.transaction_date = txn.transaction_date
        AND existing.item_description = txn.item_description
);

COMMIT TRANSACTION;

SELECT
    vendor.registration_number,
    vendor.name,
    txn.transaction_date,
    txn.item_description,
    txn.agreed_price,
    txn.actual_price,
    txn.agreed_delivery_date,
    txn.actual_delivery_date,
    txn.quantity_ordered,
    txn.quantity_received
FROM dbo.VENDOR_TRANSACTIONS AS txn
INNER JOIN dbo.VENDORS AS vendor
    ON vendor.id = txn.vendor_id
WHERE vendor.registration_number LIKE N'REG-2026-1%'
ORDER BY vendor.registration_number, txn.transaction_date;
