import {connect, Contract, keyStores, utils} from "near-api-js";
import {NearConfig} from "../types.js";
import {Near} from "near-api-js/lib/near.js";
import {Account} from "near-api-js/lib/account.js";

// NEAR network config
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

// Get chetMe contract for different networks
export const chatmeContractAddress = (network: string): string => {
  switch (network) {
    case "local":
      return "near-message.testnet";
    case "testnet":
      return "chatme.testnet";
    default:
      return "chatme.near";
  }
}

/**
 * Init Bot account and chatMe contract
 * @param network
 */
export const initContract = async (network: string) => {
  const nearConfig = getConfig(network);
  const privateKey = process.env.BOT_PRIVATE_KEY.replace("ed25519:", "");

  const keyPair = new utils.key_pair.KeyPairEd25519(privateKey);
  const keyStore = new keyStores.InMemoryKeyStore();
  await keyStore.setKey(nearConfig.networkId, process.env.BOT_ACCOUNT_NAME, keyPair);

  const near: Near = await connect(
    Object.assign({keyStore: keyStore}, nearConfig)
  );
  const account: Account = await near.account(process.env.BOT_ACCOUNT_NAME);
  const contract: Contract = await new Contract(account, chatmeContractAddress(network), {
    viewMethods: ["get_user_info"],
    changeMethods: ["send_private_message"],
  });

  return contract;
};