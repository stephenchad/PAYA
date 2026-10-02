import { Router } from 'express';
import { getBalance, fund, send, history } from '../controllers/wallet.controller';
import { authMiddleware } from '../middleware/auth';

import { initializePaystackFunding } from '../controllers/wallet.controller';

const router = Router();

// All wallet routes require auth
router.use(authMiddleware);

router.get('/balance', getBalance);
router.post('/fund', fund);
router.post('/send', send);
router.get('/transactions', history);
router.post('/paystack/initialize', initializePaystackFunding);

export default router;