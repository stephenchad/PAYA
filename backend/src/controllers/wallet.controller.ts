import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { wallets } from '../db/schema';
import {
  fundWallet,
  sendMoney,
  getTransactionHistory,
  WalletError,
} from '../services/wallet.service';
import { fundSchema, sendSchema } from '../validators/wallet.validator';

// GET /wallet/balance
export async function getBalance(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  try {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    res.json({
      balance: wallet.balance,
      currency: wallet.currency,
      formatted: `₦${(wallet.balance / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
    });
  } catch (err) {
    console.error('getBalance error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// POST /wallet/fund  (dev mode — will become Paystack in Step 7)
export async function fund(req: Request, res: Response): Promise<void> {
  const parsed = fundSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const result = await fundWallet(req.user!.userId, parsed.data.amount, parsed.data.note);
    res.status(201).json({
      message: 'Wallet funded',
      wallet: { balance: result.wallet.balance, currency: result.wallet.currency },
      transaction: result.transaction,
    });
  } catch (err) {
    if (err instanceof WalletError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error('fund error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// POST /wallet/send
export async function send(req: Request, res: Response): Promise<void> {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const result = await sendMoney(
      req.user!.userId,
      parsed.data.recipient,
      parsed.data.amount,
      parsed.data.note
    );
    res.status(201).json({
      message: 'Money sent',
      newBalance: result.newBalance,
      transaction: result.transaction,
    });
  } catch (err) {
    if (err instanceof WalletError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error('send error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// GET /wallet/transactions
export async function history(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    const txns = await getTransactionHistory(req.user!.userId, limit, offset);

    res.json({
      transactions: txns,
      pagination: { limit, offset, count: txns.length },
    });
  } catch (err) {
    console.error('history error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}