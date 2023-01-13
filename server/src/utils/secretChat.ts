import {create, open} from "@nearfoundation/near-js-encryption-box";

export const messageDecode = (text: string, pubKey: string, nonce: string): string => {
  return open(text, pubKey, process.env.SECRET_CHAT_PRIVATE_KEY, nonce);
}

export const messageEncode = (text: string, pubKey: string) => {
  const encoded = create(text, pubKey, process.env.SECRET_CHAT_PRIVATE_KEY);
  return {
    secret: encoded.secret,
    nonce: encoded.nonce
  }
}