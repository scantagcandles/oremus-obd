// mobile/src/services/supabase.js

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// =====================================================
// WAŻNE: Zastąp te dane swoimi danymi z Supabase!
// Znajdziesz je w: Settings > API w Supabase Dashboard
// =====================================================
const supabaseUrl = 'https://zexkkicukwvgcvnxltlw.supabase.co'; // <- ZMIEŃ NA SWÓJ URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleGtraWN1a3d2Z2N2bnhsdGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NTg2ODUsImV4cCI6MjA2NDMzNDY4NX0.uSk5vEayHh0_4SETEEOZWu2WQFrQUUT0iztnDbm3IKA'; // <- ZMIEŃ NA SWÓJ KLUCZ

// Utworzenie klienta Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// =====================================================
// AUTH SERVICE - Obsługa autoryzacji
// =====================================================
export const authService = {
  // Rejestracja
  async signUp(email, password, fullName) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Logowanie
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Wylogowanie
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Pobierz aktualnego użytkownika
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      return null;
    }
  },

  // Pobierz sesję
  async getSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      return null;
    }
  },
};

// =====================================================
// API SERVICE - Obsługa danych
// =====================================================
export const apiService = {
  // Pobierz liczbę modlących się
  async getActivePrayerCount() {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { count, error } = await supabase
        .from('prayer_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('started_at', thirtyMinutesAgo);
      
      if (error) throw error;
      return { success: true, count: count || 0 };
    } catch (error) {
      return { success: false, error: error.message, count: 0 };
    }
  },

  // Pobierz kościoły
  async getChurches(city = null, limit = 10) {
    try {
      let query = supabase
        .from('churches')
        .select('*')
        .eq('is_active', true)
        .limit(limit);
      
      if (city) {
        query = query.eq('city', city);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },

  // Zamów mszę
  async orderMass(orderData) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Musisz być zalogowany');

      const { data, error } = await supabase
        .from('mass_orders')
        .insert([{
          user_id: user.id,
          ...orderData,
          status: 'pending'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Pobierz moje zamówienia mszy
  async getMyMassOrders() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Musisz być zalogowany');

      const { data, error } = await supabase
        .from('mass_orders')
        .select(`
          *,
          churches (
            name,
            address,
            city
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },

  // Zapal świecę
  async lightCandle(intentionText, nfcId = null) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Musisz być zalogowany');

      // Sprawdź czy świeca z NFC istnieje
      let candle = null;
      if (nfcId) {
        const { data: existingCandle } = await supabase
          .from('candles')
          .select('*')
          .eq('nfc_id', nfcId)
          .single();
        
        candle = existingCandle;
      }

      // Jeśli nie ma świecy, utwórz nową
      if (!candle) {
        const { data: newCandle, error: candleError } = await supabase
          .from('candles')
          .insert([{
            user_id: user.id,
            nfc_id: nfcId,
            intention_text: intentionText,
            is_lit: true,
            lit_at: new Date().toISOString(),
            total_lights: 1
          }])
          .select()
          .single();
        
        if (candleError) throw candleError;
        candle = newCandle;
      } else {
        // Zaktualizuj istniejącą świecę
        const { error: updateError } = await supabase
          .from('candles')
          .update({
            is_lit: true,
            lit_at: new Date().toISOString(),
            total_lights: candle.total_lights + 1,
            intention_text: intentionText
          })
          .eq('id', candle.id);
        
        if (updateError) throw updateError;
      }

      // Utwórz sesję modlitewną
      const { data: session, error: sessionError } = await supabase
        .from('prayer_sessions')
        .insert([{
          user_id: user.id,
          candle_id: candle.id,
          prayer_type: 'candle',
          intention_text: intentionText
        }])
        .select()
        .single();
      
      if (sessionError) throw sessionError;

      return { success: true, candle, session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Zgaś świecę
  async extinguishCandle(candleId, sessionId) {
    try {
      const endTime = new Date();
      
      // Zakończ sesję
      const { data: session, error: sessionError } = await supabase
        .from('prayer_sessions')
        .update({
          ended_at: endTime.toISOString(),
          is_active: false
        })
        .eq('id', sessionId)
        .select()
        .single();
      
      if (sessionError) throw sessionError;

      // Oblicz czas trwania
      const startTime = new Date(session.started_at);
      const duration = Math.floor((endTime - startTime) / 1000 / 60);

      // Zaktualizuj świecę
      const { error: candleError } = await supabase
        .from('candles')
        .update({
          is_lit: false,
          duration_minutes: duration
        })
        .eq('id', candleId);
      
      if (candleError) throw candleError;

      // Zaktualizuj czas trwania sesji
      await supabase
        .from('prayer_sessions')
        .update({ duration_minutes: duration })
        .eq('id', sessionId);

      return { success: true, duration };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Pobierz czytania dnia
  async getDailyReadings() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_readings')
        .select('*')
        .eq('date', today)
        .single();
      
      if (error) {
        // Jeśli nie ma czytań na dziś, zwróć placeholder
        return {
          success: true,
          data: {
            date: today,
            first_reading: 'Brak czytań na dziś',
            psalm: 'Psalm będzie dostępny wkrótce',
            gospel: 'Ewangelia będzie dostępna wkrótce',
            reflection: 'Rozważanie będzie dostępne wkrótce'
          }
        };
      }
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Pobierz profil użytkownika
  async getUserProfile() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Musisz być zalogowany');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Aktualizuj profil
  async updateProfile(updates) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Musisz być zalogowany');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Pobierz intencje publiczne
  async getPublicIntentions(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('intentions')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  },

  // Dodaj intencję
  async addIntention(intention) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Musisz być zalogowany');

      const { data, error } = await supabase
        .from('intentions')
        .insert([{
          user_id: user.id,
          ...intention
        }])
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Módl się za intencję
  async prayForIntention(intentionId) {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Musisz być zalogowany');

      // Dodaj modlitwę
      const { error: prayerError } = await supabase
        .from('intention_prayers')
        .insert([{
          intention_id: intentionId,
          user_id: user.id
        }]);
      
      if (prayerError && prayerError.code !== '23505') { // 23505 = duplicate key
        throw prayerError;
      }

      // Zwiększ licznik modlitw
      const { data: intention } = await supabase
        .from('intentions')
        .select('prayer_count')
        .eq('id', intentionId)
        .single();

      await supabase
        .from('intentions')
        .update({ prayer_count: (intention?.prayer_count || 0) + 1 })
        .eq('id', intentionId);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// =====================================================
// WAŻNE: Ten eksport MUSI być na końcu pliku!
// =====================================================
export { supabase, authService, apiService };