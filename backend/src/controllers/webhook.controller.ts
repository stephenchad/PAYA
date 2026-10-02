import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { wallets, users, transactions } from '../db/schema';
import { recordWebhookEvent } from '../services/wallet.service';
import { verifyPaystackSignature } from '../utils/paystack.webhook';
import { randomBytes } from 'crypto';

const generateReference = () =>
  `PAYA-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;

/**
 * POST /webhooks/paystack
 *
 * Paystack sends events here. We must:
 * 1. Verify signature against RAW body
 * 2. Deduplicate (idempotency)
 * 3. Credit wallet atomically
 * 4. Return 200 fast (Paystack retries on non-2xx) [citation:16]
 */
export async function handlePaystackWebhook(req: Request, res: Response): Promise<void> {
  const secret = process.env.PAYSTACK_SECRET_KEY!;

  // req.body is a Buffer here because we mounted express.raw() for this route
  const rawBody = req.body as Buffer;
  const signature = req.headers['x-paystack-signature'] as string | undefined;

  // 1. Verify signature FIRST
  const isValid = verifyPaystackSignature(rawBody, signature, secret);
  if (!isValid) {
    console.warn('Paystack webhook: invalid signature');
    res.status(401).send('Invalid signature');
    return;
  }

  // 2. Parse the verified body
  let event: any;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    res.status(400).send('Invalid JSON');
    return;
  }

  const eventType = event.event;
  const eventData = event.data || {};

  // 3. Only handle charge.success for now
  if (eventType !== 'charge.success') {
    // Acknowledge but ignore other events
    res.status(200).json({ received: true, ignored: true });
    return;
  }

  const reference = eventData.reference;
  const amountKobo = eventData.amount;
  const customerEmail = eventData.customer?.email;

  if (!reference || !amountKobo || !customerEmail) {
    res.status(400).send('Missing required fields');
    return;
  }

  // 4. Idempotency check — build a deterministic event ID
  const eventId = `${eventType}:${reference}`;
  const alreadyProcessed = await recordWebhookEvent(
    eventId,
    eventType,
    reference,
    event
  );

  if (alreadyProcessed) {
    console.log(`Webhook ${eventId} already processed — skipping`);
    res.status(200).json({ received: true, duplicate: true });
    return;
  }

  // 5. Find the user by email and credit their wallet
  try {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.email, customerEmail))
        .limit(1);

      if (!user) {
        throw new Error(`No user found for email ${customerEmail}`);
      }

      // Lock the wallet row
      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, user.id))
        .for('update')
        .limit(1);

      if (!wallet) {
        throw new Error(`No wallet found for user ${user.id}`);
      }

      const newBalance = wallet.balance + amountKobo;

      await tx
        .update(wallets)
        .set({ balance: newBalance, updatedAt: new Date() })
        .where(eq(wallets.id, wallet.id));

      await tx.insert(transactions).values({
        userId: user.id,
        type: 'fund',
        status: 'success',
        amount: amountKobo,
        balanceAfter: newBalance,
        reference: generateReference(),
        note: 'Paystack funding',
        metadata: JSON.stringify({ paystack_reference: reference }),
      });
    });

    console.log(`Webhook ${eventId}: credited ${amountKobo} kobo to ${customerEmail}`);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing failed:', err);
    // Return 500 so Paystack retries. But because we already recorded the event,
    // a retry would be treated as duplicate and skipped — which is wrong.
    // Solution: on failure, delete the webhook_events row so the retry can reprocess.
    try {
      const { db: dbRaw } = await import('../db');
      const { webhookEvents } = await import('../db/schema');
      await dbRaw.delete(webhookEvents).where(eq(webhookEvents.eventId, eventId));
    } catch (cleanupErr) {
      console.error('Failed to clean up webhook event:', cleanupErr);
    }
    res.status(500).json({ error: 'Processing failed, will retry' });
  }
}