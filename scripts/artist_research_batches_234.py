# Part of one-off artist JSON generator; imported by _generate_artist_research_batches.py
from __future__ import annotations

from typing import Any, Callable, Dict


def get_batches(A: Callable[..., Dict[str, Any]]) -> tuple[dict, dict, dict]:
    FILE2 = {
        "Agus Rucula": A(
            artist_name="Agus Rucula",
            ig="@agus.rucula",
            location="Italy (reported residence); Argentina (origin)",
            active_since="Murals since 2012 (Murales Buenos Aires interview, 2018)",
            hero_hook=(
                "Argentine urban artist Agus Rucula (@agus.rucula): Murales Buenos Aires (2018) cites murals since 2012; "
                "VenUS Urban Art lists festivals across the Americas and Europe."
            ),
            story=(
                "Interview-based profiles identify Agus Rucula as an Argentine urban artist and teacher who centers the human body, gesture, and community dialogue in large-scale work.\n\n"
                "Murales Buenos Aires (2018) notes she has painted murals since 2012 and discusses process links to dance and photography.\n\n"
                "Italian press (e.g., Giornale di Brescia) documents recent murals in Italy; VenUS Urban Art summarizes international festival participation.\n\n"
                "Author databases (Amauta) list design studies at UBA—verify current city and spelling of accented surname on official channels."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press=(
                "Murales Buenos Aires — 2018 — Interview (ES) — https://muralesbuenosaires.com.ar/2018/12/11/entrevista-a-agus-rucula/\n"
                "Giornale di Brescia — — Murals in Brescia — https://www.giornaledibrescia.it/cultura/arte/due-nuovi-murales-in-via-morosini-sono-di-agus-rucula-e-nsn997-k1zbhf7m"
            ),
            ig_posts="",
            sources=(
                "https://www.venusurbanart.com/agus-rucula\n"
                "https://muralesbuenosaires.com.ar/2018/12/11/entrevista-a-agus-rucula/\n"
                "https://www.instagram.com/agus.rucula/\n"
                "https://thestreetcollector.com/collections/agus-rucula"
            ),
            notes="Some directories use @agusrucula without dot; Street Collector CSV uses @agus.rucula.",
        ),
        "Max Diamond": A(
            artist_name="Max Diamond",
            ig="@maxdiamond52",
            location="",
            active_since="",
            hero_hook=(
                "Max Diamond (@maxdiamond52): illustrator sharing poster and fan-art work on Instagram; public posts include Severance "
                "for Apple TV—verify commercial credits separately."
            ),
            story=(
                "Instagram posts indexed in search show Max Diamond publishing illustrated posters, including work referencing the Apple TV series Severance.\n\n"
                "Linktree aggregates social profiles; treat follower counts and self-descriptions as self-reported.\n\n"
                "No single authoritative biography URL was identified in the search pass; prefer future interviews for education and location.\n\n"
                "Confirm licensing before using entertainment IP-derived fan art in brand marketing."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            ig_posts=(
                "https://www.instagram.com/maxdiamond52/p/CjlIXJvLKQm/\n"
                "https://www.instagram.com/maxdiamond52/p/DGBDprORA-O/"
            ),
            sources=(
                "https://linktr.ee/MaxDiamond\n"
                "https://www.instagram.com/maxdiamond52/\n"
                "https://thestreetcollector.com/collections/max-diamond"
            ),
            notes="",
        ),
        "Ezra Baderman": A(
            artist_name="Ezra Baderman",
            ig="@ezrabaderman",
            location="Lisbon, Portugal",
            active_since="",
            hero_hook=(
                "British-Israeli artist Ezra Baderman (@ezrabaderman): ezrabaderman.com states Paris birth, London upbringing, Lisbon home; "
                "Bezalel training and mixed-media practice."
            ),
            story=(
                "ezrabaderman.com/about states he is British-Israeli, Paris-born and London-raised, now living in Lisbon, with studies at John Cass Foundation and Bezalel.\n\n"
                "The same site describes collage, painting, UV installations, and a Tel Aviv street-poster salvage series with peace-oriented messaging.\n\n"
                "Saatchi Art hosts a selling profile under his name—use for medium lists, not for uncredited quotes.\n\n"
                "Verify Hebrew/English marketing claims with the artist before publication."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://ezrabaderman.com/about/\n"
                "https://ezrabaderman.com/work/\n"
                "https://www.saatchiart.com/ebaderman\n"
                "https://www.instagram.com/ezrabaderman/\n"
                "https://thestreetcollector.com/collections/ezra-baderman"
            ),
            notes="",
        ),
        "Marylou Faure": A(
            artist_name="Marylou Faure",
            ig="@maryloufaure",
            location="London, United Kingdom",
            active_since="Freelance illustration ~2015–2016 per It’s Nice That (2016)",
            hero_hook=(
                "French illustrator Marylou Faure (@maryloufaure): Penninghen-trained, London-based per It’s Nice That (2016); Coca-Cola, McLaren F1, YouTube in later profiles."
            ),
            story=(
                "It’s Nice That (2016) profiles Marylou Faure’s move from Paris graphic training (Penninghen) into London agency work and freelance illustration.\n\n"
                "maryloufaure.com/pages/about lists solo exhibitions across London, Paris, Dublin, Beijing, and Sofia, plus talks at Adobe, Apple, and Pictoplasma.\n\n"
                "Design Week (2020) discusses her strong, eyeless female characters and commercial roster including McLaren F1 and YouTube.\n\n"
                "Creative Boom and other design outlets repeat client names—confirm live roster on her site before ads."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press=(
                "It’s Nice That — 2016 — Profile — http://www.itsnicethat.com/articles/mary-lou-faure-illustration-080216\n"
                "Design Week — 2020 — Interview — https://www.designweek.co.uk/issues/14-20-september-2020/marylou-faure-profile/"
            ),
            sources=(
                "https://www.maryloufaure.com/pages/about\n"
                "http://www.maryloufaure.com/\n"
                "http://www.itsnicethat.com/articles/mary-lou-faure-illustration-080216\n"
                "https://www.instagram.com/maryloufaure/\n"
                "https://thestreetcollector.com/collections/marylou-faure"
            ),
            notes="",
        ),
        "Dima Korma": A(
            artist_name="Dima Korma",
            ig="@dimakorma",
            location="Berlin, Germany",
            active_since="",
            hero_hook=(
                "Berlin abstract muralist Dima Korma (@dimakorma): Book a Street Artist cites large-format walls; site kormadima.com lists 2025 Tampa and Barcelona mural projects."
            ),
            story=(
                "Book a Street Artist describes Dima Korma as a Berlin-based abstract muralist combining textures and typography for interiors and exteriors.\n\n"
                "kormadima.com project pages (as indexed) reference large corporate murals in Tampa (2025) and a Barcelona court mural with Rebobinart (2025).\n\n"
                "Walls of Hope documents a commemorative mural related to Erez Kalderon—verify context from the foundation’s materials.\n\n"
                "Threads and Linktree mirror the same handle @dimakorma."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://www.bookastreetartist.com/dima-korma\n"
                "https://www.kormadima.com/\n"
                "https://wallsofhope.net/dima-korma/\n"
                "https://www.instagram.com/dimakorma/\n"
                "https://thestreetcollector.com/collections/dima-korma"
            ),
            notes="",
        ),
        "Samme Snow": A(
            artist_name="Samme Snow",
            ig="@snowhandsworld",
            location="London, United Kingdom",
            active_since="Graphic Communication degree Farnham, 2013 (sammesnow.com/about)",
            hero_hook=(
                "London illustrator Samme Snow (@snowhandsworld): sammesnow.com cites Farnham graphic degree (2013); Canary Wharf, House of Vans, GQ Middle East commissions."
            ),
            story=(
                "sammesnow.com/about states Samme Snow completed a Graphic Communication degree at the University for the Creative Arts, Farnham, in 2013.\n\n"
                "The same page lists murals and brand work including Canary Wharf, House of Vans, and GQ Middle East, plus community colouring workshops since 2020.\n\n"
                "Portfolio pages show hospitality and workplace murals across London and other UK cities.\n\n"
                "Street Collector product pages reference his lamp edition context."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            ig_posts="https://www.instagram.com/snowhandsworld/p/DCi_135IayH/",
            sources=(
                "https://sammesnow.com/about/\n"
                "https://sammesnow.com/\n"
                "https://www.instagram.com/snowhandsworld/\n"
                "https://thestreetcollector.com/collections/samme-snow"
            ),
            notes="",
        ),
        "Sancho": A(
            artist_name="Sancho",
            ig="@bysancho",
            location="Amsterdam, Netherlands",
            active_since="",
            hero_hook=(
                "Sancho (@bysancho): sanchosancho.com traces Birmingham/Shanghai street influence; Amsterdam base per Wallbaby; NBCUniversal, Revolut named as collaborators."
            ),
            story=(
                "sanchosancho.com/about describes a visual artist and illustrator blending hand-drawn character design with pop culture and humor.\n\n"
                "The biography references creative roots in Birmingham and Shanghai before current practice; Wallbaby lists Amsterdam as a base for print sales.\n\n"
                "The about page names collaborations with NBCUniversal, LG, Wrike, Revolut, and Carlsberg Group.\n\n"
                "Awards listed include Saatchi Art selections and Fine Acts grants—verify dates on the live page."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://sanchosancho.com/about\n"
                "https://sanchosancho.com/\n"
                "https://wallbaby.com/gb/artists/sancho\n"
                "https://www.instagram.com/bysancho/\n"
                "https://thestreetcollector.com/collections/sancho"
            ),
            notes="",
        ),
        "Alice Bureau": A(
            artist_name="Alice Bureau",
            ig="@bureau_alice",
            location="Zurich, Switzerland",
            active_since="",
            hero_hook=(
                "Zurich illustrator Alice Hoffmann as Bureau Alice (@bureau_alice): hueandeye.org notes 20+ years as art director before illustration; UBS, Adobe, Meta named."
            ),
            story=(
                "Hue & Eye profiles explain that Alice Hoffmann worked over two decades as an art/creative director in European agencies before launching Bureau Alice.\n\n"
                "bureaualice.com and illustratoren-schweiz.ch list packaging, editorial, and mural commissions for UBS, Adobe, Meta, Diptyque, Deutsche Bahn, and others.\n\n"
                "Her process notes describe analog drawing refined in Adobe Illustrator.\n\n"
                "Behance uses the handle alicealice for some archives—confirm cross-links."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="Hue & Eye — — Bureau Alice feature — https://www.hueandeye.org/bureau-alice/",
            sources=(
                "https://www.bureaualice.com/\n"
                "https://www.hueandeye.org/bureau-alice/\n"
                "https://www.behance.net/alicealice\n"
                "https://www.instagram.com/bureau_alice/\n"
                "https://thestreetcollector.com/collections/alice-bureau"
            ),
            notes="",
        ),
        "Alin Mor": A(
            artist_name="Alin Mor",
            ig="@alinmor",
            location="Haifa, Israel",
            active_since="Freelance illustrator/graphic designer since 2016 (LinkedIn); Bezalel B.Des 2014–2017",
            hero_hook=(
                "Haifa illustrator Alin Mor (@alinmor): alinmor.com lists Bezalel B.Des (2014–2017); themes include femininity and spirituality; Meta Israel cited among collaborators."
            ),
            story=(
                "alinmor.com/about outlines a Haifa-based practice exploring femininity, archetypes, spirituality, and large painted walls for public and private clients.\n\n"
                "The same page lists exhibitions at Illustration Week, Shaar 3 Gallery, Jaffa Museum, and press mentions in Elephant and Haaretz.\n\n"
                "Collaborators named include Meta Israel, Suzuki Israel, and She Shreds Magazine.\n\n"
                "LinkedIn aligns on Bezalel degree dates and freelance start year."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://www.alinmor.com/about\n"
                "https://www.alinmor.com/\n"
                "https://www.linkedin.com/in/alin-mor-2bb330158\n"
                "https://www.instagram.com/alinmor/\n"
                "https://thestreetcollector.com/collections/alin-mor"
            ),
            notes="",
        ),
        "Beto Val": A(
            artist_name="Beto Val",
            ig="@elbetoval",
            location="Ecuador",
            active_since="Public practice accelerated during pandemic per elbetoval.com blog essays",
            hero_hook=(
                "Ecuadorian collage artist Beto Val (@elbetoval): elbetoval.com blogs trace pandemic-era practice; NYT Kids Edition cover mentioned in third-party profiles—confirm on primary."
            ),
            story=(
                "elbetoval.com blog posts describe surreal digital collage built from vintage scientific illustration sources.\n\n"
                "Third-party profiles (Colossal, Rubin Museum mentions in commerce copy) should be double-checked against primary press links before reuse.\n\n"
                "iCanvas and Street Collector list editions—good for SKU context, not for biography.\n\n"
                "Threads mirrors @elbetoval for updates."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "http://elbetoval.com/\n"
                "https://www.icanvas.com/artist/beto-val\n"
                "https://www.threads.net/@elbetoval\n"
                "https://www.instagram.com/elbetoval/\n"
                "https://thestreetcollector.com/collections/beto-val"
            ),
            notes="Verify NYT Kids credit on original publisher page before claiming in ads.",
        ),
        "Cokorda Martin": A(
            artist_name="Cokorda Martin",
            ig="@treasurecult.work",
            location="Bali, Indonesia",
            active_since="Career start 2013; born Klungkung 1995 (Timeout interview, Ana-tomy journal)",
            hero_hook=(
                "Balinese illustrator Cokorda Martin (@treasurecult.work): Timeout Asia (2026) interview; born Klungkung 1995; Uniqlo Indonesia, Café Kitsuné collaborations noted."
            ),
            story=(
                "Timeout’s 2026 feature interviews Cokorda Martin about Balinese heritage, color, and global brand work.\n\n"
                "Ana-tomy’s journal post Celebrating Individuality summarizes his family art lineage and fusion of traditional motifs with pop palettes.\n\n"
                "linktr.ee/cokordamartin points to representation (Debut Art) and shops.\n\n"
                "Instagram posts include music-album homage series—credit original musicians in marketing."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press=(
                "Timeout — 2026 — Interview — https://www.timeout.com/asia/news/news-balinese-artist-cokorda-martin-interview-feature-031625\n"
                "Ana-tomy — — Journal feature — https://ana-tomy.co/blogs/journal/celebrating-individuality-cokorda-martin"
            ),
            ig_posts=(
                "https://www.instagram.com/treasurecult.work/p/C7buwVlyCHS/\n"
                "https://www.instagram.com/treasurecult.work/p/DC12pQcycTy/"
            ),
            sources=(
                "https://linktr.ee/cokordamartin\n"
                "https://www.timeout.com/asia/news/news-balinese-artist-cokorda-martin-interview-feature-031625\n"
                "https://ana-tomy.co/blogs/journal/celebrating-individuality-cokorda-martin\n"
                "https://www.instagram.com/treasurecult.work/\n"
                "https://thestreetcollector.com/collections/cokorda-martin"
            ),
            notes="",
        ),
        "Aviv Shamir": A(
            artist_name="Aviv Shamir",
            ig="@avivos_91",
            location="",
            active_since="",
            hero_hook=(
                "Illustrator Aviv Shamir (@avivos_91): listed on Street Collector internal research sheet; no third-party biography URL verified in the public search pass."
            ),
            story=(
                "The Street Collector artist-research CSV lists Instagram @avivos_91 without an accompanying biography URL.\n\n"
                "Automated web search under the exact name did not return a definitive portfolio or interview matching the handle.\n\n"
                "Before publishing marketing copy, load the live Instagram profile and any site linked in bio.\n\n"
                "Leave exhibition and press lines empty until primary sources are captured."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://www.instagram.com/avivos_91/\n"
                "https://thestreetcollector.com/collections/aviv-shamir"
            ),
            notes="Mostly empty fields until primary bio URL is confirmed.",
        ),
        "Hen Macabi": A(
            artist_name="Hen Macabi",
            ig="@henmacabi",
            location="Israel",
            active_since="",
            hero_hook=(
                "Israeli illustrator Hen Macabi (@henmacabi): Haaretz (2019) reports his graphic work on Netta Barzilai single art; henmacabi.com hosts music-design portfolio."
            ),
            story=(
                "Haaretz published reporting in 2019 describing Hen Macabi as the graphic artist behind artwork for Netta Barzilai’s single Bassa Sababa.\n\n"
                "henmacabi.com catalogs album and poster commissions for Israeli musicians across multiple years.\n\n"
                "Street Collector / Street Lamp product pages reference his typography-forward lamp edition.\n\n"
                "Confirm any additional celebrity credits against the artist’s own discography lists."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="Haaretz — 2019 — Reporting on Eurovision-era single artwork — https://www.haaretz.com/israel-news/eurovision/2019-01-31/ty-article-magazine/.premium/hen-macabi-the-graphic-artist-who-designed-the-cover-for-netta-barzilais-new-singl/0000017f-dbdb-df62-a9ff-dfdf79a40000",
            sources=(
                "https://henmacabi.com/\n"
                "https://www.haaretz.com/israel-news/eurovision/2019-01-31/ty-article-magazine/.premium/hen-macabi-the-graphic-artist-who-designed-the-cover-for-netta-barzilais-new-singl/0000017f-dbdb-df62-a9ff-dfdf79a40000\n"
                "https://www.instagram.com/henmacabi/\n"
                "https://thestreetcollector.com/collections/hen-macabi"
            ),
            notes="",
        ),
        "Refiloe Mnisi": A(
            artist_name="Refiloe Mnisi",
            ig="@urfavsweatpants",
            location="",
            active_since="",
            hero_hook=(
                "Refiloe Mnisi (@urfavsweatpants): Street Collector research sheet lists this handle; no matching biography URL surfaced in the automated search pass."
            ),
            story=(
                "Internal CSV ties the display name Refiloe Mnisi to @urfavsweatpants without an external portfolio link.\n\n"
                "Search results for the handle plus surname did not return a reliable artist biography during the research pass.\n\n"
                "Confirm country, medium, and pronouns directly with the artist before writing long-form story text.\n\n"
                "Do not infer identity from unrelated South African news profiles with similar first names."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://www.instagram.com/urfavsweatpants/\n"
                "https://thestreetcollector.com/collections/refiloe-mnisi"
            ),
            notes="Mostly empty pending direct confirmation.",
        ),
        "Geometric Bang": A(
            artist_name="Geometric Bang",
            ig="@geometricbang",
            location="Florence, Italy",
            active_since="Graffiti since late 1990s per Varsi / Wood’d profiles",
            hero_hook=(
                "Mattia Botta aka Geometric Bang (@geometricbang): Varsi Lab bio cites Lodi-born (1984), Florence-based; murals in Rome, Genoa, Tokyo and international group shows."
            ),
            story=(
                "Varsi Art & Lab and Wood’d blog posts identify Geometric Bang as Mattia Botta, born in Lodi in 1984 and active in Florence, moving from graffiti toward illustration-heavy walls.\n\n"
                "Organiconcrete (2014) and BOOOOOOOM (2013) provide early interviews about pencils, spray paint, and exhibitions.\n\n"
                "Press lists mural travel across Europe, Asia, and Africa—verify each city claim against primary photo documentation.\n\n"
                "He also works on canvas and, per later interviews, tattooing."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press=(
                "Wood’d — — Design story — https://www.woodd.it/blog/en/signs/geometric-bang-woodd-design-stories/\n"
                "BOOOOOOOM — 2013 — Interview — https://www.booooooom.com/2013/01/09/geometric-bang/"
            ),
            sources=(
                "https://www.galleriavarsi.it/collections/geometricbang\n"
                "https://www.woodd.it/blog/en/signs/geometric-bang-woodd-design-stories/\n"
                "http://www.organiconcrete.com/2014/09/15/a-colpi-di-matita-mattia-botta-aka-geometricbang/\n"
                "https://www.instagram.com/geometricbang/\n"
                "https://thestreetcollector.com/collections/geometric-bang"
            ),
            notes="",
        ),
        "Laura Fridman": A(
            artist_name="Laura Fridman",
            ig="@laura_fridman_art",
            location="Tel Aviv, Israel",
            active_since="",
            hero_hook=(
                "French artist Laura Fridman (@laura_fridman_art): laurafridman.art/about cites Yale economics then Israel Ballet; Tel Aviv base; 2022 Kuli Alma solo listed."
            ),
            story=(
                "laurafridman.art/about states she is French, studied economics at Yale, danced professionally with Israel Ballet, and now paints full-time.\n\n"
                "The same page lists solo and group shows including Kuli Alma, Tel Aviv (2022) and international cities such as Barcelona and Lisbon.\n\n"
                "Her figurative style exaggerates hands and necks while keeping faces realistic—a motif described on Street Collector lamp copy.\n\n"
                "Verify future fair dates (e.g., Turin) on the live site before publishing."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://www.laurafridman.art/about\n"
                "https://www.laurafridman.art/\n"
                "https://www.instagram.com/laura_fridman_art/\n"
                "https://thestreetcollector.com/collections/laura-fridman"
            ),
            notes="",
        ),
    }

    FILE3 = {
        "saturn_png": A(
            artist_name="saturn_png",
            ig="@saturn_png",
            location="France",
            active_since="",
            hero_hook=(
                "French illustrator Hermann as saturn_png (@saturn_png): Marché des Créateurs bio cites abstract geometry and Greek ceramics; "
                "True Grit promos show Procreate grain brushes."
            ),
            story=(
                "Marché des Créateurs (Luxembourg fair site) lists Saturn / saturn_png as a French illustrator and animator named Hermann working with abstract geometry and references to ancient Greek ceramics.\n\n"
                "True Grit Texture Supply’s Instagram promotions show him using their Procreate grain brushes on geometric illustrations.\n\n"
                "Pinterest and third-party posts reference saturnsuperstore.fr—verify product catalog on the live domain.\n\n"
                "Treat client lists strictly from primary shop pages."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://marche-des-createurs.fr/saturn-illustration/\n"
                "https://www.instagram.com/saturn_png/\n"
                "https://thestreetcollector.com/collections/saturn-png"
            ),
            notes="",
        ),
        "Levi Jacobs": A(
            artist_name="Levi Jacobs",
            ig="@levijacobss",
            location="Rotterdam, Netherlands",
            active_since="Freelance illustration since 2010 (LinkedIn); BDes Illustration St. Joost 2006–2010",
            hero_hook=(
                "Rotterdam illustrator Levi Jacobs (@levijacobss): levijacobs.nl cites freelance since 2010, St. Joost BDes; Adobe, Netflix, Apple, NYT named; mural festivals since 2014."
            ),
            story=(
                "levijacobs.nl/info documents a Rotterdam-based freelance illustrator with a St. Joost illustration BDes and commercial clients such as Adobe, Netflix, Apple, and The New York Times.\n\n"
                "The same page notes mural and festival participation across Europe and Asia since 2014 and awards from Dutch and European design competitions.\n\n"
                "Behance mirrors the portfolio with large view counts.\n\n"
                "Personal world-building projects (e.g., Planet Tropicana) are described on the info page."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://www.levijacobs.nl/info\n"
                "http://levijacobs.nl/\n"
                "https://www.behance.net/levijacobs\n"
                "https://www.linkedin.com/in/levijacobs\n"
                "https://www.instagram.com/levijacobss/\n"
                "https://thestreetcollector.com/collections/levi-jacobs"
            ),
            notes="",
        ),
        "Jake Ac art": A(
            artist_name="Jake Ac art",
            ig="@jack_ac_art",
            location="",
            active_since="",
            hero_hook=(
                "Jack AC Art (@jack_ac_art): officialjackacart.com sells card verse products; Instagram documents marker-and-ink process—limited verified press in search pass."
            ),
            story=(
                "officialjackacart.com markets collectible card products and related merchandise.\n\n"
                "Instagram and Pinterest archives show marker-and-ink drawing processes and pop-culture subject matter.\n\n"
                "No major interview URL was returned in the automated search pass.\n\n"
                "Confirm legal name, city, and licensing for any branded fan art before campaigns."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://officialjackacart.com/\n"
                "https://www.instagram.com/jack_ac_art/\n"
                "https://thestreetcollector.com/collections/jake-ac-art"
            ),
            notes="Sparse verifiable biography; prioritize future primary interview.",
        ),
        "Wuper Kec": A(
            artist_name="Wuper Kec",
            ig="@wuper_kec",
            location="Indjija, Serbia",
            active_since="Graffiti since 2006; brush murals for ~5+ years per Boulogne-sur-Mer blog (2024)",
            hero_hook=(
                "Serbian muralist Wuper Kec (@wuper_kec): Street Art Boulogne-sur-Mer (2023–24) profiles brush murals; Street Art Cities lists Serbia/France markers."
            ),
            story=(
                "streetart.boulogne-sur-mer.fr documents Wuper Kec’s festival murals in France, noting a shift from spray paint to brush techniques and Soviet-realist inflected scenes.\n\n"
                "Street Art Cities aggregates geotagged works across Serbia and France.\n\n"
                "Behance hosts a handle tied to the same name with process imagery.\n\n"
                "Verify each mural city and year against festival press releases."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="Street Art Boulogne-sur-Mer — 2024 — Profile — https://streetart.boulogne-sur-mer.fr/wuper-kec/",
            sources=(
                "https://streetart.boulogne-sur-mer.fr/wuper-kec/\n"
                "https://streetartcities.com/artists/wuper-kec\n"
                "https://www.instagram.com/wuper_kec/\n"
                "https://thestreetcollector.com/collections/wuper-kec"
            ),
            notes="",
        ),
        "Tania Yakunova": A(
            artist_name="Tania Yakunova",
            ig="@anni_tett",
            location="London, United Kingdom",
            active_since="Full-time illustrator from 2014; relocated to UK 2023 per yakunova.com/about",
            hero_hook=(
                "London illustrator Tania Yakunova (@anni_tett): yakunova.com states Kyiv origin, Arts Council England move in 2023; World Illustration Award noted on site."
            ),
            story=(
                "yakunova.com/about describes a Kyiv-born illustrator who became full-time in 2014 and relocated to south-west London in 2023 with Arts Council England endorsement.\n\n"
                "Her portfolio spans editorial and brand work; Behance shows large follower counts.\n\n"
                "A public Instagram post references Weekendavisen art direction about Kyiv—verify caption wording before quoting.\n\n"
                "Awards listed on the site include World Illustration Award and Communication Arts wins."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            ig_posts="https://www.instagram.com/anni_tett/p/CnCKLhHIIHi/",
            sources=(
                "https://www.yakunova.com/about\n"
                "https://www.yakunova.com/\n"
                "https://www.behance.net/anaittet\n"
                "https://www.instagram.com/anni_tett/\n"
                "https://thestreetcollector.com/collections/tania-yakunova"
            ),
            notes="",
        ),
        "Ajax Blyth Piper": A(
            artist_name="Ajax Blyth Piper",
            ig="@ajaxpiper",
            location="Hastings, England, United Kingdom",
            active_since="Murals since 2018 (Street Art Cities); b. 1997 per same listing",
            hero_hook=(
                "UK muralist Ajax Piper (@ajaxpiper): Street Art Cities lists Hastings base; TYPE01 (2024) interviews him on graffiti-informed Nubya typeface; murals since 2018."
            ),
            story=(
                "Street Art Cities identifies Ajax Piper as a Hastings-based muralist active since 2018 with a 1997 birth year.\n\n"
                "TYPE01 (2024) interviews him about the Nubya display typeface bridging graffiti and calligraphic contrast.\n\n"
                "2019 GMD London College of Communication showcase pages list student branding projects under Ajax Blyth Piper.\n\n"
                "Cross-check any secondary Instagram handles mentioned in older articles against @ajaxpiper."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="TYPE01 — 2024 — Typeface interview — https://type-01.com/ajax-piper-on-meeting-graffiti-with-calligraphic-influences-in-his-new-typeface/",
            sources=(
                "https://streetartcities.com/artists/ajax-piper\n"
                "https://type-01.com/ajax-piper-on-meeting-graffiti-with-calligraphic-influences-in-his-new-typeface/\n"
                "https://2019.gmdlcc.com/ajax-blyth-piper/\n"
                "https://www.instagram.com/ajaxpiper/\n"
                "https://thestreetcollector.com/collections/ajax-blyth-piper"
            ),
            notes="",
        ),
        "Raki": A(
            artist_name="Raki",
            ig="@raki.official.art",
            location="Philippines",
            active_since="",
            hero_hook=(
                "RAF Page illustrates as RAKI (@raki.official.art): Bangkok Illustration Fair 2026 lists Philippines-based artist with playful pop imagery—verify mural list separately."
            ),
            story=(
                "The Bangkok Illustration Fair artist listing for 2025/2026 describes RAKI (Raf Page) from the Philippines with bright, nostalgic pop imagery.\n\n"
                "Contact email raki.official.art@gmail.com appears on the same listing.\n\n"
                "No mural database entries were returned in the quick search pass—confirm wall work from Instagram geotags.\n\n"
                "Distinguish from unrelated brand murals using the word Raki."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="Bangkok Illustration Fair — 2026 — Artist listing — https://www.bangkokillustrationfair.com/artist/2025/1901",
            sources=(
                "https://www.bangkokillustrationfair.com/artist/2025/1901\n"
                "https://www.instagram.com/raki.official.art/\n"
                "https://thestreetcollector.com/collections/raki"
            ),
            notes="",
        ),
        "Odsk": A(
            artist_name="Odsk",
            ig="@odsk_",
            location="Nantes, France",
            active_since="",
            hero_hook=(
                "Nantes tattooer-illustrator Anthony Daudet ODSK (@odsk_): odsk.fr boutique sells riso prints; Behance biography ties graphic design to tattoo residency."
            ),
            story=(
                "odsk.fr positions ODSK as a Nantes tattoo and illustration studio with an online boutique for risograph prints, apparel, and flash.\n\n"
                "Behance lists Anthony Daudet with graphic-design training leading into tattoo residency at Ultranormal.\n\n"
                "Threads and Twitter accounts mirror the brand handle for booking announcements.\n\n"
                "Verify guest-city dates on Instagram highlights before travel marketing."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://odsk.fr/\n"
                "https://www.behance.net/anthonydaudet\n"
                "https://www.instagram.com/odsk_/\n"
                "https://thestreetcollector.com/collections/odsk"
            ),
            notes="",
        ),
        "Kaka Chazz": A(
            artist_name="Kaka Chazz",
            ig="@kaka.chazz",
            location="Minas Gerais, Brazil",
            active_since="Visual practice since 2008; born Três Pontas 1989 (kakachazz.com.br biografia)",
            hero_hook=(
                "Brazilian muralist Kaká Chazz (@kaka.chazz): kakachazz.com.br biography cites Três Pontas 1989 birth, self-taught since 2008; classical-street hybrid style."
            ),
            story=(
                "kakachazz.com.br/biografia identifies Cassiano Henrique Cândido (Kaká Chazz) as a self-taught artist from southern Minas Gerais working since 2008.\n\n"
                "Rádio Itatiaia reporting summarizes his murals translating everyday Minas life into large walls.\n\n"
                "He sells originals and prints through the official shop.\n\n"
                "Themes often highlight cerrado ecology—cross-check scientific claims with conservation partners when quoting."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="Rádio Itatiaia — — Feature on urban murals — https://www.itatiaia.com.br/porlucasmachado/kaka-chazz-o-artista-mineiro-que-transforma-o-cotidiano-em-arte-urbana",
            sources=(
                "https://kakachazz.com.br/biografia/\n"
                "https://kakachazz.com.br/\n"
                "https://www.itatiaia.com.br/porlucasmachado/kaka-chazz-o-artista-mineiro-que-transforma-o-cotidiano-em-arte-urbana\n"
                "https://www.instagram.com/kaka.chazz/\n"
                "https://thestreetcollector.com/collections/kaka-chazz"
            ),
            notes="",
        ),
        "Chubby Nida": A(
            artist_name="Chubby Nida",
            ig="@chubbynida",
            location="Bangkok, Thailand",
            active_since="~12 years professional per Art of Th interview (2023)",
            hero_hook=(
                "Bangkok illustrator Chubby Nida (@chubbynida): Collateral (EN) profiles mental-health themes; World Illustration Awards lists Wilderness Whispers project."
            ),
            story=(
                "Collateral’s English feature describes Chanida Areewatanasombat (Chubby Nida) mixing illustration, animation, collage, and embroidery around mental health and memory.\n\n"
                "The World Illustration Awards site hosts a project page for Wilderness Whispers.\n\n"
                "chubbynida.studio summarizes commissions for global brands—verify logos on case studies.\n\n"
                "Thai interview outlets expand on autobiographical themes—translate carefully."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press=(
                "Collateral — — English feature — https://www.collater.al/en/chubby-nida-animation-illustration-art/\n"
                "World Illustration Awards — — Project listing — https://worldillustrationawards.com/projects/chubbynida-wilderness-whispers/"
            ),
            sources=(
                "https://www.chubbynida.studio/\n"
                "https://www.collater.al/en/chubby-nida-animation-illustration-art/\n"
                "https://worldillustrationawards.com/projects/chubbynida-wilderness-whispers/\n"
                "https://www.instagram.com/chubbynida/\n"
                "https://thestreetcollector.com/collections/chubby-nida"
            ),
            notes="",
        ),
        "Lobster Robin": A(
            artist_name="Lobster Robin",
            ig="@lobster_robin",
            location="Belgium",
            active_since="",
            hero_hook=(
                "Belgian muralist Lobster Robin (@lobster_robin): Northwest Walls 2024 artist page; Antwerp/Ghent base; StickerApp interview details latex-paint mural technique."
            ),
            story=(
                "northwestwalls.be documents Lobster Robin as a Belgian painter with illustration training blending fine lines with street-scale color.\n\n"
                "Street Art Cities aggregates mural markers in Belgium.\n\n"
                "StickerApp’s interview explains latex paint, worn brushes, and influences from comics and mural peers.\n\n"
                "Illustrated World Series stats appear on its site—use for esports-style context only with verification."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="StickerApp — — Artist interview — https://stickerapp.com/blog/artist-interview/lobster-robin",
            sources=(
                "https://www.northwestwalls.be/history/2024/lobster-robin\n"
                "https://streetartcities.com/artists/lobster-robin\n"
                "https://stickerapp.com/blog/artist-interview/lobster-robin\n"
                "https://www.instagram.com/lobster_robin/\n"
                "https://thestreetcollector.com/collections/lobster-robin"
            ),
            notes="",
        ),
        "Crackthetoy": A(
            artist_name="Crackthetoy",
            ig="@crackthetoy",
            location="Indonesia",
            active_since="",
            hero_hook=(
                "Indonesia-based Crack (@crackthetoy): Instagram public posts show illustration, toys, mixed-media canvas; Linktree aggregates shop links—thin long-form bio."
            ),
            story=(
                "linktr.ee/crackthetoy points to Instagram, toy shops, and NFT marketplaces.\n\n"
                "Public Instagram posts document illustration, character design, and mixed-media paintings.\n\n"
                "No authoritative interview URL surfaced in the automated search pass.\n\n"
                "Confirm legal name and city with the artist before long-form editorial."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            ig_posts=(
                "https://www.instagram.com/crackthetoy/p/DGIU00kyqLN/\n"
                "https://www.instagram.com/crackthetoy/p/DI-YjcISRVV/"
            ),
            sources=(
                "https://linktr.ee/crackthetoy\n"
                "https://www.instagram.com/crackthetoy/\n"
                "https://thestreetcollector.com/collections/crackthetoy"
            ),
            notes="",
        ),
        "Mameko Maeda": A(
            artist_name="Mameko Maeda",
            ig="@mameko_maeda",
            location="Tokyo, Japan",
            active_since="Professional illustrator from 2020; born Tokyo 1993 (mameko-maeda.com EN)",
            hero_hook=(
                "Tokyo illustrator Mameko Maeda (@mameko_maeda): mameko-maeda.com states 1993 birth, career from 2020; dance-informed body illustration; Expo 2025 Osaka mural noted."
            ),
            story=(
                "mameko-maeda.com/en states she was born in Tokyo in 1993, began professional illustration in 2020, and studies dance-informed body dynamics.\n\n"
                "Beyond magazine and Behance mention commercial murals including Expo 2025 Osaka and fashion campaigns—verify each credit on Japanese-language press.\n\n"
                "VisionTrack representation is referenced on portfolio hubs.\n\n"
                "Her humor-forward bodies target adult collectors—note content sensitivity for family marketing."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="Beyond — — Author page — https://www.beyondmag.jp/authors/mameko-maeda",
            sources=(
                "https://www.mameko-maeda.com/en\n"
                "https://www.behance.net/mameko_maeda\n"
                "https://www.beyondmag.jp/authors/mameko-maeda\n"
                "https://www.instagram.com/mameko_maeda/\n"
                "https://thestreetcollector.com/collections/mameko-maeda"
            ),
            notes="",
        ),
        "Frederique Mati": A(
            artist_name="Frederique Mati",
            ig="@frederique.png",
            location="Amsterdam, Netherlands",
            active_since="10+ years experience per frederiquematti.com",
            hero_hook=(
                "Amsterdam illustrator Frederique Matti (@frederique.png): frederiquematti.com lists Google, Spotify, Github clients; solo painting show The Hoxton Amsterdam 2023."
            ),
            story=(
                "frederiquematti.com describes Frederique Matti as an Amsterdam-based illustrator, art director, and painter with a decade-plus career across digital and painted work.\n\n"
                "Client lists include Google, Spotify, Github, Dropbox, Uber, and Bacardi.\n\n"
                "She notes solo painting exhibitions including The Hoxton Amsterdam in 2023.\n\n"
                "Display name follows Street Collector spelling Mati; surname Matti appears on the domain."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "http://www.frederiquematti.com/\n"
                "https://frederiquematti.com/Digital\n"
                "https://www.instagram.com/frederique.png/\n"
                "https://thestreetcollector.com/collections/frederique-mati"
            ),
            notes="",
        ),
        "Phil Huelz": A(
            artist_name="Phil Huelz",
            ig="@phil.huelz",
            location="Cologne, Germany",
            active_since="",
            hero_hook=(
                "Cologne illustrator Phil Huelz (@phil.huelz): Medium (2025) profile describes emotional playground imagery; huelz.art lists toys and prints—verify show dates on site."
            ),
            story=(
                "Medium commentary (2025) outlines Huelz’s symbolic playgrounds—slides, ladders, ponds—as emotional architecture rendered in loud color.\n\n"
                "huelz.art sells resin art toys such as Tanglehug plus stickers and prints.\n\n"
                "Toysrevil blog posts document toy releases for collectors.\n\n"
                "Confirm exhibition months/years using PDFs or venue sites before catalogs."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="Medium — 2025 — Commentary feature — https://medium.com/@omars69h/phil-huelz-creating-playful-worlds-to-talk-about-real-emotions-e63c9262d73a",
            sources=(
                "https://www.huelz.art/\n"
                "https://medium.com/@omars69h/phil-huelz-creating-playful-worlds-to-talk-about-real-emotions-e63c9262d73a\n"
                "https://toysrevil.blogspot.com/2025/11/tanglehug-by-phil-huelz.html\n"
                "https://www.instagram.com/phil.huelz/\n"
                "https://thestreetcollector.com/collections/phil-huelz"
            ),
            notes="",
        ),
        "Ollie Smither": A(
            artist_name="Ollie Smither",
            ig="@os.illustration",
            location="Devon, England, United Kingdom",
            active_since="",
            hero_hook=(
                "Devon fine-line illustrator Ollie Smither (@os.illustration): osillustration.com states solo UK operation; Quarto book Wanderlust Ink lists 2026 US/UK publication dates."
            ),
            story=(
                "osillustration.com explains that Ollie Smither runs a one-person shop for prints, apparel, tattoo licenses, and commissions from Devon.\n\n"
                "Quarto’s catalog entry for Wanderlust Ink documents publication dates in 2026 for US and UK markets.\n\n"
                "Linktree consolidates Instagram, TikTok, and shop gateways.\n\n"
                "Threads follower counts are self-reported—verify before quoting."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="The Quarto Group — 2026 — Book listing — https://quarto.com/books/9781577158493/wanderlust-ink",
            sources=(
                "https://www.osillustration.com/\n"
                "https://quarto.com/books/9781577158493/wanderlust-ink\n"
                "https://linktr.ee/Os.illustration\n"
                "https://www.instagram.com/os.illustration/\n"
                "https://thestreetcollector.com/collections/ollie-smither"
            ),
            notes="",
        ),
    }

    FILE4 = {
        "NASCA Uno": A(
            artist_name="NASCA Uno",
            ig="@nasca_one",
            location="Berlin, Germany",
            active_since="Early 1990s birth near Munich; graffiti-to-mural path per artsmania.ca (2020)",
            hero_hook=(
                "Nasca Uno / Armin E. Mendocilla (@nasca_one): STRAAT Museum collection text; artsmania.ca (2020) interview cites German-Peruvian roots and Berlin-based mural tours."
            ),
            story=(
                "STRAAT Museum’s collection database hosts a work statement emphasizing narrative characters in Nasca Uno’s murals.\n\n"
                "Artsmania.ca (2020) interviews Armin E. Mendocilla about German and Peruvian heritage, comic influences, and international mural travel.\n\n"
                "Wooster Collective archives an early feature useful for historical context.\n\n"
                "Spelling variants Nasca Uno / NASCA Uno appear—match artist’s official caps on socials."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press=(
                "Artsmania — 2020 — Interview — https://artsmania.ca/2020/02/17/interview-with-nasca-uno/\n"
                "STRAAT Museum — — Collection database entry — https://straatmuseum.com/en/collection-database/nasca-uno"
            ),
            sources=(
                "https://www.nasca1.com/about-1\n"
                "https://artsmania.ca/2020/02/17/interview-with-nasca-uno/\n"
                "https://straatmuseum.com/en/collection-database/nasca-uno\n"
                "http://www.woostercollective.com/post/nasca-uno\n"
                "https://www.instagram.com/nasca_one/\n"
                "https://thestreetcollector.com/collections/nasca-uno"
            ),
            notes="",
        ),
        "Animalitoland": A(
            artist_name="Animalitoland",
            ig="@animalitoland",
            location="Los Angeles, California, United States",
            active_since="Digital illustration from 1999; street painting from 2011; full-time nomadic from 2014 per animalitoland.com bio",
            hero_hook=(
                "Argentine muralist Graciela Gonçalves Da Silva as Animalitoland (@animalitoland): animalitoland.com bio cites UBA design study, street painting from 2011, 60+ murals."
            ),
            story=(
                "animalitoland.com/about outlines graphic-design training in Buenos Aires, early digital illustration, a 2011 pivot to murals, and full-time travel from 2014.\n\n"
                "Press pdfs on the site reference Pictoplasma and book anthologies such as Street Art by Women.\n\n"
                "Voyagela interview adds Los Angeles relocation context—verify current city on Instagram bio.\n\n"
                "Creature-based acrylic language merges comics pacing with painterly texture."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="Voyage LA — — Interview — https://voyagela.com/interview/check-out-graciela-aka-animalitoland-goncalves-da-silvas-story/",
            sources=(
                "https://animalitoland.com/about/\n"
                "http://animalitoland.com/\n"
                "https://voyagela.com/interview/check-out-graciela-aka-animalitoland-goncalves-da-silvas-story/\n"
                "https://www.instagram.com/animalitoland/\n"
                "https://thestreetcollector.com/collections/animalitoland"
            ),
            notes="",
        ),
        "Thibaud Herem": A(
            artist_name="Thibaud Herem",
            ig="@thibaudherem",
            location="France / United Kingdom (per itinerant practice)",
            active_since="",
            hero_hook=(
                "French illustrator Thibaud Hérem (@thibaudherem): Handsome Frank bio; toffygreen.com feature on architectural ink drawing; Netflix Our Beloved Summer artwork noted on site."
            ),
            story=(
                "Handsome Frank’s rep page summarizes Hérem’s hand-drawn architecture with cross-hatching and weeks-long production timelines.\n\n"
                "thibaudherem.com/pages/about lists Hermès, Four Seasons, Nike, Samsung, Hyundai, and Netflix’s Our Beloved Summer among projects.\n\n"
                "Toffygreen.com’s long feature narrates on-location drawing discipline.\n\n"
                "He publishes books with Nobrow, Cicada, and Laurence King—verify ISBNs before citing."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press=(
                "Toffygreen — — Feature — https://toffygreen.com/en/thibaud-herem-feature/\n"
                "Handsome Frank — — Rep bio — http://handsomefrank.com/illustrators/thibaud-herem"
            ),
            sources=(
                "https://thibaudherem.com/pages/about\n"
                "https://thibaudherem.com/\n"
                "https://toffygreen.com/en/thibaud-herem-feature/\n"
                "http://handsomefrank.com/illustrators/thibaud-herem\n"
                "https://www.instagram.com/thibaudherem/\n"
                "https://thestreetcollector.com/collections/thibaud-herem"
            ),
            notes="",
        ),
        "Jennypo Art": A(
            artist_name="Jennypo Art",
            ig="@jennypoart",
            location="",
            active_since="",
            hero_hook=(
                "Tattooist-illustrator Jenny Pokryvailo (@jennypoart): jennypoart.com states black-and-white essence focus; stippling brush product on Gumroad—verify exhibition list separately."
            ),
            story=(
                "jennypoart.com introduces Jenny Pokryvailo’s black-and-white illustration and tattoo practice focused on contrast and reduction.\n\n"
                "Gumroad sells stippling brush sets credited to jennypoart.\n\n"
                "Threads mirrors @jennypoart with tattoo and Procreate workflow notes.\n\n"
                "Confirm city and studio name from Instagram bio before printing packaging."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://jennypoart.com/\n"
                "https://jennypo.gumroad.com/l/stipple?a=436890451\n"
                "https://www.threads.com/@jennypoart\n"
                "https://www.instagram.com/jennypoart/\n"
                "https://thestreetcollector.com/collections/jennypo-art"
            ),
            notes="User brief: anchor jennypoart.com + @jennypoart.",
        ),
        "Mathew Gagnon": A(
            artist_name="Mathew Gagnon",
            ig="@mattjgag",
            location="Montreal, Canada",
            active_since="",
            hero_hook=(
                "Montreal artist Matthew Gagnon (@mattjgag): matthewgagnonart.com cites urban geometry in acrylic and pen; Elaine Fleck Toronto show Sept 2023 listed on site."
            ),
            story=(
                "matthewgagnonart.com/contact uses mattjgag@gmail.com and summarizes urban landscape painting with acrylic and technical pen.\n\n"
                "The site lists 2023 exhibitions in Toronto and Bordeaux.\n\n"
                "Instagram documents alley studies around Montreal neighborhoods—good for location-specific storytelling.\n\n"
                "Street Collector uses spelling Mathew Gagnon—align with artist preference."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            ig_posts="https://www.instagram.com/mattjgag/p/DEpvpNsO9HL/",
            sources=(
                "https://www.matthewgagnonart.com/\n"
                "https://www.matthewgagnonart.com/contact\n"
                "https://www.instagram.com/mattjgag/\n"
                "https://thestreetcollector.com/collections/mathew-gagnon"
            ),
            notes="",
        ),
        "Rik Lee": A(
            artist_name="Rik Lee",
            ig="@rikleeillustration",
            location="Melbourne, Australia",
            active_since="",
            hero_hook=(
                "Melbourne illustrator Rik Lee (@rikleeillustration): riklee.net/about lists Amex, Virgin Australia, Stüssy; exhibitions in Melbourne, Sydney, LA, NYC."
            ),
            story=(
                "riklee.net/about lists collaborations with American Express, Virgin Australia, Ray Ban, Air New Zealand, Stüssy, Vice, and Laurence King Publishing.\n\n"
                "He notes exhibitions across Melbourne, Sydney, Bali, Los Angeles, San Francisco, and New York.\n\n"
                "Linktree routes to shops and socials.\n\n"
                "Personal interests (surfing, dogs) appear on the about page—optional flavor for lifestyle copy."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://riklee.net/about-1\n"
                "https://riklee.net/home\n"
                "https://linktr.ee/rikleeillustration\n"
                "https://www.instagram.com/rikleeillustration/\n"
                "https://thestreetcollector.com/collections/rik-lee"
            ),
            notes="",
        ),
        "Paola Delfin": A(
            artist_name="Paola Delfin",
            ig="@paola_delfin",
            location="Mexico City, Mexico",
            active_since="Born 1989 (Wikipedia / cultura.gob.mx semblanza)",
            hero_hook=(
                "Mexican muralist Paola Delfín Gaytán (@paola_delfin): Wikipedia and Global Muralism cite 1989 CDMX birth, monochrome figurative walls on several continents."
            ),
            story=(
                "Spanish Wikipedia and Mexico’s Secretaría de Cultura semblanza agree on a 1989 Mexico City birth and self-taught mural trajectory within post-graffiti figuration.\n\n"
                "Global Muralism’s essay describes monochrome, illustration-like women intertwined with botanicals and community research.\n\n"
                "She lists Nike, Converse, and Sharpie among collaborators on Wikipedia—verify with press releases.\n\n"
                "International mural cities include Kiev, Chennai, and European capitals per the same sources."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="Global Muralism — — Essay — https://www.globalmuralism.com/post/paola-delf%C3%ADn-poes%C3%ADa-muralista-entre-lo-%C3%ADntimo-y-lo-colectivo",
            sources=(
                "https://es.wikipedia.org/wiki/Paola_Delf%C3%ADn\n"
                "https://www.cultura.gob.mx/independientes/semblanzas/paola-delfin\n"
                "https://www.globalmuralism.com/post/paola-delf%C3%ADn-poes%C3%ADa-muralista-entre-lo-%C3%ADntimo-y-lo-colectivo\n"
                "https://www.instagram.com/paola_delfin/\n"
                "https://thestreetcollector.com/collections/paola-delfin"
            ),
            notes="Accent spelling Delfín in Spanish sources.",
        ),
        "Wotto": A(
            artist_name="Wotto",
            ig="@wotto76",
            location="Orange County, California, United States",
            active_since="Freelance illustration since 2000 (wottoart.com About)",
            hero_hook=(
                "Illustrator Craig Watkins Wotto (@wotto76): wottoart.com About cites BA 2000, now Orange County CA; Disney, Star Wars, Crocs named in client list."
            ),
            story=(
                "wottoart.com/about identifies Craig Watkins behind Wotto, graduating illustration BA in 2000, working from London then relocating to Orange County.\n\n"
                "Client lists include Disney, Star Wars, Crocs, DreamWorks, Cartoon Network, Nintendo, and Universal style guides.\n\n"
                "Dribbble and Linktree mirror the doodle-brand aesthetic.\n\n"
                "AlwaysArt portfolio duplicates summaries—use official site as canonical."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://wottoart.com/about/\n"
                "https://wottoart.com/\n"
                "https://linktr.ee/wotto76\n"
                "https://www.instagram.com/wotto76/\n"
                "https://thestreetcollector.com/collections/wotto"
            ),
            notes="",
        ),
        "Yippie Hey": A(
            artist_name="Yippie Hey",
            ig="@yippiehey",
            location="Hamburg, Germany",
            active_since="10+ years career noted on yippiehey.com/about",
            hero_hook=(
                "Hamburg studio YIPPIEHEY (@yippiehey): yippiehey.com/about names founder Jacob Eisinger; Apple, Nike, Adidas, McDonald’s on client page."
            ),
            story=(
                "yippiehey.com/about presents YIPPIEHEY as Jacob Eisinger’s Hamburg studio blending illustration, 3D, and animation.\n\n"
                "Client grids list Apple, Nike, Adidas, McDonald’s, Mercedes, Adobe, and major magazines.\n\n"
                "Representation spans Kombinat Rotweiss, Much Collab, and Much Amsterdam per the info page.\n\n"
                "NFT-era projects appear—confirm current availability before marketing."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://yippiehey.com/about\n"
                "http://www.yippiehey.com/\n"
                "https://yippiehey.com/info\n"
                "https://www.instagram.com/yippiehey/\n"
                "https://thestreetcollector.com/collections/yippie-hey"
            ),
            notes="",
        ),
        "Keya Tama": A(
            artist_name="Keya Tama",
            ig="@keyatama",
            location="New York City, United States",
            active_since="Born Cape Town 1997; mural travel with parent artist per SDVoyager (2019)",
            hero_hook=(
                "South African muralist Keya Tama (@keyatama): keyatama.com/bio cites Cape Town 1997 birth; Royal Delft museum page documents residency project context."
            ),
            story=(
                "keyatama.com/bio describes a Cape Town-born artist exploring ancestral iconography with minimal graphic forms, now based in New York.\n\n"
                "Royal Delft Museum published a residency/project page tying him to Delftware collaboration.\n\n"
                "SDVoyager (2019) interview recounts early travel painting with a muralist parent and a Cartoon Network Studios wall in 2017.\n\n"
                "Verify mural geography on Instagram before claiming specific cities."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press=(
                "SDVoyager — 2019 — Interview — https://sdvoyager.com/interview/meet-keya-tama/\n"
                "Royal Delft Museum — — Project page — https://museum.royaldelft.com/keya-tama/"
            ),
            sources=(
                "https://www.keyatama.com/bio\n"
                "http://www.keyatama.com/\n"
                "https://sdvoyager.com/interview/meet-keya-tama/\n"
                "https://museum.royaldelft.com/keya-tama/\n"
                "https://www.instagram.com/keyatama/\n"
                "https://thestreetcollector.com/collections/keya-tama"
            ),
            notes="",
        ),
        "Facio": A(
            artist_name="Facio",
            ig="@tomas_facio",
            location="Merlo, Buenos Aires Province, Argentina",
            active_since="UNA art studies from 2013; born 1990 (Street Art Cities bio)",
            hero_hook=(
                "Argentine muralist Tomás Facio (@tomas_facio): Street Art Cities bio cites Merlo 1990 birth, UNA studies from 2013; monochrome line murals in several countries."
            ),
            story=(
                "Street Art Cities summarizes Tomás Facio as a Merlo-born muralist who studied at UNA from 2013 with an engraving-influenced line language.\n\n"
                "Barbara Picci’s blog documents 2024 work in Merlo with detailed process photography.\n\n"
                "Festival Asalto (Zaragoza) press notes his 2024 wall referencing historic toys—verify quotes from Cadena SER article.\n\n"
                "Use @tomas_facio per Barbara Picci caption research; avoid unverified alternate handles."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="Barbara Picci — 2024 — Merlo wall feature — https://barbarapicci.com/2024/01/23/streetart-facio-merlo-argentina/",
            sources=(
                "https://streetartcities.com/artists/tomas-facio\n"
                "https://barbarapicci.com/2024/01/23/streetart-facio-merlo-argentina/\n"
                "https://www.instagram.com/tomas_facio/\n"
                "https://thestreetcollector.com/collections/facio"
            ),
            notes="User brief: Tomas Facio / street art profile.",
        ),
        "Woizo": A(
            artist_name="Woizo",
            ig="@woizoner",
            location="Toulouse, France",
            active_since="",
            hero_hook=(
                "French muralist Woizo (@woizoner): woizo.art biography cites Rennes origin, graphic-design training, graffiti route; Toulouse base on Artsper/Urbaneez listings."
            ),
            story=(
                "woizo.art’s biography (French) traces Breton roots, graphic-design education, graffiti, and travels in Africa shaping color choices.\n\n"
                "Artsper and Urbaneez seller copy describe Toulouse as a working base while noting Rennes origin.\n\n"
                "street-artwork.com hosts an English profile with mural photography.\n\n"
                "Big Cartel shop links appear on aggregator pages—confirm inventory on live store."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://woizo.art/Biographie\n"
                "https://woizo.art/\n"
                "https://www.street-artwork.com/en/artist-profile/326/woizo\n"
                "https://www.artsper.com/us/contemporary-artists/france/129099/woizo\n"
                "https://www.instagram.com/woizoner/\n"
                "https://thestreetcollector.com/collections/woizo"
            ),
            notes="",
        ),
        "Thomas Stary": A(
            artist_name="Thomas Stary",
            ig="@tomasstary.studio",
            location="Prague, Czech Republic",
            active_since="Murals since 2010 (tomasstary.com); MA industrial design UWB Pilsen 2017–2020 (LinkedIn)",
            hero_hook=(
                "Prague designer Tomáš Starý (@tomasstary.studio): tomasstary.com mural section since 2010; LinkedIn cites UI/UX plus MA industrial design in Pilsen."
            ),
            story=(
                "tomasstary.com presents mural painting since 2010 alongside graphic and digital product work.\n\n"
                "tomasstary.cz and LinkedIn describe Prague-based practice spanning branding, UI/UX, and large-scale walls.\n\n"
                "Contact emails and phone numbers are published on studio pages.\n\n"
                "Match English name Thomas Stary to Czech Tomáš Starý for bilingual marketing."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://tomasstary.com/\n"
                "https://tomasstary.cz/\n"
                "https://linkedin.com/in/tomasstarydesign\n"
                "https://www.instagram.com/tomasstary.studio/\n"
                "https://thestreetcollector.com/collections/thomas-stary"
            ),
            notes="",
        ),
        "Vivaladybug": A(
            artist_name="Vivaladybug",
            ig="@vivalaladybug",
            location="",
            active_since="",
            hero_hook=(
                "Illustrator Viva La Ladybug (@vivalaladybug): Instagram and GIPHY channel document hybrid character art and widely shared GIFs—limited formal CV URLs."
            ),
            story=(
                "Instagram posts such as the Maidmer hybrid print announcement show a long-running character-illustration practice.\n\n"
                "GIPHY hosts a vivalaladybug channel with millions of views on animated stickers.\n\n"
                "vivalaladybug.com is referenced on GIPHY—verify live domain content.\n\n"
                "No LinkedIn or agency biography surfaced in the quick search pass."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            ig_posts="https://www.instagram.com/vivalaladybug/p/B70QSHflH6t/",
            sources=(
                "https://giphy.com/channel/vivalaladybug/\n"
                "https://www.instagram.com/vivalaladybug/\n"
                "https://thestreetcollector.com/collections/vivaladybug"
            ),
            notes="Sparse CV; confirm artist legal name before contracts.",
        ),
        "Iain Macarthur": A(
            artist_name="Iain Macarthur",
            ig="@iain.macarthur",
            location="London, United Kingdom",
            active_since="Self-employed illustrator since Jan 2009 (LinkedIn)",
            hero_hook=(
                "London illustrator Iain Macarthur (@iain.macarthur): LinkedIn cites freelance since 2009; Nike, HBO, Wired named; Lürzer’s Archive 200 Best mention on directory site."
            ),
            story=(
                "LinkedIn summarizes Macarthur’s surreal, pattern-rich pencil work for Nike, Pepsi, HBO, Johnnie Walker, Wired, and other clients since 2009.\n\n"
                "iainmacarthur.com hosts portfolio and contact data.\n\n"
                "Directory of Illustration notes Lürzer’s Archive 200 Best Illustrators selection for 2016/17.\n\n"
                "Behance @iainmac remains a major archive with six-figure project views."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="Directory of Illustration — — Listing — https://www.directoryofillustration.com/artist.aspx?AID=10894",
            sources=(
                "https://www.iainmacarthur.com/\n"
                "https://linkedin.com/in/iain-macarthur-1a93a627\n"
                "https://www.directoryofillustration.com/artist.aspx?AID=10894\n"
                "https://www.behance.net/iainmac\n"
                "https://www.instagram.com/iain.macarthur/\n"
                "https://thestreetcollector.com/collections/iain-macarthur"
            ),
            notes="",
        ),
        "Igor Mikutski": A(
            artist_name="Igor Mikutski",
            ig="@igor.mikutski",
            location="",
            active_since="",
            hero_hook=(
                "Painter Igor Mikutski (@igor.mikutski): public Instagram reel captions describe acrylic-on-paper scale; no verified biography site found in search pass."
            ),
            story=(
                "Search-indexed Instagram reels show large acrylic-on-paper paintings with figurative and conflict-themed hashtags.\n\n"
                "No authoritative interview, gallery rep page, or personal domain was retrieved in the automated search pass.\n\n"
                "Avoid inventing education, city, or exhibition history until a primary CV appears.\n\n"
                "Use direct messages or gallery representation links from bio when available."
            ),
            pull_quote="",
            impact="",
            exclusive="",
            exhibitions="",
            press="",
            sources=(
                "https://www.instagram.com/igor.mikutski/\n"
                "https://thestreetcollector.com/collections/igor-mikutski"
            ),
            notes="Mostly empty pending primary bio beyond Instagram.",
        ),
    }

    return FILE2, FILE3, FILE4
