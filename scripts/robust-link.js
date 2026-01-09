const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const rawData = `
#1174	ziv_gilinski@yahoo.com
#1218	yokenno@gmail.com
#1179	yanai36@gmail.com
#1173	vincent.quak@gmail.com
#1156	tutuu10@gmail.com
#1224	thestreetlamp.com@jessica.email
#1170	theclawdesign@gmail.com
#1212	stathikougianos@gmail.com
#1136	sraugust@gmail.com
#1194	sigaltraining@gmail.com
#1146	sarah.eskin@gmail.com
#1167	saphir.bendakon@bluewin.ch
#1135	robert.hiekel@icloud.com
#1185	robert.hiekel@icloud.com
#1172	robert.hiekel@icloud.com
#1142	pearlclaspco@gmail.com
#1193	ouazana.alain@free.fr
#1186	opalichan@yahoo.com
#1221	opalichan@yahoo.com
#1211	omgphood@gmail.com
#1213	ngmeiwai88@gmail.com
#1199	nakache69003@gmail.com
#1216	moreno12@live.nl
#1168	mol.shmul@gmail.com
#1201	michelle.ouazana@free.fr
#1209	michaelstein191@gmail.com
#1205	meydan@anina.com
#1137	megangslivka@gmail.com
#1202	mcfly003@hotmail.com
#1196	Mayan702@hotmail.com
#1197	Mayan702@hotmail.com
#1103	lir191983@gmail.com
#1191	lilengel24@gmail.com
#1166	liiksa4@gmail.com
#1104	lernertal95@gmail.com
#1223	labsovictory@gmail.com
#1222	labsovictory@gmail.com
#1169	labsovictory@gmail.com
#1181	kswick@me.com
#1198	kalmus@me.com
#1220	julieelise@gmail.com
#1217	jeroenvanparreren@icloud.com
#1195	itzcovich.rony@gmail.com
#1189	ittaia@gmail.com
#1124	info@nemowelter.com
#1210	i.sungurov@outlook.com
#1116	hypstudio@gmail.com
#1160	hypstudio@gmail.com
#1147	hypstudio@gmail.com
#1176	hypstudio@gmail.com
#1207	hi@notimefortv.biz
#1203	heimy4prez@gmail.com
#1214	hadarts287@gmail.com
#1200	gregusgrig@gmail.com
#1187	gilboabeigel@gmail.com
#1106	gavrielmiler@gmail.com
#1177	flynn167@outlook.com
#1113	elana.levitas@gmail.com
#1153	dinamo71@yahoo.com
#1163	diegolaras@gmail.com
#1192	david.glejser@gmail.com
#1148	cornelia.hanika@nerkatan.com
#1145	cornelia.hanika@nerkatan.com
#1132	constantine.goldrin@gmail.com
#1149	cflynn167@gmail.com
#1208	cedric_dawance@hotmail.com
#1188	cedric_dawance@hotmail.com
#1219	cedric_dawance@hotmail.com
#1133	carrn91@gmail.com
#1204	camille.claire@hotmail.fr
#1215	calexander2104@gmail.com
#1190	brentatkins@gmail.com
#1182	bittmannroma@gmail.com
#1206	birgit-alvarez@gmx.de
#1102	baumyitzy@gmail.com
#1184	basbots@email.com
#1108	avraham.kalvo@gmail.com
#1151	aldomusa2@gmail.com
#1258	oransh10@gmail.com
`;

async function robustLink() {
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
  const pairs = [];

  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    pairs.push({ orderName: parts[0].trim(), email: parts[1].trim().toLowerCase() });
  }

  console.log(`Processing ${pairs.length} pairs...`);

  for (const pair of pairs) {
    const { data: order } = await supabase
      .from('orders')
      .select('id, customer_email')
      .eq('order_name', pair.orderName)
      .maybeSingle();

    if (order) {
      const currentEmail = (order.customer_email || '').toLowerCase().trim();
      if (currentEmail !== pair.email) {
        console.log(`Linking ${pair.orderName}: "${currentEmail}" -> "${pair.email}"`);
        const { error } = await supabase
          .from('orders')
          .update({ customer_email: pair.email })
          .eq('id', order.id);
        
        if (error) console.error(`  Error linking ${pair.orderName}:`, error.message);
      }
    }
  }

  console.log('Robust linking complete!');
}

robustLink().catch(console.error);

