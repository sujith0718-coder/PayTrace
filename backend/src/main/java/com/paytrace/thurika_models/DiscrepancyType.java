package com.paytrace.thurika_models;

/**
 * DEVELOPER: Thurika G
 * OBJECTIVE: Enumeration of all financial discrepancy types detected by PayTrace.
 */
public enum DiscrepancyType {
    // Clean match
    MATCHED,

    // Order amount != Gateway amount
    AMOUNT_MISMATCH,

    // Order exists in OMS, but missing from Payment Gateway
    MISSING_PAYMENT,

    // Payment captured on Gateway, but missing from Bank Settlement
    MISSING_SETTLEMENT,

    // Multiple payments referencing the same order
    DUPLICATE_TRANSACTION,

    // Row has corrupted numbers or missing mandatory columns
    INVALID_FORMAT
}

