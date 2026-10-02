import { z } from 'zod';

export const fundSchema = z.object({
  amount: z
    .number()
    .int('Amount must be in kobo (integer)')
    .positive('Amount must be positive')
    .max(10_000_000, 'Max ₦100,000 per funding'),
  note: z.string().max(140).optional(),
});

export const sendSchema = z.object({
  recipient: z.string().min(3, 'Recipient phone or email required').trim(),
  amount: z
    .number()
    .int('Amount must be in kobo (integer)')
    .min(10_000, 'Minimum send is ₦100'),
  note: z.string().max(140).optional(),
});

export type FundInput = z.infer<typeof fundSchema>;
export type SendInput = z.infer<typeof sendSchema>;