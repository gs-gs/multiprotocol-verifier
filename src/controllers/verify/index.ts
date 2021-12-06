import express, { Router } from 'express';

import verifyFile from './verifyFile';
import verifyJson from './verifyJson';

const router = Router();

router.post('/file', verifyFile);
router.post('/json', verifyJson);

export default router;
