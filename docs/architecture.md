# System Architecture & Technical Specifications

## Architectural Overview

**Receiving Manager** is implemented as a **Modular Monolith** using Next.js (App Router), TypeScript, Prisma ORM, and Tailwind CSS. The application runs locally or on free-tier cloud infrastructure with zero financial overhead.

### Layered Monolith Architecture

```
+-------------------------------------------------------------------+
|                           USER INTERFACE                          |
|    Dashboard  |  New Inspection Form  |  Inspection Report Page   |
+-------------------------------------------------------------------+
                                 │
                                 ▼
+-------------------------------------------------------------------+
|                            API ROUTER                             |
|       /api/inspections  |  /api/uploads  |  /api/seed            |
+-------------------------------------------------------------------+
                                 │
                                 ▼
+-------------------------------------------------------------------+
|                        INSPECTION ENGINE                          |
|   +-----------------------------------------------------------+   |
|   | 1. Context Builder                                        |   |
|   | 2. Vision Provider Interface (Gemini / Demo)              |   |
|   | 3. Zod Response Schema Validator                          |   |
|   | 4. Deterministic Business Rules Engine                    |   |
|   | 5. Evidence & Audit Record Builder                        |   |
|   +-----------------------------------------------------------+   |
+-------------------------------------------------------------------+
                  │                                  │
                  ▼                                  ▼
+-----------------------------------+  +----------------------------+
|         DATABASE LAYER            |  |       STORAGE LAYER        |
|  Prisma ORM (SQLite / PostgreSQL) |  |   Local Storage / R2 S3    |
+-----------------------------------+  +----------------------------+
```

---

## Core System Modules

### 1. Storage Abstraction Layer (`lib/storage/`)
Provides a unified interface (`StorageProvider`) for file uploads:
- `LocalStorageProvider`: Saves images to `public/uploads` for offline local development.
- `R2StorageProvider`: Interoperable with Cloudflare R2 object storage using `@aws-sdk/client-s3`.

### 2. AI Perception Layer (`lib/ai/`)
Abstracts visual processing behind the `VisionProvider` interface:
- `GeminiVisionProvider`: Calls Google Gemini 2.5 Flash with fallback to Gemini 2.5 Flash-Lite. Enforces strict prompt rules and validates JSON using Zod.
- `DemoVisionProvider`: Deterministic mock provider for hackathon demonstrations (`DEMO_MODE=true`).

### 3. Business Decision Engine (`lib/inspection/decision-engine.ts`)
Decoupled, zero-dependency pure TypeScript function. Performs exact value comparisons (`expected === observed`) across 5 inspection parameters and determines the overall decision (`PASS`, `EXCEPTION`, `UNCERTAIN`).

### 4. Database Layer (`prisma/schema.prisma`)
Relational model tracking:
- `Inspection`: Master inspection record (`status`, `overallDecision`).
- `PurchaseOrder`: Purchase order metadata (`sku`, `expectedQuantity`, `expectedVariant`).
- `InspectionImage`: Reference and receiving photograph records.
- `InspectionCheck`: Individual parameter verification results (`type`, `status`, `expectedValue`, `observedValue`, `confidence`, `reason`).
- `InspectionEvidence`: Visual evidence links joining checks to specific images.
