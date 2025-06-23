#!/bin/bash

# Dashboard Migration Script

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to replace artwork card components
replace_artwork_card() {
    local file="$1"
    
    # Check if file exists
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}File not found: $file${NC}"
        return
    fi

    # Import ArtworkCard
    if ! grep -q "import { ArtworkCard } from" "$file"; then
        sed -i '' '1i\
import { ArtworkCard } from "@/components/ui/artwork-card"
' "$file"
    fi

    # Replace existing card components
    sed -i '' '
    s/VinylArtworkCard/ArtworkCard/g;
    s/item={item}/artwork={{
      id: item.line_item_id || item.id,
      name: item.name,
      imageUrl: item.img_url || item.imageUrl,
      vendorName: item.vendor_name || item.vendorName,
      editionNumber: item.edition_number,
      editionTotal: item.edition_total,
      price: item.price,
      certificateUrl: item.certificate_url,
      nfcClaimedAt: item.nfc_claimed_at,
      nfcTagId: item.nfc_tag_id
    }}/g
    ' "$file"

    echo -e "${GREEN}Updated $file${NC}"
}

# Find and migrate dashboard files
echo "Starting Dashboard Migration..."

# Customer Dashboards
replace_artwork_card "app/dashboard/[customerId]/page.tsx"
replace_artwork_card "app/customer/dashboard/page.tsx"

# Vendor Dashboards
replace_artwork_card "app/vendor/dashboard/page.tsx"
replace_artwork_card "app/vendor/dashboard/products/page.tsx"

# Additional dashboards (add more as needed)
replace_artwork_card "app/admin/dashboard/page.tsx"

echo "Dashboard Migration Complete!" 