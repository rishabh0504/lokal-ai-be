export interface FormattedMessage {
  sender: string;
  content: string;
}

export interface SSEPayload {
  content: string;
  sender: string;
  done: boolean;
}

export type Message = {
  sender: string;
  content: string;
  id: string;
  done?: boolean;
  isAgent?: boolean;
};
