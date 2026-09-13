import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

function createDatabase() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error(
      'TURSO_DATABASE_URL no está configurada. Añádela en Vercel Environment Variables.'
    );
  }

  const client = createClient({
    url,
    authToken,
  });

  return drizzle(client, { schema });
}

let instance: ReturnType<typeof createDatabase> | undefined;

export function getDb() {
  if (!instance) {
    instance = createDatabase();
  }

  return instance;
}
