import { type Request, type Response } from 'express';
import Academic from '../models/academic.js';

export async function updateAcademic(req: Request, res: Response) {
  const { id } = req.params;
  const { body } = req;

  const academic = await Academic.findByPk(Number(id));

  if (!academic) {
    return res.status(404).json({ message: 'Academic not found' });
  }

  await academic.update(body);

  res.status(200).json({ message: 'Academic updated successfully', academic });
}
