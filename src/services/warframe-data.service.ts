import { Injectable } from '@nestjs/common';
import wfData from 'warframe-worldstate-data';

export interface WarframeData {
  [key: string]: any;
  en: any;
  de: any;
  es: any;
  fr: any;
  it: any;
  ko: any;
  pl: any;
  pt: any;
  ru: any;
  zh: any;
  cs: any;
  sr: any;
  uk: any;
  arcanes: any[];
  archonShards: any;
  conclave: any;
  events: any;
  factions: any;
  fissureModifiers: any;
  languages: string[];
  missionTypes: any;
  operationTypes: any;
  persistentEnemy: any;
  solNodes: Record<string, any>;
  sortie: any;
  syndicates: any;
  tutorials: any[];
  upgradeTypes: any;
  synthTargets: any[];
  steelPath: any;
  locales: string[];
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
  getData(key: string, language: string = 'en'): any {
    // Some keys are language-specific (arcanes, solNodes, synthTargets)
    // Others are language-agnostic (tutorials)
    const langData = this.data[language];
    if (langData && langData[key]) {
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
  search(key: string, queries: string[], language: string = 'en'): any[] {
    const results: any[] = [];

    queries.forEach((query) => {
      const loweredQuery = query.toLowerCase();
      let value: any;

      switch (key) {
        case 'arcanes': {
          const arcanes = this.getData(key, language);
          const filtered = arcanes.filter(
            (arcane: any) =>
              new RegExp(arcane.regex).test(loweredQuery) ||
              arcane.name.toLowerCase().includes(loweredQuery),
          );
          value = filtered.length > 0 ? filtered : [];
          break;
        }

        case 'tutorials': {
          const tutorials = this.data.tutorials;
          const filtered = tutorials.filter(
            (tutorial: any) =>
              new RegExp(tutorial.regex).test(loweredQuery) ||
              tutorial.name.toLowerCase().includes(loweredQuery),
          );
          value = filtered.length > 0 ? filtered : [];
          break;
        }

        case 'solNodes': {
          const keyResults: string[] = [];
          const nodeResults: any[] = [];

          // Search by key
          this.solKeys.forEach((solKey) => {
            if (solKey.toLowerCase().includes(loweredQuery)) {
              keyResults.push(solKey);
            }
          });

          // Search by value (node name)
          this.solKeys.forEach((solKey) => {
            const node = this.data[language]?.solNodes?.[solKey];
            if (node && node.value?.toLowerCase().includes(loweredQuery)) {
              nodeResults.push(node);
            }
          });

          value = { keys: keyResults, nodes: nodeResults };
          break;
        }

        case 'synthTargets': {
          const synthTargets = this.getData(key, language);
          const filtered = synthTargets.filter((synth: any) =>
            synth.name.toLowerCase().includes(loweredQuery),
          );
          value = filtered;
          break;
        }

        default: {
          // Generic search for other keys
          const keyResults: any[] = [];
          const dataObj = this.data[language]?.[key] || this.data[key];

          if (dataObj && typeof dataObj === 'object') {
            Object.keys(dataObj).forEach((selectedDataKey) => {
              if (selectedDataKey.toLowerCase().includes(loweredQuery)) {
                keyResults.push(dataObj[selectedDataKey]);
              }
            });
          }

          value = keyResults;
          break;
        }
      }

      if (value) {
        if (key === 'solNodes') {
          // For solNodes, merge results
          if (results.length > 0 && results[0].keys && results[0].nodes) {
            results[0].keys = results[0].keys.concat(value.keys);
            results[0].nodes = results[0].nodes.concat(value.nodes);
          } else {
            results.push(value);
          }
        } else {
          results.push(...(Array.isArray(value) ? value : [value]));
        }
      }
    });

    // Deduplicate solNodes results
    if (key === 'solNodes' && results.length > 0 && results[0].keys) {
      results[0] = {
        keys: Array.from(new Set(results[0].keys)),
        nodes: Array.from(new Set(results[0].nodes)),
      };
    }

    return results;
  }
}
