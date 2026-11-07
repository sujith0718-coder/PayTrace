package com.paytrace.sujith_engine;

import com.paytrace.thurika_models.Discrepancy;
import java.math.BigDecimal;
import java.util.List;

/**
 * DEVELOPER: Sujith E
 * OBJECTIVE: Holds the outcome, statistical metrics, and discrepancy list of a reconciliation run.
 */
public class ReconciliationResult {

    // TODO [SUJITH]: Declare fields
    // - private int totalRecords;
    // - private int matchedRecords;
    // - private int discrepanciesCount;
    // - private BigDecimal totalOrderValue;
    // - private BigDecimal totalSettledValue;
    // - private List<Discrepancy> discrepancies;
    private int totalRecords;
    private int matchedRecords;
    private int discrepanciesCount;
    private BigDecimal totalOrderValue;
    private BigDecimal totalSettledValue;
    private List<Discrepancy> discrepancies;

    public ReconciliationResult(int totalRecords, int matchedRecords, List<Discrepancy> discrepancies, BigDecimal totalOrderValue, BigDecimal totalSettledValue) {
        // TODO [SUJITH]: Assign constructor parameters
        this.totalRecords = totalRecords;
        this.matchedRecords = matchedRecords;
        this.discrepancies = discrepancies;
        this.discrepanciesCount = discrepancies != null ? discrepancies.size() : 0;
        this.totalOrderValue = totalOrderValue != null ? totalOrderValue : BigDecimal.ZERO;
        this.totalSettledValue = totalSettledValue != null ? totalSettledValue : BigDecimal.ZERO;
    }

    // TODO [SUJITH]: Implement metric calculations
    public int getTotalRecords() {
        return totalRecords;
    }

    public int getMatchedRecords() {
        return matchedRecords;
    }

    public int getDiscrepanciesCount() {
        return discrepanciesCount;
    }

    /**
     * Calculates percentage of successfully balanced transactions (0.0 to 100.0)
     */
    public double getReconciliationPercentage() {
        // TODO [SUJITH]: Calculate: (matchedRecords / totalRecords) * 100.0 (handle divide by zero)
        if (totalRecords == 0) return 100.0;
        return ((double) matchedRecords / totalRecords) * 100.0;
    }

    public List<Discrepancy> getDiscrepancies() {
        return discrepancies;
    }

    public BigDecimal getTotalOrderValue() {
        return totalOrderValue;
    }

    public BigDecimal getTotalSettledValue() {
        return totalSettledValue;
    }
}
