import { z } from 'zod';

const purchasePayPerSession = z.object({
  body: z.object({
    date: z.string(),
    slot: z.string(),
    timeZone: z.string()
  })
})

export const PurchaseValidations = { purchasePayPerSession };
