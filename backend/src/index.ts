// src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db';
import { sql } from 'drizzle-orm';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', async (_req: Request, res: Response) => {
  try {
    // A simple query to check the connection
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

app.listen(PORT, () => {
  console.log(`🚀 PAYA API running on http://localhost:${PORT}`);
});