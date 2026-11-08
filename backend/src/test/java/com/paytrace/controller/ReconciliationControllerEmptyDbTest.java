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
