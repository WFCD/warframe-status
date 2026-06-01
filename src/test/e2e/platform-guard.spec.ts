import {
  asPlatform,
  isPlatform,
  PlatformGuard,
} from '@nest/guards/platform.guard';
import type { ExecutionContext } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { expect } from 'chai';

describe('PlatformGuard', () => {
  it('isPlatform should accept valid platform strings', () => {
    expect(isPlatform('pc')).to.equal(true);
    expect(isPlatform('PS4')).to.equal(true);
    expect(isPlatform('invalid')).to.equal(false);
    expect(isPlatform(42)).to.equal(false);
  });

  it('asPlatform should normalize valid platforms', () => {
    expect(asPlatform('xb1')).to.equal('xb1');
    expect(asPlatform('unknown')).to.equal(undefined);
  });

  it('should allow valid platform params', () => {
    const guard = new PlatformGuard();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ params: { platform: 'pc' } }),
      }),
    } as ExecutionContext;

    expect(guard.canActivate(context)).to.equal(true);
  });

  it('should reject invalid platform params', () => {
    const guard = new PlatformGuard();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ params: { platform: 'not-a-platform' } }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(context)).to.throw(NotFoundException);
  });
});
