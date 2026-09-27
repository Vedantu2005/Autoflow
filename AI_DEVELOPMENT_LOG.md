# AI-Assisted Development Log — AutoFlow Project

This document records the engineering decisions, prompts, AI interactions, critical modifications, and domain learnings achieved throughout the iterative build of **AutoFlow**.

---

### Feature 1: Business Domain Analysis & Finite State Machine Design
* **1. Problem:** Most candidate assessment projects consist of isolated CRUD tables with no business workflow logic. AutoFlow required an interconnected lifecycle reflecting real automotive service centers.
* **2. Prompt Used:** *"Design the complete business process and state transitions for AutoFlow from booking to vehicle delivery with gating rules."*
* **3. AI Response / Approach:** Generated a 10-state finite state machine (`BOOKED` → `CHECKED_IN` → `INSPECTION` → `ESTIMATE_PENDING` → `CUSTOMER_APPROVAL` → `APPROVED` → `IN_SERVICE` → `QUALITY_CHECK` → `READY_FOR_DELIVERY` → `COMPLETED`).
* **4. What I Changed:** Enforced two strict hard gates:
  - Disallow `IN_SERVICE` before customer approval on the estimate.
  - Disallow `COMPLETED` vehicle handover if invoice payment is pending.
* **5. What I Learned:** Real SaaS applications gain value by preventing invalid state transitions rather than merely writing records to a database.
* **6. Final Implementation:** Embedded validation in `serviceJobController.js` and visualised via `WorkflowStepper.jsx`.

---

### Feature 2: Automated Inventory Decrement on Customer Estimate Sign-Off
* **1. Problem:** Technicians manually pulling parts without centralized recording creates stockouts and revenue leakage.
* **2. Prompt Used:** *"How to link customer digital estimate approval with real-time inventory decrement and low-stock alerts in Express and MongoDB?"*
* **3. AI Response / Approach:** Suggested decrementing parts after completing the entire service.
* **4. What I Changed:** Refactored the logic to deduct parts immediately when the customer digitally signs off (`APPROVE` action on the estimate), ensuring that reserved parts cannot be double-allocated.
* **5. What I Learned:** Automotive centers reserve physical inventory at the moment of authorization, not at vehicle pick-up.
* **6. Final Implementation:** Atomic decrements in `estimateController.js` with instant triggers for `LOW_STOCK_ALERT` in the audit log.

---

### Feature 3: 1-Click Demo Persona Role Switcher for Campus Assessment
* **1. Problem:** Demonstrating 4 different user roles (Customer, Advisor, Mechanic, Admin) usually requires frequent logging out, typing credentials, and clearing cookies, which consumes valuable presentation time.
* **2. Prompt Used:** *"Create an assessment-optimized authentication workflow where an evaluator can test all 4 perspectives seamlessly."*
* **3. AI Response / Approach:** Suggested hardcoded credentials or a mock switch in local state.
* **4. What I Changed:** Implemented a full-stack `switchRoleDemo(role)` in `AuthContext.jsx` that executes real backend JWT authentication calls for seeded demo personas (`amit@autoflow.com`, `advisor@autoflow.com`, `mechanic@autoflow.com`, `admin@autoflow.com`) and updates the live UI top toolbar with active role indicators.
* **5. What I Learned:** Designing with the evaluator's user experience in mind makes the assessment demonstration fluid and professional.
* **6. Final Implementation:** Integrated toolbar in `Navbar.jsx` with instant live switching across all dashboards.

---

### Feature 4: Zero-Config In-Memory MongoDB Fallback
* **1. Problem:** Evaluators running the repository locally may not have a MongoDB daemon running on port 27017, leading to connection crashes.
* **2. Prompt Used:** *"How to ensure an Express Mongoose server runs out-of-the-box even if the evaluator does not have MongoDB installed?"*
* **3. AI Response / Approach:** Provided standard Mongoose connection code with retry loops.
* **4. What I Changed:** Integrated `mongodb-memory-server` as an automatic catch-block fallback inside `src/config/db.js`.
* **5. What I Learned:** A production-ready candidate submission must be resilient to host environment variance.
* **6. Final Implementation:** Tested local and in-memory failover with automatic realistic seed execution on boot.
