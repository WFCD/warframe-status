# NestJS Test Suite

This directory contains comprehensive tests for the NestJS migration of Warframe Status API.

## Directory Structure

```
src/nest/test/
├── e2e/                          # End-to-end tests
│   ├── *.spec.ts                 # Unit tests (mocked dependencies)
│   └── *-integration.spec.ts     # Integration tests (real services)
├── hooks/
│   └── setup.hook.ts             # Global test setup and app initialization
├── mocks/
│   └── worldstate.mock.ts        # Mock WorldStateService for unit tests
└── env-setup.ts                  # Environment variable configuration
```

## Test Types

### Unit Tests (`*.spec.ts`)
- **Fast** execution (~20 seconds for full suite)
- **Mocked** external dependencies
- **Isolated** - no network calls
- **Reliable** - consistent results
- Run on every code change

**Examples**:
- `data.spec.ts` - Static data endpoints
- `drops.spec.ts` - Drops endpoint
- `socket-unit.spec.ts` - WebSocket with MockWorldStateService

### Integration Tests (`*-integration.spec.ts`)
- **Slower** execution (up to 5 minutes)
- **Real** external services
- **Network** dependent
- **Variable** results (external API availability)
- Run manually or in CI on main branch

**Examples**:
- `worldstate-integration.spec.ts` - Real worldstate data
- `socket-integration.spec.ts` - Real WebSocket connections
- `api-compatibility-integration.spec.ts` - NestJS vs Express comparison

## Running Tests

See [INTEGRATION_TESTING.md](../../../INTEGRATION_TESTING.md) for detailed instructions.

**Quick Reference**:
```bash
# Unit tests (default)
npm run test:nest

# Integration tests
npm run test:nest:integration

# All tests
npm run test:nest:all

# Watch mode (unit tests)
npm run test:nest:watch
```

## Writing Tests

### Unit Test Example

```typescript
import { expect } from 'chai';
import { getApp } from '../hooks/setup.hook';

describe('My Feature', () => {
  let nestApp: INestApplication;

  before(() => {
    nestApp = getApp();
  });

  it('should do something', async () => {
    const res = await request
      .execute(nestApp.getHttpServer())
      .get('/my-endpoint');
    
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('object');
  });
});
```

### Integration Test Example

```typescript
describe('My Feature (integration)', function () {
  before(function () {
    // Skip if external APIs not available
    if (process.env.SKIP_INTEGRATION === 'true') {
      this.skip();
    }
  });

  it('should work with real data', async function () {
    this.timeout(30000); // Longer timeout for external calls
    
    const res = await request
      .execute(nestApp.getHttpServer())
      .get('/my-endpoint');
    
    res.should.have.status(200);
  });
});
```

## Test Helpers

### Global Test App (`setup.hook.ts`)

All tests share a single NestJS app instance for performance:

```typescript
import { getApp } from '../hooks/setup.hook';

describe('Test Suite', () => {
  let nestApp: INestApplication;

  before(() => {
    nestApp = getApp(); // Get shared app instance
  });
});
```

### Mock Services (`mocks/`)

Use mocks for unit tests to avoid external dependencies:

```typescript
import { MockWorldStateService } from '../mocks/worldstate.mock';

// In test setup
const mockWorldState = new MockWorldStateService();
// ... use in test module
```

### Environment Setup (`env-setup.ts`)

Test environment variables are set globally before tests run:
- `USE_WORLDSTATE=true`
- `FEATURES=worldstate,SOCKET`
- `WS_EMITTER_FEATURES=rss,rivens,worldstate`
- `LOG_LEVEL=error`

## Current Test Coverage

### Unit Tests: ✅ 357 passing, 8 pending

**Coverage by Area**:
- ✅ Static Data (arcanes, mods, etc.) - 200+ tests
- ✅ Drops - 10 tests
- ✅ Heartbeat - 1 test
- ✅ Items/Weapons/Warframes - 30+ tests
- ✅ Rivens - 10 tests
- ✅ WebSocket (mocked) - 11 tests
- ✅ Twitter - 1 test
- ✅ WFInfo - 2 tests
- ⏭️ Profile - 8 pending (external API)
- ⏭️ Pricecheck - 5 tests

### Integration Tests: 📝 4 test files

- `socket-integration.spec.ts` - WebSocket with real data
- `worldstate-integration.spec.ts` - WorldState endpoints
- `rss-integration.spec.ts` - RSS feed
- `api-compatibility-integration.spec.ts` - Express vs NestJS comparison

## Best Practices

### DO ✅
- Use mocks for unit tests
- Set appropriate timeouts for integration tests
- Skip tests when dependencies unavailable
- Test both success and error cases
- Follow existing test patterns
- Use `chai.should()` for assertions

### DON'T ❌
- Call real external APIs in unit tests
- Commit commented-out tests
- Leave `this.only()` or `describe.only()` in code
- Ignore test failures
- Test implementation details

## Troubleshooting

### "Cannot find module" errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "expected '' to be an object" in integration tests
This means the external API didn't return data. Check:
- Network connectivity
- External API status
- Rate limiting

### Tests timing out
- Increase timeout in test: `this.timeout(60000)`
- Check if external APIs are responding
- Verify app initialization isn't hanging

### Decorator errors in LSP
These are TypeScript LSP warnings and don't affect test execution. Tests use `tsx` which handles decorators correctly.

## Migration Checklist

When migrating an Express endpoint to NestJS:

- [ ] Create controller with route handlers
- [ ] Create service with business logic
- [ ] Add unit tests with mocked services
- [ ] Verify all unit tests pass
- [ ] Add integration test (optional)
- [ ] Update this README if new test patterns introduced

## Related Documentation

- [INTEGRATION_TESTING.md](../../../INTEGRATION_TESTING.md) - Detailed integration test guide
- [MIGRATION_PLAN.md](../../../MIGRATION_PLAN.md) - Overall migration plan
- `.mocharc.nest.yaml` - Unit test configuration
- `.mocharc.integration.yaml` - Integration test configuration
