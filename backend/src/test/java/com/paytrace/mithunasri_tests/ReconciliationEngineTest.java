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
}

