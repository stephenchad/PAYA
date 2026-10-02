import { z } from 'zod';

// Nigerian phone: accepts 070..., 080..., 090..., 081..., or +234...
const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  phone: z
    .string()
    .regex(phoneRegex, 'Invalid Nigerian phone number (e.g. 08012345678)'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long'), // bcrypt max input length
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;