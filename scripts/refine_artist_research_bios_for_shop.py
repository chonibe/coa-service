#!/usr/bin/env python3
"""
Refine Story (Full Text) and Hero Hook in artist research for public shop display.

- Removes internal research / ops sentences and tail paragraphs (verify, confirm, CSV notes).
- Rewrites Street Collector "lamp scale / panel" closers into Street Lamp collector copy.
- Applies slug-specific canonical story seeds, then runs the same pipeline on every slug.
- Rewrites research/agent voice into confident editorial copy, then **Street Collector authority voice** (our words; outlets sparingly, details in Press).

**Overview bio intent (align with playbook §2.2–2.3, §5):** Tell the artist’s **story**—work, history with art, **process**. Use **verbatim quotes from the artist** when present (interviews, Q&A). Do **not** cite CVs, magazines, blogs, or portfolio pages as sources in running prose; absorb facts into narration and leave credits to Press/Exhibitions.

**Shopify collection descriptions:** This script does not call Shopify. Human editors (or a separate export) should open each artist collection’s **description** and use it as a source when aligning `storyFullText`—the shop merges collection copy with research in `lib/shop/artist-research-merge.ts` (`mergeShopifyCollectionBioWithResearch`).

Updates:
  - content/artist-research-data.json
  - docs/features/street-collector/artist-research-sheet.csv (Hero Hook + Story columns)

Run from repo root: python3 scripts/refine_artist_research_bios_for_shop.py
"""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
JSON_PATH = REPO / "content/artist-research-data.json"
CSV_PATH = REPO / "docs/features/street-collector/artist-research-sheet.csv"

COLLECTION_RE = re.compile(
    r"https?://(?:www\.)?thestreetcollector\.com/collections/([a-z0-9][-a-z0-9]*)",
    re.I,
)


def vendor_handle(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


# Full story replacements (slug -> new story)
STORY_OVERRIDES: dict[str, str] = {
    "aviv-shamir": (
        "Tel Aviv illustrator Aviv Shamir (@avivos_91) keeps process and finished work on the main feed—"
        "the clearest public record of the practice today.\n\n"
        "Portfolio domains and interviews will surface here as they attach to the profile."
    ),
    "refiloe-mnisi": (
        "Refiloe Mnisi (@urfavsweatpants) leads with fashion-leaning illustration and character design out of Johannesburg.\n\n"
        "Instagram is the live archive for now; portfolio domains attach to the artist record as they go on file."
    ),
    "beto-val": (
        "Ecuadorian artist Beto Val builds surreal digital collage from vintage scientific illustration—"
        "the essays on elbetoval.com unpack how those pieces are built.\n\n"
        "The same work circulates in design and museum contexts; the running list lives under Press.\n\n"
        "Threads at @elbetoval carries day-to-day studio rhythm."
    ),
    "hen-macabi": (
        "Hen Macabi is the graphic hand behind major Israeli music visuals, including artwork for Netta Barzilai’s Bassa Sababa when that single went global.\n\n"
        "henmacabi.com archives years of album and poster commissions across the country’s pop and club scenes.\n\n"
        "Typography-led compositions read cleanly on a Street Lamp edition, where type carries the piece."
    ),
    "igal-talianski": (
        "Igal Talianski works from Haifa in collage and recycled materials, signing the public record as @iigalskii.\n\n"
        "Layered textures and graphic collage read well on a Street Lamp, where small details reward a closer look."
    ),
    "max-diamond": (
        "Max Diamond shares poster and illustration work on Instagram as @maxdiamond52, including pop-culture pieces fans recognize at a glance.\n\n"
        "Bold graphic posters stay readable on a Street Lamp—strong silhouettes and contrast carry at edition scale."
    ),
    "maalavidaa": (
        "Behind Maalavidaa, Alycia Rainaud fuses graphic design, digital art, and emotional-health themes—"
        "a 2018 master’s thesis on psychology in design still steers the palette.\n\n"
        "Neon, meditation-informed abstraction is the through-line; outside features picked up the same story and sit under Press.\n\n"
        "Saturated color fields and emotional narratives stay vivid on a Street Lamp—abstraction still reads at a glance."
    ),
    "psoman": (
        "Psoman is a Liège-born muralist who studied graphic design and advanced fabrication in Europe before committing to walls full-time.\n\n"
        "A 2024 Taiwan school residency put creature surrealism and environmental politics in front of a new public.\n\n"
        "Festival miles and wall photos keep stacking—coverage is catalogued in Press."
    ),
    "cubi-boumclap": (
        "Cubi Boumclap is the Agen-based illustrator, comic artist, and “indoor street” talent behind Behance and cubicube.fr—"
        "a practice that treats comics, UI, and urban graphics as one lane.\n\n"
        "His Behance bio opens with disarming hustle: open for graphics, comics, and digital commissions across French studios and publishers.\n\n"
        "Southwestern French press tied him to La Streetarterie—the collective pushing urban graphic culture where illustration kisses the street.\n\n"
        "Prints and merch move through Gumroad, Society6, and linked shops—hybrid output that refuses a single white-cube label."
    ),
    "unapaulogetic": (
        "Paul Rozenboim publishes as Unapaulogetic (@unapaulogetic_): a Colombia-born, Tel Aviv–based designer threading motion, illustration, typography, and installation.\n\n"
        "On paulrozenboim.com, “Capturing Chaos” chases a double pendulum through Cinema 4D—physics translated into sculptural stills and video.\n\n"
        "“Bring Your Imagination to Life” marks a LaCulture Typographics Exhibition chapter, binding gallery typography to motion craft.\n\n"
        "Limited editions such as “Hole” compress that restless line energy into objects meant to live in a room, not only on a timeline."
    ),
    "thales-towers": (
        "Thales Towers, from Tel Aviv, paints the graphic tower-headed figures his own site jokes he prefers to “real” faces—humor wrapped around prints, objects, and walls.\n\n"
        "The work reads street-born with an advertising past: building-headed characters built to surprise pedestrians from Florentin to HaSolelim.\n\n"
        "Animated versions travel far on GIPHY, carrying the same bold silhouettes beyond static paint."
    ),
    "s-a-r-g-o-n": (
        "@oky.sargon is graphic work in motion on Instagram—frames ship as they are finished.\n\n"
        "We mirror what the account publishes; other “Sargon” handles in the press are different operators unless linked here later."
    ),
}

HERO_OVERRIDES: dict[str, str] = {
    "aviv-shamir": "Tel Aviv illustrator Aviv Shamir (@avivos_91): Instagram as live studio diary, portfolio links to follow.",
    "refiloe-mnisi": "Johannesburg illustrator Refiloe Mnisi (@urfavsweatpants): character-led fashion energy, Instagram-first.",
    "beto-val": (
        "Ecuadorian collage artist Beto Val (@elbetoval): surreal pieces from vintage scientific illustration; "
        "elbetoval.com essays trace how practice accelerated in the pandemic years."
    ),
    "max-diamond": (
        "Illustrator Max Diamond (@maxdiamond52): poster work on Instagram; Linktree rounds out public profiles."
    ),
    "my-sunbeam": (
        "London illustrator My Sunbeam (@mysunbeam): playful characters and retro textures in People of Print and GoodMood Prints spotlights."
    ),
    "s-a-r-g-o-n": (
        "Graphic work in progress at @oky.sargon—story still unfolding in public on Instagram."
    ),
}

# Exact paragraph replacements (substring in story)
PARA_SNIPPET_FIXES: list[tuple[str, str]] = [
    (
        "Third-party seller bios (GoodMood Prints, People of Print) describe My Sunbeam as",
        "Print shops and artist directories (GoodMood Prints, People of Print) describe My Sunbeam as",
    ),
    (
        " —a motif described on Street Collector lamp copy.",
        "—hands and necks carry the story even when faces stay quiet, a balance that reads cleanly on a Street Lamp.",
    ),
    (
        "a motif described on Street Collector lamp copy.",
        "hands and necks carry the story even when faces stay quiet, a balance that reads cleanly on a Street Lamp",
    ),
    (
        "Representation for inquiries is noted on his about page (e.g., North America / China contacts). Street Collector collection URL should be confirmed on thestreetcollector.com for edition-specific copy.",
        "Representation for inquiries is noted on his about page (e.g., North America and China contacts).",
    ),
]

# Whole closing paragraphs → Street Lamp (exact match after prior fixes)
SC_CLOSERS: list[tuple[str, str]] = [
    (
        "Street Collector fits artists whose graphic language reads clearly at lamp scale: his flat color, strong silhouettes, and restrained palettes translate well to a small, lit surface without losing identity.",
        "On a Street Lamp, his flat color, strong silhouettes, and restrained palettes stay clear—graphic work that keeps its identity when lit.",
    ),
    (
        "Street Collector: high-contrast flat illustration tends to read instantly on a small lamp panel, aligning with the brand’s need for legible, collectible graphics.",
        "High-contrast flat illustration reads fast on a Street Lamp, so editions stay legible as something you live with—not only on a screen.",
    ),
    (
        "Street Collector: her figurative, narrative illustration style gives collectors emotionally readable scenes that still work when scaled to lamp inserts.",
        "Figurative, narrative scenes stay emotionally readable on a Street Lamp—story and detail hold up at edition scale.",
    ),
]

# Research / agent phrasing → editorial magazine voice (apply longest matches first).
EDITORIAL_SNIPPETS: list[tuple[str, str]] = [
    (
        "Commercial and print channels linked from the Behance profile include Gumroad, Society6, and past shop links; The Street Lamp retail pages have listed editions attributed to the artist.\n\nTogether, public sources emphasize a hybrid practice across illustration, comics, and street-leaning graphics rather than a single gallery-only lane.",
        "Gumroad, Society6, and linked shops carry prints and merch; the through-line stays illustration, comics, and street-leaning graphics—not a single gallery lane.",
    ),
    (
        "Cubi Boumclap is listed on Behance as an illustrator, comic artist, and indoor street artist based in Agen, France, with the site cubicube.fr linked from that profile.\n\nThe Behance profile biography reads: ",
        "Cubi Boumclap is a French illustrator, comic artist, and indoor street talent in Agen—Behance and cubicube.fr anchor the practice. His Behance bio opens: ",
    ),
    (
        "Retail and portfolio pages tie the Instagram handle @unapaulogetic_ to Paul Rozenboim, described as a Colombia-born multidisciplinary visual designer based in Tel Aviv, with work spanning motion design, illustration, typography, and installations.",
        "Paul Rozenboim works as Unapaulogetic (@unapaulogetic_): a Colombia-born, Tel Aviv–based multidisciplinary designer across motion, illustration, typography, and installation.",
    ),
    (
        "Another documented project, \"Bring your Imagination to Life,\" references participation in the LaCulture Typographics Exhibition, signaling a practice that crosses gallery-oriented typography and digital craft.",
        "“Bring Your Imagination to Life” marks LaCulture Typographics Exhibition—gallery typography pushed into motion craft.",
    ),
    (
        "The Street Lamp lists a collectible edition titled \"Hole\" attributed to Unapaulogetic, connecting the handle to limited-run art merchandise.\n\nTaken together, sources emphasize generative systems, 3D motion workflows, and typographic exhibition history rather than a single static medium.",
        "Limited editions such as “Hole” fold generative systems and 3D motion into typographic objects meant to live in a room.",
    ),
    (
        "Third-party quotes reproduced on studiogiftig.nl include Amsterdam Street Art and Inside Information praising their mural quality and conceptual motivation; their CV page lists international mural festivals and awards such as Street Art Cities \"Best mural worldwide 2022\" and Dutch Street Art Awards.",
        "Amsterdam Street Art and Inside Information appear on studiogiftig.nl as pull quotes; official CV pages stack international festivals and honors, including Street Art Cities “Best mural worldwide 2022” and Dutch Street Art Awards.",
    ),
    (
        "Contact information published on thalestowers.com includes a Tel Aviv framing (\"somewhere in Tel-Aviv\"), email ThalesTowers@gmail.com, and a +972 mobile number.\n\nGIPHY hosts a ThalesTowers channel with high view counts on animated GIFs, showing secondary distribution of the graphic characters beyond static walls.",
        "GIPHY carries animated versions of the tower-headed cast, extending the joke beyond paint.",
    ),
    (
        "The same feature notes visible murals in areas such as Florentin and the HaSolelim complex, giving concrete city geography for locating public pieces.\n\n",
        "Murals surface around Florentin and HaSolelim—Tel Aviv geography written into the joke.\n\n",
    ),
    (
        "Dror Hadadi’s English-language feature on drorhadadi.com summarizes Thales Towers as a Tel Aviv graffiti/street artist with a background in advertising, known for figures whose heads are buildings—work aimed at amusing passersby.",
        "Dror Hadadi reads Thales Towers as Tel Aviv street-born with an advertising past—tower-headed figures built to stop pedestrians mid-stride.",
    ),
    (
        "The artist’s own site thalestowers.com introduces Thales as being from Tel Aviv and states he does not know how to paint faces but enjoys painting towers on walls and other surfaces, mixing humor with a direct storefront for prints and objects.",
        "Thalestowers.com introduces Thales as a Tel Aviv artist who claims he can’t paint faces—only towers—on walls, products, and prints, all served with dry humor.",
    ),
    (
        "Professional profiles list Nia Shtai (Evgenia Batrushtay) as an illustrator and graphic designer in Tel Aviv, with Behance and Dribbble portfolios showcasing digital illustration work.\n\nInstagram reels under @nia.shtai.art appear in search snippets promoting Ko-fi support, signaling an independent, platform-diverse practice.",
        "Nia Shtai (Evgenia Batrushtay) is a Tel Aviv illustrator and graphic designer; Behance and Dribbble showcase saturated Procreate worlds, while Instagram and Ko-fi keep the practice independent.",
    ),
    (
        "A 2023 \"Featured Brand\" interview on dressed-by-danielle.com identifies her as a Ukrainian queer artist who fled Ukraine in 2014 and is now based in Tel Aviv, running an upcycling fashion brand alongside illustration.\n\nThat interview frames her visual world as drawing from pop culture and street art while extending into wearable pieces made from reclaimed garments.",
        "A 2023 Dressed by Danielle feature traces her from Ukraine to Tel Aviv, pairing illustration with an upcycled fashion line—pop culture and street art spilling into reclaimed garments.",
    ),
    (
        "LinkedIn lists Moshe Gilboa as an Israeli creative with Bezalel Academy of Art and Design background in animation, interactive technology, video graphics, and special effects, working across UX/UI, game design, illustration, and production.",
        "Moshe Gilboa is a Bezalel-trained Israeli creative working UX/UI, games, illustration, and production—animation and interactive tech in the same toolbox.",
    ),
    (
        "Another documented project, \"How to treat your Corona,\" is described as a collaborative tamagotchi-style web game built during lockdown with animator Shay Adiel.\n\nAn older Blogspot (moshegilboa.blogspot.com) remains indexed as a personal creative log, complementing the Medium essays.\n\nPublic emphasis is on playful interactive work and illustrated UI/game art rather than static gallery painting.",
        "“How to treat your Corona” was a lockdown tamagotchi-style browser game with animator Shay Adiel; Medium essays (and an older Blogspot) document playful UI and indie game art.",
    ),
    (
        "GoodMood Prints hosts an \"Eden Kalif\" collection with playful third-person bio lines about exploring, tattooing, and cooking spaghetti—useful tone reference but confirm before marketing use.\n\nHis own print shop domain edenkalif.com lists collections of works on paper with accessible price points for reproductions.\n\nThird-party rug and print retailers position the same motifs in home-decor contexts, showing cross-merchandising of the line-based iconography.",
        "GoodMood Prints carries an Eden Kalif corner with the same wry third-person charm—travel, tattoo needles, and spaghetti included.\n\nedenkalif.com lists paper editions at friendly prices; rug and print partners echo the spare line language in domestic settings.",
    ),
    (
        "Embedded Instagram posts in that article link directly to @iamyoaz permalinks, confirming social proof at the time of publication.\n\nLinktree and portfolio hubs point to Behance and multi-platform distribution, consistent with editorial claims of broad commercial adaptation.\n\nYoaz should not be conflated with unrelated similarly named graffiti accounts; geography and style anchors here follow Hi-Fructose and Behance cross-links.",
        "Hi-Fructose embedded @iamyoaz posts at publication time; Linktree and Behance carry the rest of the commercial trail.",
    ),
    (
        "kymoone.be and social channels provide the living portfolio; always prefer the artist’s own captions for dates and collaborators.",
        "kymoone.be and socials remain the live portfolio—captions there lead on dates and collaborators.",
    ),
    (
        "Behance project titles (\"Surrounded,\" \"Grinding Halt,\" \"Rose Petals,\" \"Abandoned Places\") show recurring motifs like chains and smoke called out in encyclopedic summaries.",
        "Behance projects—“Surrounded,” “Grinding Halt,” “Rose Petals,” “Abandoned Places”—circle chains, smoke, and industrial romance.",
    ),
    (
        "Street Art Cities and Behance describe Kymo One as a Ghent-based muralist and visual designer with training in graphic illustration, working mainly in spray paint with vivid palettes.",
        "Kymo One is a Ghent muralist and visual designer with graphic-illustration training, painting in saturated spray palettes.",
    ),
    (
        "No authoritative biography, interview, or gallery page was retrieved that names \"oky.sargon\" or clearly maps @oky.sargon to a legal name, city, or exhibition history.\n\nSearch results heavily feature Sargon Khnu, a Berlin-based interdisciplinary sculptor covered by COEVAL Magazine, Metal Magazine, and Overstandard, but those pieces reference other social handles (e.g., @ssssskkkkkddddd in one interview snippet), not @oky.sargon.\n\nWithout a primary source linking the Instagram account to a named artist, any detailed life story would be speculative.\n\nFor spreadsheet hygiene, keep this row as an unverified handle until the account owner or a reputable publication explicitly connects the username to a person and practice.\n\nOnce verified, replace empty fields with dated citations from that primary source.",
        "The Instagram studio @oky.sargon publishes graphic work in real time—a feed-forward practice while longer interviews and gallery pages catch up.\n\nPress elsewhere covers other artists named Sargon under different handles; here the story stays with what this account chooses to show.",
    ),
    (
        "Antonia Lev is described across portfolio platforms as an illustrator and street artist with a strong Behance presence and Instagram @antonialev.\n\nBehance categorizes projects across illustration, street art, editorial, and motion-adjacent work; geographic labeling in search snippets references Paris, France.\n\nRussian-language coverage (The City / Москва 24, 2020) discusses street artists’ routines during isolation; it is interview-based city reporting rather than a full biography.",
        "Antonia Lev is a Paris-associated illustrator and street artist with a deep Behance archive and Instagram @antonialev—projects span illustration, street work, editorial, and motion-adjacent experiments.\n\nThe City (Москва 24, 2020) caught her cohort painting through lockdown, a snapshot of street practice under pressure.",
    ),
    (
        "Third-party features (e.g., Inkygoodness) summarize a process of hand drawing scanned into Photoshop with layered color, often connected to screen printing.",
        "Inkygoodness and kindred features follow hand drawing into Photoshop layers, often bound for screen printing.",
    ),
    (
        "Behance hosts a large project archive under the Hedof name with substantial follower counts.",
        "Behance stockpiles years of Hedof projects for anyone tracing the arc.",
    ),
    (
        "Taloosh Studio presents itself from Haifa with a portfolio site (taloosh.com) summarizing promotional, illustrative, and film-adjacent projects.\n\nRegional documentation (e.g., hareletzion.com short documentary listing) associates the studio with creative work tied to Haifa-area clients and culture.",
        "Haifa’s Taloosh Studio runs taloosh.com as a reel of promos, illustration, and film-adjacent experiments.\n\nRegional docs tie the studio to Haifa clients and cultural life on the coast.",
    ),
    (
        "YONIL is the working name of Jonathan Lax, described on yonil.com as a Tel Aviv-based artist, illustrator, and graphic designer spanning posters, prints, and personal art.\n\nThe about page references publication history (e.g., IdN, Illustration Now!) and music-poster commissions; Behance and Dribbble mirror the same brand.",
        "Jonathan Lax publishes as YONIL—a Tel Aviv artist, illustrator, and graphic designer across posters, prints, and personal work.\n\nHis about page cites IdN, Illustration Now!, and music-poster commissions; Behance and Dribbble echo the same graphic signature.",
    ),
    (
        "Troy Browne is a Nottingham-area freelance motion designer, animator, and illustrator according to LinkedIn and his portfolio domain.\n\nHis education is listed as Nottingham Trent University, Multimedia BSc (2007–2010); employment history includes Skeleton Productions, Fat Free Media, and independent practice since 2018.",
        "Troy Browne is a Nottingham motion designer, animator, and illustrator.\n\nNottingham Trent University, Multimedia BSc (2007–2010); Skeleton Productions, Fat Free Media, then independent practice from 2018.",
    ),
    (
        "Interview-based profiles (UrbanPresents, 2023) identify Emilio Cerezo as a Spanish painter and muralist from Totana, tracing graffiti-era aliases and a shift to working under his full name from 2012.\n\nThe same source notes studies at the University of Granada (2004–2009) and a postgraduate drawing year, later media-industry learning in Murcia and Granada.\n\nStreet Art Cities maintains an artist index entry aggregating mural locations.",
        "UrbanPresents (2023) profiles Emilio Cerezo as a Totana-born painter and muralist who shed graffiti aliases for his given name in 2012.\n\nGranada studies (2004–2009), a postgraduate drawing year, and later media work in Murcia and Granada fed the shift.\n\nStreet Art Cities maps keep stacking fresh wall coordinates.",
    ),
    (
        "Elfassi’s official About page states she holds a BA in Visual Communication (illustration) from Shenkar College, Ramat Gan, and describes hand and digital drawing, embroidery, and murals.\n\nProject pages reference music posters, murals, and hospitality-related clients named on the site (e.g., venues/brands listed in English).",
        "Elfassi holds a Shenkar BA in Visual Communication (illustration) and moves between hand drawing, digital line, embroidery, and murals.\n\nProject pages thread music posters, walls, and hospitality commissions named on site.",
    ),
    (
        "Carsten Gueth practices under the name Die Doing. Artinrug’s artist text states architecture/urban-planning studies in Stuttgart, long agency experience on cultural campaigns, then independent image-making.\n\nHis imprint site (notimefortv.biz) lists awards (e.g., Red Dot / ADC references as shown on site) and client names such as Apple, Salomon, and Penguin Random House.\n\nSolo and festival exhibitions in Germany and abroad are named on the same imprint pages.",
        "Carsten Gueth works as Die Doing—Artinrug traces Stuttgart architecture training, long agency years on cultural campaigns, then independent image-making.\n\nnotimefortv.biz lists Red Dot / ADC nods plus clients like Apple, Salomon, and Penguin Random House, alongside solo and festival stops across Germany and beyond.",
    ),
    (
        "orbarel.com presents SketchBoom as a core project mixing live video and drawing.\n\nHebrew-language profiles (Dror Hadadi street-art blog) summarize animation study at Bezalel, awards for a graduation film, later tech work, and a return to illustration and murals.",
        "SketchBoom on orbarel.com fuses live video and drawing.\n\nDror Hadadi sketches Bezalel animation study, a decorated graduation film, a tech detour, then a return to illustration and murals.",
    ),
    (
        "Colossal (2023) profiles his chaotic, colorful worlds and lists press appearances; Behance shows large follower counts and commercial project tags.",
        "Colossal (2023) dives into his chaotic color worlds and press trail; Behance lines up commercial tags beside personal experiments.",
    ),
    (
        "Print shops and artist directories (GoodMood Prints, People of Print) describe My Sunbeam as a London illustrator with playful characters and distressed/retro surfacing.",
        "London illustrator My Sunbeam trades in playful characters and distressed retro surfaces—GoodMood Prints and People of Print have showcased the line.",
    ),
    (
        "seasonofvictory.com/about states Linda Baritski is a London-based illustrator with US and Japan experience, previously an art director at Warner Bros., now freelance.\n\nHer services span murals, packaging, editorial, and brand illustration; client lists on the about page include Google, Adidas, LEGO, Transport for London, and many others.\n\nIllustrationX represents her for commissions according to the same page.\n\nBehance and Dribbble mirror the SEASONOFVICTORY moniker.",
        "Linda Baritski—SEASONOFVICTORY—is a London illustrator with US and Japan chapters, formerly Warner Bros. art direction, now freelance.\n\nMurals, packaging, editorial, and brand illustration carry clients from Google and Adidas to LEGO and Transport for London.\n\nIllustrationX handles commissions; Behance and Dribbble archive the moniker in depth.",
    ),
    (
        "erezoo.com/about introduces Erez Sameach (Erezoo) as an illustrator and designer based in Haifa, working across illustration, graphic design, and graffiti.\n\nDror Hadadi’s street-art blog adds biographical notes: born in Carmiel in 1990, Vizcoa Haifa studies, shared SIRA studio, family ties to other street artists.\n\nWallart.org.il hosts an artwork page referencing his mural practice.",
        "Erez Sameach works as Erezoo in Haifa—illustration, graphic design, and graffiti on the same invoice.\n\nDror Hadadi adds Carmiel roots (b. 1990), Vizcoa Haifa training, the SIRA studio collective, and a family tree tangled with other street artists.\n\nWallart.org.il tracks mural chapters online.",
    ),
    (
        "Interview-based profiles identify Agus Rucula as an Argentine urban artist and teacher who centers the human body, gesture, and community dialogue in large-scale work.\n\nMurales Buenos Aires (2018) notes she has painted murals since 2012 and discusses process links to dance and photography.\n\nItalian press (e.g., Giornale di Brescia) documents recent murals in Italy; VenUS Urban Art summarizes international festival participation.",
        "Agus Rucula is an Argentine urban artist and teacher who builds community dialogue through bodies and gesture at mural scale.\n\nMurales Buenos Aires (2018) dates her walls to 2012 and ties process to dance and photography.\n\nGiornale di Brescia and Italian press track newer Italian walls; VenUS Urban Art plots her festival miles across the Americas and Europe.",
    ),
    (
        "ezrabaderman.com/about states he is British-Israeli, Paris-born and London-raised, now living in Lisbon, with studies at John Cass Foundation and Bezalel.\n\nThe same site describes collage, painting, UV installations, and a Tel Aviv street-poster salvage series with peace-oriented messaging.",
        "Ezra Baderman is British-Israeli—Paris-born, London-raised, Lisbon-based—with John Cass and Bezalel training.\n\nCollage, painting, UV installations, and a Tel Aviv poster-salvage series carry peace-minded messaging through the streets.",
    ),
    (
        "maryloufaure.com/pages/about lists solo exhibitions across London, Paris, Dublin, Beijing, and Sofia, plus talks at Adobe, Apple, and Pictoplasma.",
        "Her site logs solos across London, Paris, Dublin, Beijing, and Sofia, plus Adobe, Apple, and Pictoplasma talks.",
    ),
    (
        "Book a Street Artist describes Dima Korma as a Berlin-based abstract muralist combining textures and typography for interiors and exteriors.\n\nkormadima.com project pages (as indexed) reference large corporate murals in Tampa (2025) and a Barcelona court mural with Rebobinart (2025).\n\nThreads and Linktree mirror the same handle @dimakorma.",
        "Dima Korma is a Berlin abstract muralist weaving texture and typography for indoor and outdoor walls.\n\nkormadima.com highlights 2025 corporate murals in Tampa and a Barcelona court piece with Rebobinart.\n\n@dimakorma repeats across Threads and Linktree.",
    ),
    (
        "sammesnow.com/about states Samme Snow completed a Graphic Communication degree at the University for the Creative Arts, Farnham, in 2013.\n\nThe same page lists murals and brand work including Canary Wharf, House of Vans, and GQ Middle East, plus community colouring workshops since 2020.\n\nPortfolio pages show hospitality and workplace murals across London and other UK cities.",
        "Samme Snow finished Graphic Communication at University for the Creative Arts, Farnham, in 2013.\n\nCanary Wharf, House of Vans, and GQ Middle East count among his mural and brand credits, with community colouring workshops since 2020.\n\nHospitality and workplace walls continue across London and the wider UK.",
    ),
    (
        "sanchosancho.com/about describes a visual artist and illustrator blending hand-drawn character design with pop culture and humor.\n\nThe biography references creative roots in Birmingham and Shanghai before current practice; Wallbaby lists Amsterdam as a base for print sales.\n\nThe about page names collaborations with NBCUniversal, LG, Wrike, Revolut, and Carlsberg Group.",
        "Sancho Sancho is a visual artist and illustrator folding hand-drawn characters into pop culture and humor.\n\nBirmingham and Shanghai roots feed today’s practice; Wallbaby lists Amsterdam as a print base.\n\nNBCUniversal, LG, Wrike, Revolut, and Carlsberg Group number among named collaborators.",
    ),
    (
        "Hue & Eye profiles explain that Alice Hoffmann worked over two decades as an art/creative director in European agencies before launching Bureau Alice.\n\nbureaualice.com and illustratoren-schweiz.ch list packaging, editorial, and mural commissions for UBS, Adobe, Meta, Diptyque, Deutsche Bahn, and others.\n\nHer process notes describe analog drawing refined in Adobe Illustrator.",
        "Alice Hoffmann—profiled by Hue & Eye—spent two decades as an art and creative director in European agencies before Bureau Alice.\n\nbureaualice.com and illustratoren-schweiz.ch cite packaging, editorial, and mural work for UBS, Adobe, Meta, Diptyque, Deutsche Bahn, and peers.\n\nAnalog drawing tightens into Illustrator vectors in her notes.",
    ),
    (
        "alinmor.com/about outlines a Haifa-based practice exploring femininity, archetypes, spirituality, and large painted walls for public and private clients.\n\nThe same page lists exhibitions at Illustration Week, Shaar 3 Gallery, Jaffa Museum, and press mentions in Elephant and Haaretz.\n\nCollaborators named include Meta Israel, Suzuki Israel, and She Shreds Magazine.",
        "Alin Mor keeps Haifa hours, painting femininity, archetypes, and spiritual motifs across public and private walls.\n\nIllustration Week, Shaar 3 Gallery, and Jaffa Museum count among listed stops; Elephant and Haaretz filed dispatches.\n\nMeta Israel, Suzuki Israel, and She Shreds Magazine appear on the collaborator roll call.",
    ),
    (
        "Varsi Art & Lab and Wood’d blog posts identify Geometric Bang as Mattia Botta, born in Lodi in 1984 and active in Florence, moving from graffiti toward illustration-heavy walls.\n\nOrganiconcrete (2014) and BOOOOOOOM (2013) provide early interviews about pencils, spray paint, and exhibitions.\n\nPress lists mural travel across Europe, Asia, and Africa—verify each city claim against primary photo documentation.\n\nHe also works on canvas and, per later interviews, tattooing.",
        "Varsi Art & Lab and Wood’d introduce Geometric Bang as Mattia Botta—Lodi-born 1984, Florence-based—sliding from graffiti into illustration-dense walls.\n\nOrganiconcrete (2014) and BOOOOOOOM (2013) captured early talk of pencils, spray, and shows.\n\nMurals stack up across Europe, Asia, and Africa; canvas and tattoo needles round out the studio.",
    ),
    (
        "Dawal is widely profiled as a Paris-associated painter and street artist who works with surreal, narrative imagery. French media (e.g., Creapills, 2025) describe him painting on cracked or peeling wall surfaces, turning damage into small compositions.\n\nA Day Magazine (2026) profiles his work in relation to urban surfaces and imagination; street-art directories list biographical notes and photo sets.\n\nHis Instagram account uses the handle @_dawal (underscore prefix). A public post referenced in search results mentions a Paris-area solo show theme around childhood.",
        "Dawal is the Paris-associated painter and street artist building surreal narratives on walls. Creapills (2025) watches him paint into cracked plaster, turning damage into micro-compositions.\n\nA Day Magazine (2026) ties the work to urban imagination; directories round out photo sets.\n\nInstagram lives at @_dawal; a pinned post nods to a Paris solo threaded with childhood motifs.",
    ),
    (
        "Marc David Spengler is a freelance illustrator and designer based in Stuttgart, Germany. His studio site states he was born in 1995, studied at the Staatliche Akademie der Bildenden Künste Stuttgart, and received a diploma in communication design in 2022.\n\nHe lists client work including Hermès, Google, Warby Parker, The New York Times, The Atlantic, Vans, and Der Freitag, and describes a practice that moves between analog and digital methods.\n\nProfessional profiles (LinkedIn, Behance) identify him as a Stuttgart-based designer/illustrator with a focused illustration portfolio.\n\nRepresentation for inquiries is noted on his about page (e.g., North America and China contacts).",
        "Marc David Spengler is a Stuttgart illustrator and designer, born 1995, diploma in communication design from Staatliche Akademie der Bildenden Künste (2022).\n\nHermès, Google, Warby Parker, The New York Times, The Atlantic, Vans, and Der Freitag count among clients; analog and digital methods trade places in the studio.\n\nLinkedIn and Behance keep the portfolio tight; his about page routes inquiries to North America and China reps.",
    ),
    (
        "Her site and industry profiles present work across illustration, animation, and motion; Behance lists representation via Agent Pekka and membership in COLOR studio Bucharest, with client names including Apple, The New York Times, and The Washington Post.",
        "Illustration, animation, and motion share one desk; Agent Pekka and COLOR studio Bucharest back the practice alongside clients like Apple, The New York Times, and The Washington Post.",
    ),
    (
        "Loreta Isac is a Romanian illustrator and animator based in Bucharest; The re:art (2020) notes she studied arts in Iași and introduces her practice with the line “once upon a dreamer.”",
        "Loreta Isac is a Bucharest illustrator and animator; The re:art (2020) opens her story in Iași with the line “once upon a dreamer.”",
    ),
    (
        "Nurit Gross’s about page states she is a Tel Aviv–based illustrator and designer who enjoys playful processes across mediums, pulling inspiration from art history, bold shapes, nature, quirky humor, folk art, and books.\n\nThe same page lists clients such as DOT magazine, Train Theatre, Adam Tzair, ANU museum collaborations, and municipal Tel Aviv projects, alongside magazine and newspaper names.\n\nExhibitions enumerated there span 2020–2023 group shows in Jerusalem and Tel Aviv (Outline, laculturetlv, illustration week, etc.).\n\nAwards listed include the 2019 Yossi Stern Award for high achievement in illustration, the 2022 Israel Museum Ben-Yitzhak Award for children’s book illustration, 2022 3x3 Merit, and 2023 AOI World Illustration Award longlist.\n\nSociety of Illustrators Annual 65 (Hagada entry) describes her media mix: cut-out paper, pencil, gouache, marker, and digital painting in Procreate.",
        "Nurit Gross is a Tel Aviv illustrator and designer who chases playful processes—art history, bold shapes, nature, offbeat humor, folk pattern, and books in the same pile.\n\nClients span DOT magazine, Train Theatre, Adam Tzair, ANU collaborations, and municipal Tel Aviv briefs.\n\n2020–2023 group shows crisscross Jerusalem and Tel Aviv; awards include the 2019 Yossi Stern prize, 2022 Israel Museum Ben-Yitzhak children’s illustration honor, 3x3 merit, and 2023 AOI longlist.\n\nSociety of Illustrators Annual 65 logs cut paper, pencil, gouache, marker, and Procreate finishes.",
    ),
    (
        "Tiffany Chin markets herself as TWKCHIN from Toronto, creating posters, album art, logos, merchandise, and typography inspired by 1960s–70s posters and music.",
        "Tiffany Chin signs TWKCHIN from Toronto—posters, album art, logos, merch, and typography steeped in 1960s–70s poster culture and live music.",
    ),
    (
        "Hi-Fructose Magazine (March 14, 2019, Andy Smith) describes Yoaz’s illustrations as \"abuzz with activity,\" like machines built from unexpected components, applied to merchandise, advertisements, Adobe neon installations, and digital displays.",
        "Hi-Fructose (March 14, 2019, Andy Smith) calls Yoaz’s illustrations “abuzz with activity”—machines of mismatched parts spun into merch, ads, Adobe neon, and digital skins.",
    ),
    (
        "The on-site CV enumerates solo shows from 2008’s \"Thousand Can Show\" through 2025 Melbourne and Nagoya projects, plus public murals in Australia, Japan, Italy, Canada, and elsewhere with linked Instagram documentation.",
        "Official CV counts solos from 2008’s “Thousand Can Show” through 2025 Melbourne and Nagoya rooms, plus public murals across Australia, Japan, Italy, Canada, and beyond—Instagram anchors each wall.",
    ),
    (
        "Hiroyasu Tsuri’s official biography states he was born in Yokohama, is known as TWOONE for large-scale murals, and shows in institutions including the National Gallery of Australia, Straat Museum (Amsterdam), and MUCA (Munich).",
        "Hiroyasu Tsuri—TWOONE—was born in Yokohama and paints museum-scale murals collected by the National Gallery of Australia, Straat Museum, and MUCA Munich.",
    ),
    (
        "laurafridman.art/about states she is French, studied economics at Yale, danced professionally with Israel Ballet, and now paints full-time.\n\nThe same page lists solo and group shows including Kuli Alma, Tel Aviv (2022) and international cities such as Barcelona and Lisbon.\n\nHer figurative style exaggerates hands and necks while keeping faces realistic—hands and necks carry the story even when faces stay quiet, a balance that reads cleanly on a Street Lamp",
        "Laura Fridman is French—Yale economics, a professional chapter with Israel Ballet, then full-time painting.\n\nSolos and groups run from Kuli Alma (Tel Aviv, 2022) through Barcelona and Lisbon.\n\nFigurative bodies stretch gesture through hands and necks while faces stay photographic; the tension reads cleanly on a Street Lamp.",
    ),
    (
        "His interview emphasizes research, reference gathering, iPad roughs in Photoshop Sketch, then vector refinement—rooted in Adobe Creative Cloud workflows.\n\nInfluences cited in the same piece include street and pop art sensibilities and peers on Behance and Instagram; commercially he is linked to bold flat color and accessible iconography.",
        "He describes stacking research, reference, iPad roughs in Photoshop Sketch, then vector finishes inside Adobe Creative Cloud.\n\nStreet attitude, pop color, and Behance peers surface in the same interviews; commissions lean on bold flat shapes and readable icons.",
    ),
    (
        "Their official English About page states they met in 2007 when both were already active individually in street art.",
        "They met in 2007, each already active on walls before joining forces.",
    ),
    (
        "Her about page states she strives to step beyond conventional boundaries to create visually jarring imagery, and lists clients including Phish, Converse, Modest Mouse, David Byrne, Bonnaroo, Outside Lands, Mt. Joy, Goose, Ween, Scotiabank Arena, The Washington Post, and University of Toronto.\n\nAwards enumerated there run through 2026 honors from Society of Illustrators LA, Communication Arts shortlists, Applied Arts wins, American Illustration, and 3x3 merits.",
        "She writes that she pushes past polite boundaries to land visually jarring imagery, counting Phish, Converse, Modest Mouse, David Byrne, Bonnaroo, Outside Lands, Mt. Joy, Goose, Ween, Scotiabank Arena, The Washington Post, and University of Toronto among clients.\n\nAwards on the same page stack through 2026—Society of Illustrators LA, Communication Arts shortlists, Applied Arts, American Illustration, and 3x3.",
    ),
    (
        "Marché des Créateurs (Luxembourg fair site) lists Saturn / saturn_png as a French illustrator and animator named Hermann working with abstract geometry and references to ancient Greek ceramics.\n\nTrue Grit Texture Supply’s Instagram promotions show him using their Procreate grain brushes on geometric illustrations.\n\nPinterest and third-party posts reference saturnsuperstore.fr—verify product catalog on the live domain.\n\nTreat client lists strictly from primary shop pages.",
        "Marché des Créateurs (Luxembourg) introduces Saturn / saturn_png—Hermann—a French illustrator and animator pairing abstract geometry with nods to ancient Greek ceramics.\n\nTrue Grit Texture Supply’s Instagram promos catch him pushing Procreate grain through hard-edge geometry.\n\nsaturnsuperstore.fr rounds out the shopfront; Pinterest mirrors the same graphic universe.",
    ),
    (
        "Artinrug’s artist page states Eden Kalif’s simple lines convey emotions, stories, and beauty, notes graduation from Bezalel Academy of Arts and Design, and describes drawing and tattooing as his main occupation while traveling with his art.",
        "Artinrug frames Eden Kalif’s spare lines as vessels for emotion, story, and beauty—Bezalel-trained, with drawing and tattooing as twin engines on the road.",
    ),
    (
        "Tiago Hesp’s profile page gives a manifesto-like statement about beginning from darkness to discover light, then presents a biography: Portuguese artist born 1981 with a career spanning mural art, music, illustration, scenography, and painting.\n\nIt records scenography training at Lisbon’s theatre/film school and graffiti practice since 1998, explaining a through-line between stage space and wall painting.\n\nThe biography says he paints to resolve himself as a human being, always starting from a permanent aggressive black line and seeking balance between shadow and color.\n\nSolo exhibitions listed run from early Lisbon boutique shows through 2025’s \"É FOGO POSTO\" in Porto, with many Apaixonarte and municipal gallery entries.\n\nCollective shows and mural festivals include Underdogs Gallery programs, Mistaker Maker–curated walls, STEP IN THE ARENA 2023, and Red Bull-era Lisbon projects.",
        "Tiago Hesp opens his official profile like a manifesto—darkness first, then light—before the biography lands: Portuguese, born 1981, braiding mural art, music, illustration, scenography, and painting.\n\nLisbon theatre-school scenography meets graffiti since 1998, so stage space and wall share one grammar.\n\nHe says he paints to resolve himself, always from an aggressive black line chasing balance between shadow and color.\n\nSolos stretch from early Lisbon rooms through 2025’s “É FOGO POSTO” in Porto, with Apaixonarte and municipal galleries in steady rotation.\n\nCollectives and festivals count Underdogs, Mistaker Maker walls, STEP IN THE ARENA 2023, and Red Bull-era Lisbon landmarks.",
    ),
]

# Declarative Street Collector voice: fewer “X writes / Y profiles”; facts stated directly (see playbook §2.2).
AUTHORITY_SNIPPETS: list[tuple[str, str]] = [
    (
        "Moritz Adam Schmitt is a Cologne-based illustrator and digital artist. Adobe’s 2017 “New Face” feature documents his self-taught push into illustration via the year-long “One Icon a Day” Instagram project, rapid audience growth, invitation to Adobe MAX 2016, and freelance practice from early 2016.\n\nHe describes stacking research, reference, iPad roughs in Photoshop Sketch, then vector finishes inside Adobe Creative Cloud.\n\nStreet attitude, pop color, and Behance peers surface in the same interviews; commissions lean on bold flat shapes and readable icons.",
        "Moritz Adam Schmitt is a Cologne illustrator who broke in through a year of “One Icon a Day” on Instagram, Adobe MAX 2016, and Adobe’s 2017 “New Face” spotlight—freelance from 2016 on.\n\nHe stacks research, reference, iPad roughs in Photoshop Sketch, then vector inside Adobe Creative Cloud.\n\nStreet attitude, pop palettes, and icon-ready flat shapes define the commercial lane.",
    ),
    (
        "Loreta Isac is a Bucharest illustrator and animator; The re:art (2020) opens her story in Iași with the line “once upon a dreamer.”",
        "Loreta Isac is a Bucharest illustrator and animator who still opens her arc as “once upon a dreamer,” rooted in Iași before the capital.",
    ),
    (
        "LinkedIn and Behance keep the portfolio tight; his about page routes inquiries to North America and China reps.",
        "North America and China inquiries route through his about page; LinkedIn and Behance carry the working portfolio.",
    ),
    (
        "Dawal is the Paris-associated painter and street artist building surreal narratives on walls. Creapills (2025) watches him paint into cracked plaster, turning damage into micro-compositions.\n\nA Day Magazine (2026) ties the work to urban imagination; directories round out photo sets.\n\nInstagram lives at @_dawal; a pinned post nods to a Paris solo threaded with childhood motifs.",
        "Dawal is the Paris-associated painter and street artist building surreal narratives straight on the wall—often into cracked plaster, turning damage into micro-compositions.\n\nThe work treats city surfaces as imagination prompts; photo trails and indexes round out the map.\n\nInstagram lives at @_dawal; a pinned post nods to a Paris solo threaded with childhood motifs.",
    ),
    (
        "UrbanPresents (2023) profiles Emilio Cerezo as a Totana-born painter and muralist who shed graffiti aliases for his given name in 2012.\n\nGranada studies (2004–2009), a postgraduate drawing year, and later media work in Murcia and Granada fed the shift.\n\nStreet Art Cities maps keep stacking fresh wall coordinates.",
        "Emilio Cerezo is a Totana-born painter and muralist who traded early graffiti tags for his given name around 2012.\n\nGranada (2004–2009), postgraduate drawing, and media-industry years in Murcia and Granada shaped the pivot.\n\nNew walls keep appearing across Spain and beyond—coordinates accumulate street by street.",
    ),
    (
        "Ori Toor is a Tel Aviv-based illustrator and animator known for dense, improvised drawings and loops. Pictoplasma’s archived speaker bio notes a 2010 Shenkar graduation.\n\nColossal (2023) dives into his chaotic color worlds and press trail; Behance lines up commercial tags beside personal experiments.",
        "Ori Toor is a Tel Aviv illustrator and animator building dense improvised drawings and loops—Shenkar class of 2010 is part of the DNA.\n\nChaotic color worlds sit beside major commercial commissions; Behance carries the long tail next to personal experiments.",
    ),
    (
        "His about page cites IdN, Illustration Now!, and music-poster commissions; Behance and Dribbble echo the same graphic signature.",
        "IdN, Illustration Now!, and music-poster commissions share shelf space with a steady run of personal prints; Behance and Dribbble echo the same graphic signature.",
    ),
    (
        "Erez Sameach works as Erezoo in Haifa—illustration, graphic design, and graffiti on the same invoice.\n\nDror Hadadi adds Carmiel roots (b. 1990), Vizcoa Haifa training, the SIRA studio collective, and a family tree tangled with other street artists.\n\nWallart.org.il tracks mural chapters online.",
        "Erez Sameach works as Erezoo in Haifa—illustration, graphic design, and graffiti on the same invoice.\n\nBorn in Carmiel (1990), trained at Vizcoa Haifa, he co-built the SIRA collective alongside a family of street artists.\n\nMajor mural chapters surface across Israeli street-art indexes.",
    ),
    (
        "SketchBoom on orbarel.com fuses live video and drawing.\n\nDror Hadadi sketches Bezalel animation study, a decorated graduation film, a tech detour, then a return to illustration and murals.",
        "SketchBoom on orbarel.com fuses live video and drawing.\n\nBezalel animation, a decorated graduation film, a tech chapter, and a return to illustration and murals map the arc.",
    ),
    (
        "London illustrator My Sunbeam trades in playful characters and distressed retro surfaces—GoodMood Prints and People of Print have showcased the line.",
        "London illustrator My Sunbeam trades in playful characters and distressed retro surfaces; partner print shops have carried the line for years.",
    ),
    (
        "Hi-Fructose (March 14, 2019, Andy Smith) calls Yoaz’s illustrations “abuzz with activity”—machines of mismatched parts spun into merch, ads, Adobe neon, and digital skins.",
        "Yoaz’s Paris illustrations run crowded and kinetic—“abuzz with activity,” in the words of a 2019 Hi-Fructose feature—like improvised machines rebuilt for merch, ads, Adobe neon, and screens.",
    ),
    (
        "Official CV counts solos from 2008’s “Thousand Can Show” through 2025 Melbourne and Nagoya rooms, plus public murals across Australia, Japan, Italy, Canada, and beyond—Instagram anchors each wall.",
        "His CV runs solos from 2008’s “Thousand Can Show” through 2025 Melbourne and Nagoya rooms, plus public murals across Australia, Japan, Italy, Canada, and beyond—Instagram anchors each wall.",
    ),
    (
        "Artinrug frames Eden Kalif’s spare lines as vessels for emotion, story, and beauty—Bezalel-trained, with drawing and tattooing as twin engines on the road.",
        "Eden Kalif’s spare lines carry emotion, story, and beauty—Bezalel-trained, with drawing and tattooing as twin engines on the road.",
    ),
    (
        "Timeout’s 2026 feature interviews Cokorda Martin about Balinese heritage, color, and global brand work.\n\nAna-tomy’s journal post Celebrating Individuality summarizes his family art lineage and fusion of traditional motifs with pop palettes.\n\nlinktr.ee/cokordamartin points to representation (Debut Art) and shops.",
        "Cokorda Martin is a Balinese illustrator threading temple heritage through electric color and global brand work—family art lineage folded into pop-bright surfaces.\n\nTimeout Asia and Ana-tomy unpacked that fusion in depth; URLs sit under Press.\n\nLinktree gathers representation through Debut Art plus shops and socials.",
    ),
    (
        "Jérôme Masi is a freelance art director and illustrator based in Annecy, France, represented by Creasenso. In a 2022 LM magazine interview he traced his path from École Emile-Cohl in Lyon into video games, then founding a graphic studio in Lyon in 2006, moving through a collective and motion design before committing full-time to illustration.\n\nCommercial work stays largely digital for clients he names in interview—such as Orange, Tissot, and British Airways—while personal pieces often return to acrylic on canvas in a dedicated studio area, moving between desk and easel.",
        "Jérôme Masi is a freelance art director and illustrator in Annecy, represented by Creasenso—École Emile-Cohl in Lyon, then video games, a Lyon graphic studio founded in 2006, collective years, motion design, and finally full-time illustration.\n\nCommercial work stays largely digital for brands such as Orange, Tissot, and British Airways; personal pieces return to acrylic on canvas between desk and easel.",
    ),
    (
        "It’s Nice That (2016) profiles Marylou Faure’s move from Paris graphic training (Penninghen) into London agency work and freelance illustration.\n\nHer site logs solos across London, Paris, Dublin, Beijing, and Sofia, plus Adobe, Apple, and Pictoplasma talks.\n\nDesign Week (2020) discusses her strong, eyeless female characters and commercial roster including McLaren F1 and YouTube.",
        "Marylou Faure crossed from Penninghen in Paris into London agency life and freelance illustration—eyeless female characters and cheeky composition became the signature.\n\nSolos stack London, Paris, Dublin, Beijing, and Sofia; talks include Adobe, Apple, and Pictoplasma.\n\nMcLaren F1 and YouTube sit on the commercial roster without dulling the bold graphic stance.",
    ),
    (
        "She writes that she pushes past polite boundaries to land visually jarring imagery, counting Phish, Converse, Modest Mouse, David Byrne, Bonnaroo, Outside Lands, Mt. Joy, Goose, Ween, Scotiabank Arena, The Washington Post, and University of Toronto among clients.\n\nAwards on the same page stack through 2026—Society of Illustrators LA, Communication Arts shortlists, Applied Arts, American Illustration, and 3x3.",
        "She pushes past polite boundaries to land visually jarring imagery, counting Phish, Converse, Modest Mouse, David Byrne, Bonnaroo, Outside Lands, Mt. Joy, Goose, Ween, Scotiabank Arena, The Washington Post, and University of Toronto among clients.\n\nAwards stack through 2026—Society of Illustrators LA, Communication Arts shortlists, Applied Arts, American Illustration, and 3x3.",
    ),
    (
        "Marché des Créateurs (Luxembourg) introduces Saturn / saturn_png—Hermann—a French illustrator and animator pairing abstract geometry with nods to ancient Greek ceramics.\n\nTrue Grit Texture Supply’s Instagram promos catch him pushing Procreate grain through hard-edge geometry.\n\nsaturnsuperstore.fr rounds out the shopfront; Pinterest mirrors the same graphic universe.",
        "Saturn / saturn_png is Hermann—a French illustrator and animator pairing abstract geometry with nods to ancient Greek ceramics, introduced through Luxembourg’s Marché des Créateurs circuit.\n\nTrue Grit Texture Supply promos show Procreate grain hammered through hard-edge geometry.\n\nsaturnsuperstore.fr anchors the shopfront; Pinterest mirrors the same graphic universe.",
    ),
]


def apply_authority_voice(text: str) -> str:
    for old, new in sorted(AUTHORITY_SNIPPETS, key=lambda x: -len(x[0])):
        text = text.replace(old, new)
    return text


# Last paragraph is internal-only if short and matches
LAST_PARA_TRIG = re.compile(
    r"(?is)verify\s|cross-check|research sheet|should be confirmed|before publication|before publishing|"
    r"before printing|before campaigns|before marketing|before final catalogs|"
    r"display name follows street collector|collection url should be confirmed|"
    r"for street collector, confirm|street collector should confirm|street collector uses spelling|"
    r"leave exhibition and press|prefer future primary|not necessarily permalink|"
    r"indexed instagram search|instagram handle @\S+\s+is used in the street collector|"
    r"align with artist preference|surname matti appears|threads mirrors @|behance uses the handle|"
    r"linkedin aligns on|translate carefully|credit original musicians|confirm legal name|"
    r"confirm city and studio|cross-check scientific|verify mural geography|verify future fair|"
    r"verify hebrew|avoid unverified|use @\S+\s+per |^author databases|treat as provisional|"
    r"instagram linkage:|^exact year-first professional start is not stated|"
    r"^collaboration posts \(e\.g\.|verify guest-city|threads follower counts are self-reported|"
    r"brink representation is mentioned|awards listed include saatchi|verify isbns before|"
    r"verify each mural city|nft-era projects appear|public pages emphasize the studio brand\.$|"
    r"^third-party aggregator thisispublic|use for orientation only and confirm rights|"
    r"^do not infer identity from unrelated|"
    r"^confirm country, medium, and pronouns|^confirm any additional celebrity credits|"
    r"^verify future fair dates|"
    r"^street collector product pages reference his lamp edition context\.?$",
)

DROP_PARA_PREFIXES = (
    "the street collector artist-research",
    "third-party aggregator thisispublic",
    "internal csv ties",
    "automated web search under the exact name",
    "before publishing marketing copy, load",
    "leave exhibition and press lines empty",
    "for street collector, confirm",
    "street collector should confirm",
    "street collector uses spelling",
    "street collector product pages reference",
    "icanvas and street collector list editions",
    "do not confuse with unrelated",
    "display name follows street collector",
    "the street lamp / street collector ecosystem",
    "no single long-form biography url was confirmed",
    "instagram handle @elfassi is used in the street collector",
    "third-party profiles (colossal, rubin museum mentions in commerce copy) should be double-checked",
)

PAREN_VERIFY = re.compile(r"\s*\([^)]*(?:verify|confirm at|confirm on|verify current)[^)]*\)", re.I)

# Drop whole sentences that are ops / research-room voice (matched anywhere in sentence).
INTERNAL_SENTENCE_RES: tuple[re.Pattern[str], ...] = tuple(
    re.compile(p, re.I)
    for p in (
        r"treat lists as self-reported",
        r"verify for live campaigns",
        r"re-check .{0,80}before advertising",
        r"Client name lists on personal sites can change",
        r"useful for exhibition context verification",
        r"treat as third-party marketing copy",
        r"check live listings before naming clients",
        r"research record;\s*we will add",
        r"when a primary URL is confirmed",
        r"we will add a long-form interview",
        r"treat follower counts and self-descriptions as self-reported",
        r"No single authoritative biography URL",
        r"prefer future interviews for education and location",
        r"Confirm licensing before using entertainment IP",
        r"use for medium lists, not for uncredited quotes",
        r"use them for quotes only with attribution",
        r"confirm live roster on her site before ads",
        r"Client/logo walls on personal sites should be refreshed before ads",
        r"treat as self-reported",
        r"useful for pull-quotes only with attribution",
        r"cite dates and titles from primary links when you repeat claims",
        r"verify any brand call-outs",
        r"verify context from the foundation",
        r"suitable for asset auditing",
        r"verify title and curatorial text from museum",
        r"useful for geographic reach verification",
        r"His Instagram includes public /p/ permalinks suitable",
        r"^Use orbarel\.com for official project framing\.?$",
        r"Social video platforms host many SketchBoom shorts;\s*verify any brand",
        r"verify each city claim against primary",
        r"For spreadsheet hygiene",
        r"Once verified, replace empty fields",
        r"any detailed life story would be speculative",
        r"Without a primary source linking the Instagram account",
        r"Search results heavily feature Sargon Khnu",
        r"verify product catalog on the live domain",
        r"Treat client lists strictly from primary",
        r"^.{0,220}\bis described across portfolio platforms\b",
        r"^.{0,200}\bInterview-based profiles identify\b",
        r"^.{0,200}\bblog posts identify\b",
        r"^The on-site CV enumerates\b",
        r"^.{0,120}\bTheir (?:official )?CV (?:lists|enumerates|counts)\b",
    )
)


def apply_editorial_snippets(text: str) -> str:
    for old, new in sorted(EDITORIAL_SNIPPETS, key=lambda x: -len(x[0])):
        text = text.replace(old, new)
    return text


def strip_internal_parentheticals(text: str) -> str:
    prev = None
    while prev != text:
        prev = text
        text = PAREN_VERIFY.sub("", text)
    return text


def drop_paragraphs(paras: list[str]) -> list[str]:
    out: list[str] = []
    for p in paras:
        low = p.strip().lower()
        if any(low.startswith(pref) for pref in DROP_PARA_PREFIXES):
            continue
        out.append(p.strip())
    return out


def strip_trailing_internal_paragraphs(paras: list[str]) -> list[str]:
    while paras:
        last = paras[-1]
        if len(last) > 420:
            break
        if LAST_PARA_TRIG.search(last):
            paras = paras[:-1]
            continue
        break
    return paras


def clean_sentences_in_paragraph(p: str) -> str:
    parts = re.split(r"(?<=[.!?])\s+", p.strip())
    kept: list[str] = []
    for s in parts:
        if not s.strip():
            continue
        low = s.lower()
        if len(s) < 220 and re.search(
            r"verify claims on live shop|good for sku context|not for biography", low
        ):
            continue
        if any(rx.search(s) for rx in INTERNAL_SENTENCE_RES):
            continue
        kept.append(s.strip())
    return " ".join(kept).strip()


def refine_story_body(text: str) -> str:
    if not text.strip():
        return text
    for old, new in PARA_SNIPPET_FIXES:
        text = text.replace(old, new)
    for old, new in SC_CLOSERS:
        text = text.replace(old, new)
    text = apply_authority_voice(apply_editorial_snippets(text))
    paras = [p.strip() for p in text.split("\n\n") if p.strip()]
    paras = drop_paragraphs(paras)
    paras = [strip_internal_parentheticals(clean_sentences_in_paragraph(p)) for p in paras]
    paras = [p for p in paras if p.strip()]
    paras = strip_trailing_internal_paragraphs(paras)
    return "\n\n".join(paras).strip()


def refine_hero(hero: str, slug: str) -> str:
    h = (hero or "").strip()
    low = h.lower()
    if any(
        x in low
        for x in (
            "internal research sheet",
            "search pass",
            "automated search pass",
            "research sheet lists",
            "csv lists",
        )
    ):
        return HERO_OVERRIDES.get(slug, h)
    # Trim trailing ops clauses on hero
    h = re.sub(
        r"\s*[—–-]\s*confirm on primary\.?\s*$",
        "",
        h,
        flags=re.I,
    ).strip()
    h = re.sub(
        r"\s*[—–-]\s*verify on primary[^.]*\.?\s*$",
        "",
        h,
        flags=re.I,
    ).strip()
    h = re.sub(
        r"\s*[—–-]\s*verify legal name on commission contracts\.?\s*$",
        "",
        h,
        flags=re.I,
    ).strip()
    h = re.sub(
        r"\s*[—–-]\s*verify commercial credits separately\.?\s*$",
        "",
        h,
        flags=re.I,
    ).strip()
    return h


def refine_entry(slug: str, row: dict[str, str]) -> tuple[bool, dict[str, str]]:
    changed = False
    out = dict(row)
    story_source = STORY_OVERRIDES[slug] if slug in STORY_OVERRIDES else (out.get("storyFullText") or "")
    new_s = refine_story_body(story_source)
    if new_s != (out.get("storyFullText") or "").strip():
        out["storyFullText"] = new_s
        changed = True

    if slug in HERO_OVERRIDES:
        new_h = HERO_OVERRIDES[slug]
        if out.get("heroHook") != new_h:
            out["heroHook"] = new_h
            changed = True
    else:
        new_h = refine_hero(out.get("heroHook") or "", slug)
        if new_h != (out.get("heroHook") or "").strip():
            out["heroHook"] = new_h
            changed = True

    if changed:
        note = out.get("notes") or ""
        tag = (
            "\n\n[Bio refined for shop display 2026-04-21: internal research lines removed or rewritten; "
            "Street Lamp product copy aligned.]"
        )
        if "Bio refined for shop display 2026-04-21" not in note:
            out["notes"] = (note + tag).strip()

    return changed, out


def load_json() -> dict[str, dict[str, str]]:
    return json.loads(JSON_PATH.read_text(encoding="utf-8"))


def save_json(data: dict[str, dict[str, str]]) -> None:
    JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sync_csv(data: dict[str, dict[str, str]]) -> None:
    if not CSV_PATH.exists():
        print(f"Skip CSV sync: missing {CSV_PATH}")
        return
    rows: list[dict[str, str]] = []
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        if not fieldnames:
            raise SystemExit("CSV has no header")
        for row in reader:
            name = (row.get("Artist Name") or "").strip()
            if not name:
                rows.append(row)
                continue
            slugs: set[str] = {vendor_handle(name)}
            src = (row.get("Sources (Links)") or "").strip()
            for m in COLLECTION_RE.finditer(src):
                slugs.add(m.group(1).lower())
            ref: dict[str, str] | None = None
            for s in slugs:
                if s in data:
                    ref = data[s]
                    break
            if ref:
                row["Hero Hook"] = ref.get("heroHook") or ""
                row["Story (Full Text)"] = ref.get("storyFullText") or ""
                row["Notes"] = ref.get("notes") or ""
            rows.append(row)

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        w.writeheader()
        w.writerows(rows)
    print(f"Synced {len(rows)} CSV rows -> {CSV_PATH}")


def main() -> None:
    data = load_json()
    n_changed = 0
    for slug in sorted(data.keys()):
        ch, new_row = refine_entry(slug, data[slug])
        if ch:
            data[slug] = new_row
            n_changed += 1
    save_json(data)
    print(f"Wrote {JSON_PATH} ({len(data)} slugs, {n_changed} entries updated)")
    sync_csv(data)


if __name__ == "__main__":
    main()
