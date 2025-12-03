import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLInt, GraphQLBoolean, GraphQLInputObjectType, GraphQLEnumType, GraphQLScalarType } from 'graphql'
import { crmResolvers } from './resolvers'

/**
 * CRM GraphQL Schema
 * Defines types, queries, and mutations for the CRM system
 */

// Enums
const PlatformEnum = new GraphQLEnumType({
  name: 'Platform',
  values: {
    EMAIL: { value: 'email' },
    INSTAGRAM: { value: 'instagram' },
    FACEBOOK: { value: 'facebook' },
    WHATSAPP: { value: 'whatsapp' },
    SHOPIFY: { value: 'shopify' },
  },
})

const ConversationStatusEnum = new GraphQLEnumType({
  name: 'ConversationStatus',
  values: {
    OPEN: { value: 'open' },
    CLOSED: { value: 'closed' },
    PENDING: { value: 'pending' },
    RESOLVED: { value: 'resolved' },
  },
})

const MessageDirectionEnum = new GraphQLEnumType({
  name: 'MessageDirection',
  values: {
    INBOUND: { value: 'inbound' },
    OUTBOUND: { value: 'outbound' },
  },
})

// Scalar Types
const DateTimeType = GraphQLString // TODO: Use proper DateTime scalar

// JSON Scalar
const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON scalar type',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => {
    // Simple implementation - in production, use a proper JSON parser
    return JSON.parse(JSON.stringify(ast))
  },
})

const JSONType = JSONScalar

// Types
const PersonType = new GraphQLObjectType({
  name: 'Person',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    email: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    phone: { type: GraphQLString },
    instagramUsername: { type: GraphQLString },
    totalOrders: { type: GraphQLInt },
    totalSpent: { type: GraphQLString },
    enrichmentData: { type: JSONType },
    createdAt: { type: DateTimeType },
    updatedAt: { type: DateTimeType },
  }),
})

const CompanyType = new GraphQLObjectType({
  name: 'Company',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    domain: { type: GraphQLString },
    industry: { type: GraphQLString },
    website: { type: GraphQLString },
    createdAt: { type: DateTimeType },
    updatedAt: { type: DateTimeType },
  }),
})

const TagType = new GraphQLObjectType({
  name: 'Tag',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    color: { type: GraphQLString },
  }),
})

const ConversationType = new GraphQLObjectType({
  name: 'Conversation',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    customerId: { type: new GraphQLNonNull(GraphQLID) },
    platform: { type: PlatformEnum },
    status: { type: ConversationStatusEnum },
    isStarred: { type: GraphQLBoolean },
    unreadCount: { type: GraphQLInt },
    lastMessageAt: { type: DateTimeType },
    customer: { type: PersonType },
    tags: { type: new GraphQLList(TagType) },
    createdAt: { type: DateTimeType },
    updatedAt: { type: DateTimeType },
  }),
})

const MessageType = new GraphQLObjectType({
  name: 'Message',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    conversationId: { type: new GraphQLNonNull(GraphQLID) },
    direction: { type: MessageDirectionEnum },
    content: { type: GraphQLString },
    metadata: { type: JSONType },
    threadId: { type: GraphQLID },
    parentMessageId: { type: GraphQLID },
    threadDepth: { type: GraphQLInt },
    threadOrder: { type: GraphQLInt },
    createdAt: { type: DateTimeType },
  }),
})

// Input Types
const CreatePersonInput = new GraphQLInputObjectType({
  name: 'CreatePersonInput',
  fields: () => ({
    email: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    phone: { type: GraphQLString },
    instagramUsername: { type: GraphQLString },
  }),
})

const UpdatePersonInput = new GraphQLInputObjectType({
  name: 'UpdatePersonInput',
  fields: () => ({
    email: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    phone: { type: GraphQLString },
    instagramUsername: { type: GraphQLString },
  }),
})

const CreateCompanyInput = new GraphQLInputObjectType({
  name: 'CreateCompanyInput',
  fields: () => ({
    name: { type: new GraphQLNonNull(GraphQLString) },
    domain: { type: GraphQLString },
    industry: { type: GraphQLString },
    website: { type: GraphQLString },
  }),
})

const CreateMessageInput = new GraphQLInputObjectType({
  name: 'CreateMessageInput',
  fields: () => ({
    conversationId: { type: new GraphQLNonNull(GraphQLID) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    direction: { type: MessageDirectionEnum },
    metadata: { type: JSONType },
    parentMessageId: { type: GraphQLID },
  }),
})

// Connection Types (for pagination)
const PageInfoType = new GraphQLObjectType({
  name: 'PageInfo',
  fields: () => ({
    hasNextPage: { type: new GraphQLNonNull(GraphQLBoolean) },
    hasPreviousPage: { type: new GraphQLBoolean },
    startCursor: { type: GraphQLString },
    endCursor: { type: GraphQLString },
  }),
})

const PersonEdgeType = new GraphQLObjectType({
  name: 'PersonEdge',
  fields: () => ({
    node: { type: PersonType },
    cursor: { type: GraphQLString },
  }),
})

const PersonConnectionType = new GraphQLObjectType({
  name: 'PersonConnection',
  fields: () => ({
    edges: { type: new GraphQLList(PersonEdgeType) },
    pageInfo: { type: PageInfoType },
  }),
})

// Query Type
const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    person: {
      type: PersonType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
    },
    people: {
      type: PersonConnectionType,
      args: {
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        filter: { type: JSONType }, // TODO: Create proper FilterInput type
      },
    },
    company: {
      type: CompanyType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
    },
    companies: {
      type: new GraphQLList(CompanyType),
      args: {
        limit: { type: GraphQLInt },
        offset: { type: GraphQLInt },
      },
    },
    conversation: {
      type: ConversationType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
    },
    conversations: {
      type: new GraphQLList(ConversationType),
      args: {
        platform: { type: PlatformEnum },
        status: { type: ConversationStatusEnum },
        limit: { type: GraphQLInt },
      },
    },
    messages: {
      type: new GraphQLList(MessageType),
      args: {
        conversationId: { type: new GraphQLNonNull(GraphQLID) },
      },
    },
    tags: {
      type: new GraphQLList(TagType),
    },
  }),
})

// Mutation Type
const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    createPerson: {
      type: PersonType,
      args: {
        input: { type: new GraphQLNonNull(CreatePersonInput) },
      },
    },
    updatePerson: {
      type: PersonType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        input: { type: new GraphQLNonNull(UpdatePersonInput) },
      },
    },
    deletePerson: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
    },
    createCompany: {
      type: CompanyType,
      args: {
        input: { type: new GraphQLNonNull(CreateCompanyInput) },
      },
    },
    createMessage: {
      type: MessageType,
      args: {
        input: { type: new GraphQLNonNull(CreateMessageInput) },
      },
    },
    addTagToConversation: {
      type: ConversationType,
      args: {
        conversationId: { type: new GraphQLNonNull(GraphQLID) },
        tagId: { type: new GraphQLNonNull(GraphQLID) },
      },
    },
    removeTagFromConversation: {
      type: ConversationType,
      args: {
        conversationId: { type: new GraphQLNonNull(GraphQLID) },
        tagId: { type: new GraphQLNonNull(GraphQLID) },
      },
    },
  }),
})

// Schema with resolvers
export const crmSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
})

// Export resolvers separately for use in Yoga
export { crmResolvers } from './resolvers'

