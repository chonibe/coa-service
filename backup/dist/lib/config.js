"use strict";
/**
 * Application configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IS_DEVELOPMENT = exports.FEATURES = exports.DEFAULT_PAGINATION_LIMIT = exports.API_BASE_URL = void 0;
// Base URL for API calls
exports.API_BASE_URL = (() => {
    const url = process.env.NEXT_PUBLIC_APP_URL || "https://v0-image-analysis-wine-six.vercel.app";
    // Ensure URL has https:// prefix
    if (!url.startsWith("https://")) {
        return `https://${url.replace(/^http:\/\/|^https:\/\/|^ttps:\/\//, "")}`;
    }
    return url;
})();
// Default pagination limit
exports.DEFAULT_PAGINATION_LIMIT = 5;
// Feature flags
exports.FEATURES = {
    ENABLE_EDITION_DISPLAY: true,
    ENABLE_INVENTORY_DISPLAY: true,
    ENABLE_RARITY_DISPLAY: true,
    USE_MOCK_DATA_FALLBACK: true, // Enable mock data when API is unavailable
};
// Development mode
exports.IS_DEVELOPMENT = process.env.NODE_ENV === "development";
