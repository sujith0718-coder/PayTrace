package com.paytrace.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ReconciliationResponse(
    String runId,
    String batchId,
    String status,
    Instant startedAt,
    Instant completedAt,
    MetricsDTO metrics,
    List<DiscrepancyDTO> discrepancies
) {
    public record MetricsDTO(
        int totalRecords,
        int matchedRecords,
        int discrepanciesCount,
        BigDecimal reconciliationPercentage,
        BigDecimal totalOrderValue,
        BigDecimal totalSettledValue,
        BigDecimal unreconciledVariance
    ) {}
}

