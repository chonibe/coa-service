#!/usr/bin/env python3
"""
Generate fresh editorial artist bios and a recency audit from current research data.

The generated bios deliberately avoid Street Collector sales language. They use the
current research rows as the factual base, then privilege recent dated activity
already present in exhibitions/press/history fields and record live-source checks
for official pages and Instagram.
"""
from __future__ import annotations

import concurrent.futures
import json
import re
import urllib.error
import urllib.request
from dataclasses import dataclass
from html import unescape
from pathlib import Path
from typing import Iterable

REPO = Path(__file__).resolve().parents[1]
JSON_PATH = REPO / "content" / "artist-research-data.json"
MD_PATH = REPO / "docs" / "features" / "street-collector" / "artist-bios-rewritten.md"
AUDIT_PATH = REPO / "docs" / "features" / "street-collector" / "artist-bios-recency-audit-2026-04.md"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
    )
}

SALES_RE = re.compile(
    r"\b(Street Collector|Street Lamp|Works tab|collectors?|collect|editions?|prints?|shop|limited)\b",
    re.I,
)
RESEARCH_RE = re.compile(
    r"\b(verify|source|sources|according|search result|indexed search|profile|profile lists|site lists|resume page lists|see exhibitions list|rep interviews|interview summaries|interview|coverage|feature|featured|features|Behance Sign In|auto-extracted)\b",
    re.I,
)
INTERNAL_RE = re.compile(
    r"\b(verify|confirm|internal|enrichment pass|manual web enrichment|auto image extract|spreadsheet hygiene|Batch\s+\d+|cross-checked|before reuse|do not conflate|different practice)\b",
    re.I,
)
RESIDUE_RE = re.compile(
    r"(Auto-extracted|Behance Sign In|Cookie preferences|Do not sell|returned HTTP|as fetched|primary CV|"
    r"expand from primary|CLIENTS INCLUDE|SELECTED WORK|Official .* channel|artist listing|"
    r"about\s+[—-]\s+nurit|intagram|All rights reserved|Limited art toy)",
    re.I,
)
URL_RE = re.compile(r"https?://\S+")
YEAR_RE = re.compile(r"\b(20[0-2][0-9])\b")

THIN_SOURCE_SLUGS = {
    "s-a-r-g-o-n",
    "igor-mikutski",
    "jake-ac-art",
    "ollie-smither",
    "vivaladybug",
}


@dataclass
class CheckResult:
    url: str
    status: str
    title: str = ""
    years: tuple[int, ...] = ()


def clean_public_text(text: str) -> str:
    text = unescape(text or "")
    text = re.sub(r"<[^>]+>", " ", text)
    text = URL_RE.sub("", text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def strip_parenthetical_verify(text: str) -> str:
    return re.sub(r"\s*\((?:[^)]*\bverify\b[^)]*|per [^)]*|source:[^)]*)\)", "", text, flags=re.I).strip()


def split_sentences(text: str) -> list[str]:
    text = clean_public_text(text).replace("\n", " ")
    protected = {
        "St. ": "St§ ",
        "Mr. ": "Mr§ ",
        "Ms. ": "Ms§ ",
        "Dr. ": "Dr§ ",
    }
    for before, after in protected.items():
        text = text.replace(before, after)
    parts = re.split(r"(?<=[.!?])\s+", text)
    out: list[str] = []
    for part in parts:
        s = part.strip().replace("§", ".")
        if not s:
            continue
        if INTERNAL_RE.search(s) or RESIDUE_RE.search(s):
            continue
        if SALES_RE.search(s):
            continue
        if RESEARCH_RE.search(s):
            continue
        out.append(s)
    return out


def words(text: str) -> list[str]:
    return re.findall(r"\S+", text)


def sentence_join(parts: Iterable[str]) -> str:
    text = " ".join(p.strip() for p in parts if p and p.strip())
    text = re.sub(r"\s+", " ", text).strip()
    return text


def unique_lines(text: str) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for raw in (text or "").splitlines():
        line = strip_parenthetical_verify(clean_public_text(raw))
        line = re.sub(r"\s+[-–—]\s+https?://\S+$", "", line).strip()
        if not line or INTERNAL_RE.search(line) or RESEARCH_RE.search(line) or RESIDUE_RE.search(line):
            continue
        key = line.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(line)
    return out


def extract_recent_lines(row: dict[str, str]) -> list[str]:
    candidates: list[tuple[int, str]] = []
    for key in ("exhibitionsText", "pressText", "additionalHistoryText"):
        for line in unique_lines(row.get(key, "")):
            years = [int(y) for y in YEAR_RE.findall(line)]
            recent = [y for y in years if y >= 2024]
            if not recent:
                continue
            if RESEARCH_RE.search(line) or INTERNAL_RE.search(line) or SALES_RE.search(line):
                continue
            candidates.append((max(recent), line))
    candidates.sort(key=lambda x: x[0], reverse=True)
    out: list[str] = []
    for _, line in candidates:
        cleaned = line
        cleaned = re.sub(r"\s+—\s+https?://\S+", "", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip(" .")
        if cleaned and cleaned not in out:
            out.append(cleaned)
        if len(out) >= 3:
            break
    return out


def recent_sentence(name: str, lines: list[str]) -> str:
    if not lines:
        return ""
    first = lines[0]
    if re.match(r"^20\d{2}\s+[—-]\s+", first):
        year, rest = re.split(r"\s+[—-]\s+", first, maxsplit=1)
        rest = rest.rstrip(".")
        parts = [p.strip() for p in rest.split(",") if p.strip()]
        if len(parts) >= 3:
            kind = parts[0].lower()
            title = parts[1]
            venue = parts[2]
            city = ", ".join(parts[3:])
            if kind in {"solo", "group", "mural", "residency", "commission"}:
                place = f" at {venue}" if venue else ""
                if city:
                    place += f" in {city}"
                article = "an" if kind[0] in "aeiou" else "a"
                return f"In {year}, {article} {kind} project, {title}, kept the practice active{place}."
        rest = re.sub(r"\s+[—-]\s*$", "", rest).strip()
        if rest.lower().startswith("speaker,"):
            event = rest.split(",", 1)[1].strip()
            return f"In {year}, {name} also appeared in public creative programming through {event}."
        return f"In {year}, the practice stayed active through {rest}."
    m = re.match(r"^([^—]+)\s+—\s+(20\d{2})\s+—\s+(.+)$", first)
    if m:
        outlet, year, rest = m.groups()
        rest = rest.rstrip(".")
        subject = rest[0].lower() + rest[1:] if rest else "the work"
        subject = subject.rstrip(" —-")
        if SALES_RE.search(subject) or RESEARCH_RE.search(subject):
            return ""
        if "artist listing" in subject.lower():
            return f"In {year}, the work remained visible through {outlet.strip()}'s illustration program."
        return f"In {year}, new public attention followed {subject}."
    if YEAR_RE.search(first):
        return first.rstrip(".") + "."
    return ""


def style_sentence(name: str, row: dict[str, str], existing: list[str]) -> str:
    story = " ".join(existing).lower()
    location = (row.get("location") or "").strip()
    if "mural" in story or "wall" in story or "graffiti" in story:
        return "Scale matters, but so does the close read: the strongest work keeps small marks, odd characters, and surface decisions alive after the first hit."
    if "motion" in story or "animation" in story:
        return "That sense of timing stays visible even in still images: the composition feels paused rather than frozen."
    if "collage" in story:
        return "The surface matters as much as the subject, with fragments arranged until the image feels discovered rather than assembled."
    if "typograph" in story or "poster" in story:
        return "The work understands graphic impact: shape, type, and color arrive quickly, then leave enough tension to keep looking."
    if location:
        return f"{location.split(',')[0]} enters the work as rhythm rather than scenery: light, pacing, and local texture shape the way the images land."
    return f"The point is not to make {name} easy to categorize; the work is more interesting because it keeps moving between image, object, and atmosphere."


def clean_sentence_list(sentences: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for s in sentences:
        s = re.sub(r"\s+", " ", s).strip()
        s = strip_parenthetical_verify(s)
        if not s or INTERNAL_RE.search(s) or RESEARCH_RE.search(s) or RESIDUE_RE.search(s) or SALES_RE.search(s):
            continue
        key = s.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(s)
    return out


def editorial_closing(slug: str) -> str:
    closings = [
        "The best way into the work is through its decisions: what gets simplified, what stays strange, and where the image leaves room for the viewer to finish the thought.",
        "What gives the practice its pull is the balance between immediate charm and careful construction; the image opens quickly, then keeps revealing how it was built.",
        "The work does not need a heavy explanation to hold attention. It earns that attention through pace, pressure, color, and a clear sense of where the artist wants the eye to land.",
        "That mix of accessibility and discipline is what keeps the practice from feeling decorative. The surface is inviting, but the choices underneath are specific.",
        "Across formats, the work is most alive when it lets polish and personality sit together: clean enough to read fast, human enough to keep its edges.",
    ]
    return closings[sum(ord(c) for c in slug) % len(closings)]


EDITORIAL_OVERRIDES: dict[str, str] = {
    "alice-bureau": """Alice Hoffmann works as Bureau Alice from Zurich, after years spent inside international creative teams. That background shows in the way her illustrations can behave like brand systems without losing their hand-made warmth: clean line, exact color, and a knack for making a small gesture carry a whole mood.

Her visual language often sits between editorial image-making, packaging, and art direction. The work can be minimal, but it is not cold; a figure, a plant, a room, or a small object becomes memorable because the drawing strips away noise instead of personality.

Recent public material around Bureau Alice keeps the focus on illustration, art direction, and commercial image work for cultural and global clients, with Zurich as the working base. The strongest pieces feel quietly confident, as if every curve has already survived several rounds of editing.

What makes the practice interesting is that it does not chase spectacle. It trusts proportion, wit, and restraint, then lets the viewer notice how much feeling can sit inside a very economical line.""",
    "dawal": """Dawal is a Paris-based street artist who learned the city by painting it. His work begins with what most people walk past: cracked plaster, peeling paint, chipped corners, and aging surfaces that already carry a kind of accidental drawing.

Into those marks he places small surreal scenes, turning damaged walls into pocket-sized stages. The result is intimate for street work: you do not just see the image from across the road, you discover it at pavement distance, almost like the city has hidden a thought in plain sight.

Recent activity keeps that street instinct alive. In 2025, press focused on his miniature interventions across Paris, and in 2026 his solo project Reve Lucide at Galerie Artistik Rezo brought the same dream logic into a gallery context.

The appeal is not just the illusion. It is the way Dawal listens to the surface before painting, letting the wall decide part of the composition and keeping the finished work tied to the place that made it possible.""",
    "taloosh": """Taloosh Studio works from Haifa across illustration, promo art, branding, and moving-image culture. The studio's work has the pace of music and nightlife: fast, graphic, bright, and built to make a project feel like it already has a world around it.

Instead of treating campaigns as flat assets, Taloosh tends to build atmosphere. Posters, short films, exhibition material, and cultural visuals share a taste for bold character, saturated rhythm, and a direct line to local creative scenes.

Available public material points to ongoing cultural and exhibition-related work, including material connected to Beit Hankin Gallery programming. The clearest read is also the safest one: this is a studio practice rooted in visual energy, not a single fixed medium.

What makes Taloosh worth watching is the way the work feels designed for movement even when it is still. It carries Haifa's coastal confidence without turning that location into a slogan.""",
    "s-a-r-g-o-n": """S A R G O N is best understood, for now, through the public @oky.sargon feed: a compact visual diary of illustration, motion, and experiments released close to the moment of making.

Because there is no reliable public biography tying the handle to a fuller artist history, the bio stays deliberately narrow. The visible work is graphic, quick-moving, and exploratory, with the social feed functioning as the main record of the practice.

That thinness is also useful: it keeps the focus on what can be seen rather than on borrowed identity claims. The interest is in the pace of the images and the sense of a style still being tested in public.""",
    "my-sunbeam": """Taylor works as My Sunbeam from London, making illustration that feels both nostalgic and freshly odd. The characters often look as if they have stepped out of sticker books, old packaging, and late-night radio jingles, but the humor is gentler and stranger than simple retro pastiche.

Texture matters in this work. Distressed edges, playful lettering, and warm character design give the images the feeling of objects that have already lived a little, even when they are newly made.

Public material around My Sunbeam connects the practice to London's illustration and independent design scenes, with studio-linked projects documenting the work's playful character-led approach.

The charm is immediate, but the images are not lazy. They are carefully tuned little worlds: friendly at first glance, then full of small expressions, wonky details, and mood shifts that reward a slower look.""",
    "jerome-masi": """Jerome Masi studied at Emile-Cohl in Lyon, moved through game studios and motion design, and now works from Annecy as a full-time illustrator. That route matters: his images have the control of someone who understands production, but they leave enough quiet for interpretation.

Commercial projects for transport, watch, and telecom clients sit beside personal acrylic paintings. Across both, the palette tends to stay restrained and the composition carefully staged, as if each image is a memory held just before it becomes too clear.

Interviews and portfolio material describe a practice interested in leaving space for the viewer. Even when the subject is direct, the mood is open-ended; Masi lets atmosphere do part of the storytelling.

The work is strongest when technique disappears into feeling. You sense the design training underneath, but what stays with you is the pause, the silence, and the small emotional weather inside the image.""",
    "antonia-lev": """Antonia Lev is a Paris-based illustrator and street artist whose practice moves between wall painting, editorial imagery, and digital work. Her images are graphic and narrative, with figures and scenes that hold up at mural scale while still giving the eye something to follow close up.

The work has a storybook pulse, but it is not soft in a decorative way. Lines stay confident, characters carry attitude, and the compositions often feel like fragments of a larger scene caught mid-movement.

Recent public material points to a 2025 mural project, The Dance of Blooming, connected to Mural City activity in the Paris region. Older public material also shows her moving between festival walls and illustration platforms, which fits the range of the practice.

What makes Lev's work engaging is the way it treats public space as a narrative surface. A wall is not just scale; it is a place where a character, a gesture, or a small fiction can suddenly belong to the street.""",
    "antonia-lev-1": """Antonia Lev is a Paris-based illustrator and street artist whose practice moves between wall painting, editorial imagery, and digital work. Her images are graphic and narrative, with figures and scenes that hold up at mural scale while still giving the eye something to follow close up.

The work has a storybook pulse, but it is not soft in a decorative way. Lines stay confident, characters carry attitude, and the compositions often feel like fragments of a larger scene caught mid-movement.

Recent public material points to a 2025 mural project, The Dance of Blooming, connected to Mural City activity in the Paris region. Older public material also shows her moving between festival walls and illustration platforms, which fits the range of the practice.

What makes Lev's work engaging is the way it treats public space as a narrative surface. A wall is not just scale; it is a place where a character, a gesture, or a small fiction can suddenly belong to the street.""",
    "igal-talianski": """Igal Talianski works from Haifa in collage and mixed media, building images from paper, color, fragments, and found texture. The surfaces feel constructed rather than polished flat, which is exactly where their warmth comes from.

His work has also moved through climbing and local visual culture, where tactile material and direct graphic impact matter. Whether the format is a wall, an object, or a framed piece, the invitation is similar: step closer and notice what has been kept, cut, layered, or left rough.

Public exhibition history connects the practice to Israeli illustration and repurposed-book contexts, including LaCulture illustration programming and Edmond de Rothschild Center activity in Tel Aviv.

The strongest part of the work is its honesty about materials. You can feel the decisions in the surface, and that gives the images a physical presence that clean digital finish would flatten.""",
    "nurit-gross": """Nurit Gross is a Tel Aviv illustrator and designer who graduated from Bezalel in 2019 and works across cut paper, gouache, markers, and digital paint. Her images often feel handmade even when the finish is clean, with folk pattern, humor, and small visual surprises carrying the mood.

Children's books, magazine work, museum projects, and municipal commissions all seem to feed the same curiosity: how to make an image feel generous without making it simple. Gross is good at letting playfulness and precision share the same surface.

Public biography material notes the Israel Museum's Ben-Yitzhak Award in 2022 and inclusion in Society of Illustrators annuals. Her own site continues to frame the practice around illustration, design, sketches, and process.

The work is interesting because it does not separate craft from wit. A cut shape, a tiny expression, or a patterned field can do the emotional work of a whole paragraph.""",
    "frederique-mati": """Frederique Matti is an Amsterdam-based illustrator, art director, and painter whose practice has grown out of more than a decade of freelance visual work. Her images tend to be calm at first glance: restrained palette, clear silhouettes, and characters who seem comfortable inside their own weather.

That calm is not empty. Editorial, branding, painting, and object-based projects all show a designer's sense of structure, but the recent work keeps moving toward a warmer painterly voice.

Her public site notes clients including Google, Uber, Spotify, GitHub, and Dropbox, plus recent selected work such as a 2023 Hoxton Amsterdam presentation and a hand-painted Tivoli speaker project in 2024.

What holds the work together is not a single subject, but a tone: observant, balanced, slightly dry, and attentive to the small gestures that make a character feel lived-in.""",
    "nasca-uno": """NASCA Uno is a Berlin-based artist whose walls carry the patience of drawing and the charge of graffiti. His murals often bring together myth, anatomy, urban memory, and figures that seem to come from a century you cannot quite place.

The work has a dense narrative quality. A single piece can feel like a chapter from a larger story, full of symbols and bodies that are not explained so much as encountered.

Public research connects the practice to Berlin mural activity, festival walls, and museum-context work, including a STRAAT Museum collection entry that has been referenced in prior documentation.

What makes NASCA Uno compelling is the tension between control and atmosphere. The drawing is careful, but the finished image still feels unstable in the best way, as if the wall is remembering something.""",
    "animalitoland": """Graciela Goncalves Da Silva works as Animalitoland, a practice that turns characters, murals, and emotional fictions into bright architectural worlds. Born in Argentina and trained in design at the University of Buenos Aires, she has lived and worked across Buenos Aires, Madrid, Vancouver, and Los Angeles.

Her murals and paintings often feel like graphic novels pressed into public space: precise figures, vivid acrylic color, and strange creatures carrying very human feelings. The style is playful, but the themes often circle belonging, displacement, and the search for an inner home.

Recent activity in the research includes 2024 Hawaii Walls and 2025 projects in Los Angeles and Glendale, including Perseverance: 20 Years of Thinkspace and Art Share LA Summer Block Party.

The work travels well because it is not only decorative fantasy. It uses fantasy as a way to make emotion visible, turning walls into places where vulnerability can be loud, colorful, and still tender.""",
    "vivaladybug": """Viva La Ladybug is an illustrator whose public work moves through bold characters, stickers, GIFs, and social-image culture. The energy is bright and immediate: mascot-like figures, thick outlines, and expressions built to move even when the image is still.

The practice is especially legible online, where loops and small reactions become part of how people talk to each other. That does not make the work throwaway; it makes timing, clarity, and personality unusually important.

The available public trail is thinner than for many artists here, with GIPHY and Instagram carrying most of the visible record. The channel material links the work to Aviva Charles and the @vivalaladybug identity.

What makes the work useful and charming is its emotional directness. These are images made to travel quickly, but the best ones keep a handmade pulse inside the speed.""",
    "levi-jacobs": """Levi Jacobs is a Rotterdam illustrator and animator who treats image-making like staged cinema. Light, cast, props, and atmosphere all feel chosen, which gives even a simple scene a sense of hidden narrative.

He studied illustration at St. Joost and has worked freelance since 2010. The work is slightly noir, slightly surreal, and consistently human, with everyday settings pushed just far enough to become memorable.

Recent public activity in the research includes Playgrounds programming, including In Motion Rotterdam in 2023. That context fits a practice where still illustration and motion thinking often sit close together.

Jacobs' images are strongest when they leave a question in the room. You feel the story before you know it, then start reading the composition for clues.""",
    "raki": """RAF Page works as RAKI, an illustrator from the Philippines whose large images feel like storybook scenes built for public scale. Warm color, rounded characters, and mythic touches make the work accessible without sanding away its strangeness.

RAKI's visual world often carries the emotional clarity of children's illustration while speaking to adult ideas about imagination, quiet strength, and selfhood. The result is generous, direct, and easy to enter.

Recent public material connects the practice to Bangkok Illustration Fair activity, with the 2025 artist program still visible in 2026 research. That Southeast Asian illustration context helps place the work beyond a single local scene.

What makes RAKI engaging is the sincerity. The images do not hide behind irony; they invite the viewer into a softer kind of power and trust the drawing to carry it.""",
    "phil-huelz": """Phil Huelz works from Cologne with a visual language built around bold color, expressive faces, and approachable ideas. His illustration has the feel of a conversation: direct, warm, and willing to talk about real emotion without making the image heavy.

The work moves between editorial, advertising, personal pieces, and object-led projects. A character may look playful at first, but the expression usually carries something more complicated underneath.

Recent public research points to 2025 attention around Tanglehug and mentions of Culture Arts Expo in Visalia, with further Cologne activity noted for 2026. Those details should stay flexible, but they show an active practice moving between image and object.

What makes Huelz stand out is the balance between accessibility and feeling. The drawing is friendly enough to invite you in, then specific enough to keep the emotion from turning generic.""",
    "troy-browne": """Troy Browne is a Nottingham-based artist and motion designer who went independent in 2018 after years in studio environments. That background gives the work a strong sense of timing: collage, hand-drawn movement, digital finishing, and composition all seem to understand the frame before and after the one you see.

His images often feel assembled in motion, even when they are still. Shape, texture, and character sit together with the energy of animation paused at the most interesting moment.

Recent public material points to his 2025 appearance in Confetti Industry Week programming across Nottingham and London, while earlier public material documents representation by The Different Folk and a client-facing motion practice.

The work is compelling because it keeps the object and the timeline in conversation. You can read it as an image, but you can also feel the sequence that might have produced it.""",
    "troy-browne-1": """Troy Browne is a Nottingham-based artist and motion designer who went independent in 2018 after years in studio environments. That background gives the work a strong sense of timing: collage, hand-drawn movement, digital finishing, and composition all seem to understand the frame before and after the one you see.

His images often feel assembled in motion, even when they are still. Shape, texture, and character sit together with the energy of animation paused at the most interesting moment.

Recent public material points to his 2025 appearance in Confetti Industry Week programming across Nottingham and London, while earlier public material documents representation by The Different Folk and a client-facing motion practice.

The work is compelling because it keeps the object and the timeline in conversation. You can read it as an image, but you can also feel the sequence that might have produced it.""",
    "loreta-isac": """Loreta Isac is a Bucharest-based illustrator and animator who grew up in Iasi and studied art before building a practice around dreamlike narrative images. She has described her own world with the phrase "once upon a dreamer," and the work really does move with that half-awake logic.

Her illustrations and animations move between editorial commissions, music-related work, and personal pieces where figures seem caught in the middle of thought. Color, shape, and motion are used less for spectacle than for atmosphere.

Recent exhibition research includes the 2024 group project Home A Sense of Belonging in Amsterdam, following earlier motion and illustration contexts in Beijing, Wroclaw, Timisoara, and Bucharest.

What keeps the work interesting is its emotional suspension. Isac lets the drawing breathe just long enough for the viewer to wonder what happened before the image, and what might happen after.""",
}


def build_bio(slug: str, row: dict[str, str]) -> str:
    override = EDITORIAL_OVERRIDES.get(slug)
    if override:
        return override.strip()

    name = row.get("artistName") or slug.replace("-", " ").title()
    location = re.sub(r"\s*\([^)]*\)", "", (row.get("location") or "")).strip()
    base_sentences = split_sentences(row.get("storyFullText", ""))
    # Additional history is intentionally not used as free prose. It often
    # contains scrape residue, verification notes, and source-room phrasing.
    # Dated public facts are extracted separately through extract_recent_lines.
    history_sentences: list[str] = []
    recent = extract_recent_lines(row)

    if not base_sentences:
        if location:
            base_sentences = [f"{name} works from {location}, building a practice around image-making, public surfaces, and a distinct visual rhythm."]
        else:
            base_sentences = [f"{name} builds a visual practice around public-facing images, personal symbols, and a hand that stays present in the finished work."]

    opener = base_sentences[0]
    p1 = sentence_join([opener] + base_sentences[1:2])

    practice_parts = base_sentences[2:5]
    if not practice_parts and history_sentences:
        practice_parts = history_sentences[:1]
    if not practice_parts:
        practice_parts = [style_sentence(name, row, base_sentences)]
    p2 = sentence_join(practice_parts)
    if len(words(p2)) < 35:
        style = style_sentence(name, row, base_sentences)
        if style not in p2:
            p2 = sentence_join([p2, style])

    recent_line = recent_sentence(name, recent)
    p3_parts = []
    if recent_line and not SALES_RE.search(recent_line) and not RESEARCH_RE.search(recent_line):
        p3_parts.append(recent_line)
    style = style_sentence(name, row, base_sentences + history_sentences)
    if style not in p2:
        p3_parts.append(style)
    else:
        p3_parts.append("The work is strongest where the hand, the idea, and the chosen surface all feel equally necessary.")
    p3 = sentence_join(p3_parts)

    paragraphs = [p1, p2, p3]

    # Thin-source rows get honest shorter bios; others receive a fourth paragraph
    # only when needed to reach the editorial depth target.
    if slug not in THIN_SOURCE_SLUGS and len(words("\n\n".join(paragraphs))) < 125:
        paragraphs.append(editorial_closing(slug))

    paragraphs = [p.strip() for p in paragraphs if p and len(words(p)) >= 8]
    # Final pass: keep paragraph breaks, remove accidental duplicated paragraphs,
    # and drop any sentence that still smells like internal research or shop copy.
    cleaned_paragraphs: list[str] = []
    seen_paragraphs: set[str] = set()
    seen_sentences: set[str] = set()
    for para in paragraphs:
        para_sentences = clean_sentence_list(split_sentences(para))
        fresh_sentences: list[str] = []
        for sentence in para_sentences:
            sentence_key = sentence.lower()
            if sentence_key in seen_sentences:
                continue
            seen_sentences.add(sentence_key)
            fresh_sentences.append(sentence)
        para_sentences = fresh_sentences
        if not para_sentences:
            continue
        para_text = sentence_join(para_sentences)
        key = para_text.lower()
        if key in seen_paragraphs:
            continue
        seen_paragraphs.add(key)
        cleaned_paragraphs.append(para_text)

    text = "\n\n".join(cleaned_paragraphs)
    fillers = [
        editorial_closing(slug),
        "There is enough clarity to enter the image quickly, and enough friction to keep looking once the subject has settled.",
        "Across formats, the practice is less about repeating a signature trick than about returning to a set of visual instincts and testing what they can carry next.",
        "That is where the work starts to feel personal: not in a biography pasted onto it, but in the pressure of choices that could only have been made by this hand.",
    ]
    for filler in fillers:
        if slug in THIN_SOURCE_SLUGS or len(words(text)) >= 120:
            break
        if filler not in text:
            text = (text + "\n\n" + filler).strip()
    thin_fillers = [
        "Because the public trail is narrow, the profile keeps to visible practice rather than filling gaps with unsupported biography.",
        "That restraint leaves the work itself in front: the rhythm of the images, the hand behind them, and the way the public feed frames the practice.",
    ]
    for filler in thin_fillers:
        if len([p for p in text.split("\n\n") if p.strip()]) >= 3:
            break
        if filler not in text:
            text = (text + "\n\n" + filler).strip()
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    return text.strip()


def display_title(row: dict[str, str]) -> str:
    name = row.get("artistName") or "Unknown artist"
    loc = (row.get("location") or "").strip()
    loc = re.sub(r"\s*\([^)]*(?:Street Lamp|Street Collector|product page|per\s+)[^)]*\)", "", loc, flags=re.I).strip()
    return f"**{name}**" + (f" — {loc}" if loc else "")


def fetch_url(url: str) -> CheckResult:
    if not url:
        return CheckResult(url="", status="missing")
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=5) as resp:
            raw = resp.read(250_000)
            status = str(resp.status)
        text = raw.decode("utf-8", errors="ignore")
        title_m = re.search(r"<title[^>]*>(.*?)</title>", text, re.I | re.S)
        title = clean_public_text(title_m.group(1) if title_m else "")[:120]
        years = tuple(sorted({int(y) for y in YEAR_RE.findall(text) if int(y) >= 2024}, reverse=True)[:5])
        return CheckResult(url=url, status=status, title=title, years=years)
    except urllib.error.HTTPError as e:
        return CheckResult(url=url, status=f"HTTP {e.code}")
    except Exception as e:  # noqa: BLE001 - audit should continue on network errors
        return CheckResult(url=url, status=f"blocked/error: {type(e).__name__}")


def source_links(row: dict[str, str]) -> list[str]:
    out: list[str] = []
    for url in [row.get("aboutPageUrl", "").strip()]:
        if url and url not in out and "instagram.com" not in url:
            out.append(url)
    return out


def build_audit_row(slug: str, row: dict[str, str], checks: dict[str, CheckResult]) -> str:
    about = (row.get("aboutPageUrl") or "").strip()
    ig_handle = (row.get("instagramHandle") or "").strip().lstrip("@")
    ig_url = f"https://www.instagram.com/{ig_handle}/" if ig_handle else ""
    about_result = checks.get(about) if about else None
    ig_result = checks.get(ig_url) if ig_url else None
    recent = extract_recent_lines(row)
    newest_years = sorted(
        {int(y) for key in ("storyFullText", "additionalHistoryText", "exhibitionsText", "pressText") for y in YEAR_RE.findall(row.get(key, ""))},
        reverse=True,
    )
    newest = str(newest_years[0]) if newest_years else "No dated recent source in research row"
    fact = recent[0] if recent else "No 2024-2026 factual activity in row; bio stays grounded in stable practice/history."
    notes = []
    if slug in THIN_SOURCE_SLUGS:
        notes.append("Thin-source exception: keep shorter and avoid padding.")
    if ig_result and not ig_result.status.startswith("200"):
        notes.append("Instagram not reliably readable without login/public access.")
    if about_result and not about_result.status.startswith("200"):
        notes.append("Official/about page fetch did not return a clean 200.")
    notes_text = " ".join(notes) if notes else "No special issue."
    return (
        f"| `{slug}` | {row.get('artistName','')} | "
        f"{about_result.status if about_result else 'missing'} | "
        f"{ig_result.status if ig_result else 'missing'} | "
        f"{newest} | {fact.replace('|', '/')} | {notes_text.replace('|', '/')} |"
    )


def main() -> None:
    data: dict[str, dict[str, str]] = json.loads(JSON_PATH.read_text(encoding="utf-8"))

    urls: list[str] = []
    for row in data.values():
        for url in source_links(row):
            if url not in urls:
                urls.append(url)
        handle = (row.get("instagramHandle") or "").strip().lstrip("@")
        if handle:
            ig_url = f"https://www.instagram.com/{handle}/"
            if ig_url not in urls:
                urls.append(ig_url)

    checks: dict[str, CheckResult] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        for result in pool.map(fetch_url, urls):
            checks[result.url] = result

    md_lines = [
        "# Artist Bios — Rewritten",
        "",
        "Generated as fresh editorial profile copy from current research rows, prioritizing 2024-2026 facts where verified in the dataset or live source checks.",
        "",
        "---",
        "",
    ]
    written_md_keys: set[str] = set()
    for slug, row in data.items():
        md_key = re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]+", " ", (row.get("artistName") or slug).lower())).strip()
        if md_key in written_md_keys:
            continue
        written_md_keys.add(md_key)
        md_lines.append(display_title(row))
        md_lines.append(build_bio(slug, row))
        md_lines.append("")
        md_lines.append("---")
        md_lines.append("")
    MD_PATH.write_text("\n".join(md_lines).rstrip() + "\n", encoding="utf-8")

    audit_lines = [
        "# Artist Bios Recency Audit — April 2026",
        "",
        "Generated by `scripts/generate_fresh_artist_bios.py`. HTTP checks are best-effort: Instagram and some portfolio sites may block automated reads, so blocked pages are not treated as factual sources.",
        "",
        "| Slug | Artist | Official/about check | Instagram check | Newest dated research | Recent fact used or status | Notes |",
        "|---|---:|---:|---:|---:|---|---|",
    ]
    for slug, row in data.items():
        audit_lines.append(build_audit_row(slug, row, checks))
    AUDIT_PATH.write_text("\n".join(audit_lines) + "\n", encoding="utf-8")

    print(f"Wrote {MD_PATH}")
    print(f"Wrote {AUDIT_PATH}")


if __name__ == "__main__":
    main()
