# Cart Context API Fix

**Date:** 2026-02-04  
**Status:** ✅ Complete  
**Files Modified:** 2

## Problem Statement

After fixing the drawer animations, the cart drawer was throwing a runtime error:

```
TypeError: cart.setIsOpen is not a function
```

This error occurred when trying to open the cart from `TransparentHeader` component.

## Root Cause

The `CartContext` provides a `toggleCart(isOpen?: boolean)` function to control the cart drawer state, but components were incorrectly calling `cart.setIsOpen()` which doesn't exist in the CartContext API.

### Incorrect Usage
```typescript
// ❌ Wrong - setIsOpen doesn't exist
cart.setIsOpen(true)
cart.setIsOpen(false)
```

### Correct Usage
```typescript
// ✅ Correct - use toggleCart
cart.toggleCart(true)
cart.toggleCart(false)
```

## CartContext API Reference

From `lib/shop/CartContext.tsx`:

```typescript
interface CartContextValue extends CartState {
  // State
  items: CartItem[]
  creditsToUse: number
  isOpen: boolean          // Read the open state
  orderNotes: string
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  setCreditsToUse: (credits: number) => void
  setOrderNotes: (notes: string) => void
  clearCart: () => void
  toggleCart: (isOpen?: boolean) => void  // ← Use this to control drawer
  
  // Computed
  itemCount: number
  subtotal: number
  creditsDiscount: number
  total: number
  isEmpty: boolean
}
```

## Solution Applied

Updated all components to use the correct `toggleCart()` API:

### 1. `components/sections/TransparentHeader.tsx`

**Before:**
```typescript
const handleCartClick = useCallback(() => {
  cart.setIsOpen(true)  // ❌ Error
}, [cart])

// ...
<LocalCartDrawer
  isOpen={cart.isOpen}
  onClose={() => cart.setIsOpen(false)}  // ❌ Error
```

**After:**
```typescript
const handleCartClick = useCallback(() => {
  cart.toggleCart(true)  // ✅ Correct
}, [cart])

// ...
<LocalCartDrawer
  isOpen={cart.isOpen}
  onClose={() => cart.toggleCart(false)}  // ✅ Correct
```

### 2. `app/shop/home-v2/TransparentHeaderWrapper.tsx`

**Before:**
```typescript
export function TransparentHeaderWrapper() {
  const cart = useCart()
  
  return (
    <TransparentHeader
      navigation={shopNavigation}
      logoHref="/shop/home"
      cartCount={cart.itemCount}
      onCartClick={() => cart.setIsOpen(true)}  // ❌ Wrong API + unnecessary
    />
  )
}
```

**After:**
```typescript
export function TransparentHeaderWrapper() {
  // Removed unnecessary cart usage - TransparentHeader handles it internally
  return (
    <TransparentHeader
      navigation={shopNavigation}
      logoHref="/shop/home"
    />
  )
}
```

## Why TransparentHeader Manages Cart Internally

The `TransparentHeader` component already:
1. Imports and uses `useCart()` hook internally
2. Manages cart drawer state
3. Handles cart click events
4. Passes correct props to `LocalCartDrawer`

Therefore, wrapper components don't need to:
- Call `useCart()` themselves
- Pass `onCartClick` handlers
- Manage cart state

This follows the principle of **single responsibility** - the header component owns its own cart interaction logic.

## Files Changed

1. ✅ `components/sections/TransparentHeader.tsx` - Fixed API calls
2. ✅ `app/shop/home-v2/TransparentHeaderWrapper.tsx` - Removed redundant cart logic

## Testing Checklist

- [x] Cart opens when clicking cart icon in TransparentHeader
- [x] Cart closes when clicking backdrop
- [x] Cart closes when clicking close button
- [x] No console errors about `setIsOpen`
- [x] Cart drawer animates smoothly (from previous fix)

## Related Fixes

This fix is related to:
- [Drawer Close Fix](./drawer-close-fix-2026-02-04.md) - Fixed drawer animations
- Both fixes were necessary for cart to work properly

## Lessons Learned

1. **Check API contracts** - Always verify the actual API of context/hooks before using
2. **Component responsibility** - Components that manage state should handle their own interactions
3. **Avoid prop drilling** - Don't pass through props that the child can get from context itself

---

**Note:** This fix ensures all components use the correct CartContext API (`toggleCart`) instead of calling non-existent methods (`setIsOpen`).
