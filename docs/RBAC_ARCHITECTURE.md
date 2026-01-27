# RBAC System Architecture

## System Overview

```mermaid
graph TB
    subgraph "User Login Flow"
        A[User Logs In] --> B[Supabase Auth]
        B --> C[JWT Token Generated]
        C --> D{Custom Access Token Hook}
        D --> E[Query user_roles Table]
        E --> F[Inject Roles into JWT]
        F --> G[Return JWT with Claims]
    end
    
    subgraph "JWT Claims Structure"
        G --> H[user_roles: admin, vendor, collector]
        G --> I[vendor_id: 123 for vendors]
        G --> J[user_permissions: array of permissions]
        G --> K[rbac_version: 2.0]
    end
    
    subgraph "Authorization Flow"
        L[API Request] --> M{Verify JWT}
        M --> N[Extract Roles from JWT]
        N --> O{Check Permission}
        O -->|Authorized| P[Allow Access]
        O -->|Not Authorized| Q[Deny Access]
    end
    
    subgraph "Database Layer"
        R[RLS Policy Triggered] --> S{public.has_role}
        S --> T[Read JWT Claims]
        T --> U{Role Match?}
        U -->|Yes| V[Allow Query]
        U -->|No| W[Block Query]
    end
```

## Permission Error - Before vs After

### ❌ Before (Broken)

```mermaid
graph LR
    A[Migration Script] --> B{Create auth.has_role}
    B --> C[Permission Denied]
    C --> D[ERROR 42501]
    
    style C fill:#f66,stroke:#f00
    style D fill:#f66,stroke:#f00
```

**Problem:** Cannot create functions in `auth` schema without superuser privileges

### ✅ After (Fixed)

```mermaid
graph LR
    A[Migration Script] --> B{Create public.has_role}
    B --> C[Success!]
    C --> D[RLS Policies Use public.has_role]
    
    style C fill:#6f6,stroke:#0f0
    style D fill:#6f6,stroke:#0f0
```

**Solution:** Create functions in `public` schema (works for all users)

## Database Schema

```mermaid
erDiagram
    user_roles ||--o{ user_role_audit_log : "triggers on change"
    user_roles }o--|| auth_users : "belongs to"
    role_permissions }o--|| user_roles : "defines"
    user_permission_overrides }o--|| auth_users : "customizes for"
    
    user_roles {
        uuid id PK
        uuid user_id FK
        text role "admin|vendor|collector"
        integer resource_id "vendor_id for vendors"
        boolean is_active
        uuid granted_by FK
        timestamptz granted_at
        timestamptz expires_at
        jsonb metadata
    }
    
    role_permissions {
        uuid id PK
        text role "admin|vendor|collector"
        text permission "orders:read, etc"
        text resource_type
        text description
    }
    
    user_permission_overrides {
        uuid id PK
        uuid user_id FK
        text permission
        boolean granted
        uuid granted_by FK
        timestamptz expires_at
        text reason
    }
    
    user_role_audit_log {
        uuid id PK
        uuid user_id
        text role
        text action "granted|revoked|modified"
        uuid performed_by FK
        timestamptz performed_at
        jsonb previous_state
        jsonb new_state
    }
```

## Function Architecture

### Public Schema Functions (✅ Used in Fixed Version)

```mermaid
graph TB
    subgraph "public Schema - Standard Permissions"
        A[public.has_role] --> B[Check JWT Claims]
        C[public.has_permission] --> B
        D[public.jwt_vendor_id] --> B
        E[public.custom_access_token] --> F[Inject Roles into JWT]
        G[public.is_admin_user] --> A
    end
    
    subgraph "RLS Policies"
        H[Vendor Policy] --> A
        I[Admin Policy] --> A
        J[Collector Policy] --> A
    end
    
    B --> K[JWT Claims Reader]
    
    style A fill:#6f6
    style C fill:#6f6
    style D fill:#6f6
    style E fill:#6f6
    style G fill:#6f6
```

### Auth Schema Attempt (❌ Causes Permission Error)

```mermaid
graph TB
    subgraph "auth Schema - Requires Superuser"
        A[auth.has_role] -.-> B[Permission Denied]
        C[auth.has_permission] -.-> B
        D[auth.jwt_vendor_id] -.-> B
    end
    
    B --> E[ERROR 42501]
    
    style A fill:#f66
    style C fill:#f66
    style D fill:#f66
    style B fill:#f66
    style E fill:#f66
```

## RLS Policy Examples

### Using public.has_role (✅ Works)

```sql
CREATE POLICY "Admins can access all vendors"
  ON public.vendors FOR ALL
  USING (public.has_role('admin'));
```

### Using auth.has_role (❌ Requires Creating Function First)

```sql
-- This would work IF we could create auth.has_role
-- But we can't without superuser permissions
CREATE POLICY "Admins can access all vendors"
  ON public.vendors FOR ALL
  USING (auth.has_role('admin'));  -- ❌ Function doesn't exist
```

## JWT Token Structure

### Before RBAC (Old System)

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "aud": "authenticated"
}
```

**Problem:** No role information, had to check cookies

### After RBAC (New System)

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "aud": "authenticated",
  "user_roles": ["admin", "vendor"],
  "vendor_id": 123,
  "user_permissions": [
    "admin:all",
    "vendors:manage",
    "products:create",
    "products:edit"
  ],
  "rbac_version": "2.0"
}
```

**Benefit:** All role info in JWT, no database queries needed

## Migration Data Flow

```mermaid
graph LR
    subgraph "Old Tables"
        A[admin_accounts]
        B[vendor_users]
        C[collector_profiles]
        D[orders with customer_id]
    end
    
    subgraph "Migration Process"
        E[Extract auth_id/user_id]
        F[Map to Role Type]
        G[Preserve Metadata]
    end
    
    subgraph "New Table"
        H[user_roles]
    end
    
    A --> E
    B --> E
    C --> E
    D --> E
    
    E --> F
    F --> G
    G --> H
    
    style H fill:#6f6
```

## Access Control Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant API
    participant Supabase
    participant Database
    
    User->>Browser: Login
    Browser->>Supabase: Authenticate
    Supabase->>Database: Query user_roles
    Database-->>Supabase: [admin, vendor]
    Supabase->>Supabase: Call custom_access_token
    Supabase-->>Browser: JWT with roles
    
    Browser->>API: Request /api/admin/vendors
    API->>API: Verify JWT signature
    API->>API: Extract user_roles from JWT
    API->>API: Check has 'admin' role
    API->>Database: Query vendors (RLS applies)
    Database->>Database: Check public.has_role('admin')
    Database->>Database: Read JWT claims
    Database-->>API: Vendor data
    API-->>Browser: Response
    Browser-->>User: Show vendors
```

## Security Comparison

| Feature | Old System | New System |
|---------|------------|------------|
| **Admin Detection** | ❌ Hardcoded emails | ✅ Database roles |
| **Session Management** | ❌ 3 separate cookies | ✅ Single JWT |
| **Role Storage** | ❌ 3 different tables | ✅ Unified user_roles |
| **Permission Checks** | ❌ Manual in code | ✅ Automatic via RLS |
| **Audit Trail** | ❌ None | ✅ Complete audit log |
| **Role Changes** | ❌ Code changes required | ✅ Database update |
| **Multi-role Support** | ❌ No | ✅ Yes |
| **Testing** | ❌ Difficult | ✅ Easy (mock JWT) |

## Function Call Stack

### API Request Flow

```mermaid
graph TB
    A[withAdmin middleware] --> B[Extract JWT from request]
    B --> C[Verify JWT signature]
    C --> D[Parse JWT claims]
    D --> E{Check user_roles contains 'admin'}
    E -->|Yes| F[Call handler with user context]
    E -->|No| G[Return 403 Forbidden]
    
    F --> H[Handler accesses database]
    H --> I{RLS Policy Triggered}
    I --> J[public.has_role('admin')]
    J --> K[Read request.jwt.claims]
    K --> L{admin in user_roles?}
    L -->|Yes| M[Allow query]
    L -->|No| N[Block query]
    
    style E fill:#ffa
    style L fill:#ffa
    style M fill:#6f6
    style N fill:#f66
    style G fill:#f66
```

## Schema Permissions Comparison

| Operation | auth Schema | public Schema |
|-----------|-------------|---------------|
| CREATE FUNCTION | ❌ Superuser only | ✅ Standard user |
| DROP FUNCTION | ❌ Superuser only | ✅ Owner/Standard user |
| EXECUTE FUNCTION | ✅ Yes (if granted) | ✅ Yes (if granted) |
| Use in RLS | ✅ Yes | ✅ Yes |
| Security Context | Same | Same (with SECURITY DEFINER) |

**Key Insight:** The `auth` schema is managed by Supabase and requires elevated privileges to modify. The `public` schema is owned by your project and allows standard operations.

## Summary

### The Fix in One Diagram

```mermaid
graph LR
    A[Permission Error] --> B{Root Cause}
    B --> C[Tried to create in auth schema]
    C --> D{Solution}
    D --> E[Create in public schema instead]
    E --> F[Same functionality]
    E --> G[No permission issues]
    E --> H[RLS policies work]
    
    style A fill:#f66
    style C fill:#f66
    style E fill:#6f6
    style F fill:#6f6
    style G fill:#6f6
    style H fill:#6f6
```

### Key Takeaways

1. ✅ **Functions in `public` schema** - No permission issues
2. ✅ **Same security level** - `SECURITY DEFINER` provides same context
3. ✅ **Works with RLS** - Policies can call `public.has_role()`
4. ✅ **Standard permissions** - Any database user can create
5. ✅ **Production ready** - Used by Supabase community

---

**Conclusion:** The fix is simple and safe - use `public` schema instead of `auth` schema. Functionality remains identical, but without permission errors.
