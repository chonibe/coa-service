#!/bin/bash

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Log file
LOG_FILE="${PROJECT_ROOT}/order_line_items_migration.log"

# Function to log messages
log_message() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Start logging
log_message "${YELLOW}🔄 Order Line Items Migration Reference Update${NC}"
log_message "Started at: $(date)"

# Find and replace function
update_references() {
    local search_pattern="$1"
    local replace_pattern="$2"
    local file_types="${3:-.ts,.tsx,.js,.jsx,.sql}"

    log_message "\n${YELLOW}Updating references:${NC}"
    log_message "Search Pattern: ${search_pattern}"
    log_message "Replace Pattern: ${replace_pattern}"

    # Use find with multiple file extensions
    IFS=',' read -ra EXTENSIONS <<< "$file_types"
    FIND_PATTERN=""
    for ext in "${EXTENSIONS[@]}"; do
        FIND_PATTERN="${FIND_PATTERN} -name *${ext}"
    done

    find "$PROJECT_ROOT" -type f \( $FIND_PATTERN \) -not -path "*/node_modules/*" -not -path "*/.next/*" -print0 | while IFS= read -r -d '' file; do
        if grep -q "$search_pattern" "$file"; then
            sed -i '' "s/$search_pattern/$replace_pattern/g" "$file"
            log_message "${GREEN}✅ Updated:${NC} $file"
        fi
    done
}

# Update references
update_references "from 'order_line_items'" "from 'order_line_items_v2'"
update_references "\\.from('order_line_items')" ".from('order_line_items_v2'"
update_references "table: 'order_line_items'" "table: 'order_line_items_v2'"

# Verify changes
log_message "\n${YELLOW}Verifying changes:${NC}"
grep -r "order_line_items_v2" "$PROJECT_ROOT" --include=\*.{ts,tsx,js,jsx,sql} | tee -a "$LOG_FILE"

# Final log
log_message "\n${GREEN}🎉 Migration Reference Update Complete${NC}"
log_message "Full log available at: $LOG_FILE"
log_message "Timestamp: $(date)"

exit 0 