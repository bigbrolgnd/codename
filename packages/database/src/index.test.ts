import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseManager } from './index';

const mClient = {
  query: vi.fn(),
  release: vi.fn(),
};

const mPool = {
  connect: vi.fn(() => Promise.resolve(mClient)),
  query: vi.fn(),
  end: vi.fn(),
};

vi.mock('pg', () => {
  return {
    Pool: vi.fn().mockImplementation(function() {
      return mPool;
    }),
  };
});

describe('DatabaseManager', () => {
  let dbManager: DatabaseManager;

  beforeEach(() => {
    vi.clearAllMocks();
    dbManager = new DatabaseManager();
  });

  it('creates a tenant schema safely', async () => {
    await dbManager.createTenantSchema('tenant_123');
    expect(mClient.query).toHaveBeenCalledWith('CREATE SCHEMA IF NOT EXISTS tenant_123');
  });

  it('throws error for invalid schema name', async () => {
    await expect(dbManager.createTenantSchema('invalid-schema; DROP TABLE users;'))
      .rejects.toThrow('Invalid schema name');
  });

  it('sets search path and executes query in schema', async () => {
    await dbManager.queryInSchema('tenant_456', 'SELECT * FROM services');
    
    expect(mClient.query).toHaveBeenCalledWith('SET search_path TO tenant_456');
    expect(mClient.query).toHaveBeenCalledWith('SELECT * FROM services', []);
    expect(mClient.query).toHaveBeenCalledWith('SET search_path TO public');
  });
});