import axios from 'axios';

const PAYSTACK_BASE = 'https://api.paystack.co';
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error('PAYSTACK_SECRET_KEY is not set');
}

const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE,
  headers: {
    Authorization: `Bearer ${SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export interface InitializeResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

/**
 * Initialize a Paystack transaction.
 * Amount must be in kobo (₦1 = 100 kobo) [citation:6].
 */
export async function initializeTransaction(
  email: string,
  amountKobo: number,
  reference: string,
  metadata?: Record<string, unknown>
): Promise<InitializeResult> {
  const { data } = await paystackClient.post('/transaction/initialize', {
    email,
    amount: amountKobo,
    reference,
    currency: 'NGN',
    metadata: metadata || {},
  });

  if (!data.status) {
    throw new Error(data.message || 'Paystack initialization failed');
  }

  return {
    authorization_url: data.data.authorization_url,
    access_code: data.data.access_code,
    reference: data.data.reference,
  };
}

/**
 * Verify a Paystack transaction by reference.
 * Used as a fallback when webhooks are delayed or missed [citation:13].
 */
export async function verifyTransaction(reference: string) {
  const { data } = await paystackClient.get(`/transaction/verify/${reference}`);

  if (!data.status) {
    throw new Error(data.message || 'Paystack verification failed');
  }

  return data.data;
}