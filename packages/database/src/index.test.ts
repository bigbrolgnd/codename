import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseManager } from './index';
import * as fs from 'fs';

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

vi.mock('fs', () => {
  return {
    readFileSync: vi.fn(),
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

  it('runs migrations in a specific schema', async () => {
    vi.mocked(fs.readFileSync).mockReturnValue('CREATE TABLE test (id int);');

    await dbManager.runMigrations('tenant_789');

    expect(mClient.query).toHaveBeenCalledWith('SET search_path TO tenant_789');
    expect(mClient.query).toHaveBeenCalledWith('CREATE TABLE test (id int);', []);
    expect(mClient.query).toHaveBeenCalledWith('SET search_path TO public');
  });

  it('fails to query reviews table before migration', async () => {
    // Mock failure for non-existent table
    mClient.query.mockRejectedValueOnce(new Error('relation "reviews" does not exist'));

    await expect(dbManager.queryInSchema('tenant_test', 'SELECT * FROM reviews'))
      .rejects.toThrow('relation "reviews" does not exist');
  });

  it('runs the reviews migration', async () => {
    vi.mocked(fs.readFileSync).mockReturnValue('CREATE TABLE reviews (id int);');

    await dbManager.runMigrations('tenant_abc', '004_reviews_init.sql');

    expect(mClient.query).toHaveBeenCalledWith('SET search_path TO tenant_abc');
    expect(mClient.query).toHaveBeenCalledWith('CREATE TABLE reviews (id int);', []);
  });
});