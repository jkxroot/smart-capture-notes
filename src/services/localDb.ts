import * as SQLite from 'expo-sqlite';

export type OutboxType = 'create' | 'update' | 'delete' | 'pin';

export interface OutboxItem {
  id: string;
  type: OutboxType;
  record_id: string;
  payload_json: string;
  local_image_uris_json: string;
  created_at: number;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('smart_capture.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS cached_records (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          data_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS outbox (
          id TEXT PRIMARY KEY NOT NULL,
          type TEXT NOT NULL,
          record_id TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          local_image_uris_json TEXT NOT NULL DEFAULT '[]',
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_cached_records_user ON cached_records (user_id);
        CREATE INDEX IF NOT EXISTS idx_outbox_created ON outbox (created_at ASC);
      `);
      return db;
    })();
  }
  return dbPromise;
}

export const localDb = {
  async replaceCachedRecords(userId: string, recordsJson: string[]): Promise<void> {
    const db = await getDb();
    const now = Date.now();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM cached_records WHERE user_id = ?', [userId]);
      for (const data of recordsJson) {
        const parsed = JSON.parse(data) as { id: string };
        await db.runAsync(
          'INSERT INTO cached_records (id, user_id, data_json, updated_at) VALUES (?, ?, ?, ?)',
          [parsed.id, userId, data, now]
        );
      }
    });
  },

  async upsertCachedRecord(userId: string, recordJson: string): Promise<void> {
    const db = await getDb();
    const parsed = JSON.parse(recordJson) as { id: string };
    await db.runAsync(
      `INSERT INTO cached_records (id, user_id, data_json, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at`,
      [parsed.id, userId, recordJson, Date.now()]
    );
  },

  async removeCachedRecord(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM cached_records WHERE id = ?', [id]);
  },

  async getCachedRecords(userId: string): Promise<string[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ data_json: string }>(
      'SELECT data_json FROM cached_records WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
    return rows.map((r) => r.data_json);
  },

  async clearUserData(userId: string): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM cached_records WHERE user_id = ?', [userId]);
      await db.runAsync(
        `DELETE FROM outbox WHERE record_id IN (
           SELECT id FROM cached_records WHERE user_id = ?
         )`,
        [userId]
      );
    });
  },

  async enqueueOutbox(item: OutboxItem): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO outbox (id, type, record_id, payload_json, local_image_uris_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.type,
        item.record_id,
        item.payload_json,
        item.local_image_uris_json,
        item.created_at,
      ]
    );
  },

  async listOutbox(): Promise<OutboxItem[]> {
    const db = await getDb();
    return db.getAllAsync<OutboxItem>(
      'SELECT * FROM outbox ORDER BY created_at ASC'
    );
  },

  async removeOutbox(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM outbox WHERE id = ?', [id]);
  },

  async clearOutbox(): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM outbox');
  },

  async outboxCount(): Promise<number> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM outbox');
    return row?.c ?? 0;
  },
};
