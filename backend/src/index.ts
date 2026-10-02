import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { sql } from 'drizzle-orm';
import { db } from './db';
import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import webhookRoutes from './routes/webhook.routes'; // ← new

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

// ⚠️ CRITICAL: Webhook routes MUST be mounted BEFORE express.json()
// because express.json() consumes the raw body stream [citation:20]
app.use('/webhooks', webhookRoutes);

// Now the JSON parser for everything else
app.use(express.json());

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

app.use('/auth', authRoutes);
app.use('/wallet', walletRoutes);

app.listen(PORT, () => {
  console.log(`🚀 PAYA API running on http://localhost:${PORT}`);
});