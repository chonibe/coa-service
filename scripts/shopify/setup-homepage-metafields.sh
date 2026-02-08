#!/bin/bash

# Setup Homepage Metafields via Shopify CLI
# This script creates metafield definitions and the homepage settings page

echo "🚀 Setting up homepage metafields..."

# Check if Shopify CLI is installed
if ! command -v shopify &> /dev/null; then
    echo "❌ Shopify CLI is not installed"
    echo "Install it with: npm install -g @shopify/cli @shopify/theme"
    exit 1
fi

echo "✅ Shopify CLI found"

# Login to Shopify (if not already logged in)
echo "🔐 Checking Shopify authentication..."
shopify auth status || shopify auth login

# Create metafield definitions
echo ""
echo "📝 Creating metafield definitions for Pages..."

# Hero Video URL
shopify metafield create \
  --namespace "custom" \
  --key "hero_video_url" \
  --name "Hero Video URL" \
  --description "Main homepage hero video URL (MP4 or MOV from Shopify CDN)" \
  --type "single_line_text_field" \
  --owner-type "page" \
  --validations '{"min":null,"max":500}'

# Hero Video Poster
shopify metafield create \
  --namespace "custom" \
  --key "hero_video_poster" \
  --name "Hero Video Poster" \
  --description "Poster image shown before video loads" \
  --type "file_reference" \
  --owner-type "page"

# Hero Video Settings (JSON)
shopify metafield create \
  --namespace "custom" \
  --key "hero_video_settings" \
  --name "Hero Video Settings" \
  --description "Video playback settings (JSON: {autoplay, loop, muted})" \
  --type "json" \
  --owner-type "page"

# Hero Headline
shopify metafield create \
  --namespace "custom" \
  --key "hero_headline" \
  --name "Hero Headline" \
  --description "Main headline text displayed on hero video" \
  --type "single_line_text_field" \
  --owner-type "page" \
  --validations '{"min":null,"max":200}'

# Hero Subheadline
shopify metafield create \
  --namespace "custom" \
  --key "hero_subheadline" \
  --name "Hero Subheadline" \
  --description "Subheadline text below main headline" \
  --type "single_line_text_field" \
  --owner-type "page" \
  --validations '{"min":null,"max":200}'

# Hero CTA Text
shopify metafield create \
  --namespace "custom" \
  --key "hero_cta_text" \
  --name "Hero CTA Text" \
  --description "Call-to-action button text" \
  --type "single_line_text_field" \
  --owner-type "page" \
  --validations '{"min":null,"max":50}'

# Hero CTA URL
shopify metafield create \
  --namespace "custom" \
  --key "hero_cta_url" \
  --name "Hero CTA URL" \
  --description "Button link destination" \
  --type "url" \
  --owner-type "page"

# Hero Text Color
shopify metafield create \
  --namespace "custom" \
  --key "hero_text_color" \
  --name "Hero Text Color" \
  --description "Text color (hex code, e.g., #ffffff)" \
  --type "color" \
  --owner-type "page"

# Hero Overlay Color
shopify metafield create \
  --namespace "custom" \
  --key "hero_overlay_color" \
  --name "Hero Overlay Color" \
  --description "Overlay color (hex code, e.g., #000000)" \
  --type "color" \
  --owner-type "page"

# Hero Overlay Opacity
shopify metafield create \
  --namespace "custom" \
  --key "hero_overlay_opacity" \
  --name "Hero Overlay Opacity" \
  --description "Overlay opacity (0-100)" \
  --type "number_integer" \
  --owner-type "page" \
  --validations '{"min":0,"max":100}'

echo ""
echo "✅ Metafield definitions created!"
echo ""
echo "📄 Next step: Create the homepage-settings page"
echo "   Run: ./scripts/shopify/create-homepage-page.sh"
echo ""
echo "   Or manually in Shopify Admin:"
echo "   1. Go to Online Store > Pages"
echo "   2. Click 'Add page'"
echo "   3. Title: 'Homepage Settings'"
echo "   4. Handle: 'homepage-settings'"
echo "   5. Add content description"
echo "   6. Save"
echo ""
echo "🎉 Setup complete!"
