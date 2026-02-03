/**
 * Shopify Menu Queries
 * 
 * Fetches navigation menus from the Shopify Storefront API.
 * Used for header navigation, footer links, and other menu-based content.
 */

import { storefrontQuery } from './storefront-client'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ShopifyMenuItem {
  id: string
  title: string
  url: string
  type: 'HTTP' | 'COLLECTION' | 'PRODUCT' | 'PAGE' | 'BLOG' | 'ARTICLE' | 'SEARCH' | 'SHOP_POLICY'
  items: ShopifyMenuItem[]
}

export interface ShopifyMenu {
  id: string
  handle: string
  title: string
  items: ShopifyMenuItem[]
}

// Transformed menu item for easier consumption
export interface NavigationItem {
  label: string
  href: string
  children?: NavigationItem[]
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

const MENU_ITEM_FRAGMENT = `
  fragment MenuItemFields on MenuItem {
    id
    title
    url
    type
  }
`

const GET_MENU_QUERY = `
  ${MENU_ITEM_FRAGMENT}
  query GetMenu($handle: String!) {
    menu(handle: $handle) {
      id
      handle
      title
      items {
        ...MenuItemFields
        items {
          ...MenuItemFields
          items {
            ...MenuItemFields
          }
        }
      }
    }
  }
`

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get a menu by handle
 */
export async function getMenu(handle: string): Promise<ShopifyMenu | null> {
  try {
    const data = await storefrontQuery<{ menu: ShopifyMenu | null }>(GET_MENU_QUERY, { handle })
    return data.menu
  } catch (error) {
    console.error(`Error fetching menu "${handle}":`, error)
    return null
  }
}

/**
 * Get the main navigation menu (header)
 */
export async function getMainMenu(): Promise<ShopifyMenu | null> {
  return getMenu('main-menu')
}

/**
 * Get the footer menu
 */
export async function getFooterMenu(): Promise<ShopifyMenu | null> {
  return getMenu('footer')
}

/**
 * Get multiple menus at once
 */
export async function getMenus(handles: string[]): Promise<Record<string, ShopifyMenu | null>> {
  const results: Record<string, ShopifyMenu | null> = {}
  
  // Fetch all menus in parallel
  const promises = handles.map(async (handle) => {
    const menu = await getMenu(handle)
    results[handle] = menu
  })
  
  await Promise.all(promises)
  return results
}

// =============================================================================
// TRANSFORMATION UTILITIES
// =============================================================================

/**
 * Transform Shopify URL to internal URL
 * Converts Shopify absolute URLs to relative paths for our app
 */
function transformUrl(url: string): string {
  if (!url) return '/'
  
  try {
    const urlObj = new URL(url)
    // Extract the pathname from the full URL
    let path = urlObj.pathname
    
    // Map Shopify paths to our internal paths
    const pathMappings: Record<string, string> = {
      '/collections': '/shop/collections',
      '/products': '/shop',
      '/pages': '/shop/pages',
      '/blogs': '/shop/blog',
      '/policies': '/policies',
    }
    
    // Apply mappings
    for (const [shopifyPath, internalPath] of Object.entries(pathMappings)) {
      if (path.startsWith(shopifyPath)) {
        path = path.replace(shopifyPath, internalPath)
        break
      }
    }
    
    return path
  } catch {
    // If URL parsing fails, return the original (might already be a relative path)
    return url
  }
}

/**
 * Transform a Shopify menu item to a navigation item
 */
function transformMenuItem(item: ShopifyMenuItem): NavigationItem {
  const navItem: NavigationItem = {
    label: item.title,
    href: transformUrl(item.url),
  }
  
  if (item.items && item.items.length > 0) {
    navItem.children = item.items.map(transformMenuItem)
  }
  
  return navItem
}

/**
 * Transform a Shopify menu to an array of navigation items
 */
export function transformMenuToNavigation(menu: ShopifyMenu | null): NavigationItem[] {
  if (!menu || !menu.items) return []
  return menu.items.map(transformMenuItem)
}

/**
 * Transform a Shopify menu to footer sections format
 */
export function transformMenuToFooterSections(menu: ShopifyMenu | null): Array<{
  title: string
  links: Array<{ label: string; href: string }>
}> {
  if (!menu || !menu.items) return []
  
  return menu.items.map((section) => ({
    title: section.title,
    links: (section.items || []).map((item) => ({
      label: item.title,
      href: transformUrl(item.url),
    })),
  }))
}

// =============================================================================
// CACHED MENU FUNCTIONS
// =============================================================================

// In-memory cache for menus
let menuCache: {
  mainMenu: { data: NavigationItem[] | null; timestamp: number } | null
  footerSections: { data: Array<{ title: string; links: Array<{ label: string; href: string }> }> | null; timestamp: number } | null
} = {
  mainMenu: null,
  footerSections: null,
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get main navigation with caching
 */
export async function getCachedMainNavigation(): Promise<NavigationItem[]> {
  const now = Date.now()
  
  if (menuCache.mainMenu && (now - menuCache.mainMenu.timestamp) < CACHE_TTL) {
    return menuCache.mainMenu.data || []
  }
  
  const menu = await getMainMenu()
  const navigation = transformMenuToNavigation(menu)
  
  menuCache.mainMenu = { data: navigation, timestamp: now }
  return navigation
}

/**
 * Get footer sections with caching
 */
export async function getCachedFooterSections(): Promise<Array<{
  title: string
  links: Array<{ label: string; href: string }>
}>> {
  const now = Date.now()
  
  if (menuCache.footerSections && (now - menuCache.footerSections.timestamp) < CACHE_TTL) {
    return menuCache.footerSections.data || []
  }
  
  const menu = await getFooterMenu()
  const sections = transformMenuToFooterSections(menu)
  
  menuCache.footerSections = { data: sections, timestamp: now }
  return sections
}

/**
 * Clear menu cache (useful for development or manual refresh)
 */
export function clearMenuCache(): void {
  menuCache = {
    mainMenu: null,
    footerSections: null,
  }
}
