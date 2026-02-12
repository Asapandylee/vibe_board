export type Message = {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  inserted_at: string;
};

export type Database = {
  public: {
    Tables: {
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "inserted_at"> & {
          id?: string;
          inserted_at?: string;
        };
        Update: Partial<Message>;
      };
    };
  };
};

export type SupabaseUserMetadata = Record<string, unknown>;
