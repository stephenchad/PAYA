import { Router } from 'express';
import express from 'express';
import { handlePaystackWebhook } from '../controllers/webhook.controller';

const router = Router();

// ⚠️ CRITICAL: use express.raw() for this route, NOT express.json()
// We need the raw bytes to verify the signature [citation:2][citation:3]
router.post(
  '/paystack',
  express.raw({ type: 'application/json' }),
  handlePaystackWebhook
);

export default router;