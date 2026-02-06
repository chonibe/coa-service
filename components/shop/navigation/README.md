# State-of-the-Art Shop Navigation System

> Advanced scroll-responsive navigation with unified modal experience

## 📁 Component Structure

```
components/shop/navigation/
├── ShopNavigation.tsx           # Main controller component
├── FullHeader.tsx               # Full-size header (pre-scroll)
├── MinifiedNavBar.tsx           # Floating compact pill (scrolled)
├── NavigationModal.tsx          # Center-screen unified modal
├── NavSearch.tsx                # Integrated predictive search
├── NavCart.tsx                  # Cart preview with suggestions
├── AddToCartNotification.tsx   # Bottom slide-up notification
├── index.ts                     # Exports
└── README.md                    # This file
```

## 🎯 Features

### Two-State Navigation System

1. **Full Header (scrollY < 200px)**
   - Large header with integrated search bar
   - Horizontal navigation menu (desktop)
   - Cart and account icons with counts
   - Full branding and visual presence

2. **Minified Bar (scrollY >= 200px)**
   - Compact floating pill at top-center
   - Minimal footprint (48px height)
   - Transforms into modal on click
   - Maintains cart count visibility

3. **Unified Navigation Modal**
   - Expands from minified bar
   - Full search experience
   - Navigation menu with expandable sections
   - Integrated cart preview with suggestions
   - Account access

### Key Capabilities

- ✅ **Scroll-responsive transitions** - Smooth GSAP animations
- ✅ **Integrated search** - Real-time predictive search with recent history
- ✅ **Cart preview** - Full cart management within modal
- ✅ **Add-to-cart notifications** - Bottom slide-up toasts
- ✅ **Free shipping progress** - Visual indicator in cart
- ✅ **Keyboard shortcuts** - ESC to close, etc.
- ✅ **Fully accessible** - ARIA labels, keyboard navigation
- ✅ **Mobile responsive** - Optimized for all screen sizes

## 🚀 Usage

### Basic Implementation

```tsx
import { ShopNavigation } from '@/components/shop/navigation'
import { useCart } from '@/lib/shop/CartContext'

function ShopLayout({ children }) {
  const cart = useCart()
  
  return (
    <>
      <ShopNavigation
        logoHref="/shop/home"
        navigation={navigationItems}
        onSearch={handleSearch}
        cartItems={cart.items}
        cartSubtotal={cart.subtotal}
        cartTotal={cart.total}
        cartItemCount={cart.itemCount}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeItem}
        onCheckout={handleCheckout}
        onAccountClick={() => router.push('/account')}
        scrollThreshold={200}
      />
      <main>{children}</main>
    </>
  )
}
```

### Navigation Data Structure

```tsx
const navigationItems: NavItem[] = [
  {
    label: 'Shop',
    href: '/shop/products',
    children: [
      { label: 'All Artworks', href: '/shop/products' },
      { label: 'New Releases', href: '/shop/new' },
      { label: 'Best Sellers', href: '/shop/best' },
    ]
  },
  {
    label: 'Artists',
    href: '/shop/artists',
    children: [
      { label: 'All Artists', href: '/shop/artists' },
      { label: 'Featured', href: '/shop/artists?featured=true' },
    ]
  },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]
```

### Search Handler

```tsx
const handleSearch = async (query: string) => {
  const response = await fetch(`/api/shop/search?q=${encodeURIComponent(query)}`)
  const data = await response.json()
  
  return {
    products: data.products.map(p => ({
      id: p.id,
      handle: p.handle,
      title: p.title,
      type: 'product',
      image: p.featuredImage,
      price: formatPrice(p.priceRange.minVariantPrice),
      vendor: p.vendor,
    })),
    collections: data.collections.map(c => ({
      id: c.id,
      handle: c.handle,
      title: c.title,
      type: 'collection',
      image: c.image,
    }))
  }
}
```

## 🎨 Animation Specifications

| Element | Animation | Duration | Easing | Trigger |
|---------|-----------|----------|--------|---------|
| Full → Minified | Fade + Scale | 300ms | power2.out | Scroll past threshold |
| Minified → Modal | Scale from center | 400ms | power3.out | Click minified bar |
| Modal content | Stagger reveal | 400ms | power2.out | Modal open |
| Cart notification | Slide up | 350ms | back.out | Item added to cart |
| Search results | Fade in | 250ms | power2.out | Query debounce |
| Nav item hover | Lift + highlight | 150ms | power1.out | Mouse enter |

## 🎯 Component APIs

### ShopNavigation

Main controller component.

```tsx
interface ShopNavigationProps {
  // Branding
  logo?: React.ReactNode
  logoSrc?: string
  logoHref?: string
  
  // Navigation
  navigation?: NavItem[]
  
  // Search
  onSearch: (query: string) => Promise<SearchResults>
  searchPlaceholder?: string
  
  // Cart
  cartItems: CartItem[]
  cartSubtotal: number
  cartTotal: number
  cartItemCount: number
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onCheckout: () => void
  onViewCart?: () => void
  cartLoading?: boolean
  
  // Account
  onAccountClick?: () => void
  
  // Settings
  scrollThreshold?: number // Default: 200
  className?: string
}
```

### FullHeader

Large header shown before scroll threshold.

```tsx
interface FullHeaderProps {
  logo?: React.ReactNode
  logoSrc?: string
  logoHref?: string
  navigation?: NavItem[]
  cartCount?: number
  onCartClick?: () => void
  onSearchFocus?: () => void
  onAccountClick?: () => void
  searchPlaceholder?: string
  className?: string
}
```

### MinifiedNavBar

Compact floating pill shown when scrolled.

```tsx
interface MinifiedNavBarProps {
  isVisible: boolean
  isModalOpen: boolean
  cartCount?: number
  logoSrc?: string
  onToggleModal: () => void
  className?: string
}
```

### NavigationModal

Center-screen unified navigation overlay.

```tsx
interface NavigationModalProps {
  isOpen: boolean
  onClose: () => void
  navigation: NavItem[]
  onSearch: (query: string) => Promise<SearchResults>
  cartItems: CartItem[]
  cartSubtotal: number
  cartTotal: number
  cartItemCount: number
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onCheckout: () => void
  onViewCart?: () => void
  cartLoading?: boolean
  onAccountClick?: () => void
  className?: string
}
```

## 🔧 Technical Details

### State Management

- **Scroll State**: Native `window.scrollY` with passive event listener
- **Modal State**: React `useState` in `ShopNavigation` controller
- **Cart State**: Provided via `CartContext` from parent
- **Notification State**: Auto-triggered on cart count increase

### Performance Optimizations

1. **Passive Scroll Listeners** - No layout blocking
2. **GSAP Timeline Reuse** - Animations cached and reversed
3. **Debounced Search** - 300ms delay before API call
4. **Local Storage Caching** - Recent searches persisted
5. **Will-Change Hints** - GPU acceleration for transforms

### Accessibility

- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation (Tab, Enter, ESC)
- ✅ Focus management (auto-focus search on modal open)
- ✅ Screen reader announcements
- ✅ High contrast support
- ✅ Reduced motion respect

## 🎬 Animation Dependencies

This navigation system uses:

- **GSAP** - Core animations and ScrollTrigger
- **@gsap/react** - React integration (`useGSAP` hook)
- **Framer Motion** - Exit animations (optional)

Ensure these are installed:

```bash
npm install gsap @gsap/react framer-motion
```

## 📦 Related Files

- **Animation utilities**: `lib/animations/navigation-animations.ts`
- **Cart context**: `lib/shop/CartContext.tsx`
- **Search types**: `components/impact/SearchDrawer.tsx`
- **Layout integration**: `app/shop/layout.tsx`

## 🐛 Known Issues / Limitations

- None currently identified

## 🔮 Future Enhancements

- [ ] Mega menu for product categories
- [ ] Quick view product modal from search
- [ ] Voice search integration
- [ ] Multi-currency support in cart
- [ ] Wishlist integration in modal
- [ ] Recently viewed products section

## 📝 Version History

### v1.0.0 (2026-02-04)
- Initial implementation
- Scroll-responsive two-state navigation
- Unified modal experience
- Integrated search and cart
- Add-to-cart notifications
- Full GSAP animations

---

**Maintained by**: The Street Collector Development Team  
**Last Updated**: February 4, 2026
