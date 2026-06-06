import { Injectable } from '@nestjs/common';
import wfData from 'warframe-worldstate-data';

export interface WarframeData {
  [key: string]: unknown;
  en: Record<string, unknown>;
  de: Record<string, unknown>;
  es: Record<string, unknown>;
  fr: Record<string, unknown>;
  it: Record<string, unknown>;
  ko: Record<string, unknown>;
  pl: Record<string, unknown>;
  pt: Record<string, unknown>;
  ru: Record<string, unknown>;
  zh: Record<string, unknown>;
  cs: Record<string, unknown>;
  sr: Record<string, unknown>;
  uk: Record<string, unknown>;
  arcanes: SearchableItem[];
  archonShards: unknown;
  conclave: unknown;
  events: unknown;
  factions: unknown;
  fissureModifiers: unknown;
  languages: string[];
  missionTypes: unknown;
  operationTypes: unknown;
  persistentEnemy: unknown;
  solNodes: Record<string, SolNodeItem>;
  sortie: unknown;
  syndicates: unknown;
  tutorials: SearchableItem[];
  upgradeTypes: unknown;
  synthTargets: NamedItem[];
  steelPath: unknown;
  locales: string[];
}

interface NamedItem {
  name: string;
}

interface SearchableItem extends NamedItem {
  regex: string;
}

interface SolNodeItem {
  value?: string;
}

/**
 * Service for accessing static Warframe data from warframe-worldstate-data package
 */
@Injectable()
export class WarframeDataService {
  private readonly data: WarframeData;
  private readonly dataKeys: string[];
  private readonly solKeys: string[];
  private readonly languages: string[];

  constructor() {
    // Import warframe-worldstate-data
    this.data = wfData as unknown as WarframeData;

    // Get all data keys (excluding weapons and warframes as per Express implementation)
    this.dataKeys = Object.keys(this.data);

    // Get sol node keys
    this.solKeys = Object.keys(this.data.solNodes);

    // Get supported languages
    this.languages = this.data.locales;
  }

  /**
   * Get all available data keys
   */
  getDataKeys(): string[] {
    return this.dataKeys;
  }

  /**
   * Get all sol node keys
   */
  getSolKeys(): string[] {
    return this.solKeys;
  }

  /**
   * Get supported languages
   */
  getLanguages(): string[] {
    return this.languages;
  }

  /**
   * Get data for a specific key and language
   */
  getData(key: string, language: string = 'en'): unknown {
    // Some keys are language-specific (arcanes, solNodes, synthTargets)
    // Others are language-agnostic (tutorials)
    const langData = this.data[language] as Record<string, unknown> | undefined;
    if (langData?.[key]) {
      return langData[key];
    }
    return this.data[key];
  }

  /**
   * Normalize a key to match the correct case from dataKeys
   */
  normalizeKey(key: string): string {
    const lowerKey = key.toLowerCase();
    const matchedKey = this.dataKeys.find(
      (dKey) => dKey.toLowerCase() === lowerKey,
    );
    return matchedKey || key;
  }

  /**
   * Search data by key and query
   */
  search(key: string, queries: string[], language: string = 'en'): unknown[] {
    const results: unknown[] = [];

    queries.forEach((query) => {
      const loweredQuery = query.toLowerCase();
      let value: unknown;

      switch (key) {
        case 'arcanes': {
          const arcanes = this.getData(key, language) as SearchableItem[];
          const filtered = arcanes.filter(
            (arcane) =>
              new RegExp(arcane.regex).test(loweredQuery) ||
              arcane.name.toLowerCase().includes(loweredQuery),
          );
          value = filtered.length > 0 ? filtered : [];
          break;
        }

        case 'tutorials': {
          const tutorials = this.data.tutorials;
          const filtered = tutorials.filter(
            (tutorial) =>
              new RegExp(tutorial.regex).test(loweredQuery) ||
              tutorial.name.toLowerCase().includes(loweredQuery),
          );
          value = filtered.length > 0 ? filtered : [];
          break;
        }

        case 'solNodes': {
          const keyResults: string[] = [];
          const nodeResults: SolNodeItem[] = [];

          // Search by key
          this.solKeys.forEach((solKey) => {
            if (solKey.toLowerCase().includes(loweredQuery)) {
              keyResults.push(solKey);
            }
          });

          // Search by value (node name)
          this.solKeys.forEach((solKey) => {
            const langData = this.data[language] as
              | Record<string, unknown>
              | undefined;
            const solNodes = langData?.solNodes as
              | Record<string, SolNodeItem>
              | undefined;
            const node = solNodes?.[solKey];
            if (node?.value?.toLowerCase().includes(loweredQuery)) {
              nodeResults.push(node);
            }
          });

          value = { keys: keyResults, nodes: nodeResults };
          break;
        }

        case 'synthTargets': {
          const synthTargets = this.getData(key, language) as NamedItem[];
          const filtered = synthTargets.filter((synth) =>
            synth.name.toLowerCase().includes(loweredQuery),
          );
          value = filtered;
          break;
        }

        default: {
          // Generic search for other keys
          const keyResults: unknown[] = [];
          const langData = this.data[language] as
            | Record<string, unknown>
            | undefined;
          const dataObj = langData?.[key] ?? this.data[key];

          if (dataObj && typeof dataObj === 'object') {
            Object.keys(dataObj as Record<string, unknown>).forEach(
              (selectedDataKey) => {
                if (selectedDataKey.toLowerCase().includes(loweredQuery)) {
                  keyResults.push(
                    (dataObj as Record<string, unknown>)[selectedDataKey],
                  );
                }
              },
            );
          }

          value = keyResults;
          break;
        }
      }

      if (value) {
        if (key === 'solNodes') {
          const solNodeValue = value as {
            keys: string[];
            nodes: SolNodeItem[];
          };
          // For solNodes, merge results
          if (
            results.length > 0 &&
            typeof results[0] === 'object' &&
            results[0] !== null &&
            'keys' in results[0] &&
            'nodes' in results[0]
          ) {
            const existing = results[0] as {
              keys: string[];
              nodes: SolNodeItem[];
            };
            existing.keys = existing.keys.concat(solNodeValue.keys);
            existing.nodes = existing.nodes.concat(solNodeValue.nodes);
          } else {
            results.push(value);
          }
        } else {
          results.push(...(Array.isArray(value) ? value : [value]));
        }
      }
    });

    // Deduplicate solNodes results
    if (
      key === 'solNodes' &&
      results.length > 0 &&
      typeof results[0] === 'object' &&
      results[0] !== null &&
      'keys' in results[0]
    ) {
      const solNodeResults = results[0] as {
        keys: string[];
        nodes: SolNodeItem[];
      };
      results[0] = {
        keys: Array.from(new Set(solNodeResults.keys)),
        nodes: Array.from(new Set(solNodeResults.nodes)),
      };
    }

    return results;
  }
}
