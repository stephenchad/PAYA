import { eq, sql, desc } from 'drizzle-orm';
import { db } from '../db';
import { wallets, users, transactions } from '../db/schema';
import { randomBytes } from 'crypto';

import { webhookEvents } from '../db/schema';
import { eq, sql, desc } from 'drizzle-orm'; // make sure these are imported

export class WalletError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
  }
}

const generateReference = () =>
  `PAYA-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;

/**
 * Fund a wallet (dev/manual mode).
 * In Step 7, this becomes a Paystack webhook handler.
 */
export async function fundWallet(userId: string, amountKobo: number, note?: string) {
  if (amountKobo <= 0) throw new WalletError('Amount must be positive');
  if (amountKobo > 10_000_000) throw new WalletError('Max funding per transaction is ₦100,000');

  return await db.transaction(async (tx) => {
    // Lock the wallet row so two concurrent funds can't race
    const [wallet] = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .for('update')
      .limit(1);

    if (!wallet) throw new WalletError('Wallet not found', 404);

    const newBalance = wallet.balance + amountKobo;

    await tx
      .update(wallets)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(wallets.id, wallet.id));

    const [txn] = await tx
      .insert(transactions)
      .values({
        userId,
        type: 'fund',
        status: 'success',
        amount: amountKobo,
        balanceAfter: newBalance,
        reference: generateReference(),
        note: note || 'Wallet funding',
      })
      .returning();

    return { wallet: { ...wallet, balance: newBalance }, transaction: txn };
  });
}

/**
 * Send money between two users atomically.
 * Uses SELECT ... FOR UPDATE to prevent race conditions.
 */
export async function sendMoney(
  senderId: string,
  recipientPhoneOrEmail: string,
  amountKobo: number,
  note?: string
) {
  if (amountKobo <= 0) throw new WalletError('Amount must be positive');

  const MIN_SEND = 10_000; // ₦100
  if (amountKobo < MIN_SEND) throw new WalletError('Minimum send is ₦100');

  return await db.transaction(async (tx) => {
    // 1. Find the recipient
    const [recipient] = await tx
      .select()
      .from(users)
      .where(
        sql`${users.email} = ${recipientPhoneOrEmail} OR ${users.phone} = ${recipientPhoneOrEmail}`
      )
      .limit(1);

    if (!recipient) throw new WalletError('Recipient not found', 404);
    if (recipient.id === senderId) throw new WalletError('Cannot send money to yourself');

    // 2. Lock BOTH wallets in a deterministic order to avoid deadlocks.
    //    Sort by userId so concurrent sends lock in the same order.
    const ids = [senderId, recipient.id].sort();

    const lockedWallets = await tx
      .select()
      .from(wallets)
      .where(sql`${wallets.userId} = ANY(${sql.raw(`ARRAY['${ids.join("','")}']::uuid[]`)})`)
      .for('update');

    const senderWallet = lockedWallets.find((w) => w.userId === senderId);
    const recipientWallet = lockedWallets.find((w) => w.userId === recipient.id);

    if (!senderWallet || !recipientWallet) throw new WalletError('Wallet not found', 404);

    if (senderWallet.balance < amountKobo) {
      throw new WalletError('Insufficient balance', 400);
    }

    const senderNewBalance = senderWallet.balance - amountKobo;
    const recipientNewBalance = recipientWallet.balance + amountKobo;
    const reference = generateReference();
    const now = new Date();

    // 3. Update both wallets
    await tx
      .update(wallets)
      .set({ balance: senderNewBalance, updatedAt: now })
      .where(eq(wallets.id, senderWallet.id));

    await tx
      .update(wallets)
      .set({ balance: recipientNewBalance, updatedAt: now })
      .where(eq(wallets.id, recipientWallet.id));

    // 4. Two ledger entries — one debit, one credit — same reference
    const [debitTxn] = await tx
      .insert(transactions)
      .values({
        userId: senderId,
        type: 'send',
        status: 'success',
        amount: amountKobo,
        balanceAfter: senderNewBalance,
        counterpartyId: recipient.id,
        counterpartyName: `${recipient.firstName} ${recipient.lastName}`,
        reference,
        note: note || null,
      })
      .returning();

    await tx.insert(transactions).values({
      userId: recipient.id,
      type: 'receive',
      status: 'success',
      amount: amountKobo,
      balanceAfter: recipientNewBalance,
      counterpartyId: senderId,
      counterpartyName: 'Sender',
      reference,
      note: note || null,
    });

    return {
      transaction: debitTxn,
      newBalance: senderNewBalance,
    };
  });
}

/**
 * Paginated transaction history for a user.
 */
export async function getTransactionHistory(
  userId: string,
  limit = 20,
  offset = 0
) {
  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(Math.min(limit, 50))
    .offset(offset);

  return rows;
}


/**
 * Idempotency check — returns true if this event was already processed.
 * If not processed, records it atomically and returns false.
 */
export async function recordWebhookEvent(
  eventId: string,
  eventType: string,
  reference: string | null,
  payload: unknown
): Promise<boolean> {
  const payloadStr = JSON.stringify(payload);

  try {
    await db.insert(webhookEvents).values({
      eventId,
      eventType,
      reference,
      payload: payloadStr,
    });
    return false; // newly inserted → not processed yet
  } catch (err: any) {
    // Unique constraint violation = already processed
    if (err.code === '23505') {
      return true;
    }
    throw err;
  }
}