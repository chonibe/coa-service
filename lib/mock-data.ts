/**
 * Mock data for development and fallback purposes
 */

// Mock orders data
export const mockOrders = [
  {
    id: "order_1",
    order_number: 1001,
    processed_at: new Date().toISOString(),
    total_price: 150.00,
    financial_status: "paid",
    fulfillment_status: "fulfilled",
    line_items: [
      {
        id: "item_1",
        line_item_id: "line_1",
        name: "Limited Edition Print",
        description: "Limited Edition Print - 1/100",
        quantity: 1,
        price: 100.00,
        img_url: "/placeholder.svg?height=400&width=400",
        nfc_tag_id: "nfc_1",
        certificate_url: "https://example.com/certificate/1",
        certificate_token: "token_1",
        nfc_claimed_at: new Date().toISOString(),
        order_id: "order_1",
        edition_number: 1,
        edition_total: 100,
        vendor_name: "Art Gallery",
        status: "active"
      },
      {
        id: "item_2",
        line_item_id: "line_2",
        name: "Digital Art Collection",
        description: "Digital Art Collection - 5/50",
        quantity: 1,
        price: 50.00,
        img_url: "/placeholder.svg?height=400&width=400",
        nfc_tag_id: null,
        certificate_url: "https://example.com/certificate/2",
        certificate_token: "token_2",
        nfc_claimed_at: null,
        order_id: "order_1",
        edition_number: 5,
        edition_total: 50,
        vendor_name: "Digital Gallery",
        status: "active"
      }
    ]
  },
  {
    id: "order_2",
    order_number: 1002,
    processed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    total_price: 200.00,
    financial_status: "paid",
    fulfillment_status: "unfulfilled",
    line_items: [
      {
        id: "item_3",
        line_item_id: "line_3",
        name: "Exclusive Digital Artwork",
        description: "Exclusive Digital Artwork - 10/50",
        quantity: 1,
        price: 200.00,
        img_url: "/placeholder.svg?height=400&width=400",
        nfc_tag_id: "nfc_3",
        certificate_url: "https://example.com/certificate/3",
        certificate_token: "token_3",
        nfc_claimed_at: null,
        order_id: "order_2",
        edition_number: 10,
        edition_total: 50,
        vendor_name: "Digital Arts",
        status: "active"
      }
    ]
  },
  {
    id: "order_3",
    order_number: 1003,
    processed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    total_price: 85.00,
    financial_status: "partially_refunded",
    fulfillment_status: "partially_fulfilled",
    line_items: [
      {
        id: "item_4",
        line_item_id: "line_4",
        name: "Signed Poster",
        description: "Signed Poster - Limited Edition",
        quantity: 1,
        price: 50.00,
        img_url: "/placeholder.svg?height=400&width=400",
        nfc_tag_id: null,
        certificate_url: "https://example.com/certificate/4",
        certificate_token: "token_4",
        nfc_claimed_at: null,
        order_id: "order_3",
        edition_number: null,
        edition_total: null,
        vendor_name: "Poster Shop",
        status: "active"
      },
      {
        id: "item_5",
        line_item_id: "line_5",
        name: "Collector's Vinyl Record",
        description: "Collector's Vinyl Record - 15/300",
        quantity: 1,
        price: 35.00,
        img_url: "/placeholder.svg?height=400&width=400",
        nfc_tag_id: null,
        certificate_url: "https://example.com/certificate/5",
        certificate_token: "token_5",
        nfc_claimed_at: null,
        order_id: "order_3",
        edition_number: 15,
        edition_total: 300,
        vendor_name: "Music Store",
        status: "refunded"
      }
    ]
  }
]

// Mock edition data
export const mockEditionInfo = {
  supabase: {
    edition_number: 42,
    total: 100,
    updated_at: new Date().toISOString(),
  },
  sequential: {
    sequentialNumber: 23,
    editionTotal: 100,
    sequentialUuid: "abc-123-def-456",
  },
  fallback: {
    editionNumber: 15,
    editionTotal: 100,
  },
}

// Mock pagination data
export const mockPagination = {
  nextCursor: null,
  hasNextPage: false,
}

// Mock response data structure
export const mockResponseData = {
  orders: mockOrders,
  pagination: mockPagination,
}
