import {gql, createClient} from '@urql/core';
import {ChatRoom, ProcessMessage} from "../types.js";
import {Configuration, OpenAIApi} from 'openai'
import {initBotAccount} from "./near.js";
import {convertToTera} from "./format.js";

const contract: any = await initBotAccount(process.env.NODE_ENV);
console.log(`contract`, contract);

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

// Create correct chat ID for private conversation
const buildChatId = (user1: string, user2: string) => {
  if (user1 > user2) {
    return user1.concat("|").concat(user2);
  }
  return user2.concat("|").concat(user1);
}

// Load last rooms with last messages
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

// Send reply message
const sendReplyMessage = async (toAddress: string, messageId: number, response: string) => {
  let hash = await contract.send_private_message({
    args: {
      to_address: toAddress,
      text: response,
      image: "",
      reply_message_id: messageId.toString(),
    },
    gas: convertToTera("10")
  });
  console.log(`hash`, hash);
}

// Process one message
export const processMessage = async (message: ProcessMessage) => {
  // Example of short message reply
  if (message.text.length < 2) {
    return sendReplyMessage(
      message.toAddress,
      message.messageId,
      `I'm sorry, I didn't understand what you meant by "${message.text}". Can you please provide more context or clarify your question?`
    );
  }

  // Your custom logic...
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  // const openai = new OpenAIApi(configuration);
  // const response = await openai.createCompletion({
  //   model: "text-davinci-003",
  //   prompt: `${message.text}`,
  //   temperature: 0, // Higher values means the model will take more risks.
  //   max_tokens: 2048, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
  //   top_p: 1, // alternative to sampling with temperature, called nucleus sampling
  //   frequency_penalty: 0.5, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
  //   presence_penalty: 0, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
  // });
  // const responseText = response.data.choices[0].text;
  const responseText = "test 123";
  console.log(`responseText`, responseText);

  if (responseText) {
    // Success
    sendReplyMessage(
      message.toAddress,
      message.messageId,
      responseText
    );
  } else {
    // Notify user about error
    sendReplyMessage(
      message.toAddress,
      message.messageId,
      "Sorry, there is some error with AI. I sent notification to chatMe team."
    );

    // send chatMe team notification
    // sendReplyMessage(
    //   botAccount,
    //   buildChatId(chatmeContractAddress(), botAccount.accountId),
    //   message.messageId,
    //   `AI error: ${JSON.stringify(response)}`
    // );
  }

}