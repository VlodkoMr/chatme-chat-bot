import {JsonDB, Config} from 'node-json-db';

// Init simple file-based database
const db = new JsonDB(
  new Config("botDatabase", true, false, '/')
);

// Init new Database
try {
  await db.getData("/lastId");
} catch (e) {
  console.error('Create new Database');
  await db.push("/lastId", 0);
}

// Get last message ID
export const getLastMessageId = async (): Promise<number> => {
  try {
    return await db.getData("/lastId");
  } catch (error) {
    console.error('DB read error', error);
  }
}

// Update last message ID
export const updateLastMessageId = async (id: number) => {
  await db.push("/lastId", id);
}