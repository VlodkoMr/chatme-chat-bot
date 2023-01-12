export type ChatRoom = {
  id: string,
  last_message: {
    id: string,
    text: string,
    from_address: string,
    to_address: string,
  }
}

export type ProcessMessage = {
  roomId: string,
  text: string
}