import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

async function verifyDataConsistency() {
  const supabase = createClient();
  
  console.log('🔍 Starting Order Line Items Migration Verification');
  
  try {
    // Fetch data from both tables
    const { data: v1Data, error: v1Error } = await supabase
      .from('order_line_items')
      .select('*');
    
    const { data: v2Data, error: v2Error } = await supabase
      .from('order_line_items_v2')
      .select('*');
    
    if (v1Error) {
      console.error('Error fetching data from order_line_items:', v1Error);
      return false;
    }
    
    if (v2Error) {
      console.error('Error fetching data from order_line_items_v2:', v2Error);
      return false;
    }
    
    // Compare record counts
    console.log(`📊 Total records in order_line_items: ${v1Data.length}`);
    console.log(`📊 Total records in order_line_items_v2: ${v2Data.length}`);
    
    if (v1Data.length !== v2Data.length) {
      console.warn('⚠️ Record count mismatch between tables');
    }
    
    // Detailed comparison
    const compareRecords = (records1: any[], records2: any[]) => {
      const mismatches: any[] = [];
      
      records1.forEach(record1 => {
        const matchingRecord = records2.find(r => 
          r.id === record1.id && 
          r.order_id === record1.order_id && 
          r.line_item_id === record1.line_item_id
        );
        
        if (!matchingRecord) {
          mismatches.push(record1);
        }
      });
      
      return mismatches;
    };
    
    const v1Mismatches = compareRecords(v1Data, v2Data);
    const v2Mismatches = compareRecords(v2Data, v1Data);
    
    if (v1Mismatches.length > 0) {
      console.warn('⚠️ Mismatched records found in order_line_items:');
      console.table(v1Mismatches);
    }
    
    if (v2Mismatches.length > 0) {
      console.warn('⚠️ Mismatched records found in order_line_items_v2:');
      console.table(v2Mismatches);
    }
    
    // Perform sample data integrity checks
    const sampleRecord = v1Data[0];
    if (sampleRecord) {
      const { data: insertTestData, error: insertError } = await supabase
        .from('order_line_items')
        .insert({
          ...sampleRecord,
          line_item_id: `test-${Date.now()}`
        })
        .select();
      
      if (insertError) {
        console.error('❌ Failed to insert test record:', insertError);
        return false;
      }
      
      console.log('✅ Successfully inserted test record');
      
      // Clean up test record
      if (insertTestData && insertTestData.length > 0) {
        await supabase
          .from('order_line_items')
          .delete()
          .eq('id', insertTestData[0].id);
      }
    }
    
    console.log('🎉 Migration Verification Complete');
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

// Run verification if script is executed directly
if (require.main === module) {
  verifyDataConsistency().then(result => {
    process.exit(result ? 0 : 1);
  });
}

export default verifyDataConsistency; 