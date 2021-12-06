import { Router } from 'express';

import verifyController from './controllers/verify';

const router = Router();

router.use('/verify', verifyController);

export default router;
