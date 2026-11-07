package com.paytrace.thurika_models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DEVELOPER: Thurika G
 * OBJECTIVE: Abstract parent class representing any financial record.
 * OOP CONCEPTS: Abstraction, Encapsulation, Polymorphism.
 */
public abstract class BaseFinancialRecord {

    // TODO [THURIKA]: Declare your protected variables here
    // 1. String recordId
    // 2. LocalDateTime timestamp
    // 3. BigDecimal amount
    // 4. String currency
    protected String recordId;
    protected LocalDateTime timestamp;
    protected BigDecimal amount;
    protected String currency;

    /**
     * Constructor
     */
    public BaseFinancialRecord(String recordId, LocalDateTime timestamp, BigDecimal amount, String currency) {
        // TODO [THURIKA]: Validate that amount cannot be negative (amount.compareTo(BigDecimal.ZERO) < 0)
        // If negative, throw new IllegalArgumentException("Amount cannot be negative: " + amount);
        
        // TODO [THURIKA]: Assign parameters to fields (handle nulls with defaults if desired)
        this.recordId = recordId;
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
        this.amount = amount != null ? amount : BigDecimal.ZERO;
        this.currency = currency != null ? currency : "USD";
    }

    // TODO [THURIKA]: Implement Getters and Setters below with proper encapsulation
    public String getRecordId() {
        return recordId;
    }

    public void setRecordId(String recordId) {
        this.recordId = recordId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        // TODO [THURIKA]: Add negative amount check before updating this.amount
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    /**
     * Abstract method: Every child class MUST implement this to describe its source.
     */
    public abstract String getSourceType();
}
