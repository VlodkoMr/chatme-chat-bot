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
  await DB.push("/countRequests", {});
}

/**
 * Get count user AI requests. Limited by Account level.
 */
export const getCountUserRequests = async (account: string): Promise<number> => {
  try {
    const requests = await DB.getData("/countRequests");
    return requests[account] || 0;
  } catch (error) {
    console.error('DB read error', error);
  }
}

/**
 * Update count user AI requests
 * @param account
 */
export const increaseUserRequests = async (account: string) => {
  try {
    let countRequests = await DB.getData("/countRequests");
    let current = countRequests[account] || 0;
    countRequests[account] = current + 1;
    await DB.push("/countRequests", countRequests);
  } catch (error) {
    console.error('DB error', error);
  }
}

/**
 * Cleanup daily AI usage limit
 */
export const cleanupDailyRequests = async () => {
  try {
    await DB.push("/countRequests", {});
  } catch (error) {
    console.error('DB error', error);
  }
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
  try {
    await DB.push("/lastId", id);
  } catch (error) {
    console.error('DB error', error);
  }
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