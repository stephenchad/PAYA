import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'PAYA API',
    time: new Date().toISOString(),
  });
});

// Root
app.get('/', (_req: Request, res: Response) => {
  res.send('PAYA API is running 💸');
});

app.listen(PORT, () => {
  console.log(`🚀 PAYA API running on http://localhost:${PORT}`);
});