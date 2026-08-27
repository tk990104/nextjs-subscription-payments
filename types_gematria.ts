import type { Database, Json } from '@/types_db';

type TableDefinition<
  Row extends Record<string, unknown>,
  Insert extends Record<string, unknown>,
  Update extends Record<string, unknown>
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type CalculationHistoryRow = {
  id: string;
  user_id: string;
  phrase: string;
  results: Json;
  created_at: string;
};

export type ResearchTableRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type ResearchEntryRow = {
  id: string;
  table_id: string;
  user_id: string;
  phrase: string;
  results: Json;
  notes: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomCipherRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  definition: Json;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

type GematriaTables = {
  custom_ciphers: TableDefinition<
    CustomCipherRow,
    Omit<CustomCipherRow, 'id' | 'created_at' | 'updated_at'> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    },
    Partial<Omit<CustomCipherRow, 'id' | 'user_id'>>
  >;
  calculation_history: TableDefinition<
    CalculationHistoryRow,
    Omit<CalculationHistoryRow, 'id' | 'created_at'> & {
      id?: string;
      created_at?: string;
    },
    Partial<Omit<CalculationHistoryRow, 'id' | 'user_id'>>
  >;
  research_tables: TableDefinition<
    ResearchTableRow,
    Omit<ResearchTableRow, 'id' | 'created_at' | 'updated_at'> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    },
    Partial<Omit<ResearchTableRow, 'id' | 'user_id'>>
  >;
  research_entries: TableDefinition<
    ResearchEntryRow,
    Omit<ResearchEntryRow, 'id' | 'created_at' | 'updated_at'> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    },
    Partial<Omit<ResearchEntryRow, 'id' | 'table_id' | 'user_id'>>
  >;
  phrase_corpus: TableDefinition<
    {
      id: number;
      phrase: string;
      category: string | null;
      source: string | null;
      metadata: Json;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    },
    {
      id?: number;
      phrase: string;
      category?: string | null;
      source?: string | null;
      metadata?: Json;
      is_active?: boolean;
      created_at?: string;
      updated_at?: string;
    },
    {
      phrase?: string;
      category?: string | null;
      source?: string | null;
      metadata?: Json;
      is_active?: boolean;
      updated_at?: string;
    }
  >;
  phrase_cipher_values: TableDefinition<
    { phrase_id: number; cipher_id: string; value: number },
    { phrase_id: number; cipher_id: string; value: number },
    { value?: number }
  >;
  usage_counters: TableDefinition<
    {
      user_id: string;
      usage_date: string;
      usage_kind: string;
      usage_count: number;
    },
    {
      user_id: string;
      usage_date?: string;
      usage_kind: string;
      usage_count?: number;
    },
    { usage_count?: number }
  >;
};

type GematriaFunctions = {
  create_custom_cipher_with_limit: {
    Args: {
      p_user_id: string;
      p_name: string;
      p_description: string | null;
      p_definition: Json;
      p_limit: number;
    };
    Returns: {
      id: string | null;
      created_at: string | null;
      allowed: boolean;
      cipher_count: number;
    }[];
  };
  consume_daily_usage: {
    Args: {
      p_user_id: string;
      p_usage_kind: string;
      p_limit: number | null;
    };
    Returns: number;
  };
  save_calculation_with_limit: {
    Args: {
      p_user_id: string;
      p_phrase: string;
      p_results: Json;
      p_limit: number;
    };
    Returns: {
      id: string | null;
      created_at: string | null;
      allowed: boolean;
      entry_count: number;
    }[];
  };
  create_research_table_with_limit: {
    Args: {
      p_user_id: string;
      p_name: string;
      p_description: string | null;
      p_color: string | null;
      p_limit: number;
    };
    Returns: {
      id: string | null;
      created_at: string | null;
      allowed: boolean;
      table_count: number;
    }[];
  };
  add_research_entry: {
    Args: {
      p_user_id: string;
      p_table_id: string;
      p_phrase: string;
      p_results: Json;
      p_notes: string | null;
      p_source_url: string | null;
    };
    Returns: {
      id: string;
      created_at: string;
    }[];
  };
};

type PublicSchema = Database['public'];

export type GematriaDatabase = {
  public: {
    Tables: {
      customers: PublicSchema['Tables']['customers'];
      prices: PublicSchema['Tables']['prices'];
      products: PublicSchema['Tables']['products'];
      subscriptions: PublicSchema['Tables']['subscriptions'];
      users: PublicSchema['Tables']['users'];
    } & GematriaTables;
    Views: PublicSchema['Views'];
    Functions: GematriaFunctions;
    Enums: PublicSchema['Enums'];
    CompositeTypes: PublicSchema['CompositeTypes'];
  };
};
