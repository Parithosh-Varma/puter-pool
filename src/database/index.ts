import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { RequestRecord } from '../types';
import { getLogger } from '../logger';

type SqliteDb = any;

interface ResponseRow {
  id: string;
  account_id: string | null;
  model: string;
  prompt: string;
  response: string | null;
  latency_ms: number;
  success: boolean;
  retry_count: number;
  status_code: number | null;
  error_message: string | null;
  created_at: string;
}

interface AccountRow {
  id: string;
  name: string;
  token: string;
  status: string;
  daily_credit_limit: number;
  model: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export class Database {
  private sqlite: SqliteDb | null = null;

  initialize(): void {
    const sqlitePath = process.env.SQLITE_PATH || 'data/pool.db';
    try {
      const { DatabaseSync } = require('node:sqlite');
      const dir = dirname(sqlitePath);
      if (dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true });
      this.sqlite = new DatabaseSync(sqlitePath);
      this.initSqliteSchema();
      getLogger().info('Database', `Using local SQLite at ${sqlitePath}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      getLogger().error('Database', `SQLite init failed (${msg})`);
      this.sqlite = null;
    }
  }

  private initSqliteSchema(): void {
    if (!this.sqlite) return;
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS ai_responses (
        id TEXT PRIMARY KEY,
        account_id TEXT,
        model TEXT NOT NULL,
        prompt TEXT NOT NULL,
        response TEXT,
        latency_ms INTEGER NOT NULL DEFAULT 0,
        success INTEGER NOT NULL DEFAULT 0,
        retry_count INTEGER NOT NULL DEFAULT 0,
        status_code INTEGER,
        error_message TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_ai_responses_created_at ON ai_responses (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_responses_account_id ON ai_responses (account_id);
      CREATE INDEX IF NOT EXISTS idx_ai_responses_success ON ai_responses (success);

      CREATE TABLE IF NOT EXISTS puter_accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        token TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending_verification',
        daily_credit_limit INTEGER NOT NULL DEFAULT 100,
        model TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }

  isConnected(): boolean {
    return this.sqlite !== null;
  }

  isSqlite(): boolean {
    return this.sqlite !== null;
  }

  async storeResponse(record: RequestRecord): Promise<void> {
    if (!this.sqlite) return;
    try {
      const stmt = this.sqlite.prepare(
        `INSERT OR IGNORE INTO ai_responses
          (id, account_id, model, prompt, response, latency_ms, success, retry_count, status_code, error_message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      stmt.run(
        record.id,
        record.accountId,
        record.model,
        record.prompt,
        record.response,
        record.latency,
        record.success ? 1 : 0,
        record.retryCount,
        record.statusCode ?? null,
        record.error ?? null,
        record.timestamp.toISOString(),
      );
    } catch (err) {
      getLogger().error('Database', 'Failed to store response (sqlite)', {
        error: err instanceof Error ? err.message : String(err),
        requestId: record.id,
      });
    }
  }

  async getResponses(limit = 50, offset = 0): Promise<ResponseRow[]> {
    if (!this.sqlite) return [];
    try {
      const stmt = this.sqlite.prepare('SELECT * FROM ai_responses ORDER BY created_at DESC LIMIT ? OFFSET ?');
      const rows = stmt.all(limit, offset) as ResponseRow[];
      return rows.map(r => ({ ...r, success: Boolean(r.success) } as ResponseRow));
    } catch (err) {
      getLogger().error('Database', 'Failed to query responses (sqlite)', {
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  }

  async getResponsesByAccount(accountId: string, limit = 50): Promise<ResponseRow[]> {
    if (!this.sqlite) return [];
    try {
      const stmt = this.sqlite.prepare('SELECT * FROM ai_responses WHERE account_id = ? ORDER BY created_at DESC LIMIT ?');
      const rows = stmt.all(accountId, limit) as ResponseRow[];
      return rows.map(r => ({ ...r, success: Boolean(r.success) } as ResponseRow));
    } catch (err) {
      getLogger().error('Database', 'Failed to query responses by account (sqlite)', {
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  }

  async getResponseStats(): Promise<{
    total: number;
    successful: number;
    failed: number;
    avgLatency: number;
  }> {
    if (!this.sqlite) return { total: 0, successful: 0, failed: 0, avgLatency: 0 };
    try {
      const rows = this.sqlite.prepare('SELECT success, latency_ms FROM ai_responses').all() as Array<{ success: number; latency_ms: number }>;
      const total = rows.length;
      const successful = rows.filter(r => r.success === 1).length;
      const totalLatency = rows.reduce((sum, r) => sum + (r.latency_ms || 0), 0);
      return {
        total,
        successful,
        failed: total - successful,
        avgLatency: total > 0 ? Math.round(totalLatency / total) : 0,
      };
    } catch (err) {
      getLogger().error('Database', 'Failed to get stats (sqlite)', {
        error: err instanceof Error ? err.message : String(err),
      });
      return { total: 0, successful: 0, failed: 0, avgLatency: 0 };
    }
  }

  async loadAccounts(): Promise<Array<{ id: string; name: string; token: string; dailyCreditLimit: number }>> {
    if (!this.sqlite) return [];
    try {
      const rows = this.sqlite.prepare('SELECT * FROM puter_accounts ORDER BY created_at ASC').all() as AccountRow[];
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        token: r.token,
        dailyCreditLimit: r.daily_credit_limit,
      }));
    } catch (err) {
      getLogger().error('Database', 'Failed to load accounts (sqlite)', {
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  }

  async saveAccount(account: { id: string; name: string; token: string; dailyCreditLimit: number }): Promise<void> {
    if (!this.sqlite) return;
    try {
      const stmt = this.sqlite.prepare(
        `INSERT INTO puter_accounts (id, name, token, daily_credit_limit, status, updated_at)
         VALUES (?, ?, ?, ?, 'pending_verification', datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           token = excluded.token,
           daily_credit_limit = excluded.daily_credit_limit,
           status = 'pending_verification',
           updated_at = datetime('now')`
      );
      stmt.run(account.id, account.name, account.token, account.dailyCreditLimit);
    } catch (err) {
      getLogger().error('Database', 'Failed to save account (sqlite)', {
        error: err instanceof Error ? err.message : String(err),
        accountId: account.id,
      });
    }
  }

  async deleteAccount(id: string): Promise<void> {
    if (!this.sqlite) return;
    try {
      this.sqlite.prepare('DELETE FROM puter_accounts WHERE id = ?').run(id);
    } catch (err) {
      getLogger().error('Database', 'Failed to delete account (sqlite)', {
        error: err instanceof Error ? err.message : String(err),
        accountId: id,
      });
    }
  }

  async updateAccountStatus(id: string, status: string): Promise<void> {
    if (!this.sqlite) return;
    try {
      this.sqlite.prepare("UPDATE puter_accounts SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
    } catch (err) {
      getLogger().error('Database', 'Failed to update account status (sqlite)', {
        error: err instanceof Error ? err.message : String(err),
        accountId: id,
      });
    }
  }
}
