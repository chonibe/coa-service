# System Architecture

## High-Level Architecture Diagram
```
[Frontend] <--> [Backend API] <--> [Supabase] <--> [PostgreSQL Database]
    Next.js       Supabase       Authentication   Data Storage
```

## Component Breakdown

### Frontend (Next.js)
- **Vendor Dashboard**: Manages vendor-specific analytics and operations
- **Authentication Pages**: User login, registration, profile management
- **API Integration**: Handles communication with backend services

### Backend (Supabase)
- **Authentication**: User management and authorization
- **Serverless Functions**: 
  - Vendor profile management
  - Sales analytics processing
  - Order line item tracking

### Database Schema
- **Vendors Table**
  - `id`: UUID
  - `user_id`: Foreign key to auth users
  - `vendor_name`: Text
  - `contact_info`: JSON

- **Products Table**
  - `id`: UUID
  - `vendor_name`: Text
  - `img_url`: Text
  - `payout_percentage`: Integer
  - `edition_size`: Text

- **Order Line Items Table**
  - `id`: UUID
  - `vendor_name`: Text
  - `sku`: Text
  - `quantity`: Integer
  - `price`: Decimal
  - `status`: Text

## Security Considerations
- Row Level Security (RLS) implemented
- Authentication via Supabase
- Policies restrict data access based on user roles

## Performance Optimizations
- Indexed database queries
- Cached analytics computations
- Efficient data fetching strategies

## Scalability
- Serverless architecture
- Horizontal scaling capabilities
- Modular component design 