# PayTrace — Payment Discrepancy Detection & Reconciliation System

> **A Financial Operations & 3-Way Algorithmic Transaction Reconciliation Platform**  
> Built as an Academic Java OOP & Modern Fintech Web Application.

---

## 1. Project Overview & Architecture

PayTrace is a financial operations web platform that automates 3-way transaction reconciliation across:
1. **Order Management System (OMS) Records**
2. **Payment Gateway Captured Logs (Stripe, Adyen, Authorize.Net)**
3. **Acquiring Bank Settlement Statements (Chase, Citi, JPMC)**

It detects amount shortfalls, delayed bank settlements, missing transactions, and double charges with mathematical explainability without custody of live funds.

```
┌─────────────────────────────────────────────────────────────┐
│                       ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────┘
  React 18 + TypeScript + Tailwind CSS (Midnight Luxe Theme)
  Web Audio API Financial Soundscape (Coin Chimes, Rubber Stamps)
                            │
                            ▼ (REST / JSON over HTTPS + JWT)
  Spring Boot 3.4.x (Java 21 LTS) REST Controllers & Security
                            │
                            ▼
  Core Java OOP Engine:
    - Thurika G: Domain Entities & OOP Hierarchy
    - Sujith E: Reconciliation Algorithm & Tolerance Matching
    - Tharun J: Ingestion, CSV Reading & Validation
    - Mithunasri J: Investigation State Machine & JUnit 5 Tests
                            │
                            ▼
  Spring Data JPA / Hibernate 6.x (Batch size: 50)
                            │
                            ▼
  MySQL 8.x Database (DECIMAL(15,2) for Currency)
```

---

## 2. Team Structure & Java Responsibilities

| Member | Project Role | Java Engineering Ownership |
| :--- | :--- | :--- |
| **Thurika G** | Domain Architect | Domain models, inheritance, encapsulation, record entities |
| **Sujith E** | Core Systems Engineer | 3-way matching algorithm, HashMap indexing ($O(N)$ efficiency) |
| **Tharun J** | Ingestion Specialist | CSV reader, OpenCSV tokenization, syntax validation |
| **Mithunasri J** | QA & Workflow Engineer | Investigation lifecycle state machine, JUnit 5 test suites |

---

## 3. Getting Started

### Prerequisites
- **Node.js** (v18+ or v20+)
- **Java JDK 21 LTS**
- **Maven 3.9+**
- **MySQL 8.x**

### Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

> [!TIP]
> The frontend is pre-configured with a stateful **Mock Financial Engine** (`VITE_USE_MOCKS=true`). You can immediately test the entire workflow—landing page, 3D card flip sign-in, tri-fold CSV upload, animated reconciliation engine, 3-way results table, investigation case dossier, and printable PDF audit certificate—without needing the backend running.

### Running the Backend
```bash
cd backend
mvn spring-boot:run
```
The Spring Boot server starts on `http://localhost:8080`.

---

## 4. Complete Application Pages

1. **Landing Page (`/`):** 3D floating payment cards, rotating golden coin, and before/after reconciliation visualizer.
2. **Authentication (`/login`):** Interactive 3D credit card flip with real-time embossed cardholder updates and one-click demo credentials (`analyst@paytrace.dev` / `admin@paytrace.dev`).
3. **Dashboard (`/dashboard`):** 4 KPI summary cards, 7-day reconciliation velocity area chart, discrepancy breakdown donut chart, and quick action dock.
4. **Data Ingestion (`/import`):** Tri-fold dropzone for Orders, Payments, and Settlements with downloadable CSV templates and 1-click synthetic demo file loader.
5. **Reconciliation Engine (`/reconcile`):** Animated 3-stream matching diagram with live monospace engine trace logs.
6. **Results & Mismatches (`/results`):** Multi-way side-by-side comparative grid highlighting variance cells with explainability tags.
7. **Investigation Centre (`/investigations`):** Case queue, financial case file dossier layout, note timeline, resolution categories, and animated green rubber approval stamp.
8. **Executive Reports (`/reports`):** Official audit certificate, financial position balance sheet, and `@media print` clean PDF layout.
9. **History (`/history`):** Historical run timeline and compliance audit logs.
10. **Settings (`/settings`):** Sound effects toggle, volume slider, and sound effect test station.

---

## 5. End-to-End Evaluation Demonstration Script

1. **Step 1:** Open [http://localhost:5173](http://localhost:5173). Present the Landing Page and 3D balance coin.
2. **Step 2:** Click **Launch Platform**. Click **Lead Analyst** to fill demo credentials. Sign in with the card verification effect.
3. **Step 3:** Navigate to **Import CSVs**. Click **Load Synthetic Demo CSVs** to stage 3,710 records across Orders, Payments, and Settlements.
4. **Step 4:** Click **Confirm & Run Engine**. Watch the animated 3-way matching streams and live trace terminal execute.
5. **Step 5:** Transition to **Results & Mismatches**. Filter by **Amount Mismatches** and point out the side-by-side comparison (Order $250 vs Gateway $230).
6. **Step 6:** Click **Investigate**. Open the case dossier, attach an analyst note, and click **Resolve Case**. Watch the green "RESOLVED" rubber ink stamp apply.
7. **Step 7:** Open **Reports & Audit**. Click **Print / Save as PDF** to show the clean executive balance certificate.
