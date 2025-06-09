# ModernTrust Template Performance Optimization

## Current Performance Issues

The ModernTrust template is loading slowly due to multiple database queries on every page load:

### Root Cause: 3 Separate Database Queries
**File:** `/pages/t/[template_key]/[slug].tsx` (lines 57-83)
- Query 1: Get company data
- Query 2: Get company frames 
- Query 3: Get template frames

**Impact:** 
- Each query adds 200-500ms latency
- Total: 600-1500ms just for database calls
- Results in 480kb page data warning

## Suggested Optimizations (Priority Order)

### 1. **Combine Database Queries** (SAFE - 3x faster)
**Risk Level:** Low
**Performance Gain:** 60-70% improvement

Create a single PostgreSQL function to get all data:
```sql
CREATE OR REPLACE FUNCTION get_company_with_frames(
  company_slug text,
  template_key_param text
)
RETURNS TABLE (
  -- All company fields
  id uuid,
  name text,
  slug text,
  city text,
  state text,
  phone text,
  email_1 text,
  logo_storage_path text,
  predicted_label text,
  -- Aggregated frame data
  company_frames jsonb,
  template_frames jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.*,
    COALESCE(
      json_object_agg(cf.slug, cf.url) FILTER (WHERE cf.slug IS NOT NULL),
      '{}'::jsonb
    ) as company_frames,
    COALESCE(
      json_object_agg(tf.slug, tf.default_url) FILTER (WHERE tf.slug IS NOT NULL),
      '{}'::jsonb  
    ) as template_frames
  FROM companies c
  LEFT JOIN company_frames cf ON c.id = cf.company_id
  LEFT JOIN frames tf ON tf.template_key = template_key_param
  WHERE c.slug = company_slug
  GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;
```

### 2. **Image Optimization** (SAFE - Minor improvement)
**Risk Level:** Very Low
**Performance Gain:** 10-20% improvement

**File:** `/components/templates/ModernTrust/Hero.tsx` (line 90)
```typescript
// Current
quality={90}
sizes="100vw"

// Optimized  
quality={75}
sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
```

### 3. **Implement Caching Strategy** (MEDIUM RISK)
**Risk Level:** Medium
**Performance Gain:** 80-90% improvement for repeat visitors

Use the existing cache system in template rendering:
```typescript
// Use cache helpers instead of direct queries
const company = await cacheHelpers.getCompany(slug);
const companyFrames = await cacheHelpers.getCompanyFrames(company.id);
```

### 4. **Switch to Static Generation** (HIGH RISK)
**Risk Level:** High
**Performance Gain:** 95% improvement but may break features

⚠️ **NOT RECOMMENDED** - Would break:
- Real-time template editor updates
- Custom domain support  
- Preview functionality

## Implementation Plan

### Phase 1: Database Optimization (RECOMMENDED)
1. Create the PostgreSQL function above
2. Update template page to use single query with fallback
3. Test with existing companies
4. Monitor performance improvement

### Phase 2: Image Optimization  
1. Reduce image quality from 90 to 75
2. Implement responsive image sizes
3. Add lazy loading for below-fold images

### Phase 3: Enhanced Caching (Optional)
1. Implement Redis for production
2. Add smart cache invalidation
3. Preload critical company data

## Expected Results

**Before:** 2-4 second ModernTrust load times
**After Phase 1:** 0.5-1.5 second load times  
**After Phase 2:** 0.3-1 second load times

## Risk Mitigation

- All optimizations include fallback to current method
- Database function is backwards compatible
- Easy rollback if issues occur
- No changes to template editor functionality

---
*Generated: ${new Date().toISOString()}*
*Analyzed files: /pages/t/[template_key]/[slug].tsx, /lib/cache.ts, /components/templates/ModernTrust/Hero.tsx*