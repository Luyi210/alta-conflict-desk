import { z } from "zod";

export const intakeDraftKey = "alta-intake-draft:v1";
const entity = z.object({
  lei: z.string().regex(/^[A-Z0-9]{20}$/),
  name: z.string(),
  jurisdiction: z.string(),
  status: z.string(),
  address: z.string(),
  sourceUrl: z.string().url(),
  fetchedAt: z.string(),
});
export const intakeDraftSchema = z.object({
  version: z.literal(1),
  step: z.number().int().min(1).max(3),
  savedAt: z.string(),
  value: z.object({
    name: z.string().max(200),
    context: z.string().max(4000),
    jurisdiction: z.string().max(100),
    mode: z.enum(["ai", "rules"]),
    parties: z
      .array(
        z
          .object({
            id: z.string(),
            name: z.string().max(300),
            role: z.enum(["拟委托人", "交易对方", "担保方", "其他相关方"]),
            confirmed: z.boolean(),
            entity: entity.optional(),
          })
          .refine((p) => !p.confirmed || Boolean(p.entity)),
      )
      .min(1)
      .max(6),
  }),
});
export function parseIntakeDraft(raw: string | null) {
  try {
    const parsed = intakeDraftSchema.safeParse(JSON.parse(raw || "null"));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}
