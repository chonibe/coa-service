# Wishlist Feature

## Overview
The wishlist feature allows users to save products they're interested in for later viewing and purchasing. It works without requiring login, using localStorage for persistence, and integrates seamlessly with the shopping cart experience.

## Feature Components

### 1. WishlistContext (`lib/shop/WishlistContext.tsx`)
**Purpose:** State management for wishlist items

**Key Features:**
- Add/remove items from wishlist
- Check if item is in wishlist
- Persist to localStorage
- Get wishlist count
- Clear entire wishlist

**API:**
```typescript
interface WishlistContextValue {
  items: WishlistItem[]
  itemCount: number
  addItem: (item: Omit<WishlistItem, 'addedAt'>) => void
  removeItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
}
```

**Data Structure:**
```typescript
interface WishlistItem {
  productId: string
  variantId: string
  handle: string
  title: string
  price: number
  image?: string
  artistName?: string
  addedAt: number
}
```

### 2. WishlistButton (`components/shop/WishlistButton.tsx`)
**Purpose:** Interactive button to add/remove items from wishlist

**Key Features:**
- Heart icon with fill animation
- Spring physics bounce on add
- Haptic-like visual feedback
- Tooltip support
- Multiple size variants (sm, md, lg)
- Multiple style variants (default, ghost)

**Props:**
```typescript
interface WishlistButtonProps {
  productId: string
  variantId: string
  handle: string
  title: string
  price: number
  image?: string
  artistName?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost'
  showTooltip?: boolean
}
```

**Usage Example:**
```tsx
<WishlistButton
  productId={product.id}
  variantId={variant.id}
  handle={product.handle}
  title={product.title}
  price={variant.price}
  image={product.image}
  artistName={product.vendor}
  size="md"
  variant="default"
/>
```

### 3. Cart Drawer Integration (`components/impact/LocalCartDrawer.tsx`)
**Purpose:** Display wishlist items in cart drawer recommendations section

**Key Features:**
- Prioritizes wishlist items over generic recommendations
- Dynamic section title ("Your Saved Items" vs "You Might Also Like")
- Heart icon indicator for saved items
- Smooth transitions and animations
- Click to navigate to product page

**Logic:**
```typescript
// Wishlist items take priority
const displayProducts = hasWishlistItems ? wishlistProducts : recommendedProducts
const sectionTitle = hasWishlistItems ? 'Your Saved Items' : 'You Might Also Like'
```

## User Experience Flow

### Adding to Wishlist
1. User browses products
2. User clicks heart button on product card/page
3. Heart animates with bounce effect
4. Item saved to wishlist (localStorage)
5. Heart icon fills with red color
6. No page refresh required

### Viewing Wishlist in Cart
1. User opens cart drawer
2. If wishlist has items:
   - "Your Saved Items" section appears with heart icon
   - Shows all wishlist items in horizontal scroll
3. If wishlist is empty:
   - "You Might Also Like" section appears
   - Shows generic recommended products

### Removing from Wishlist
1. User clicks filled heart button
2. Heart animates with scale effect
3. Item removed from wishlist
4. Heart icon returns to outline state
5. Item removed from cart drawer recommendations (if open)

## Technical Implementation

### Data Flow
```
User Action → WishlistButton
              ↓
         WishlistContext (add/remove)
              ↓
         localStorage (persist)
              ↓
         LocalCartDrawer (display)
```

### Storage
- **Key:** `street-collector-wishlist`
- **Format:** JSON array of WishlistItem objects
- **Persistence:** localStorage (survives page refresh)
- **Scope:** Per-browser (not synced across devices)

### Performance
- Uses React.useMemo for transformation caching
- No API calls required (localStorage is instant)
- Minimal re-renders (only when wishlist changes)
- GSAP animations for smooth UX

## Integration Points

### Shop Layout (`app/shop/layout.tsx`)
Provides WishlistProvider wrapper for all shop pages:
```tsx
<CartProvider>
  <WishlistProvider>
    <ShopLayoutInner>
      {children}
    </ShopLayoutInner>
  </WishlistProvider>
</CartProvider>
```

### Product Pages
Add WishlistButton to product detail pages:
```tsx
import { WishlistButton } from '@/components/shop/WishlistButton'

<WishlistButton
  productId={product.id}
  variantId={selectedVariant.id}
  handle={product.handle}
  title={product.title}
  price={selectedVariant.price}
  image={product.featuredImage?.url}
  artistName={product.vendor}
/>
```

### Product Cards
Add WishlistButton to product cards in collections/grids:
```tsx
<div className="product-card">
  <img src={product.image} alt={product.title} />
  <WishlistButton
    productId={product.id}
    variantId={product.variants[0].id}
    handle={product.handle}
    title={product.title}
    price={product.variants[0].price}
    image={product.image}
    artistName={product.vendor}
    size="sm"
    variant="ghost"
    className="absolute top-2 right-2"
  />
  <h3>{product.title}</h3>
  <p>${product.price}</p>
</div>
```

## Styling Guidelines

### Colors
- **Saved (filled):** `#f83a3a` (red)
- **Unsaved (outline):** `#1a1a1a/40` (gray)
- **Hover:** `#f83a3a/60` (light red)
- **Focus ring:** `#f0c417` (yellow)

### Animations
- **Add to wishlist:** Scale bounce (0.5 → 1.2 → 1.0)
- **Remove from wishlist:** Scale shrink (1.0 → 0.8 → 1.0)
- **Button pulse:** Box shadow ripple effect
- **Duration:** 200-600ms with easing

### Sizes
- **Small (sm):** 32px × 32px, 16px icon
- **Medium (md):** 40px × 40px, 20px icon
- **Large (lg):** 48px × 48px, 24px icon

## Accessibility

### Keyboard Navigation
- Tab to focus button
- Enter/Space to toggle wishlist
- Escape to close cart drawer

### Screen Readers
- `aria-label`: "Add to wishlist" / "Remove from wishlist"
- `title` attribute for tooltip
- Section title announces content type

### Focus States
- Visible focus ring (2px yellow)
- Focus offset for clarity
- Keyboard accessible throughout

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- localStorage API
- ES6+ JavaScript
- CSS Grid/Flexbox
- SVG support

### Fallbacks
- No localStorage: Feature disabled gracefully
- No JavaScript: Heart button hidden
- Old browsers: Basic functionality maintained

## Testing

### Unit Tests
- [ ] WishlistContext add/remove operations
- [ ] localStorage persistence
- [ ] isInWishlist check accuracy
- [ ] Clear wishlist functionality

### Integration Tests
- [ ] WishlistButton toggle behavior
- [ ] Cart drawer displays wishlist items
- [ ] Navigation from cart to product page
- [ ] Multiple wishlist items handling

### E2E Tests
- [ ] Add item to wishlist from product page
- [ ] View wishlist items in cart drawer
- [ ] Remove item from wishlist
- [ ] Wishlist persists across page refresh
- [ ] Wishlist items clickable in cart

### Manual Testing Checklist
- [ ] Heart button animates smoothly
- [ ] Wishlist items appear in cart drawer
- [ ] Section title updates correctly
- [ ] Heart icon shows when displaying wishlist
- [ ] Click navigation works
- [ ] localStorage persists data
- [ ] Works without login
- [ ] No console errors

## Known Limitations

### Current Limitations
1. **No Account Sync:** Wishlist is per-browser, not per-user account
2. **No Cross-Device:** Wishlist doesn't sync across devices
3. **No Sharing:** Can't share wishlist with others
4. **No Notifications:** No alerts when wishlist items go on sale
5. **Storage Limit:** localStorage has ~5-10MB limit per domain

### Planned Improvements
1. **Account Integration:** Sync wishlist to user account when logged in
2. **Email Reminders:** Send emails about wishlist items
3. **Price Alerts:** Notify when wishlist items go on sale
4. **Share Wishlist:** Generate shareable links
5. **Wishlist Page:** Dedicated page to view/manage all wishlist items
6. **Analytics:** Track wishlist behavior and conversion

## Analytics & Metrics

### Events to Track
```typescript
// When item added to wishlist
analytics.track('wishlist_item_added', {
  productId: string,
  productTitle: string,
  price: number,
  source: 'product_page' | 'product_card' | 'search_results'
})

// When item removed from wishlist
analytics.track('wishlist_item_removed', {
  productId: string,
  timeInWishlist: number // milliseconds
})

// When wishlist item viewed in cart
analytics.track('wishlist_item_viewed_in_cart', {
  productId: string,
  cartValue: number
})

// When wishlist item clicked from cart
analytics.track('wishlist_item_clicked_from_cart', {
  productId: string
})

// When wishlist item purchased
analytics.track('wishlist_item_purchased', {
  productId: string,
  timeInWishlist: number,
  price: number
})
```

### Key Metrics
- Wishlist add rate
- Wishlist to cart conversion rate
- Average time in wishlist before purchase
- Wishlist abandonment rate
- Most wishlisted products

## Troubleshooting

### Issue: Wishlist items not appearing in cart
**Solution:** Check that WishlistProvider is wrapping the shop layout

### Issue: Wishlist not persisting
**Solution:** Check browser localStorage is enabled and not full

### Issue: Heart button not animating
**Solution:** Verify GSAP is loaded and no console errors

### Issue: Wishlist items showing wrong data
**Solution:** Clear localStorage and refresh page

### Issue: Performance issues with large wishlist
**Solution:** Limit wishlist to 50 items maximum

## API Reference

### useWishlist Hook
```typescript
const {
  items,           // WishlistItem[]
  itemCount,       // number
  addItem,         // (item: Omit<WishlistItem, 'addedAt'>) => void
  removeItem,      // (productId: string) => void
  isInWishlist,    // (productId: string) => boolean
  clearWishlist,   // () => void
} = useWishlist()
```

### WishlistItem Type
```typescript
interface WishlistItem {
  productId: string      // Unique product identifier
  variantId: string      // Specific variant identifier
  handle: string         // Product URL handle
  title: string          // Product name
  price: number          // Price in USD
  image?: string         // Product image URL
  artistName?: string    // Artist/vendor name
  addedAt: number        // Timestamp when added
}
```

## Version History

### v1.0.0 (2026-02-04)
- Initial wishlist implementation
- WishlistContext with localStorage persistence
- WishlistButton with animations
- Cart drawer integration
- No login required

## Related Documentation

- [Cart Context Documentation](../lib/shop/CartContext.tsx)
- [Shop Layout Documentation](../app/shop/layout.tsx)
- [GSAP Animations Guide](../lib/animations/README.md)
- [Commit Log: Wishlist Cart Integration](../COMMIT_LOGS/wishlist-cart-integration-2026-02-04.md)

## Support

For issues or questions:
1. Check this documentation
2. Review commit logs
3. Check component source code
4. Test in different browsers
5. Clear localStorage and retry
