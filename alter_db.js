import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// We need the service role key to do schema migrations easily, but wait, can we alter table using the REST API?
// The REST API (PostgREST) does NOT allow schema modifications. We need the postgres connection string or we can use Supabase SQL API?
// Actually, I can just use the supabase CLI if it's installed, or simply store it in `notas` dynamically and parse it? No, user explicitly said "guardarse en la base de datos", so a new column.
