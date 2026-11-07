# PayTrace — Team Workspace Navigator

Welcome to the **PayTrace** project! This map provides direct links to each team member's personal folder and files.

---

## 👩‍💻 Member 1: THURIKA G
- **Your Folder:** [`backend/src/main/java/com/paytrace/thurika_models/`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/thurika_models/)
- **Your Instructions:** [`INSTRUCTIONS_FOR_THURIKA.md`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/thurika_models/INSTRUCTIONS_FOR_THURIKA.md)
- **Your Branch:** `feature/java-data-models`
- **Your Files to Work On:**
  1. [`BaseFinancialRecord.java`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/thurika_models/BaseFinancialRecord.java) — Abstract parent class
  2. [`OrderRecord.java`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/thurika_models/OrderRecord.java) — OMS Order model
  3. [`PaymentTransaction.java`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/thurika_models/PaymentTransaction.java) — Gateway Payment model
  4. [`SettlementRecord.java`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/thurika_models/SettlementRecord.java) — Bank Settlement model
  5. [`Discrepancy.java`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/thurika_models/Discrepancy.java) — Discrepancy details
  6. [`DiscrepancyType.java`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/thurika_models/DiscrepancyType.java) — Enum for error types

---

## 👨‍💻 Member 2: SUJITH E
- **Your Folder:** [`backend/src/main/java/com/paytrace/sujith_engine/`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/sujith_engine/)
- **Your Instructions:** [`INSTRUCTIONS_FOR_SUJITH.md`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/sujith_engine/INSTRUCTIONS_FOR_SUJITH.md)
- **Your Branch:** `feature/reconciliation-engine`
- **Your Files to Work On:**
  1. [`ReconciliationEngine.java`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/sujith_engine/ReconciliationEngine.java) — 3-way matching engine in O(N) time
  2. [`ReconciliationResult.java`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/sujith_engine/ReconciliationResult.java) — Metrics and statistics container

---

## 👨‍💻 Member 3: THARUN J
- **Your Folder:** [`backend/src/main/java/com/paytrace/tharun_ingestion/`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/tharun_ingestion/)
- **Your Instructions:** [`INSTRUCTIONS_FOR_THARUN.md`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/tharun_ingestion/INSTRUCTIONS_FOR_THARUN.md)
- **Your Branch:** `feature/csv-import`
- **Your Files to Work On:**
  1. [`CsvImportService.java`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/tharun_ingestion/CsvImportService.java) — OpenCSV stream reader
  2. [`CsvValidationResult.java`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/tharun_ingestion/CsvValidationResult.java) — Generic parser envelope with non-fatal warnings

---

## 👩‍💻 Member 4: MITHUNASRI J
- **Your Folder:** [`backend/src/main/java/com/paytrace/mithunasri_workflow/`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/mithunasri_workflow/)
- **Your Test Folder:** [`backend/src/test/java/com/paytrace/mithunasri_tests/`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/test/java/com/paytrace/mithunasri_tests/)
- **Your Instructions:** [`INSTRUCTIONS_FOR_MITHUNASRI.md`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/mithunasri_workflow/INSTRUCTIONS_FOR_MITHUNASRI.md)
- **Your Branch:** `feature/investigation-testing`
- **Your Files to Work On:**
  1. [`InvestigationCase.java`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/mithunasri_workflow/InvestigationCase.java) — Investigation state machine
  2. [`InvestigationStatus.java`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/main/java/com/paytrace/mithunasri_workflow/InvestigationStatus.java) — Enum: OPEN, UNDER_REVIEW, RESOLVED, REOPENED
  3. [`ReconciliationEngineTest.java`](file:///C:/Users/sujit/OneDrive/Desktop/PayTrace/PayTrace/backend/src/test/java/com/paytrace/mithunasri_tests/ReconciliationEngineTest.java) — JUnit 5 regression test suite

---

## 🚀 How to Start Working (For Any Member)

1. Open your terminal or Git Bash.
2. Checkout your branch:
   ```bash
   git checkout <your-branch-name>
   git pull origin main
   ```
3. Open the project in **IntelliJ IDEA**, **Eclipse**, or **VS Code**.
4. Go directly into **your named folder**:
   - `com.paytrace.thurika_models`
   - `com.paytrace.sujith_engine`
   - `com.paytrace.tharun_ingestion`
   - `com.paytrace.mithunasri_workflow`
5. Open your files and follow the `// TODO [YOUR_NAME]` guidance!

