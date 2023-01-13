import {createClient, gql} from '@urql/core';
import {Configuration, OpenAIApi} from 'openai'
import {chatmeContractAddress, initContract} from "./near.js";
import {convertToTera} from "./format.js";
import {ChatRoom, ProcessMessage, UserAccount} from "../types.js";
import {getCountUserRequests, getPublicKey, increaseUserRequests, updateUserPublicKey} from "./database.js";
import {messageDecode, messageEncode} from "./secretChat.js";

const CONTRACT: any = await initContract(process.env.NODE_ENV);
const NEAR_NETWORK: string = process.env.NODE_ENV || "testnet";

/**
 * Get theGraph indexer address
 */
const getTheGraphApiUrl = (): string => {
  let theGraphNode: string = "chatme-main";
  switch (NEAR_NETWORK) {
    case "local":
      theGraphNode = "nearmessage"
      break;
    case "testnet":
      theGraphNode = "chatme";
      break;
  }
  return `https://api.thegraph.com/subgraphs/name/vlodkomr/${theGraphNode}`;
}

/**
 * Load all last rooms with messages
 */
export const loadRoomMessages = (): Promise<ChatRoom[]> => new Promise(
  async (resolve) => {
    const client = createClient({
      url: getTheGraphApiUrl()
    });

    const messagesQuery = gql`
        query privateChatSearch($textData: String!) {
            privateChatSearch(text: $textData) {
                id
                last_message {
                    id
                    text
                    from_address
                    to_address
                    encrypt_key
                }
            }
        }`;

    const result = await client.query(messagesQuery, {
      textData: process.env.BOT_ACCOUNT_NAME
    }).toPromise();
    resolve(result.data?.privateChatSearch);
  });

/**
 * Send reply message
 * @param toAddress - message recipient
 * @param message - original message details from user
 * @param response - message text response
 */
const sendReplyMessage = async (toAddress: string, message: ProcessMessage, response: string) => {
  let encryptKey: string = "";
  if (message.encryptKey) {
    let userPubKey = await getPublicKey(message.toAddress);
    if (userPubKey) {
      let encodeDetails = messageEncode(response, userPubKey);
      encryptKey = encodeDetails.nonce;
      response = encodeDetails.secret;
    }
  }

  await CONTRACT.send_private_message({
    args: {
      to_address: toAddress,
      text: response,
      image: "",
      reply_message_id: message.messageId.toString(),
      encrypt_key: encryptKey
    },
    gas: convertToTera("10")
  });
}

/**
 * Send request to Open AI
 * @param requestText
 */
const getOpenAIResponse = async (requestText: string) => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  return await openai.createCompletion({
    model: "text-davinci-003",
    prompt: requestText,
    temperature: 0, // Higher values means the model will take more risks.
    max_tokens: 4096, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
    top_p: 1, // alternative to sampling with temperature, called nucleus sampling
    frequency_penalty: 0.5, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
    presence_penalty: 0, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
  });
}

/**
 * Limit requests to AI based on account level
 * @param address
 * @return number
 */
const getRequestLimit = async (address: string): Promise<number> => {
  const userAccount: UserAccount = await CONTRACT.get_user_info({address});
  if (userAccount) {
    if (userAccount.level === 2) {
      // Gold
      return 90;
    } else {
      // Bronze
      return 30;
    }
  }
  return 3;
}

/**
 * Process one message from user
 * @param message
 */
export const processMessage = async (message: ProcessMessage) => {
  // Accept secret chat request
  if (message.text.indexOf("(secret-start:") !== -1) {
    const keyParts = message.text.split(":");
    if (keyParts.length == 2) {
      const chatPublicKey = keyParts[1].replace(")", "");
      await updateUserPublicKey(message.toAddress, chatPublicKey);
    }

    return sendReplyMessage(
      message.toAddress,
      message,
      `(secret-accept:${process.env.SECRET_CHAT_PUBLIC_KEY})`
    );
  }

  // Secret chat end
  if (message.text.indexOf("(secret-end)") !== -1) {
    return sendReplyMessage(
      message.toAddress,
      message,
      `Ok, private chat disabled.`
    );
  }

  // Decode private message for private mode
  let decodedText = message.text.trim();
  if (message.encryptKey) {
    let userPubKey = await getPublicKey(message.toAddress);
    if (userPubKey) {
      decodedText = messageDecode(decodedText, userPubKey, message.encryptKey);
    }
  }

  // Too short message reply
  if (decodedText.length < 2) {
    return sendReplyMessage(
      message.toAddress,
      message,
      `I'm sorry, I didn't understand what you meant by "${decodedText}". Can you please provide more context or clarify your question?`
    );
  }

  // Like reply
  if (decodedText === "(like)") {
    return sendReplyMessage(
      message.toAddress,
      message,
      `(like)`
    );
  }

  // Limit AI requests from testnet
  if (NEAR_NETWORK !== 'mainnet' && message.toAddress !== "vlodkow.testnet") {
    return sendReplyMessage(
      message.toAddress,
      message,
      `Sorry, AI Bot available only on NEAR Mainnet`
    );
  }

  // Check requests count and limit by account level
  let requestsLimit = await getRequestLimit(message.toAddress);
  let totalRequests = await getCountUserRequests(message.toAddress);
  if (totalRequests >= requestsLimit) {
    let responseText = `Sorry, you reached daily requests limit (${requestsLimit} messages) for your account.`;
    if (requestsLimit < 90) {
      responseText += `You can update your account level in dashboard to talk more with AI Bot.`;
    }

    return sendReplyMessage(
      message.toAddress,
      message,
      responseText
    );
  }

  await increaseUserRequests(message.toAddress);

  let responseText = "";
  let errorOpenAI = {};
  try {
    const response = await getOpenAIResponse(decodedText);
    responseText = response.data.choices[0].text.trim();
  } catch (err) {
    errorOpenAI = err;
  }

  if (responseText) {
    // Success response from AI
    sendReplyMessage(
      message.toAddress,
      message,
      responseText
    );
  } else {
    // Send error notifications
    sendReplyMessage(
      message.toAddress,
      message,
      "Sorry, there is some error with AI. I sent notification to chatMe team."
    );

    sendReplyMessage(
      chatmeContractAddress(NEAR_NETWORK),
      message,
      `AI error: ${JSON.stringify(errorOpenAI)}`
    );
  }
}