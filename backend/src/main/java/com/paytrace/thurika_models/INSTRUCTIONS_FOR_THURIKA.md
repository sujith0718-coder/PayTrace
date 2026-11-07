# Thurika's Workspace — Java OOP & Data Models

Welcome **Thurika G**! This folder is **your dedicated workspace**.

### Your Files in this Folder:
1. `BaseFinancialRecord.java` — Abstract parent class for all financial records (demonstrates Abstraction & Encapsulation).
2. `OrderRecord.java` — Extends `BaseFinancialRecord` for Order Management System records.
3. `PaymentTransaction.java` — Extends `BaseFinancialRecord` for Payment Gateway records.
4. `SettlementRecord.java` — Extends `BaseFinancialRecord` for Bank Settlement statements.
5. `Discrepancy.java` — Holds detected variances (amount differences, missing transactions).
6. `DiscrepancyType.java` — Java Enum defining error types.

---

### How to Complete Your Tasks:
1. Open each `.java` file in this folder.
2. Read the comments marked `// TODO [THURIKA]`.
3. Fill in the variables, constructor calls (`super(...)`), and getters/setters.
4. When finished, test that your code compiles:
   ```bash
   cd backend
   mvn compile
   ```
5. Commit and push your branch:
   ```bash
   git add src/main/java/com/paytrace/thurika_models/
   git commit -m "feat(thurika): complete OOP domain models"
   git push origin feature/java-data-models
   ```

