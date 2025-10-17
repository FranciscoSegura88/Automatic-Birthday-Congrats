import { Router } from 'express';
import { createCongratsPDF } from '../controllers/congrats.js';

const router: Router = Router();

router.post('/', createCongratsPDF);

export default router;
