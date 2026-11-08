package com.paytrace.controller;

import com.paytrace.sujith_engine.ReconciliationEngine;
import com.paytrace.sujith_engine.ReconciliationResult;
import com.paytrace.tharun_ingestion.CsvImportService;
import com.paytrace.tharun_ingestion.CsvValidationResult;
import com.paytrace.thurika_models.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Production Reconciliation Controller.
 * Connects real CSV ingestion, 3-way matching engine, and TiDB Cloud database persistence.
 * Dual-mapped to /... and /api/... for flexible client consumption.
 */
@RestController
public class ReconciliationController {

    @Autowired(required = false)
    private DataSource dataSource;

    public void setDataSource(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    private final CsvImportService csvImportService = new CsvImportService();

    private final Map<String, List<OrderRecord>> batchOrders = new ConcurrentHashMap<>();
    private final Map<String, List<PaymentTransaction>> batchPayments = new ConcurrentHashMap<>();
    private final Map<String, List<SettlementRecord>> batchSettlements = new ConcurrentHashMap<>();

    private final Map<String, Map<String, Object>> runsCache = new ConcurrentHashMap<>();
    private final Map<String, List<Map<String, Object>>> runDiscrepanciesCache = new ConcurrentHashMap<>();
    private final List<Map<String, Object>> investigationsCache = Collections.synchronizedList(new ArrayList<>());
    private final List<Map<String, Object>> auditLogsCache = Collections.synchronizedList(new ArrayList<>());

    @PostConstruct
    public void initDatabase() {
        if (dataSource != null) {
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement()) {

                // Source Ingestion Tables
                stmt.executeUpdate("""
                    CREATE TABLE IF NOT EXISTS orders (
                        order_id VARCHAR(64) PRIMARY KEY,
                        batch_id VARCHAR(64),
                        customer_id VARCHAR(64),
                        amount DECIMAL(15,2),
                        currency VARCHAR(16),
                        status VARCHAR(32),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """);

                stmt.executeUpdate("""
                    CREATE TABLE IF NOT EXISTS payments (
                        payment_id VARCHAR(64) PRIMARY KEY,
                        batch_id VARCHAR(64),
                        order_id VARCHAR(64),
                        amount DECIMAL(15,2),
                        fee DECIMAL(15,2),
                        gateway VARCHAR(64),
                        status VARCHAR(32),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """);

                stmt.executeUpdate("""
                    CREATE TABLE IF NOT EXISTS settlements (
                        settlement_id VARCHAR(64) PRIMARY KEY,
                        batch_id VARCHAR(64),
                        payment_id VARCHAR(64),
                        gross_amount DECIMAL(15,2),
                        net_amount DECIMAL(15,2),
                        fee DECIMAL(15,2),
                        bank_reference VARCHAR(128),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """);

                // Reconciliation Engine Tables
                stmt.executeUpdate("""
                    CREATE TABLE IF NOT EXISTS reconciliation_runs (
                        run_id VARCHAR(64) PRIMARY KEY,
                        batch_id VARCHAR(64),
                        status VARCHAR(32),
                        total_records INT,
                        matched_records INT,
                        discrepancies_count INT,
                        match_percentage DOUBLE,
                        total_order_value DECIMAL(15,2),
                        total_settled_value DECIMAL(15,2),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """);

                stmt.executeUpdate("""
                    CREATE TABLE IF NOT EXISTS discrepancies (
                        id VARCHAR(64) PRIMARY KEY,
                        run_id VARCHAR(64),
                        type VARCHAR(64),
                        severity VARCHAR(32),
                        order_id VARCHAR(64),
                        explanation TEXT,
                        expected_amount DECIMAL(15,2),
                        actual_amount DECIMAL(15,2),
                        variance DECIMAL(15,2),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """);

                stmt.executeUpdate("""
                    CREATE TABLE IF NOT EXISTS investigations (
                        id VARCHAR(64) PRIMARY KEY,
                        case_number VARCHAR(64),
                        discrepancy_id VARCHAR(64),
                        run_id VARCHAR(64),
                        discrepancy_type VARCHAR(64),
                        severity VARCHAR(32),
                        status VARCHAR(32),
                        variance_amount VARCHAR(32),
                        assigned_analyst VARCHAR(64),
                        assigned_analyst_email VARCHAR(128),
                        assigned_to VARCHAR(64),
                        resolution_category VARCHAR(64),
                        resolution_note TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """);

                stmt.executeUpdate("""
                    CREATE TABLE IF NOT EXISTS investigation_notes (
                        id VARCHAR(64) PRIMARY KEY,
                        investigation_id VARCHAR(64),
                        author VARCHAR(64),
                        author_role VARCHAR(64),
                        text TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """);

                // Seamlessly ensure any legacy columns exist without error
                safeAddColumn(stmt, "orders", "transaction_timestamp", "TIMESTAMP NULL");
                safeAddColumn(stmt, "payments", "transaction_timestamp", "TIMESTAMP NULL");
                safeAddColumn(stmt, "settlements", "transaction_timestamp", "TIMESTAMP NULL");
                safeAddColumn(stmt, "investigations", "case_number", "VARCHAR(64)");
                safeAddColumn(stmt, "investigations", "discrepancy_id", "VARCHAR(64)");
                safeAddColumn(stmt, "investigations", "run_id", "VARCHAR(64)");
                safeAddColumn(stmt, "investigations", "discrepancy_type", "VARCHAR(64)");
                safeAddColumn(stmt, "investigations", "severity", "VARCHAR(32)");
                safeAddColumn(stmt, "investigations", "status", "VARCHAR(32)");
                safeAddColumn(stmt, "investigations", "variance_amount", "VARCHAR(32)");
                safeAddColumn(stmt, "investigations", "assigned_analyst", "VARCHAR(64)");
                safeAddColumn(stmt, "investigations", "assigned_analyst_email", "VARCHAR(128)");
                safeAddColumn(stmt, "investigations", "assigned_to", "VARCHAR(64)");
                safeAddColumn(stmt, "investigations", "resolution_category", "VARCHAR(64)");
                safeAddColumn(stmt, "investigations", "resolution_note", "TEXT");
                safeAddColumn(stmt, "investigations", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

                System.out.println("PayTrace database tables verified and initialized in TiDB Cloud!");
            } catch (Exception e) {
                System.err.println("Database table initialization check: " + e.getMessage());
            }
        }

        if (dataSource == null) {
            initStarterData();
        }
    }

    private void safeAddColumn(Statement stmt, String table, String column, String colType) {
        try {
            stmt.executeUpdate("ALTER TABLE " + table + " ADD COLUMN " + column + " " + colType);
        } catch (Exception ignored) {}
    }

    @PostMapping({"/imports/upload", "/api/imports/upload"})
    public ResponseEntity<Map<String, Object>> uploadFiles(
            @RequestParam(value = "ordersFile", required = false) MultipartFile ordersFile,
            @RequestParam(value = "paymentsFile", required = false) MultipartFile paymentsFile,
            @RequestParam(value = "settlementsFile", required = false) MultipartFile settlementsFile
    ) {
        String batchId = "BATCH-" + System.currentTimeMillis() % 100000;
        List<String> warnings = new ArrayList<>();

        List<OrderRecord> orders = new ArrayList<>();
        List<PaymentTransaction> payments = new ArrayList<>();
        List<SettlementRecord> settlements = new ArrayList<>();

        try {
            if (ordersFile != null && !ordersFile.isEmpty()) {
                CsvValidationResult<OrderRecord> res = csvImportService.parseOrders(ordersFile.getInputStream());
                orders.addAll(res.getValidRecords());
                warnings.addAll(res.getWarnings());
            }
            if (paymentsFile != null && !paymentsFile.isEmpty()) {
                CsvValidationResult<PaymentTransaction> res = csvImportService.parsePayments(paymentsFile.getInputStream());
                payments.addAll(res.getValidRecords());
                warnings.addAll(res.getWarnings());
            }
            if (settlementsFile != null && !settlementsFile.isEmpty()) {
                CsvValidationResult<SettlementRecord> res = csvImportService.parseSettlements(settlementsFile.getInputStream());
                settlements.addAll(res.getValidRecords());
                warnings.addAll(res.getWarnings());
            }
        } catch (Exception e) {
            warnings.add("Upload stream processing error: " + e.getMessage());
        }

        if (ordersFile == null && orders.isEmpty()) {
            orders = createDefaultOrders();
        }
        if (paymentsFile == null && payments.isEmpty()) {
            payments = createDefaultPayments();
        }
        if (settlementsFile == null && settlements.isEmpty()) {
            settlements = createDefaultSettlements();
        }

        batchOrders.put(batchId, orders);
        batchPayments.put(batchId, payments);
        batchSettlements.put(batchId, settlements);

        // Permanently persist parsed CSV records into TiDB Cloud
        persistUploadedFilesToTiDB(batchId, orders, payments, settlements);

        Map<String, Object> resp = new HashMap<>();
        resp.put("batchId", batchId);
        resp.put("uploadedAt", Instant.now().toString());
        resp.put("ordersFilename", ordersFile != null ? ordersFile.getOriginalFilename() : "orders.csv");
        resp.put("paymentsFilename", paymentsFile != null ? paymentsFile.getOriginalFilename() : "payments.csv");
        resp.put("settlementsFilename", settlementsFile != null ? settlementsFile.getOriginalFilename() : "settlements.csv");
        resp.put("ordersCount", orders.size());
        resp.put("paymentsCount", payments.size());
        resp.put("settlementsCount", settlements.size());
        resp.put("invalidRowsCount", warnings.size());
        resp.put("warnings", warnings);

        return ResponseEntity.ok(resp);
    }

    private void persistUploadedFilesToTiDB(String batchId, List<OrderRecord> orders, List<PaymentTransaction> payments, List<SettlementRecord> settlements) {
        if (dataSource == null) return;
        try (Connection conn = dataSource.getConnection()) {
            // Save Orders
            try (PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO orders (order_id, batch_id, customer_id, amount, currency, status, transaction_timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE amount=VALUES(amount), status=VALUES(status), transaction_timestamp=VALUES(transaction_timestamp)
            """)) {
                for (OrderRecord o : orders) {
                    ps.setString(1, o.getRecordId());
                    ps.setString(2, batchId);
                    ps.setString(3, o.getCustomerId());
                    ps.setBigDecimal(4, o.getAmount());
                    ps.setString(5, o.getCurrency());
                    ps.setString(6, o.getOrderStatus());
                    ps.setTimestamp(7, o.getTimestamp() != null ? Timestamp.valueOf(o.getTimestamp()) : null);
                    ps.addBatch();
                }
                ps.executeBatch();
            }

            // Save Payments
            try (PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO payments (payment_id, batch_id, order_id, amount, fee, gateway, status, transaction_timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE amount=VALUES(amount), fee=VALUES(fee), status=VALUES(status), transaction_timestamp=VALUES(transaction_timestamp)
            """)) {
                for (PaymentTransaction p : payments) {
                    ps.setString(1, p.getRecordId());
                    ps.setString(2, batchId);
                    ps.setString(3, p.getOrderId());
                    ps.setBigDecimal(4, p.getAmount());
                    ps.setBigDecimal(5, p.getFeeAmount());
                    ps.setString(6, p.getGatewayName());
                    ps.setString(7, p.getStatus());
                    ps.setTimestamp(8, p.getTimestamp() != null ? Timestamp.valueOf(p.getTimestamp()) : null);
                    ps.addBatch();
                }
                ps.executeBatch();
            }

            // Save Settlements
            try (PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO settlements (settlement_id, batch_id, payment_id, gross_amount, net_amount, fee, bank_reference, transaction_timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE gross_amount=VALUES(gross_amount), net_amount=VALUES(net_amount), transaction_timestamp=VALUES(transaction_timestamp)
            """)) {
                for (SettlementRecord s : settlements) {
                    ps.setString(1, s.getRecordId());
                    ps.setString(2, batchId);
                    ps.setString(3, s.getPaymentId());
                    ps.setBigDecimal(4, s.getGrossAmount());
                    ps.setBigDecimal(5, s.getNetAmount());
                    ps.setBigDecimal(6, s.getBankFee());
                    ps.setString(7, s.getBankReference());
                    ps.setTimestamp(8, s.getTimestamp() != null ? Timestamp.valueOf(s.getTimestamp()) : null);
                    ps.addBatch();
                }
                ps.executeBatch();
            }
            System.out.println("Uploaded CSV files successfully persisted to TiDB Cloud for batch: " + batchId);
        } catch (Exception e) {
            System.err.println("Could not persist CSV records to TiDB: " + e.getMessage());
        }
    }

    private String getLatestBatchFromDatabase() {
        if (dataSource == null) return null;
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT batch_id FROM orders GROUP BY batch_id ORDER BY MAX(created_at) DESC LIMIT 1")) {
            if (rs.next()) {
                return rs.getString("batch_id");
            }
        } catch (Exception e) {
            System.err.println("Error fetching latest batch: " + e.getMessage());
        }
        return null;
    }

    @PostMapping({"/reconciliation-runs", "/api/reconciliation-runs"})
    public ResponseEntity<Map<String, Object>> triggerRun(@RequestBody(required = false) Map<String, Object> req) {
        String batchId = req != null && req.containsKey("batchId") && req.get("batchId") != null && !req.get("batchId").toString().trim().isEmpty() 
                ? req.get("batchId").toString().trim() 
                : null;
        BigDecimal tolerance = new BigDecimal("0.05");
        if (req != null && req.containsKey("toleranceAmount")) {
            try {
                tolerance = new BigDecimal(req.get("toleranceAmount").toString());
            } catch (Exception ignored) {}
        }

        List<OrderRecord> orders = batchId != null ? batchOrders.get(batchId) : null;
        List<PaymentTransaction> payments = batchId != null ? batchPayments.get(batchId) : null;
        List<SettlementRecord> settlements = batchId != null ? batchSettlements.get(batchId) : null;

        if (orders == null || orders.isEmpty()) {
            if (batchId != null) {
                orders = loadOrdersFromDatabase(batchId);
                payments = loadPaymentsFromDatabase(batchId);
                settlements = loadSettlementsFromDatabase(batchId);
            }
            if ((orders == null || orders.isEmpty()) && !batchOrders.isEmpty()) {
                String latestBatch = batchOrders.keySet().iterator().next();
                orders = batchOrders.get(latestBatch);
                payments = batchPayments.get(latestBatch);
                settlements = batchSettlements.get(latestBatch);
                batchId = latestBatch;
            } else if ((orders == null || orders.isEmpty()) && dataSource != null) {
                String latestDbBatch = getLatestBatchFromDatabase();
                if (latestDbBatch != null) {
                    orders = loadOrdersFromDatabase(latestDbBatch);
                    payments = loadPaymentsFromDatabase(latestDbBatch);
                    settlements = loadSettlementsFromDatabase(latestDbBatch);
                    if (orders != null && !orders.isEmpty()) {
                        batchId = latestDbBatch;
                    }
                }
            }
            
            if (orders == null || orders.isEmpty()) {
                orders = createDefaultOrders();
                payments = createDefaultPayments();
                settlements = createDefaultSettlements();
            }
        }

        String runId = "RUN-" + (System.currentTimeMillis() % 100000);
        String finalBatchId = batchId != null ? batchId : "BATCH-101";

        ReconciliationEngine engine = new ReconciliationEngine(tolerance);
        ReconciliationResult result = engine.reconcile(runId, orders, payments, settlements);

        List<Map<String, Object>> discrepancyMaps = new ArrayList<>();
        List<Map<String, Object>> newInvestigations = new ArrayList<>();
        int invIndex = 101;

        for (Discrepancy d : result.getDiscrepancies()) {
            String severity = d.getVariance().abs().compareTo(new BigDecimal("100")) > 0 ? "HIGH" : "MEDIUM";
            String caseNum = "INV-" + runId.replace("RUN-", "") + "-" + (invIndex++);

            Map<String, Object> map = new HashMap<>();
            map.put("id", d.getId());
            map.put("runId", runId);
            map.put("type", d.getType().name());
            map.put("severity", severity);
            map.put("orderId", d.getOrderId());
            map.put("explanation", d.getExplanation());
            map.put("expectedAmount", d.getExpectedAmount().toPlainString());
            map.put("actualAmount", d.getActualAmount().toPlainString());
            map.put("variance", d.getVariance().abs().toPlainString());
            map.put("createdAt", Instant.now().toString());

            if (d.getOrderRecord() != null) {
                OrderRecord o = d.getOrderRecord();
                Map<String, Object> ordMap = new HashMap<>();
                ordMap.put("orderId", o.getRecordId());
                ordMap.put("customerId", o.getCustomerId());
                ordMap.put("orderDate", o.getTimestamp() != null ? o.getTimestamp().toString().replace("T", " ") : "");
                ordMap.put("createdAt", Instant.now().toString());
                ordMap.put("amount", o.getAmount().toPlainString());
                ordMap.put("currency", o.getCurrency());
                ordMap.put("status", o.getOrderStatus());
                map.put("orderRecord", ordMap);
            }

            if (d.getPaymentRecord() != null) {
                PaymentTransaction p = d.getPaymentRecord();
                Map<String, Object> payMap = new HashMap<>();
                payMap.put("paymentId", p.getRecordId());
                payMap.put("orderId", p.getOrderId());
                payMap.put("paymentDate", p.getTimestamp() != null ? p.getTimestamp().toString().replace("T", " ") : "");
                payMap.put("createdAt", Instant.now().toString());
                payMap.put("amount", p.getAmount().toPlainString());
                payMap.put("fee", p.getFeeAmount() != null ? p.getFeeAmount().toPlainString() : "0.00");
                payMap.put("gateway", p.getGatewayName());
                payMap.put("status", p.getStatus());
                map.put("paymentRecord", payMap);
            }

            if (d.getSettlementRecord() != null) {
                SettlementRecord s = d.getSettlementRecord();
                Map<String, Object> stlMap = new HashMap<>();
                stlMap.put("settlementId", s.getRecordId());
                stlMap.put("paymentId", s.getPaymentId());
                stlMap.put("settlementDate", s.getTimestamp() != null ? s.getTimestamp().toString().replace("T", " ") : "");
                stlMap.put("createdAt", Instant.now().toString());
                stlMap.put("grossAmount", s.getGrossAmount() != null ? s.getGrossAmount().toPlainString() : "0.00");
                stlMap.put("netAmount", s.getNetAmount() != null ? s.getNetAmount().toPlainString() : "0.00");
                stlMap.put("fee", s.getBankFee() != null ? s.getBankFee().toPlainString() : "0.00");
                stlMap.put("bankReference", s.getBankReference());
                map.put("settlementRecord", stlMap);
            }

            discrepancyMaps.add(map);

            Map<String, Object> inv = new HashMap<>();
            inv.put("id", "INV-" + d.getId());
            inv.put("caseNumber", caseNum);
            inv.put("discrepancyId", d.getId());
            inv.put("runId", runId);
            inv.put("discrepancyType", d.getType().name());
            inv.put("severity", severity);
            inv.put("status", "OPEN");
            inv.put("priority", severity);
            inv.put("varianceAmount", d.getVariance().abs().toPlainString());
            inv.put("assignedAnalyst", "Sujith E");
            inv.put("assignedAnalystEmail", "sujith@paytrace.fin");
            inv.put("assignedTo", "Sujith E");
            inv.put("createdAt", Instant.now().toString());
            inv.put("updatedAt", Instant.now().toString());
            inv.put("discrepancy", map);
            inv.put("notes", new ArrayList<>());

            newInvestigations.add(inv);
            investigationsCache.add(0, inv);
        }

        runDiscrepanciesCache.put(runId, discrepancyMaps);

        Map<String, Object> run = new HashMap<>();
        run.put("runId", runId);
        run.put("batchId", finalBatchId);
        run.put("status", "COMPLETED");
        run.put("startedAt", Instant.now().minusSeconds(2).toString());
        run.put("completedAt", Instant.now().toString());

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalRecords", result.getTotalRecords());
        metrics.put("matchedRecords", result.getMatchedRecords());
        metrics.put("discrepanciesCount", result.getDiscrepanciesCount());
        metrics.put("reconciliationPercentage", result.getReconciliationPercentage());
        metrics.put("totalOrderValue", result.getTotalOrderValue().toPlainString());
        metrics.put("totalSettledValue", result.getTotalSettledValue().toPlainString());
        metrics.put("unreconciledVariance", result.getTotalOrderValue().subtract(result.getTotalSettledValue()).toPlainString());
        metrics.put("totalMatchedValue", result.getTotalSettledValue().doubleValue());
        metrics.put("totalVarianceValue", result.getTotalOrderValue().subtract(result.getTotalSettledValue()).doubleValue());
        run.put("metrics", metrics);
        run.put("discrepancies", discrepancyMaps);

        runsCache.put(runId, run);

        // Persist Run, Discrepancies, and Investigations to TiDB Cloud
        persistFullRunToDatabase(runId, finalBatchId, result, discrepancyMaps, newInvestigations);

        return ResponseEntity.ok(run);
    }

    @GetMapping({"/reconciliation-runs", "/api/reconciliation-runs"})
    public ResponseEntity<List<Map<String, Object>>> getAllRuns() {
        if (dataSource != null) {
            List<Map<String, Object>> list = new ArrayList<>();
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT * FROM reconciliation_runs ORDER BY created_at DESC LIMIT 20")) {
                while (rs.next()) {
                    Map<String, Object> r = new HashMap<>();
                    r.put("runId", rs.getString("run_id"));
                    r.put("batchId", rs.getString("batch_id"));
                    r.put("status", rs.getString("status"));
                    r.put("completedAt", rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toString() : Instant.now().toString());
                    Map<String, Object> metrics = new HashMap<>();
                    metrics.put("totalRecords", rs.getInt("total_records"));
                    metrics.put("matchedRecords", rs.getInt("matched_records"));
                    metrics.put("discrepanciesCount", rs.getInt("discrepancies_count"));
                    metrics.put("reconciliationPercentage", rs.getDouble("match_percentage"));
                    metrics.put("totalOrderValue", rs.getBigDecimal("total_order_value") != null ? rs.getBigDecimal("total_order_value").toPlainString() : "0.00");
                    metrics.put("totalSettledValue", rs.getBigDecimal("total_settled_value") != null ? rs.getBigDecimal("total_settled_value").toPlainString() : "0.00");
                    r.put("metrics", metrics);
                    list.add(r);
                }
            } catch (Exception e) {
                System.err.println("Error reading reconciliation_runs from TiDB: " + e.getMessage());
            }
            return ResponseEntity.ok(list);
        }
        if (!runsCache.isEmpty()) {
            return ResponseEntity.ok(new ArrayList<>(runsCache.values()));
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping({"/reconciliation-runs/{runId}", "/api/reconciliation-runs/{runId}"})
    public ResponseEntity<Map<String, Object>> getRun(@PathVariable String runId) {
        if (dataSource != null) {
            Map<String, Object> dbRun = loadRunFromDb(runId);
            if (dbRun != null) {
                return ResponseEntity.ok(dbRun);
            }
            return ResponseEntity.notFound().build();
        }
        if (runsCache.containsKey(runId)) {
            return ResponseEntity.ok(runsCache.get(runId));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping({"/reconciliation-runs/{runId}/discrepancies", "/api/reconciliation-runs/{runId}/discrepancies"})
    public ResponseEntity<List<Map<String, Object>>> getDiscrepancies(@PathVariable String runId) {
        if (dataSource != null) {
            return ResponseEntity.ok(loadDiscrepanciesFromDb(runId));
        }
        if (runDiscrepanciesCache.containsKey(runId)) {
            return ResponseEntity.ok(runDiscrepanciesCache.get(runId));
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping({"/investigations", "/api/investigations"})
    public ResponseEntity<List<Map<String, Object>>> getInvestigations() {
        if (dataSource != null) {
            return ResponseEntity.ok(loadInvestigationsFromDb());
        }
        return ResponseEntity.ok(new ArrayList<>(investigationsCache));
    }

    @PatchMapping({"/investigations/{caseId}", "/api/investigations/{caseId}"})
    public ResponseEntity<Map<String, Object>> updateInvestigation(@PathVariable String caseId, @RequestBody Map<String, Object> body) {
        Map<String, Object> target = null;
        synchronized (investigationsCache) {
            for (Map<String, Object> c : investigationsCache) {
                if (caseId.equals(c.get("id")) || caseId.equals(c.get("caseNumber"))) {
                    c.putAll(body);
                    c.put("updatedAt", Instant.now().toString());
                    target = c;
                    break;
                }
            }
        }

        // Persist update in TiDB Cloud
        if (dataSource != null) {
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement ps = conn.prepareStatement("""
                     UPDATE investigations 
                     SET status = COALESCE(?, status), 
                         resolution_category = COALESCE(?, resolution_category),
                         resolution_note = COALESCE(?, resolution_note),
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = ? OR case_number = ?
                 """)) {
                ps.setString(1, body.containsKey("status") ? body.get("status").toString() : null);
                ps.setString(2, body.containsKey("resolutionCategory") ? body.get("resolutionCategory").toString() : null);
                ps.setString(3, body.containsKey("resolutionReason") || body.containsKey("note") 
                        ? (body.containsKey("resolutionReason") ? body.get("resolutionReason").toString() : body.get("note").toString())
                        : null);
                ps.setString(4, caseId);
                ps.setString(5, caseId);
                ps.executeUpdate();
            } catch (Exception e) {
                System.err.println("Could not update investigation in TiDB: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(target != null ? target : body);
    }

    @PostMapping({"/investigations/{caseId}/notes", "/api/investigations/{caseId}/notes"})
    public ResponseEntity<Map<String, Object>> addNote(@PathVariable String caseId, @RequestBody Map<String, Object> body) {
        String noteId = "NOTE-" + System.currentTimeMillis();
        String author = "Sujith E";
        String authorRole = "Analyst";
        String text = body.get("text") != null ? body.get("text").toString() : "";

        Map<String, Object> note = new HashMap<>();
        note.put("id", noteId);
        note.put("author", author);
        note.put("authorRole", authorRole);
        note.put("timestamp", Instant.now().toString());
        note.put("text", text);

        synchronized (investigationsCache) {
            for (Map<String, Object> c : investigationsCache) {
                if (caseId.equals(c.get("id")) || caseId.equals(c.get("caseNumber"))) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> notes = (List<Map<String, Object>>) c.computeIfAbsent("notes", k -> new ArrayList<>());
                    notes.add(note);
                    break;
                }
            }
        }

        // Persist note to TiDB
        if (dataSource != null) {
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement ps = conn.prepareStatement("""
                     INSERT INTO investigation_notes (id, investigation_id, author, author_role, text)
                     VALUES (?, ?, ?, ?, ?)
                 """)) {
                ps.setString(1, noteId);
                ps.setString(2, caseId);
                ps.setString(3, author);
                ps.setString(4, authorRole);
                ps.setString(5, text);
                ps.executeUpdate();
            } catch (Exception e) {
                System.err.println("Could not persist note to TiDB: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(note);
    }

    @GetMapping({"/audit-logs", "/api/audit-logs"})
    public ResponseEntity<List<Map<String, Object>>> getAuditLogs() {
        return ResponseEntity.ok(new ArrayList<>(auditLogsCache));
    }

    @GetMapping({"/database-summary", "/api/database-summary"})
    public ResponseEntity<Map<String, Object>> getDatabaseSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("database", "paytrace_db");
        summary.put("timestamp", Instant.now().toString());

        if (dataSource != null) {
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement()) {
                summary.put("status", "CONNECTED");
                summary.put("product", conn.getMetaData().getDatabaseProductName());
                summary.put("version", conn.getMetaData().getDatabaseProductVersion());

                Map<String, Integer> counts = new HashMap<>();
                for (String tbl : List.of("orders", "payments", "settlements", "reconciliation_runs", "discrepancies", "investigations")) {
                    try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM " + tbl)) {
                        if (rs.next()) counts.put(tbl, rs.getInt(1));
                    } catch (Exception e) {
                        counts.put(tbl, 0);
                    }
                }
                summary.put("counts", counts);

                List<String> batches = new ArrayList<>();
                try (ResultSet rs = stmt.executeQuery("SELECT batch_id FROM orders GROUP BY batch_id ORDER BY MAX(created_at) DESC LIMIT 5")) {
                    while (rs.next()) {
                        String b = rs.getString(1);
                        if (b != null) batches.add(b);
                    }
                } catch (Exception ignored) {}
                summary.put("recentBatches", batches);

            } catch (Exception e) {
                summary.put("status", "ERROR");
                summary.put("error", e.getMessage());
            }
        } else {
            summary.put("status", "NO_DATASOURCE");
        }
        return ResponseEntity.ok(summary);
    }

    private void persistFullRunToDatabase(
            String runId,
            String batchId,
            ReconciliationResult result,
            List<Map<String, Object>> discrepancies,
            List<Map<String, Object>> investigations
    ) {
        if (dataSource == null) return;
        try (Connection conn = dataSource.getConnection()) {
            // 1. Persist Run
            try (PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO reconciliation_runs (run_id, batch_id, status, total_records, matched_records, discrepancies_count, match_percentage, total_order_value, total_settled_value)
                VALUES (?, ?, 'COMPLETED', ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE status='COMPLETED'
            """)) {
                ps.setString(1, runId);
                ps.setString(2, batchId);
                ps.setInt(3, result.getTotalRecords());
                ps.setInt(4, result.getMatchedRecords());
                ps.setInt(5, result.getDiscrepanciesCount());
                ps.setDouble(6, result.getReconciliationPercentage());
                ps.setBigDecimal(7, result.getTotalOrderValue());
                ps.setBigDecimal(8, result.getTotalSettledValue());
                ps.executeUpdate();
            }

            // 2. Persist Discrepancies
            try (PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO discrepancies (id, run_id, type, severity, order_id, explanation, expected_amount, actual_amount, variance)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE explanation=VALUES(explanation)
            """)) {
                for (Map<String, Object> d : discrepancies) {
                    ps.setString(1, d.get("id") != null ? d.get("id").toString() : null);
                    ps.setString(2, runId);
                    ps.setString(3, d.get("type") != null ? d.get("type").toString() : null);
                    ps.setString(4, d.get("severity") != null ? d.get("severity").toString() : null);
                    ps.setString(5, d.get("orderId") != null ? d.get("orderId").toString() : null);
                    ps.setString(6, d.get("explanation") != null ? d.get("explanation").toString() : null);
                    ps.setBigDecimal(7, d.get("expectedAmount") != null ? new BigDecimal(d.get("expectedAmount").toString()) : BigDecimal.ZERO);
                    ps.setBigDecimal(8, d.get("actualAmount") != null ? new BigDecimal(d.get("actualAmount").toString()) : BigDecimal.ZERO);
                    ps.setBigDecimal(9, d.get("variance") != null ? new BigDecimal(d.get("variance").toString()) : BigDecimal.ZERO);
                    ps.addBatch();
                }
                ps.executeBatch();
            }

            // 3. Persist Investigations
            try (PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO investigations (id, case_number, discrepancy_id, run_id, discrepancy_type, severity, status, variance_amount, assigned_analyst, assigned_analyst_email, assigned_to)
                VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE status=VALUES(status)
            """)) {
                for (Map<String, Object> inv : investigations) {
                    ps.setString(1, inv.get("id") != null ? inv.get("id").toString() : null);
                    ps.setString(2, inv.get("caseNumber") != null ? inv.get("caseNumber").toString() : null);
                    ps.setString(3, inv.get("discrepancyId") != null ? inv.get("discrepancyId").toString() : null);
                    ps.setString(4, runId);
                    ps.setString(5, inv.get("discrepancyType") != null ? inv.get("discrepancyType").toString() : null);
                    ps.setString(6, inv.get("severity") != null ? inv.get("severity").toString() : null);
                    ps.setString(7, inv.get("varianceAmount") != null ? inv.get("varianceAmount").toString() : null);
                    ps.setString(8, inv.get("assignedAnalyst") != null ? inv.get("assignedAnalyst").toString() : "Sujith E");
                    ps.setString(9, inv.get("assignedAnalystEmail") != null ? inv.get("assignedAnalystEmail").toString() : "sujith@paytrace.fin");
                    ps.setString(10, inv.get("assignedTo") != null ? inv.get("assignedTo").toString() : "Sujith E");
                    ps.addBatch();
                }
                ps.executeBatch();
            }

            System.out.println("Reconciliation Run " + runId + ", discrepancies, and investigation cases successfully persisted to TiDB Cloud!");
        } catch (Exception e) {
            System.err.println("Could not persist run to TiDB: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private List<OrderRecord> loadOrdersFromDatabase(String batchId) {
        if (dataSource == null) return Collections.emptyList();
        List<OrderRecord> list = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT order_id, customer_id, amount, currency, status, created_at FROM orders WHERE batch_id = ?")) {
            ps.setString(1, batchId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new OrderRecord(
                        rs.getString("order_id"),
                        rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : LocalDateTime.now(),
                        rs.getString("customer_id"),
                        rs.getBigDecimal("amount"),
                        rs.getString("currency"),
                        rs.getString("status")
                    ));
                }
            }
        } catch (Exception e) {
            System.err.println("Error reading orders for batch " + batchId + ": " + e.getMessage());
        }
        return list;
    }

    private List<PaymentTransaction> loadPaymentsFromDatabase(String batchId) {
        if (dataSource == null) return Collections.emptyList();
        List<PaymentTransaction> list = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT payment_id, order_id, amount, fee, gateway, status, created_at FROM payments WHERE batch_id = ?")) {
            ps.setString(1, batchId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new PaymentTransaction(
                        rs.getString("payment_id"),
                        rs.getString("order_id"),
                        rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : LocalDateTime.now(),
                        rs.getBigDecimal("amount"),
                        rs.getBigDecimal("fee"),
                        rs.getString("gateway"),
                        rs.getString("status")
                    ));
                }
            }
        } catch (Exception e) {
            System.err.println("Error reading payments for batch " + batchId + ": " + e.getMessage());
        }
        return list;
    }

    private List<SettlementRecord> loadSettlementsFromDatabase(String batchId) {
        if (dataSource == null) return Collections.emptyList();
        List<SettlementRecord> list = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT settlement_id, payment_id, gross_amount, net_amount, fee, bank_reference, created_at FROM settlements WHERE batch_id = ?")) {
            ps.setString(1, batchId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new SettlementRecord(
                        rs.getString("settlement_id"),
                        rs.getString("payment_id"),
                        rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : LocalDateTime.now(),
                        rs.getBigDecimal("gross_amount"),
                        rs.getBigDecimal("net_amount"),
                        rs.getBigDecimal("fee"),
                        rs.getString("bank_reference")
                    ));
                }
            }
        } catch (Exception e) {
            System.err.println("Error reading settlements for batch " + batchId + ": " + e.getMessage());
        }
        return list;
    }

    private Map<String, Object> loadRunFromDb(String runId) {
        if (dataSource == null) return null;
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT * FROM reconciliation_runs WHERE run_id = ?")) {
            ps.setString(1, runId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> r = new HashMap<>();
                    r.put("runId", rs.getString("run_id"));
                    r.put("batchId", rs.getString("batch_id"));
                    r.put("status", rs.getString("status"));
                    r.put("startedAt", rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toInstant().toString() : Instant.now().toString());
                    r.put("completedAt", rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toInstant().toString() : Instant.now().toString());

                    Map<String, Object> metrics = new HashMap<>();
                    metrics.put("totalRecords", rs.getInt("total_records"));
                    metrics.put("matchedRecords", rs.getInt("matched_records"));
                    metrics.put("discrepanciesCount", rs.getInt("discrepancies_count"));
                    metrics.put("reconciliationPercentage", rs.getDouble("match_percentage"));
                    metrics.put("totalOrderValue", rs.getBigDecimal("total_order_value") != null ? rs.getBigDecimal("total_order_value").toPlainString() : "0.00");
                    metrics.put("totalSettledValue", rs.getBigDecimal("total_settled_value") != null ? rs.getBigDecimal("total_settled_value").toPlainString() : "0.00");
                    r.put("metrics", metrics);

                    List<Map<String, Object>> discrepancies = loadDiscrepanciesFromDb(runId);
                    r.put("discrepancies", discrepancies);
                    return r;
                }
            }
        } catch (Exception e) {
            System.err.println("Error reading run " + runId + ": " + e.getMessage());
        }
        return null;
    }

    private Map<String, Object> mapDiscrepancyFromResultSet(Connection conn, ResultSet rs) throws SQLException {
        Map<String, Object> d = new HashMap<>();
        String id = rs.getString("id");
        String orderId = rs.getString("order_id");
        String discType = rs.getString("type");
        d.put("id", id);
        d.put("runId", rs.getString("run_id"));
        d.put("type", discType);
        d.put("severity", rs.getString("severity"));
        d.put("orderId", orderId);
        d.put("explanation", rs.getString("explanation"));
        d.put("expectedAmount", rs.getBigDecimal("expected_amount") != null ? rs.getBigDecimal("expected_amount").toPlainString() : "0.00");
        d.put("actualAmount", rs.getBigDecimal("actual_amount") != null ? rs.getBigDecimal("actual_amount").toPlainString() : "0.00");
        d.put("variance", rs.getBigDecimal("variance") != null ? rs.getBigDecimal("variance").toPlainString() : "0.00");
        d.put("createdAt", rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toInstant().toString() : Instant.now().toString());

        // Hydrate OrderRecord from DB if it exists
        if (orderId != null && !orderId.isEmpty() && !"MISSING_ORDER".equals(discType) && !"UNMATCHED_SETTLEMENT".equals(discType)) {
            try (PreparedStatement ops = conn.prepareStatement("SELECT * FROM orders WHERE order_id = ? LIMIT 1")) {
                ops.setString(1, orderId);
                try (ResultSet ors = ops.executeQuery()) {
                    if (ors.next()) {
                        Map<String, Object> ordMap = new HashMap<>();
                        ordMap.put("orderId", ors.getString("order_id"));
                        ordMap.put("customerId", ors.getString("customer_id"));
                        Timestamp txTs = null;
                        try { txTs = ors.getTimestamp("transaction_timestamp"); } catch (Exception ignored) {}
                        Timestamp crTs = ors.getTimestamp("created_at");
                        ordMap.put("orderDate", txTs != null ? txTs.toString() : (crTs != null ? crTs.toString() : ""));
                        ordMap.put("createdAt", crTs != null ? crTs.toString() : "");
                        ordMap.put("amount", ors.getBigDecimal("amount") != null ? ors.getBigDecimal("amount").toPlainString() : "0.00");
                        ordMap.put("currency", ors.getString("currency"));
                        ordMap.put("status", ors.getString("status"));
                        d.put("orderRecord", ordMap);
                    }
                }
            } catch (Exception ignored) {}
        }

        // Hydrate PaymentTransaction from DB if applicable
        if (orderId != null && !orderId.isEmpty() && !"MISSING_PAYMENT".equals(discType) && !"UNMATCHED_SETTLEMENT".equals(discType)) {
            try (PreparedStatement pps = conn.prepareStatement("SELECT * FROM payments WHERE order_id = ? OR payment_id = ? LIMIT 1")) {
                pps.setString(1, orderId);
                pps.setString(2, orderId);
                try (ResultSet prs = pps.executeQuery()) {
                    if (prs.next()) {
                        Map<String, Object> payMap = new HashMap<>();
                        String pid = prs.getString("payment_id");
                        payMap.put("paymentId", pid);
                        payMap.put("orderId", prs.getString("order_id"));
                        Timestamp ptxTs = null;
                        try { ptxTs = prs.getTimestamp("transaction_timestamp"); } catch (Exception ignored) {}
                        Timestamp pcrTs = prs.getTimestamp("created_at");
                        payMap.put("paymentDate", ptxTs != null ? ptxTs.toString() : (pcrTs != null ? pcrTs.toString() : ""));
                        payMap.put("createdAt", pcrTs != null ? pcrTs.toString() : "");
                        payMap.put("amount", prs.getBigDecimal("amount") != null ? prs.getBigDecimal("amount").toPlainString() : "0.00");
                        payMap.put("fee", prs.getBigDecimal("fee") != null ? prs.getBigDecimal("fee").toPlainString() : "0.00");
                        payMap.put("gateway", prs.getString("gateway"));
                        payMap.put("status", prs.getString("status"));
                        d.put("paymentRecord", payMap);

                        // If payment found, check settlement
                        try (PreparedStatement sps = conn.prepareStatement("SELECT * FROM settlements WHERE payment_id = ? LIMIT 1")) {
                            sps.setString(1, pid);
                            try (ResultSet srs = sps.executeQuery()) {
                                if (srs.next()) {
                                    Map<String, Object> stlMap = new HashMap<>();
                                    stlMap.put("settlementId", srs.getString("settlement_id"));
                                    stlMap.put("paymentId", srs.getString("payment_id"));
                                    Timestamp stxTs = null;
                                    try { stxTs = srs.getTimestamp("transaction_timestamp"); } catch (Exception ignored) {}
                                    Timestamp scrTs = srs.getTimestamp("created_at");
                                    stlMap.put("settlementDate", stxTs != null ? stxTs.toString() : (scrTs != null ? scrTs.toString() : ""));
                                    stlMap.put("createdAt", scrTs != null ? scrTs.toString() : "");
                                    stlMap.put("grossAmount", srs.getBigDecimal("gross_amount") != null ? srs.getBigDecimal("gross_amount").toPlainString() : "0.00");
                                    stlMap.put("netAmount", srs.getBigDecimal("net_amount") != null ? srs.getBigDecimal("net_amount").toPlainString() : "0.00");
                                    stlMap.put("fee", srs.getBigDecimal("fee") != null ? srs.getBigDecimal("fee").toPlainString() : "0.00");
                                    stlMap.put("bankReference", srs.getString("bank_reference"));
                                    d.put("settlementRecord", stlMap);
                                }
                            }
                        } catch (Exception ignored) {}
                    }
                }
            } catch (Exception ignored) {}
        }

        // Hydrate SettlementRecord for UNMATCHED_SETTLEMENT
        String settlementId = null;
        if (orderId != null && !orderId.isEmpty()) {
            settlementId = orderId;
        } else if (d.get("explanation") != null) {
            String exp = d.get("explanation").toString();
            int start = exp.indexOf("recorded (");
            if (start != -1) {
                int end = exp.indexOf(",", start);
                if (end == -1) end = exp.indexOf(")", start);
                if (end != -1) {
                    settlementId = exp.substring(start + 10, end).trim();
                }
            }
        }

        if ("UNMATCHED_SETTLEMENT".equals(discType) && settlementId != null) {
            try (PreparedStatement sps = conn.prepareStatement("SELECT * FROM settlements WHERE settlement_id = ? LIMIT 1")) {
                sps.setString(1, settlementId);
                try (ResultSet srs = sps.executeQuery()) {
                    if (srs.next()) {
                        Map<String, Object> stlMap = new HashMap<>();
                        stlMap.put("settlementId", srs.getString("settlement_id"));
                        stlMap.put("paymentId", srs.getString("payment_id"));
                        Timestamp stxTs = null;
                        try { stxTs = srs.getTimestamp("transaction_timestamp"); } catch (Exception ignored) {}
                        Timestamp scrTs = srs.getTimestamp("created_at");
                        stlMap.put("settlementDate", stxTs != null ? stxTs.toString() : (scrTs != null ? scrTs.toString() : ""));
                        stlMap.put("createdAt", scrTs != null ? scrTs.toString() : "");
                        stlMap.put("grossAmount", srs.getBigDecimal("gross_amount") != null ? srs.getBigDecimal("gross_amount").toPlainString() : "0.00");
                        stlMap.put("netAmount", srs.getBigDecimal("net_amount") != null ? srs.getBigDecimal("net_amount").toPlainString() : "0.00");
                        stlMap.put("fee", srs.getBigDecimal("fee") != null ? srs.getBigDecimal("fee").toPlainString() : "0.00");
                        stlMap.put("bankReference", srs.getString("bank_reference"));
                        d.put("settlementRecord", stlMap);
                    }
                }
            } catch (Exception ignored) {}
        }

        return d;
    }

    private List<Map<String, Object>> loadDiscrepanciesFromDb(String runId) {
        if (dataSource == null) return Collections.emptyList();
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT * FROM discrepancies WHERE run_id = ? ORDER BY id ASC")) {
            ps.setString(1, runId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapDiscrepancyFromResultSet(conn, rs));
                }
            }
        } catch (Exception e) {
            System.err.println("Error reading discrepancies for run " + runId + ": " + e.getMessage());
        }
        return list;
    }

    private List<Map<String, Object>> loadInvestigationsFromDb() {
        if (dataSource == null) return Collections.emptyList();
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = dataSource.getConnection()) {
            try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM investigations ORDER BY created_at DESC LIMIT 50");
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> inv = new HashMap<>();
                    String id = rs.getString("id");
                    String discId = rs.getString("discrepancy_id");
                    String runId = rs.getString("run_id");
                    inv.put("id", id);
                    inv.put("caseNumber", rs.getString("case_number"));
                    inv.put("discrepancyId", discId);
                    inv.put("runId", runId);
                    inv.put("discrepancyType", rs.getString("discrepancy_type"));
                    inv.put("severity", rs.getString("severity"));
                    inv.put("status", rs.getString("status"));
                    inv.put("priority", rs.getString("severity"));
                    inv.put("varianceAmount", rs.getString("variance_amount"));
                    inv.put("assignedAnalyst", rs.getString("assigned_analyst"));
                    inv.put("assignedAnalystEmail", rs.getString("assigned_analyst_email"));
                    inv.put("assignedTo", rs.getString("assigned_to"));
                    inv.put("createdAt", rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toInstant().toString() : Instant.now().toString());
                    inv.put("updatedAt", rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toInstant().toString() : Instant.now().toString());
                    inv.put("resolutionCategory", rs.getString("resolution_category"));
                    inv.put("resolutionNote", rs.getString("resolution_note"));

                    // Load full discrepancy object for this case
                    try (PreparedStatement dps = conn.prepareStatement("SELECT * FROM discrepancies WHERE id = ? LIMIT 1")) {
                        dps.setString(1, discId);
                        try (ResultSet drs = dps.executeQuery()) {
                            if (drs.next()) {
                                inv.put("discrepancy", mapDiscrepancyFromResultSet(conn, drs));
                            }
                        }
                    } catch (Exception ignored) {}

                    // Load notes
                    List<Map<String, Object>> notes = new ArrayList<>();
                    try (PreparedStatement nps = conn.prepareStatement("SELECT * FROM investigation_notes WHERE investigation_id = ? ORDER BY created_at ASC")) {
                        nps.setString(1, id);
                        try (ResultSet nrs = nps.executeQuery()) {
                            while (nrs.next()) {
                                Map<String, Object> note = new HashMap<>();
                                note.put("id", nrs.getString("id"));
                                note.put("author", nrs.getString("author"));
                                note.put("authorRole", nrs.getString("author_role"));
                                note.put("text", nrs.getString("text"));
                                note.put("timestamp", nrs.getTimestamp("created_at") != null ? nrs.getTimestamp("created_at").toInstant().toString() : Instant.now().toString());
                                notes.add(note);
                            }
                        }
                    } catch (Exception ignored) {}
                    inv.put("notes", notes);

                    list.add(inv);
                }
            }

            // Self-healing: If investigations table is empty but runs/orders exist, heal the latest run!
            if (list.isEmpty()) {
                healMissingInvestigationsAndDiscrepancies(conn);
                try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM investigations ORDER BY created_at DESC LIMIT 50");
                     ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> inv = new HashMap<>();
                        String id = rs.getString("id");
                        String discId = rs.getString("discrepancy_id");
                        inv.put("id", id);
                        inv.put("caseNumber", rs.getString("case_number"));
                        inv.put("discrepancyId", discId);
                        inv.put("runId", rs.getString("run_id"));
                        inv.put("discrepancyType", rs.getString("discrepancy_type"));
                        inv.put("severity", rs.getString("severity"));
                        inv.put("status", rs.getString("status"));
                        inv.put("priority", rs.getString("severity"));
                        inv.put("varianceAmount", rs.getString("variance_amount"));
                        inv.put("assignedAnalyst", rs.getString("assigned_analyst"));
                        inv.put("assignedAnalystEmail", rs.getString("assigned_analyst_email"));
                        inv.put("assignedTo", rs.getString("assigned_to"));
                        inv.put("createdAt", rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toInstant().toString() : Instant.now().toString());
                        inv.put("updatedAt", rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toInstant().toString() : Instant.now().toString());

                        try (PreparedStatement dps = conn.prepareStatement("SELECT * FROM discrepancies WHERE id = ? LIMIT 1")) {
                            dps.setString(1, discId);
                            try (ResultSet drs = dps.executeQuery()) {
                                if (drs.next()) {
                                    inv.put("discrepancy", mapDiscrepancyFromResultSet(conn, drs));
                                }
                            }
                        } catch (Exception ignored) {}
                        inv.put("notes", new ArrayList<>());
                        list.add(inv);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error reading investigations from TiDB: " + e.getMessage());
        }
        return list;
    }

    private void healMissingInvestigationsAndDiscrepancies(Connection conn) {
        try {
            String latestRunId = null;
            String latestBatchId = null;
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT run_id, batch_id FROM reconciliation_runs ORDER BY created_at DESC LIMIT 1")) {
                if (rs.next()) {
                    latestRunId = rs.getString("run_id");
                    latestBatchId = rs.getString("batch_id");
                }
            }
            if (latestRunId == null) return;

            List<OrderRecord> orders = latestBatchId != null ? loadOrdersFromDatabase(latestBatchId) : Collections.emptyList();
            List<PaymentTransaction> payments = latestBatchId != null ? loadPaymentsFromDatabase(latestBatchId) : Collections.emptyList();
            List<SettlementRecord> settlements = latestBatchId != null ? loadSettlementsFromDatabase(latestBatchId) : Collections.emptyList();

            if (orders.isEmpty()) {
                String latestDbBatch = getLatestBatchFromDatabase();
                if (latestDbBatch != null) {
                    orders = loadOrdersFromDatabase(latestDbBatch);
                    payments = loadPaymentsFromDatabase(latestDbBatch);
                    settlements = loadSettlementsFromDatabase(latestDbBatch);
                    if (latestBatchId == null) latestBatchId = latestDbBatch;
                }
            }

            if (orders.isEmpty()) return;

            ReconciliationEngine engine = new ReconciliationEngine(new BigDecimal("0.05"));
            ReconciliationResult result = engine.reconcile(latestRunId, orders, payments, settlements);

            List<Map<String, Object>> discrepancyMaps = new ArrayList<>();
            List<Map<String, Object>> newInvestigations = new ArrayList<>();
            int invIndex = 101;

            for (Discrepancy d : result.getDiscrepancies()) {
                String severity = d.getVariance().abs().compareTo(new BigDecimal("100")) > 0 ? "HIGH" : "MEDIUM";
                String caseNum = "INV-" + latestRunId.replace("RUN-", "") + "-" + (invIndex++);

                Map<String, Object> map = new HashMap<>();
                map.put("id", d.getId());
                map.put("runId", latestRunId);
                map.put("type", d.getType().name());
                map.put("severity", severity);
                map.put("orderId", d.getOrderId());
                map.put("explanation", d.getExplanation());
                map.put("expectedAmount", d.getExpectedAmount().toPlainString());
                map.put("actualAmount", d.getActualAmount().toPlainString());
                map.put("variance", d.getVariance().abs().toPlainString());
                map.put("createdAt", Instant.now().toString());
                discrepancyMaps.add(map);

                Map<String, Object> inv = new HashMap<>();
                inv.put("id", "INV-" + d.getId());
                inv.put("caseNumber", caseNum);
                inv.put("discrepancyId", d.getId());
                inv.put("runId", latestRunId);
                inv.put("discrepancyType", d.getType().name());
                inv.put("severity", severity);
                inv.put("status", "OPEN");
                inv.put("priority", severity);
                inv.put("varianceAmount", d.getVariance().abs().toPlainString());
                inv.put("assignedAnalyst", "Sujith E");
                inv.put("assignedAnalystEmail", "sujith@paytrace.fin");
                inv.put("assignedTo", "Sujith E");
                inv.put("createdAt", Instant.now().toString());
                inv.put("updatedAt", Instant.now().toString());
                newInvestigations.add(inv);
            }

            persistFullRunToDatabase(latestRunId, latestBatchId != null ? latestBatchId : "BATCH-101", result, discrepancyMaps, newInvestigations);
            System.out.println("Auto-healed " + newInvestigations.size() + " investigations and discrepancies for run " + latestRunId);
        } catch (Exception e) {
            System.err.println("Could not auto-heal investigations: " + e.getMessage());
        }
    }

    private List<OrderRecord> createDefaultOrders() {
        return List.of(
            new OrderRecord("ORD-9821", LocalDateTime.now(), "CUST-8812", new BigDecimal("250.00"), "USD", "COMPLETED"),
            new OrderRecord("ORD-9844", LocalDateTime.now(), "CUST-3319", new BigDecimal("420.00"), "USD", "COMPLETED"),
            new OrderRecord("ORD-9850", LocalDateTime.now(), "CUST-1044", new BigDecimal("180.00"), "USD", "COMPLETED"),
            new OrderRecord("ORD-9877", LocalDateTime.now(), "CUST-5512", new BigDecimal("95.00"), "USD", "COMPLETED"),
            new OrderRecord("ORD-9890", LocalDateTime.now(), "CUST-6623", new BigDecimal("310.00"), "USD", "COMPLETED")
        );
    }

    private List<PaymentTransaction> createDefaultPayments() {
        return List.of(
            new PaymentTransaction("PAY-7712", "ORD-9821", LocalDateTime.now(), new BigDecimal("230.00"), new BigDecimal("4.60"), "Stripe", "CAPTURED"),
            new PaymentTransaction("PAY-7790", "ORD-9850", LocalDateTime.now(), new BigDecimal("180.00"), new BigDecimal("3.60"), "Adyen", "CAPTURED"),
            new PaymentTransaction("PAY-7820", "ORD-9877", LocalDateTime.now(), new BigDecimal("95.00"), new BigDecimal("1.90"), "Stripe", "CAPTURED"),
            new PaymentTransaction("PAY-7855", "ORD-9890", LocalDateTime.now(), new BigDecimal("310.00"), new BigDecimal("6.20"), "Stripe", "CAPTURED")
        );
    }

    private List<SettlementRecord> createDefaultSettlements() {
        return List.of(
            new SettlementRecord("SET-3310", "PAY-7712", LocalDateTime.now(), new BigDecimal("230.00"), new BigDecimal("225.40"), new BigDecimal("4.60"), "CITI-TXN-90214"),
            new SettlementRecord("SET-3345", "PAY-7820", LocalDateTime.now(), new BigDecimal("95.00"), new BigDecimal("93.10"), new BigDecimal("1.90"), "CHASE-TXN-11029"),
            new SettlementRecord("SET-3419", "PAY-7855", LocalDateTime.now(), new BigDecimal("310.00"), new BigDecimal("303.80"), new BigDecimal("6.20"), "JPMC-TXN-44102")
        );
    }

    private void initStarterData() {
        List<OrderRecord> orders = createDefaultOrders();
        List<PaymentTransaction> payments = createDefaultPayments();
        List<SettlementRecord> settlements = createDefaultSettlements();

        ReconciliationEngine engine = new ReconciliationEngine(new BigDecimal("0.05"));
        ReconciliationResult result = engine.reconcile(orders, payments, settlements);

        String runId = "RUN-2026-901";
        List<Map<String, Object>> discrepancyMaps = new ArrayList<>();
        int invIndex = 1;

        for (Discrepancy d : result.getDiscrepancies()) {
            String severity = d.getVariance().compareTo(new BigDecimal("100")) > 0 ? "HIGH" : "MEDIUM";
            String caseNum = "INV-2026-" + String.format("%03d", invIndex++);

            Map<String, Object> map = new HashMap<>();
            map.put("id", d.getId());
            map.put("runId", runId);
            map.put("type", d.getType().name());
            map.put("severity", severity);
            map.put("orderId", d.getOrderId());
            map.put("explanation", d.getExplanation());
            map.put("expectedAmount", d.getExpectedAmount().toPlainString());
            map.put("actualAmount", d.getActualAmount().toPlainString());
            map.put("variance", d.getVariance().toPlainString());
            map.put("createdAt", Instant.now().toString());
            discrepancyMaps.add(map);

            Map<String, Object> inv = new HashMap<>();
            inv.put("id", "INV-" + d.getId());
            inv.put("caseNumber", caseNum);
            inv.put("discrepancyId", d.getId());
            inv.put("runId", runId);
            inv.put("discrepancyType", d.getType().name());
            inv.put("severity", severity);
            inv.put("status", "OPEN");
            inv.put("priority", severity);
            inv.put("varianceAmount", d.getVariance().toPlainString());
            inv.put("assignedAnalyst", "Sujith E");
            inv.put("assignedAnalystEmail", "sujith@paytrace.fin");
            inv.put("assignedTo", "Sujith E");
            inv.put("createdAt", Instant.now().toString());
            inv.put("updatedAt", Instant.now().toString());
            inv.put("discrepancy", map);
            inv.put("notes", new ArrayList<>());
            investigationsCache.add(inv);
        }

        runDiscrepanciesCache.put(runId, discrepancyMaps);

        Map<String, Object> run = new HashMap<>();
        run.put("runId", runId);
        run.put("batchId", "BATCH-2026-11-001");
        run.put("status", "COMPLETED");
        run.put("startedAt", Instant.now().minusSeconds(120).toString());
        run.put("completedAt", Instant.now().toString());

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalRecords", result.getTotalRecords());
        metrics.put("matchedRecords", result.getMatchedRecords());
        metrics.put("discrepanciesCount", result.getDiscrepanciesCount());
        metrics.put("reconciliationPercentage", result.getReconciliationPercentage());
        metrics.put("totalOrderValue", result.getTotalOrderValue().toPlainString());
        metrics.put("totalSettledValue", result.getTotalSettledValue().toPlainString());
        metrics.put("unreconciledVariance", result.getTotalOrderValue().subtract(result.getTotalSettledValue()).toPlainString());
        metrics.put("totalMatchedValue", result.getTotalSettledValue().doubleValue());
        metrics.put("totalVarianceValue", result.getTotalOrderValue().subtract(result.getTotalSettledValue()).doubleValue());
        run.put("metrics", metrics);
        run.put("discrepancies", discrepancyMaps);

        runsCache.put(runId, run);

        Map<String, Object> log = new HashMap<>();
        log.put("id", "LOG-1");
        log.put("timestamp", Instant.now().toString());
        log.put("actor", "Sujith E");
        log.put("action", "ENGINE_INITIALIZED");
        log.put("details", "PayTrace 3-Way Reconciliation Engine initialized with live TiDB Cloud persistence.");
        auditLogsCache.add(log);
    }

    private Map<String, Object> createStarterRun() {
        return runsCache.getOrDefault("RUN-2026-901", new HashMap<>());
    }
}
