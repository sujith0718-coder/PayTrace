package com.paytrace.thurika_models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DEVELOPER: Thurika G
 * OBJECTIVE: Model representing an Order Management System record.
 * OOP CONCEPT: Inheritance (extends BaseFinancialRecord).
 */
public class OrderRecord extends BaseFinancialRecord {

    // TODO [THURIKA]: Add specific fields for OrderRecord:
    // - private String customerId;
    // - private String orderStatus; (e.g. "COMPLETED", "CANCELLED")
    private String customerId;
    private String orderStatus;

    public OrderRecord(String orderId, LocalDateTime orderDate, String customerId, BigDecimal amount, String currency, String orderStatus) {
        // TODO [THURIKA]: Call parent constructor using super(...)
        super(orderId, orderDate, amount, currency);
        this.customerId = customerId;
        this.orderStatus = orderStatus;
    }

    // TODO [THURIKA]: Add Getters and Setters for customerId and orderStatus
    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }

    @Override
    public String getSourceType() {
        // TODO [THURIKA]: Return "ORDER_MANAGEMENT_SYSTEM"
        return "ORDER_MANAGEMENT_SYSTEM";
    }

    @Override
    public String toString() {
        // TODO [THURIKA]: Return a readable string representation
        return "OrderRecord[ID=" + recordId + ", Amount=" + amount + ", Customer=" + customerId + "]";
    }
}

