package com.paytrace.thurika_models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DEVELOPER: Thurika G
 * OBJECTIVE: Model representing a Bank Settlement deposit report.
 * OOP CONCEPT: Inheritance (extends BaseFinancialRecord).
 */
public class SettlementRecord extends BaseFinancialRecord {

    // TODO [THURIKA]: Add specific fields:
    // - private String paymentId;       // Link back to PaymentTransaction
    // - private BigDecimal grossAmount; // Amount before bank fees
    // - private BigDecimal netAmount;   // Net amount credited to bank account
    // - private BigDecimal bankFee;     // Interchange / bank adjustment fee
    // - private String bankReference;   // Bank transaction trace number
    private String paymentId;
    private BigDecimal grossAmount;
    private BigDecimal netAmount;
    private BigDecimal bankFee;
    private String bankReference;

    public SettlementRecord(String settlementId, String paymentId, LocalDateTime settlementDate, BigDecimal grossAmount, BigDecimal netAmount, BigDecimal bankFee, String bankReference) {
        // TODO [THURIKA]: Call super constructor with settlementId, settlementDate, netAmount, "USD"
        super(settlementId, settlementDate, netAmount, "USD");
        this.paymentId = paymentId;
        this.grossAmount = grossAmount;
        this.netAmount = netAmount;
        this.bankFee = bankFee;
        this.bankReference = bankReference;
    }

    // TODO [THURIKA]: Implement Getters and Setters below
    public String getPaymentId() {
        return paymentId;
    }

    public BigDecimal getGrossAmount() {
        return grossAmount;
    }

    public BigDecimal getNetAmount() {
        return netAmount;
    }

    public BigDecimal getBankFee() {
        return bankFee;
    }

    public String getBankReference() {
        return bankReference;
    }

    @Override
    public String getSourceType() {
        return "BANK_SETTLEMENT";
    }
}

