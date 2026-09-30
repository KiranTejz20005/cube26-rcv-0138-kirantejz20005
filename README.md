# Receiving Manager &bull; AI-Powered Visual Receiving Inspection System

[![Zero Budget](https://img.shields.io/badge/Budget-%E2%82%B90%20(Free%20Tier)-emerald)](https://aistudio.google.com/)
[![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20TypeScript%20%7C%20Prisma-blue)](https://nextjs.org/)
[![Decision Engine](https://img.shields.io/badge/Architecture-AI%20Observes%20%7C%20App%20Decides-indigo)](#core-architectural-principle)

**Receiving Manager** is an AI-powered visual receiving inspection system built for warehouse receiving operations. It compares uploaded receiving photographs of incoming shipments against expected Purchase Order (PO) specifications and product reference sheets.

---

## 1. Problem Statement

In modern logistics and warehouse operations, physical shipment receiving is prone to human error, missed damage, and incorrect SKU intake. Key issues include:
- **Quantity discrepancies**: Shortages or overages going undetected during fast unload.
- **Variant / SKU mix-ups**: Receiving red items instead of blue, or wrong product revisions.
- **Packaging damage**: Crushed cartons, punctures, or water stains accepted without claims evidence.
- **Missing components**: Incomplete product kits missing manuals, power cords, or keys.
- **Over-reliance on LLM decision making**: Traditional AI wrappers ask an LLM "Should we accept this shipment?" leading to non-deterministic, untrustworthy, or hallucinated business acceptance decisions.

---

## 2. Solution Overview

**Receiving Manager** solves this problem by enforcing a strict architectural separation:

> **AI OBSERVES. APPLICATION DECIDES.**

The AI (Google Gemini 2.5 Flash / Flash-Lite) is restricted purely to perceptual observation and structured JSON feature extraction. The backend application then applies **deterministic business rules** to evaluate the observed data against the Purchase Order. 

If visual evidence is blurry or obscured, the system assigns an **UNCERTAIN** check status instead of forcing a false PASS or FAIL decision.

---

## 3. Key Features

- **Purchase Order Verification**: Compares PO SKU, quantity, variant, and component list against visual evidence.
- **Multi-Parameter Audit**: Evaluates 5 distinct parameters: SKU, Quantity, Variant, Packaging Condition, and Components.
- **Evidence-Backed Reports**: Every check links directly to specific image IDs, visual observations, and confidence scores.
- **Strict UNCERTAIN State Support**: Refrains from forcing acceptance or rejection when camera angles or lighting are insufficient.
- **Zero-Budget Hackathon Architecture**: Operates 100% on free-tier services (Gemini Free Tier, SQLite local dev / Neon free tier Postgres, local storage fallback).
- **Instant 1-Click Evaluation Presets**: Pre-built seed fixtures for 6 real-world receiving scenarios.
- **Demo Mode**: Built-in deterministic mock AI engine (`DEMO_MODE=true`) ensuring hackathon demonstration reliability even if external API limits are reached.

---

## 4. System Architecture

```
                                +-----------------------------------+
                                |            User Browser           |
                                +-----------------------------------+
                                                  |
                                                  v
                                +-----------------------------------+
                                |       Next.js App (App Router)    |
                                +-----------------------------------+
                                       |                     |
                                       v                     v
                        +----------------------+    +-------------------+
                        |   Inspection API     |    |    Upload API     |
                        +----------------------+    +-------------------+
                                       |                     |
                                       v                     v
                        +-----------------------------------------------+
                        |             Inspection Pipeline               |
                        |  +-----------------------------------------+  |
                        |  | 1. Context Builder                      |  |
                        |  | 2. VisionProvider (Gemini / Demo)       |  |
                        |  | 3. Zod Response Schema Validator        |  |
                        |  | 4. Deterministic Decision Engine        |  |
                        |  | 5. Evidence Reference Builder           |  |
                        |  +-----------------------------------------+  |
                        +-----------------------------------------------+
                                       |                     |
                                       v                     v
                        +----------------------+    +-------------------+
                        | SQLite / Neon DB     |    | Local / R2 Storage|
                        |     (Prisma ORM)     |    |     Adapter       |
                        +----------------------+    +-------------------+
```

---

## 5. AI Pipeline Workflow

```
Purchase Order Specs + Reference Images + Shipment Photographs
                             |
                             v
                    Context Builder
                             |
                             v
      Gemini Vision Provider (or Demo Provider if DEMO_MODE=true)
                             |
                             v
                 Structured JSON Extraction
                             |
                             v
             Zod Schema Validation (Strict Parse)
                             |
                             v
              Observed Shipment Facts Object
                             |
                             v
              Deterministic Decision Engine
                             |
                             v
               Evidence-Backed Inspection Report
```

---

## 6. Why AI Does Not Make the Final Decision

Allowing a Generative Language Model (LLM) to make final business decisions poses severe risks:
1. **Hallucination Risk**: An LLM may fabricate acceptance reasons or invent non-existent visual details.
2. **Inconsistency**: Identical photos could receive a PASS on attempt 1 and a FAIL on attempt 2.
3. **Auditability**: Regulatory and insurance claims require exact comparison math (e.g. `22 !== 24 => FAIL`), not prose summaries.

By restricting AI to **perceptual observation** and leaving the decision to code:
```ts
if (observedQty !== expectedQty) {
  status = "FAIL";
  reason = `Observed quantity (${observedQty}) differs from expected (${expectedQty}).`;
}
```
the application delivers **100% reproducible, verifiable, and auditable outcomes**.

---

## 7. Tech Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router), React, TypeScript | Fast, server-rendered React components with strict typing |
| **Styling** | Tailwind CSS, Custom Glassmorphism System | Professional dark-mode operations interface |
| **Icons** | Lucide React | Modern, clean icon suite |
| **Database** | SQLite (Dev) / Neon PostgreSQL (Prod), Prisma ORM | Zero-setup local persistence with instant schema migration |
| **Storage** | Local Storage Adapter / Cloudflare R2 | Zero storage cost, direct local fallback for offline dev |
| **AI Provider** | `@google/genai` (Gemini 2.5 Flash / Flash-Lite) | Industry-leading vision-language model with free tier |
| **Validation** | Zod | Runtime type safety for all API payloads and AI JSON outputs |
| **Testing** | Vitest | Lightning fast unit testing for the decision engine |

---

## 8. Zero-Budget Architecture

This project was engineered to cost **₹0 / $0** across development and deployment:
- **AI Processing**: Uses the free-tier Google Gemini API via AI Studio (no credit card required).
- **Database**: Uses local SQLite (`dev.db`) during development and Neon PostgreSQL free tier for production deployment.
- **File Storage**: Uses `LocalStorageProvider` (`./public/uploads`) during local development and Cloudflare R2 free tier for cloud deployment.
- **Hosting**: Prepared for zero-cost deployment on Vercel Hobby Tier.

> [!NOTE]
> External free-tier API quotas may fluctuate. If Gemini rate limits are encountered, the application gracefully surfaces quota notifications and allows continuous evaluation via `DEMO_MODE=true`.

---

## 9. Quick Local Setup & Development

### 1. Clone repository
```bash
git clone https://github.com/KiranTejz20005/cube26-rcv-0138-kirantejz20005.git
cd cube26-rcv-0138-kirantejz20005
```

### 2. Install dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Setup environment variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` configuration:
```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY=""
DEMO_MODE="true"
```

### 4. Run database migrations & seed test scenarios
```bash
npx prisma generate
npx prisma db push
npm run seed
```

### 5. Start development server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 10. Demo Mode (`DEMO_MODE=true`)

To guarantee 100% demo reliability during hackathon presentations without relying on network latency or external API quotas:
Set `DEMO_MODE="true"` in your `.env` file.

In Demo Mode, the `DemoVisionProvider` simulates realistic AI perceptual outputs for the 6 core receiving test scenarios. The entire pipeline (Zod validation, Deterministic Decision Engine, Database persistence, Evidence Linking, Report generation) executes identically.

---

## 11. Testing & Verification

Run the Vitest test suite covering all 6 evaluation scenarios:

```bash
npm test
```

Sample test output:
```
 ✓ tests/decision-engine.test.ts (6 tests) 10ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
```

---

## 12. The 6 Hackathon Test Scenarios

| Scenario | PO Condition | Observed State | Expected Overall |
| :--- | :--- | :--- | :--- |
| **1. Perfect Shipment** | 24 Qty, Blue, Intact | 24 Qty, Blue, Intact | **PASS** |
| **2. Short & Damaged** | 24 Qty, Blue | 22 Qty, Crushed carton corner | **EXCEPTION** |
| **3. Wrong Variant** | Blue Expected | Red Observed | **EXCEPTION** |
| **4. Wrong SKU** | BLUE-BOTTLE-001 | RED-BOTTLE-001 Label | **EXCEPTION** |
| **5. Insufficient Evidence** | Blurry photo / Obscured label | Unreadable text / Null count | **UNCERTAIN** |
| **6. Missing Component** | Bottle + Cap + Manual | Manual slot empty | **EXCEPTION** |

---

## 13. API Endpoint Documentation

- `POST /api/inspections`: Create a new PO and inspection draft.
- `GET /api/inspections`: List all recorded inspections.
- `GET /api/inspections/:id`: Fetch detailed inspection report with checks and evidence.
- `POST /api/inspections/:id/inspect`: Execute the AI vision pipeline and decision engine.
- `GET /api/inspections/:id/result`: Fetch final inspection result card data.
- `POST /api/uploads`: Upload receiving / reference photograph.
- `POST /api/seed`: Instantly trigger test scenario seeding on demand.

---

## 14. Repository Structure

```
.
├── app/
│   ├── page.tsx                    # Operations Dashboard
│   ├── layout.tsx                  # Root App Layout & Navigation Header
│   ├── globals.css                 # Dark theme design system & glassmorphic styles
│   ├── inspections/
│   │   ├── page.tsx                # Inspection History Table
│   │   ├── new/page.tsx            # New Inspection Form & Image Dropzone
│   │   └── [id]/page.tsx           # Inspection Report & Evidence Cards
│   └── api/                        # Next.js Route Handlers
├── components/
│   ├── header.tsx                  # Top Navbar & Demo Badge
│   └── scenario-selector.tsx       # 1-Click Evaluation Scenario Bar
├── lib/
│   ├── ai/                         # AI Provider Layer
│   │   ├── schemas.ts              # Zod VisionObservationSchema
│   │   ├── provider.ts             # VisionProvider Interface
│   │   ├── gemini.ts               # GeminiVisionProvider (@google/genai)
│   │   ├── demo.ts                 # DemoVisionProvider (Mock Engine)
│   │   └── prompts.ts              # System Prompts
│   ├── inspection/                 # Core Inspection Domain
│   │   ├── decision-engine.ts      # Pure Deterministic Business Logic
│   │   ├── analyzer.ts             # Inspection Pipeline Orchestrator
│   │   └── fixtures.ts             # 6 Evaluation Test Scenarios Data
│   ├── storage/                    # File Storage Layer (Local / R2)
│   └── db/
│       └── prisma.ts               # Prisma Client Singleton
├── prisma/
│   └── schema.prisma               # Database Models (SQLite / PostgreSQL)
├── tests/
│   └── decision-engine.test.ts     # Vitest Unit Tests
├── scripts/
│   └── seed.ts                     # Database Seed Script
├── docs/                           # Architectural Specifications
├── README.md
└── .env.example
```

---

## 15. Limitations & Future Scaling

### Current Limitations:
- Visual unit counting relies on camera visibility; items completely hidden inside opaque outer boxes cannot be counted without unboxing photos.
- Extreme glare or extreme darkness affects barcode OCR clarity (handled gracefully via `UNCERTAIN` status).

### Future Production Scaling Architecture:
For high-volume enterprise logistics hubs receiving 10,000+ cartons/hour:
```
[Browser / Handheld Scanner]
             │
             ▼
      [API Gateway]
             │
             ▼
     [Redis / BullMQ Queue]
             │
             ▼
  [Worker Fleet (Vision Workers)] ──► [PostgreSQL & R2 Object Storage]
```
