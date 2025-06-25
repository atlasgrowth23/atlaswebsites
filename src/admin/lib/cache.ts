interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T, ttlMinutes: number = 30): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    };
    
    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache stats
  getStats(): { size: number; keys: string[]; memoryUsage: number } {
    const keys = Array.from(this.cache.keys());
    const memoryUsage = JSON.stringify(Array.from(this.cache.entries())).length;
    
    return {
      size: this.cache.size,
      keys,
      memoryUsage
    };
  }

  // Clean up expired entries
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  // Cache with automatic refresh
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttlMinutes: number = 30
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttlMinutes);
    return data;
  }
}

// Create singleton instance
export const cache = new SimpleCache();

// Clean up expired entries every 10 minutes
setInterval(() => {
  const removed = cache.cleanup();
  if (removed > 0) {
    console.log(`Cache cleanup: removed ${removed} expired entries`);
  }
}, 10 * 60 * 1000);

// Helper functions for common cache patterns
export const cacheHelpers = {
  // Cache company data
  getCompany: async (slug: string) => {
    return cache.getOrSet(
      `company:${slug}`,
      async () => {
        const { supabaseAdmin } = await import('./supabase');
        const { data, error } = await supabaseAdmin
          .from('companies')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (error) {
          console.error('Cache getCompany error:', error);
          return null;
        }
        return data;
      },
      60 // Cache for 1 hour
    );
  },

  // Cache company frames
  getCompanyFrames: async (companyId: string) => {
    return cache.getOrSet(
      `frames:${companyId}`,
      async () => {
        const { supabaseAdmin } = await import('./supabase');
        const { data, error } = await supabaseAdmin
          .from('company_frames')
          .select('*')
          .eq('company_id', companyId);
        
        if (error) {
          console.error('Cache getCompanyFrames error:', error);
          return [];
        }
        
        // Convert array to object for easier lookup
        const framesObj: Record<string, string> = {};
        data?.forEach(frame => {
          framesObj[frame.slug] = frame.url;
        });
        return framesObj;
      },
      30 // Cache for 30 minutes
    );
  },

  // Cache business list (for dashboard)
  getBusinessList: async (page: number, limit: number, stateFilter?: string) => {
    const cacheKey = `businesses:${page}:${limit}:${stateFilter || 'all'}`;
    return cache.getOrSet(
      cacheKey,
      async () => {
        const { supabaseAdmin } = await import('./supabase');
        const offset = (page - 1) * limit;
        
        let query = supabaseAdmin
          .from('companies')
          .select('*')
          .range(offset, offset + limit - 1)
          .order('state')
          .order('city')
          .order('name');
        
        if (stateFilter && stateFilter !== 'all') {
          query = query.eq('state', stateFilter);
        } else {
          query = query.in('state', ['Alabama', 'Arkansas']);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Cache getBusinessList error:', error);
          return [];
        }

        return data || [];
      },
      15 // Cache for 15 minutes
    );
  },

  // Invalidate company-related caches
  invalidateCompany: (slug: string, companyId?: string) => {
    cache.delete(`company:${slug}`);
    if (companyId) {
      cache.delete(`frames:${companyId}`);
    }
    // Clear business list cache when company data changes
    const keys = cache.getStats().keys;
    keys.forEach(key => {
      if (key.startsWith('businesses:')) {
        cache.delete(key);
      }
    });
  }
};