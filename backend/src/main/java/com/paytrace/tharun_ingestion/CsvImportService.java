package com.paytrace.tharun_ingestion;

import com.opencsv.CSVReader;
import com.paytrace.thurika_models.*;
import java.io.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DEVELOPER: Tharun J
 * OBJECTIVE: Reads CSV streams using OpenCSV, converts columns into domain models, and isolates bad rows.
 */
public class CsvImportService {

    /**
     * Parses Orders CSV: order_id,order_date,customer_id,order_amount,currency,order_status
     */
    public CsvValidationResult<OrderRecord> parseOrders(InputStream inputStream) {
        CsvValidationResult<OrderRecord> result = new CsvValidationResult<>();

        // TODO [THARUN]: Open CSVReader inside try-with-resources
        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream))) {
            String[] line;
            int lineNumber = 0;

            while ((line = reader.readNext()) != null) {
                lineNumber++;
                if (lineNumber == 1) continue; // Skip header row

                // Check minimum column count
                if (line.length < 4) {
                    result.addWarning("Line " + lineNumber + ": Insufficient columns");
                    continue;
                }

                // TODO [THARUN]: Parse fields inside inner try-catch so one bad row doesn't break the file
                try {
                    String orderId = line[0].trim();
                    String customerId = line[2].trim();
                    BigDecimal amount = new BigDecimal(line[3].trim());
                    String currency = line.length > 4 ? line[4].trim() : "USD";
                    String status = line.length > 5 ? line[5].trim() : "COMPLETED";

                    if (orderId.isEmpty()) {
                        result.addWarning("Line " + lineNumber + ": Missing order_id");
                        continue;
                    }

                    // Create Thurika's OrderRecord and add to result
                    OrderRecord order = new OrderRecord(orderId, LocalDateTime.now(), customerId, amount, currency, status);
                    result.addRecord(order);

                } catch (NumberFormatException e) {
                    result.addWarning("Line " + lineNumber + ": Invalid numeric amount '" + line[3] + "'");
                } catch (Exception e) {
                    result.addWarning("Line " + lineNumber + ": Failed to parse row - " + e.getMessage());
                }
            }
        } catch (Exception e) {
            result.addWarning("Fatal CSV stream error: " + e.getMessage());
        }

        return result;
    }

    /**
     * Parses Payments CSV: payment_id,order_id,payment_date,payment_amount,fee_amount,payment_status,payment_method
     */
    public CsvValidationResult<PaymentTransaction> parsePayments(InputStream inputStream) {
        CsvValidationResult<PaymentTransaction> result = new CsvValidationResult<>();

        // TODO [THARUN]: Read payment records line-by-line
        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream))) {
            String[] line;
            int lineNumber = 0;

            while ((line = reader.readNext()) != null) {
                lineNumber++;
                if (lineNumber == 1) continue; // Skip header

                try {
                    String paymentId = line[0].trim();
                    String orderId = line[1].trim();
                    BigDecimal amount = new BigDecimal(line[3].trim());
                    BigDecimal fee = line.length > 4 ? new BigDecimal(line[4].trim()) : BigDecimal.ZERO;
                    String status = line.length > 5 ? line[5].trim() : "CAPTURED";
                    String gateway = line.length > 6 ? line[6].trim() : "Stripe";

                    PaymentTransaction payment = new PaymentTransaction(paymentId, orderId, LocalDateTime.now(), amount, fee, gateway, status);
                    result.addRecord(payment);

                } catch (Exception e) {
                    result.addWarning("Line " + lineNumber + ": Corrupted payment row");
                }
            }
        } catch (Exception e) {
            result.addWarning("Fatal CSV stream error: " + e.getMessage());
        }

        return result;
    }

    /**
     * Parses Settlements CSV: settlement_id,payment_id,settlement_date,gross_amount,net_amount,settlement_fee,bank_reference
     */
    public CsvValidationResult<SettlementRecord> parseSettlements(InputStream inputStream) {
        CsvValidationResult<SettlementRecord> result = new CsvValidationResult<>();

        // TODO [THARUN]: Read settlement records line-by-line
        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream))) {
            String[] line;
            int lineNumber = 0;

            while ((line = reader.readNext()) != null) {
                lineNumber++;
                if (lineNumber == 1) continue; // Skip header

                try {
                    String settlementId = line[0].trim();
                    String paymentId = line[1].trim();
                    BigDecimal gross = new BigDecimal(line[3].trim());
                    BigDecimal net = new BigDecimal(line[4].trim());
                    BigDecimal fee = line.length > 5 ? new BigDecimal(line[5].trim()) : BigDecimal.ZERO;
                    String ref = line.length > 6 ? line[6].trim() : "BANK-REF";

                    SettlementRecord settlement = new SettlementRecord(settlementId, paymentId, LocalDateTime.now(), gross, net, fee, ref);
                    result.addRecord(settlement);

                } catch (Exception e) {
                    result.addWarning("Line " + lineNumber + ": Corrupted settlement row");
                }
            }
        } catch (Exception e) {
            result.addWarning("Fatal CSV stream error: " + e.getMessage());
        }

        return result;
    }
}

