import {gql, createClient} from '@urql/core';
import {ChatRoom, ProcessMessage} from "../types.js";
import {Account} from "near-api-js/lib/account.js";

const getTheGraphApiUrl = (network: string): string => {
  let contract: string = "chatme-main";
  switch (network) {
    case "local":
      contract = "nearmessage"
      break;
    case "testnet":
      contract = "chatme";
      break;
  }
  return `https://api.thegraph.com/subgraphs/name/vlodkomr/${contract}`;
}

// export const chatmeContractAddress = (network: string): string => {
//   switch (network) {
//     case "local":
//       return "near-message.testnet";
//     case "testnet":
//       return "chatme.testnet";
//     default:
//       return "chatme.near";
//   }
// }


export const loadRoomMessages = (network: string): Promise<ChatRoom[]> => new Promise(
  async (resolve) => {
    const client = createClient({
      url: getTheGraphApiUrl(network)
    });

    const messagesQuery = gql`
        query privateChatSearch($acc: String!) {
            privateChatSearch(text: $acc) {
                id
                last_message {
                    id
                    text
                    from_address
                    to_address
                }
            }
        }`;

    const result = await client.query(messagesQuery, {
      acc: process.env.BOT_ACCOUNT_NAME
    }).toPromise();

    resolve(result.data?.privateChatSearch);
  });

// Send reply message to ChatMe
const sendReplyMessage = (botAccount: Account, roomId: string, response: string) => {
  // botAccount.functionCall()
}


export const processMessage = async (botAccount: Account, message: ProcessMessage) => {
  // Example of short message
  if (message.text.length < 2) {
    return sendReplyMessage(
      botAccount,
      message.roomId,
      `I'm sorry, I didn't understand what you meant by "${message.text}". Can you please provide more context or clarify your question?`
    );
  }


}