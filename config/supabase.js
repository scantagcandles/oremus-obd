// config/supabase.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Konfiguracja Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Brakuje konfiguracji Supabase w zmiennych środowiskowych');
}

// Klient dla operacji publicznych (z RLS)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Klient dla operacji administratorskich (omija RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Funkcja do uzyskania klienta z tokenem użytkownika
const getSupabaseWithAuth = (accessToken) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
};

module.exports = {
  supabase,
  supabaseAdmin,
  getSupabaseWithAuth
};