const fs = require('fs')
const path = require('path')

const sourceDir = path.join(__dirname, '../public/apps/coa-manager/customer')
const targetDir = path.join(__dirname, '../public/apps/coa-manager/customer')

// Create directories if they don't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

// Copy dashboard.js
fs.copyFileSync(
  path.join(sourceDir, 'dashboard.js'),
  path.join(targetDir, 'dashboard.js')
)

console.log('Dashboard app copied successfully!') 