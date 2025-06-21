# Vendor Portal: Product Management Guide

## Product Bio and Story Management

### Overview
Vendors can add detailed information about their artwork, including a personal bio and artwork story, to enhance the customer experience.

### Status Tracking
- Bio and artwork story have status tracking
- Statuses: 
  - `incomplete`: No content added
  - `completed`: Content added successfully

### Artist Bio
#### Purpose
- Provide context about the artist's background
- Create a personal connection with collectors
- Showcase the artist's journey and inspiration

#### Adding an Artist Bio
1. Navigate to Vendor Dashboard
2. Go to Product Edit Page
3. Locate "Artist Bio" section
4. Write a compelling narrative (500 characters max)
5. Click "Save Changes"

#### Bio Guidelines
- Be authentic and personal
- Highlight artistic journey
- Mention key influences
- Keep it concise and engaging

### Artwork Story
#### Purpose
- Provide context for the specific artwork
- Share the inspiration behind the piece
- Create emotional connection with collectors

#### Adding an Artwork Story
1. Navigate to Product Edit Page
2. Find "Artwork Story" text area
3. Write detailed narrative (1000 characters max)
4. Click "Save Changes"

#### Story Guidelines
- Describe creative process
- Share inspiration
- Explain artistic techniques
- Include personal meaning
- Be descriptive but concise

### Media Management
- Upload up to 3 supporting images
- Recommended image sizes: 
  - Thumbnail: 300x300 px
  - Detail: 1200x1200 px
- Supported formats: JPEG, PNG, WebP

### Technical Implementation
- Stored in `vendors` and `order_line_items_v2` tables
- Columns: 
  - `bio`: TEXT
  - `bio_status`: TEXT (incomplete/completed)
  - `artwork_story`: TEXT
  - `artwork_story_status`: TEXT (incomplete/completed)

### Best Practices
- Use clear, engaging language
- Be authentic
- Proofread before publishing
- Update stories periodically

### Troubleshooting
- Story not displaying? Check:
  1. Character limit
  2. Save button clicked
  3. Status updated correctly

## Version
- Last Updated: $(date +"%Y-%m-%d")
- Version: 1.1.0 