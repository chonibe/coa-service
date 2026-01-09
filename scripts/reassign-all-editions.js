const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnv() {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        console.error('No .env file found');
        process.exit(1);
    }
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*["']?(.*?)["']?\s*$/);
        if (match) process.env[match[1]] = match[2];
    });
}
loadEnv();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function reassignAll() {
    console.log('Re-triggering edition assignment for ALL products...');
    const { data: allActive, error } = await supabase.from('order_line_items_v2').select('product_id').eq('status', 'active');
    
    if (error) {
        console.error('Error fetching active items:', error);
        return;
    }

    const uniquePIds = [...new Set(allActive?.map(p => p.product_id).filter(Boolean) || [])];
    console.log(`Reassigning editions for ${uniquePIds.length} products...`);
    
    for (const pId of uniquePIds) {
        process.stdout.write(`\rProcessing ${pId}...`);
        await supabase.rpc('assign_edition_numbers', { p_product_id: pId });
    }
    console.log('\n✅ All editions reassigned.');
}

reassignAll();

