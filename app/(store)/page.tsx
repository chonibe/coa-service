/**
 * Root route (/) — Main landing page when you visit thestreetcollector.com (or www).
 * Renders the home-v2 landing so the URL stays / with no redirect.
 * Uses (store) layout so Footer, Cart, and ChatIcon are shown.
 */
export { default, metadata, revalidate } from './shop/home-v2/page'
