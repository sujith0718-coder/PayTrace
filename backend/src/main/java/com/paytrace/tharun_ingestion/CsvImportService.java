package com.paytrace.tharun_ingestion;

import com.opencsv.CSVReader;
import com.paytrace.thurika_models.*;
import java.io.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * DEVELOPER: Tharun J
 * OBJECTIVE: Reads CSV streams using OpenCSV, converts columns into domain models using dynamic header mapping, and isolates bad rows.
 */
public class CsvImportService {

    private String normalizeHeader(String header) {
        if (header == null) return "";
        return header.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    private BigDecimal parseAmountSafely(String val, BigDecimal defaultVal) {
        if (val == null || val.trim().isEmpty()) return defaultVal;
        String clean = val.replace("₹", "").replace("$", "").replace(",", "").trim();
        try {
            return new BigDecimal(clean);
        } catch (Exception e) {
            return defaultVal;
        }
    }

    /**
     * Parses Orders CSV dynamically based on headers:
     * order_id, customer_id, order_timestamp/order_date, order_amount/amount, currency, order_status
     */
    public CsvValidationResult<OrderRecord> parseOrders(InputStream inputStream) {
        CsvValidationResult<OrderRecord> result = new CsvValidationResult<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream))) {
            String[] header = reader.readNext();
            if (header == null) {
                result.addWarning("Orders CSV is completely empty.");
                return result;
            }

            Map<String, Integer> colMap = new HashMap<>();
            for (int i = 0; i < header.length; i++) {
                colMap.put(normalizeHeader(header[i]), i);
            }

            int idIdx = colMap.getOrDefault("orderid", colMap.getOrDefault("id", colMap.getOrDefault("ordernumber", 0)));
            int custIdx = colMap.getOrDefault("customerid", colMap.getOrDefault("customer", colMap.getOrDefault("custid", header.length > 1 ? 1 : -1)));
            int amountIdx = colMap.getOrDefault("orderamount", colMap.getOrDefault("amount", colMap.getOrDefault("ordervalue", colMap.getOrDefault("totalamount", 3))));
            int currIdx = colMap.getOrDefault("currency", colMap.getOrDefault("curr", -1));
            int statusIdx = colMap.getOrDefault("orderstatus", colMap.getOrDefault("status", -1));

            String[] line;
            int lineNumber = 1;

            while ((line = reader.readNext()) != null) {
                lineNumber++;
                if (line.length == 0 || (line.length == 1 && line[0].trim().isEmpty())) continue;

                try {
                    String orderId = idIdx < line.length ? line[idIdx].trim() : "";
                    if (orderId.isEmpty()) {
                        result.addWarning("Line " + lineNumber + ": Missing order_id");
                        continue;
                    }

                    String customerId = (custIdx >= 0 && custIdx < line.length) ? line[custIdx].trim() : "CUST-DEFAULT";
                    
                    String rawAmount = (amountIdx < line.length) ? line[amountIdx].trim() : "0";
                    BigDecimal amount = parseAmountSafely(rawAmount, null);
                    if (amount == null) {
                        result.addWarning("Line " + lineNumber + ": Invalid numeric order amount '" + rawAmount + "'");
                        continue;
                    }

                    String currency = (currIdx >= 0 && currIdx < line.length && !line[currIdx].trim().isEmpty()) 
                            ? line[currIdx].trim() : "INR";
                    String status = (statusIdx >= 0 && statusIdx < line.length && !line[statusIdx].trim().isEmpty()) 
                            ? line[statusIdx].trim() : "COMPLETED";

                    OrderRecord order = new OrderRecord(orderId, LocalDateTime.now(), customerId, amount, currency, status);
                    result.addRecord(order);

                } catch (Exception e) {
                    result.addWarning("Line " + lineNumber + ": Failed to parse order row - " + e.getMessage());
                }
            }
        } catch (Exception e) {
            result.addWarning("Fatal Orders CSV stream error: " + e.getMessage());
        }

        return result;
    }

    /**
     * Parses Payments CSV dynamically based on headers:
     * gateway_txn_id/payment_id, order_id, gateway_timestamp/payment_date, gateway_amount/payment_amount/amount, fee, currency, payment_method/gateway, gateway_status/status
     */
    public CsvValidationResult<PaymentTransaction> parsePayments(InputStream inputStream) {
        CsvValidationResult<PaymentTransaction> result = new CsvValidationResult<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream))) {
            String[] header = reader.readNext();
            if (header == null) {
                result.addWarning("Payments CSV is completely empty.");
                return result;
            }

            Map<String, Integer> colMap = new HashMap<>();
            for (int i = 0; i < header.length; i++) {
                colMap.put(normalizeHeader(header[i]), i);
            }

            int pIdIdx = colMap.getOrDefault("gatewaytxnid", colMap.getOrDefault("paymentid", colMap.getOrDefault("txnid", colMap.getOrDefault("id", 0))));
            int oIdIdx = colMap.getOrDefault("orderid", 1);
            int amountIdx = colMap.getOrDefault("gatewayamount", colMap.getOrDefault("paymentamount", colMap.getOrDefault("amount", 3)));
            int feeIdx = colMap.getOrDefault("feeamount", colMap.getOrDefault("fee", colMap.getOrDefault("gatewayfee", -1)));
            int gatewayIdx = colMap.getOrDefault("paymentmethod", colMap.getOrDefault("gateway", colMap.getOrDefault("method", -1)));
            int statusIdx = colMap.getOrDefault("gatewaystatus", colMap.getOrDefault("paymentstatus", colMap.getOrDefault("status", -1)));

            String[] line;
            int lineNumber = 1;

            while ((line = reader.readNext()) != null) {
                lineNumber++;
                if (line.length == 0 || (line.length == 1 && line[0].trim().isEmpty())) continue;

                try {
                    String paymentId = pIdIdx < line.length ? line[pIdIdx].trim() : "";
                    String orderId = oIdIdx < line.length ? line[oIdIdx].trim() : "";

                    if (paymentId.isEmpty()) {
                        result.addWarning("Line " + lineNumber + ": Missing payment_id");
                        continue;
                    }

                    String rawAmount = (amountIdx < line.length) ? line[amountIdx].trim() : "0";
                    BigDecimal amount = parseAmountSafely(rawAmount, null);
                    if (amount == null) {
                        result.addWarning("Line " + lineNumber + ": Invalid numeric payment amount '" + rawAmount + "'");
                        continue;
                    }

                    BigDecimal fee = BigDecimal.ZERO;
                    if (feeIdx >= 0 && feeIdx < line.length) {
                        fee = parseAmountSafely(line[feeIdx].trim(), BigDecimal.ZERO);
                    }

                    String gateway = (gatewayIdx >= 0 && gatewayIdx < line.length && !line[gatewayIdx].trim().isEmpty()) 
                            ? line[gatewayIdx].trim() : "Gateway";
                    String status = (statusIdx >= 0 && statusIdx < line.length && !line[statusIdx].trim().isEmpty()) 
                            ? line[statusIdx].trim() : "SUCCESS";

                    PaymentTransaction payment = new PaymentTransaction(paymentId, orderId, LocalDateTime.now(), amount, fee, gateway, status);
                    result.addRecord(payment);

                } catch (Exception e) {
                    result.addWarning("Line " + lineNumber + ": Corrupted payment row - " + e.getMessage());
                }
            }
        } catch (Exception e) {
            result.addWarning("Fatal Payments CSV stream error: " + e.getMessage());
        }

        return result;
    }

    /**
     * Parses Settlements CSV dynamically based on headers:
     * bank_settlement_id/settlement_id, gateway_txn_id/payment_id, settlement_timestamp/settlement_date, settlement_amount/gross_amount, net_amount, fee, bank_reference
     */
    public CsvValidationResult<SettlementRecord> parseSettlements(InputStream inputStream) {
        CsvValidationResult<SettlementRecord> result = new CsvValidationResult<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream))) {
            String[] header = reader.readNext();
            if (header == null) {
                result.addWarning("Settlements CSV is completely empty.");
                return result;
            }

            Map<String, Integer> colMap = new HashMap<>();
            for (int i = 0; i < header.length; i++) {
                colMap.put(normalizeHeader(header[i]), i);
            }

            int sIdIdx = colMap.getOrDefault("banksettlementid", colMap.getOrDefault("settlementid", colMap.getOrDefault("id", 0)));
            int pIdIdx = colMap.getOrDefault("gatewaytxnid", colMap.getOrDefault("paymentid", colMap.getOrDefault("txnid", 1)));
            int grossIdx = colMap.getOrDefault("settlementamount", colMap.getOrDefault("grossamount", colMap.getOrDefault("gross", colMap.getOrDefault("amount", 3))));
            int netIdx = colMap.getOrDefault("netamount", colMap.getOrDefault("net", -1));
            int feeIdx = colMap.getOrDefault("settlementfee", colMap.getOrDefault("fee", colMap.getOrDefault("bankfee", -1)));
            int refIdx = colMap.getOrDefault("bankreference", colMap.getOrDefault("reference", colMap.getOrDefault("ref", -1)));

            String[] line;
            int lineNumber = 1;

            while ((line = reader.readNext()) != null) {
                lineNumber++;
                if (line.length == 0 || (line.length == 1 && line[0].trim().isEmpty())) continue;

                try {
                    String settlementId = sIdIdx < line.length ? line[sIdIdx].trim() : "";
                    String paymentId = pIdIdx < line.length ? line[pIdIdx].trim() : "";

                    if (settlementId.isEmpty()) {
                        result.addWarning("Line " + lineNumber + ": Missing settlement_id");
                        continue;
                    }

                    String rawGross = (grossIdx < line.length) ? line[grossIdx].trim() : "0";
                    BigDecimal gross = parseAmountSafely(rawGross, null);
                    if (gross == null) {
                        result.addWarning("Line " + lineNumber + ": Invalid numeric settlement gross amount '" + rawGross + "'");
                        continue;
                    }

                    BigDecimal fee = BigDecimal.ZERO;
                    if (feeIdx >= 0 && feeIdx < line.length) {
                        fee = parseAmountSafely(line[feeIdx].trim(), BigDecimal.ZERO);
                    }

                    BigDecimal net = gross;
                    if (netIdx >= 0 && netIdx < line.length) {
                        BigDecimal parsedNet = parseAmountSafely(line[netIdx].trim(), null);
                        if (parsedNet != null) {
                            net = parsedNet;
                        } else {
                            net = gross.subtract(fee);
                        }
                    } else {
                        net = gross.subtract(fee);
                    }

                    String ref = (refIdx >= 0 && refIdx < line.length && !line[refIdx].trim().isEmpty()) 
                            ? line[refIdx].trim() : settlementId;

                    SettlementRecord settlement = new SettlementRecord(settlementId, paymentId, LocalDateTime.now(), gross, net, fee, ref);
                    result.addRecord(settlement);

                } catch (Exception e) {
                    result.addWarning("Line " + lineNumber + ": Corrupted settlement row - " + e.getMessage());
                }
            }
        } catch (Exception e) {
            result.addWarning("Fatal Settlements CSV stream error: " + e.getMessage());
        }

        return result;
    }
}
