import express from 'express';

const router = express.Router();
router.get('/', (_req, res) => {
  res.status(200).json({ message: 'Success', code: 200 });
});

export default router;
