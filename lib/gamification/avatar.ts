import { createClient } from '@/lib/supabase/server';
import { getCollectorLevel } from './level-logic';

export interface AvatarState {
  userId: string;
  name: string | null;
  level: number;
  evolutionStage: number;
  equippedItems: Record<string, any>;
  inventory: any[];
  xpInfo: any;
}

export async function getCollectorAvatar(userId: string, email: string): Promise<AvatarState> {
  const supabase = createClient();
  
  // 1. Get avatar data
  let { data: avatar, error: avatarError } = await supabase
    .from('collector_avatars')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!avatar) {
    // Initialize avatar if it doesn't exist
    const { data: newAvatar, error: createError } = await supabase
      .from('collector_avatars')
      .insert({ user_id: userId })
      .select()
      .single();
    
    avatar = newAvatar;

    // Give starter items to new users
    try {
      const { data: starterItems } = await supabase
        .from('avatar_items')
        .select('id')
        .in('name', ['Red Cap', 'Cool Shades']);
      
      if (starterItems && starterItems.length > 0) {
        const inventoryInserts = starterItems.map(item => ({
          user_id: userId,
          item_id: item.id
        }));
        await supabase.from('collector_avatar_inventory').insert(inventoryInserts);
      }
    } catch (starterError) {
      console.warn('[Avatar Lib] Could not give starter items:', starterError);
    }
  }

  // 2. Get inventory
  const { data: inventory } = await supabase
    .from('collector_avatar_inventory')
    .select('item_id, avatar_items(*)')
    .eq('user_id', userId);

  // 3. Get level and XP info (using email as identifier for credits)
  const xpInfo = await getCollectorLevel(email);

  // 4. Map equipped items with their actual asset data
  const equippedWithAssets: Record<string, any> = {};
  if (avatar?.equipped_items) {
    const itemIds = Object.values(avatar.equipped_items);
    if (itemIds.length > 0) {
      const { data: items } = await supabase
        .from('avatar_items')
        .select('*')
        .in('id', itemIds);
      
      if (items) {
        items.forEach(item => {
          equippedWithAssets[item.type] = item;
        });
      }
    }
  }

  // 5. Default base if none equipped
  if (!equippedWithAssets.base) {
    const { data: defaultBase } = await supabase
      .from('avatar_items')
      .select('*')
      .eq('type', 'base')
      .eq('name', 'Street Collector Classic')
      .maybeSingle();
    
    if (defaultBase) {
      equippedWithAssets.base = defaultBase;
    }
  }

  return {
    userId,
    name: avatar?.name || null,
    level: xpInfo.level,
    evolutionStage: xpInfo.evolutionStage,
    equippedItems: equippedWithAssets,
    inventory: inventory || [],
    xpInfo,
  };
}

