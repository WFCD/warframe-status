import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ArsenalParser from '@wfcd/arsenal-parser';
import ProfileParser from '@wfcd/profile-parser';
import express from 'express';
import flatCache from 'flat-cache';

import settings from '../lib/settings.js';
import { cache, noResult } from '../lib/utilities.js';

const router = express.Router({ strict: true });

router.get('/:username/?', cache('1 minute'), async (req, res) => {
  const profileUrl = `${settings.wfApi.profile}?n=${encodeURIComponent(req.params.username)}`;
  const data = await fetch(profileUrl, { headers: { 'User-Agent': process.env.USER_AGENT || 'Node.js Fetch' } });
  if (data.status !== 200) noResult(res);

  return res.status(200).json(new ProfileParser(await data.json()));
});

let token;
const dirName = dirname(fileURLToPath(import.meta.url));

router.use((req, res, next) => {
  const tokenCache = flatCache.load('.twitch', resolve(dirName, '../../'));
  token = tokenCache.getKey('token');
  next();
});

router.get(`/:username/arsenal/?`, cache('1 hour'), async (req, res) => {
  const { id, api } = settings.wfApi.arsenal;

  /* istanbul ignore if */
  if (!token || token === 'unset') {
    return res.status(503).json({ code: 503, error: 'Service Unavailable' });
  }
  if (req.platform !== 'pc') return noResult(res);
  const profileUrl = `${api}?account=${encodeURIComponent(req.params.username.toLowerCase())}`;
  const data = await fetch(profileUrl, {
    headers: {
      'User-Agent': process.env.USER_AGENT || 'Node.js Fetch',
      Origin: `https://${id}.ext-twitch.tv`,
      Referer: `https://${id}.ext-twitch.tv`,
      Authorization: `Bearer ${token}`,
    },
  }).then((d) => d.json());
  /* istanbul ignore if */
  if (!data.accountInfo) {
    return noResult(res);
  }
  return res.status(200).json(new ArsenalParser(data));
});

export default router;
