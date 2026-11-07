# Tharun's Workspace — CSV Ingestion & Validation

Welcome **Tharun J**! This folder is **your dedicated workspace**.

### Your Files in this Folder:
1. `CsvValidationResult.java` — Generic container that holds successfully parsed objects plus a list of row-level warnings.
2. `CsvImportService.java` — OpenCSV parser that reads Orders, Payments, and Settlement streams line-by-line.

---

### How to Complete Your Tasks:
1. Open `CsvValidationResult.java` and `CsvImportService.java`.
2. Follow the comments marked `// TODO [THARUN]`.
3. Complete the parsing methods:
   - `parseOrders(InputStream is)`
   - `parsePayments(InputStream is)`
   - `parseSettlements(InputStream is)`
4. Remember the **golden rule**: Never let a bad row (like an invalid number or blank field) crash the whole file. Wrap row parsing in `try { ... } catch (Exception e)` and add a warning string to `result.addWarning(...)`.
5. Test that your code compiles:
   ```bash
   cd backend
   mvn compile
   ```
6. Commit and push your branch:
   ```bash
   git add src/main/java/com/paytrace/tharun_ingestion/
   git commit -m "feat(tharun): complete CSV import service and non-blocking validation"
   git push origin feature/csv-import
   ```
