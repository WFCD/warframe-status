import { EventEmitter } from 'node:events';

/**
 * Mock WorldState data for testing
 */
export const mockWorldStateData = {
  timestamp: new Date().toISOString(),
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
  sortie: { boss: 'Kela', faction: 'Grineer', variants: [] },
  nightwave: { active: true, phases: [] },
  arbitration: { id: 'test-arbitration', node: 'Test Node' },
  cambionCycle: { id: 'cambion', active: true },
  cetusCycle: { id: 'cetus', active: true },
  earthCycle: { id: 'earth', active: true },
  vallisCycle: { id: 'vallis', active: true },
  duviriCycle: { id: 'duviri', active: true },
  zarimanCycle: { id: 'zariman', active: true },
  simaris: { target: 'Test Target' },
  steelPath: { currentReward: 'test' },
  voidTrader: { active: false },
  vaultTrader: { active: false, inventory: [] },
  voidTraders: [],
  dailyDeals: [],
  darkSectors: [],
  flashSales: [],
  globalUpgrades: [],
  kuva: [],
  persistentEnemies: [],
  conclaveChallenges: [],
  archimedeas: [],
  weeklyChallenges: [],
  constructionProgress: { perrinSequence: 0 },
  calendar: { events: [] },
  buildLabel: 'test-build',
  faceoffBonus: { active: false },
  kinepage: { active: false },
  questToConquerCancer: { active: false },
  sentientOutposts: [],
  archonHunt: { active: false },
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
  emitTweet(packet: unknown): void {
    this.emit('tweet', packet);
  }

  emitRss(packet: unknown): void {
    this.emit('rss', packet);
  }

  emitWsUpdateEvent(packet: unknown): void {
    this.emit('ws:update:event', packet);
  }

  emitWsUpdateParsed(packet: unknown): void {
    this.emit('ws:update:parsed', packet);
  }
}
