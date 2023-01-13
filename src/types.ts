export type ChatRoom = {
  id: string,
  last_message: {
    id: string,
    text: string,
    from_address: string,
    to_address: string,
    encrypt_key: string,
  }
}

export type ProcessMessage = {
  toAddress: string,
  text: string,
  messageId: number,
  encryptKey: string
}

export interface NearConfig {
  networkId: string,
  nodeUrl: string,
  walletUrl: string,
  helperUrl: string,
  explorerUrl: string
}