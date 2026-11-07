package com.paytrace.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record DiscrepancyDTO(
    String id,
    String runId,
    String type,
    String severity,
    String orderId,
    String explanation,
    BigDecimal expectedAmount,
    BigDecimal actualAmount,
    BigDecimal variance,
    String investigationId,
    Instant createdAt
) {}

