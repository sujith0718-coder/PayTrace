package com.paytrace.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Health and diagnostics controller for Render deployment monitoring.
 * Provides public status probes without requiring authentication.
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @Autowired(required = false)
    private DataSource dataSource;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "paytrace-backend");
        response.put("version", "1.0.0");
        response.put("environment", "production");
        response.put("timestamp", Instant.now().toString());

        // Probe database connectivity safely
        Map<String, Object> dbInfo = new HashMap<>();
        if (dataSource != null) {
            try (Connection conn = dataSource.getConnection()) {
                dbInfo.put("status", "CONNECTED");
                dbInfo.put("databaseProduct", conn.getMetaData().getDatabaseProductName());
                dbInfo.put("databaseVersion", conn.getMetaData().getDatabaseProductVersion());
            } catch (Exception e) {
                dbInfo.put("status", "DISCONNECTED");
                dbInfo.put("error", e.getMessage());
                response.put("status", "DEGRADED");
            }
        } else {
            dbInfo.put("status", "NO_DATASOURCE_CONFIGURED");
        }
        response.put("database", dbInfo);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> rootInfo() {
        Map<String, String> info = new HashMap<>();
        info.put("service", "PayTrace Reconciliation Engine");
        info.put("status", "RUNNING");
        info.put("healthCheck", "/api/health");
        info.put("documentation", "https://github.com/sujith0718-coder/PayTrace");
        return ResponseEntity.ok(info);
    }
}

