import {JsonDB, Config} from 'node-json-db';

// Init simple file-based database
const DB = new JsonDB(
  new Config(`bot-${process.env.NODE_ENV || "testnet"}-database`, true, false, '/')
);

// Init new Database
try {
  await DB.getData("/lastId");
} catch (e) {
  console.log('New Database created');
  await DB.push("/lastId", 0);
  await DB.push("/pubKeys", {});
}

/**
 * Get last message ID from database
 */
export const getLastMessageId = async (): Promise<number> => {
  try {
    return await DB.getData("/lastId");
  } catch (error) {
    console.error('DB read error', error);
  }
}

/**
 * Update last message ID in database
 * @param id
 */
export const updateLastMessageId = async (id: number) => {
  await DB.push("/lastId", id);
}

/**
 * Get public key from database
 * @param account
 */
export const getPublicKey = async (account: string): Promise<string | null> => {
  try {
    const pubKeys = await DB.getData("/pubKeys");
    return pubKeys[account] || null;
  } catch (error) {
    console.error('DB read error', error);
  }
}

/**
 * Save user public key in database
 * @param account
 * @param key
 */
export const updateUserPublicKey = async (account: string, key: string) => {
  try {
    let pubKeys = await DB.getData("/pubKeys");
    pubKeys[account] = key;
    await DB.push("/pubKeys", pubKeys);
  } catch (error) {
    console.error('DB error', error);
  }
}