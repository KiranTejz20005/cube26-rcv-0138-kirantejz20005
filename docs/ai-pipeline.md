# AI Perception & Extraction Pipeline

## Pipeline Sequence

```
      Purchase Order Specs + Reference Images + Shipment Photographs
                                   │
                                   ▼
                            Context Builder
                                   │
                                   ▼
             Google Gemini 2.5 Flash / Flash-Lite Vision Model
                                   │
                                   ▼
                       Structured JSON Payload
                                   │
                                   ▼
                  Zod Schema Parse & Validation
                                   │
                                   ▼
                  Observed Shipment Facts Object
```

## System Prompt Instructions

The AI is instructed strictly as a **Visual Observation Assistant**:
1. **Never fabricate facts**: Report only what is visibly supported by the images.
2. **Handle insufficient evidence**: Return `null` for unreadable SKUs, stacked box counts, or obscured variants, and populate the `uncertainty` list.
3. **Never make acceptance decisions**: The AI must not decide whether a shipment is accepted or rejected.
4. **Structured JSON Output**: All observations are formatted into a strongly-typed JSON structure.

## Zod Extraction Schema (`lib/ai/schemas.ts`)

```ts
export const VisionObservationSchema = z.object({
  product: z.object({
    observedSku: z.string().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  quantity: z.object({
    observed: z.number().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  variant: z.object({
    observed: z.string().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  condition: z.object({
    damaged: z.boolean().nullable(),
    damageTypes: z.array(z.string()),
    confidence: z.number().min(0).max(1),
  }),
  components: z.object({
    missing: z.array(z.string()),
    confidence: z.number().min(0).max(1),
  }),
  evidence: z.array(
    z.object({
      imageId: z.string(),
      observation: z.string(),
      field: z.string(),
    })
  ),
  uncertainty: z.array(
    z.object({
      field: z.string(),
      reason: z.string(),
    })
  ),
});
```
