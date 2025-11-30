/**
 * Trigger bulk label creation for all tracking links
 * This will create labels for each owner and assign orders automatically
 */

const OWNER_MAPPING: Record<string, string> = {
  'Simply1': 'Eliran',
  'Simply2': 'Eliran',
  'Simply3': 'Eliran',
  'Simply4': 'Eliran',
  'Simply5': 'Nadav',
  'Simply6': 'Nadav',
  'Simply7': 'Nadav',
  'Simply8': 'Oded',
  'Simply9': 'Oded',
  'Simply10': 'Nadav',
  'Simply11': 'Nadav',
  'Simply12': 'Nadav',
  'Simply13': 'Nadav',
  'Simply14': 'Nadav',
  'Simply15': 'Nadav',
  'Simply16': 'Nadav',
  'Simply17': 'Nadav',
  'Simply18': 'Nadav',
  'Simply19': 'Nadav',
  'Simply20': 'Nadav',
  'Simply21': 'Dan',
  'Simply22': 'Dan',
  'Simply23': 'Oded',
  'Simply24': 'Oded',
  'Simply25': 'Oded',
  'Simply26': 'Oded',
  'Simply27': 'Oded',
  'Simply28': 'shiloah',
  'Simply29': 'shiloah',
  'Simply30': 'shiloah',
  'Simply31': 'Sarah',
  'Simply32': 'Sarah',
  'Simply33': 'Sarah',
  'Simply34': 'Sarah',
  'Simply35': 'Sarah',
  'Simply36': 'Sarah',
  'Simply37': 'Sarah',
  'Simply38': 'Sarah',
  'Simply39': 'Sarah',
  'Simply40': 'Sarah',
  'Simply41': 'Sarah',
  'Simply42': 'Sarah',
  'Simply43': 'Sarah',
  'Simply44': 'Tamar',
  'Simply45': 'Tamar',
  'Simply46': 'Tamar',
  'Simply47': 'Tamar',
  'Simply48': 'Nadav',
  'Simply49': 'Eliran',
  'Simply50': 'shiloah',
  'Simply51': 'Eliran',
  'Simply52': 'Oded',
  'Simply53': 'Oded',
  'Simply54': 'Oded',
  'Simply55': 'Oded',
  'Simply56': 'Nadav',
  'Simply57': 'Nadav',
}

async function triggerBulkLabels() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const token = process.argv[2]

  if (!token) {
    console.error('Error: Tracking token is required')
    console.error('Usage: npx tsx scripts/trigger-bulk-labels.ts <token>')
    console.error('\nOr set environment variable:')
    console.error('  TRACKING_TOKEN=your-token npx tsx scripts/trigger-bulk-labels.ts')
    process.exit(1)
  }

  try {
    console.log(`Triggering bulk label creation for token: ${token}...`)
    
    const response = await fetch(`${baseUrl}/api/admin/bulk-create-labels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': process.env.ADMIN_SESSION_COOKIE || '', // You'll need to set this
      },
      body: JSON.stringify({ token }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create labels')
    }

    console.log('\n✓ Labels created successfully!')
    console.log(`\nSummary:`)
    console.log(`- Created ${data.summary.labelsCreated} labels`)
    console.log(`- Assigned ${data.summary.ordersAssigned} orders to labels`)
    console.log(`\nOrders per label:`)
    Object.entries(data.summary.labelCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([label, count]) => {
        console.log(`  ${label}: ${count} orders`)
      })
  } catch (error: any) {
    console.error('\n✗ Error:', error.message)
    process.exit(1)
  }
}

triggerBulkLabels()

