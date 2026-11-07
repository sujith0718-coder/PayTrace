package com.paytrace.thurika_models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DEVELOPER: Thurika G
 * OBJECTIVE: Model representing a Payment Gateway transaction capture.
 * OOP CONCEPT: Inheritance (extends BaseFinancialRecord).
 */
public class PaymentTransaction extends BaseFinancialRecord {

    // TODO [THURIKA]: Add specific fields:
    // - private String orderId;       // Link back to OrderRecord
    // - private BigDecimal feeAmount; // Gateway processing fee
    // - private String gatewayName;   // e.g. "Stripe", "Adyen"
    // - private String status;        // e.g. "CAPTURED", "FAILED"
    private String orderId;
    private BigDecimal feeAmount;
    private String gatewayName;
    private String status;

    public PaymentTransaction(String paymentId, String orderId, LocalDateTime paymentDate, BigDecimal amount, BigDecimal feeAmount, String gatewayName, String status) {
        // TODO [THURIKA]: Call super constructor
        super(paymentId, paymentDate, amount, "USD");
        this.orderId = orderId;
        this.feeAmount = feeAmount != null ? feeAmount : BigDecimal.ZERO;
        this.gatewayName = gatewayName;
        this.status = status;
    }

    // TODO [THURIKA]: Add Getters and Setters below
    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public BigDecimal getFeeAmount() {
        return feeAmount;
    }

    public void setFeeAmount(BigDecimal feeAmount) {
        this.feeAmount = feeAmount;
    }

    public String getGatewayName() {
        return gatewayName;
    }

    public void setGatewayName(String gatewayName) {
        this.gatewayName = gatewayName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @Override
    public String getSourceType() {
        return "PAYMENT_GATEWAY";
    }
}

