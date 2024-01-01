import express from 'express';
import { worldState } from '../lib/utilities.js';

const router = express.Router();
router.get('/', (req, res) => {
  res.json(worldState.getRss());
});
export default router;
