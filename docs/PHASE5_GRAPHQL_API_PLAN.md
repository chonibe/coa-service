# Phase 5: GraphQL API Implementation Plan

## Overview

Implement a GraphQL API layer on top of the existing REST API to provide type-safe queries, automatic type generation, and a more flexible query interface. This aligns with Attio's GraphQL API architecture.

## Current State

### ✅ What We Have
- REST API with full CRUD operations
- TypeScript types for API responses
- Supabase client for database queries
- Authentication and authorization

### ❌ What's Missing
- GraphQL API endpoint
- GraphQL schema definition
- Type generation from schema
- GraphQL query resolvers
- GraphQL mutations
- GraphQL subscriptions (optional)

## Phase 5 Implementation Plan

### 5.1 GraphQL Infrastructure Setup

**Files to Create:**
- `app/api/graphql/route.ts` - GraphQL endpoint handler
- `lib/graphql/schema.ts` - GraphQL schema definition
- `lib/graphql/resolvers/` - Query and mutation resolvers
- `lib/graphql/types.ts` - TypeScript types for GraphQL

**Dependencies:**
- `graphql` (already installed)
- `graphql-yoga` (already installed)
- `@graphql-tools/schema` (already installed)

**Implementation:**
1. Set up GraphQL Yoga server
2. Define base schema structure
3. Create type definitions for core entities
4. Set up authentication middleware

### 5.2 Core Entity Types

**Types to Implement:**
1. **Person/People**
   - Query: `people`, `person(id: ID!)`
   - Mutation: `createPerson`, `updatePerson`, `deletePerson`
   - Fields: All person attributes, relationships, activities

2. **Company/Companies**
   - Query: `companies`, `company(id: ID!)`
   - Mutation: `createCompany`, `updateCompany`, `deleteCompany`
   - Fields: All company attributes, relationships, activities

3. **Conversation/Conversations**
   - Query: `conversations`, `conversation(id: ID!)`
   - Mutation: `createConversation`, `updateConversation`
   - Fields: Messages, tags, customer, platform, status

4. **Message/Messages**
   - Query: `messages(conversationId: ID!)`
   - Mutation: `createMessage`, `updateMessage`
   - Fields: Content, metadata, thread info, direction

5. **Activity/Activities**
   - Query: `activities(entityType: String!, entityId: ID!)`
   - Mutation: `createActivity`
   - Fields: Type, description, metadata, timestamp

6. **Custom Field/Fields**
   - Query: `customFields`, `customField(id: ID!)`
   - Mutation: `createCustomField`, `updateCustomField`, `deleteCustomField`
   - Fields: Name, type, config, default values

### 5.3 Filtering & Pagination

**GraphQL Features:**
- Filter arguments for all list queries
- Cursor-based pagination support
- Sorting arguments
- Field selection (only fetch requested fields)

**Example Query:**
```graphql
query {
  people(
    filter: {
      and: [
        { email: { contains: "@example.com" } }
        { company: { industry: { eq: "Technology" } } }
      ]
    }
    sort: { field: "created_at", direction: DESC }
    first: 20
    after: "cursor123"
  ) {
    edges {
      node {
        id
        firstName
        lastName
        email
        company {
          id
          name
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```

### 5.4 Mutations

**Mutations to Implement:**
- `createPerson(input: CreatePersonInput!)`
- `updatePerson(id: ID!, input: UpdatePersonInput!)`
- `deletePerson(id: ID!)`
- `createCompany(input: CreateCompanyInput!)`
- `updateCompany(id: ID!, input: UpdateCompanyInput!)`
- `deleteCompany(id: ID!)`
- `createMessage(input: CreateMessageInput!)`
- `addTagToConversation(conversationId: ID!, tagId: ID!)`
- `removeTagFromConversation(conversationId: ID!, tagId: ID!)`
- `archiveRecord(id: ID!, type: String!)`
- `restoreRecord(id: ID!, type: String!)`

### 5.5 Type Generation

**Implementation:**
- Generate TypeScript types from GraphQL schema
- Use `graphql-codegen` or similar
- Auto-generate types for queries and mutations
- Provide type-safe client helpers

### 5.6 Error Handling

**GraphQL Error Format:**
```json
{
  "errors": [
    {
      "message": "Validation error",
      "extensions": {
        "code": "VALIDATION_ERROR",
        "field": "email",
        "details": "Invalid email format"
      }
    }
  ],
  "data": null
}
```

### 5.7 Authentication & Authorization

**Implementation:**
- Use existing Supabase auth
- Extract user from JWT token
- Apply permission checks in resolvers
- Return appropriate errors for unauthorized access

## Implementation Checklist

### Infrastructure
- [ ] Set up GraphQL Yoga server
- [ ] Create base schema structure
- [ ] Set up authentication middleware
- [ ] Configure CORS and security

### Core Types
- [ ] Define Person type and resolvers
- [ ] Define Company type and resolvers
- [ ] Define Conversation type and resolvers
- [ ] Define Message type and resolvers
- [ ] Define Activity type and resolvers
- [ ] Define CustomField type and resolvers

### Queries
- [ ] Implement people query with filtering
- [ ] Implement companies query with filtering
- [ ] Implement conversations query with filtering
- [ ] Implement single record queries
- [ ] Implement pagination (cursor-based)

### Mutations
- [ ] Implement create mutations
- [ ] Implement update mutations
- [ ] Implement delete mutations
- [ ] Implement archive/restore mutations
- [ ] Implement tag management mutations

### Type Generation
- [ ] Set up code generation
- [ ] Generate TypeScript types
- [ ] Create type-safe client helpers

### Testing
- [ ] Test all queries
- [ ] Test all mutations
- [ ] Test error handling
- [ ] Test authentication
- [ ] Test permissions

### Documentation
- [ ] GraphQL schema documentation
- [ ] Query examples
- [ ] Mutation examples
- [ ] Type reference
- [ ] Authentication guide

## Estimated Time

- **Infrastructure Setup:** 2-3 hours
- **Core Types & Resolvers:** 4-6 hours
- **Filtering & Pagination:** 2-3 hours
- **Mutations:** 3-4 hours
- **Type Generation:** 1-2 hours
- **Testing & Documentation:** 2-3 hours

**Total:** ~14-21 hours

## Success Criteria

✅ GraphQL endpoint accessible at `/api/graphql`
✅ All core entities queryable via GraphQL
✅ Filtering and pagination working
✅ Mutations functional
✅ Type-safe queries with generated types
✅ Authentication and authorization working
✅ Error handling standardized
✅ Documentation complete

## Next Steps After Phase 5

- Phase 6: GraphQL Subscriptions (real-time updates)
- Phase 7: Advanced GraphQL features (fragments, directives)
- Phase 8: GraphQL client libraries and tooling

