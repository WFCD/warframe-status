import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ArsenalParser from '@wfcd/arsenal-parser';
import express from 'express';
import flatCache from 'flat-cache';
import Profile from '@wfcd/profile-parser/Profile';
import Stats from '@wfcd/profile-parser/Stats';
import XpInfo from '@wfcd/profile-parser/XpInfo';

import { cache, noResult } from '../lib/utilities.js';
import settings from '../lib/settings.js';

const router = express.Router({ strict: true });

const get = async (username) => {
  const profileUrl = `${settings.wfApi.profile}?n=${encodeURIComponent(username)}`;
  const data = await fetch(profileUrl, { headers: { 'User-Agent': process.env.USER_AGENT || 'Node.js Fetch' } });

  if (data.status !== 200) return undefined;

  return data.json();
};

router.get('/:username/?', cache('1 hour'), async (req, res) => {
  const profile = await get(req.params.username);
  if (!profile) return noResult(res);

  return res.status(200).json(new Profile(profile.Results[0]));
});

router.get('/:username/xpInfo/?', cache('1 hour'), async (req, res) => {
  const data = await get(req.params.username);
  if (!data) return noResult(res);

  const xpInfo = data.Results[0].LoadOutInventory.XPInfo.map((xp) => new XpInfo(xp));
  return res.status(200).json(xpInfo);
});

router.get('/:username/stats/?', cache('1 hour'), async (req, res) => {
  const data = await get(req.params.username);
  if (!data) return noResult(res);

  return res.status(200).json(new Stats(data.Stats));
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
