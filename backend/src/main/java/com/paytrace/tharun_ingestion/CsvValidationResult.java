package com.paytrace.tharun_ingestion;

import java.util.ArrayList;
import java.util.List;

/**
 * DEVELOPER: Tharun J
 * OBJECTIVE: Generic container wrapping valid parsed domain models and non-fatal warnings.
 */
public class CsvValidationResult<T> {

    // TODO [THARUN]: Declare lists and counters
    private List<T> validRecords = new ArrayList<>();
    private List<String> warnings = new ArrayList<>();
    private int invalidRowsCount = 0;

    public void addRecord(T record) {
        // TODO [THARUN]: Add valid record to list
        validRecords.add(record);
    }

    public void addWarning(String warning) {
        // TODO [THARUN]: Add warning message to list and increment invalidRowsCount
        warnings.add(warning);
        invalidRowsCount++;
    }

    public List<T> getValidRecords() {
        return validRecords;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public int getInvalidRowsCount() {
        return invalidRowsCount;
    }

    public int getTotalRowsParsed() {
        return validRecords.size() + invalidRowsCount;
    }
}
