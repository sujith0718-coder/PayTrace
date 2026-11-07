package com.paytrace.thurika_models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DEVELOPER: Thurika G
 * OBJECTIVE: Entity representing a financial variance or issue detected between records.
 */
public class Discrepancy {

    // TODO [THURIKA]: Declare fields
    // - private String id;
    // - private DiscrepancyType type;
    // - private String orderId;
    // - private BigDecimal expectedAmount;
    // - private BigDecimal actualAmount;
    // - private BigDecimal variance;
    // - private String explanation;
    // - private LocalDateTime detectedAt;
    private String id;
    private DiscrepancyType type;
    private String orderId;
    private BigDecimal expectedAmount;
    private BigDecimal actualAmount;
    private BigDecimal variance;
    private String explanation;
    private LocalDateTime detectedAt;

    public Discrepancy(String id, DiscrepancyType type, String orderId, BigDecimal expectedAmount, BigDecimal actualAmount, String explanation) {
        this.id = id;
        this.type = type;
        this.orderId = orderId;
        this.expectedAmount = expectedAmount != null ? expectedAmount : BigDecimal.ZERO;
        this.actualAmount = actualAmount != null ? actualAmount : BigDecimal.ZERO;

        // TODO [THURIKA]: Calculate variance: expectedAmount - actualAmount
        this.variance = this.expectedAmount.subtract(this.actualAmount);
        this.explanation = explanation;
        this.detectedAt = LocalDateTime.now();
    }

    // TODO [THURIKA]: Add Getters below
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
}
