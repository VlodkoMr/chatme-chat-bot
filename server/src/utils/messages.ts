import {gql, createClient} from '@urql/core';
import {ChatRoom, ProcessMessage} from "../types.js";
import {Account} from "near-api-js/lib/account.js";
import {Configuration, OpenAIApi} from 'openai'

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

export const chatmeContractAddress = (): string => {
  switch (process.env.NODE_ENV || "testnet") {
    case "local":
      return "near-message.testnet";
    case "testnet":
      return "chatme.testnet";
    default:
      return "chatme.near";
  }
}

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

const buildChatId = (user1: string, user2: string) => {
  if (user1 > user2) {
    return user1.concat("|").concat(user2);
  }
  return user2.concat("|").concat(user1);
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

  // Your custom logic...
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `${message.text}`,
    temperature: 0, // Higher values means the model will take more risks.
    max_tokens: 2048, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
    top_p: 1, // alternative to sampling with temperature, called nucleus sampling
    frequency_penalty: 0.5, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
    presence_penalty: 0, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
  });

  const responseText = response.data.choices[0].text;
  if (responseText) {
    // Success
    sendReplyMessage(
      botAccount,
      message.roomId,
      responseText
    );
  } else {
    // send chatMe team notification
    sendReplyMessage(
      botAccount,
      buildChatId(chatmeContractAddress(), botAccount.accountId),
      `AI error: ${JSON.stringify(response)}`
    );

    // Notify user about error
    sendReplyMessage(
      botAccount,
      message.roomId,
      "Sorry, there is some error with AI. I sent notification to chatMe team."
    );
  }

}