const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse the raw data provided by the user
const rawData = `
#1256	paulette.nakache@gmail.com	£199.00
#1255	meravu@gmail.com	£149.00
#1252 & #1257	matt@dreisin.com	£199.00
#1251	mr.matan.rosen@gmail.com	£149.00
#1250	adivabeigel@gmail.com	£149.00
#1246	elonbendor236@gmail.com	£149.00
#1241	andreas.stuetz@gmail.com	£219.00
#1224	kickstarter@jessica.email	£284.00
#1217	jaymelis@gmail.com	£443.00
#1216	moreno12@live.nl	£199.00
#1215	calexander2104@gmail.com	£239.00
#1214	hadarts287@gmail.com	£149.00
#1213	ngmeiwai88@gmail.com	£169.00
#1207	hi@notimefortv.biz	£149.00
#1205	meydan@anina.com	£219.00
#1203	heimy4prez@gmail.com	£149.00
#1202	mcfly003@hotmail.com	£149.00
#1201	michelle.ouazana@free.fr	£199.00
#1200	gregusgrig@gmail.com	£197.00
#1199	nakache69003@gmail.com	£199.00
#1198	kalmus@me.com	£298.00
#1197	mayan702@hotmail.com	£149.00
#1195	itzcovich.rony@gmail.com	£174.00
#1194	sigaltraining@gmail.com	£149.00
#1193	ouazana.alain@free.fr	£199.00
#1192	david.glejser@gmail.com	£149.00
#1191	lilengel24@gmail.com	£174.00
#1190	brentatkins@gmail.com	£173.00
#1189	Ittaia@gmail.com	£179.00
#1188	cedric_dawance@hotmail.com	£197.00
#1187	gilboabeigel@gmail.com	£149.00
#1186	opalichan@yahoo.com	£194.00
#1184	basbots@email.com	£269.00
#1182	bittmannroma@gmail.com	£149.00
#1181	kswick@me.com	£149.00
#1179	yanai36@gmail.com	£149.00
#1176	hypstudio@gmail.com	£692.00
#1173	vincent.quak@gmail.com	£173.00
#1170	theclawdesign@gmail.com	£149.00
#1169	linda@seasonofvictory.com	£173.00
#1168	mol.shmul@gmail.com	£174.00
#1167	saphir.bendakon@bluewin.ch	£149.00
#1166	liiksa4@gmail.com	£149.00
#1163	diegolaras@gmail.com	£283.00
#1156	tutuu10@gmail.com	£149.00
#1153	dinastella7108@gmail.com	£169.00
#1149	flynn167@outlook.com	£149.00
#1148	cornelia.hanika@gmx.de	£149.00
#1142	pearlclaspco@gmail.com	£169.00
#1136	Sraugust@gmail.com	£189.00
#1135	robert.hiekel@icloud.com	£203.00
#1133	carrn91@gmail.com	£149.00
#1132	constantine.goldrin@gmail.com	£149.00
#1124	info@nemowelter.com	£149.00
#1108	avraham.kalvo@gmail.com	£149.00
#1106	gavrielmiler@gmail.com	£149.00
#1104	lernertal95@gmail.com	£169.00
#1103	lir191983@gmail.com	£169.00
	Matthew@MuchPresents.com	£169.00
	saragazith@gmail.com	£100.00
	oransh10@gmail.com	£149.00
	ginzburg@gmail.com	
	jonsteiner04@icloud.com	£149.00
	rick@hedof.com	£169.00
	Pantico.drum@gmail.com	£12.00
	kobihener@gmail.com	£12.00
	emery@demographicdesign.com.au	£12.00
`;

async function enrichKickstarterData() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  
  if (!urlMatch || !keyMatch) {
    console.error('Could not find Supabase URL or Service Role Key in .env');
    return;
  }
  
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  // 1. Fetch current exchange rate
  const { data: rateData, error: rateError } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('from_currency', 'GBP')
    .eq('to_currency', 'USD')
    .single();

  const exchangeRate = rateData?.rate || 1.27;
  console.log(`Using GBP -> USD exchange rate: ${exchangeRate}`);

  // 2. Process the raw data
  const lines = rawData.trim().split('\n');
  const backers = [];

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 2) continue;

    let orderPart = parts[0].trim();
    let email = parts[1].trim();
    let gbpPriceStr = parts[2] ? parts[2].trim() : '';

    // Handle missing order number case where email is first
    if (orderPart.includes('@')) {
      email = orderPart;
      orderPart = '';
      gbpPriceStr = parts[1] ? parts[1].trim() : '';
    }

    const gbpPrice = parseFloat(gbpPriceStr.replace('£', '').replace(',', '')) || 0;
    const usdPrice = gbpPrice * exchangeRate;

    // Split order numbers if multiple exist (e.g. #1252 & #1257)
    const orderNumbers = orderPart ? orderPart.split(/&|,/).map(n => n.trim()) : [''];

    for (const orderNum of orderNumbers) {
      backers.push({
        order_name: orderNum,
        email: email.toLowerCase(),
        gbp_price: gbpPrice,
        usd_price: usdPrice
      });
    }
  }

  console.log(`Parsed ${backers.length} backer records.`);

  // 3. Update collector_profiles and orders
  for (const backer of backers) {
    console.log(`\nProcessing: ${backer.email} (Order: ${backer.order_name})`);

    // Update collector profile
    const { data: profileUpdate, error: profileError } = await supabase
      .from('collector_profiles')
      .update({ is_kickstarter_backer: true })
      .ilike('email', backer.email);

    if (profileError) {
      console.error(`  Error updating profile for ${backer.email}:`, profileError.message);
    } else {
      console.log(`  Updated collector profile for ${backer.email}`);
    }

    // Update orders if order_name exists
    if (backer.order_name) {
      const { data: orderUpdate, error: orderError } = await supabase
        .from('orders')
        .update({
          kickstarter_backing_amount_gbp: backer.gbp_price,
          kickstarter_backing_amount_usd: backer.usd_price
        })
        .eq('order_name', backer.order_name);

      if (orderError) {
        console.error(`  Error updating order ${backer.order_name}:`, orderError.message);
      } else {
        console.log(`  Updated order ${backer.order_name} with $${backer.usd_price.toFixed(2)}`);
      }
    }
  }

  console.log('\nEnrichment complete!');
}

enrichKickstarterData().catch(console.error);

