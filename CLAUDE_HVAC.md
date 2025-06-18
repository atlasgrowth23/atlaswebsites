# Claude Instructions for HVAC CRM Development

## Core Philosophy: Avoid Dead Ends

When building features for the HVAC CRM system, always identify and clarify unclear requirements to avoid building "dead end" functionality that doesn't integrate with the broader business system.

## Required Approach for Unclear Requirements

### When You Encounter Ambiguous Specifications:

1. **Identify the Gap**: Note any options/features that don't have a clear business purpose or integration path
2. **Ask Specific Questions**: Don't assume - ask Nick directly about:
   - Business logic triggers
   - Integration points with existing systems  
   - Clear definitions of statuses/categories
   - Real-world workflow implications

### Example of Good Question Framework:

**Instead of assuming**, ask:
- "When does someone go from `new_lead` to `existing_customer`?"
- "What sources make sense for your HVAC business?"
- "Which activities matter most for tracking leads?"

**Always include:**
- Current clear options (✅ green checkmarks)
- Unclear areas that need clarification  
- Suggested options with business context
- Integration implications

## HVAC Business Context

This is a **comprehensive HVAC contractor CRM** being built. The chat widget is just one small piece that must integrate with:
- Customer management
- Job scheduling  
- Invoicing/payments
- Service history
- Lead tracking

## Database Design Principles

### Table Naming Convention:
- `hvac_*` - Core HVAC CRM tables
- `admin_*` - Admin dashboard tables  
- `chat_*` - Chat widget specific tables
- Shared: `companies`, `users`

### Status Fields:
Keep simple, business-focused statuses:
- `new_lead` - First contact, no service yet
- `existing_customer` - Has received service/paid invoices

Avoid complex intermediate statuses unless they have clear business triggers.

### Activity Tracking:
Use flexible activity system that can grow:
```sql
activity_type TEXT -- 'contact_created', 'chat_service_request', etc.
description TEXT -- Human readable description
metadata JSONB -- Extensible data storage
```

## Implementation Rule

**Only build what has clear business logic.** When in doubt, create the documentation structure but ask for clarification before implementation.

## Questions to Always Ask

1. **Business Trigger**: When does this status/activity happen?
2. **Integration**: How does this connect to other HVAC business processes?
3. **User Workflow**: How will Nick's team actually use this?
4. **Data Flow**: Where does this data come from and where does it go?

Follow this approach to build a cohesive, extensible HVAC CRM system without dead ends.

## Current Implementation Status

### ✅ Completed:
- HVAC database tables with demo data system
- Professional chat widget with company integration
- `/hvac/contacts` page with FieldD-inspired design
- Demo mode toggle for sales presentations

### 🔥 Critical Issue: Multi-Tenant Company Filtering
**Problem**: Currently shows all companies' data mixed together
**Solution Needed**: Company-specific filtering via slug system

### Authentication Strategy for Business Model:
**Prospect Phase**: Use company slug URLs for demos (`?company=ready-heating-air`)
**Customer Phase**: Implement proper authentication after they convert

### Implementation Priority:
1. Company slug detection and filtering
2. Link chat widget to correct company context  
3. Build `/hvac/messages` page
4. Clean up old dead-end files

**Next agent should focus on company-specific data filtering as the highest priority.**