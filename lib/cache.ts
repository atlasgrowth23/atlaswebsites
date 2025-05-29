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
        const { queryOne } = await import('./db');
        return queryOne(`
          SELECT c.*, 
                 c.hours, c.saturday_hours, c.sunday_hours, c.emergency_service
          FROM companies c 
          WHERE slug = $1
        `, [slug]);
      },
      60 // Cache for 1 hour
    );
  },

  // Cache company frames
  getCompanyFrames: async (companyId: string) => {
    return cache.getOrSet(
      `frames:${companyId}`,
      async () => {
        const { queryOne } = await import('./db');
        return queryOne('SELECT * FROM company_frames WHERE company_id = $1', [companyId]);
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
        const { query } = await import('./db');
        const offset = (page - 1) * limit;
        
        let whereClause = "WHERE (c.state = 'Alabama' OR c.state = 'Arkansas')";
        const params: any[] = [limit, offset];
        
        if (stateFilter && stateFilter !== 'all') {
          whereClause = "WHERE c.state = $3";
          params.push(stateFilter);
        }

        const result = await query(`
          SELECT 
            c.id, c.name, c.slug, c.city, c.state, c.phone, c.email_1, c.custom_domain,
            c.hours, c.saturday_hours, c.sunday_hours, c.emergency_service,
            main_track.tracking_enabled,
            main_track.total_views,
            main_track.last_viewed_at,
            -- Include frame data as JSON object
            json_build_object(
              'hero_img', hero_frames.url,
              'hero_img_2', hero2_frames.url,
              'about_img', about_frames.url,
              'logo_url', logo_frames.url
            ) as frames
          FROM companies c
          LEFT JOIN (
            SELECT company_id, tracking_enabled, total_views, last_viewed_at 
            FROM enhanced_tracking WHERE session_id IS NULL
          ) main_track ON c.id = main_track.company_id
          LEFT JOIN company_frames hero_frames ON c.id = hero_frames.company_id AND hero_frames.slug = 'hero_img'
          LEFT JOIN company_frames hero2_frames ON c.id = hero2_frames.company_id AND hero2_frames.slug = 'hero_img_2'
          LEFT JOIN company_frames about_frames ON c.id = about_frames.company_id AND about_frames.slug = 'about_img'
          LEFT JOIN company_frames logo_frames ON c.id = logo_frames.company_id AND logo_frames.slug = 'logo_url'
          ${whereClause}
          ORDER BY c.state, c.city, c.name
          LIMIT $1 OFFSET $2
        `, params);

        return result.rows;
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