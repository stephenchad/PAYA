import { Router } from 'express';
import { getBalance, fund, send, history } from '../controllers/wallet.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All wallet routes require auth
router.use(authMiddleware);

router.get('/balance', getBalance);
router.post('/fund', fund);
router.post('/send', send);
router.get('/transactions', history);

export default router;