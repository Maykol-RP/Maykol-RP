const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const parseEnv = (content) => {
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=["']?(.*?)["']?$/);
    if (match) {
      env[match[1]] = match[2];
    }
  });
  return env;
};

const env = parseEnv(envContent);

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function sync() {
  const dbPath = path.join(__dirname, 'data/db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  console.log('Fetching existing categories from Supabase...');
  const { data: existingCats, error: fetchErr } = await supabase.from('categories').select('*');
  
  if (fetchErr) {
    console.error('Error fetching categories:', fetchErr);
    return;
  }

  console.log('Syncing products to Supabase...');
  
  const productsToUpsert = db.products.map(p => {
    const cat = existingCats.find(c => c.name.toLowerCase() === p.category.toLowerCase());
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category_id: cat ? cat.id : null,
      purchase_price: p.costPrice || 0,
      sale_price: p.salePrice || 0,
      offer_price: p.offerPrice || 0,
      stock: p.stock || 0,
      min_stock: p.minStock || 0,
      status: p.status || 'ACTIVO',
      barcode: p.barcode || '',
      images: p.images || [],
      created_at: p.createdAt || new Date().toISOString()
    };
  });

  const { error } = await supabase
    .from('products')
    .upsert(productsToUpsert, { onConflict: 'id' });

  if (error) {
    console.error('Error syncing products:', error);
  } else {
    console.log(`Successfully synced ${productsToUpsert.length} products to Supabase.`);
  }

  console.log('Done!');
}

sync();
