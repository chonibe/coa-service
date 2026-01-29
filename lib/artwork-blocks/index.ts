/**
 * Artwork Blocks Library
 * 
 * Centralized definitions for artwork content blocks following
 * Shopify theme section schema patterns.
 */

// Block schemas - single source of truth for block definitions
export {
  BLOCK_SCHEMAS,
  getBlockSchema,
  getBlockById,
  getBlocksByCategory,
  getAllBlockNames,
  validateBlockConfig,
  type BlockSchema,
  type BlockSetting,
  type SettingType,
} from "./block-schemas"

// Page templates - pre-built layouts for quick page creation
export {
  PAGE_TEMPLATES,
  getPageTemplate,
  type PageTemplate,
  type PageTemplateBlock,
} from "./page-templates"

// Utilities
export { uploadWithProgress } from "./upload-with-progress"
