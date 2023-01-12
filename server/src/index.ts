import express from "express";
// import cors from "cors";
import {initBotAccount} from "./utils/near.js";
import {Account} from "near-api-js/lib/account.js";
import {loadRoomMessages, processMessage} from "./utils/messages.js";
import {getLastMessageId, updateLastMessageId} from "./utils/database.js";
import {ProcessMessage} from "./types.js";

const PORT: number = parseInt(process.env.SERVER_PORT) || 5000;
const NEAR_NETWORK: string = process.env.NODE_ENV || "testnet";

// const corsConfig = {
//   origin: ["http://localhost:1234"],
//   methods: "GET,OPTION,HEAD,PUT,PATCH,POST,DELETE",
//   optionsSuccessStatus: 200,
// };

const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());
// app.use(cors(corsConfig));

// Check for new messages each N seconds.
const CHECK_INTERVAL_SECONDS: number = 3;

// Init bot account from environment settings.
const botAccount: Account = await initBotAccount(NEAR_NETWORK);

const startMessagesCheck = async () => {
  const lastMessageInDB: number = await getLastMessageId();

  loadRoomMessages(NEAR_NETWORK).then(rooms => {
    let processMessages: ProcessMessage[] = [];
    let newMessagesList: number[] = [];

    rooms.map(room => {
      const messageId = parseInt(room.last_message.id);
      if (messageId > lastMessageInDB && room.last_message.to_address === process.env.BOT_ACCOUNT_NAME) {
        newMessagesList.push(messageId);
        processMessages.push({
          roomId: room.id,
          text: room.last_message.text,
        });
      }
    });

    if (newMessagesList.length > 0) {
      const latestNewId: number = Math.max(...newMessagesList);
      updateLastMessageId(latestNewId).then(() => {
        console.log(`processMessages`, processMessages);
        processMessages.map(message => {
          processMessage(botAccount, message);
        });
      });
    }

    // setTimeout(() => {
    //   startMessagesCheck();
    // }, CHECK_INTERVAL_SECONDS * 1000);
  });
}

// Start new messages checks.
startMessagesCheck().then();
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
