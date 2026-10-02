import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, wallets } from '../db/schema';
import { signToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const SALT_ROUNDS = 12;

// POST /auth/register
export async function register(req: Request, res: Response): Promise<void> {
  // 1. Validate
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { email, phone, password, firstName, lastName } = parsed.data;

  try {
    // 2. Check for existing user (email OR phone)
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const existingPhone = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    if (existingPhone.length > 0) {
      res.status(409).json({ error: 'Phone number already registered' });
      return;
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Create user + wallet atomically
    const result = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({ email, phone, passwordHash, firstName, lastName })
        .returning();

      const [newWallet] = await tx
        .insert(wallets)
        .values({ userId: newUser.id, balance: 0, currency: 'NGN' })
        .returning();

      return { user: newUser, wallet: newWallet };
    });

    // 5. Sign JWT
    const token = signToken({ userId: result.user.id, email: result.user.email });

    res.status(201).json({
      message: 'Account created',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        phone: result.user.phone,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      wallet: {
        id: result.wallet.id,
        balance: result.wallet.balance,
        currency: result.wallet.currency,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// POST /auth/login
export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // ⚠️ Use the same error message for "no user" and "wrong password"
    // This prevents attackers from enumerating registered emails
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// GET /auth/me (protected)
export async function me(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
      wallet: wallet
        ? {
            id: wallet.id,
            balance: wallet.balance,
            currency: wallet.currency,
          }
        : null,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}