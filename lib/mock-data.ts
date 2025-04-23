/**
 * Mock data for development and fallback purposes
 */

// Mock orders data
export const mockOrders = [
  {
    id: "order_1",
    order_number: "1001",
    processed_at: new Date().toISOString(),
    fulfillment_status: "fulfilled",
    financial_status: "paid",
    line_items: [
      {
        id: "item_1",
        line_item_id: "line_1",
        product_id: "prod_1",
        title: "Limited Edition Print",
        quantity: 1,
        price: "150.00",
        total: "150.00",
        vendor: "Art Gallery",
        image: "/placeholder.svg?height=400&width=400",
        tags: ["print", "limited", "artwork"],
        fulfillable: true,
        is_limited_edition: true,
        total_inventory: "100",
        inventory_quantity: 25,
        order_info: {
          order_id: "order_1",
          order_number: "1001",
          processed_at: new Date().toISOString(),
          fulfillment_status: "fulfilled",
          financial_status: "paid",
        },
      },
      {
        id: "item_2",
        line_item_id: "line_2",
        product_id: "prod_2",
        title: "Collector's Edition Book",
        quantity: 1,
        price: "75.00",
        total: "75.00",
        vendor: "Book Publishers",
        image: "/placeholder.svg?height=400&width=400",
        tags: ["book", "collector", "limited"],
        fulfillable: true,
        is_limited_edition: true,
        total_inventory: "500",
        inventory_quantity: 120,
        order_info: {
          order_id: "order_1",
          order_number: "1001",
          processed_at: new Date().toISOString(),
          fulfillment_status: "fulfilled",
          financial_status: "paid",
        },
      },
    ],
  },
  {
    id: "order_2",
    order_number: "1002",
    processed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    fulfillment_status: "unfulfilled",
    financial_status: "paid",
    line_items: [
      {
        id: "item_3",
        line_item_id: "line_3",
        product_id: "prod_3",
        title: "Exclusive Digital Artwork",
        quantity: 1,
        price: "200.00",
        total: "200.00",
        vendor: "Digital Arts",
        image: "/placeholder.svg?height=400&width=400",
        tags: ["digital", "exclusive", "artwork"],
        fulfillable: true,
        is_limited_edition: true,
        total_inventory: "50",
        inventory_quantity: 10,
        order_info: {
          order_id: "order_2",
          order_number: "1002",
          processed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          fulfillment_status: "unfulfilled",
          financial_status: "paid",
        },
      },
    ],
  },
  {
    id: "order_3",
    order_number: "1003",
    processed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    fulfillment_status: "partially_fulfilled",
    financial_status: "paid",
    line_items: [
      {
        id: "item_4",
        line_item_id: "line_4",
        product_id: "prod_4",
        title: "Signed Poster",
        quantity: 1,
        price: "50.00",
        total: "50.00",
        vendor: "Poster Shop",
        image: "/placeholder.svg?height=400&width=400",
        tags: ["poster", "signed", "artwork"],
        fulfillable: true,
        is_limited_edition: false,
        inventory_quantity: 200,
        order_info: {
          order_id: "order_3",
          order_number: "1003",
          processed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          fulfillment_status: "partially_fulfilled",
          financial_status: "paid",
        },
      },
      {
        id: "item_5",
        line_item_id: "line_5",
        product_id: "prod_5",
        title: "Collector's Vinyl Record",
        quantity: 1,
        price: "35.00",
        total: "35.00",
        vendor: "Music Store",
        image: "/placeholder.svg?height=400&width=400",
        tags: ["music", "vinyl", "collector"],
        fulfillable: false,
        refunded: true,
        is_limited_edition: true,
        total_inventory: "300",
        inventory_quantity: 0,
        order_info: {
          order_id: "order_3",
          order_number: "1003",
          processed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          fulfillment_status: "partially_fulfilled",
          financial_status: "partially_refunded",
        },
      },
    ],
  },
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
