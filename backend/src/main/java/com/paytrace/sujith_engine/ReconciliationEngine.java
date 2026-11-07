package com.paytrace.sujith_engine;

import com.paytrace.thurika_models.*;
import java.math.BigDecimal;
import java.util.*;

/**
 * DEVELOPER: Sujith E
 * OBJECTIVE: Core 3-way matching algorithm running in O(N) time complexity across Orders, Gateway Payments, and Bank Settlements.
 */
public class ReconciliationEngine {

    // Threshold allowed for small rounding differences (e.g. $0.05 or ₹0.05)
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
     * 2. Payment Gateway transactions (UPI, Stripe, Adyen)
     * 3. Bank Settlements (HDFC, Chase, Citi)
     */
    public ReconciliationResult reconcile(
            List<OrderRecord> orders,
            List<PaymentTransaction> payments,
            List<SettlementRecord> settlements
    ) {
        return reconcile(null, orders, payments, settlements);
    }

    public ReconciliationResult reconcile(
            String runId,
            List<OrderRecord> orders,
            List<PaymentTransaction> payments,
            List<SettlementRecord> settlements
    ) {
        if (orders == null) orders = Collections.emptyList();
        if (payments == null) payments = Collections.emptyList();
        if (settlements == null) settlements = Collections.emptyList();

        List<Discrepancy> discrepancies = new ArrayList<>();
        int matchedCount = 0;
        BigDecimal totalOrderValue = BigDecimal.ZERO;
        BigDecimal totalSettledValue = BigDecimal.ZERO;
        String idPrefix = (runId != null && !runId.trim().isEmpty()) ? runId + "-DISC-" : "DISC-";

        // -------------------------------------------------------------
        // STEP 1: Pre-index payments by orderId and by paymentId
        // -------------------------------------------------------------
        Map<String, List<PaymentTransaction>> paymentsByOrderId = new LinkedHashMap<>();
        Map<String, PaymentTransaction> paymentsById = new LinkedHashMap<>();

        for (PaymentTransaction p : payments) {
            paymentsById.put(p.getRecordId(), p);
            if (p.getOrderId() != null && !p.getOrderId().trim().isEmpty()) {
                paymentsByOrderId.computeIfAbsent(p.getOrderId().trim(), k -> new ArrayList<>()).add(p);
            }
        }

        // -------------------------------------------------------------
        // STEP 2: Pre-index settlements by paymentId and by settlementId
        // -------------------------------------------------------------
        Map<String, SettlementRecord> settlementsByPaymentId = new LinkedHashMap<>();
        Map<String, SettlementRecord> settlementsById = new LinkedHashMap<>();

        for (SettlementRecord s : settlements) {
            settlementsById.put(s.getRecordId(), s);
            if (s.getPaymentId() != null && !s.getPaymentId().trim().isEmpty()) {
                settlementsByPaymentId.put(s.getPaymentId().trim(), s);
            }
            totalSettledValue = totalSettledValue.add(s.getGrossAmount() != null ? s.getGrossAmount() : s.getNetAmount());
        }

        Set<String> processedPaymentIds = new HashSet<>();
        Set<String> processedSettlementIds = new HashSet<>();
        int discIdCounter = 100;

        // -------------------------------------------------------------
        // STEP 3 (PHASE 1): Loop through Orders and execute 3-Way Match
        // -------------------------------------------------------------
        for (OrderRecord order : orders) {
            totalOrderValue = totalOrderValue.add(order.getAmount());
            String orderId = order.getRecordId();

            List<PaymentTransaction> matchingPayments = paymentsByOrderId.get(orderId);

            // Case A: Missing Payment Record
            if (matchingPayments == null || matchingPayments.isEmpty()) {
                discrepancies.add(new Discrepancy(
                        idPrefix + (++discIdCounter),
                        DiscrepancyType.MISSING_PAYMENT,
                        orderId,
                        order.getAmount(),
                        BigDecimal.ZERO,
                        "Order exists in OMS, but no payment gateway transaction was captured.",
                        order,
                        null,
                        null
                ));
                continue;
            }

            // Case B: Duplicate Transactions (More than 1 payment for the same order)
            if (matchingPayments.size() > 1) {
                BigDecimal totalPaid = BigDecimal.ZERO;
                for (PaymentTransaction p : matchingPayments) {
                    processedPaymentIds.add(p.getRecordId());
                    totalPaid = totalPaid.add(p.getAmount());
                }

                PaymentTransaction primaryPayment = matchingPayments.get(0);
                SettlementRecord settlement = settlementsByPaymentId.get(primaryPayment.getRecordId());
                if (settlement != null) processedSettlementIds.add(settlement.getRecordId());

                discrepancies.add(new Discrepancy(
                        idPrefix + (++discIdCounter),
                        DiscrepancyType.DUPLICATE_TRANSACTION,
                        orderId,
                        order.getAmount(),
                        totalPaid,
                        "Multiple payments (" + matchingPayments.size() + ") detected for single order #" + orderId,
                        order,
                        primaryPayment,
                        settlement
                ));
                continue;
            }

            // Exactly 1 payment found
            PaymentTransaction payment = matchingPayments.get(0);
            processedPaymentIds.add(payment.getRecordId());

            SettlementRecord settlement = settlementsByPaymentId.get(payment.getRecordId());
            if (settlement != null) {
                processedSettlementIds.add(settlement.getRecordId());
            }

            // Case C: Amount Mismatch (Order Amount vs. Captured Amount outside tolerance)
            BigDecimal amountDiff = order.getAmount().subtract(payment.getAmount()).abs();
            if (amountDiff.compareTo(tolerance) > 0) {
                discrepancies.add(new Discrepancy(
                        idPrefix + (++discIdCounter),
                        DiscrepancyType.AMOUNT_MISMATCH,
                        orderId,
                        order.getAmount(),
                        payment.getAmount(),
                        "Order amount (" + order.getAmount() + ") does not match gateway captured amount (" + payment.getAmount() + ").",
                        order,
                        payment,
                        settlement
                ));
                continue;
            }

            // Case D: Missing Bank Settlement
            if (settlement == null) {
                discrepancies.add(new Discrepancy(
                        idPrefix + (++discIdCounter),
                        DiscrepancyType.MISSING_SETTLEMENT,
                        orderId,
                        payment.getAmount(),
                        BigDecimal.ZERO,
                        "Payment captured on gateway, but bank settlement record has not settled.",
                        order,
                        payment,
                        null
                ));
                continue;
            }

            // Clean 3-way match!
            matchedCount++;
        }

        // -------------------------------------------------------------
        // STEP 4 (PHASE 2): Gateway Payments without OMS Orders
        // -------------------------------------------------------------
        for (PaymentTransaction payment : payments) {
            if (!processedPaymentIds.contains(payment.getRecordId())) {
                processedPaymentIds.add(payment.getRecordId());

                SettlementRecord settlement = settlementsByPaymentId.get(payment.getRecordId());
                if (settlement != null) {
                    processedSettlementIds.add(settlement.getRecordId());
                }

                String displayOrderId = (payment.getOrderId() != null && !payment.getOrderId().trim().isEmpty())
                        ? payment.getOrderId().trim()
                        : payment.getRecordId();

                discrepancies.add(new Discrepancy(
                        idPrefix + (++discIdCounter),
                        DiscrepancyType.MISSING_ORDER,
                        displayOrderId,
                        BigDecimal.ZERO,
                        payment.getAmount(),
                        "Payment captured on gateway (" + payment.getRecordId() + ", order #" + displayOrderId + "), but no corresponding order was found in OMS.",
                        null,
                        payment,
                        settlement
                ));
            }
        }

        // -------------------------------------------------------------
        // STEP 5 (PHASE 3): Bank Settlements without Gateway Payments
        // -------------------------------------------------------------
        for (SettlementRecord settlement : settlements) {
            if (!processedSettlementIds.contains(settlement.getRecordId())) {
                processedSettlementIds.add(settlement.getRecordId());

                String refTxn = (settlement.getPaymentId() != null && !settlement.getPaymentId().trim().isEmpty())
                        ? settlement.getPaymentId().trim()
                        : settlement.getBankReference();

                discrepancies.add(new Discrepancy(
                        idPrefix + (++discIdCounter),
                        DiscrepancyType.UNMATCHED_SETTLEMENT,
                        null, // Stored as NULL when no corresponding OMS order exists
                        BigDecimal.ZERO,
                        settlement.getGrossAmount(),
                        "Bank settlement deposit recorded (" + settlement.getRecordId() + ", ref: " + refTxn + "), but no matching payment gateway transaction was found.",
                        null,
                        null,
                        settlement
                ));
            }
        }

        int totalEvaluatedRecords = matchedCount + discrepancies.size();
        return new ReconciliationResult(totalEvaluatedRecords, matchedCount, discrepancies, totalOrderValue, totalSettledValue);
    }
}
