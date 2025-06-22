import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

describe('Order Line Items Migration', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient();
  });

  describe('Data Consistency', () => {
    it('should have equal record count between order_line_items and order_line_items_v2', async () => {
      const { data: v1Data, error: v1Error } = await supabase
        .from('order_line_items')
        .select('*');
      
      const { data: v2Data, error: v2Error } = await supabase
        .from('order_line_items_v2')
        .select('*');
      
      expect(v1Error).toBeNull();
      expect(v2Error).toBeNull();
      expect(v1Data?.length).toBe(v2Data?.length);
    });

    it('should maintain data integrity for all records', async () => {
      const { data: v1Data, error: v1Error } = await supabase
        .from('order_line_items')
        .select('*');
      
      const { data: v2Data, error: v2Error } = await supabase
        .from('order_line_items_v2')
        .select('*');
      
      expect(v1Error).toBeNull();
      expect(v2Error).toBeNull();

      v1Data?.forEach(v1Record => {
        const matchingV2Record = v2Data?.find(v2Record => 
          v2Record.id === v1Record.id &&
          v2Record.order_id === v1Record.order_id &&
          v2Record.line_item_id === v1Record.line_item_id
        );

        expect(matchingV2Record).toBeTruthy();
      });
    });
  });

  describe('View Functionality', () => {
    it('should allow inserting records through the view', async () => {
      const testRecord = {
        order_id: `test-order-${Date.now()}`,
        line_item_id: `test-line-item-${Date.now()}`,
        product_id: 'test-product',
        name: 'Test Product',
        price: 9.99,
        quantity: 1
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('order_line_items')
        .insert(testRecord)
        .select();
      
      expect(insertError).toBeNull();
      expect(insertedData).toBeTruthy();
      expect(insertedData?.[0]).toMatchObject(testRecord);

      // Verify record exists in v2 table
      const { data: v2Data, error: v2Error } = await supabase
        .from('order_line_items_v2')
        .select('*')
        .eq('line_item_id', testRecord.line_item_id);
      
      expect(v2Error).toBeNull();
      expect(v2Data?.length).toBe(1);
      expect(v2Data?.[0]).toMatchObject(testRecord);

      // Clean up test record
      await supabase
        .from('order_line_items')
        .delete()
        .eq('line_item_id', testRecord.line_item_id);
    });

    it('should allow updating records through the view', async () => {
      // First, insert a test record
      const testRecord = {
        order_id: `test-order-${Date.now()}`,
        line_item_id: `test-line-item-${Date.now()}`,
        product_id: 'test-product',
        name: 'Test Product',
        price: 9.99,
        quantity: 1
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('order_line_items')
        .insert(testRecord)
        .select();
      
      expect(insertError).toBeNull();
      expect(insertedData).toBeTruthy();

      // Update the record
      const updateData = {
        quantity: 2,
        price: 19.98
      };

      const { data: updatedData, error: updateError } = await supabase
        .from('order_line_items')
        .update(updateData)
        .eq('line_item_id', testRecord.line_item_id)
        .select();
      
      expect(updateError).toBeNull();
      expect(updatedData).toBeTruthy();
      expect(updatedData?.[0]).toMatchObject({
        ...testRecord,
        ...updateData
      });

      // Verify update in v2 table
      const { data: v2Data, error: v2Error } = await supabase
        .from('order_line_items_v2')
        .select('*')
        .eq('line_item_id', testRecord.line_item_id);
      
      expect(v2Error).toBeNull();
      expect(v2Data?.[0]).toMatchObject({
        ...testRecord,
        ...updateData
      });

      // Clean up test record
      await supabase
        .from('order_line_items')
        .delete()
        .eq('line_item_id', testRecord.line_item_id);
    });

    it('should allow deleting records through the view', async () => {
      // First, insert a test record
      const testRecord = {
        order_id: `test-order-${Date.now()}`,
        line_item_id: `test-line-item-${Date.now()}`,
        product_id: 'test-product',
        name: 'Test Product',
        price: 9.99,
        quantity: 1
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('order_line_items')
        .insert(testRecord)
        .select();
      
      expect(insertError).toBeNull();
      expect(insertedData).toBeTruthy();

      // Delete the record
      const { error: deleteError } = await supabase
        .from('order_line_items')
        .delete()
        .eq('line_item_id', testRecord.line_item_id);
      
      expect(deleteError).toBeNull();

      // Verify deletion in v2 table
      const { data: v2Data, error: v2Error } = await supabase
        .from('order_line_items_v2')
        .select('*')
        .eq('line_item_id', testRecord.line_item_id);
      
      expect(v2Error).toBeNull();
      expect(v2Data?.length).toBe(0);
    });
  });
}); 