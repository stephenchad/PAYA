import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';  // ← side-effect import, runs first
import { sql } from 'drizzle-orm';
import { db } from './db';
import authRoutes from './routes/auth.routes';



import walletRoutes from './routes/wallet.routes';


const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({
      status: 'ok',
      service: 'PAYA API',
      db: 'connected',
      time: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      db: 'disconnected',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

app.get('/', (_req: Request, res: Response) => {
  res.send('PAYA API is running 💸');
});

import * as authCtrl from './controllers/auth.controller';
console.log('authCtrl =', Object.keys(authCtrl));

console.log('authRoutes =', typeof authRoutes, authRoutes);

// Auth routes
app.use('/auth', authRoutes);

app.use('/wallet', walletRoutes);

app.listen(PORT, () => {
  console.log(`🚀 PAYA API running on http://localhost:${PORT}`);
});