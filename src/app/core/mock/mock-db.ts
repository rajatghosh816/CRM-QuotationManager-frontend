import { createSeedData, MockDatabase } from './seed-data';

const STORAGE_KEY = 'crmqm.mockdb.v1';

/**
 * In-memory database for the mock backend. Changes are saved to localStorage
 * so the demo survives a page reload; `reset()` restores the seed data.
 */
class MockDb {
  data: MockDatabase = this.load();

  private load(): MockDatabase {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as MockDatabase;
    } catch {
      /* storage unavailable or corrupt: fall back to seed data */
    }
    return createSeedData();
  }

  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      /* ignore quota / private-mode errors */
    }
  }

  reset(): void {
    this.data = createSeedData();
    this.save();
  }
}

export const mockDb = new MockDb();

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
