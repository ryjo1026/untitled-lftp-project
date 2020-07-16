import express from 'express';
import * as path from 'path';

const router = express.Router();

router.get('/api', (req, res) => {
  res.json({ hello: 'api' });
});

router.get('*', (req, res) => {
  res.sendFile(`${path.resolve('./')}/dist/index.html`);
});

export default router;
