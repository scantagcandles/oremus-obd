// mobile/src/services/cache/CacheService.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorHandler } from '../../utils/errorHandler';

// =====================================================
// CACHE CONFIGURATION
// =====================================================
const CACHE_CONFIG = {
  PREFIX: 'oremus_cache_',
  DEFAULT_TTL: 300000, // 5 minutes
  MAX_STORAGE_SIZE: 50 * 1024 * 1024, // 50MB
  CLEANUP_INTERVAL: 3600000, // 1 hour
  COMPRESSION_THRESHOLD: 1024, // 1KB
};

const CACHE_KEYS = {
  PRAYER_COUNT: 'prayer_count',
  USER_PROFILE: 'user_profile',
  CHURCHES: 'churches',
  PUBLIC_INTENTIONS: 'public_intentions',
  PRAYER_HISTORY: 'prayer_history',
  MASS_ORDERS: 'mass_orders',
  CANDLE_LOCATIONS: 'candle_locations',
  DAILY_READINGS: 'daily_readings',
  APP_CONFIG: 'app_config',
};

// =====================================================
// CACHE ENTRY INTERFACE
// =====================================================
class CacheEntry {
  constructor(data, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    this.data = data;
    this.timestamp = Date.now();
    this.ttl = ttl;
    this.accessCount = 1;
    this.lastAccessed = this.timestamp;
    this.size = this.calculateSize(data);
    this.compressed = false;
  }

  calculateSize(data) {
    return JSON.stringify(data).length * 2; // Approximate bytes (UTF-16)
  }

  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }

  isValid() {
    return !this.isExpired();
  }

  access() {
    this.accessCount++;
    this.lastAccessed = Date.now();
    return this.data;
  }

  getRemainingTTL() {
    const elapsed = Date.now() - this.timestamp;
    return Math.max(0, this.ttl - elapsed);
  }
}

// =====================================================
// MAIN CACHE SERVICE
// =====================================================
export class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.memoryStats = {
      hits: 0,
      misses: 0,
      size: 0,
      operations: 0
    };
    
    this.initializeCleanup();
  }

  // =====================================================
  // PUBLIC METHODS
  // =====================================================
  
  async get(key, options = {}) {
    this.memoryStats.operations++;
    
    try {
      // Try memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && memoryEntry.isValid()) {
        this.memoryStats.hits++;
        return memoryEntry.access();
      }

      // Try persistent cache
      const persistentData = await this.getPersistent(key);
      if (persistentData) {
        // Restore to memory cache if still valid
        const entry = new CacheEntry(persistentData.data, persistentData.ttl);
        entry.timestamp = persistentData.timestamp;
        
        if (entry.isValid()) {
          this.memoryCache.set(key, entry);
          this.updateMemoryStats();
          this.memoryStats.hits++;
          return entry.access();
        } else {
          // Remove expired data
          await this.deletePersistent(key);
        }
      }

      this.memoryStats.misses++;
      return options.defaultValue || null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.memoryStats.misses++;
      return options.defaultValue || null;
    }
  }

  async set(key, data, ttl = CACHE_CONFIG.DEFAULT_TTL, options = {}) {
    try {
      const entry = new CacheEntry(data, ttl);
      
      // Compress large entries
      if (entry.size > CACHE_CONFIG.COMPRESSION_THRESHOLD && options.compress !== false) {
        entry.data = await this.compress(data);
        entry.compressed = true;
      }

      // Store in memory
      this.memoryCache.set(key, entry);
      this.updateMemoryStats();

      // Store persistently if requested
      if (options.persistent !== false) {
        await this.setPersistent(key, entry);
      }

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      this.memoryCache.delete(key);
      await this.deletePersistent(key);
      this.updateMemoryStats();
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async clear() {
    try {
      this.memoryCache.clear();
      await this.clearPersistent();
      this.resetStats();
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  async isValid(key) {
    const entry = this.memoryCache.get(key);
    if (entry) {
      return entry.isValid();
    }

    const persistentData = await this.getPersistent(key);
    if (persistentData) {
      const entry = new CacheEntry(persistentData.data, persistentData.ttl);
      entry.timestamp = persistentData.timestamp;
      return entry.isValid();
    }

    return false;
  }

  async exists(key) {
    if (this.memoryCache.has(key)) {
      return true;
    }

    try {
      const persistentData = await AsyncStorage.getItem(this.getStorageKey(key));
      return persistentData !== null;
    } catch (error) {
      return false;
    }
  }

  async size() {
    let totalSize = 0;
    
    // Memory cache size
    for (const entry of this.memoryCache.values()) {
      totalSize += entry.size;
    }

    // Persistent cache size estimation
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_CONFIG.PREFIX));
      
      for (const key of cacheKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            totalSize += data.length * 2; // UTF-16 bytes
          }
        } catch (error) {
          // Skip corrupted entries
        }
      }
    } catch (error) {
      console.error('Cache size calculation error:', error);
    }

    return totalSize;
  }

  getStats() {
    const hitRate = this.memoryStats.operations > 0 
      ? (this.memoryStats.hits / this.memoryStats.operations * 100).toFixed(2)
      : 0;

    return {
      ...this.memoryStats,
      hitRate: `${hitRate}%`,
      memoryEntries: this.memoryCache.size,
    };
  }

  // =====================================================
  // SPECIALIZED CACHE METHODS
  // =====================================================

  async getOrSet(key, factory, ttl = CACHE_CONFIG.DEFAULT_TTL, options = {}) {
    const cached = await this.get(key, options);
    if (cached !== null) {
      return cached;
    }

    try {
      const data = await factory();
      await this.set(key, data, ttl, options);
      return data;
    } catch (error) {
      if (options.fallbackValue !== undefined) {
        return options.fallbackValue;
      }
      throw error;
    }
  }

  async setWithTags(key, data, tags = [], ttl = CACHE_CONFIG.DEFAULT_TTL) {
    await this.set(key, data, ttl);
    
    // Store tag mappings
    for (const tag of tags) {
      await this.addToTag(tag, key);
    }
  }

  async invalidateByTag(tag) {
    try {
      const taggedKeys = await this.getTaggedKeys(tag);
      const promises = taggedKeys.map(key => this.delete(key));
      await Promise.all(promises);
      
      // Clear tag mapping
      await this.deletePersistent(`tag_${tag}`);
      
      return true;
    } catch (error) {
      console.error('Tag invalidation error:', error);
      return false;
    }
  }

  async warmup(warmupData) {
    const promises = Object.entries(warmupData).map(([key, { factory, ttl, options }]) =>
      this.getOrSet(key, factory, ttl, { ...options, persistent: true })
    );

    try {
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Cache warmup error:', error);
      return false;
    }
  }

  // =====================================================
  // PRIVATE METHODS
  // =====================================================

  async getPersistent(key) {
    try {
      const data = await AsyncStorage.getItem(this.getStorageKey(key));
      if (data) {
        const parsed = JSON.parse(data);
        
        // Decompress if needed
        if (parsed.compressed) {
          parsed.data = await this.decompress(parsed.data);
        }
        
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('Persistent cache get error:', error);
      return null;
    }
  }

  async setPersistent(key, entry) {
    try {
      const data = {
        data: entry.data,
        timestamp: entry.timestamp,
        ttl: entry.ttl,
        compressed: entry.compressed
      };
      
      await AsyncStorage.setItem(this.getStorageKey(key), JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Persistent cache set error:', error);
      return false;
    }
  }

  async deletePersistent(key) {
    try {
      await AsyncStorage.removeItem(this.getStorageKey(key));
      return true;
    } catch (error) {
      console.error('Persistent cache delete error:', error);
      return false;
    }
  }

  async clearPersistent() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_CONFIG.PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      return true;
    } catch (error) {
      console.error('Persistent cache clear error:', error);
      return false;
    }
  }

  getStorageKey(key) {
    return `${CACHE_CONFIG.PREFIX}${key}`;
  }

  updateMemoryStats() {
    let totalSize = 0;
    for (const entry of this.memoryCache.values()) {
      totalSize += entry.size;
    }
    this.memoryStats.size = totalSize;
  }

  resetStats() {
    this.memoryStats = {
      hits: 0,
      misses: 0,
      size: 0,
      operations: 0
    };
  }

  async compress(data) {
    // Simple compression using JSON.stringify with space removal
    // In a real app, you might use a proper compression library
    try {
      const jsonString = JSON.stringify(data);
      return btoa(jsonString); // Base64 encoding as simple compression
    } catch (error) {
      console.error('Compression error:', error);
      return data;
    }
  }

  async decompress(compressedData) {
    try {
      const jsonString = atob(compressedData);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decompression error:', error);
      return compressedData;
    }
  }

  async addToTag(tag, key) {
    try {
      const existingKeys = await this.getTaggedKeys(tag);
      const updatedKeys = [...new Set([...existingKeys, key])];
      await this.setPersistent(`tag_${tag}`, { keys: updatedKeys });
    } catch (error) {
      console.error('Add to tag error:', error);
    }
  }

  async getTaggedKeys(tag) {
    try {
      const tagData = await this.getPersistent(`tag_${tag}`);
      return tagData?.keys || [];
    } catch (error) {
      console.error('Get tagged keys error:', error);
      return [];
    }
  }

  initializeCleanup() {
    // Cleanup expired entries periodically
    setInterval(() => {
      this.cleanup();
    }, CACHE_CONFIG.CLEANUP_INTERVAL);

    // Initial cleanup
    setTimeout(() => {
      this.cleanup();
    }, 10000); // 10 seconds after init
  }

  async cleanup() {
    try {
      // Memory cache cleanup
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.isExpired()) {
          this.memoryCache.delete(key);
        }
      }

      // Persistent cache cleanup
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_CONFIG.PREFIX));

      for (const storageKey of cacheKeys) {
        try {
          const data = await AsyncStorage.getItem(storageKey);
          if (data) {
            const parsed = JSON.parse(data);
            const entry = new CacheEntry(parsed.data, parsed.ttl);
            entry.timestamp = parsed.timestamp;

            if (entry.isExpired()) {
              await AsyncStorage.removeItem(storageKey);
            }
          }
        } catch (error) {
          // Remove corrupted entries
          await AsyncStorage.removeItem(storageKey);
        }
      }

      // Check total size and cleanup if necessary
      const totalSize = await this.size();
      if (totalSize > CACHE_CONFIG.MAX_STORAGE_SIZE) {
        await this.performLRUCleanup();
      }

      this.updateMemoryStats();
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
        }
  }
