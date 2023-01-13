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

export interface UserAccount {
  id: string,
  level: number,
  last_spam_report: number,
  spam_counts: 0,
  verified: boolean
}