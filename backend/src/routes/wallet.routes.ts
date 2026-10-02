import { Router } from 'express';
import { getBalance, send, history, initializePaystackFunding } from '../controllers/wallet.controller';
import { authMiddleware } from '../middleware/auth';



const router = Router();

// All wallet routes require auth
router.use(authMiddleware);

router.get('/balance', getBalance);
router.post('/send', send);
router.get('/transactions', history);
router.post('/paystack/initialize', initializePaystackFunding);

export default router;