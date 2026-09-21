export interface TransactionInput {
    vendor_id: number;
    transaction_date: string;
    item_description: string;
    agreed_price: number;
    actual_price?: number;
    agreed_delivery_date: string;
    actual_delivery_date?: string;
    quantity_ordered: number;
    quantity_received?: number;
}

export type TransactionValidationResult = 
    | { valid: true; data: TransactionInput}
    | { valid: false; error: string; code: string; field: string };

function requireField(
        value: unknown,
        field: string,
        message: string
      ): TransactionValidationResult | null {
        if (value === undefined || value === null || value === "") {
          return {
            valid: false,
            error: message,
            code: "VALIDATION_FAILED",
            field,
          };
        }
        return null;
      }

export function validateTransactionInput(
        input: TransactionInput
      ): TransactionValidationResult {
        const vendorIdRequired = requireField(input.vendor_id, "vendor_id", "vendor is required");
        if (vendorIdRequired) return vendorIdRequired;

        if (
          typeof input.vendor_id !== "number" ||
          !Number.isInteger(input.vendor_id) ||
          input.vendor_id <= 0
        ) {
          return {
            valid: false,
            error: "Vendor id must be a positive integer",
            code: "VALIDATION_FAILED",
            field: "vendor_id",
          };
        }

        const transactionDateRequired = requireField(
          input.transaction_date,
          "transaction_date",
          "Transaction date is required"
        );
        if (transactionDateRequired) return transactionDateRequired;

        const transactionDate = new Date(input.transaction_date);
        if (Number.isNaN(transactionDate.getTime())) {
          return {
            valid: false,
            error: "Transaction date must be a valid date",
            code: "VALIDATION_FAILED",
            field: "transaction_date",
          };
        }

        const itemDescriptionRequired = requireField(
          input.item_description,
          "item_description",
          "Item description is required"
        );
        if (itemDescriptionRequired) return itemDescriptionRequired;

        if(input.item_description.length > 500) {
            return {
                valid: false,
                error: "Item description must be 500 characters or fewer",
                code: "VALIDATION_FAILED",
                field: "item_description",
            };
        }

        if (/[<>;'"]/.test(input.item_description) || input.item_description.includes("--")) {
            return {
              valid: false,
              error: "Item description contains disallowed characters",
              code: "VALIDATION_FAILED",
              field: "item_description",
            };
          }

        const agreedPriceRequired = requireField(
          input.agreed_price,
          "agreed_price",
          "Agreed price is required"
        );
        if (agreedPriceRequired) return agreedPriceRequired;

        if (typeof input.agreed_price !== "number") {
          return {
            valid: false,
            error: "Agreed price must be a number",
            code: "VALIDATION_FAILED",
            field: "agreed_price",
          };
        }

        if (input.agreed_price <= 0) {
          return {
            valid: false,
            error: "Agreed price must be greater than 0",
            code: "VALIDATION_FAILED",
            field: "agreed_price",
          };
        }

        const agreedDeliveryDateRequired = requireField(
          input.agreed_delivery_date,
          "agreed_delivery_date",
          "Agreed delivery date is required"
        );
        if (agreedDeliveryDateRequired) return agreedDeliveryDateRequired;

        const agreedDeliveryDate = new Date(input.agreed_delivery_date);
        if (Number.isNaN(agreedDeliveryDate.getTime())) {
          return {
            valid: false,
            error: "Agreed delivery date must be a valid date",
            code: "VALIDATION_FAILED",
            field: "agreed_delivery_date",
          };
        }

        const quantityOrderedRequired = requireField(
          input.quantity_ordered,
          "quantity_ordered",
          "Quantity ordered is required"
        );
        if (quantityOrderedRequired) return quantityOrderedRequired;

        if (typeof input.quantity_ordered !== "number") {
          return {
            valid: false,
            error: "Quantity ordered must be a number",
            code: "VALIDATION_FAILED",
            field: "quantity_ordered",
          };
        }

        if (input.quantity_ordered <= 0) {
          return {
            valid: false,
            error: "Quantity ordered must be greater than 0",
            code: "VALIDATION_FAILED",
            field: "quantity_ordered",
          };
        }

        const minDate = new Date("2000-01-01");
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (transactionDate < minDate) {
          return {
            valid: false,
            error: "Transaction date must be on or after 2000-01-01",
            code: "VALIDATION_FAILED",
            field: "transaction_date",
          };
        }

        if (transactionDate > today) {
          return {
            valid: false,
            error: "Transaction date cannot be in the future",
            code: "VALIDATION_FAILED",
            field: "transaction_date",
          };
        }

        if (agreedDeliveryDate < transactionDate) {
          return {
            valid: false,
            error: "Agreed delivery date cannot be before the transaction date",
            code: "VALIDATION_FAILED",
            field: "agreed_delivery_date",
          };
        }

        if (input.actual_price !== undefined && input.actual_price !== null) {
          if (typeof input.actual_price !== "number") {
            return {
              valid: false,
              error: "Actual price must be a number",
              code: "VALIDATION_FAILED",
              field: "actual_price",
            };
          }

          if (input.actual_price <= 0) {
            return {
              valid: false,
              error: "Actual price must be greater than 0",
              code: "VALIDATION_FAILED",
              field: "actual_price",
            };
          }
        }

        if (input.quantity_received !== undefined && input.quantity_received !== null) {
          if (typeof input.quantity_received !== "number") {
            return {
              valid: false,
              error: "Quantity received must be a number",
              code: "VALIDATION_FAILED",
              field: "quantity_received",
            };
          }

          if (input.quantity_received <= 0) {
            return {
              valid: false,
              error: "Quantity received must be greater than 0",
              code: "VALIDATION_FAILED",
              field: "quantity_received",
            };
          }
        }

        if (
          input.actual_delivery_date !== undefined &&
          input.actual_delivery_date !== null &&
          (input.actual_delivery_date as unknown) !== ""
        ) {
          const actualDeliveryDate = new Date(input.actual_delivery_date);
          if (Number.isNaN(actualDeliveryDate.getTime())) {
            return {
              valid: false,
              error: "Actual delivery date must be a valid date",
              code: "VALIDATION_FAILED",
              field: "actual_delivery_date",
            };
          }

          if (actualDeliveryDate < transactionDate) {
            return {
              valid: false,
              error: "Actual delivery date cannot be before the transaction date",
              code: "VALIDATION_FAILED",
              field: "actual_delivery_date",
            };
          }
        }

        return { valid: true, data: input };
      }
