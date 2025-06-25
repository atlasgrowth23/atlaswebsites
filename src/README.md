# New Product-Based Structure

This directory contains the new organized structure for Atlas products.

## Structure

```
src/
├── products/
│   ├── atlashvac/          # HVAC CRM Product
│   │   ├── components/     # HVAC-specific components
│   │   ├── lib/           # HVAC business logic
│   │   └── types/         # HVAC type definitions
│   │
│   ├── websites/          # Website Template Business
│   │   ├── templates/     # All website templates
│   │   ├── components/    # Template builder components
│   │   └── lib/          # Template engine logic
│   │
│   ├── reviews/           # Review Automation (Future)
│   │   ├── components/    # Review management UI
│   │   ├── lib/          # Review automation logic
│   │   └── scripts/      # Review scraping scripts
│   │
│   └── shared/           # Cross-product utilities
│       ├── components/   # Shared UI components
│       ├── lib/         # Shared utilities
│       └── types/       # Shared type definitions
│
└── admin/               # Cross-product management
    ├── components/      # Admin dashboard components
    └── lib/            # Admin utilities
```

## Import Paths

Use the new TypeScript path aliases:

```typescript
// AtlasHVAC imports
import { EquipmentManager } from '@/atlashvac/components'
import { atlashvacEquipment } from '@/atlashvac/lib'

// Website template imports  
import { ModernTrust } from '@/websites/templates'
import { templateEngine } from '@/websites/lib'

// Shared utilities
import { Button } from '@/shared/components/ui'
import { supabase } from '@/shared/lib'

// Admin components
import { AdminLayout } from '@/admin/components'
```

## Migration Status

✅ Directory structure created
✅ Files copied to new locations  
✅ TypeScript paths configured
⏳ Import updates (gradual migration)
⏳ Route updates (keeping old routes working)

## Benefits

- **Product isolation**: Each product has its own space
- **Shared utilities**: Common code reused across products
- **Easy expansion**: Clear place for new products/templates
- **Better organization**: No more digging through mixed folders