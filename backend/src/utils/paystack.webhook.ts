import crypto from 'crypto';

/**
 * Verify a Paystack webhook signature.
 *
 * Paystack signs the RAW request body with HMAC-SHA512 using your
 * secret key, and sends the hex digest in the `x-paystack-signature`
 * header [citation:3][citation:20].
 *
 * ⚠️ `rawBody` MUST be the raw bytes, not JSON.parse'd.
 */
export function verifyPaystackSignature(
  rawBody: Buffer | string,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature) return false;

  const expected = crypto
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex');

  // Timing-safe comparison prevents timing attacks [citation:3][citation:15]
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false; // length mismatch → invalid
  }
}