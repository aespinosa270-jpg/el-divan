import { createClient, type Client } from '@libsql/client/web';

let client: Client | null = null;

function database(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error(
      'TURSO_DATABASE_URL no está configurada. Añádela en Vercel Environment Variables.'
    );
  }

  client = createClient({
    url,
    authToken,
  });

  return client;
}

export function secret(name: string): string {
  return process.env[name] ?? '';
}

export const now = () => new Date().toISOString();

export async function all<T = Record<string, unknown>>(
  sql: string,
  ...values: unknown[]
): Promise<T[]> {
  const result = await database().execute({
    sql,
    args: values as any[],
  });

  return result.rows as unknown as T[];
}

export async function one<T = Record<string, unknown>>(
  sql: string,
  ...values: unknown[]
): Promise<T | null> {
  const result = await database().execute({
    sql,
    args: values as any[],
  });

  return (result.rows[0] as unknown as T) ?? null;
}

export async function run(
  sql: string,
  ...values: unknown[]
) {
  return database().execute({
    sql,
    args: values as any[],
  });
}

export async function getSetting<T>(
  key: string,
  fallback: T,
): Promise<T> {
  const row = await one<{ value: string }>(
    'SELECT value FROM settings WHERE id = ?',
    key,
  );

  return row ? JSON.parse(row.value) : fallback;
}

export const vacationDefault = {
  enabled: false,
  returnDate: '',
  message: '',
  acceptOrders: false,
};

export async function vacation() {
  return getSetting('vacation', vacationDefault);
}
