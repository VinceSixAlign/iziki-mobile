# DEEP SUPABASE SCHEMA ANALYSIS - FINDINGS

## Critical Discovery: Schema Mismatch

### Project Type Enum
**Database Reality:**
```
project_type_enum: [buy, rent]
```

**Our Code Was Using:**
```
project_type: [buy, rent, invest]
```

**Result:** Database rejects "invest" with error:
`invalid input value for enum project_type_enum: "invest"`

## Complete Database Schema

### Tables Confirmed
1. **projects** - Main project table
2. **system_criteria** - 17 criteria definitions
3. **project_criteria** - User preferences per project
4. **project_criteria_values** - Preference values
5. **properties** - Properties to evaluate
6. **visits** - Visit records
7. **evaluations** - Observations during visits
8. **project_members** - Collaboration
9. **all_enums** - View with all enum values

### Projects Table Structure
```javascript
{
  id: uuid,
  owner_id: uuid,
  project_type: enum (buy | rent),  // NOT invest!
  project_status: enum (active | closed),
  urgency_level: enum (low | medium | high),
  title: text,
  budget_target: integer,
  budget_max: integer,
  currency: char(3),
  location_area: text,
  property_type: enum (house | apartment | indifferent),
  created_at: timestamp,
  updated_at: timestamp
}
```

### System Criteria (17 total)
- Boolean: balcony, bathroom, bedrooms, garage, garden, terrace
- Number: bathrooms, bedrooms, land_area, living_area
- Range: charges, price
- Enum: condition, energy_rating, location_context, parking_ease, property_type, shops_access, transport_access

### All Available Enums
```
project_type_enum: [buy, rent]
urgency_level_enum: [low, medium, high]
project_status_enum: [active, closed]
preference_level_enum: [required, preferred, optional]
property_type_enum: [house, apartment, indifferent]
overall_condition_enum: [ready, refresh, renovate]
energy_rating_enum: [A++, A+, A, B, C, D, E, F, G]
area_type_enum: [urban, suburban, rural]
distance_access_enum: [lt_1km, km_1_2, gt_2km]
parking_ease_enum: [easy, moderate, uneasy]
```

## Fabric Boolean Issue - Likely Root Cause

The "expected boolean but got string" error is likely because:
1. Enum values from Supabase are strings
2. We may be using enum values where boolean props are expected
3. Or boolean columns are being serialized as strings

## Fixes Applied

### Mobile App (ProjectsScreen.js)
- Removed "invest" option (not supported by database)
- Now only shows: buy, rent

### Database Alignment
- All code now matches actual database schema
- No attempts to use unsupported enum values

## Next Steps
1. Test app with only buy/rent options
2. Verify boolean props are never receiving enum string values
3. Check if database boolean columns return actual booleans or strings
