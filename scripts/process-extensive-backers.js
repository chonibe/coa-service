const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const rawData = `
#1174	ziv_gilinski@yahoo.com
#1174	ziv_gilinski@yahoo.com
#1174	ziv_gilinski@yahoo.com
#1174	ziv_gilinski@yahoo.com
#1174	ziv_gilinski@yahoo.com
#1174	ziv_gilinski@yahoo.com
#1174	ziv_gilinski@yahoo.com
#1218	yokenno@gmail.com
#1179	yanai36@gmail.com
#1179	yanai36@gmail.com
#1173	vincent.quak@gmail.com
#1173	vincent.quak@gmail.com
#1173	vincent.quak@gmail.com
#1156	tutuu10@gmail.com
#1156	tutuu10@gmail.com
#1156	tutuu10@gmail.com
#1156	tutuu10@gmail.com
#1156	tutuu10@gmail.com
#1224	thestreetlamp.com@jessica.email
#1224	thestreetlamp.com@jessica.email
#1224	thestreetlamp.com@jessica.email
#1224	thestreetlamp.com@jessica.email
#1170	theclawdesign@gmail.com
#1212	stathikougianos@gmail.com
#1212	stathikougianos@gmail.com
#1212	stathikougianos@gmail.com
#1212	stathikougianos@gmail.com
#1212	stathikougianos@gmail.com
#1212	stathikougianos@gmail.com
#1136	sraugust@gmail.com
#1136	sraugust@gmail.com
#1194	sigaltraining@gmail.com
#1194	sigaltraining@gmail.com
#1146	sarah.eskin@gmail.com
#1167	saphir.bendakon@bluewin.ch
#1135	robert.hiekel@icloud.com
#1185	robert.hiekel@icloud.com
#1172	robert.hiekel@icloud.com
#1185	robert.hiekel@icloud.com
#1142	pearlclaspco@gmail.com
#1142	pearlclaspco@gmail.com
#1193	ouazana.alain@free.fr
#1193	ouazana.alain@free.fr
#1193	ouazana.alain@free.fr
#1193	ouazana.alain@free.fr
#1186	opalichan@yahoo.com
#1221	opalichan@yahoo.com
#1221	opalichan@yahoo.com
#1186	opalichan@yahoo.com
#1221	opalichan@yahoo.com
#1221	opalichan@yahoo.com
#1221	opalichan@yahoo.com
#1211	omgphood@gmail.com
#1211	omgphood@gmail.com
#1213	ngmeiwai88@gmail.com
#1213	ngmeiwai88@gmail.com
#1199	nakache69003@gmail.com
#1199	nakache69003@gmail.com
#1199	nakache69003@gmail.com
#1199	nakache69003@gmail.com
#1216	moreno12@live.nl
#1216	moreno12@live.nl
#1216	moreno12@live.nl
#1216	moreno12@live.nl
#1168	mol.shmul@gmail.com
#1168	mol.shmul@gmail.com
#1201	michelle.ouazana@free.fr
#1201	michelle.ouazana@free.fr
#1201	michelle.ouazana@free.fr
#1201	michelle.ouazana@free.fr
#1209	michaelstein191@gmail.com
#1209	michaelstein191@gmail.com
#1205	meydan@anina.com
#1205	meydan@anina.com
#1205	meydan@anina.com
#1137	megangslivka@gmail.com
#1202	mcfly003@hotmail.com
#1202	mcfly003@hotmail.com
#1202	mcfly003@hotmail.com
#1202	mcfly003@hotmail.com
#1196	Mayan702@hotmail.com
#1197	Mayan702@hotmail.com
#1196	Mayan702@hotmail.com
#1197	Mayan702@hotmail.com
#1103	lir191983@gmail.com
#1103	lir191983@gmail.com
#1191	lilengel24@gmail.com
#1191	lilengel24@gmail.com
#1166	liiksa4@gmail.com
#1166	liiksa4@gmail.com
#1104	lernertal95@gmail.com
#1104	lernertal95@gmail.com
#1223	labsovictory@gmail.com
#1222	labsovictory@gmail.com
#1169	labsovictory@gmail.com
#1223	labsovictory@gmail.com
#1222	labsovictory@gmail.com
#1169	labsovictory@gmail.com
#1169	labsovictory@gmail.com
#1223	labsovictory@gmail.com
#1222	labsovictory@gmail.com
#1181	kswick@me.com
#1181	kswick@me.com
#1181	kswick@me.com
#1181	kswick@me.com
#1181	kswick@me.com
#1198	kalmus@me.com
#1198	kalmus@me.com
#1198	kalmus@me.com
#1198	kalmus@me.com
#1220	julieelise@gmail.com
#1220	julieelise@gmail.com
#1217	jeroenvanparreren@icloud.com
#1217	jeroenvanparreren@icloud.com
#1217	jeroenvanparreren@icloud.com
#1217	jeroenvanparreren@icloud.com
#1217	jeroenvanparreren@icloud.com
#1217	jeroenvanparreren@icloud.com
#1217	jeroenvanparreren@icloud.com
#1217	jeroenvanparreren@icloud.com
#1217	jeroenvanparreren@icloud.com
#1195	itzcovich.rony@gmail.com
#1195	itzcovich.rony@gmail.com
#1195	itzcovich.rony@gmail.com
#1195	itzcovich.rony@gmail.com
#1195	itzcovich.rony@gmail.com
#1189	ittaia@gmail.com
#1189	ittaia@gmail.com
#1189	ittaia@gmail.com
#1189	ittaia@gmail.com
#1124	info@nemowelter.com
#1124	info@nemowelter.com
#1210	i.sungurov@outlook.com
#1210	i.sungurov@outlook.com
#1210	i.sungurov@outlook.com
#1210	i.sungurov@outlook.com
#1210	i.sungurov@outlook.com
#1116	hypstudio@gmail.com
#1160	hypstudio@gmail.com
#1147	hypstudio@gmail.com
#1176	hypstudio@gmail.com
#1176	hypstudio@gmail.com
#1147	hypstudio@gmail.com
#1160	hypstudio@gmail.com
#1160	hypstudio@gmail.com
#1160	hypstudio@gmail.com
#1116	hypstudio@gmail.com
#1176	hypstudio@gmail.com
#1176	hypstudio@gmail.com
#1207	hi@notimefortv.biz
#1207	hi@notimefortv.biz
#1203	heimy4prez@gmail.com
#1203	heimy4prez@gmail.com
#1214	hadarts287@gmail.com
#1214	hadarts287@gmail.com
#1200	gregusgrig@gmail.com
#1200	gregusgrig@gmail.com
#1200	gregusgrig@gmail.com
#1200	gregusgrig@gmail.com
#1187	gilboabeigel@gmail.com
#1187	gilboabeigel@gmail.com
#1106	gavrielmiler@gmail.com
#1106	gavrielmiler@gmail.com
#1177	flynn167@outlook.com
#1113	elana.levitas@gmail.com
#1113	elana.levitas@gmail.com
#1153	dinamo71@yahoo.com
#1153	dinamo71@yahoo.com
#1153	dinamo71@yahoo.com
#1153	dinamo71@yahoo.com
#1153	dinamo71@yahoo.com
#1153	dinamo71@yahoo.com
#1153	dinamo71@yahoo.com
#1153	dinamo71@yahoo.com
#1153	dinamo71@yahoo.com
#1163	diegolaras@gmail.com
#1163	diegolaras@gmail.com
#1163	diegolaras@gmail.com
#1192	david.glejser@gmail.com
#1192	david.glejser@gmail.com
#1148	cornelia.hanika@nerkatan.com
#1145	cornelia.hanika@nerkatan.com
#1132	constantine.goldrin@gmail.com
#1132	constantine.goldrin@gmail.com
#1132	constantine.goldrin@gmail.com
#1132	constantine.goldrin@gmail.com
#1149	cflynn167@gmail.com
#1208	cedric_dawance@hotmail.com
#1188	cedric_dawance@hotmail.com
#1219	cedric_dawance@hotmail.com
#1208	cedric_dawance@hotmail.com
#1188	cedric_dawance@hotmail.com
#1188	cedric_dawance@hotmail.com
#1188	cedric_dawance@hotmail.com
#1133	carrn91@gmail.com
#1133	carrn91@gmail.com
#1204	camille.claire@hotmail.fr
#1215	calexander2104@gmail.com
#1215	calexander2104@gmail.com
#1215	calexander2104@gmail.com
#1215	calexander2104@gmail.com
#1215	calexander2104@gmail.com
#1215	calexander2104@gmail.com
#1215	calexander2104@gmail.com
#1215	calexander2104@gmail.com
#1190	brentatkins@gmail.com
#1190	brentatkins@gmail.com
#1190	brentatkins@gmail.com
#1190	brentatkins@gmail.com
#1182	bittmannroma@gmail.com
#1182	bittmannroma@gmail.com
#1206	birgit-alvarez@gmx.de
#1102	baumyitzy@gmail.com
#1184	basbots@email.com
#1184	basbots@email.com
#1184	basbots@email.com
#1184	basbots@email.com
#1184	basbots@email.com
#1184	basbots@email.com
#1184	basbots@email.com
#1108	avraham.kalvo@gmail.com
#1108	avraham.kalvo@gmail.com
#1151	aldomusa2@gmail.com
#1151	aldomusa2@gmail.com
`;

async function processExtensiveBackerList() {
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
  const uniqueEmails = new Set();

  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;

    const orderName = parts[0].trim();
    const email = parts[1].trim().toLowerCase();

    pairs.push({ orderName, email });
    uniqueEmails.add(email);
  }

  console.log(`Parsed ${pairs.length} pairs with ${uniqueEmails.size} unique emails.`);

  // 1. Upsert into kickstarter_backers_list
  for (const email of Array.from(uniqueEmails)) {
    const { error } = await supabase
      .from('kickstarter_backers_list')
      .upsert({ email }, { onConflict: 'email' });
    
    if (error) console.error(`Error upserting backer ${email}:`, error.message);
  }
  console.log('Finished updating kickstarter_backers_list.');

  // 2. Link orders to emails
  for (const pair of pairs) {
    const { data: orderData } = await supabase
      .from('orders')
      .select('id, customer_email')
      .eq('order_name', pair.orderName)
      .maybeSingle();

    if (orderData) {
      if (orderData.customer_email?.toLowerCase() !== pair.email) {
        console.log(`Linking ${pair.orderName} to ${pair.email} (was ${orderData.customer_email})`);
        const { error } = await supabase
          .from('orders')
          .update({ customer_email: pair.email })
          .eq('id', orderData.id);
        
        if (error) console.error(`  Error linking ${pair.orderName}:`, error.message);
      }
    }
  }
  console.log('Finished linking orders.');

  // 3. Mark existing collector profiles
  for (const email of Array.from(uniqueEmails)) {
    const { error } = await supabase
      .from('collector_profiles')
      .update({ is_kickstarter_backer: true })
      .ilike('email', email);
    
    if (error) console.error(`Error updating profile for ${email}:`, error.message);
  }
  console.log('Finished updating collector profiles.');

  console.log('Enrichment complete!');
}

processExtensiveBackerList().catch(console.error);

