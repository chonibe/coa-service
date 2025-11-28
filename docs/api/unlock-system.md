# Unlock System API Documentation

## Overview

The unlock system provides APIs for checking unlock status, managing time-based unlocks, and verifying VIP/loyalty requirements.

## Endpoints

### GET /api/vendor/series/[id]/unlock-status

Get unlock status for a series, including time-based countdowns.

**Authentication:** Required (vendor session)

**Response:**
```json
{
  "seriesId": "uuid",
  "unlockType": "time_based",
  "members": {
    "member-id": {
      "isUnlocked": false,
      "unlockAt": "2025-02-01T12:00:00Z",
      "countdown": {
        "isUnlocked": false,
        "timeUntilUnlock": 86400000,
        "formatted": "1d 0h",
        "nextUnlockTime": "2025-02-01T12:00:00Z"
      }
    }
  }
}
```

### GET /api/collector/ownership

Get collector's owned artworks and loyalty metrics.

**Query Parameters:**
- `collector_id` (required): Collector identifier (account_number)
- `series_id` (optional): Filter by series

**Response:**
```json
{
  "ownedArtworkIds": ["id1", "id2"],
  "loyaltyPoints": 150,
  "vipTier": 2,
  "purchaseCount": 15,
  "firstPurchaseDate": "2024-01-15T10:00:00Z"
}
```

## Unlock Logic

### Time-Based Unlocks

Time-based unlocks support:
- **One-time unlocks**: Artworks unlock at a specific date/time
- **Recurring unlocks**: Daily or weekly schedules

**Configuration:**
```typescript
{
  unlock_at?: string // ISO timestamp
  unlock_schedule?: {
    type: 'daily' | 'weekly'
    time: string // HH:MM format
    timezone?: string
    start_date?: string
    end_date?: string
  }
}
```

### VIP/Loyalty Unlocks

VIP unlocks check:
- **Ownership requirements**: Collector must own specific artworks
- **VIP tier**: Minimum tier level required
- **Loyalty points**: Minimum points required

**Configuration:**
```typescript
{
  requires_ownership?: string[] // Artwork IDs
  vip_tier?: number // 0-5
  loyalty_points_required?: number
}
```

**Loyalty Calculation:**
- Base: 10 points per purchase
- Long-term bonus: +50 points (365+ days)
- Medium-term bonus: +25 points (180+ days)

**VIP Tier Calculation:**
- Tier 5: 500+ points
- Tier 4: 300+ points
- Tier 3: 200+ points
- Tier 2: 100+ points
- Tier 1: 50+ points
- Tier 0: <50 points

## Timezone Handling

All timestamps are stored in UTC. The API converts to the collector's local timezone for display.

## Caching

Unlock status is calculated in real-time. For high-traffic scenarios, consider caching unlock status with appropriate TTLs.

## Error Handling

All endpoints return standard error responses:
```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common status codes:
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized
- `404`: Not found
- `500`: Internal server error

