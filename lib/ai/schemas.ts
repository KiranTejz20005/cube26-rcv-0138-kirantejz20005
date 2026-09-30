import { z } from 'zod';

export const VisionObservationSchema = z.object({
  product: z.object({
    observedSku: z.string().nullable(),
    confidence: z.number().min(0).max(1).default(1.0),
  }),
  quantity: z.object({
    observed: z.number().nullable(),
    confidence: z.number().min(0).max(1).default(1.0),
  }),
  variant: z.object({
    observed: z.string().nullable(),
    confidence: z.number().min(0).max(1).default(1.0),
  }),
  condition: z.object({
    damaged: z.boolean().nullable(),
    damageTypes: z.array(z.string()).default([]),
    confidence: z.number().min(0).max(1).default(1.0),
  }),
  components: z.object({
    missing: z.array(z.string()).default([]),
    confidence: z.number().min(0).max(1).default(1.0),
  }),
  evidence: z.array(
    z.object({
      imageId: z.string(),
      observation: z.string(),
      field: z.string(),
    })
  ).default([]),
  uncertainty: z.array(
    z.object({
      field: z.string(),
      reason: z.string(),
    })
  ).default([]),
});

export type VisionInspection = z.infer<typeof VisionObservationSchema>;

