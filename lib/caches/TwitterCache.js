'use strict';

const EventEmitter = require('events');
const Twitter = require('twitter');
const toWatch = require('../resources/tweeters.json');

const { logger } = require('../utilities');

const determineTweetType = (tweet) => {
  if (tweet.in_reply_to_status_id) {
    return ('reply');
  }
  if (tweet.quoted_status_id) {
    return ('quote');
  }
  if (tweet.retweeted_status) {
    return ('retweet');
  }
  return ('tweet');
};

/**
 * Twitter event emitter
 * @extends EventEmitter
 */
class TwitterCache extends EventEmitter {
  constructor() {
    super();
    this.timeout = process.env.TWITTER_TIMEOUT || 60000;
    this.initTime = Date.now();

    const clientInfo = {
      consumer_key: process.env.TWITTER_KEY,
      consumer_secret: process.env.TWITTER_SECRET,
      bearer_token: process.env.TWITTER_BEARER_TOKEN,
    };

    this.clientInfoValid = true;

    if (!(clientInfo.consumer_key
      && clientInfo.consumer_secret
      && clientInfo.bearer_token)) {
      this.clientInfoValid = false;
    }
    try {
      if (this.clientInfoValid) {
        this.client = new Twitter(clientInfo);

        // don't attempt anything else if authentication fails
        this.toWatch = toWatch;
        this.currentData = null;
        this.lastUpdated = Date.now() - 60000;
        this.updateInterval = setInterval(() => this.update(), this.timeout);
        this.update();
      }
    } catch (err) {
      this.client = undefined;
      logger.error(err);
    }
  }

  async update() {
    if (!this.clientInfoValid) return undefined;

    if (!this.toWatch) {
      logger.debug('Not processing twitter, no data to watch.');
      return undefined;
    }

    if (!this.client) {
      logger.debug('Not processing twitter, no client to connect.');
      return undefined;
    }

    this.updating = new Promise(async (resolve) => {
      logger.debug('Starting Twitter update...');
      const parsedData = [];
      try {
        for (const watchable of this.toWatch) {
          const tweets = await this.client.get('statuses/user_timeline', {
            screen_name: watchable.acc_name,
            tweet_mode: 'extended',
            count: 1,
          });
          const [tweet] = tweets;

          const type = determineTweetType(tweet);
          const parsedTweet = {
            id: `twitter.${watchable.plain}.${type}`,
            uniqueId: String(tweets[0].id_str),
            text: tweet.full_text,
            url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
            mediaUrl: tweet.entities.media ? tweet.entities.media[0].media_url : undefined,
            isReply: typeof tweet.in_reply_to_status_id !== 'undefined',
            author: {
              name: tweet.user.name,
              handle: tweet.user.screen_name,
              url: `https://twitter.com/${tweet.user.screen_name}`,
              avatar: `${tweet.user.profile_image_url.replace('_normal.jpg', '.jpg')}`,
            },
            quote: tweet.quoted_status
              ? {
                text: tweet.quoted_status.full_text,
                author: {
                  name: tweet.quoted_status.user.name,
                  handle: tweet.quoted_status.user.screen_name,
                },
              }
              : undefined,
            retweet: tweet.retweeted_status
              ? {
                text: tweet.retweeted_status.full_text,
                author: {
                  name: tweet.retweeted_status.user.name,
                  handle: tweet.retweeted_status.user.screen_name,
                },
              }
              : undefined,
            createdAt: new Date(tweet.created_at),
            tweets,
          };
          parsedData.push(parsedTweet);

          if (parsedTweet.createdAt.getTime() > this.lastUpdated) {
            this.emit('tweet', parsedTweet);
          }
        }
      } catch (error) {
        logger.debug(error);
      }
      this.lastUpdated = Date.now();
      resolve(parsedData);
    });

    return this.updating;
  }

  async getData() {
    if (!this.clientInfoValid) return undefined;

    if (this.updating) {
      return this.updating;
    }
    return this.currentData;
  }
}

module.exports = new TwitterCache();
