import { Pool, PoolClient } from 'pg';
import { RequestRecord } from '../types';
import { getLogger } from '../logger';

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
  private pool: Pool | null = null;

  initialize(): void {
    const url = process.env.NEON_DATABASE_URL;
    if (!url) {
      getLogger().warn('Database', 'NEON_DATABASE_URL not configured');
      return;
    }
    this.pool = new Pool({ connectionString: url });
  }

  isConnected(): boolean {
    return this.pool !== null;
  }

  private async withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) throw new Error('Database not initialized');
    const client = await this.pool.connect();
    try {
      return await fn(client);
    } finally {
      client.release();
    }
  }

  // ── Response persistence ──

  async storeResponse(record: RequestRecord): Promise<void> {
    try {
      await this.withClient(client =>
        client.query(
          `INSERT INTO ai_responses
             (id, account_id, model, prompt, response, latency_ms, success, retry_count, status_code, error_message, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO NOTHING`,
          [
            record.id,
            record.accountId,
            record.model,
            record.prompt,
            record.response,
            record.latency,
            record.success,
            record.retryCount,
            record.statusCode,
            record.error,
            record.timestamp.toISOString(),
          ],
        ),
      );
    } catch (err) {
      getLogger().error('Database', 'Failed to store response', {
        error: err instanceof Error ? err.message : String(err),
        requestId: record.id,
      });
    }
  }

  async getResponses(limit = 50, offset = 0): Promise<ResponseRow[]> {
    try {
      const res = await this.withClient(client =>
        client.query(
          'SELECT * FROM ai_responses ORDER BY created_at DESC LIMIT $1 OFFSET $2',
          [limit, offset],
        ),
      );
      return res.rows as ResponseRow[];
    } catch (err) {
      getLogger().error('Database', 'Failed to query responses', {
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  }

  async getResponsesByAccount(accountId: string, limit = 50): Promise<ResponseRow[]> {
    try {
      const res = await this.withClient(client =>
        client.query(
          'SELECT * FROM ai_responses WHERE account_id = $1 ORDER BY created_at DESC LIMIT $2',
          [accountId, limit],
        ),
      );
      return res.rows as ResponseRow[];
    } catch (err) {
      getLogger().error('Database', 'Failed to query responses by account', {
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
    try {
      const res = await this.withClient(client =>
        client.query('SELECT success, latency_ms FROM ai_responses'),
      );
      const rows = res.rows as Array<{ success: boolean; latency_ms: number }>;
      const total = rows.length;
      const successful = rows.filter(r => r.success).length;
      const totalLatency = rows.reduce((sum, r) => sum + (r.latency_ms || 0), 0);
      return {
        total,
        successful,
        failed: total - successful,
        avgLatency: total > 0 ? Math.round(totalLatency / total) : 0,
      };
    } catch (err) {
      getLogger().error('Database', 'Failed to get stats', {
        error: err instanceof Error ? err.message : String(err),
      });
      return { total: 0, successful: 0, failed: 0, avgLatency: 0 };
    }
  }

  // ── Account persistence ──

  async loadAccounts(): Promise<Array<{ id: string; name: string; token: string; dailyCreditLimit: number }>> {
    try {
      const res = await this.withClient(client =>
        client.query('SELECT * FROM puter_accounts ORDER BY created_at ASC'),
      );
      return ((res.rows as AccountRow[]) || []).map(r => ({
        id: r.id,
        name: r.name,
        token: r.token,
        dailyCreditLimit: r.daily_credit_limit,
      }));
    } catch (err) {
      getLogger().error('Database', 'Failed to load accounts', {
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  }

  async saveAccount(account: { id: string; name: string; token: string; dailyCreditLimit: number }): Promise<void> {
    try {
      await this.withClient(client =>
        client.query(
          `INSERT INTO puter_accounts (id, name, token, daily_credit_limit, status, updated_at)
           VALUES ($1, $2, $3, $4, 'pending_verification', NOW())
           ON CONFLICT (id) DO UPDATE
             SET name = EXCLUDED.name,
                 token = EXCLUDED.token,
                 daily_credit_limit = EXCLUDED.daily_credit_limit,
                 status = 'pending_verification',
                 updated_at = NOW()`,
          [account.id, account.name, account.token, account.dailyCreditLimit],
        ),
      );
    } catch (err) {
      getLogger().error('Database', 'Failed to save account', {
        error: err instanceof Error ? err.message : String(err),
        accountId: account.id,
      });
    }
  }

  async deleteAccount(id: string): Promise<void> {
    try {
      await this.withClient(client =>
        client.query('DELETE FROM puter_accounts WHERE id = $1', [id]),
      );
    } catch (err) {
      getLogger().error('Database', 'Failed to delete account', {
        error: err instanceof Error ? err.message : String(err),
        accountId: id,
      });
    }
  }

  async updateAccountStatus(id: string, status: string): Promise<void> {
    try {
      await this.withClient(client =>
        client.query(
          'UPDATE puter_accounts SET status = $1, updated_at = NOW() WHERE id = $2',
          [status, id],
        ),
      );
    } catch (err) {
      getLogger().error('Database', 'Failed to update account status', {
        error: err instanceof Error ? err.message : String(err),
        accountId: id,
      });
    }
  }
}
