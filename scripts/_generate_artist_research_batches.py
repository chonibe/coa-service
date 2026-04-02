#!/usr/bin/env python3
"""One-off generator for docs/dev/artist-research-*.json — run from repo root."""
from __future__ import annotations

import json
import sys
from pathlib import Path

_SCRIPTS_DIR = Path(__file__).resolve().parent
if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))

from artist_research_batches_234 import get_batches

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT = REPO_ROOT / "docs/dev"


def A(
    artist_name: str,
    ig: str,
    location: str,
    active_since: str,
    hero_hook: str,
    story: str,
    pull_quote: str = "",
    impact: str = "",
    exclusive: str = "",
    exhibitions: str = "",
    press: str = "",
    p1u: str = "",
    p1l: str = "",
    p2u: str = "",
    p2l: str = "",
    p3u: str = "",
    p3l: str = "",
    p4u: str = "",
    p4l: str = "",
    ig_posts: str = "",
    season_drop: str = "",
    edition: str = "",
    sources: str = "",
    notes: str = "",
) -> dict:
    if not (120 <= len(hero_hook) <= 180):
        raise ValueError(f"heroHook length {len(hero_hook)} for {artist_name!r}: {hero_hook!r}")
    return {
        "artistName": artist_name,
        "instagramHandle": ig,
        "location": location,
        "activeSince": active_since,
        "heroHook": hero_hook,
        "storyFullText": story,
        "pullQuote": pull_quote,
        "impactCallout": impact,
        "exclusiveCallout": exclusive,
        "exhibitionsText": exhibitions,
        "pressText": press,
        "processImage1Url": p1u,
        "processImage1Label": p1l,
        "processImage2Url": p2u,
        "processImage2Label": p2l,
        "processImage3Url": p3u,
        "processImage3Label": p3l,
        "processImage4Url": p4u,
        "processImage4Label": p4l,
        "instagramPostImageUrls": ig_posts,
        "seasonDropLabels": season_drop,
        "editionCopy": edition,
        "sourcesLinks": sources,
        "notes": notes,
    }


FILE1 = {
    "Marc David Spengler": A(
        artist_name="Marc David Spengler",
        ig="@_marcdavid_",
        location="Stuttgart, Germany",
        active_since="Studio since Oct 2015 (LinkedIn); diploma communication design 2022, Staatliche Akademie der Bildenden Künste Stuttgart (studio site)",
        hero_hook=(
            "Stuttgart illustrator and designer: State Academy diploma (2022) in communication design; "
            "Hermès, Google, Warby Parker, NYT, The Atlantic, Vans on marcdavid.studio."
        ),
        story=(
            "Marc David Spengler is a freelance illustrator and designer based in Stuttgart, Germany. "
            "His studio site states he was born in 1995, studied at the Staatliche Akademie der Bildenden Künste Stuttgart, "
            "and received a diploma in communication design in 2022.\n\n"
            "He lists client work including Hermès, Google, Warby Parker, The New York Times, The Atlantic, Vans, and Der Freitag, "
            "and describes a practice that moves between analog and digital methods.\n\n"
            "Professional profiles (LinkedIn, Behance) identify him as a Stuttgart-based designer/illustrator with a focused illustration portfolio.\n\n"
            "Representation for inquiries is noted on his about page (e.g., North America / China contacts). "
            "Street Collector collection URL should be confirmed on thestreetcollector.com for edition-specific copy."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press="",
        sources=(
            "https://marcdavid.studio/about\n"
            "https://marcdavid.studio/\n"
            "https://www.behance.net/marcspengler\n"
            "https://www.linkedin.com/in/marc-david-spengler-1202a3255\n"
            "https://thestreetcollector.com/collections/marc-david-spengler"
        ),
        notes="Hero hook clients taken from marcdavid.studio/about client list as published.",
    ),
    "Dawal": A(
        artist_name="Dawal",
        ig="@_dawal",
        location="Paris, France",
        active_since="",
        hero_hook=(
            "Paris-based painter and muralist (@_dawal): press profiles describe surreal mini-frescoes on cracked walls and "
            "studio work; Creapills and A Day Magazine covered the practice."
        ),
        story=(
            "Dawal is widely profiled as a Paris-associated painter and street artist who works with surreal, narrative imagery. "
            "French media (e.g., Creapills, 2025) describe him painting on cracked or peeling wall surfaces, turning damage into small compositions.\n\n"
            "A Day Magazine (2026) profiles his work in relation to urban surfaces and imagination; street-art directories list biographical notes and photo sets.\n\n"
            "His Instagram account uses the handle @_dawal (underscore prefix). A public post referenced in search results mentions a Paris-area solo show theme around childhood.\n\n"
            "Exact year-first professional start is not stated consistently in the sources captured here; confirm dates from primary interviews before marketing."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press=(
            "Creapills — 2025 — Feature on surreal micro-frescos on Paris walls — https://creapills.com/dawal-street-art-paris-fresques-miniatures-20251121\n"
            "A Day Magazine — 2026 — Profile of Dawal’s urban-surface painting — https://www.adaymag.com/2026/03/19/artist-dawal-painted-cracks-and-peeling-walls-of-cities-paris.html\n"
            "street-artwork.com — — Artist profile page — https://www.street-artwork.com/en/artist-profile/459/dawal"
        ),
        ig_posts="",
        sources=(
            "https://www.instagram.com/_dawal/\n"
            "https://creapills.com/dawal-street-art-paris-fresques-miniatures-20251121\n"
            "https://www.adaymag.com/2026/03/19/artist-dawal-painted-cracks-and-peeling-walls-of-cities-paris.html\n"
            "https://www.street-artwork.com/en/artist-profile/459/dawal\n"
            "https://thestreetcollector.com/collections/dawal"
        ),
        notes="Instagram handle is @_dawal (not @dawal).",
    ),
    "Antonia Lev": A(
        artist_name="Antonia Lev",
        ig="@antonialev",
        location="Paris, France",
        active_since="Behance lists professional start 4 Nov 2011 (verify on live profile)",
        hero_hook=(
            "Illustrator and muralist (@antonialev): Behance positions her in Paris; Moscow press covered street artists in isolation (The City, 2020) "
            "with context on urban practice."
        ),
        story=(
            "Antonia Lev is described across portfolio platforms as an illustrator and street artist with a strong Behance presence and Instagram @antonialev.\n\n"
            "Behance categorizes projects across illustration, street art, editorial, and motion-adjacent work; geographic labeling in search snippets references Paris, France.\n\n"
            "Russian-language coverage (The City / Москва 24, 2020) discusses street artists’ routines during isolation; it is interview-based city reporting rather than a full biography.\n\n"
            "Collaboration posts (e.g., Hidden Treasure Festival, Bremen) appear on partner accounts tagging @antonialev. "
            "Verify festival credits and dates from primary captions before reuse."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press="The City (Москва 24) — 2020 — Street artists in isolation roundup — https://thecity.m24.ru/articles/2047",
        sources=(
            "https://www.behance.net/antonialev\n"
            "https://www.instagram.com/antonialev/\n"
            "https://thecity.m24.ru/articles/2047\n"
            "https://thestreetcollector.com/collections/antonia-lev-1"
        ),
        notes="Traveling location appears in internal Shopify export; Paris is used here based on Behance/snippet alignment—confirm on official bio.",
    ),
    "Hedof": A(
        artist_name="Hedof",
        ig="@hedof",
        location="Breda, Netherlands",
        active_since="",
        hero_hook=(
            "Rick Berkelmans’ one-person studio Hedof in Breda: candy-color illustration and screen print; clients listed on hedof.com include Nike, Google, NYT, IKEA, PlayStation."
        ),
        story=(
            "Hedof is the studio name of Dutch illustrator Rick Berkelmans, based in Breda. His official about page describes a one-person practice combining illustration and printmaking.\n\n"
            "Third-party features (e.g., Inkygoodness) summarize a process of hand drawing scanned into Photoshop with layered color, often connected to screen printing.\n\n"
            "Commercial lists on hedof.com name brands such as Nike, Google, The New York Times, IKEA, PlayStation, and many others; treat lists as self-reported and verify for live campaigns.\n\n"
            "Behance hosts a large project archive under the Hedof name with substantial follower counts."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press="Inkygoodness — — Feature on Hedof studio — https://inkygoodness.com/features/focus-breda-based-one-man-creative-studio-hedof/",
        sources=(
            "https://www.hedof.com/about\n"
            "https://www.hedof.com/\n"
            "https://inkygoodness.com/features/focus-breda-based-one-man-creative-studio-hedof/\n"
            "https://www.behance.net/Hedof\n"
            "https://www.instagram.com/hedof/\n"
            "https://thestreetcollector.com/collections/hedof"
        ),
        notes="",
    ),
    "Taloosh": A(
        artist_name="Taloosh",
        ig="@taloosh.studio",
        location="Haifa, Israel",
        active_since="",
        hero_hook=(
            "Taloosh Studio (Haifa): public site and regional features tie the studio to illustration, promos, and mural-related storytelling; Instagram is @taloosh.studio."
        ),
        story=(
            "Taloosh Studio presents itself from Haifa with a portfolio site (taloosh.com) summarizing promotional, illustrative, and film-adjacent projects.\n\n"
            "Regional documentation (e.g., hareletzion.com short documentary listing) associates the studio with creative work tied to Haifa-area clients and culture.\n\n"
            "Instagram uses @taloosh.studio; posts reference site launches and collaborations—verify any named personnel credits from captions.\n\n"
            "For Street Collector, confirm which human name should appear on press materials; public pages emphasize the studio brand."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press="",
        sources=(
            "https://www.taloosh.com/\n"
            "https://www.instagram.com/taloosh.studio/\n"
            "https://www.hareletzion.com/copy-of-short-doco\n"
            "https://thestreetcollector.com/collections/taloosh"
        ),
        notes="Link individual artist name to studio site/IG; avoid inventing a solo biography beyond cited pages.",
    ),
    "Yonil": A(
        artist_name="Yonil",
        ig="@yonil",
        location="Tel Aviv, Israel",
        active_since="",
        hero_hook=(
            "Jonathan Lax works as YONIL in Tel Aviv: gig posters, prints, and graphic illustration; yonil.com lists Adobe, Cartoon Network, Nike among credits."
        ),
        story=(
            "YONIL is the working name of Jonathan Lax, described on yonil.com as a Tel Aviv-based artist, illustrator, and graphic designer spanning posters, prints, and personal art.\n\n"
            "The about page references publication history (e.g., IdN, Illustration Now!) and music-poster commissions; Behance and Dribbble mirror the same brand.\n\n"
            "Braverman Gallery lists an artist page under Jonathan Lax [Yonil], useful for exhibition context verification.\n\n"
            "Client name lists on personal sites can change; re-check yonil.com before advertising specific brands."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press="",
        sources=(
            "https://www.yonil.com/about\n"
            "https://www.yonil.com/\n"
            "https://www.behance.net/YONIL\n"
            "https://bravermangallery.com/artists/jonathan-lax-yonil/\n"
            "https://www.instagram.com/yonil/\n"
            "https://thestreetcollector.com/collections/yonil"
        ),
        notes="",
    ),
    "Troy Browne": A(
        artist_name="Troy Browne",
        ig="@troybrowne",
        location="Nottingham, United Kingdom",
        active_since="Freelance motion/illustration from Dec 2018 (LinkedIn); NTU Multimedia BSc 2007–2010",
        hero_hook=(
            "Nottingham freelancer Troy Browne: motion graphics, animation, and collage-influenced illustration; LinkedIn cites Sony Music, BBC, ITV among past clients."
        ),
        story=(
            "Troy Browne is a Nottingham-area freelance motion designer, animator, and illustrator according to LinkedIn and his portfolio domain.\n\n"
            "His education is listed as Nottingham Trent University, Multimedia BSc (2007–2010); employment history includes Skeleton Productions, Fat Free Media, and independent practice since 2018.\n\n"
            "The Different Folk artist page describes surreal collage-forward image making and lists music and broadcast-adjacent contexts; treat as third-party marketing copy.\n\n"
            "He sells prints via troybrowne.com shop pages."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press="The Different Folk — — Artist listing — https://www.thedifferentfolk.com/artists/troy-browne",
        sources=(
            "https://www.troybrowne.com/\n"
            "https://www.linkedin.com/in/troybrowne1\n"
            "https://www.thedifferentfolk.com/artists/troy-browne\n"
            "https://www.instagram.com/troybrowne/\n"
            "https://thestreetcollector.com/collections/troy-browne-1"
        ),
        notes="",
    ),
    "Elfassi": A(
        artist_name="Elfassi",
        ig="@elfassi",
        location="Israel",
        active_since="",
        hero_hook=(
            "Elfassi (Israeli illustrator per elfassiart.com): Shenkar College visual communication graduate; site lists murals, embroidery, and brand commissions."
        ),
        story=(
            "Elfassi’s official About page states she holds a BA in Visual Communication (illustration) from Shenkar College, Ramat Gan, and describes hand and digital drawing, embroidery, and murals.\n\n"
            "Project pages reference music posters, murals, and hospitality-related clients named on the site (e.g., venues/brands listed in English).\n\n"
            "Third-party aggregator thisispublic.net hosts an artist page with mural photography; use for orientation only and confirm rights.\n\n"
            "Instagram handle @elfassi is used in the Street Collector research sheet."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press="thisispublic.net — — Artist page with mural photos — https://www.thisispublic.net/artist-page-elfassi",
        sources=(
            "https://www.elfassiart.com/about/\n"
            "https://www.elfassiart.com/\n"
            "https://www.thisispublic.net/artist-page-elfassi\n"
            "https://www.instagram.com/elfassi/\n"
            "https://thestreetcollector.com/collections/elfassi"
        ),
        notes="",
    ),
    "Emelio Cerezo": A(
        artist_name="Emelio Cerezo",
        ig="@emiliocerezo",
        location="Spain",
        active_since="Graffiti since 2001; fine arts University of Granada 2004–2009; postgraduate drawing 2009–2010 (UrbanPresents interview)",
        hero_hook=(
            "Spanish painter Emilio Cerezo (@emiliocerezo): UrbanPresents traces graffiti aliases 2001–2012, fine-arts training in Granada, and mural work linked to the 626 crew."
        ),
        story=(
            "Interview-based profiles (UrbanPresents, 2023) identify Emilio Cerezo as a Spanish painter and muralist from Totana, tracing graffiti-era aliases and a shift to working under his full name from 2012.\n\n"
            "The same source notes studies at the University of Granada (2004–2009) and a postgraduate drawing year, later media-industry learning in Murcia and Granada.\n\n"
            "Street Art Cities maintains an artist index entry aggregating mural locations.\n\n"
            "Display name follows Street Collector spelling Emelio Cerezo; Instagram handle is @emiliocerezo."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press="UrbanPresents — 2023 — Long interview on style evolution — https://www.urbanpresents.net/en/2023/05/emilio-cerezo-in-spain-from-style-and-characters-to-painting/",
        sources=(
            "https://www.urbanpresents.net/en/2023/05/emilio-cerezo-in-spain-from-style-and-characters-to-painting/\n"
            "https://streetartcities.com/artists/emilio-cerezo\n"
            "https://www.instagram.com/emiliocerezo/\n"
            "https://thestreetcollector.com/collections/emelio-cerezo"
        ),
        notes="Spelling: Emilio in primary sources; storefront uses Emelio Cerezo.",
    ),
    "Igal Talianski": A(
        artist_name="Igal Talianski",
        ig="@iigalskii",
        location="Haifa, Israel",
        active_since="",
        hero_hook=(
            "Haifa visual artist Igal Talianski (@iigalskii): product copy on partner shops describes collage from recycled material; climbing-industry design clients are named there."
        ),
        story=(
            "Third-party product pages (e.g., flashed.com, Mezach) describe Igal Talianski as a Haifa-based artist using collage and recycled materials, with social handle @iigalskii.\n\n"
            "Those pages also mention branding and design work for climbing-related businesses; verify claims on live shop text before marketing.\n\n"
            "The Street Lamp / Street Collector ecosystem lists a lamp product tying the name to Haifa street-art context.\n\n"
            "No single long-form biography URL was confirmed in the search pass; prefer future primary interview links."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press="",
        sources=(
            "https://flashed.com/shop/product/igal-talianski\n"
            "https://mezach.shop/products/city-layers-haifa-edition-6-iigalskii\n"
            "https://www.instagram.com/iigalskii/\n"
            "https://thestreetcollector.com/collections/igal-talianski"
        ),
        notes="Biography thin; mostly from commerce pages—replace with interview when available.",
    ),
    "Carsten Gueth": A(
        artist_name="Carsten Gueth",
        ig="@die_doing",
        location="Stuttgart, Germany",
        active_since="~15 years agency graphic design before independent art (Artinrug); mural practice since 2010 cited on related pages",
        hero_hook=(
            "Carsten Gueth works as Die Doing (@die_doing), Stuttgart: Artinrug and his imprint cite Apple, Salomon, Penguin Random House; awards listed on notimefortv.biz."
        ),
        story=(
            "Carsten Gueth practices under the name Die Doing. Artinrug’s artist text states architecture/urban-planning studies in Stuttgart, long agency experience on cultural campaigns, then independent image-making.\n\n"
            "His imprint site (notimefortv.biz) lists awards (e.g., Red Dot / ADC references as shown on site) and client names such as Apple, Salomon, and Penguin Random House.\n\n"
            "Solo and festival exhibitions in Germany and abroad are named on the same imprint pages.\n\n"
            "Confirm exhibition years against PDFs or official press releases before final catalogs."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press="Artinrug — — Artist biography page — https://artinrug.com/artist/die-doing-carsten-gueth/",
        sources=(
            "https://artinrug.com/artist/die-doing-carsten-gueth/\n"
            "https://notimefortv.biz/\n"
            "https://www.instagram.com/die_doing/\n"
            "https://thestreetcollector.com/collections/carsten-gueth"
        ),
        notes="",
    ),
    "Or Bar El": A(
        artist_name="Or Bar El",
        ig="@or_bar_el",
        location="Israel",
        active_since="",
        hero_hook=(
            "Or Bar-El (@or_bar_el): Israeli illustrator/animator known for SketchBoom; Dror Hadadi blog documents Bezalel animation background and mural practice."
        ),
        story=(
            "orbarel.com presents SketchBoom as a core project mixing live video and drawing.\n\n"
            "Hebrew-language profiles (Dror Hadadi street-art blog) summarize animation study at Bezalel, awards for a graduation film, later tech work, and a return to illustration and murals.\n\n"
            "Social video platforms host many SketchBoom shorts; verify any brand call-outs as unofficial fan challenges unless confirmed.\n\n"
            "Use orbarel.com for official project framing."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press="Dror Hadadi — — Hebrew profile on street work — https://drorhadadi.com/%D7%90%D7%95%D7%A8-%D7%91%D7%A8-%D7%90%D7%9C-%D7%A1%D7%99%D7%98%D7%95%D7%90%D7%A6%D7%99%D7%95%D7%AA-%D7%99%D7%95%D7%9E%D7%99%D7%95%D7%9E%D7%99%D7%95%D7%AA/",
        sources=(
            "https://orbarel.com/\n"
            "https://drorhadadi.com/%D7%90%D7%95%D7%A8-%D7%91%D7%A8-%D7%90%D7%9C-%D7%A1%D7%99%D7%98%D7%95%D7%90%D7%A6%D7%99%D7%95%D7%AA-%D7%99%D7%95%D7%9E%D7%99%D7%95%D7%9E%D7%99%D7%95%D7%AA/\n"
            "https://www.instagram.com/or_bar_el/\n"
            "https://thestreetcollector.com/collections/or-bar-el"
        ),
        notes="",
    ),
    "Ori Toor": A(
        artist_name="Ori Toor",
        ig="@oritoor",
        location="Tel Aviv, Israel",
        active_since="Shenkar graduate 2010 (Pictoplasma conference bio)",
        hero_hook=(
            "Tel Aviv illustrator Ori Toor (@oritoor): improvisational doodle worlds; Colossal (2023) and Behance document NYT Kids, Cartoon Network, Nike, Adobe commissions."
        ),
        story=(
            "Ori Toor is a Tel Aviv-based illustrator and animator known for dense, improvised drawings and loops. Pictoplasma’s archived speaker bio notes a 2010 Shenkar graduation.\n\n"
            "Colossal (2023) profiles his chaotic, colorful worlds and lists press appearances; Behance shows large follower counts and commercial project tags.\n\n"
            "UISDC / Prototypr interviews explore process; use them for quotes only with attribution.\n\n"
            "Brink representation is mentioned in conference materials—verify current rep on oritoor.com."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press=(
            "Colossal — 2023 — Feature on improvisational illustration — https://thisiscolossal.com/2023/08/ori-toor-digital-illustration\n"
            "Pictoplasma — 2013 — Conference speaker bio — https://conference.pictoplasma.com/2013/ori-toor/"
        ),
        sources=(
            "https://oritoor.com/\n"
            "https://thisiscolossal.com/2023/08/ori-toor-digital-illustration\n"
            "https://www.behance.net/oritoor\n"
            "https://conference.pictoplasma.com/2013/ori-toor/\n"
            "https://www.instagram.com/oritoor/\n"
            "https://thestreetcollector.com/collections/ori-toor"
        ),
        notes="",
    ),
    "My Sunbeam": A(
        artist_name="My Sunbeam",
        ig="@mysunbeam",
        location="London, United Kingdom",
        active_since="",
        hero_hook=(
            "My Sunbeam (@mysunbeam): People of Print member profile and GoodMood Prints describe a London illustrator with retro textures—verify legal name on commission contracts."
        ),
        story=(
            "Third-party seller bios (GoodMood Prints, People of Print) describe My Sunbeam as a London illustrator with playful characters and distressed/retro surfacing.\n\n"
            "These pages are not a substitute for a primary CV; they should be cross-checked against Instagram @mysunbeam and any personal domain the artist lists in bio.\n\n"
            "Do not confuse with unrelated children’s book titles that include the phrase My Sunbeam.\n\n"
            "Street Collector should confirm the exact capitalization and alias usage with the vendor."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press="",
        sources=(
            "https://members.peopleofprint.com/profile/my-sunbeam/\n"
            "https://www.goodmoodprints.com/artists/mysunbeam\n"
            "https://www.instagram.com/mysunbeam/\n"
            "https://thestreetcollector.com/collections/my-sunbeam"
        ),
        notes="Some directories reference @_mysunbeam; Street Collector sheet specifies @mysunbeam.",
    ),
    "Linda Baritski": A(
        artist_name="Linda Baritski",
        ig="@seasonofvictory",
        location="London, United Kingdom",
        active_since="",
        hero_hook=(
            "Linda Baritski works as SEASONOFOFVICTORY (@seasonofvictory): London illustrator with Warner Bros. art-direction history; site lists Google, Adidas, LEGO, TfL clients."
        ),
        story=(
            "seasonofvictory.com/about states Linda Baritski is a London-based illustrator with US and Japan experience, previously an art director at Warner Bros., now freelance.\n\n"
            "Her services span murals, packaging, editorial, and brand illustration; client lists on the about page include Google, Adidas, LEGO, Transport for London, and many others.\n\n"
            "IllustrationX represents her for commissions according to the same page.\n\n"
            "Behance and Dribbble mirror the SEASONOFVICTORY moniker."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press="",
        sources=(
            "https://www.seasonofvictory.com/about\n"
            "https://seasonofvictory.com/\n"
            "https://www.behance.net/seasonofvictory\n"
            "https://www.instagram.com/seasonofvictory/\n"
            "https://thestreetcollector.com/collections/linda-baritski"
        ),
        notes="Typo check: brand stylization SEASONOFVICTORY vs seasonofvictory—match official site.",
    ),
    "Erezoo": A(
        artist_name="Erezoo",
        ig="@erezoo",
        location="Haifa, Israel",
        active_since="Born 1990 Carmiel; Vizcoa Haifa visual communication graduate (Dror Hadadi + erezoo.com about)",
        hero_hook=(
            "Erez Sameach (Erezoo, @erezoo) in Haifa: erezoo.com cites illustration, graphic design, graffiti; Dror Hadadi notes SIRA studio and Negev Museum group show (2023)."
        ),
        story=(
            "erezoo.com/about introduces Erez Sameach (Erezoo) as an illustrator and designer based in Haifa, working across illustration, graphic design, and graffiti.\n\n"
            "Dror Hadadi’s street-art blog adds biographical notes: born in Carmiel in 1990, Vizcoa Haifa studies, shared SIRA studio, family ties to other street artists.\n\n"
            "The blog mentions participation in a 2023 group exhibition at the Negev Museum of Art; verify title and curatorial text from museum channels.\n\n"
            "Wallart.org.il hosts an artwork page referencing his mural practice."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press="Dror Hadadi — — Hebrew profile with exhibition note — https://drorhadadi.com/erezoo-%D7%90%D7%99%D7%95%D7%A8-%D7%A8%D7%97%D7%95%D7%91/",
        sources=(
            "https://www.erezoo.com/about\n"
            "https://www.erezoo.com/\n"
            "https://drorhadadi.com/erezoo-%D7%90%D7%99%D7%95%D7%A8-%D7%A8%D7%97%D7%95%D7%91/\n"
            "https://www.instagram.com/erezoo/\n"
            "https://thestreetcollector.com/collections/erezoo"
        ),
        notes="",
    ),
    "Maalavidaa": A(
        artist_name="Maalavidaa",
        ig="@maalavidaa",
        location="Montreal, Quebec, Canada",
        active_since="Studio Maalavidaa Inc. founded 2016 (LinkedIn); DSAA graphic design MA 2018 per maalavidaa.com/about",
        hero_hook=(
            "Alycia Rainaud’s Maalavidaa (@maalavidaa) in Montreal: maalavidaa.com cites psychology-informed abstract digital work; press logos include Adobe, BBC, Vogue on site."
        ),
        story=(
            "maalavidaa.com/about identifies Alycia Rainaud behind Maalavidaa, linking graphic design, digital art, and emotional-health themes, with a 2018 master’s thesis on psychology in design.\n\n"
            "LinkedIn lists Studio Maalavidaa Inc. from 2016 and additional founder roles; treat as self-reported.\n\n"
            "Vapor95 and Behance host secondary spotlights useful for pull-quotes only with attribution.\n\n"
            "Client/logo walls on personal sites should be refreshed before ads."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press="Vapor95 — — Artist spotlight blog — https://vapor95.com/blogs/darknet/artist-spotlight-maalavidaa",
        sources=(
            "https://www.maalavidaa.com/about\n"
            "https://maalavidaa.com/\n"
            "https://www.behance.net/maalavidaa\n"
            "https://www.linkedin.com/in/alyciarainaud\n"
            "https://www.instagram.com/maalavidaa/\n"
            "https://thestreetcollector.com/collections/maalavidaa"
        ),
        notes="",
    ),
    "Psoman": A(
        artist_name="Psoman",
        ig="@psoman_ptk",
        location="Liège, Belgium",
        active_since="",
        hero_hook=(
            "Belgian muralist Psoman (@psoman_ptk): Lisbon street-art blog and Liège-area profiles describe graphic training, 3D fabrication study in Switzerland, and nature-inspired creatures."
        ),
        story=(
            "English-language summaries on Lisbon Street Art Tours (2019) and similar blogs describe Psoman as a Liège-born artist who studied graphic design and advanced fabrication before focusing on murals.\n\n"
            "Taiwan press (Liberty Times, 2024) documents a school mural residency, useful for geographic reach verification.\n\n"
            "His Instagram includes public /p/ permalinks suitable for asset auditing.\n\n"
            "Creature-based surrealism and environmental themes recur in third-party descriptions."
        ),
        pull_quote="",
        impact="",
        exclusive="",
        exhibitions="",
        press="Liberty Times / 自由時報 — 2024 — Taiwan school mural coverage — https://news.ltn.com.tw/news/life/breakingnews/4956705",
        ig_posts=(
            "https://www.instagram.com/psoman_ptk/p/CqP4EaSy9Jx/\n"
            "https://www.instagram.com/psoman_ptk/p/CdxoRxiv_Gu/"
        ),
        sources=(
            "https://lisbonstreetarttours.wordpress.com/2019/01/30/psoman/\n"
            "https://news.ltn.com.tw/news/life/breakingnews/4956705\n"
            "https://psoman.co/\n"
            "https://www.instagram.com/psoman_ptk/\n"
            "https://thestreetcollector.com/collections/psoman"
        ),
        notes="",
    ),
}

FILE1["Linda Baritski"]["heroHook"] = (
    "Linda Baritski works as SEASONOFVICTORY (@seasonofvictory): London illustrator with Warner Bros. art-direction history; "
    "site lists Google, Adidas, LEGO, TfL clients."
)

FILE2, FILE3, FILE4 = get_batches(A)

for label, blob in [("FILE1", FILE1), ("FILE2", FILE2), ("FILE3", FILE3), ("FILE4", FILE4)]:
    for k, v in blob.items():
        h = v["heroHook"]
        if not (120 <= len(h) <= 180):
            raise SystemExit(f"{label} {k}: heroHook length {len(h)}")

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    payloads = [
        ("artist-research-04-21-rich.json", FILE1),
        ("artist-research-22-37.json", FILE2),
        ("artist-research-53-68.json", FILE3),
        ("artist-research-69-84.json", FILE4),
    ]
    for fname, data in payloads:
        with open(OUT / fname, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print("Wrote", fname, len(data), "artists")
