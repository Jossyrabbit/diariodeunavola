import { getDatabase } from "@netlify/database";

export function getDdvDatabase() {
  return getDatabase();
}

export async function withTransaction(work, database = getDdvDatabase()) {
  const client = await database.pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
