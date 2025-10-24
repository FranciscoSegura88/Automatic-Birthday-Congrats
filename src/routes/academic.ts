import { Router } from 'express';
import { updateAcademic } from '../controllers/academic.js';

const router: Router = Router();

router.put('/:id', updateAcademic);

export default router;
