package com.paytrace.controller;

import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.sql.Connection;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class ReconciliationControllerEmptyDbTest {

    private JdbcDataSource dataSource;
    private ReconciliationController controller;

    @BeforeEach
    void setUp() throws Exception {
        dataSource = new JdbcDataSource();
        dataSource.setURL("jdbc:h2:mem:paytracetest_" + System.nanoTime() + ";MODE=MySQL;DB_CLOSE_DELAY=-1");
        dataSource.setUser("sa");
        dataSource.setPassword("");

        controller = new ReconciliationController();
        controller.setDataSource(dataSource);
        controller.initDatabase();
    }

    @AfterEach
    void tearDown() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("SHUTDOWN");
        }
    }

    @Test
    @DisplayName("Empty DB: getInvestigations returns HTTP 200 with empty list, never starter mocks")
    void testGetInvestigationsEmptyDb() {
        ResponseEntity<List<Map<String, Object>>> response = controller.getInvestigations();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty(), "Empty database must return empty list of investigations, not starter mocks!");
    }

    @Test
    @DisplayName("Empty DB: getAllRuns returns HTTP 200 with empty list, never starter runs")
    void testGetAllRunsEmptyDb() {
        ResponseEntity<List<Map<String, Object>>> response = controller.getAllRuns();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty(), "Empty database must return empty list of reconciliation runs!");
    }

    @Test
    @DisplayName("Empty DB: getRun for non-existent run returns 404 NOT FOUND")
    void testGetRunNotFound() {
        ResponseEntity<Map<String, Object>> response = controller.getRun("RUN-2026-901");
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode(), "Requesting non-existent run on empty DB must return 404 NOT FOUND!");
    }

    @Test
    @DisplayName("Empty DB: getDiscrepancies returns empty list")
    void testGetDiscrepanciesEmptyDb() {
        ResponseEntity<List<Map<String, Object>>> response = controller.getDiscrepancies("RUN-2026-901");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty(), "Empty database must return empty list of discrepancies!");
    }

    @Test
    @DisplayName("Trigger Run: Discrepancies with NULL order_id (UNMATCHED_SETTLEMENT) persist safely into DB alongside investigations")
    void testTriggerRunPersistsDiscrepanciesAndInvestigationsWithNullOrderId() throws Exception {
        // Insert sample records with an unmatched settlement into the test DB
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("INSERT INTO orders (order_id, batch_id, amount, status) VALUES ('ORD-1', 'BATCH-TEST-1', 100.00, 'PAID')");
            stmt.executeUpdate("INSERT INTO payments (payment_id, batch_id, order_id, amount, status) VALUES ('PAY-1', 'BATCH-TEST-1', 'ORD-1', 100.00, 'SUCCESS')");
            stmt.executeUpdate("INSERT INTO settlements (settlement_id, batch_id, payment_id, gross_amount, net_amount, fee, bank_reference) VALUES ('SET-UNMATCHED', 'BATCH-TEST-1', 'PAY-NONE', 50.00, 50.00, 0.00, 'REF-999')");
        }

        ResponseEntity<Map<String, Object>> runResp = controller.triggerRun(Map.of("batchId", "BATCH-TEST-1"));
        assertEquals(HttpStatus.OK, runResp.getStatusCode());
        assertNotNull(runResp.getBody());
        String runId = (String) runResp.getBody().get("runId");
        assertNotNull(runId);

        // Verify discrepancies are persisted in DB
        ResponseEntity<List<Map<String, Object>>> discResp = controller.getDiscrepancies(runId);
        assertEquals(HttpStatus.OK, discResp.getStatusCode());
        List<Map<String, Object>> discrepancies = discResp.getBody();
        assertNotNull(discrepancies);
        assertFalse(discrepancies.isEmpty(), "Discrepancies must be saved to DB and returned!");

        // Verify unmatched settlement discrepancy has null orderId and safe persistence
        boolean hasUnmatchedSettlement = false;
        for (Map<String, Object> d : discrepancies) {
            assertEquals(runId, d.get("runId"), "Every discrepancy must belong to runId");
            if ("UNMATCHED_SETTLEMENT".equals(d.get("type"))) {
                hasUnmatchedSettlement = true;
                assertNull(d.get("orderId"), "UNMATCHED_SETTLEMENT must have null orderId");
            }
        }
        assertTrue(hasUnmatchedSettlement, "Must contain an UNMATCHED_SETTLEMENT discrepancy");

        // Verify investigations are persisted in DB
        ResponseEntity<List<Map<String, Object>>> invResp = controller.getInvestigations();
        assertEquals(HttpStatus.OK, invResp.getStatusCode());
        List<Map<String, Object>> investigations = invResp.getBody();
        assertNotNull(investigations);
        assertEquals(discrepancies.size(), investigations.size(), "Investigation count must match discrepancy count in DB!");

        for (Map<String, Object> inv : investigations) {
            assertEquals(runId, inv.get("runId"));
            assertNotNull(inv.get("caseNumber"));
            assertNotNull(inv.get("discrepancyType"));
            assertNotNull(inv.get("discrepancy"), "Investigation must contain hydrated discrepancy");
        }
    }

    @Test
    @DisplayName("Unique IDs: Multiple runs generate unique discrepancy IDs and investigation IDs without overwriting")
    void testDiscrepancyAndInvestigationIdsAreUniqueAcrossRuns() {
        ResponseEntity<Map<String, Object>> runResp1 = controller.triggerRun(Map.of("batchId", "BATCH-TEST-A"));
        String runId1 = (String) runResp1.getBody().get("runId");

        ResponseEntity<Map<String, Object>> runResp2 = controller.triggerRun(Map.of("batchId", "BATCH-TEST-B"));
        String runId2 = (String) runResp2.getBody().get("runId");

        assertNotEquals(runId1, runId2, "Run IDs must be distinct");

        List<Map<String, Object>> discs1 = controller.getDiscrepancies(runId1).getBody();
        List<Map<String, Object>> discs2 = controller.getDiscrepancies(runId2).getBody();

        assertNotNull(discs1);
        assertNotNull(discs2);
        assertFalse(discs1.isEmpty());
        assertFalse(discs2.isEmpty());

        // IDs must not collide
        for (Map<String, Object> d1 : discs1) {
            for (Map<String, Object> d2 : discs2) {
                assertNotEquals(d1.get("id"), d2.get("id"), "Discrepancy IDs must be globally unique across runs");
            }
        }

        // Investigations in DB must contain both runs
        List<Map<String, Object>> allInvs = controller.getInvestigations().getBody();
        assertNotNull(allInvs);
        assertEquals(discs1.size() + discs2.size(), allInvs.size(), "All investigations from both runs must be preserved");
    }

    @Test
    @DisplayName("Demo Mode (no DataSource): starter data is retained for standalone offline preview")
    void testDemoModeStandalone() {
        ReconciliationController demoController = new ReconciliationController();
        demoController.initDatabase();

        ResponseEntity<List<Map<String, Object>>> invResponse = demoController.getInvestigations();
        assertEquals(HttpStatus.OK, invResponse.getStatusCode());
        assertNotNull(invResponse.getBody());
        assertFalse(invResponse.getBody().isEmpty(), "Demo controller without DB should provide offline starter investigations");
    }
}
