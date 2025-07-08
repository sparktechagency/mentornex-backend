import { z } from 'zod';

const purchasePayPerSession = z.object({
  body: z.object({
    date: z.string({required_error: 'Date is required'}),
    slot: z.string({required_error: 'Slot is required'}),
  })
})

export const PurchaseValidations = { purchasePayPerSession };
