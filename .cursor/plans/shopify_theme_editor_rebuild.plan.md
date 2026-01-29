---
name: Shopify Theme Editor Rebuild
overview: Complete rebuild of the artwork page builder to match Shopify's theme editor UX - with page layout tree navigation on the left sidebar, sections that contain blocks, click-to-edit iframe preview, and schema-driven settings panels.
todos:
  - id: spike-iframe-postmessage
    content: "Spike: Build minimal iframe with postMessage click-to-select to validate approach"
    status: pending
  - id: design-data-model
    content: Design the new section/block data model matching Shopify schema structure
    status: pending
  - id: create-section-schemas
    content: Create section schemas with blocks, settings, and presets definitions
    status: pending
  - id: create-db-migration
    content: Create database migration for artwork_page_sections and artwork_page_blocks tables
    status: pending
  - id: create-editor-context
    content: Build EditorContext for global editor state management
    status: pending
  - id: integrate-sections-api
    content: Create/update API endpoints for section CRUD operations
    status: pending
  - id: build-layout-tree
    content: Build the left sidebar page layout tree with sections and nested blocks
    status: pending
  - id: build-settings-panel
    content: Build the right settings panel that renders based on schema input types
    status: pending
  - id: build-iframe-preview
    content: Build the iframe preview with click-to-select and highlight on hover
    status: pending
  - id: wire-up-editor
    content: Wire up all components, add auto-save and undo/redo
    status: pending
  - id: migrate-existing-blocks
    content: Migrate existing block types to new section/block schema system
    status: pending
  - id: update-collector-renderer
    content: Update collector page to render new section/block structure (support both formats)
    status: pending
  - id: feature-flag-rollout
    content: Implement feature flag for gradual rollout with fallback to old editor
    status: pending
isProject: true
---

# Shopify Theme Editor Rebuild

## Executive Summary

This plan rebuilds the artwork page builder to match Shopify's theme editor UX. The new editor will feature a three-panel layout with a page structure tree, live iframe preview with click-to-edit, and schema-driven settings panels.

**Estimated Complexity**: High  
**Key Dependencies**: Existing media library, Supabase database, collector artwork page  
**Rollout Strategy**: Feature flag with parallel old/new editor support

---

## Risks & Mitigations


| Risk                                      | Impact | Likelihood | Mitigation                                                                                      |
| ----------------------------------------- | ------ | ---------- | ----------------------------------------------------------------------------------------------- |
| Migration corrupts existing artwork pages | High   | Medium     | Run migration on staging first; keep `product_benefits` table as backup; create rollback script |
| iframe preview performance issues         | Medium | Medium     | Debounce settings updates (300ms); virtual scroll for 20+ sections; lazy-load images            |
| Artists confused by new UI                | Medium | Low        | Add onboarding tooltip tour; keep old editor accessible via feature flag for 30 days            |
| postMessage communication unreliable      | Medium | Low        | Spike in Phase 0 to validate; add retry logic and connection health checks                      |
| Concurrent editing conflicts              | Low    | Low        | Optimistic locking with `updated_at` timestamp; show "someone else is editing" warning          |
| Rich text editor bundle size              | Low    | Medium     | Lazy-load TipTap/editor; code-split settings panel inputs                                       |


---

## Dependency Graph

```
spike-iframe-postmessage
         │
         ▼
  design-data-model
         │
    ┌────┴────┐
    ▼         ▼
create-section-schemas    create-db-migration
    │                           │
    ▼                           │
create-editor-context           │
    │                           │
    └─────────┬─────────────────┘
              ▼
    integrate-sections-api
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
build-layout  build-    build-iframe
   -tree     settings    -preview
              -panel
    │         │         │
    └─────────┼─────────┘
              ▼
       wire-up-editor
              │
              ▼
    migrate-existing-blocks
              │
              ▼
    update-collector-renderer
              │
              ▼
    feature-flag-rollout
```

---

## Goal

Replace the current artwork page builder with a Shopify-style theme editor that provides:

1. **Left Sidebar** - Page layout tree showing sections with nested blocks
2. **Center Preview** - Iframe with click-to-edit and hover highlights
3. **Right Panel** - Schema-driven settings for selected section/block

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                    Preview    Publish          │
├──────────────┬──────────────────────────────┬──────────────────────┤
│              │                              │                      │
│  Page Tree   │      Iframe Preview          │   Settings Panel     │
│              │      (Mobile Frame)          │                      │
│  ▼ Sections  │                              │   Section: Hero      │
│    ├─ Hero   │   ┌────────────────────┐     │   ─────────────────  │
│    │  └─ Img │   │                    │     │   Image              │
│    ├─ Story  │   │   [Click to edit]  │     │   [Choose image]     │
│    │  ├─ Txt │   │                    │     │                      │
│    │  └─ Img │   │                    │     │   Overlay opacity    │
│    └─ Gallery│   │                    │     │   ──────●────── 60%  │
│       ├─ Img │   │                    │     │                      │
│       ├─ Img │   └────────────────────┘     │   Height             │
│       └─ Img │                              │   ○ Small            │
│              │                              │   ● Medium           │
│  + Add sect. │                              │   ○ Large            │
│              │                              │                      │
└──────────────┴──────────────────────────────┴──────────────────────┘
```

---

## Phase 0: Technical Spike (De-risking)

**Goal**: Validate the iframe + postMessage approach before committing to full implementation.

### 0.1 Spike Scope

Build a minimal proof-of-concept with:

1. A simple iframe loading a mock preview page
2. postMessage communication for click-to-select
3. Hover highlight overlay rendering
4. Settings update propagation to iframe

### 0.2 Spike Implementation

```tsx
// spike/PreviewSpike.tsx - Minimal POC
const PreviewSpike = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'ELEMENT_CLICKED') {
        setSelectedId(e.data.sectionId);
      }
      if (e.data.type === 'ELEMENT_HOVERED') {
        setHoverRect(e.data.rect);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="relative">
      <iframe ref={iframeRef} src="/spike/preview" />
      {hoverRect && <div className="highlight-overlay" style={hoverRect} />}
    </div>
  );
};
```

### 0.3 Spike Success Criteria

- Click on element in iframe selects it in parent
- Hover shows highlight overlay within 16ms (60fps)
- Settings change propagates to iframe and re-renders within 100ms
- Works in Chrome, Firefox, Safari
- No console errors or security warnings

### 0.4 Spike Verification

```bash
# Run spike locally and test:
1. Open /spike/editor in browser
2. Click on mock sections - verify selection syncs
3. Hover over elements - verify highlight appears smoothly
4. Change a setting - verify preview updates
5. Open DevTools Network - verify no excessive re-renders
```

**If spike fails**: Evaluate alternative approaches (inline editing, portal-based preview, or canvas rendering).

---

## Phase 1: Data Model & Schema System

### 1.1 Section Schema Structure (following Shopify exactly)

```typescript
// lib/theme-editor/section-schema.ts

interface SectionSchema {
  name: string                    // "Hero Banner"
  tag?: string                    // "section" | "div" | "article"
  class?: string                  // CSS class for the section wrapper
  max_blocks?: number             // Limit blocks per section
  settings: SettingDefinition[]   // Section-level settings
  blocks: BlockDefinition[]       // Available block types for this section
  presets: SectionPreset[]        // Pre-configured section templates
  default?: {                     // Default configuration
    settings: Record<string, any>
    blocks: BlockInstance[]
  }
}

interface BlockDefinition {
  type: string                    // "image" | "text" | "@theme" | "@app"
  name: string                    // "Image"
  settings: SettingDefinition[]   // Block-level settings
  limit?: number                  // Max instances of this block type
}

interface BlockInstance {
  type: string
  id: string                      // UUID
  settings: Record<string, any>
}

interface SectionPreset {
  name: string
  category?: string               // For grouping in "Add section" picker
  settings: Record<string, any>
  blocks: BlockInstance[]
}
```

### 1.2 Setting Types (matching Shopify input types)

```typescript
// Basic input types
type BasicSettingType = 
  | "checkbox"      // Boolean toggle
  | "number"        // Numeric input
  | "radio"         // Radio button group
  | "range"         // Slider with min/max/step
  | "select"        // Dropdown or segmented control
  | "text"          // Single line text
  | "textarea"      // Multi-line text

// Specialized input types
type SpecializedSettingType =
  | "article"       // Article picker
  | "blog"          // Blog picker  
  | "collection"    // Collection picker
  | "color"         // Color picker
  | "color_background"  // Gradient/solid background picker
  | "color_scheme"  // Theme color scheme picker
  | "font_picker"   // Font selector
  | "html"          // HTML/rich text editor
  | "image_picker"  // Image upload/select
  | "inline_richtext"  // Inline rich text
  | "link_list"     // Navigation menu picker
  | "liquid"        // Liquid code editor
  | "page"          // Page picker
  | "product"       // Product picker
  | "product_list"  // Multiple products picker
  | "richtext"      // Rich text editor
  | "text_alignment" // Alignment picker
  | "url"           // URL input
  | "video"         // Video upload
  | "video_url"     // YouTube/Vimeo URL

// Sidebar (non-input) types
type SidebarSettingType =
  | "header"        // Section header
  | "paragraph"     // Help text

interface SettingDefinition {
  type: BasicSettingType | SpecializedSettingType | SidebarSettingType
  id?: string       // Required for input types
  label?: string    // Display label
  default?: any     // Default value
  info?: string     // Help text
  placeholder?: string
  // Type-specific attributes
  options?: { value: string; label: string }[]  // For select/radio
  min?: number      // For range/number
  max?: number      // For range/number
  step?: number     // For range
  unit?: string     // For range (e.g., "px")
}
```

### 1.3 Artwork Page Sections

Define sections specific to artwork pages:

```typescript
// lib/theme-editor/artwork-sections.ts

export const ARTWORK_SECTIONS: SectionSchema[] = [
  {
    name: "Hero Image",
    tag: "section",
    class: "artwork-hero",
    settings: [
      { type: "header", content: "Image" },
      { type: "image_picker", id: "image", label: "Artwork Image" },
      { type: "select", id: "height", label: "Section Height", 
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
          { value: "full", label: "Full Screen" }
        ],
        default: "large"
      },
      { type: "header", content: "Overlay" },
      { type: "checkbox", id: "show_overlay", label: "Show gradient overlay", default: true },
      { type: "range", id: "overlay_opacity", label: "Overlay opacity", 
        min: 0, max: 100, step: 10, unit: "%", default: 40 }
    ],
    blocks: [],
    presets: [
      { name: "Hero Image", settings: { height: "large" } }
    ]
  },
  
  {
    name: "Rich Text",
    tag: "section",
    class: "artwork-richtext",
    settings: [
      { type: "header", content: "Content" },
      { type: "text", id: "heading", label: "Heading" },
      { type: "richtext", id: "content", label: "Content" },
      { type: "header", content: "Layout" },
      { type: "select", id: "width", label: "Content Width",
        options: [
          { value: "narrow", label: "Narrow" },
          { value: "medium", label: "Medium" },
          { value: "wide", label: "Wide" }
        ],
        default: "medium"
      },
      { type: "text_alignment", id: "alignment", label: "Text Alignment", default: "left" }
    ],
    blocks: [],
    presets: [
      { name: "About the Work", settings: { heading: "About This Work" } },
      { name: "Artist Statement", settings: { heading: "Artist Statement" } }
    ]
  },

  {
    name: "Image Gallery",
    tag: "section", 
    class: "artwork-gallery",
    max_blocks: 12,
    settings: [
      { type: "text", id: "heading", label: "Heading" },
      { type: "select", id: "layout", label: "Layout",
        options: [
          { value: "grid", label: "Grid" },
          { value: "masonry", label: "Masonry" },
          { value: "carousel", label: "Carousel" }
        ],
        default: "grid"
      },
      { type: "range", id: "columns", label: "Columns",
        min: 2, max: 4, step: 1, default: 3 }
    ],
    blocks: [
      {
        type: "image",
        name: "Image",
        settings: [
          { type: "image_picker", id: "image", label: "Image" },
          { type: "text", id: "caption", label: "Caption" }
        ]
      }
    ],
    presets: [
      { 
        name: "Process Gallery",
        settings: { heading: "The Process", layout: "carousel" },
        blocks: []
      },
      {
        name: "Inspiration Board", 
        settings: { heading: "Inspiration", layout: "masonry" },
        blocks: []
      }
    ]
  },

  {
    name: "Video",
    tag: "section",
    class: "artwork-video",
    settings: [
      { type: "header", content: "Video" },
      { type: "video_url", id: "video_url", label: "Video URL",
        info: "Supports YouTube and Vimeo" },
      { type: "image_picker", id: "cover_image", label: "Cover Image" },
      { type: "header", content: "Layout" },
      { type: "select", id: "aspect_ratio", label: "Aspect Ratio",
        options: [
          { value: "16:9", label: "16:9 (Widescreen)" },
          { value: "4:3", label: "4:3 (Standard)" },
          { value: "1:1", label: "1:1 (Square)" },
          { value: "9:16", label: "9:16 (Vertical)" }
        ],
        default: "16:9"
      }
    ],
    blocks: [],
    presets: [
      { name: "Video", settings: {} }
    ]
  },

  {
    name: "Audio Player",
    tag: "section",
    class: "artwork-audio",
    settings: [
      { type: "header", content: "Audio" },
      { type: "url", id: "audio_url", label: "Audio File URL" },
      { type: "text", id: "title", label: "Track Title" },
      { type: "header", content: "Spotify" },
      { type: "url", id: "spotify_url", label: "Spotify URL",
        info: "Paste a Spotify track, album, or playlist link" },
      { type: "textarea", id: "note", label: "Why this track?",
        placeholder: "Share why this music connects to your artwork..." }
    ],
    blocks: [],
    presets: [
      { name: "Voice Note", settings: {} },
      { name: "Soundtrack", settings: {} }
    ]
  },

  {
    name: "Artist Note",
    tag: "section",
    class: "artwork-artist-note",
    settings: [
      { type: "richtext", id: "content", label: "Your Note",
        default: "<p>Dear Collector,</p><p>Thank you for your interest in my work...</p>" },
      { type: "checkbox", id: "show_signature", label: "Show Signature", default: true },
      { type: "image_picker", id: "signature_image", label: "Signature Image" }
    ],
    blocks: [],
    presets: [
      { name: "Artist Note", settings: {} }
    ]
  },

  {
    name: "Collapsible Content",
    tag: "section",
    class: "artwork-accordion",
    max_blocks: 10,
    settings: [
      { type: "text", id: "heading", label: "Heading" },
      { type: "select", id: "open_behavior", label: "Open Behavior",
        options: [
          { value: "one", label: "One at a time" },
          { value: "multiple", label: "Multiple open" }
        ],
        default: "one"
      }
    ],
    blocks: [
      {
        type: "collapsible_row",
        name: "Collapsible Row",
        settings: [
          { type: "text", id: "heading", label: "Heading" },
          { type: "richtext", id: "content", label: "Content" }
        ]
      }
    ],
    presets: [
      { 
        name: "FAQ",
        settings: { heading: "Frequently Asked Questions" },
        blocks: [
          { type: "collapsible_row", id: "1", settings: { heading: "What inspired this piece?" } },
          { type: "collapsible_row", id: "2", settings: { heading: "What materials were used?" } }
        ]
      }
    ]
  },

  {
    name: "Custom Content",
    tag: "section",
    class: "artwork-custom",
    max_blocks: 20,
    settings: [
      { type: "text", id: "heading", label: "Section Heading" },
      { type: "select", id: "layout", label: "Layout",
        options: [
          { value: "stacked", label: "Stacked (Full Width)" },
          { value: "two-column", label: "Two Columns" },
          { value: "sidebar-left", label: "Sidebar Left" },
          { value: "sidebar-right", label: "Sidebar Right" }
        ],
        default: "stacked"
      }
    ],
    blocks: [
      { type: "text", name: "Text", settings: [
        { type: "richtext", id: "content", label: "Content" }
      ]},
      { type: "image", name: "Image", settings: [
        { type: "image_picker", id: "image", label: "Image" },
        { type: "text", id: "caption", label: "Caption" }
      ]},
      { type: "video", name: "Video", settings: [
        { type: "video_url", id: "url", label: "Video URL" }
      ]},
      { type: "button", name: "Button", settings: [
        { type: "text", id: "label", label: "Button Label" },
        { type: "url", id: "link", label: "Link" }
      ]}
    ],
    presets: [
      { name: "Custom Content", settings: {} }
    ]
  }
]
```

### 1.4 Database Schema Changes

```sql
-- New table for page sections (replaces product_benefits for artwork pages)
CREATE TABLE artwork_page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,          -- "hero_image", "rich_text", etc.
  settings JSONB DEFAULT '{}',         -- Section settings values
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocks within sections
CREATE TABLE artwork_page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES artwork_page_sections(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,            -- "image", "text", "collapsible_row"
  settings JSONB DEFAULT '{}',         -- Block settings values
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_artwork_sections_product ON artwork_page_sections(product_id);
CREATE INDEX idx_artwork_sections_order ON artwork_page_sections(product_id, display_order);
CREATE INDEX idx_artwork_blocks_section ON artwork_page_blocks(section_id);
CREATE INDEX idx_artwork_blocks_order ON artwork_page_blocks(section_id, display_order);

-- RLS Policies
ALTER TABLE artwork_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_page_blocks ENABLE ROW LEVEL SECURITY;

-- Vendors can only access their own product sections
CREATE POLICY "Vendors can manage their product sections"
  ON artwork_page_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND p.vendor_id = auth.uid()::text
    )
  );

CREATE POLICY "Vendors can manage their product blocks"
  ON artwork_page_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM artwork_page_sections s
      JOIN products p ON p.id = s.product_id
      WHERE s.id = section_id AND p.vendor_id = auth.uid()::text
    )
  );
```

### 1.5 Phase 1 Verification Checklist

- Run migration on local Supabase - tables created without errors
- Insert a test section via SQL - verify JSONB settings stored correctly
- Insert a test block linked to section - verify foreign key works
- Attempt to insert block with invalid section_id - verify FK constraint fails
- Test RLS policy - vendor A cannot see vendor B's sections
- TypeScript interfaces compile without errors
- Section schemas validate against interface (no missing required fields)

---

## Phase 2: Theme Editor UI Components

### 2.1 Left Sidebar - Page Layout Tree

```
app/vendor/dashboard/theme-editor/
├── components/
│   ├── LayoutTree/
│   │   ├── LayoutTree.tsx           # Main tree component
│   │   ├── SectionItem.tsx          # Draggable section row
│   │   ├── BlockItem.tsx            # Draggable block row (nested)
│   │   ├── AddSectionButton.tsx     # Opens section picker
│   │   └── SectionPicker.tsx        # Modal with section presets
│   ├── SettingsPanel/
│   │   ├── SettingsPanel.tsx        # Main settings container
│   │   ├── SettingRenderer.tsx      # Routes to correct input component
│   │   └── inputs/
│   │       ├── CheckboxInput.tsx
│   │       ├── NumberInput.tsx
│   │       ├── RadioInput.tsx
│   │       ├── RangeInput.tsx
│   │       ├── SelectInput.tsx
│   │       ├── TextInput.tsx
│   │       ├── TextareaInput.tsx
│   │       ├── ImagePickerInput.tsx
│   │       ├── VideoUrlInput.tsx
│   │       ├── RichtextInput.tsx
│   │       ├── ColorInput.tsx
│   │       └── HeaderSetting.tsx
│   ├── Preview/
│   │   ├── PreviewFrame.tsx         # Iframe container with device frames
│   │   ├── PreviewOverlay.tsx       # Click-to-select overlay
│   │   └── DeviceSwitcher.tsx       # Mobile/Tablet/Desktop toggle
│   └── Toolbar/
│       ├── EditorToolbar.tsx        # Top toolbar
│       ├── UndoRedo.tsx
│       └── PublishButton.tsx
├── hooks/
│   ├── useEditorState.ts            # Editor state management
│   ├── usePreviewSync.ts            # Iframe communication
│   └── useDragDrop.ts               # DnD for sections/blocks
├── context/
│   └── EditorContext.tsx            # Global editor state
└── page.tsx                         # Main editor page
```

### 2.2 Layout Tree Component Structure

```tsx
// LayoutTree.tsx
<div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
  {/* Header */}
  <div className="p-4 border-b border-gray-800">
    <h2 className="font-semibold text-white">Page Layout</h2>
  </div>
  
  {/* Sections List */}
  <div className="flex-1 overflow-y-auto">
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext items={sections}>
        {sections.map((section) => (
          <SectionItem 
            key={section.id}
            section={section}
            isSelected={selectedId === section.id}
            onSelect={() => selectSection(section.id)}
          >
            {/* Nested Blocks */}
            {section.blocks.map((block) => (
              <BlockItem
                key={block.id}
                block={block}
                isSelected={selectedId === block.id}
                onSelect={() => selectBlock(section.id, block.id)}
              />
            ))}
            
            {/* Add Block Button (if section supports blocks) */}
            {sectionSchema.blocks.length > 0 && (
              <AddBlockButton onClick={() => openBlockPicker(section.id)} />
            )}
          </SectionItem>
        ))}
      </SortableContext>
    </DndContext>
  </div>
  
  {/* Add Section */}
  <div className="p-4 border-t border-gray-800">
    <Button onClick={openSectionPicker} className="w-full">
      <Plus className="h-4 w-4 mr-2" />
      Add Section
    </Button>
  </div>
</div>
```

### 2.3 Settings Panel Component

```tsx
// SettingsPanel.tsx
<div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col h-full overflow-hidden">
  {/* Header with back button */}
  <div className="p-4 border-b border-gray-800 flex items-center gap-3">
    {selectedBlock && (
      <Button variant="ghost" size="sm" onClick={deselectBlock}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
    )}
    <div>
      <h2 className="font-semibold text-white">{selectedSchema.name}</h2>
      <p className="text-xs text-gray-400">
        {selectedBlock ? 'Block settings' : 'Section settings'}
      </p>
    </div>
  </div>
  
  {/* Settings Form */}
  <div className="flex-1 overflow-y-auto p-4 space-y-6">
    {selectedSchema.settings.map((setting) => (
      <SettingRenderer
        key={setting.id || setting.content}
        setting={setting}
        value={values[setting.id]}
        onChange={(value) => updateSetting(setting.id, value)}
      />
    ))}
  </div>
  
  {/* Delete/Actions */}
  <div className="p-4 border-t border-gray-800">
    <Button 
      variant="destructive" 
      className="w-full"
      onClick={handleDelete}
    >
      Remove {selectedBlock ? 'Block' : 'Section'}
    </Button>
  </div>
</div>
```

### 2.4 Preview Iframe with Click-to-Edit

```tsx
// PreviewFrame.tsx
<div className="flex-1 flex items-center justify-center bg-gray-950 p-8">
  {/* Device Frame */}
  <div className={cn(
    "relative bg-white rounded-3xl shadow-2xl overflow-hidden",
    device === "mobile" && "w-[375px] h-[812px]",
    device === "tablet" && "w-[768px] h-[1024px]",
    device === "desktop" && "w-full max-w-4xl h-[900px]"
  )}>
    {/* Iframe */}
    <iframe
      ref={iframeRef}
      src={`/vendor/dashboard/theme-editor/${productId}/preview`}
      className="w-full h-full"
      onLoad={injectClickHandler}
    />
    
    {/* Hover Highlight Overlay */}
    {hoveredElement && (
      <div 
        className="absolute border-2 border-blue-500 pointer-events-none"
        style={hoveredElement.rect}
      />
    )}
    
    {/* Selected Element Highlight */}
    {selectedElement && (
      <div 
        className="absolute border-2 border-indigo-500 bg-indigo-500/10 pointer-events-none"
        style={selectedElement.rect}
      />
    )}
  </div>
</div>
```

### 2.5 postMessage Communication Protocol

```typescript
// lib/theme-editor/preview-messages.ts

// Messages from Editor → Preview
type EditorToPreviewMessage =
  | { type: 'SELECT_ELEMENT'; sectionId: string; blockId?: string }
  | { type: 'HIGHLIGHT_ELEMENT'; sectionId: string; blockId?: string }
  | { type: 'CLEAR_HIGHLIGHT' }
  | { type: 'UPDATE_SETTINGS'; sectionId: string; blockId?: string; settings: Record<string, unknown> }
  | { type: 'REORDER_SECTIONS'; sectionIds: string[] }
  | { type: 'ADD_SECTION'; section: SectionInstance; afterId?: string }
  | { type: 'REMOVE_SECTION'; sectionId: string }
  | { type: 'SCROLL_TO'; sectionId: string; blockId?: string }

// Messages from Preview → Editor
type PreviewToEditorMessage =
  | { type: 'ELEMENT_CLICKED'; sectionId: string; blockId?: string }
  | { type: 'ELEMENT_HOVERED'; sectionId: string; blockId?: string; rect: DOMRect }
  | { type: 'ELEMENT_UNHOVERED' }
  | { type: 'PREVIEW_READY' }
  | { type: 'PREVIEW_ERROR'; error: string }
  | { type: 'SCROLL_POSITION'; scrollY: number }

// Helper for type-safe postMessage
export const sendToPreview = (iframe: HTMLIFrameElement, message: EditorToPreviewMessage) => {
  iframe.contentWindow?.postMessage(message, window.location.origin);
};

export const sendToEditor = (message: PreviewToEditorMessage) => {
  window.parent.postMessage(message, window.location.origin);
};
```

### 2.6 Media Library Integration

The `image_picker` and `video` inputs must integrate with the existing `MediaLibraryModal`:

```tsx
// components/SettingsPanel/inputs/ImagePickerInput.tsx
import { MediaLibraryModal } from '@/components/vendor/MediaLibraryModal';

const ImagePickerInput = ({ setting, value, onChange }: InputProps) => {
  const [showLibrary, setShowLibrary] = useState(false);
  
  return (
    <>
      <div className="space-y-2">
        <Label>{setting.label}</Label>
        {value ? (
          <div className="relative group">
            <img src={value} className="w-full rounded-lg" />
            <Button 
              variant="secondary" 
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
              onClick={() => setShowLibrary(true)}
            >
              Change
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setShowLibrary(true)}>
            Choose image
          </Button>
        )}
        {setting.info && <p className="text-xs text-muted-foreground">{setting.info}</p>}
      </div>
      
      <MediaLibraryModal
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={(media) => {
          onChange(media.url);
          setShowLibrary(false);
        }}
        allowedTypes={['image']}
      />
    </>
  );
};
```

### 2.7 Phase 2 Verification Checklist

- LayoutTree renders sections from mock data
- Clicking section in tree fires selection event
- Drag-and-drop reorders sections visually
- SettingsPanel renders correct inputs based on schema type
- All 15+ input types render without errors
- ImagePickerInput opens MediaLibraryModal
- Preview iframe loads without CORS errors
- Click in iframe sends postMessage to parent
- Hover highlight appears within 16ms

---

## Phase 3: API Endpoints

### 3.1 Section/Block CRUD

```
GET    /api/vendor/theme-editor/[productId]
       → Returns page structure with all sections and blocks

POST   /api/vendor/theme-editor/[productId]/sections
       → Add a new section (with preset)

PUT    /api/vendor/theme-editor/[productId]/sections/[sectionId]
       → Update section settings

DELETE /api/vendor/theme-editor/[productId]/sections/[sectionId]
       → Delete a section

POST   /api/vendor/theme-editor/[productId]/sections/[sectionId]/blocks
       → Add a block to a section

PUT    /api/vendor/theme-editor/[productId]/sections/[sectionId]/blocks/[blockId]
       → Update block settings

DELETE /api/vendor/theme-editor/[productId]/sections/[sectionId]/blocks/[blockId]
       → Delete a block

PUT    /api/vendor/theme-editor/[productId]/reorder
       → Reorder sections and blocks
```

### 3.2 API Response Types

```typescript
// lib/theme-editor/api-types.ts

interface PageStructureResponse {
  productId: string;
  sections: SectionInstanceWithBlocks[];
  updatedAt: string;
}

interface SectionInstanceWithBlocks {
  id: string;
  type: string;
  settings: Record<string, unknown>;
  displayOrder: number;
  isVisible: boolean;
  blocks: BlockInstance[];
}

interface MutationResponse {
  success: boolean;
  data?: SectionInstanceWithBlocks | BlockInstance;
  error?: string;
}
```

### 3.3 Optimistic Locking

```typescript
// Include updated_at in PUT requests for conflict detection
interface UpdateSectionRequest {
  settings: Record<string, unknown>;
  expectedUpdatedAt: string; // ISO timestamp
}

// API returns 409 Conflict if timestamps don't match
if (existingSection.updated_at !== expectedUpdatedAt) {
  return NextResponse.json(
    { error: 'Section was modified by another user. Please refresh.' },
    { status: 409 }
  );
}
```

### 3.4 Phase 3 Verification Checklist

- GET `/api/vendor/theme-editor/[productId]` returns page structure
- POST section creates new section with correct display_order
- PUT section updates settings and bumps updated_at
- DELETE section removes section and cascade-deletes blocks
- POST block creates block within section
- PUT reorder updates all display_order values atomically
- 409 Conflict returned when optimistic lock fails
- RLS prevents cross-vendor access (test with two vendor accounts)

---

## Phase 4: Implementation Order

### Step 1: Foundation

1. Create database tables for sections/blocks
2. Create section schema definitions
3. Create setting type definitions
4. Build EditorContext for state management

### Step 2: Left Sidebar

1. Build LayoutTree component
2. Build SectionItem with expand/collapse
3. Build BlockItem (nested)
4. Add drag-and-drop reordering
5. Build SectionPicker modal
6. Build BlockPicker for adding blocks

### Step 3: Settings Panel

1. Build SettingsPanel container
2. Build SettingRenderer router
3. Build all input components:
  - Basic: checkbox, number, radio, range, select, text, textarea
    - Specialized: image_picker, video_url, richtext, color, url
    - Sidebar: header, paragraph

### Step 4: Preview

1. Build PreviewFrame with device switcher
2. Build preview route that renders sections
3. Add postMessage communication for selection sync
4. Add hover/click highlights

### Step 5: API & Integration

1. Create section/block API endpoints
2. Wire up editor to API
3. Add auto-save
4. Add undo/redo

### Step 6: Migration & Rollout

1. Create migration script for existing content
2. Update collector page renderer to support both old and new formats
3. Add feature flag for new editor
4. Test end-to-end
5. Monitor for 7 days before deprecating old editor

---

## Phase 5: Migration Strategy

### 5.1 Existing Data Mapping

Map current `product_benefits` / block structure to new sections:


| Current Block Type     | New Section Type                     | Notes                                  |
| ---------------------- | ------------------------------------ | -------------------------------------- |
| `hero`                 | `Hero Image`                         | Map `image_url` → `settings.image`     |
| `text`                 | `Rich Text`                          | Map `content` → `settings.content`     |
| `image_gallery`        | `Image Gallery`                      | Convert to section with image blocks   |
| `video`                | `Video`                              | Map `video_url` → `settings.video_url` |
| `audio` / `soundtrack` | `Audio Player`                       | Map to appropriate preset              |
| `artist_note`          | `Artist Note`                        | Direct mapping                         |
| `process_gallery`      | `Image Gallery` (Process preset)     | Convert images to blocks               |
| `inspiration_board`    | `Image Gallery` (Inspiration preset) | Convert images to blocks               |


### 5.2 Migration Script

```typescript
// scripts/migrate-artwork-pages-to-sections.ts

async function migrateProduct(productId: string) {
  // 1. Fetch existing blocks
  const { data: existingBlocks } = await supabase
    .from('product_benefits') // or current table
    .select('*')
    .eq('product_id', productId)
    .order('display_order');

  // 2. Transform to new format
  const sections = existingBlocks.map((block, index) => ({
    product_id: productId,
    section_type: mapBlockTypeToSectionType(block.type),
    settings: transformSettings(block),
    display_order: index,
    is_visible: true,
  }));

  // 3. Insert new sections (in transaction)
  const { error } = await supabase.rpc('migrate_product_to_sections', {
    p_product_id: productId,
    p_sections: sections,
  });

  if (error) {
    console.error(`Failed to migrate ${productId}:`, error);
    return false;
  }

  return true;
}
```

### 5.3 Dual-Format Collector Renderer

```tsx
// app/collector/artwork/[id]/page.tsx

// Support both old and new formats during transition
const renderContent = () => {
  if (artworkPage.sections && artworkPage.sections.length > 0) {
    // New section-based rendering
    return artworkPage.sections.map((section) => (
      <SectionRenderer key={section.id} section={section} />
    ));
  }
  
  // Legacy block-based rendering (fallback)
  return artworkPage.blocks?.map((block) => (
    <LegacyBlockRenderer key={block.id} block={block} />
  ));
};
```

### 5.4 Feature Flag Implementation

```typescript
// lib/feature-flags.ts

export const FEATURE_FLAGS = {
  NEW_THEME_EDITOR: 'new_theme_editor',
} as const;

// Check if vendor has access to new editor
export async function hasNewEditorAccess(vendorId: string): Promise<boolean> {
  // Phase 1: Internal testing (specific vendor IDs)
  // Phase 2: Opt-in beta
  // Phase 3: 50% rollout
  // Phase 4: 100% rollout
  
  const { data } = await supabase
    .from('vendor_feature_flags')
    .select('enabled')
    .eq('vendor_id', vendorId)
    .eq('flag', FEATURE_FLAGS.NEW_THEME_EDITOR)
    .single();
  
  return data?.enabled ?? false;
}
```

### 5.5 Rollback Plan

If critical issues are discovered post-migration:

1. **Immediate**: Disable feature flag (reverts all vendors to old editor)
2. **Data**: Keep `product_benefits` table for 90 days post-migration
3. **Rollback script**: `scripts/rollback-sections-to-blocks.ts`

### 5.6 Phase 5 Verification Checklist

- Migration script runs successfully on staging database
- All block types have defined mappings
- Migrated artwork pages render identically to before
- Feature flag correctly gates new editor access
- Old editor still works for vendors without flag
- Rollback script restores original data correctly
- No SEO regressions (test with Google Lighthouse)

---

## File Changes Summary


| Type      | Path                                                                           | Action |
| --------- | ------------------------------------------------------------------------------ | ------ |
| Schema    | `lib/theme-editor/section-schemas.ts`                                          | Create |
| Schema    | `lib/theme-editor/setting-types.ts`                                            | Create |
| Schema    | `lib/theme-editor/artwork-sections.ts`                                         | Create |
| DB        | `supabase/migrations/xxx_create_theme_editor_tables.sql`                       | Create |
| UI        | `app/vendor/dashboard/theme-editor/[productId]/page.tsx`                       | Create |
| UI        | `app/vendor/dashboard/theme-editor/[productId]/preview/page.tsx`               | Create |
| UI        | `app/vendor/dashboard/theme-editor/components/LayoutTree/*`                    | Create |
| UI        | `app/vendor/dashboard/theme-editor/components/SettingsPanel/*`                 | Create |
| UI        | `app/vendor/dashboard/theme-editor/components/Preview/*`                       | Create |
| UI        | `app/vendor/dashboard/theme-editor/hooks/*`                                    | Create |
| UI        | `app/vendor/dashboard/theme-editor/context/EditorContext.tsx`                  | Create |
| API       | `app/api/vendor/theme-editor/[productId]/route.ts`                             | Create |
| API       | `app/api/vendor/theme-editor/[productId]/sections/route.ts`                    | Create |
| API       | `app/api/vendor/theme-editor/[productId]/sections/[sectionId]/route.ts`        | Create |
| API       | `app/api/vendor/theme-editor/[productId]/sections/[sectionId]/blocks/route.ts` | Create |
| Collector | `app/collector/artwork/[id]/page.tsx`                                          | Update |


---

## Success Criteria

1. Artists see a familiar Shopify-like editor interface
2. Left sidebar shows page structure as expandable tree
3. Clicking section/block in tree OR in preview selects it
4. Right panel shows appropriate settings based on schema
5. All Shopify input types work (image picker, richtext, range, etc.)
6. Drag-and-drop reorders sections and blocks
7. Preview updates in real-time (<100ms latency)
8. Existing artwork pages are migrated to new system (100% success rate)
9. Collector page renders new section/block structure correctly
10. No regression in page load time (Lighthouse score ≥90)
11. Feature flag allows gradual rollout with instant rollback capability

---

## Edge Cases & Error Handling

### Performance Limits


| Scenario           | Limit  | Handling                                  |
| ------------------ | ------ | ----------------------------------------- |
| Sections per page  | 50 max | Show warning at 40, block at 50           |
| Blocks per section | 20 max | Defined per section schema (`max_blocks`) |
| Image upload size  | 10MB   | Client-side validation before upload      |
| Rich text content  | 50KB   | Truncate with warning in preview          |


### Error States

```tsx
// Editor error boundary
const EditorErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-8 text-center">
          <h2>Something went wrong</h2>
          <p>Your changes have been auto-saved. Try refreshing the page.</p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};
```

### Validation Errors

- **Invalid settings**: Show inline error under the input field
- **Missing required field**: Highlight field with red border, show in summary
- **API failure**: Toast notification with retry button
- **Optimistic lock conflict**: Modal with "Refresh" and "Overwrite" options

---

## Implementation Checklist

### Phase 0: Technical Spike

- 1. Create `app/spike/editor/page.tsx` with minimal iframe setup
- 1. Create `app/spike/preview/page.tsx` with mock sections
- 1. Implement postMessage click handler in preview
- 1. Implement hover detection with getBoundingClientRect
- 1. Test cross-browser (Chrome, Firefox, Safari)
- 1. Document findings and go/no-go decision

### Phase 1: Foundation

- 1. Create `lib/theme-editor/section-schema.ts` with core interfaces
- 1. Create `lib/theme-editor/setting-types.ts` with all input type definitions
- 1. Create `lib/theme-editor/artwork-sections.ts` with 8 section schemas
- 1. Create `supabase/migrations/xxx_create_theme_editor_tables.sql`
- 1. Run migration on local Supabase and verify
- 1. Create `lib/theme-editor/preview-messages.ts` with postMessage types
- 1. Create `app/vendor/dashboard/theme-editor/context/EditorContext.tsx`

### Phase 2: API Layer

- 1. Create `app/api/vendor/theme-editor/[productId]/route.ts` (GET page structure)
- 1. Create `app/api/vendor/theme-editor/[productId]/sections/route.ts` (POST)
- 1. Create `app/api/vendor/theme-editor/[productId]/sections/[sectionId]/route.ts` (PUT, DELETE)
- 1. Create `app/api/vendor/theme-editor/[productId]/sections/[sectionId]/blocks/route.ts`
- 1. Create `app/api/vendor/theme-editor/[productId]/reorder/route.ts`
- 1. Add optimistic locking logic to PUT endpoints
- 1. Write API integration tests

### Phase 3: UI - Layout Tree

- 1. Create `app/vendor/dashboard/theme-editor/[productId]/page.tsx` (main editor)
- 1. Create `LayoutTree/LayoutTree.tsx` component
- 1. Create `LayoutTree/SectionItem.tsx` with expand/collapse
- 1. Create `LayoutTree/BlockItem.tsx` (nested)
- 1. Add drag-and-drop with @dnd-kit
- 1. Create `LayoutTree/SectionPicker.tsx` modal
- 1. Create `LayoutTree/AddBlockButton.tsx`

### Phase 4: UI - Settings Panel

- 1. Create `SettingsPanel/SettingsPanel.tsx` container
- 1. Create `SettingsPanel/SettingRenderer.tsx` router
- 1. Create `inputs/CheckboxInput.tsx`
- 1. Create `inputs/NumberInput.tsx`
- 1. Create `inputs/RadioInput.tsx`
- 1. Create `inputs/RangeInput.tsx`
- 1. Create `inputs/SelectInput.tsx`
- 1. Create `inputs/TextInput.tsx`
- 1. Create `inputs/TextareaInput.tsx`
- 1. Create `inputs/ImagePickerInput.tsx` (integrate MediaLibraryModal)
- 1. Create `inputs/VideoUrlInput.tsx`
- 1. Create `inputs/RichtextInput.tsx` (TipTap or similar)
- 1. Create `inputs/ColorInput.tsx`
- 1. Create `inputs/UrlInput.tsx`
- 1. Create `inputs/HeaderSetting.tsx` (non-input)
- 1. Create `inputs/ParagraphSetting.tsx` (non-input)

### Phase 5: UI - Preview

- 1. Create `Preview/PreviewFrame.tsx` with device frames
- 1. Create `Preview/DeviceSwitcher.tsx`
- 1. Create `app/vendor/dashboard/theme-editor/[productId]/preview/page.tsx`
- 1. Implement postMessage listeners in preview
- 1. Add data-section-id and data-block-id attributes to rendered elements
- 1. Implement click-to-select in preview
- 1. Implement hover highlight overlay
- 1. Implement scroll-to-element functionality

### Phase 6: Integration

- 1. Wire LayoutTree selection to SettingsPanel
- 1. Wire SettingsPanel changes to API (debounced auto-save)
- 1. Wire API responses to Preview (postMessage updates)
- 1. Implement undo/redo with state history
- 1. Create `Toolbar/EditorToolbar.tsx`
- 1. Create `Toolbar/PublishButton.tsx`
- 1. Add loading states and optimistic updates
- 1. Add error handling and toast notifications

### Phase 7: Migration

- 1. Create `scripts/migrate-artwork-pages-to-sections.ts`
- 1. Create block-type-to-section-type mapping
- 1. Create settings transformation functions
- 1. Test migration on staging with 10 sample products
- 1. Create `scripts/rollback-sections-to-blocks.ts`
- 1. Update `app/collector/artwork/[id]/page.tsx` for dual-format support
- 1. Create `SectionRenderer.tsx` for new format
- 1. Keep `LegacyBlockRenderer.tsx` for fallback

### Phase 8: Rollout

- 1. Create `lib/feature-flags.ts`
- 1. Create `vendor_feature_flags` table
- 1. Gate new editor behind feature flag
- 1. Enable for internal testing (5 vendors)
- 1. Enable opt-in beta (banner in old editor)
- 1. Run migration for beta users
- 1. Monitor for 7 days
- 1. Enable 50% rollout
- 1. Enable 100% rollout
- 1. Deprecate old editor (keep accessible via URL for 30 days)
- 1. Remove old editor code and legacy tables

---

## Open Questions

1. **Rich text editor choice**: TipTap vs Lexical vs Slate? (Recommendation: TipTap for Shopify parity)
2. **Draft vs Published**: Should we support draft/published states like Shopify? (Recommendation: Phase 2 enhancement)
3. **Version history**: Should vendors be able to see/restore previous versions? (Recommendation: Phase 2 enhancement)
4. **Templates marketplace**: Allow vendors to share section templates? (Recommendation: Future feature)

