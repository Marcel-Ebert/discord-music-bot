import { createSlice, PayloadAction, createAction } from "@reduxjs/toolkit"
import { AppThunk } from "../app/store"

export interface SocketState {
  connectionState: ConnectionState
  error: string | null
}

const initialState: SocketState = {
  connectionState: "disconnected",
  error: null
}

const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setConnectionState(state, action: PayloadAction<ConnectionState>) {
      state.connectionState = action.payload
    },
    socketError(state, action: PayloadAction<string>) {
      state.error = action.payload
    }
  }
})

export const { setConnectionState, socketError } = socketSlice.actions

export default socketSlice.reducer

export const initAuthenticationAction = createAction("socket/init", function prepare(token: string) {
  return {
    payload: {
      token
    }
  }
})

export const sendMessage = <Message extends keyof IPC.MessageType>(
  messageType: Message,
  ...args: IPC.MessageArgs<Message>
): AppThunk<Promise<IPC.MessageReturnType<Message>>> => (dispatch, getState) => {
  return new Promise<IPC.MessageReturnType<Message>>((resolve, reject) => {
    dispatch(sendMessageAction({ successCallback: resolve, errorCallback: reject, messageType, args }))
  })
}

export const sendMessageAction = createAction("socket/sendMessage", function prepare<
  Message extends keyof IPC.MessageType
>(payload: {
  successCallback: (value?: IPC.MessageReturnType<Message>) => void
  errorCallback: (reason?: any) => void
  messageType: Message
  args: any
}) {
  return {
    payload
  }
})

export const subscribeToMessagesAction = createAction("socket/subscribe", function prepare<
  Message extends keyof IPC.MessageType
>(payload: { guildID: GuildID; messageType: Message; callback: (message: IPC.MessageReturnType<Message>) => void }) {
  return {
    payload
  }
})

export const unsubscribeFromMessagesAction = createAction("socket/unsubscribe", function prepare(payload: {
  callback: (message: any) => void
}) {
  return {
    payload
  }
})

export const subscribeToMessages = <Message extends keyof IPC.MessageType>(
  guildID: GuildID,
  messageType: Message,
  callback: (message: IPC.MessageReturnType<Message>) => void
): AppThunk<UnsubscribeFn> => (dispatch, getState) => {
  dispatch(subscribeToMessagesAction({ guildID, messageType, callback }))

  return () => dispatch(unsubscribeFromMessagesAction({ callback }))
}
