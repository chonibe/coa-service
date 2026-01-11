-- Add Recent Release Notes - January 2026 Features

INSERT INTO public.platform_updates (title, description, category, version, stakeholder_summary, technical_details, impact_level, is_breaking, admin_email)
VALUES
(
  'Automated Edition Numbering & Warehouse PII Bridge',
  'Implemented a "Hybrid Bridge" to link Personal Identifiable Information (PII) from ChinaDivision warehouse sync to Shopify orders. Automated edition assignment for 521 historical line items and established an immutable event ledger for edition provenance.',
  'feature',
  '1.1.0',
  'Orders now automatically receive sequential edition numbers when fulfilled through our warehouse system. This bridges the gap between ChinaDivision order data and our internal edition tracking, ensuring collectors get properly numbered certificates.',
  '## Core Logical Threads:
1. **PII Bridge Architecture**: Hybrid system linking warehouse customer data to Shopify orders
2. **Automated Edition Assignment**: Trigger-based edition number allocation on fulfillment
3. **Immutable Event Ledger**: Cryptographic audit trail for edition provenance
4. **Historical Data Migration**: Bulk assignment for 521 existing line items

## Frameworks & Technologies:
- **Supabase Database Triggers**: Automatic edition assignment on order updates
- **Node.js Migration Scripts**: Bulk historical data processing
- **Cryptographic Hashing**: SHA-256 for event ledger integrity
- **Database Transactions**: ACID-compliant edition assignment

## Implementation Details:
- **Bridge Logic** (`lib/warehouse/pii-bridge.ts`): Customer data matching algorithms
- **Edition Triggers** (`supabase/functions/assign-edition-trigger.sql`): Database-level automation
- **Event Ledger** (`supabase/migrations/edition-events-table.sql`): Immutable audit system
- **Migration Script** (`scripts/assign-historical-editions.js`): Bulk processing utility

## Database Schema Changes:
- **edition_events**: Immutable event log with cryptographic signatures
- **order_line_items_v2.edition_assigned_at**: Timestamp tracking
- **warehouse_customer_bridge**: PII mapping table
- **edition_assignment_log**: Audit trail for automated assignments

## Security Considerations:
- **PII Encryption**: Sensitive customer data encryption at rest
- **Access Controls**: Role-based access to PII bridge data
- **Audit Logging**: Complete assignment activity tracking
- **Data Retention**: Compliance with privacy regulations

## Performance Optimizations:
- **Batch Processing**: Efficient bulk edition assignment
- **Index Optimization**: Fast PII matching queries
- **Async Processing**: Background edition assignment jobs
- **Caching Layer**: Customer data lookup optimization',
  'high',
  false,
  'admin@streetcollector.com'
),
(
  'Collector Profile Management System',
  'Created user-managed profile system with immutable change history, guest purchase linking, and preference-based edition naming. Collectors can update their names while preserving purchase history and activity logs.',
  'feature',
  '1.1.0',
  'Collectors now have full control over their profiles, including name preferences and linking guest purchases. All changes are tracked immutably, ensuring purchase history integrity while allowing personalization.',
  '## Core Logical Threads:
1. **Profile Management**: User-controlled profile data with validation
2. **Guest Purchase Linking**: Automated guest-to-registered account migration
3. **Immutable Change History**: Complete audit trail for profile modifications
4. **Preference-Based Naming**: Custom edition certificate names

## Frameworks & Technologies:
- **Supabase Auth**: User identity and session management
- **React Hook Form**: Client-side form validation and submission
- **Database Triggers**: Automatic audit log creation
- **Email Verification**: Secure profile change notifications

## Implementation Details:
- **Profile API** (`/api/collector/profile`): CRUD operations with validation
- **Guest Linking** (`/api/collector/link-guest-purchases`): Purchase migration logic
- **Audit System** (`supabase/triggers/profile_changes_audit.sql`): Change tracking
- **Preference Engine** (`lib/collector/preferences.ts`): Custom naming logic

## Database Schema Changes:
- **collector_profiles**: Extended profile data with preferences
- **profile_change_history**: Immutable audit table
- **guest_purchase_links**: Migration tracking table
- **certificate_naming_prefs**: Custom naming preferences

## User Experience:
- **Profile Dashboard**: Comprehensive self-service interface
- **Change Notifications**: Email alerts for profile modifications
- **Purchase History**: Seamless guest-to-registered migration
- **Certificate Personalization**: Custom edition naming

## Security Architecture:
- **Data Validation**: Comprehensive input sanitization
- **Change Approval**: Email verification for sensitive changes
- **Audit Compliance**: Complete activity logging
- **Privacy Controls**: User data access management',
  'medium',
  false,
  'admin@streetcollector.com'
),
(
  'Holistic Collector Profile',
  'Implemented comprehensive collector profile aggregating all data sources: Shopify orders, warehouse PII, edition assignments, authentication status, and activity history in a single unified view.',
  'feature',
  '1.1.0',
  'Collectors now see a complete, unified view of their account across all platform interactions. No more disconnected data - everything from orders to certificates to activity history in one place.',
  '## Core Logical Threads:
1. **Data Aggregation**: Unified profile from multiple data sources
2. **Real-time Synchronization**: Live updates across all systems
3. **Authentication Status**: Clear visibility into account verification
4. **Activity Timeline**: Complete chronological activity history

## Frameworks & Technologies:
- **GraphQL Federation**: Unified data access across microservices
- **Supabase Views**: Database-level data aggregation
- **React Query**: Client-side data synchronization
- **Real-time Subscriptions**: Live profile updates

## Implementation Details:
- **Unified API** (`/api/collector/profile/comprehensive`): Aggregated data endpoint
- **Database Views** (`supabase/views/collector_profile_unified.sql`): Data consolidation
- **Real-time Updates** (`lib/collector/profile-sync.ts`): Live synchronization
- **Activity Feed** (`components/collector/activity-timeline.tsx`): Chronological display

## Data Sources Integration:
- **Shopify Orders**: Purchase history and transaction data
- **Warehouse PII**: Shipping and customer information
- **Edition Assignments**: Certificate ownership tracking
- **Authentication Events**: Account verification status
- **Activity Logs**: Complete interaction history

## Performance Optimizations:
- **Materialized Views**: Pre-computed profile aggregations
- **Query Optimization**: Efficient multi-table joins
- **Caching Strategy**: Profile data caching with invalidation
- **Incremental Updates**: Delta-based synchronization

## Privacy & Compliance:
- **Data Minimization**: Only necessary data aggregation
- **Consent Management**: User-controlled data visibility
- **Audit Trails**: Complete data access logging
- **GDPR Compliance**: Right to data portability',
  'medium',
  false,
  'admin@streetcollector.com'
),
(
  'Collector Data Enrichment Unification',
  'Unified collector data enrichment protocol by establishing a case-insensitive database view as the single source of truth. Refactored APIs and Admin UI to rely on this unified profile, resolving the "Guest Customer" display issue for enriched orders.',
  'improvement',
  '1.1.0',
  'Fixed inconsistent customer data display across the platform. Guest customers now show properly enriched information, and all systems use the same unified data source for collector information.',
  '## Core Logical Threads:
1. **Data Unification**: Single source of truth for collector data
2. **Case-Insensitive Matching**: Robust customer data deduplication
3. **API Refactoring**: Consistent data access patterns
4. **UI Consistency**: Unified customer display across admin interfaces

## Frameworks & Technologies:
- **Supabase Database Views**: Case-insensitive data unification
- **API Middleware**: Centralized data access layer
- **React Context**: Client-side data consistency
- **Database Indexing**: Optimized search performance

## Implementation Details:
- **Unified View** (`supabase/views/collector_unified.sql`): Case-insensitive aggregation
- **API Refactor** (`lib/collector/unified-api.ts`): Consistent data access
- **UI Updates** (`app/admin/components/customer-display.tsx`): Unified rendering
- **Migration Script** (`scripts/unify-collector-data.js`): Data consolidation

## Database Schema Changes:
- **collector_unified_view**: Case-insensitive data aggregation
- **data_enrichment_log**: Enrichment activity tracking
- **api_access_patterns**: Usage analytics for optimization
- **consistency_checks**: Data validation mechanisms

## Data Quality Improvements:
- **Deduplication**: Automatic duplicate detection and merging
- **Normalization**: Consistent data formatting
- **Validation**: Real-time data quality checks
- **Enrichment**: Automated data completion

## System Integration:
- **Admin Dashboard**: Consistent customer display
- **API Endpoints**: Unified data responses
- **Search Functionality**: Improved customer lookup
- **Reporting Systems**: Accurate customer analytics',
  'low',
  false,
  'admin@streetcollector.com'
),
(
  'Edition Numbering System Overhaul',
  'Complete rewrite of the edition numbering system with robust error handling, transaction safety, and comprehensive audit trails. Implemented proper sequence management and conflict resolution.',
  'improvement',
  '1.1.0',
  'Edition numbers are now assigned reliably and safely, with proper error handling and audit trails. No more duplicate editions or missing assignments.',
  '## Core Logical Threads:
1. **Transaction Safety**: ACID-compliant edition assignment
2. **Conflict Resolution**: Duplicate prevention and recovery
3. **Audit Trail**: Complete assignment history tracking
4. **Sequence Management**: Proper edition number allocation

## Frameworks & Technologies:
- **Supabase Transactions**: Database-level atomic operations
- **Node.js Workers**: Background edition processing
- **Error Boundaries**: Graceful failure handling
- **Audit Logging**: Comprehensive change tracking

## Implementation Details:
- **Assignment Engine** (`lib/edition/assignment-engine.ts`): Core numbering logic
- **Conflict Resolver** (`lib/edition/conflict-resolution.ts`): Duplicate handling
- **Audit System** (`supabase/tables/edition_audit.sql`): Complete tracking
- **Worker Queue** (`app/api/edition/assign-worker/route.ts`): Background processing

## Database Schema Changes:
- **edition_sequences**: Proper sequence management
- **edition_conflicts**: Conflict resolution tracking
- **assignment_transactions**: Transaction log for rollbacks
- **edition_audit_trail**: Complete assignment history

## Error Handling:
- **Transaction Rollbacks**: Automatic failure recovery
- **Conflict Detection**: Duplicate assignment prevention
- **Retry Logic**: Exponential backoff for transient failures
- **Alert System**: Critical failure notifications

## Performance Optimizations:
- **Batch Processing**: Efficient bulk assignments
- **Index Optimization**: Fast conflict detection
- **Caching Layer**: Sequence state caching
- **Async Processing**: Non-blocking assignment operations',
  'high',
  false,
  'admin@streetcollector.com'
);
