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

async function verifyAndLinkOrders() {
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

  const lines = rawData.trim().split('\n');
  const discrepancies = [];

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 2) continue;

    let orderPart = parts[0].trim();
    let email = parts[1].trim();

    if (orderPart.includes('@')) {
      email = orderPart;
      orderPart = '';
    }

    const emailLower = email.toLowerCase();
    const orderNumbers = orderPart ? orderPart.split(/&|,/).map(n => n.trim()) : [];

    for (const orderName of orderNumbers) {
      const { data: orderData, error } = await supabase
        .from('orders')
        .select('id, customer_email')
        .eq('order_name', orderName)
        .maybeSingle();

      if (orderData) {
        if (orderData.customer_email?.toLowerCase() !== emailLower) {
          console.log(`Linking discrepancy found for ${orderName}: expected ${emailLower}, found ${orderData.customer_email}`);
          
          const { error: updateError } = await supabase
            .from('orders')
            .update({ customer_email: emailLower })
            .eq('id', orderData.id);

          if (updateError) {
            console.error(`  Error updating email for ${orderName}:`, updateError.message);
          } else {
            console.log(`  Updated order ${orderName} customer_email to ${emailLower}`);
          }
        }
      } else if (orderName) {
        // console.log(`Order ${orderName} not found in database.`);
      }
    }
  }

  console.log('Verification and linking complete!');
}

verifyAndLinkOrders().catch(console.error);

