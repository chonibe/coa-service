/**
 * Shop Content - English Locale
 * 
 * All user-facing text for the shop, following Impact theme content patterns.
 */

export const shopLocale = {
  product: {
    // Actions
    addToCart: 'Add to cart',
    addToCartShort: 'Add',
    quickAdd: 'Quick add',
    soldOut: 'Sold out',
    unavailable: 'Unavailable',
    preOrder: 'Pre-order',
    viewProduct: 'View product',
    
    // Stock status
    inStock: 'In stock',
    lowStock: (count: number) => `Only ${count} left`,
    outOfStock: 'Out of stock',
    comingSoon: 'Coming soon',
    
    // Product details
    sku: (sku: string) => `SKU: ${sku}`,
    vendor: 'Artist',
    description: 'Description',
    
    // Pricing
    regularPrice: 'Regular price',
    salePrice: 'Sale price',
    fromPrice: (price: string) => `From ${price}`,
    saveAmount: (amount: string, percent: number) => `Save ${amount} (${percent}% off)`,
    
    // Shipping
    freeShipping: 'Free shipping',
    shipsIn: (days: number) => `Ships within ${days} business ${days === 1 ? 'day' : 'days'}`,
    
    // Tax notice
    taxesIncluded: 'Taxes included',
    taxesExcluded: 'Taxes excluded',
    shippingCalculated: 'Shipping calculated at checkout',
    taxesAndShipping: 'Taxes and shipping calculated at checkout',
    
    // Quantity
    quantity: 'Quantity',
    increaseQuantity: 'Increase quantity',
    decreaseQuantity: 'Decrease quantity',
    minQuantity: (min: number) => `Minimum of ${min}`,
    maxQuantity: (max: number) => `Maximum of ${max}`,
    
    // Variants
    chooseOption: (option: string) => `Choose ${option}`,
    color: 'Color',
    size: 'Size',
    
    // Share
    share: 'Share',
    shareOn: (platform: string) => `Share on ${platform}`,
    copyLink: 'Copy link',
    linkCopied: 'Link copied!',
    
    // Size chart
    sizeChart: 'Size chart',
    
    // Gallery
    viewGallery: 'View gallery',
    closeGallery: 'Close gallery',
    imageOf: (current: number, total: number) => `Image ${current} of ${total}`,
  },
  
  collection: {
    // Titles
    allProducts: 'All products',
    allCollections: 'All collections',
    
    // Product count
    productCount: (count: number) => {
      if (count === 0) return 'No products'
      if (count === 1) return '1 product'
      return `${count} products`
    },
    showingProducts: (showing: number, total: number) => 
      `Showing ${showing} of ${total} products`,
    
    // Empty state
    emptyCollection: 'No products found',
    emptyDescription: 'Try adjusting your filters or search terms',
    continueShopping: 'Continue shopping',
    
    // Filters
    filterAndSort: 'Filter and sort',
    filters: 'Filters',
    sortBy: 'Sort by',
    clearFilters: 'Clear filters',
    clearAll: 'Clear all',
    applyFilters: 'Apply filters',
    
    // Filter options
    availability: 'Availability',
    inStockOnly: 'In stock only',
    priceRange: 'Price range',
    priceFrom: 'From',
    priceTo: 'To',
    
    // Sort options
    sortFeatured: 'Featured',
    sortNewest: 'Newest',
    sortPriceLowToHigh: 'Price: Low to high',
    sortPriceHighToLow: 'Price: High to low',
    sortBestSelling: 'Best selling',
  },
  
  cart: {
    // Titles
    title: 'Your cart',
    shoppingCart: 'Shopping cart',
    
    // Item count
    itemCount: (count: number) => {
      if (count === 0) return 'Cart is empty'
      if (count === 1) return '1 item'
      return `${count} items`
    },
    
    // Empty state
    empty: 'Your cart is empty',
    emptyDescription: 'Add items to get started',
    continueShopping: 'Continue shopping',
    
    // Actions
    updateCart: 'Update cart',
    viewCart: 'View cart',
    checkout: 'Checkout',
    
    // Line items
    remove: 'Remove',
    removeItem: (title: string) => `Remove ${title}`,
    changeQuantity: 'Change quantity',
    
    // Order notes
    orderNote: 'Order note',
    orderNotePlaceholder: 'Special instructions? Add them here',
    addOrderNote: 'Add order note',
    editOrderNote: 'Edit order note',
    saveNote: 'Save note',
    
    // Totals
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    taxes: 'Taxes',
    estimatedTaxes: 'Estimated taxes',
    total: 'Total',
    
    // Notices
    shippingCalculated: 'Shipping calculated at checkout',
    taxesAndShipping: 'Taxes and shipping calculated at checkout',
    taxesIncluded: 'Taxes included',
    freeShipping: 'Free shipping',
    
    // Discounts
    discount: 'Discount',
    discountCode: 'Discount code',
    applyDiscount: 'Apply',
    enterDiscountCode: 'Enter discount code',
    discountApplied: 'Discount code applied',
    discountRemoved: 'Discount code removed',
    invalidDiscount: 'Enter a valid discount code',
    
    // Gift cards
    giftCard: 'Gift card',
    giftCardCode: 'Gift card code',
    applyGiftCard: 'Apply',
    giftCardApplied: 'Gift card applied',
    
    // Free shipping progress
    freeShippingProgress: (remaining: string) => `Add ${remaining} more for free shipping`,
    freeShippingUnlocked: 'You unlocked free shipping!',
  },
  
  search: {
    // Title and actions
    title: 'Search',
    placeholder: 'Search artworks, artists, collections...',
    searchFor: (query: string) => `Search for "${query}"`,
    clearSearch: 'Clear search',
    
    // Results
    resultsCount: (count: number, query: string) => {
      if (count === 0) return `No results for "${query}"`
      if (count === 1) return `1 result for "${query}"`
      return `${count} results for "${query}"`
    },
    
    showingResults: (showing: number, query: string) => 
      `Showing ${showing} results for "${query}"`,
    
    viewAllResults: (count: number) => `View all ${count} results`,
    
    // Empty state
    noResults: 'No results found',
    noResultsDescription: 'Try different keywords or check your spelling',
    popularSearches: 'Popular searches:',
    suggestions: 'Suggestions:',
    
    // Categories
    products: (count: number) => `Products (${count})`,
    collections: (count: number) => `Collections (${count})`,
    artists: (count: number) => `Artists (${count})`,
    pages: (count: number) => `Pages (${count})`,
    
    // Recent searches
    recentSearches: 'Recent searches',
    clearRecent: 'Clear',
  },
  
  accessibility: {
    // Navigation
    skipToContent: 'Skip to content',
    mainNavigation: 'Main navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    
    // Cart
    openCart: 'Open cart',
    closeCart: 'Close cart',
    cartCount: (count: number) => `Cart has ${count} ${count === 1 ? 'item' : 'items'}`,
    
    // Search
    openSearch: 'Open search',
    closeSearch: 'Close search',
    searchInput: 'Search input',
    
    // Actions
    addToCart: (product: string) => `Add ${product} to cart`,
    removeFromCart: (product: string) => `Remove ${product} from cart`,
    increaseQuantity: (product: string) => `Increase quantity of ${product}`,
    decreaseQuantity: (product: string) => `Decrease quantity of ${product}`,
    
    // Loading
    loading: 'Loading...',
    loadingProducts: 'Loading products...',
    loadingComplete: 'Loading complete',
    
    // Images
    productImage: (product: string) => `${product} image`,
    productGallery: (product: string) => `${product} gallery`,
    imageCount: (current: number, total: number) => `Image ${current} of ${total}`,
    
    // Misc
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    more: 'More',
  },
  
  notifications: {
    // Success
    addedToCart: 'Added to cart',
    removedFromCart: 'Item removed',
    cartUpdated: 'Cart updated',
    linkCopied: 'Link copied to clipboard',
    discountApplied: 'Discount code applied',
    
    // Error
    error: 'Something went wrong',
    errorAddToCart: 'Failed to add to cart',
    errorRemoveFromCart: 'Failed to remove item',
    errorLoadProducts: 'Failed to load products',
    tryAgain: 'Please try again',
    
    // Info
    freeShippingUnlocked: 'Free shipping unlocked!',
    itemLowStock: (count: number) => `Only ${count} left in stock`,
  },
  
  errors: {
    // Page errors
    pageNotFound: 'Page not found',
    productNotFound: 'Product not found',
    collectionNotFound: 'Collection not found',
    somethingWentWrong: 'Something went wrong',
    
    // Network errors
    networkError: 'Unable to connect',
    checkConnection: 'Check your internet connection',
    
    // Form errors
    requiredField: 'This field is required',
    invalidEmail: 'Enter a valid email address',
    
    // Actions
    goBack: 'Go back',
    goHome: 'Go to homepage',
    retry: 'Retry',
    refresh: 'Refresh page',
    contactSupport: 'Contact support',
  },
  
  general: {
    // Common actions
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    continue: 'Continue',
    done: 'Done',
    
    // Common labels
    email: 'Email',
    name: 'Name',
    message: 'Message',
    optional: 'optional',
    required: 'required',
    
    // Status
    active: 'Active',
    inactive: 'Inactive',
    enabled: 'Enabled',
    disabled: 'Disabled',
    
    // Time
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    
    // Misc
    and: 'and',
    or: 'or',
    from: 'From',
    to: 'To',
    free: 'Free',
  },
}

export type ShopLocale = typeof shopLocale
