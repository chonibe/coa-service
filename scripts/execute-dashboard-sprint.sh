#!/bin/zsh

# Dashboard Sprint Execution Script

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${YELLOW}[SPRINT TASK]${NC} $1"
}

# Function to print success
print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to print error
print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Main execution
main() {
    # Step 1: Install Dependencies
    print_status "Installing Project Dependencies...\n"
    npm install --force
    if [ $? -ne 0 ]; then
        print_error "Dependency installation failed"
        exit 1
    fi
    print_success "Dependencies installed successfully"

    # Step 2: Build Project
    print_status "Building Project...\n"
    npm run build
    if [ $? -ne 0 ]; then
        print_error "Project build failed"
        exit 1
    fi
    print_success "Project built successfully"

    print_success "Dashboard Sprint Execution Completed!"
}

# Run the main function
main 