'use strict';

const Route = require('../Route.js');
const snek = require('snekfetch');

const base = 'http://xenogelion.com/Hidden/content_creator_scraper.php';

class Search extends Route {
  async handle(req, res) {
    this.logger.log('error', `Got ${req.originalUrl}`);
    const opts = [
      'method=get-videos-list',
      `included_tags=${req.query.included_tags || ''}`,
      `excluded_video_ids=${req.query.excluded_video_ids || ''}`,
    ];
    const url = `${base}?${opts.join('&')}`;
    try {
      const snekRes = JSON.parse((await snek.get(url, { headers: { 'content-type': 'application/json' } })).body.toString());
      this.logger.log('debug', `Get Tenno.Tv videos: ${url}`);
      this.setHeadersAndJson(res, snekRes);
    } catch (e) {
      this.logger.log('error', e);
    }
  }
}

module.exports = Search;
