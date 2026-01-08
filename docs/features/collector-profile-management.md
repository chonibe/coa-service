# Collector Profile Management

## Recent Updates

### Admin Collector Profile Access (2025-01-08)
- **Issue Fixed**: Admin users (like `chonibe@gmail.com`) couldn't access collector profile functionality
- **Solution**: Added collector profile access to admin dashboard
- **Changes**:
  - Added "Your collector profile" link to admin dashboard actions
  - Created dedicated `/admin/collector-profile` page with full collector functionality
  - Admin users can now manage their collector profiles, view editions, orders, and change history
  - Tabs for Profile, Editions, Orders, and History
  - Seamless integration with existing collector profile APIs

### Holistic Collector Profile (2025-01-08)
- **New Feature**: Comprehensive collector profile view
- **Components**:
  - `collector_profile_comprehensive` database view for aggregated data
  - `/api/collector/profile/comprehensive` API endpoint
  - Frontend page at `/collector/profile/comprehensive`
  - Profile management with immutable change log
  - Guest purchase linking functionality
- **Data Sources**: Auth users, collector profiles, orders, editions, warehouse PII
- **Statistics**: Total editions, authenticated editions, total orders, spending, purchase dates

## Feature Overview

The Collector Profile Management system provides comprehensive functionality for users to manage their collector identities, view their edition collections, and maintain purchase history.

## Technical Implementation

### Database Schema
- `collector_profiles`: Mutable profile data (name, email, phone, bio, avatar)
- `collector_profile_changes`: Immutable audit log of all profile modifications
- `collector_profile_comprehensive`: Aggregated view combining all collector data

### API Endpoints
- `GET/PUT /api/collector/profile`: Profile management
- `GET /api/collector/profile/history`: Change history
- `GET /api/collector/profile/comprehensive`: Holistic profile data
- `POST /api/collector/link-guest-purchases`: Link guest purchases to profile

### Frontend Components
- `/collector/profile`: Profile management page
- `/collector/profile/comprehensive`: Comprehensive profile view
- `/admin/collector-profile`: Admin collector profile access

### Security & Privacy
- Profile data is user-scoped via RLS policies
- Immutable audit trail prevents data erasure
- Guest purchase linking requires explicit user consent

## User Experience

### Profile Management
- Edit personal information (name, phone, bio, avatar)
- View immutable change history
- Link guest purchases made with different emails

### Collection Overview
- View all owned editions with status
- Order history and fulfillment tracking
- Edition authentication status
- Purchase statistics and analytics

### Admin Integration
- Admin users can access collector functionality
- Seamless switching between admin and collector views
- Unified data across all user roles
