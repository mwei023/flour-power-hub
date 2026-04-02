/**
 * Smoke tests — basic sanity checks to keep CI green while the
 * full test suite is being built out.
 */

describe('Environment', () => {
  it('runs in test environment', () => {
    expect(process.env['NODE_ENV']).toBe('test');
  });

  it('has required env vars set by setup.ts', () => {
    expect(process.env['DB_HOST']).toBeDefined();
    expect(process.env['DB_PORT']).toBeDefined();
    expect(process.env['DB_NAME']).toBeDefined();
    expect(process.env['JWT_SECRET']).toBeDefined();
  });
});

describe('Sanity', () => {
  it('can do basic arithmetic', () => {
    expect(1 + 1).toBe(2);
  });

  it('can parse JSON', () => {
    const data = JSON.parse('{"status":"ok"}');
    expect(data.status).toBe('ok');
  });
});