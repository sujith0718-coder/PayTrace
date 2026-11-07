# Sujith's Workspace — Reconciliation Engine Algorithm

Welcome **Sujith E**! This folder is **your dedicated workspace**.

### Your Files in this Folder:
1. `ReconciliationResult.java` — Result summary container holding counts, match percentages, and detected discrepancies.
2. `ReconciliationEngine.java` — The core 3-way matching algorithm running in $O(N)$ linear time using Java HashMaps.

---

### How to Complete Your Tasks:
1. Open `ReconciliationResult.java` and `ReconciliationEngine.java`.
2. Follow the comments marked `// TODO [SUJITH]`.
3. Complete the steps:
   - Step 1: Pre-index Payments into a `Map<String, List<PaymentTransaction>>` by `orderId`.
   - Step 2: Pre-index Settlements into a `Map<String, SettlementRecord>` by `paymentId`.
   - Step 3: Loop through Orders and cross-compare amounts and references against your tolerance threshold ($\pm\$0.05$).
4. When finished, test that your code compiles:
   ```bash
   cd backend
   mvn compile
   ```
5. Commit and push your branch:
   ```bash
   git add src/main/java/com/paytrace/sujith_engine/
   git commit -m "feat(sujith): complete 3-way reconciliation engine algorithm"
   git push origin feature/reconciliation-engine
   ```
