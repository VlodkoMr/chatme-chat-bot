import {loadRoomMessages, processMessage} from "./utils/messages.js";
import {getLastMessageId, updateLastMessageId} from "./utils/database.js";
import {ProcessMessage} from "./types.js";

if (!process.env.BOT_PRIVATE_KEY || !process.env.BOT_ACCOUNT_NAME) {
  throw Error("Wrong configuration - provide BOT_PRIVATE_KEY and BOT_ACCOUNT_NAME details.");
}

// Check for new messages each N seconds
const CHECK_INTERVAL_SECONDS: number = 4;

const startMessagesCheck = async () => {
  const lastMessageInDB: number = await getLastMessageId();

  loadRoomMessages().then(rooms => {
    let newMessagesList: number[] = [];
    let processMessages: ProcessMessage[] = [];

    // Check and filter last messages
    rooms.map(room => {
      const messageId = parseInt(room.last_message.id);

      if (messageId > lastMessageInDB && room.last_message.to_address === process.env.BOT_ACCOUNT_NAME) {
        newMessagesList.push(messageId);
        processMessages.push({
          toAddress: room.last_message.from_address,
          text: room.last_message.text.trim(),
          encryptKey: room.last_message.encrypt_key,
          messageId
        });
      }
    });

    // Reply to new messages
    if (newMessagesList.length > 0) {
      const latestNewId: number = Math.max(...newMessagesList);
      updateLastMessageId(latestNewId).then(() => {
        processMessages.map(message => {
          processMessage(message);
        });
      });
    }

    // Repeat in few seconds
    setTimeout(() => {
      startMessagesCheck();
    }, CHECK_INTERVAL_SECONDS * 1000);
  });
}

// Start new messages checks
startMessagesCheck().then(() => {
  console.log(`--- Bot Started ---`);
});