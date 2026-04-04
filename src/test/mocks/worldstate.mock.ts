import { EventEmitter } from 'events';

/**
 * Mock WorldState data for testing
 */
export const mockWorldStateData = {
  timestamp: Date.now(),
  news: [],
  events: [],
  alerts: [
    {
      id: 'test-alert-1',
      activation: new Date().toISOString(),
      expiry: new Date(Date.now() + 3600000).toISOString(),
      mission: {
        node: 'Test Node',
        type: 'Test Mission',
        faction: 'Test Faction',
      },
    },
  ],
  invasions: [
    {
      id: 'test-invasion-1',
      activation: new Date().toISOString(),
      attacker: { faction: 'Grineer' },
      defender: { faction: 'Corpus' },
    },
  ],
  syndicateMissions: [],
  fissures: [],
  sortie: null,
  nightwave: null,
};

/**
 * Mock Twitter data for testing
 */
export const mockTwitterData = [
  {
    id: 'test-tweet-1',
    text: 'Test tweet content',
    created_at: new Date().toISOString(),
    user: {
      screen_name: 'TestUser',
    },
  },
];

/**
 * Mock RSS data for testing
 */
export const mockRssData = [
  {
    title: 'Test RSS Item',
    link: 'https://example.com/test',
    pubDate: new Date().toISOString(),
    guid: 'test-rss-1',
  },
];

/**
 * Mock WorldStateService for testing
 */
export class MockWorldStateService extends EventEmitter {
  private initialized = true;

  getWorldstate(_language: string): unknown {
    if (!this.initialized) {
      throw new Error('WorldState emitter not initialized');
    }
    return mockWorldStateData;
  }

  async getTwitter(): Promise<unknown> {
    if (!this.initialized) {
      throw new Error('WorldState emitter not initialized');
    }
    return mockTwitterData;
  }

  getRss(): unknown {
    if (!this.initialized) {
      throw new Error('WorldState emitter not initialized');
    }
    return mockRssData;
  }

  getEmitter(): EventEmitter {
    return this;
  }

  // Helper methods for testing event broadcasting
  emitTweet(packet: any): void {
    this.emit('tweet', packet);
  }

  emitRss(packet: any): void {
    this.emit('rss', packet);
  }

  emitWsUpdateEvent(packet: any): void {
    this.emit('ws:update:event', packet);
  }

  emitWsUpdateParsed(packet: any): void {
    this.emit('ws:update:parsed', packet);
  }
}
