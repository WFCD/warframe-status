import ProfileParser from '@wfcd/profile-parser';
import express from 'express';

import { cache, noResult } from '../lib/utilities.js';

const router = express.Router({ strict: true });
const WF_PROFILE_API = 'https://content.warframe.com/dynamic/getProfileViewingData.php';

router.get('/:username/?', cache('1 hour'), async (req, res) => {
  const profileUrl = `${WF_PROFILE_API}?n=${encodeURIComponent(req.params.username)}`;
  const data = await fetch(profileUrl, { headers: { 'User-Agent': process.env.USER_AGENT || 'Node.js Fetch' } });
  if (data.status !== 200) noResult(res);

  return res.status(200).json(new ProfileParser(await data.json()));
});

export default router;
