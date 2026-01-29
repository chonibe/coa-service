/**
 * Shopify-style Block Schema System
 * 
 * Single source of truth for all artwork content block definitions.
 * Based on Shopify theme section schema patterns.
 */

// Shopify-style settings types
export type SettingType = 
  | "text" 
  | "textarea" 
  | "richtext"
  | "image_picker" 
  | "video_url"
  | "url"
  | "select" 
  | "checkbox" 
  | "range"

export interface BlockSetting {
  id: string
  type: SettingType
  label: string
  default?: any
  placeholder?: string
  info?: string  // Help text
  options?: { value: string; label: string }[]  // For select type
}

export interface BlockSchema {
  id: string
  name: string           // Database name: "Artwork Text Block"
  label: string          // UI label: "Text"
  description: string
  category: "basic" | "immersive" | "structure"
  icon: string           // Lucide icon name
  ui: {
    iconColor: string
    headerGradient: string
    sidebarGradient?: string
  }
  settings: BlockSetting[]
  supportsChildren?: boolean
  maxBlocks?: number     // For containers like Section Group
}

/**
 * All block schemas - single source of truth
 */
export const BLOCK_SCHEMAS: BlockSchema[] = [
  // ============ BASIC BLOCKS ============
  {
    id: "text",
    name: "Artwork Text Block",
    label: "Text",
    description: "Add paragraphs or descriptions",
    category: "basic",
    icon: "FileText",
    ui: {
      iconColor: "text-gray-400",
      headerGradient: "bg-gray-800"
    },
    settings: [
      { id: "content", type: "textarea", label: "Content" }
    ]
  },
  {
    id: "image",
    name: "Artwork Image Block",
    label: "Image",
    description: "Add a single image",
    category: "basic",
    icon: "Image",
    ui: {
      iconColor: "text-blue-400",
      headerGradient: "bg-gray-800"
    },
    settings: [
      { id: "image", type: "image_picker", label: "Image" },
      { id: "caption", type: "text", label: "Caption", placeholder: "Optional caption" },
      { 
        id: "fit", 
        type: "select", 
        label: "Fit Mode", 
        default: "cover",
        options: [
          { value: "cover", label: "Cover" },
          { value: "contain", label: "Contain" }
        ]
      }
    ]
  },
  {
    id: "video",
    name: "Artwork Video Block",
    label: "Video",
    description: "Embed or upload video",
    category: "basic",
    icon: "Video",
    ui: {
      iconColor: "text-purple-400",
      headerGradient: "bg-gray-800"
    },
    settings: [
      { 
        id: "video_url", 
        type: "video_url", 
        label: "Video URL",
        info: "YouTube, Vimeo, or direct video link"
      }
    ]
  },
  {
    id: "audio",
    name: "Artwork Audio Block",
    label: "Audio",
    description: "Upload audio file",
    category: "basic",
    icon: "Music",
    ui: {
      iconColor: "text-teal-400",
      headerGradient: "bg-gray-800"
    },
    settings: [
      { id: "audio_url", type: "url", label: "Audio File" }
    ]
  },

  // ============ IMMERSIVE BLOCKS ============
  {
    id: "soundtrack",
    name: "Artwork Soundtrack Block",
    label: "Soundtrack",
    description: "Spotify track with note",
    category: "immersive",
    icon: "Music",
    ui: {
      iconColor: "text-green-400",
      headerGradient: "bg-gradient-to-r from-green-900/30 to-gray-800",
      sidebarGradient: "from-green-900/30 to-emerald-800/30"
    },
    settings: [
      { 
        id: "spotify_url", 
        type: "url", 
        label: "Spotify URL",
        info: "Paste a Spotify track, album, or playlist link"
      },
      { 
        id: "note", 
        type: "textarea", 
        label: "Why this track?", 
        placeholder: "Share why this music connects to your artwork..." 
      }
    ]
  },
  {
    id: "voice-note",
    name: "Artwork Voice Note Block",
    label: "Voice Note",
    description: "Record audio message",
    category: "immersive",
    icon: "Mic",
    ui: {
      iconColor: "text-purple-400",
      headerGradient: "bg-gradient-to-r from-purple-900/30 to-gray-800",
      sidebarGradient: "from-purple-900/30 to-purple-800/30"
    },
    settings: [
      { id: "audio_url", type: "url", label: "Audio File" },
      { id: "transcript", type: "textarea", label: "Transcript", placeholder: "Optional transcript" }
    ]
  },
  {
    id: "process-gallery",
    name: "Artwork Process Gallery Block",
    label: "Process Gallery",
    description: "Behind-the-scenes photos",
    category: "immersive",
    icon: "Camera",
    ui: {
      iconColor: "text-blue-400",
      headerGradient: "bg-gradient-to-r from-blue-900/30 to-gray-800",
      sidebarGradient: "from-blue-900/30 to-blue-800/30"
    },
    settings: [
      { id: "intro", type: "textarea", label: "Introduction", placeholder: "Optional intro text" },
      { id: "images", type: "image_picker", label: "Process Images" }
    ]
  },
  {
    id: "inspiration",
    name: "Artwork Inspiration Block",
    label: "Inspiration",
    description: "Mood board images",
    category: "immersive",
    icon: "Lightbulb",
    ui: {
      iconColor: "text-yellow-400",
      headerGradient: "bg-gradient-to-r from-yellow-900/30 to-gray-800",
      sidebarGradient: "from-yellow-900/30 to-yellow-800/30"
    },
    settings: [
      { id: "story", type: "textarea", label: "Inspiration Story" },
      { id: "images", type: "image_picker", label: "Inspiration Images" }
    ]
  },
  {
    id: "artist-note",
    name: "Artwork Artist Note Block",
    label: "Artist Note",
    description: "Personal letter with signature",
    category: "immersive",
    icon: "PenTool",
    ui: {
      iconColor: "text-amber-400",
      headerGradient: "bg-gradient-to-r from-amber-900/30 to-gray-800",
      sidebarGradient: "from-amber-900/30 to-amber-800/30"
    },
    settings: [
      { id: "content", type: "richtext", label: "Your Note" },
      { id: "show_signature", type: "checkbox", label: "Show Signature", default: true }
    ]
  },
  {
    id: "map",
    name: "Artwork Map Block",
    label: "Location",
    description: "Share a meaningful location with photos",
    category: "immersive",
    icon: "MapPin",
    ui: {
      iconColor: "text-rose-400",
      headerGradient: "bg-gradient-to-r from-rose-900/30 to-gray-800",
      sidebarGradient: "from-rose-900/30 to-rose-800/30"
    },
    settings: [
      { id: "title", type: "text", label: "Title", placeholder: "e.g., Where I painted this" },
      { id: "location_name", type: "text", label: "Location Name", placeholder: "e.g., Montmartre, Paris" },
      { id: "latitude", type: "text", label: "Latitude", placeholder: "e.g., 48.8867" },
      { id: "longitude", type: "text", label: "Longitude", placeholder: "e.g., 2.3431" },
      { id: "description", type: "textarea", label: "Description", placeholder: "Tell the story of this place..." },
      { 
        id: "map_style", 
        type: "select", 
        label: "Map Style", 
        default: "street",
        options: [
          { value: "street", label: "Street" },
          { value: "satellite", label: "Satellite" },
          { value: "artistic", label: "Artistic" }
        ]
      },
      { id: "images", type: "image_picker", label: "Location Photos" }
    ]
  },

  // ============ STRUCTURE BLOCKS ============
  {
    id: "section-group",
    name: "Artwork Section Group Block",
    label: "Section Group",
    description: "Container for organizing blocks",
    category: "structure",
    icon: "Layers",
    ui: {
      iconColor: "text-indigo-400",
      headerGradient: "bg-gradient-to-r from-indigo-900/30 to-gray-800",
      sidebarGradient: "from-indigo-900/30 to-indigo-800/30"
    },
    settings: [
      { id: "title", type: "text", label: "Section Title" },
      { id: "description", type: "textarea", label: "Description", placeholder: "Optional section description" },
      { 
        id: "style", 
        type: "select", 
        label: "Style", 
        default: "default",
        options: [
          { value: "default", label: "Default" },
          { value: "highlighted", label: "Highlighted" },
          { value: "minimal", label: "Minimal" }
        ]
      }
    ],
    supportsChildren: true,
    maxBlocks: 10
  }
]

// ============ HELPER FUNCTIONS ============

/**
 * Get a block schema by database name
 */
export function getBlockSchema(name: string): BlockSchema | undefined {
  return BLOCK_SCHEMAS.find(s => s.name === name)
}

/**
 * Get a block schema by ID
 */
export function getBlockById(id: string): BlockSchema | undefined {
  return BLOCK_SCHEMAS.find(s => s.id === id)
}

/**
 * Get all blocks in a category
 */
export function getBlocksByCategory(category: BlockSchema["category"]): BlockSchema[] {
  return BLOCK_SCHEMAS.filter(s => s.category === category)
}

/**
 * Get all block names (for database queries)
 */
export function getAllBlockNames(): string[] {
  return BLOCK_SCHEMAS.map(s => s.name)
}

/**
 * Validate block config against schema
 */
export function validateBlockConfig(blockName: string, config: Record<string, any>): { 
  valid: boolean
  errors: string[] 
} {
  const schema = getBlockSchema(blockName)
  if (!schema) {
    return { valid: false, errors: [`Unknown block type: ${blockName}`] }
  }

  const errors: string[] = []
  
  // Check required fields (none currently required, but ready for future)
  // for (const setting of schema.settings) {
  //   if (setting.required && !config[setting.id]) {
  //     errors.push(`${setting.label} is required`)
  //   }
  // }

  return { valid: errors.length === 0, errors }
}

// Export types
export type { BlockSchema, BlockSetting, SettingType }
