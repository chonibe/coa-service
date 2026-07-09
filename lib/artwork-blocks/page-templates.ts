/**
 * Page Templates - Pre-built layouts for artwork pages
 * 
 * Artists can select a template when starting a new page
 * to quickly set up a common structure.
 */

export interface PageTemplateBlock {
  type: string           // Block type name (matches database)
  title?: string         // Pre-filled title
  placeholder?: string   // Help text shown in editor
}

export interface PageTemplate {
  id: string
  name: string
  description: string
  icon: string           // Emoji for visual distinction
  blocks: PageTemplateBlock[]
}

/**
 * Available page templates
 */
export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple layout with the essentials",
    icon: "✨",
    blocks: [
      { 
        type: "Artwork Image Block", 
        placeholder: "Add your main artwork image" 
      },
      { 
        type: "Artwork Text Block", 
        title: "About This Work", 
        placeholder: "Write a short note about the artwork..." 
      }
    ]
  },
  {
    id: "story",
    name: "Story",
    description: "Build a page around the artwork and its context",
    icon: "📖",
    blocks: [
      { 
        type: "Artwork Image Block", 
        placeholder: "Hero image of your artwork" 
      },
      { 
        type: "Artwork Artist Note Block", 
        title: "Artist's Note",
        placeholder: "A note for collectors" 
      },
      { 
        type: "Artwork Process Gallery Block", 
        title: "The Process",
        placeholder: "Share behind-the-scenes photos" 
      },
      { 
        type: "Artwork Text Block", 
        title: "Final Thoughts", 
        placeholder: "Add anything else you want collectors to know..." 
      }
    ]
  },
  {
    id: "gallery",
    name: "Gallery",
    description: "Showcase multiple images and details",
    icon: "🖼️",
    blocks: [
      { 
        type: "Artwork Image Block", 
        placeholder: "Main artwork image" 
      },
      { 
        type: "Artwork Text Block", 
        title: "About", 
        placeholder: "Describe your artwork..." 
      },
      { 
        type: "Artwork Inspiration Block", 
        title: "Inspiration",
        placeholder: "What influenced this piece?" 
      },
      { 
        type: "Artwork Image Block", 
        placeholder: "Detail or alternate view" 
      },
      { 
        type: "Artwork Soundtrack Block", 
        title: "Soundtrack",
        placeholder: "Music connected to this work" 
      }
    ]
  }
]

/**
 * Get a template by ID
 */
export function getPageTemplate(id: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find(t => t.id === id)
}
