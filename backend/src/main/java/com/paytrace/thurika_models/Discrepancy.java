package com.paytrace.thurika_models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DEVELOPER: Thurika G
 * OBJECTIVE: Entity representing a financial variance or issue detected between records.
 */
public class Discrepancy {

    private String id;
    private DiscrepancyType type;
    private String orderId;
    private BigDecimal expectedAmount;
    private BigDecimal actualAmount;
    private BigDecimal variance;
    private String explanation;
    private LocalDateTime detectedAt;

    private OrderRecord orderRecord;
    private PaymentTransaction paymentRecord;
    private SettlementRecord settlementRecord;

    public Discrepancy(String id, DiscrepancyType type, String orderId, BigDecimal expectedAmount, BigDecimal actualAmount, String explanation) {
        this(id, type, orderId, expectedAmount, actualAmount, explanation, null, null, null);
    }

    public Discrepancy(String id, DiscrepancyType type, String orderId, BigDecimal expectedAmount, BigDecimal actualAmount, String explanation,
                       OrderRecord orderRecord, PaymentTransaction paymentRecord, SettlementRecord settlementRecord) {
        this.id = id;
        this.type = type;
        this.orderId = orderId;
        this.expectedAmount = expectedAmount != null ? expectedAmount : BigDecimal.ZERO;
        this.actualAmount = actualAmount != null ? actualAmount : BigDecimal.ZERO;
        this.variance = this.expectedAmount.subtract(this.actualAmount);
        this.explanation = explanation;
        this.detectedAt = LocalDateTime.now();
        this.orderRecord = orderRecord;
        this.paymentRecord = paymentRecord;
        this.settlementRecord = settlementRecord;
    }

    public String getId() {
        return id;
    }

    public DiscrepancyType getType() {
        return type;
    }

    public String getOrderId() {
        return orderId;
    }

    public BigDecimal getExpectedAmount() {
        return expectedAmount;
    }

    public BigDecimal getActualAmount() {
        return actualAmount;
    }

    public BigDecimal getVariance() {
        return variance;
    }

    public String getExplanation() {
        return explanation;
    }

    public LocalDateTime getDetectedAt() {
        return detectedAt;
    }

    public OrderRecord getOrderRecord() {
        return orderRecord;
    }

    public void setOrderRecord(OrderRecord orderRecord) {
        this.orderRecord = orderRecord;
    }

    public PaymentTransaction getPaymentRecord() {
        return paymentRecord;
    }

    public void setPaymentRecord(PaymentTransaction paymentRecord) {
        this.paymentRecord = paymentRecord;
    }

    public SettlementRecord getSettlementRecord() {
        return settlementRecord;
    }

    public void setSettlementRecord(SettlementRecord settlementRecord) {
        this.settlementRecord = settlementRecord;
    }
}
