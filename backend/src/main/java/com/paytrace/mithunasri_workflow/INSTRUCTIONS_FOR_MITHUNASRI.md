# Mithunasri's Workspace — Investigation Workflow & QA Testing

Welcome **Mithunasri J**! This folder is **your dedicated workspace**.

### Your Files in this Folder:
1. `InvestigationStatus.java` — Enum defining state machine steps: `OPEN`, `UNDER_REVIEW`, `RESOLVED`, `REOPENED`.
2. `InvestigationCase.java` — State machine managing case assignment, status transitions, and audit notes.
3. In `backend/src/test/java/com/paytrace/mithunasri_tests/ReconciliationEngineTest.java`:
   - Comprehensive JUnit 5 automated test suite validating Thurika's models, Sujith's algorithm, and Tharun's CSV reader.

---

### How to Complete Your Tasks:
1. Open `InvestigationCase.java` and `ReconciliationEngineTest.java`.
2. Follow the comments marked `// TODO [MITHUNASRI]`.
3. Complete the state machine transitions:
   - `moveToUnderReview()`: Verifies that a resolved case cannot go to review without reopening.
   - `resolve(category, note)`: Validates that note is **never empty** (mandatory compliance rule).
   - `reopen(reason)`: Sets status to `REOPENED`.
4. Run the automated test suite from your terminal:
   ```bash
   cd backend
   mvn test
   ```
5. When all 4 tests pass with green checks, commit and push your branch:
   ```bash
   git add src/main/java/com/paytrace/mithunasri_workflow/ src/test/java/com/paytrace/mithunasri_tests/
   git commit -m "feat(mithunasri): complete investigation workflow and JUnit 5 regression test suite"
   git push origin feature/investigation-testing
   ```
