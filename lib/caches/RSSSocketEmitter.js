'use strict';

const EventEmitter = require('events');
const RssFeedEmitter = require('rss-feed-emitter');

const feeds = require('../resources/rssFeeds.json');

class RSSSocketEmitter extends EventEmitter {
  constructor(logger = console) {
    super();

    this.logger = logger;

    this.feeder = new RssFeedEmitter({ userAgent: 'WFCD Feed Notifier' });

    feeds.forEach((feed) => {
      this.feeder.add({ url: feed.url, timeout: 30000 });
    });

    this.logger.info('RSS Feed active');

    this.start = Date.now();

    this.feeder.on('error', this.logger.error);

    this.feeder.on('new-item', (item) => {
      try {
        if (Object.keys(item.image).length) {
          this.logger.debug(JSON.stringify(item.image));
        }

        if (new Date(item.pubDate).getTime() > this.start) {
          const feed = feeds.filter(feedEntry => feedEntry.url === item.meta.link)[0];
          let firstImg = ((item.description || '').match(/<img.*src="(.*)".*>/i) || [])[1];
          if (!firstImg) {
            firstImg = feed.defaultAttach;
          } else if (firstImg.startsWith('//')) {
            firstImg = firstImg.replace('//', 'https://');
          }

          const rssSummary = {
            body: (item.description || '\u200B').replace(/<(?:.|\n)*?>/gm, '').replace(/\n\n+\s*/gm, '\n\n'),
            url: item.link,
            timestamp: item.pubDate,
            description: item.meta.description,
            author: feed.author || {
              name: 'Warframe Forums',
              url: item['rss:link']['#'],
              icon_url: 'https://i.imgur.com/hE2jdpv.png',
            },
            title: item.title,
            image: firstImg,
            key: feed.key,
          };
          this.emit('new-rss', rssSummary);
        }
      } catch (error) {
        this.logger.error(error);
      }
    });
  }
}

module.exports = RSSSocketEmitter;
