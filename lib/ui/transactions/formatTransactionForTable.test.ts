import { describe, it, expect } from "vitest";
import { formatTransactionForTable } from "./formatTransactionForTable";

describe("formatTransactionForTable", () => {
  it("formats a complete transaction record for display", () => {
    const result = formatTransactionForTable({
      id: 5,
      vendor_id: 1,
      transaction_date: "2026-09-14",
      item_description: "Steel beams",
      agreed_price: 100,
      agreed_delivery_date: "2026-09-20",
      actual_delivery_date: "2026-09-19",
      quantity_ordered: 10,
    });

    expect(result).toEqual({
      id: 5,
      vendorId: 1,
      transactionDate: "14 Sept 2026",
      itemDescription: "Steel beams",
      agreedPrice: "RM\u00A0100.00",
      quantityOrdered: "10",
      agreedDeliveryDate: "20 Sept 2026",
      actualDeliveryDate: "19 Sept 2026",
    });
  });

  it("shows a placeholder when optional/missing fields are absent", () => {
    const result = formatTransactionForTable({
      id: 6,
      vendor_id: 1,
    });

    expect(result.itemDescription).toBe("—");
    expect(result.agreedPrice).toBe("—");
    expect(result.quantityOrdered).toBe("—");
    expect(result.transactionDate).toBe("—");
    expect(result.agreedDeliveryDate).toBe("—");
    expect(result.actualDeliveryDate).toBe("—");
  });
});
