package com.paytrace.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ReconciliationController {

    // Ingestion Upload Endpoint
    @PostMapping("/imports/upload")
    public ResponseEntity<Map<String, Object>> uploadFiles(
            @RequestParam(value = "ordersFile", required = false) MultipartFile ordersFile,
            @RequestParam(value = "paymentsFile", required = false) MultipartFile paymentsFile,
            @RequestParam(value = "settlementsFile", required = false) MultipartFile settlementsFile
    ) {
        String batchId = "BATCH-" + System.currentTimeMillis() % 100000;
        Map<String, Object> batch = new HashMap<>();
        batch.put("batchId", batchId);
        batch.put("uploadedAt", Instant.now().toString());
        batch.put("ordersFilename", ordersFile != null ? ordersFile.getOriginalFilename() : "orders.csv");
        batch.put("paymentsFilename", paymentsFile != null ? paymentsFile.getOriginalFilename() : "payments.csv");
        batch.put("settlementsFilename", settlementsFile != null ? settlementsFile.getOriginalFilename() : "settlements.csv");
        batch.put("ordersCount", 1250);
        batch.put("paymentsCount", 1240);
        batch.put("settlementsCount", 1220);
        batch.put("invalidRowsCount", 2);
        batch.put("warnings", List.of("Row 48 in orders.csv: Currency defaulted to USD", "Row 112 in payments.csv: Minor fee rounding applied"));
        return ResponseEntity.ok(batch);
    }

    // Trigger or get reconciliation run
    @PostMapping("/reconciliation-runs")
    public ResponseEntity<Map<String, Object>> triggerRun(@RequestBody(required = false) Map<String, Object> req) {
        String batchId = req != null && req.containsKey("batchId") ? req.get("batchId").toString() : "BATCH-101";
        Map<String, Object> run = createRunData("RUN-" + (System.currentTimeMillis() % 10000), batchId);
        return ResponseEntity.ok(run);
    }

    @GetMapping("/reconciliation-runs/{runId}")
    public ResponseEntity<Map<String, Object>> getRun(@PathVariable String runId) {
        return ResponseEntity.ok(createRunData(runId, "BATCH-101"));
    }

    @GetMapping("/reconciliation-runs/{runId}/discrepancies")
    public ResponseEntity<List<Map<String, Object>>> getDiscrepancies(@PathVariable String runId) {
        List<Map<String, Object>> list = new ArrayList<>();
        
        Map<String, Object> d1 = new HashMap<>();
        d1.put("id", "DISC-901");
        d1.put("runId", runId);
        d1.put("type", "AMOUNT_MISMATCH");
        d1.put("severity", "HIGH");
        d1.put("orderId", "ORD-88210");
        d1.put("explanation", "Order amount ($250.00) differs from Gateway captured amount ($230.00)");
        d1.put("expectedAmount", "250.00");
        d1.put("actualAmount", "230.00");
        d1.put("variance", "20.00");
        d1.put("createdAt", Instant.now().toString());
        list.add(d1);

        Map<String, Object> d2 = new HashMap<>();
        d2.put("id", "DISC-902");
        d2.put("runId", runId);
        d2.put("type", "MISSING_PAYMENT");
        d2.put("severity", "MEDIUM");
        d2.put("orderId", "ORD-88215");
        d2.put("explanation", "Completed order with no corresponding gateway transaction record");
        d2.put("expectedAmount", "75.50");
        d2.put("actualAmount", "0.00");
        d2.put("variance", "75.50");
        d2.put("createdAt", Instant.now().toString());
        list.add(d2);

        return ResponseEntity.ok(list);
    }

    // Investigations
    @GetMapping("/investigations")
    public ResponseEntity<List<Map<String, Object>>> getInvestigations() {
        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Object> c1 = new HashMap<>();
        c1.put("id", "INV-2026-001");
        c1.put("discrepancyId", "DISC-901");
        c1.put("status", "OPEN");
        c1.put("priority", "HIGH");
        c1.put("orderId", "ORD-88210");
        c1.put("varianceAmount", "20.00");
        c1.put("assignedTo", "Sujith E");
        c1.put("createdAt", Instant.now().toString());
        c1.put("notes", List.of());
        list.add(c1);
        return ResponseEntity.ok(list);
    }

    @PatchMapping("/investigations/{caseId}")
    public ResponseEntity<Map<String, Object>> updateInvestigation(@PathVariable String caseId, @RequestBody Map<String, Object> body) {
        Map<String, Object> c = new HashMap<>(body);
        c.put("id", caseId);
        c.put("updatedAt", Instant.now().toString());
        return ResponseEntity.ok(c);
    }

    @PostMapping("/investigations/{caseId}/notes")
    public ResponseEntity<Map<String, Object>> addNote(@PathVariable String caseId, @RequestBody Map<String, Object> body) {
        Map<String, Object> res = new HashMap<>();
        res.put("id", caseId);
        res.put("text", body.get("text"));
        res.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(res);
    }

    // Audit logs
    @GetMapping("/audit-logs")
    public ResponseEntity<List<Map<String, Object>>> getAuditLogs() {
        List<Map<String, Object>> logs = new ArrayList<>();
        Map<String, Object> log = new HashMap<>();
        log.put("id", "LOG-1");
        log.put("timestamp", Instant.now().toString());
        log.put("actor", "Sujith E");
        log.put("action", "SYSTEM_DEPLOYED");
        log.put("details", "PayTrace production reconciliation engine running on Render with TiDB Cloud");
        logs.add(log);
        return ResponseEntity.ok(logs);
    }

    private Map<String, Object> createRunData(String runId, String batchId) {
        Map<String, Object> run = new HashMap<>();
        run.put("runId", runId);
        run.put("batchId", batchId);
        run.put("status", "COMPLETED");
        run.put("startedAt", Instant.now().minusSeconds(10).toString());
        run.put("completedAt", Instant.now().toString());

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalRecords", 1250);
        metrics.put("matchedRecords", 1238);
        metrics.put("discrepanciesCount", 12);
        metrics.put("reconciliationPercentage", 99.04);
        metrics.put("totalMatchedValue", 148500.00);
        metrics.put("totalVarianceValue", 450.25);
        run.put("metrics", metrics);

        return run;
    }
}
