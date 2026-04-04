import { Inject, Injectable } from '@nestjs/common';
import ArsenalParser from '@wfcd/arsenal-parser';
import Profile from '@wfcd/profile-parser/Profile';
import Stats from '@wfcd/profile-parser/Stats';
import XpInfo from '@wfcd/profile-parser/XpInfo';
import type { TwitchCacheService } from './twitch-cache.service';

interface ProfileData {
  Results: Array<{
    LoadOutInventory: {
      XPInfo: unknown[];
    };
    [key: string]: unknown;
  }>;
  Stats: unknown;
}

interface ArsenalData {
  accountInfo: unknown;
  [key: string]: unknown;
}

/**
 * Service for fetching and parsing player profile data
 */
@Injectable()
export class ProfileService {
  private readonly profileUrl: string;
  private readonly arsenalApi: string;
  private readonly arsenalId: string;
  private readonly userAgent: string;

  constructor(
    @Inject('TWITCH_CACHE_SERVICE')
    private readonly twitchCacheService: TwitchCacheService,
  ) {
    this.profileUrl =
      'https://content.warframe.com/dynamic/getProfileViewingData.php';
    this.arsenalApi =
      'https://content.warframe.com/dynamic/twitch/getActiveLoadout.php';
    this.arsenalId = 'ud1zj704c0eb1s553jbkayvqxjft97';
    this.userAgent = process.env.USER_AGENT || 'Node.js Fetch';
  }

  /**
   * Fetch profile data from Warframe API
   */
  async getProfileData(playerId: string): Promise<ProfileData | undefined> {
    const url = `${this.profileUrl}?playerId=${encodeURIComponent(playerId)}`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
      });

      if (response.status !== 200) {
        return undefined;
      }

      return response.json();
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Get full profile for a player
   */
  async getProfile(
    playerId: string,
    language: string = 'en',
    withItem: boolean = false,
  ): Promise<Profile | undefined> {
    const data = await this.getProfileData(playerId);

    if (!data || !data.Results || data.Results.length === 0) {
      return undefined;
    }

    return new Profile(data.Results[0] as any, language as any, withItem);
  }

  /**
   * Get XP info for a player
   */
  async getXpInfo(
    playerId: string,
    withItem: boolean = false,
  ): Promise<XpInfo[] | undefined> {
    const data = await this.getProfileData(playerId);

    if (!data || !data.Results || data.Results.length === 0) {
      return undefined;
    }

    const xpInfo = data.Results[0].LoadOutInventory.XPInfo.map(
      (xp: any) => new XpInfo(xp, withItem as any),
    );

    return xpInfo;
  }

  /**
   * Get stats for a player
   */
  async getStats(playerId: string): Promise<Stats | undefined> {
    const data = await this.getProfileData(playerId);

    if (!data || !data.Stats) {
      return undefined;
    }

    return new Stats(data.Stats as any);
  }

  /**
   * Get arsenal data from Twitch API
   */
  async getArsenal(
    username: string,
    platform: string = 'pc',
  ): Promise<ArsenalParser | undefined> {
    // Arsenal is only available for PC
    if (platform !== 'pc') {
      return undefined;
    }

    // Need Twitch token
    const token = await this.twitchCacheService.getToken();
    if (!token) {
      throw new Error('Twitch token not available');
    }

    const url = `${this.arsenalApi}?account=${encodeURIComponent(username.toLowerCase())}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          Origin: `https://${this.arsenalId}.ext-twitch.tv`,
          Referer: `https://${this.arsenalId}.ext-twitch.tv`,
          Authorization: `Bearer ${token}`,
        },
      });

      const data: ArsenalData = await response.json();

      if (!data.accountInfo) {
        return undefined;
      }

      const parser = new ArsenalParser();
      return parser.parseClipboard(JSON.stringify(data));
    } catch (error) {
      return undefined;
    }
  }
}
