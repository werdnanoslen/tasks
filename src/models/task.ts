export type ListItem = {
    id: number;
    data: string;
    done: boolean;
};

export type Task = {
    index: number | null;
    id: number;
    data: string | ListItem[];
    done: boolean;
    pinned: boolean;
};