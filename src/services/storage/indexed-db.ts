// src/services/storage/indexed-db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CompeteHQDB extends DBSchema {
  teams: { key: string; value: Record<string, unknown>; indexes: { 'by-updated': number } };
  players: { key: string; value: Record<string, unknown>; indexes: { 'by-team': string; 'by-updated': number } };
  games: { key: string; value: Record<string, unknown>; indexes: { 'by-team': string; 'by-date': number; 'by-status': string } };
  lineups: { key: string; value: Record<string, unknown>; indexes: { 'by-game': string; 'by-team': string } };
  practices: { key: string; value: Record<string, unknown>; indexes: { 'by-team': string; 'by-date': number } };
  positionHistory: { key: string; value: Record<string, unknown>; indexes: { 'by-player': string; 'by-game': string } };
  settings: { key: string; value: Record<string, unknown> };
}

class IndexedDBService {
  private dbPromise: Promise<IDBPDatabase<CompeteHQDB>>;
  private readonly DB_NAME = 'competehq-db';
  private readonly DB_VERSION = 1;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private async initDB(): Promise<IDBPDatabase<CompeteHQDB>> {
    return openDB<CompeteHQDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        const stores = [
          { name: 'teams', key: 'id', indexes: [{ name: 'by-updated', key: 'updatedAt' }] },
          { name: 'players', key: 'id', indexes: [{ name: 'by-team', key: 'teamId' }, { name: 'by-updated', key: 'updatedAt' }] },
          { name: 'games', key: 'id', indexes: [{ name: 'by-team', key: 'teamId' }, { name: 'by-date', key: 'date' }, { name: 'by-status', key: 'status' }] },
          { name: 'lineups', key: 'id', indexes: [{ name: 'by-game', key: 'gameId' }, { name: 'by-team', key: 'teamId' }] },
          { name: 'practices', key: 'id', indexes: [{ name: 'by-team', key: 'teamId' }, { name: 'by-date', key: 'date' }] },
          { name: 'positionHistory', key: 'id', indexes: [{ name: 'by-player', key: 'playerId' }, { name: 'by-game', key: 'gameId' }] },
          { name: 'settings', key: 'id', indexes: [] },
        ];

        for (const store of stores) {
          if (!db.objectStoreNames.contains(store.name)) {
            const objStore = db.createObjectStore(store.name, { keyPath: store.key });
            store.indexes.forEach(idx => objStore.createIndex(idx.name, idx.key));
          }
        }
      },
    });
  }

  public async get<K extends keyof CompeteHQDB>(storeName: K, id: string): Promise<CompeteHQDB[K]['value'] | undefined> {
    const db = await this.dbPromise;
    return db.get(storeName, id);
  }

  public async getAll<K extends keyof CompeteHQDB>(storeName: K): Promise<CompeteHQDB[K]['value'][]> {
    const db = await this.dbPromise;
    return db.getAll(storeName);
  }

  public async add<K extends keyof CompeteHQDB>(storeName: K, item: CompeteHQDB[K]['value']): Promise<string> {
    const db = await this.dbPromise;
    return db.add(storeName, item);
  }

  public async put<K extends keyof CompeteHQDB>(storeName: K, item: CompeteHQDB[K]['value']): Promise<string> {
    const db = await this.dbPromise;
    return db.put(storeName, item);
  }

  public async delete<K extends keyof CompeteHQDB>(storeName: K, id: string): Promise<void> {
    const db = await this.dbPromise;
    return db.delete(storeName, id);
  }

  public async clear<K extends keyof CompeteHQDB>(storeName: K): Promise<void> {
    const db = await this.dbPromise;
    return db.clear(storeName);
  }

  public async getByIndex<K extends keyof CompeteHQDB, I extends keyof CompeteHQDB[K]['indexes']>(
    storeName: K,
    indexName: I,
    key: IDBValidKey
  ): Promise<CompeteHQDB[K]['value'][]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex(storeName, indexName as string, key);
  }

  // Specialized methods
  public async getTeamPlayers(teamId: string) {
    return this.getByIndex('players', 'by-team', teamId);
  }

  public async getTeamGames(teamId: string) {
    return this.getByIndex('games', 'by-team', teamId);
  }

  public async getGameLineup(gameId: string) {
    const lineups = await this.getByIndex('lineups', 'by-game', gameId);
    return lineups.length > 0 ? lineups[0] : null;
  }

  public async getPlayerPositionHistory(playerId: string) {
    return this.getByIndex('positionHistory', 'by-player', playerId);
  }

  public async getSetting(key: string): Promise<Record<string, unknown> | undefined> {
    return this.get('settings', key);
  }

  public async setSetting(key: string, value: Record<string, unknown>): Promise<string> {
    return this.put('settings', { id: key, ...value });
  }
}

export const indexedDBService = new IndexedDBService();
