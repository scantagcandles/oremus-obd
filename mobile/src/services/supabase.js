// mobile/src/services/supabase.js - UNIFIED VERSION

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { ErrorHandler } from '../utils/errorHandler';
import { CacheService } from './cache/CacheService';

// =====================================================
// CONFIGURATION - Update with your Supabase credentials
// =====================================================
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zexkkicukwvgcvnxltlw.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleGtraWN1a3d2Z2N2bnhsdGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NTg2ODUsImV4cCI6MjA2NDMzNDY4NX0.uSk5vEayHh0_4SETEEOZWu2WQFrQUUT0iztnDbm3IKA';

// =====================================================
// SUPABASE CLIENT
// =====================================================
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// =====================================================
// BASE API SERVICE CLASS
// =====================================================
class BaseAPIService {
  constructor() {
    this.cache = new CacheService();
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  async withRetry(operation, context = '') {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.retryAttempts) {
          throw ErrorHandler.handle(error, context);
        }
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelay * attempt)
        );
      }
    }
    
    throw lastError;
  }

  async withCache(key, operation, ttl = 300000) { // 5 min default
    // Try cache first
    const cached = await this.cache.get(key);
    if (cached && await this.cache.isValid(key)) {
      return cached.data;
    }

    // Fetch fresh data
    const data = await operation();
    await this.cache.set(key, data, ttl);
    return data;
  }
}

// =====================================================
// AUTHENTICATION SERVICE
// =====================================================
export class AuthService extends BaseAPIService {
  async signUp(email, password, fullName) {
    return this.withRetry(async () => {
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
      
      // Create profile record
      if (data.user) {
        await this.createUserProfile(data.user.id, fullName, email);
      }
      
      return { success: true, data };
    }, 'SignUp');
  }

  async signIn(email, password) {
    return this.withRetry(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Update last login
      if (data.user) {
        await this.updateLastLogin(data.user.id);
      }
      
      return { success: true, data };
    }, 'SignIn');
  }

  async signOut() {
    try {
      // Clear cache on logout
      await this.cache.clear();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: ErrorHandler.handle(error, 'SignOut') };
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('getCurrentUser error:', error);
      return null;
    }
  }

  async getSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('getSession error:', error);
      return null;
    }
  }

  async createUserProfile(userId, fullName, email) {
    return this.withRetry(async () => {
      const { error } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          full_name: fullName,
          email: email,
          created_at: new Date().toISOString(),
          prayer_days: 0,
          total_candles: 0,
          total_rosaries: 0
        }]);
      
      if (error) throw error;
    }, 'CreateUserProfile');
  }

  async updateLastLogin(userId) {
    try {
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('updateLastLogin error:', error);
    }
  }

  // Real-time auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

// =====================================================
// PRAYER SERVICE
// =====================================================
export class PrayerService extends BaseAPIService {
  async getActivePrayerCount() {
    const cacheKey = 'active_prayer_count';
    
    return this.withCache(cacheKey, async () => {
      return this.withRetry(async () => {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        
        const { count, error } = await supabase
          .from('prayer_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .gte('started_at', thirtyMinutesAgo);
        
        if (error) throw error;
        return count || 0;
      }, 'GetActivePrayerCount');
    }, 60000); // Cache for 1 minute
  }

  async startPrayerSession(candleId, prayerType, intentionText = null) {
    return this.withRetry(async () => {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('prayer_sessions')
        .insert([{
          user_id: user.id,
          candle_id: candleId,
          prayer_type: prayerType,
          intention_text: intentionText,
          started_at: new Date().toISOString(),
          is_active: true
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Clear prayer count cache
      await this.cache.delete('active_prayer_count');
      
      return data;
    }, 'StartPrayerSession');
  }

  async endPrayerSession(sessionId) {
    return this.withRetry(async () => {
      const endTime = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('prayer_sessions')
        .update({
          ended_at: endTime,
          is_active: false
        })
        .eq('id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Calculate duration
      const startTime = new Date(data.started_at);
      const duration = Math.floor((new Date(endTime) - startTime) / 1000 / 60);
      
      // Update duration
      await supabase
        .from('prayer_sessions')
        .update({ duration_minutes: duration })
        .eq('id', sessionId);
      
      // Clear cache
      await this.cache.delete('active_prayer_count');
      
      return { ...data, duration_minutes: duration };
    }, 'EndPrayerSession');
  }

  async getPrayerHistory(limit = 20) {
    const cacheKey = 'prayer_history';
    
    return this.withCache(cacheKey, async () => {
      return this.withRetry(async () => {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('prayer_sessions')
          .select(`
            *,
            candles (
              location,
              nfc_id
            )
          `)
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .limit(limit);
        
        if (error) throw error;
        return data || [];
      }, 'GetPrayerHistory');
    }, 600000); // Cache for 10 minutes
  }
}

// =====================================================
// CANDLE SERVICE
// =====================================================
export class CandleService extends BaseAPIService {
  async lightCandle(intentionText, nfcId = null, location = null) {
    return this.withRetry(async () => {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Check if candle with NFC exists
      let candle = null;
      if (nfcId) {
        const { data: existingCandle } = await supabase
          .from('candles')
          .select('*')
          .eq('nfc_id', nfcId)
          .single();
        
        candle = existingCandle;
      }

      // Create or update candle
      if (!candle) {
        const { data: newCandle, error: candleError } = await supabase
          .from('candles')
          .insert([{
            user_id: user.id,
            nfc_id: nfcId,
            location: location || 'Lokalizacja wirtualna',
            intention_text: intentionText,
            is_lit: true,
            lit_at: new Date().toISOString(),
            total_lights: 1,
            latitude: null,
            longitude: null
          }])
          .select()
          .single();
        
        if (candleError) throw candleError;
        candle = newCandle;
      } else {
        // Update existing candle
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

      // Create prayer session
      const session = await prayerService.startPrayerSession(
        candle.id, 
        'candle', 
        intentionText
      );

      // Update user stats
      await this.updateUserCandleStats(user.id);

      return { candle, session };
    }, 'LightCandle');
  }

  async extinguishCandle(candleId, sessionId) {
    return this.withRetry(async () => {
      // End prayer session
      const session = await prayerService.endPrayerSession(sessionId);

      // Update candle
      const { error: candleError } = await supabase
        .from('candles')
        .update({
          is_lit: false,
          duration_minutes: session.duration_minutes
        })
        .eq('id', candleId);
      
      if (candleError) throw candleError;

      return { session };
    }, 'ExtinguishCandle');
  }

  async getCandleData(candleId) {
    const cacheKey = `candle_${candleId}`;
    
    return this.withCache(cacheKey, async () => {
      return this.withRetry(async () => {
        const { data, error } = await supabase
          .from('candles')
          .select(`
            *,
            prayer_sessions (
              id,
              user_id,
              started_at,
              is_active,
              profiles (
                full_name
              )
            )
          `)
          .eq('id', candleId)
          .single();
        
        if (error) throw error;
        return data;
      }, 'GetCandleData');
    }, 120000); // Cache for 2 minutes
  }

  async updateUserCandleStats(userId) {
    try {
      await supabase.rpc('increment_user_candles', { user_id: userId });
    } catch (error) {
      console.error('updateUserCandleStats error:', error);
    }
  }

  async getActiveCandleLocations() {
    const cacheKey = 'active_candle_locations';
    
    return this.withCache(cacheKey, async () => {
      return this.withRetry(async () => {
        const { data, error } = await supabase
          .from('candles')
          .select(`
            id,
            location,
            latitude,
            longitude,
            is_lit,
            prayer_sessions!inner (
              id,
              user_id,
              is_active,
              profiles (
                full_name
              )
            )
          `)
          .eq('is_lit', true)
          .eq('prayer_sessions.is_active', true);
        
        if (error) throw error;
        return data || [];
      }, 'GetActiveCandleLocations');
    }, 30000); // Cache for 30 seconds
  }
}

// =====================================================
// INTENTION SERVICE
// =====================================================
export class IntentionService extends BaseAPIService {
  async getPublicIntentions(limit = 20) {
    const cacheKey = 'public_intentions';
    
    return this.withCache(cacheKey, async () => {
      return this.withRetry(async () => {
        const { data, error } = await supabase
          .from('prayer_intentions')
          .select(`
            *,
            profiles (
              full_name
            )
          `)
          .eq('is_public', true)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (error) throw error;
        return data || [];
      }, 'GetPublicIntentions');
    }, 180000); // Cache for 3 minutes
  }

  async addIntention(candleId, intention, isPublic = false) {
    return this.withRetry(async () => {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('prayer_intentions')
        .insert([{
          user_id: user.id,
          candle_id: candleId,
          intention: intention,
          is_public: isPublic,
          is_active: true,
          prayer_count: 0
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Clear cache
      await this.cache.delete('public_intentions');
      
      return data;
    }, 'AddIntention');
  }

  async prayForIntention(intentionId) {
    return this.withRetry(async () => {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already praying
      const { data: existing } = await supabase
        .from('intention_prayers')
        .select('*')
        .eq('user_id', user.id)
        .eq('intention_id', intentionId)
        .eq('is_active', true);

      if (existing && existing.length > 0) {
        throw new Error('Already praying for this intention');
      }

      // Add prayer
      const { error: prayerError } = await supabase
        .from('intention_prayers')
        .insert([{
          intention_id: intentionId,
          user_id: user.id,
          started_at: new Date().toISOString(),
          is_active: true
        }]);
      
      if (prayerError) throw prayerError;

      // Increment prayer count
      await supabase.rpc('increment_intention_prayers', { 
        intention_id: intentionId 
      });

      // Clear cache
      await this.cache.delete('public_intentions');
      
      return { success: true };
    }, 'PrayForIntention');
  }
}

// =====================================================
// MASS SERVICE
// =====================================================
export class MassService extends BaseAPIService {
  async getChurches(city = null, limit = 10) {
    const cacheKey = city ? `churches_${city}` : 'churches_all';
    
    return this.withCache(cacheKey, async () => {
      return this.withRetry(async () => {
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
        return data || [];
      }, 'GetChurches');
    }, 1800000); // Cache for 30 minutes
  }

  async orderMass(orderData) {
    return this.withRetry(async () => {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('mass_orders')
        .insert([{
          user_id: user.id,
          ...orderData,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }, 'OrderMass');
  }

  async getMyMassOrders() {
    const cacheKey = 'my_mass_orders';
    
    return this.withCache(cacheKey, async () => {
      return this.withRetry(async () => {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

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
        return data || [];
      }, 'GetMyMassOrders');
    }, 300000); // Cache for 5 minutes
  }
}

// =====================================================
// USER PROFILE SERVICE
// =====================================================
export class ProfileService extends BaseAPIService {
  async getUserProfile() {
    const cacheKey = 'user_profile';
    
    return this.withCache(cacheKey, async () => {
      return this.withRetry(async () => {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        return data;
      }, 'GetUserProfile');
    }, 600000); // Cache for 10 minutes
  }

  async updateProfile(updates) {
    return this.withRetry(async () => {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Clear cache
      await this.cache.delete('user_profile');
      
      return data;
    }, 'UpdateProfile');
  }
}

// =====================================================
// SERVICE INSTANCES
// =====================================================
export const authService = new AuthService();
export const prayerService = new PrayerService();
export const candleService = new CandleService();
export const intentionService = new IntentionService();
export const massService = new MassService();
export const profileService = new ProfileService();

// Legacy API service for backward compatibility
export const apiService = {
  getActivePrayerCount: () => prayerService.getActivePrayerCount(),
  getChurches: (city, limit) => massService.getChurches(city, limit),
  orderMass: (orderData) => massService.orderMass(orderData),
  getMyMassOrders: () => massService.getMyMassOrders(),
  lightCandle: (intentionText, nfcId) => candleService.lightCandle(intentionText, nfcId),
  extinguishCandle: (candleId, sessionId) => candleService.extinguishCandle(candleId, sessionId),
  getUserProfile: () => profileService.getUserProfile(),
  updateProfile: (updates) => profileService.updateProfile(updates),
  getPublicIntentions: (limit) => intentionService.getPublicIntentions(limit),
  addIntention: (intention) => intentionService.addIntention(null, intention.intention_text, intention.is_public),
  prayForIntention: (intentionId) => intentionService.prayForIntention(intentionId),
};

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================
export class RealtimeService {
  constructor() {
    this.subscriptions = new Map();
  }

  subscribeToActivePrayers(callback) {
    const subscription = supabase
      .channel('active_prayers')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'prayer_sessions' }, 
        callback
      )
      .subscribe();
    
    this.subscriptions.set('active_prayers', subscription);
    return subscription;
  }

  subscribeToIntentions(candleId, callback) {
    const subscription = supabase
      .channel(`intentions_${candleId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'prayer_intentions',
          filter: `candle_id=eq.${candleId}`
        }, 
        callback
      )
      .subscribe();
    
    this.subscriptions.set(`intentions_${candleId}`, subscription);
    return subscription;
  }

  unsubscribe(channelName) {
    const subscription = this.subscriptions.get(channelName);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(channelName);
    }
  }

  unsubscribeAll() {
    for (const [name, subscription] of this.subscriptions) {
      supabase.removeChannel(subscription);
    }
    this.subscriptions.clear();
  }
}

export const realtimeService = new RealtimeService();