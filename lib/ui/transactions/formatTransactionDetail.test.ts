import { describe, it, expect } from "vitest";
import { formatTransactionDetail } from "./formatTransactionDetail";

describe("formatTransactionDetail", () => {
  it("formats a fully-delivered transaction record for display", () => {
    const result = formatTransactionDetail({
      id: 5,
      vendor_id: 1,
      transaction_date: "2026-09-14",
      item_description: "Steel beams",
      agreed_price: 100,
      actual_price: 95,
      agreed_delivery_date: "2026-09-20",
      actual_delivery_date: "2026-09-19",
      quantity_ordered: 10,
      quantity_received: 10,
      created_at: "2026-09-14",
    });

    expect(result).toEqual({
      id: 5,
      vendorId: 1,
      transactionDate: "14 Sept 2026",
      itemDescription: "Steel beams",
      agreedPrice: "RM\u00A0100.00",
      actualPrice: "RM\u00A095.00",
      agreedDeliveryDate: "20 Sept 2026",
      actualDeliveryDate: "19 Sept 2026",
      quantityOrdered: "10",
      quantityReceived: "10",
      createdAt: "14 Sept 2026",
    });
  });

  it("shows a placeholder for actual_price, actual_delivery_date, and quantity_received when a transaction hasn't been delivered yet", () => {
    const result = formatTransactionDetail({
      id: 6,
      vendor_id: 1,
      transaction_date: "2026-09-14",
      item_description: "Steel beams",
      agreed_price: 100,
      agreed_delivery_date: "2026-09-20",
      quantity_ordered: 10,
    });

    expect(result.actualPrice).toBe("—");
    expect(result.actualDeliveryDate).toBe("—");
    expect(result.quantityReceived).toBe("—");
  });
});
