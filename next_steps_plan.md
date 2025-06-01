# Next Steps for HVAC Directory Platform

## ✅ What's Complete
- **Database**: 860 companies imported to Supabase with geocoded cities
- **Logo Logic**: Companies marked as `predicted_label='logo'` have storage paths set
- **Template Structure**: ModernTrust template working with proper frame mapping

## 🎯 Immediate Next Steps

### 1. Upload Template Images to Supabase Storage
**Status**: Missing template background images
**Action needed**: Upload these files to Supabase Storage `/images/templates/moderntrust/`:
- `hero.jpg` - Main hero background image
- `about.jpg` - About section background image
- `default-logo.svg` - Default logo for companies without logos

**Current issue**: Templates show broken images because these files don't exist in storage yet.

### 2. Fix Template Image URLs in Database
**Current frames in database point to**:
```
/storage/templates/moderntrust/hero.jpg  ❌ (double /storage/)
```

**Should be**:
```
/templates/moderntrust/hero.jpg  ✅
```

**Action**: Run frame URL fix script to remove duplicate `/storage/` prefix.

### 3. Upload Company Logos (511 companies)
**Status**: No logos uploaded yet
**Companies with `predicted_label='logo'`**: 511 companies
**Expected storage paths**: `/logos/{slug}.png`

**Options**:
- **Manual upload**: Use Supabase Storage dashboard
- **Bulk processing**: Create script to generate/download logos
- **Progressive**: Upload high-priority companies first

### 4. Enable Logo Display Logic
**Current state**: All companies show text (`logoUrl = null` in template)
**Action**: Uncomment logo logic in `/pages/t/[template_key]/[slug].tsx`:

```typescript
// TODO: When logos are uploaded to storage, uncomment this:
if (company.predicted_label === 'logo' && company.logo_storage_path) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  company.logoUrl = `${supabaseUrl}/storage/v1/object/public/images${company.logo_storage_path}`;
} else {
  company.logoUrl = null;
}
```

## 🚀 Quick Wins (Do These First)

### Priority 1: Get Template Images Working
1. Upload 3 template images to Supabase Storage
2. Fix frame URLs in database
3. Test one template page

### Priority 2: Test Logo System
1. Upload 1-2 test company logos
2. Enable logo display logic
3. Verify logo vs text display works

### Priority 3: Bulk Logo Processing
1. Process remaining 509 company logos
2. Upload to Supabase Storage
3. Full platform testing

## 📁 Files That Need Template Images

Current template components expecting images:
- `/components/templates/ModernTrust/Hero.tsx` - Uses `hero_img` and `hero_img_2`
- `/components/templates/ModernTrust/About.tsx` - Uses `about_img`
- `/components/templates/ModernTrust/Header.tsx` - Uses company logos

## 🎯 Success Criteria

When complete, you should have:
- ✅ All 860 companies accessible via `/t/moderntrust/{slug}` URLs
- ✅ Template backgrounds showing properly
- ✅ 511 companies displaying logos, 349 displaying text
- ✅ Working contact forms and phone links
- ✅ Professional-looking business directory

## 🛠️ Ready-to-Run Scripts

1. `fix-frame-urls.js` - Fix template image paths
2. `upload-template-images.js` - (needs creation) Bulk upload template images
3. `process-company-logos.js` - (needs creation) Generate/upload company logos

Would you like me to start with uploading template images or fixing the frame URLs first?