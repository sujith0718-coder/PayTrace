package com.paytrace.dto;

import java.math.BigDecimal;

public record ReconciliationRequest(
    String batchId,
    BigDecimal toleranceAmount
) {}

