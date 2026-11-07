package com.paytrace.sujith_engine;

import com.paytrace.thurika_models.*;
import java.math.BigDecimal;
import java.util.*;

/**
 * DEVELOPER: Sujith E
 * OBJECTIVE: Core 3-way matching algorithm running in O(N) time complexity.
 */

public class ReconciliationEngine {

    // Threshold allowed for small rounding differences (e.g. $0.05)
    private final BigDecimal tolerance;

    public ReconciliationEngine() {
        this(new BigDecimal("0.05"));
    }

    public ReconciliationEngine(BigDecimal tolerance) {
        this.tolerance = tolerance != null ? tolerance : new BigDecimal("0.05");
    }

    /**
     * Executes 3-way reconciliation across:
     * 1. Ingested Orders (OMS)
     * 2. Payment Gateway transactions (Stripe, Adyen)
     * 3. Bank Settlements (Chase, Citi)
     */
    public ReconciliationResult reconcile(
            List<OrderRecord> orders,
            List<PaymentTransaction> payments,
            List<SettlementRecord> settlements
    ) {
        List<Discrepancy> discrepancies = new ArrayList<>();
        int matchedCount = 0;
        BigDecimal totalOrderValue = BigDecimal.ZERO;
        BigDecimal totalSettledValue = BigDecimal.ZERO;

        // -------------------------------------------------------------
        // STEP 1 [SUJITH]: Pre-index payments by orderId into a HashMap
        // Use Map<String, List<PaymentTransaction>> so you can detect duplicates!
        // -------------------------------------------------------------
        Map<String, List<PaymentTransaction>> paymentMap = new HashMap<>();
        for (PaymentTransaction p : payments) {
            // TODO [SUJITH]: Group payments by orderId
            paymentMap.computeIfAbsent(p.getOrderId(), k -> new ArrayList<>()).add(p);
        }

        // -------------------------------------------------------------
        // STEP 2 [SUJITH]: Pre-index settlements by paymentId into a HashMap
        // -------------------------------------------------------------
        Map<String, SettlementRecord> settlementMap = new HashMap<>();
        for (SettlementRecord s : settlements) {
            // TODO [SUJITH]: Map settlement by paymentId and accumulate totalSettledValue
            settlementMap.put(s.getPaymentId(), s);
            totalSettledValue = totalSettledValue.add(s.getNetAmount());
        }

        // -------------------------------------------------------------
        // STEP 3 [SUJITH]: Loop through Orders and execute 3-Way Match
        // -------------------------------------------------------------
        int discIdCounter = 100;
        for (OrderRecord order : orders) {
            totalOrderValue = totalOrderValue.add(order.getAmount());
            String orderId = order.getRecordId();

            List<PaymentTransaction> matchingPayments = paymentMap.get(orderId);

            // Case A: Missing Payment Record
            if (matchingPayments == null || matchingPayments.isEmpty()) {
                // TODO [SUJITH]: Add a DiscrepancyType.MISSING_PAYMENT to discrepancies list
                discrepancies.add(new Discrepancy(
                        "DISC-" + (++discIdCounter),
                        DiscrepancyType.MISSING_PAYMENT,
                        orderId,
                        order.getAmount(),
                        BigDecimal.ZERO,
                        "Order exists in OMS, but no payment gateway transaction was captured."
                ));
                continue;
            }

            // Case B: Duplicate Transactions (More than 1 payment for the same order)
            if (matchingPayments.size() > 1) {
                // TODO [SUJITH]: Calculate total captured amount and flag DiscrepancyType.DUPLICATE_TRANSACTION
                BigDecimal totalPaid = matchingPayments.stream()
                        .map(PaymentTransaction::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                discrepancies.add(new Discrepancy(
                        "DISC-" + (++discIdCounter),
                        DiscrepancyType.DUPLICATE_TRANSACTION,
                        orderId,
                        order.getAmount(),
                        totalPaid,
                        "Multiple payments (" + matchingPayments.size() + ") detected for single order #" + orderId
                ));
                continue;
            }

            // Exactly 1 payment found
            PaymentTransaction payment = matchingPayments.get(0);

            // Case C: Amount Mismatch (Order Amount vs. Captured Amount outside tolerance)
            BigDecimal amountDiff = order.getAmount().subtract(payment.getAmount()).abs();
            if (amountDiff.compareTo(tolerance) > 0) {
                // TODO [SUJITH]: Add DiscrepancyType.AMOUNT_MISMATCH
                discrepancies.add(new Discrepancy(
                        "DISC-" + (++discIdCounter),
                        DiscrepancyType.AMOUNT_MISMATCH,
                        orderId,
                        order.getAmount(),
                        payment.getAmount(),
                        "Order amount ($" + order.getAmount() + ") does not match gateway captured amount ($" + payment.getAmount() + ")."
                ));
                continue;
            }

            // Case D: Missing Bank Settlement
            SettlementRecord settlement = settlementMap.get(payment.getRecordId());
            if (settlement == null) {
                // TODO [SUJITH]: Add DiscrepancyType.MISSING_SETTLEMENT
                discrepancies.add(new Discrepancy(
                        "DISC-" + (++discIdCounter),
                        DiscrepancyType.MISSING_SETTLEMENT,
                        orderId,
                        payment.getAmount(),
                        BigDecimal.ZERO,
                        "Payment captured on gateway, but bank settlement record has not settled."
                ));
                continue;
            }

            // Clean 3-way match!
            matchedCount++;
        }

        return new ReconciliationResult(orders.size(), matchedCount, discrepancies, totalOrderValue, totalSettledValue);
    }
}

