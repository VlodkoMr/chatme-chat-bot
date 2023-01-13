import {connect, Contract, keyStores, utils} from "near-api-js";
import {NearConfig} from "../types.js";
import {Near} from "near-api-js/lib/near.js";
import {Account} from "near-api-js/lib/account.js";

const getConfig = (network: string): NearConfig => {
  switch (network) {
    case "production":
    case "mainnet":
      return {
        networkId: "mainnet",
        nodeUrl: "https://rpc.mainnet.near.org",
        walletUrl: "https://wallet.near.org",
        helperUrl: "https://helper.mainnet.near.org",
        explorerUrl: "https://explorer.mainnet.near.org",
      };
    case "development":
    case "testnet":
    case "local":
      return {
        networkId: "testnet",
        nodeUrl: "https://rpc.testnet.near.org",
        walletUrl: "https://wallet.testnet.near.org",
        helperUrl: "https://helper.testnet.near.org",
        explorerUrl: "https://explorer.testnet.near.org",
      };
    default:
      throw Error(`Unconfigured NEAR environment '${network}'`);
  }
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

export const initBotAccount = async (network: string) => {
  const nearConfig = getConfig(network);
  const privateKey = process.env.BOT_PRIVATE_KEY.replace("ed25519:", "");

  const keyPair = new utils.key_pair.KeyPairEd25519(privateKey);
  const keyStore = new keyStores.InMemoryKeyStore();
  console.log(`keyPair`, keyPair);
  await keyStore.setKey(nearConfig.networkId, process.env.BOT_ACCOUNT_NAME, keyPair);
  console.log(`keyStore`, keyStore);

  const near: Near = await connect(
    Object.assign({keyStore: keyStore}, nearConfig)
  );
  const account: Account = await near.account(process.env.BOT_ACCOUNT_NAME);
  console.log(`account`, account);
  const contract: Contract = await new Contract(account, chatmeContractAddress(), {
    viewMethods: [""],
    changeMethods: ["send_private_message"],
  });

  return contract;
};

// const createNewTransaction = async (
//   {
//     receiverId,
//     actions,
//     nonceOffset = 1,
//   }) => {
//   // const nearInternal = window.walletConnection._near;
//   // const localKey = await nearInternal.connection.signer.getPublicKey(
//   //   window.accountId,
//   //   nearInternal.config.networkId
//   // );
//   //
//   // const accessKey = await window.walletConnection
//   //   .account()
//   //   .accessKeyForTransaction(receiverId, actions, localKey);
//   // if (!accessKey) {
//   //   throw new Error(
//   //     `Cannot find matching key for transaction sent to ${receiverId}`
//   //   );
//   // }
//
//   const block = await nearInternal.connection.provider.block({
//     finality: "final",
//   });
//   console.log(`block`, block);
//   const blockHash = base_decode(block.header.hash);
//   const publicKey = PublicKey.from(accessKey.public_key);
//   const nonce = accessKey.access_key.nonce + nonceOffset;
//
//   return createTransaction(
//     window.walletConnection.account().accountId,
//     publicKey,
//     receiverId,
//     nonce,
//     actions,
//     blockHash
//   );
// };