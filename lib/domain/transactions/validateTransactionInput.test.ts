import { expect, describe, it } from "vitest";
import { validateTransactionInput } from "./validateTransactionInput";

describe("validateTransactionInput", () => {
    it("rejects a transaction with no vendor_id", () => {
        const result = validateTransactionInput({
            transaction_date: "2026-09-14",
            item_description: "Steel beams",
            agreed_price: 100,
            agreed_delivery_price: "2026-09-20",
            quantity_ordered: 10,
        } as any);

        expect(result).toEqual({
            valid: false,
            error: "vendor is required",
            code: "VALIDATION_FAILED",
            field:"vendor_id",
        });
    });

    it("rejects a transaction with no transaction_date", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Transaction date is required",
          code: "VALIDATION_FAILED",
          field: "transaction_date",
        });
      });
      
      it("rejects a transaction with no item_description", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Item description is required",
          code: "VALIDATION_FAILED",
          field: "item_description",
        });
      });

      it("rejects a transaction with no agreed_price", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Agreed price is required",
          code: "VALIDATION_FAILED",
          field: "agreed_price",
        });
      });
      
      it("rejects a transaction with no agreed_delivery_date", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          quantity_ordered: 10,
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Agreed delivery date is required",
          code: "VALIDATION_FAILED",
          field: "agreed_delivery_date",
        });
      });
      
      it("rejects a transaction with no quantity_ordered", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Quantity ordered is required",
          code: "VALIDATION_FAILED",
          field: "quantity_ordered",
        });
      });

      it("rejects a transaction with agreed_price of exactly 0", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 0,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Agreed price must be greater than 0",
          code: "VALIDATION_FAILED",
          field: "agreed_price",
        });
      });
      
      it("accepts the smallest valid positive agreed_price", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 0.01,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);
      
        expect(result.valid).toBe(true);
      });
      
      it("rejects a transaction with quantity_ordered of exactly 0", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 0,
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Quantity ordered must be greater than 0",
          code: "VALIDATION_FAILED",
          field: "quantity_ordered",
        });
      });
      
      it("accepts the smallest valid positive quantity_ordered", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 0.01,
        } as any);
      
        expect(result.valid).toBe(true);
      });
      
      it("rejects a transaction_date before 2000-01-01", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "1999-12-31",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Transaction date must be on or after 2000-01-01",
          code: "VALIDATION_FAILED",
          field: "transaction_date",
        });
      });
      
      it("accepts a transaction_date of exactly 2000-01-01", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2000-01-01",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2000-01-05",
          quantity_ordered: 10,
        } as any);
      
        expect(result.valid).toBe(true);
      });
      
      it("accepts a transaction_date of today", () => {
        const today = new Date().toISOString().slice(0, 10);
      
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: today,
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: today,
          quantity_ordered: 10,
        } as any);
      
        expect(result.valid).toBe(true);
      });
      
      it("rejects a transaction_date in the future", () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowIso = tomorrow.toISOString().slice(0, 10);
      
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: tomorrowIso,
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: tomorrowIso,
          quantity_ordered: 10,
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Transaction date cannot be in the future",
          code: "VALIDATION_FAILED",
          field: "transaction_date",
        });
      });
      
      it("accepts an agreed_delivery_date equal to transaction_date", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-14",
          quantity_ordered: 10,
        } as any);
      
        expect(result.valid).toBe(true);
      });
      
      it("rejects an agreed_delivery_date before transaction_date", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-13",
          quantity_ordered: 10,
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Agreed delivery date cannot be before the transaction date",
          code: "VALIDATION_FAILED",
          field: "agreed_delivery_date",
        });
      });

      it("rejects a vendor_id that is not a positive integer", () => {
        const result = validateTransactionInput({
          vendor_id: "1",
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Vendor id must be a positive integer",
          code: "VALIDATION_FAILED",
          field: "vendor_id",
        });
      });
      
      it("rejects a vendor_id of exactly 0", () => {
        const result = validateTransactionInput({
          vendor_id: 0,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);

        expect(result).toEqual({
          valid: false,
          error: "Vendor id must be a positive integer",
          code: "VALIDATION_FAILED",
          field: "vendor_id",
        });
      });

      it("rejects an agreed_price that is not a number", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: "100",
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Agreed price must be a number",
          code: "VALIDATION_FAILED",
          field: "agreed_price",
        });
      });
      
      it("rejects a quantity_ordered that is not a number", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: "10",
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Quantity ordered must be a number",
          code: "VALIDATION_FAILED",
          field: "quantity_ordered",
        });
      });
      
      it("rejects a transaction_date that is not a valid date", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "not-a-date",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Transaction date must be a valid date",
          code: "VALIDATION_FAILED",
          field: "transaction_date",
        });
      });
      
      it("rejects an agreed_delivery_date that is not a valid date", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "not-a-date",
          quantity_ordered: 10,
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Agreed delivery date must be a valid date",
          code: "VALIDATION_FAILED",
          field: "agreed_delivery_date",
        });
      });

      it("rejects an item_description containing disallowed characters", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "<script>alert('x')</script>",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Item description contains disallowed characters",
          code: "VALIDATION_FAILED",
          field: "item_description",
        });
      });

      it("rejects an item_description containing a SQL-injection-shaped string (quotes, semicolon, double-dash)", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Robert'); DROP TABLE VENDOR_TRANSACTIONS;--",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);

        expect(result).toEqual({
          valid: false,
          error: "Item description contains disallowed characters",
          code: "VALIDATION_FAILED",
          field: "item_description",
        });
      });

      it("rejects an item_description containing a literal double-quote character", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: 'Item with "escaped quotes" inline',
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);

        expect(result).toEqual({
          valid: false,
          error: "Item description contains disallowed characters",
          code: "VALIDATION_FAILED",
          field: "item_description",
        });
      });

      it("accepts an item_description with a comma but no quote/semicolon/double-dash characters", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Item with a comma, inside it",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);

        expect(result.valid).toBe(true);
      });

      it("accepts an item_description at exactly 500 characters", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "a".repeat(500),
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);
      
        expect(result.valid).toBe(true);
      });
      
      it("rejects an item_description over 500 characters", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "a".repeat(501),
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);
      
        expect(result).toEqual({
          valid: false,
          error: "Item description must be 500 characters or fewer",
          code: "VALIDATION_FAILED",
          field: "item_description",
        });
      });

      it("accepts a transaction with actual_price, actual_delivery_date, and quantity_received all omitted", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);

        expect(result.valid).toBe(true);
      });

      it("accepts a transaction with actual_price, actual_delivery_date, and quantity_received all provided and valid", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          actual_price: 95,
          agreed_delivery_date: "2026-09-20",
          actual_delivery_date: "2026-09-19",
          quantity_ordered: 10,
          quantity_received: 10,
        } as any);

        expect(result.valid).toBe(true);
      });

      it("rejects a non-numeric actual_price", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          actual_price: "not-a-price",
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);

        expect(result).toEqual({
          valid: false,
          error: "Actual price must be a number",
          code: "VALIDATION_FAILED",
          field: "actual_price",
        });
      });

      it("rejects an actual_price of 0", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          actual_price: 0,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
        } as any);

        expect(result).toEqual({
          valid: false,
          error: "Actual price must be greater than 0",
          code: "VALIDATION_FAILED",
          field: "actual_price",
        });
      });

      it("rejects a non-numeric quantity_received", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
          quantity_received: "not-a-number",
        } as any);

        expect(result).toEqual({
          valid: false,
          error: "Quantity received must be a number",
          code: "VALIDATION_FAILED",
          field: "quantity_received",
        });
      });

      it("rejects a quantity_received of 0", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          quantity_ordered: 10,
          quantity_received: 0,
        } as any);

        expect(result).toEqual({
          valid: false,
          error: "Quantity received must be greater than 0",
          code: "VALIDATION_FAILED",
          field: "quantity_received",
        });
      });

      it("rejects an invalid actual_delivery_date", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          actual_delivery_date: "not-a-date",
          quantity_ordered: 10,
        } as any);

        expect(result).toEqual({
          valid: false,
          error: "Actual delivery date must be a valid date",
          code: "VALIDATION_FAILED",
          field: "actual_delivery_date",
        });
      });

      it("rejects an actual_delivery_date before the transaction_date", () => {
        const result = validateTransactionInput({
          vendor_id: 1,
          transaction_date: "2026-09-14",
          item_description: "Steel beams",
          agreed_price: 100,
          agreed_delivery_date: "2026-09-20",
          actual_delivery_date: "2026-09-10",
          quantity_ordered: 10,
        } as any);

        expect(result).toEqual({
          valid: false,
          error: "Actual delivery date cannot be before the transaction date",
          code: "VALIDATION_FAILED",
          field: "actual_delivery_date",
        });
      });
});