// Import the IndexedDB helper from the 'idb' library for easier, promise-based usage
import { openDB, IDBPDatabase, DBSchema } from 'idb';

// Define data models for clarity and strong typing
interface Player {
  id: string;
  name: string;
  email: string;
  teamId: string;
}

interface Team {
  id: string;
  name: string;
}

interface Game {
  id?: number;          // optional for input (will be auto-assigned if not provided)
  date: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
}

// Define the database schema, listing all object stores and their key/value types and indexes
interface CompeteHQDB extends DBSchema {
  /** Store for player profiles */
  players: {
    key: string;                     // primary key type
    value: Player;                   // stored object type
    indexes: {
      byEmail: string;               // index on Player.email (unique)
      byTeamId: string;              // index on Player.teamId (non-unique, many players per team)
    };
  };
  /** Store for team information */
  teams: {
    key: string;
    value: Team;
    indexes: {
      byName: string;               // index on Team.name (unique)
    };
  };
  /** Store for game/match records */
  games: {
    key: number;
    value: Game;
    indexes: {
      byTeamA: string;              // index on Game.teamA
      byTeamB: string;              // index on Game.teamB
      byDate: string;               // index on Game.date
    };
  };
}

class IndexedDBService {
  // Singleton instance to ensure only one connection throughout the app
  private static instance: IndexedDBService;
  // Name and version of the IndexedDB database
  private readonly DB_NAME = 'CompeteHQDB';
  private readonly DB_VERSION = 1;
  // Reference to the database (IDBPDatabase is a typed wrapper around IndexedDB database)
  private dbPromise: Promise<IDBPDatabase<CompeteHQDB>>;

  /** Private constructor to set up the database connection and object stores */
  private constructor() {
    this.dbPromise = openDB<CompeteHQDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(database, oldVersion, newVersion, transaction) {
        // Create object stores and indexes if they don't exist (initial setup or version upgrades)
        if (!database.objectStoreNames.contains('players')) {
          const playerStore = database.createObjectStore('players', { keyPath: 'id' });
          playerStore.createIndex('byEmail', 'email', { unique: true });
          playerStore.createIndex('byTeamId', 'teamId', { unique: false });
        }
        if (!database.objectStoreNames.contains('teams')) {
          const teamStore = database.createObjectStore('teams', { keyPath: 'id' });
          teamStore.createIndex('byName', 'name', { unique: true });
        }
        if (!database.objectStoreNames.contains('games')) {
          // Using autoIncrement for game IDs; 'id' will be generated if not supplied
          const gameStore = database.createObjectStore('games', { keyPath: 'id', autoIncrement: true });
          gameStore.createIndex('byTeamA', 'teamA', { unique: false });
          gameStore.createIndex('byTeamB', 'teamB', { unique: false });
          gameStore.createIndex('byDate', 'date', { unique: false });
        }
      },
      blocked() {
        console.warn('IndexedDB upgrade blocked: close other connections or tabs using the database.');
      },
      blocking() {
        console.warn('A new IndexedDB connection is blocking the current connection from closing.');
      },
      terminated() {
        console.error('IndexedDB connection unexpectedly terminated.');
      }
    });
  }

  /** Retrieve the singleton instance of the service (creates one if it doesn't exist) */
  static getInstance(): IndexedDBService {
    if (!IndexedDBService.instance) {
      IndexedDBService.instance = new IndexedDBService();
    }
    return IndexedDBService.instance;
  }

  /**
   * Get an item from a specified object store by its key.
   * @param storeName - The name of the object store (must be a key of CompeteHQDB).
   * @param key - The primary key value of the item to retrieve (must match the store's key type).
   * @returns The value from the store, or undefined if not found.
   */
  async get<K extends keyof CompeteHQDB>(
    storeName: K,
    key: CompeteHQDB[K]['key']
  ): Promise<CompeteHQDB[K]['value'] | undefined> {
    try {
      const db = await this.dbPromise;
      const result = await db.get(storeName, key);
      return result ?? undefined;
    } catch (error) {
      console.error(`Failed to get key "${String(key)}" from store "${String(storeName)}":`, error);
      return undefined;
    }
  }

  /**
   * Add or update an item in the specified object store.
   * @param storeName - The name of the object store (must be a key of CompeteHQDB).
   * @param value - The value to put into the store (must match the store's value type).
   * @param key - (Optional) The primary key to use, if not using the store's keyPath or if overwriting a specific key.
   * @returns The key of the stored item, or undefined if the operation failed.
   */
  async put<K extends keyof CompeteHQDB>(
    storeName: K,
    value: CompeteHQDB[K]['value'],
    key?: CompeteHQDB[K]['key']
  ): Promise<CompeteHQDB[K]['key'] | undefined> {
    try {
      const db = await this.dbPromise;
      // Use the database's put method (will add or update the record)
      const resultKey = key !== undefined 
        ? await db.put(storeName, value, key) 
        : await db.put(storeName, value);
      return resultKey;
    } catch (error) {
      console.error(`Failed to put value in store "${String(storeName)}":`, error);
      return undefined;
    }
  }

  /**
   * Retrieve an item by an index value from a specified object store.
   * @param storeName - The name of the object store (must be a key of CompeteHQDB).
   * @param indexName - The name of the index within the store (must be a key of the store's indexes).
   * @param indexValue - The value to search for in the index (must match the index's key type).
   * @returns The first value that matches the index (or undefined if not found).
   */
  async getByIndex<
    K extends keyof CompeteHQDB,
    IndexName extends keyof CompeteHQDB[K]['indexes']
  >(
    storeName: K,
    indexName: IndexName,
    indexValue: CompeteHQDB[K]['indexes'][IndexName]
  ): Promise<CompeteHQDB[K]['value'] | undefined> {
    try {
      const db = await this.dbPromise;
      const result = await db.getFromIndex(storeName, indexName, indexValue);
      return result ?? undefined;
    } catch (error) {
      console.error(
        `Failed to get record from index "${String(indexName)}" (value: ${String(indexValue)}) in store "${String(storeName)}":`,
        error
      );
      return undefined;
    }
  }
}

// You can use IndexedDBService.getInstance() to get the singleton and call its methods, for example:
// const dbService = IndexedDBService.getInstance();
// dbService.put('players', { id: 'p1', name: 'Alice', email: 'alice@example.com', teamId: 't1' });
// dbService.get('players', 'p1').then(player => console.log(player));
