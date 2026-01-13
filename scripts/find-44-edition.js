const dotenv = require('dotenv');
dotenv.config();

async function find44() {
  const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
  const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;
  
  // Fetch products
  const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/products.json?limit=50`, {
    headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN }
  });
  const { products } = await response.json();
  
  for (const p of products) {
    const mResponse = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/products/${p.id}/metafields.json`, {
      headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN }
    });
    const { metafields } = await mResponse.json();
    
    const editionMeta = metafields.find(m => 
      (m.key === 'edition_size' || m.key === 'limited_edition_size' || m.key === 'edition_volume') && 
      (m.value == 44 || m.value == '44')
    );
    
    if (editionMeta) {
      console.log(`FOUND 44: Product ${p.title} (${p.id}) has ${editionMeta.namespace}.${editionMeta.key} = ${editionMeta.value}`);
    } else {
      // Log what it DOES have
      const anyEdition = metafields.find(m => m.key === 'edition_size' || m.key === 'limited_edition_size' || m.key === 'edition_volume');
      if (anyEdition) {
        console.log(`Product ${p.title} (${p.id}) has ${anyEdition.namespace}.${anyEdition.key} = ${anyEdition.value}`);
      }
    }
  }
}
find44();
