export type ListItem = {
  id: number;
  data: string;
  done: boolean;
};

export type Task = {
  position: number;
  id: number;
  data: string | ListItem[];
  done: boolean;
  pinned: boolean;
  chosen?: boolean;
};

export type Credentials = {
  username: string;
  password: string;
};