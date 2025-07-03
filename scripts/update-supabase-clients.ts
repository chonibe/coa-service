const fs = require('fs')
const path = require('path')
const glob = require('glob')

function updateSupabaseClientInitialization() {
  const files = glob.sync('app/**/*.ts', { ignore: 'node_modules/**' })

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8')
    
    // Check if the file uses createClient
    if (content.includes('createClient(')) {
      // Import utility functions
      if (!content.includes('getSupabaseUrl')) {
        content = `import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'\n${content}`
      }

      // Replace createClient calls
      content = content.replace(
        /createClient\(([^)]*)\)/g, 
        (match, args) => {
          // If it's a cookieStore or empty call, keep it as is
          if (args.trim().includes('cookieStore') || args.trim() === '') {
            return match
          }

          // Determine key type based on context
          const keyType = content.includes('service role') ? "'service'" : "'anon'"
          
          return `createClient(
            getSupabaseUrl(),
            getSupabaseKey(${keyType})
          )`
        }
      )

      fs.writeFileSync(file, content)
      console.log(`Updated Supabase client in ${file}`)
    }
  })
}

updateSupabaseClientInitialization() 