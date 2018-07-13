'use strict';

const snek = require('snekfetch');
const Route = require('../Route.js');

const base = 'http://xenogelion.com/Hidden/content_creator_scraper.php';

class TennoTv extends Route {
  async handle(req, res, option) {
    this.logger.log('silly', `Got ${req.originalUrl} | Option: ${option}`);

    if (option === 'get') {
      switch (req.query.method) {
        case 'get-watched-videos-list':
          await this.getWatchedVideos(req, res);
          break;
        case 'get-videos-list':
        default:
          await this.getNewVideos(req, res);
          break;
      }
    }
    if (option === 'post') {
      const { body } = req;
      if (body && body.method) {
        switch (body.method) {
          case 'add-watcher-history':
            await this.addWatcherHistory(req, res);
            break;
          default:
            break;
        }
      } else if (req.query.method) {
        switch (req.query.method) {
          case 'add-watcher-history':
            await this.addWatcherHistory(req, res);
            break;
          default:
            break;
        }
      } else {
        res.status(500);
        this.setHeadersAndJson(res, { message: 'Error parsing post body.' });
      }
    }
    if (option === 'delete') {
      switch (req.query.method) {
        case 'delete-watched-videos-list':
          await this.deleteWatcherHistory(req, res);
          break;
        default:
          res.status(404);
          this.setHeadersAndJson(res, { message: 'No such method' });
          break;
      }
    }
  }

  async getNewVideos(req, res) {
    const opts = [
      'method=get-videos-list',
      `included_tags=${req.query.included_tags || ''}`,
      `excluded_video_ids=${req.query.excluded_video_ids || ''}`,
      `user_token=${req.query.token}`,
    ];
    const url = `${base}?${opts.join('&')}`;
    try {
      const snekRes = JSON.parse((await snek.get(url, { headers: { 'content-type': 'application/json' } })).body.toString());
      this.setHeadersAndJson(res, snekRes);
    } catch (e) {
      this.logger.log('error', e);
      res.status(500);
      this.setHeadersAndJson(res, { message: 'Error fetching next videso.' });
    }
  }

  async getWatchedVideos(req, res) {
    const opts = [
      'method=get-history-list',
      `user_token=${req.query.token}`,
    ];
    const url = `${base}?${opts.join('&')}`;
    try {
      const snekRes = JSON.parse((await snek.get(url,
        { headers: { 'content-type': 'application/json' } })).body.toString());
      this.setHeadersAndJson(res, snekRes);
    } catch (e) {
      this.logger.log('error', e);
      res.status(500);
      this.setHeadersAndJson(res, { message: 'Error fetching watcher history.' });
    }
  }

  async addWatcherHistory(req, res) {
    const { body } = req;
    if (!body.token && !req.query.token) {
      res.status(403);
      this.setHeadersAndJson(res, { message: 'No user token provided.' });
      return;
    }

    if (!body.video_id && !req.query.video_id) {
      res.status(403);
      this.setHeadersAndJson(res, { message: 'No video id provided.' });
      return;
    }
    const opts = [
      'method=add-watcher-history',
      `user_token=${body.token || req.query.token}`,
      `video_id=${body.video_id || req.query.video_id}`,
      `secret_token=${process.env.VIDEO_API_TOKEN}`,
    ];
    const url = `${base}?${opts.join('&')}`;
    try {
      this.logger.log('error', `Posting: ${url}`);
      const snekRes = JSON.parse((await snek.get(url,
        { headers: { 'content-type': 'application/json' } })).body.toString());
      this.logger.log('error', `Returned: ${JSON.stringify(snekRes)}`);
      this.setHeadersAndJson(res, snekRes);
    } catch (e) {
      this.logger.log('error', e.type === 'Buffer' ? e.string : e.toString());
      res.status(500);
      this.setHeadersAndJson(res, { message: 'Error adding to watcher history.' });
    }
  }

  async deleteWatcherHistory(req, res) {
    const opts = [
      'method=delete-watched-videos-list',
      `user_token=${req.query.token}`,
      `secret_token=${process.env.VIDEO_API_TOKEN}`,
    ];
    const url = `${base}?${opts.join('&')}`;
    try {
      const snekRes = JSON.parse((await snek.get(url, { headers: { 'content-type': 'application/json' } })).body.toString());
      this.setHeadersAndJson(res, snekRes);
    } catch (e) {
      this.logger.log('error', e);
      res.status(500);
      this.setHeadersAndJson(res, { message: 'Error deleting from watcher history.' });
    }
  }
}

module.exports = TennoTv;
