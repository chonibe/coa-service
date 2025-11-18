#!/bin/bash
# Script to find which Vercel project has dashboard.thestreetlamp.com assigned

echo "Searching for dashboard.thestreetlamp.com across all projects..."
echo ""

# Get list of all projects
PROJECTS=$(vercel project ls --scope chonibes-projects 2>&1 | grep -E "^\s+[a-z]" | awk '{print $1}')

FOUND=false

for project in $PROJECTS; do
  echo "Checking project: $project"
  
  # Try to get project details
  DOMAIN_CHECK=$(vercel project inspect "$project" --scope chonibes-projects 2>&1 | grep -i "dashboard.thestreetlamp")
  
  if [ ! -z "$DOMAIN_CHECK" ]; then
    echo "✓ Found in project: $project"
    echo "  $DOMAIN_CHECK"
    FOUND=true
  fi
done

if [ "$FOUND" = false ]; then
  echo ""
  echo "Domain not found in project settings. It may be:"
  echo "1. Assigned as an alias to a specific deployment"
  echo "2. Managed in a different Vercel team/account"
  echo "3. Configured via DNS only (not in Vercel)"
  echo ""
  echo "Next steps:"
  echo "1. Go to https://vercel.com/chonibes-projects/street-collector/settings/domains"
  echo "2. Check if dashboard.thestreetlamp.com is listed"
  echo "3. If not, add it via 'Add Domain'"
  echo "4. If it's in another project, remove it from there first"
fi

