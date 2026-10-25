import { PriceCheckService } from '@nest/services/pricecheck.service';
import { parsePriceCheckUserAgent } from '@nest/utils/parsePriceCheckOptions';
import { expect } from 'chai';

import type { LoggerService } from '../../services/logger.service';

const GENESIS_UA =
  'genesis/3.1.12 (+https://genesis.warframestat.us; https://github.com/WFCD/genesis)';

const logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
  log() {},
} as unknown as LoggerService;

describe('pricecheck UA', () => {
  const previous = process.env.MARKET_USER_AGENT;
  let service: PriceCheckService | undefined;

  after(async () => {
    if (service) {
      await service.querierFor().stopUpdating();
      await service.querierFor(GENESIS_UA).stopUpdating();
    }
    if (previous === undefined) delete process.env.MARKET_USER_AGENT;
    else process.env.MARKET_USER_AGENT = previous;
  });

  it('keeps a genesis-style UA query value', () => {
    expect(parsePriceCheckUserAgent(GENESIS_UA)).to.equal(GENESIS_UA);
    expect(parsePriceCheckUserAgent(`  ${GENESIS_UA}  `)).to.equal(GENESIS_UA);
    expect(parsePriceCheckUserAgent([GENESIS_UA, 'other'])).to.equal(
      GENESIS_UA,
    );
  });

  it('drops empty and header-unsafe UA values', () => {
    expect(parsePriceCheckUserAgent(undefined)).to.equal(undefined);
    expect(parsePriceCheckUserAgent('   ')).to.equal(undefined);
    expect(parsePriceCheckUserAgent(`bad\nUA`)).to.equal(undefined);
    expect(parsePriceCheckUserAgent('x'.repeat(257))).to.equal(undefined);
  });

  it('feeds UA into warframe-nexus-query and leaves the env unchanged', () => {
    delete process.env.MARKET_USER_AGENT;
    service = new PriceCheckService(logger);
    const custom = service.querierFor(GENESIS_UA);

    expect(custom.settings.userAgent).to.equal(GENESIS_UA);
    expect(process.env.MARKET_USER_AGENT).to.equal(undefined);
    expect(service.querierFor().settings.userAgent).to.not.equal(GENESIS_UA);
    expect(service.querierFor(GENESIS_UA)).to.equal(custom);
  });
});
