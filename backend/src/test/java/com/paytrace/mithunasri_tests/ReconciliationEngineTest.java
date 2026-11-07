package com.paytrace.mithunasri_tests;

import com.paytrace.thurika_models.*;
import com.paytrace.sujith_engine.*;
import com.paytrace.mithunasri_workflow.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * DEVELOPER: Mithunasri J
 * OBJECTIVE: Automated JUnit 5 regression test suite testing all four team members' contributions.
 */
public class ReconciliationEngineTest {

    private ReconciliationEngine engine;

    @BeforeEach
    void setUp() {
        // Initializes Sujith's engine with 5-cent tolerance
        engine = new ReconciliationEngine(new BigDecimal("0.05"));
    }

    @Test
    @DisplayName("Test 1: Perfectly matched order, payment, and settlement")
    void testPerfectMatch() {
        // TODO [MITHUNASRI]: Build 1 matching set of records
        OrderRecord order = new OrderRecord("ORD-1", LocalDateTime.now(), "CUST-1", new BigDecimal("100.00"), "USD", "COMPLETED");
        PaymentTransaction payment = new PaymentTransaction("PAY-1", "ORD-1", LocalDateTime.now(), new BigDecimal("100.00"), new BigDecimal("2.00"), "Stripe", "CAPTURED");
        SettlementRecord settlement = new SettlementRecord("SET-1", "PAY-1", LocalDateTime.now(), new BigDecimal("100.00"), new BigDecimal("98.00"), new BigDecimal("2.00"), "BANK-1");

        ReconciliationResult result = engine.reconcile(List.of(order), List.of(payment), List.of(settlement));

        // Asserts
        assertEquals(1, result.getMatchedRecords(), "Should have exactly 1 matched record");
        assertEquals(0, result.getDiscrepanciesCount(), "Should have 0 discrepancies");
        assertEquals(100.0, result.getReconciliationPercentage(), "Match rate should be 100%");
    }

    @Test
    @DisplayName("Test 2: Amount mismatch outside tolerance ($250 vs $230)")
    void testAmountMismatch() {
        // TODO [MITHUNASRI]: Build order with $250 and payment with $230
        OrderRecord order = new OrderRecord("ORD-2", LocalDateTime.now(), "CUST-2", new BigDecimal("250.00"), "USD", "COMPLETED");
        PaymentTransaction payment = new PaymentTransaction("PAY-2", "ORD-2", LocalDateTime.now(), new BigDecimal("230.00"), new BigDecimal("4.00"), "Stripe", "CAPTURED");
        SettlementRecord settlement = new SettlementRecord("SET-2", "PAY-2", LocalDateTime.now(), new BigDecimal("230.00"), new BigDecimal("226.00"), new BigDecimal("4.00"), "BANK-2");

        ReconciliationResult result = engine.reconcile(List.of(order), List.of(payment), List.of(settlement));

        // Asserts
        assertEquals(0, result.getMatchedRecords(), "Should have 0 matched records");
        assertEquals(1, result.getDiscrepanciesCount(), "Should have flagged 1 discrepancy");
        assertEquals(DiscrepancyType.AMOUNT_MISMATCH, result.getDiscrepancies().get(0).getType());
        assertEquals(new BigDecimal("20.00"), result.getDiscrepancies().get(0).getVariance());
    }

    @Test
    @DisplayName("Test 3: Missing payment gateway record")
    void testMissingPayment() {
        // TODO [MITHUNASRI]: Order exists, but empty payment list
        OrderRecord order = new OrderRecord("ORD-3", LocalDateTime.now(), "CUST-3", new BigDecimal("150.00"), "USD", "COMPLETED");

        ReconciliationResult result = engine.reconcile(List.of(order), List.of(), List.of());

        // Asserts
        assertEquals(1, result.getDiscrepanciesCount());
        assertEquals(DiscrepancyType.MISSING_PAYMENT, result.getDiscrepancies().get(0).getType());
    }

    @Test
    @DisplayName("Test 4: Investigation status state machine & mandatory resolution note")
    void testInvestigationWorkflow() {
        // TODO [MITHUNASRI]: Create a case, move to review, assert cannot resolve with empty note
        Discrepancy disc = new Discrepancy("DISC-1", DiscrepancyType.AMOUNT_MISMATCH, "ORD-1", new BigDecimal("100"), new BigDecimal("90"), "Variance");
        InvestigationCase inv = new InvestigationCase("INV-101", disc, "Mithunasri J");

        assertEquals(InvestigationStatus.OPEN, inv.getStatus());

        inv.moveToUnderReview();
        assertEquals(InvestigationStatus.UNDER_REVIEW, inv.getStatus());

        // Assert empty note throws exception
        assertThrows(IllegalArgumentException.class, () -> inv.resolve("TIMING_DIFFERENCE", "   "));

        // Valid resolution
        inv.resolve("TIMING_DIFFERENCE", "Verified customer discount was applied.");
        assertEquals(InvestigationStatus.RESOLVED, inv.getStatus());
        assertEquals("TIMING_DIFFERENCE", inv.getResolutionCategory());
    }

    @Test
    @DisplayName("Test 5: Real-world CSV Ingestion and 3-way Matching for all 8 test cases")
    void testSampleCsvReconciliation() throws Exception {
        com.paytrace.tharun_ingestion.CsvImportService importService = new com.paytrace.tharun_ingestion.CsvImportService();

        java.io.File omsFile = new java.io.File("C:/Users/sujit/Downloads/PayTrace_sample_test_CSVs/oms_orders.csv");
        java.io.File gwFile = new java.io.File("C:/Users/sujit/Downloads/PayTrace_sample_test_CSVs/gateway_transactions.csv");
        java.io.File bankFile = new java.io.File("C:/Users/sujit/Downloads/PayTrace_sample_test_CSVs/bank_settlements.csv");

        assertTrue(omsFile.exists(), "OMS CSV should exist");
        assertTrue(gwFile.exists(), "Gateway CSV should exist");
        assertTrue(bankFile.exists(), "Bank CSV should exist");

        var ordersRes = importService.parseOrders(new java.io.FileInputStream(omsFile));
        var paymentsRes = importService.parsePayments(new java.io.FileInputStream(gwFile));
        var settlementsRes = importService.parseSettlements(new java.io.FileInputStream(bankFile));

        assertEquals(6, ordersRes.getValidRecords().size(), "Should parse 6 orders (ORD-1001 to ORD-1006)");
        assertEquals(6, paymentsRes.getValidRecords().size(), "Should parse 6 payments (GW-5001 to GW-5005, GW-5007)");
        assertEquals(6, settlementsRes.getValidRecords().size(), "Should parse 6 settlements (BANK-9001 to BANK-9004, BANK-9007, BANK-9008)");

        ReconciliationResult result = engine.reconcile(
                ordersRes.getValidRecords(),
                paymentsRes.getValidRecords(),
                settlementsRes.getValidRecords()
        );

        // Expected cases:
        // ORD-1001: Matched (1200)
        // ORD-1002: Matched (850)
        // ORD-1003: AMOUNT_MISMATCH (OMS 1500, GW 1490)
        // ORD-1004: Matched (650)
        // ORD-1005: MISSING_SETTLEMENT (999)
        // ORD-1006: MISSING_PAYMENT (2200)
        // ORD-1007: MISSING_ORDER (GW 450)
        // BANK-9008: UNMATCHED_SETTLEMENT (Bank 300)

        assertEquals(3, result.getMatchedRecords(), "Should have exactly 3 matched records (ORD-1001, ORD-1002, ORD-1004)");
        assertEquals(5, result.getDiscrepanciesCount(), "Should have exactly 5 discrepancies");

        var discMap = new java.util.HashMap<String, Discrepancy>();
        for (Discrepancy d : result.getDiscrepancies()) {
            discMap.put(d.getOrderId(), d);
        }

        // 1. ORD-1003
        assertTrue(discMap.containsKey("ORD-1003"));
        assertEquals(DiscrepancyType.AMOUNT_MISMATCH, discMap.get("ORD-1003").getType());
        assertEquals(0, new BigDecimal("10.00").compareTo(discMap.get("ORD-1003").getVariance().abs()));
        assertNotNull(discMap.get("ORD-1003").getOrderRecord());
        assertNotNull(discMap.get("ORD-1003").getPaymentRecord());

        // 2. ORD-1005
        assertTrue(discMap.containsKey("ORD-1005"));
        assertEquals(DiscrepancyType.MISSING_SETTLEMENT, discMap.get("ORD-1005").getType());
        assertEquals(0, new BigDecimal("999.00").compareTo(discMap.get("ORD-1005").getVariance().abs()));
        assertNotNull(discMap.get("ORD-1005").getOrderRecord());
        assertNotNull(discMap.get("ORD-1005").getPaymentRecord());

        // 3. ORD-1006
        assertTrue(discMap.containsKey("ORD-1006"));
        assertEquals(DiscrepancyType.MISSING_PAYMENT, discMap.get("ORD-1006").getType());
        assertEquals(0, new BigDecimal("2200.00").compareTo(discMap.get("ORD-1006").getVariance().abs()));
        assertNotNull(discMap.get("ORD-1006").getOrderRecord());
        assertNull(discMap.get("ORD-1006").getPaymentRecord());

        // 4. ORD-1007
        assertTrue(discMap.containsKey("ORD-1007"));
        assertEquals(DiscrepancyType.MISSING_ORDER, discMap.get("ORD-1007").getType());
        assertEquals(0, new BigDecimal("450.00").compareTo(discMap.get("ORD-1007").getVariance().abs()));
        assertNull(discMap.get("ORD-1007").getOrderRecord());
        assertNotNull(discMap.get("ORD-1007").getPaymentRecord());

        // 5. BANK-9008
        assertTrue(discMap.containsKey("BANK-9008"));
        assertEquals(DiscrepancyType.UNMATCHED_SETTLEMENT, discMap.get("BANK-9008").getType());
        assertEquals(0, new BigDecimal("300.00").compareTo(discMap.get("BANK-9008").getVariance().abs()));
        assertNull(discMap.get("BANK-9008").getOrderRecord());
        assertNull(discMap.get("BANK-9008").getPaymentRecord());
        assertNotNull(discMap.get("BANK-9008").getSettlementRecord());
    }
}

