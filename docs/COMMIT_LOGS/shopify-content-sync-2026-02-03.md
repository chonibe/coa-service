# Shopify Content Sync Implementation

**Date:** 2026-02-03
**Type:** Feature Implementation

## Summary

Implemented comprehensive Shopify content sync system to fetch and cache live store content including navigation menus, static pages, blog articles, and product media (videos, 3D models).

## Changes Made

### New Files Created

1. **`lib/shopify/menus.ts`** - Menu queries and types
   - GraphQL queries for fetching navigation menus
   - `getMenu()`, `getMainMenu()`, `getFooterMenu()` functions
   - URL transformation from Shopify to internal paths
   - `transformMenuToNavigation()` and `transformMenuToFooterSections()` utilities
   - In-memory caching with TTL

2. **`lib/shopify/pages.ts`** - Page queries and types
   - GraphQL queries for fetching static pages
   - `getPage()`, `getAllPages()`, `getPagesByHandles()` functions
   - Common page handles (about, contact, policies)
   - Content utilities (stripHtml, truncateText, getPageExcerpt)
   - Caching support

3. **`lib/shopify/blogs.ts`** - Blog/article queries and types
   - GraphQL queries for blogs and articles
   - `getBlogs()`, `getBlogWithArticles()`, `getArticle()` functions
   - Article utilities (getReadingTime, formatArticleDate)
   - Related articles by tag
   - Caching support

4. **`scripts/sync-shopify-content.ts`** - Content sync script
   - Fetches all content from Shopify Storefront API
   - Generates `content/shopify-content.ts` with typed exports
   - Run with: `npx tsx scripts/sync-shopify-content.ts`

5. **`content/shopify-content.ts`** - Generated content file
   - Fallback navigation and footer sections
   - Type exports for NavigationItem, FooterSection, SyncedPage, SyncedArticle
   - Helper functions: getPage(), hasPage(), getArticle(), etc.

6. **`app/shop/pages/[handle]/page.tsx`** - Dynamic page renderer
   - Server component for static Shopify pages
   - Metadata generation from page SEO
   - Synced content with API fallback

7. **`app/shop/blog/page.tsx`** - Blog listing page
   - Article grid with filtering by tag
   - Image cards with metadata
   - Client-side API fallback if no synced content

8. **`app/shop/blog/[handle]/page.tsx`** - Article detail page
   - Full article content with hero image
   - Reading time calculation
   - Related articles section
   - SEO metadata

### Modified Files

1. **`lib/shopify/storefront-client.ts`**
   - Added media type definitions (ShopifyVideo, ShopifyExternalVideo, ShopifyMediaImage, ShopifyModel3d)
   - Extended PRODUCT_FRAGMENT with media query for videos, 3D models
   - Added media field to ShopifyProduct interface

2. **`app/shop/layout.tsx`**
   - Imports synced navigation from content/shopify-content.ts
   - Fallback to hardcoded navigation if synced content is empty
   - Dynamic footer sections support

3. **`app/shop/[handle]/components/ProductGallery.tsx`**
   - Added ProductMedia interface for unified media handling
   - Added convertShopifyMedia() utility function
   - Implemented video player with poster/play button
   - YouTube and Vimeo external video embed support
   - 3D model preview with indicator badge
   - Media type indicators on thumbnails

4. **`app/shop/[handle]/components/index.ts`**
   - Export convertShopifyMedia and ProductMedia type

## Content Types Supported

| Content Type      | Shopify Query               | Storage Location              |
| ----------------- | --------------------------- | ----------------------------- |
| Main Menu         | `menu(handle: "main-menu")` | `content/shopify-content.ts`  |
| Footer Menu       | `menu(handle: "footer")`    | `content/shopify-content.ts`  |
| Static Pages      | `pages` query               | `content/shopify-content.ts`  |
| Blog Articles     | `articles` query            | `content/shopify-content.ts`  |
| Product Videos    | `product.media`             | Fetched dynamically via API   |
| 3D Models         | `product.media`             | Fetched dynamically via API   |

## Usage

### Syncing Content

```bash
# From project root
npx tsx scripts/sync-shopify-content.ts
```

Requires environment variables:
- `SHOPIFY_SHOP` or `NEXT_PUBLIC_SHOPIFY_SHOP`
- `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` or `SHOPIFY_STOREFRONT_ACCESS_TOKEN`

### Accessing Synced Content

```typescript
import { 
  mainNavigation, 
  footerSections,
  getPage,
  getArticle,
  articles 
} from '@/content/shopify-content'

// Navigation
const nav = mainNavigation // NavigationItem[]
const footer = footerSections // FooterSection[]

// Pages
const aboutPage = getPage('about')

// Articles
const allArticles = articles
const specific = getArticle('my-article-handle')
```

## Implementation Checklist

- [x] Create lib/shopify/menus.ts
- [x] Create lib/shopify/pages.ts
- [x] Create lib/shopify/blogs.ts
- [x] Add media fragment to storefront-client.ts
- [x] Create sync script
- [x] Create content file template
- [x] Create dynamic page renderer
- [x] Create blog listing page
- [x] Create article detail page
- [x] Update shop layout with dynamic menus
- [x] Update ProductGallery with video/3D support
- [x] Update Footer to use synced sections

## Testing Notes

- ✅ Sync script tested successfully with Vercel environment variables
- ✅ Successfully synced from live Shopify store:
  - 2 navigation menu items
  - 3 footer sections
  - 47 static pages (About, Contact, FAQ, Artist Submissions, etc.)
  - 3 blog articles
- Fallback content ensures app works without synced data
- Pages and blog routes accessible at:
  - `/shop/pages/[handle]` - 47 pages available
  - `/shop/blog` - 3 articles available
  - `/shop/blog/[handle]` - Individual article pages

## Sync Results

Last synced: 2026-02-03T20:11:43.986Z

Content synced from: thestreetlamp-9103.myshopify.com

## Page Layout Improvements

After implementing the base functionality, the following improvements were made to ensure proper layout integration:

### Components Added

1. **`components/impact/Breadcrumb.tsx`**
   - Breadcrumb navigation component
   - `generateBreadcrumbs()` helper function
   - Auto-generates breadcrumbs from pathname

2. **`components/impact/EmptyState.tsx`**
   - Empty state component for no content scenarios
   - Loading state skeleton component
   - Pre-built variants: `NoArticlesFound`, `NoResultsFound`, `PageNotFound`

### Page Enhancements

1. **Static Pages** (`/shop/pages/[handle]`)
   - ✅ Added breadcrumb navigation (Home > Pages > [Page Title])
   - ✅ Proper prose styling for content
   - ✅ Narrow container for better readability

2. **Blog Listing** (`/shop/blog`)
   - ✅ Added breadcrumb navigation (Home > Blog)
   - ✅ Tag filtering with active states
   - ✅ Empty state when no articles found
   - ✅ Loading skeleton during initial load
   - ✅ Responsive grid (1 col mobile, 2 tablet, 3 desktop)

3. **Blog Articles** (`/shop/blog/[handle]`)
   - ✅ Added breadcrumb navigation (Home > Blog > [Article Title])
   - ✅ Improved hero image with max-width constraint
   - ✅ Better aspect ratio (21:9 desktop, 16:7 mobile)
   - ✅ Related articles section
   - ✅ Reading time calculation
   - ✅ Prose styling for article content

### Layout Features

- All pages wrapped by shop layout (header + footer)
- Consistent spacing using SectionWrapper
- Proper container widths (narrow for content, default for grids)
- Mobile-responsive design
- Loading states during content fetch
- Empty states for missing content

## Related Files

- `lib/shopify/storefront-client.ts` - Core Shopify API client
- `content/homepage.ts` - Existing homepage content (unchanged)
- `app/shop/layout.tsx` - Shop layout with navigation
- `components/impact/Breadcrumb.tsx` - Breadcrumb navigation
- `components/impact/EmptyState.tsx` - Empty & loading states
