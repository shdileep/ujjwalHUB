/* 
  ⚡ SUPABASE SERVICE
  Uses the official @supabase/supabase-js library.
  Best for relational PostgreSQL data and real-time triggers.
*/

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseService = {
    /**
     * Fetch all records from a table
     */
    async from(table: string) {
        return supabase.from(table);
    },

    /**
     * Quick select helper
     */
    async getAll(table: string) {
        const { data, error } = await supabase
            .from(table)
            .select('*');

        if (error) {
            console.error(`❌ Supabase Error (${table}):`, error.message);
            return [];
        }
        return data;
    },

    /**
     * Upsert record (Insert or Update if exists)
     */
    async upsert(table: string, payload: any) {
        const { data, error } = await supabase
            .from(table)
            .upsert(payload);

        if (error) throw error;
        return data;
    }
};
