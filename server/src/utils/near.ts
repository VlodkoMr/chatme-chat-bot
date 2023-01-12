import {connect, keyStores, utils} from "near-api-js";

interface NearConfig {
  networkId: string,
  nodeUrl: string,
  walletUrl: string,
  helperUrl: string,
  explorerUrl: string
}

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

export const initBotAccount = async (network: string) => {
  const nearConfig = getConfig(network);
  const privateKey = process.env.BOT_PRIVATE_KEY.replace("ed25519:", "");

  const keyPair = new utils.key_pair.KeyPairEd25519(privateKey);
  const keyStore = new keyStores.InMemoryKeyStore();
  await keyStore.setKey(nearConfig.networkId, process.env.BOT_ACCOUNT_NAME, keyPair);

  const near = await connect(
    Object.assign({
      deps: {keyStore: keyStore},
      headers: {}
    }, nearConfig)
  );

  const account = await near.account(process.env.BOT_ACCOUNT_NAME);
  // account.functionCall();

  return account;
};
