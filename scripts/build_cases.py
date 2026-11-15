"""Generate the case-study pages from content extracted from the old Canva site.

Usage: python3 -I scripts/build_cases.py <canva-dir>
<canva-dir> holds <slug>.json (blocks from parse_canva.py) and img/<slug>/ (the downloaded images).
Writes <slug>.html at the project root (same addresses as before, e.g. /monzo-gambling-block-case-study)
and copies the images it uses to assets/cases/<slug>/.
"""
import html as H
import json, os, re, shutil, subprocess, sys
from collections import Counter
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1]

# slug, project id (data/projects.js), next slug — the landing page's order, skipping Deel (no case study yet)
CASES = [
    ("cleo-ai-prompt-engineering-case-study", "cleo", "cleo-ai-chat-case-study"),
    ("cleo-ai-chat-case-study", "ai-chats", "moneybox-mortgages-case-study"),
    ("moneybox-mortgages-case-study", "moneybox", "monese-credit-case-study"),
    ("monese-credit-case-study", "monese", "monzo-gambling-block-case-study"),
    ("monzo-gambling-block-case-study", "monzo", "cleo-ai-prompt-engineering-case-study"),
]
TITLES = {
    "cleo-ai-prompt-engineering-case-study": ("Cleo", "Behind the scenes of AI-generated Chats: Prompt Engineering"),
    "cleo-ai-chat-case-study": ("Cleo", "Designing for AI-generated Chats"),
    "moneybox-mortgages-case-study": ("Moneybox", "Building Moneybox Mortgage Advice"),
    "monese-credit-case-study": ("Monese", "Helping the ‘credit invisible’ customers"),
    "monzo-gambling-block-case-study": ("Monzo", "Ethical design: Gambling block"),
}
# Header as on the original pages: title with its key phrase in the brand colour (accent), logo colour (ink),
# and the summary card's tint (card). Colours sampled from the original jexyla.com pages.
HEADERS = {
    "cleo-ai-prompt-engineering-case-study": ("Behind the scenes of AI&#8209;generated Chats: <em>Prompt Engineering</em>", "#341cff", "#341cff", "#cad4f7"),
    "cleo-ai-chat-case-study": ("Designing for <em>AI&#8209;generated Chats</em>", "#341cff", "#341cff", "#cad4f7"),
    "moneybox-mortgages-case-study": ("Building <em>Moneybox Mortgage Advice</em>", "#046179", "#1f8a84", "#edfbf9"),
    "monese-credit-case-study": ("Helping the <em>‘credit invisible’</em> customers", "#277cff", "#1d5fd6", "#d5e3ff"),
    "monzo-gambling-block-case-study": ("Ethical design:<br><em>Gambling block</em>", "#fe4b60", "#ff4f40", "#fcf5e7"),
}
MIN_W, MIN_H = 400, 150


class Balance(HTMLParser):
    """Checks that a fragment's tags are properly nested."""
    def __init__(self):
        super().__init__(); self.stack = []; self.ok = True
    def handle_starttag(self, tag, attrs):
        if tag not in ("br",): self.stack.append(tag)
    def handle_endtag(self, tag):
        if not self.stack or self.stack.pop() != tag: self.ok = False


def clean(fragment):
    """Tidy Canva's inline markup: drop empty or misnested bold around links."""
    f = re.sub(r"<strong>(\s*<a [^>]*>)</strong>", r"\1", fragment)
    f = re.sub(r"<strong>\s*</strong>", " ", f)
    f = re.sub(r"\s+", " ", f).strip()
    b = Balance(); b.feed(f); b.close()
    if not b.ok or b.stack:
        f = re.sub(r"</?strong>", "", f)
    return f.replace(' href="http://jexyla.com"', ' href="index.html"')


def text_of(fragment):
    return H.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def dims(path):
    if path.endswith(".svg"):
        return 0, 0
    o = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", path], capture_output=True, text=True).stdout.split()
    return int(o[o.index("pixelWidth:") + 1]), int(o[o.index("pixelHeight:") + 1])


CONNECT = open(os.path.join(ROOT, "about.html"), encoding="utf-8").read()
CONNECT = CONNECT[CONNECT.index('  <footer class="connect">'):CONNECT.index("  </footer>") + len("  </footer>")]


def build(slug, project, nxt):
    blocks = json.load(open(os.path.join(SRC, f"{slug}.json")))
    imgdir = os.path.join(SRC, "img", slug)
    texts = [b for b in blocks if b["t"] in ("p", "li") and b.get("size")]
    body_font = Counter(b["font"] for b in texts).most_common(1)[0][0]
    body_size = Counter(b["size"] for b in texts if b["font"] == body_font).most_common(1)[0][0]
    counts = Counter(b["src"] for b in blocks if b["t"] == "img")

    # Summary: the paragraph after the "summary" label; the article starts after it.
    i = next(k for k, b in enumerate(blocks) if b["t"] == "p" and text_of(b["html"]).lower() == "summary")
    summary = clean(blocks[i + 1]["html"])
    body = blocks[i + 2:]

    out, used, video, section, n = [], {}, None, "Introduction", 0
    list_open = False
    company, title = TITLES[slug]

    def close_list():
        nonlocal list_open
        if list_open:
            out.append("      </ul>"); list_open = False

    for b in body:
        t = b["t"]
        if t in ("p", "li"):
            txt = text_of(b["html"])
            if txt.lower().startswith("next project") or txt.lower().startswith("let's connect") or txt.lower().startswith("let’s connect"):
                break
            frag = clean(b["html"])
            size = b.get("size") or body_size
            if t == "li":
                if not list_open:
                    out.append('      <ul class="case-list">'); list_open = True
                out.append(f"        <li>{frag}</li>")
                continue
            close_list()
            if b["font"] != body_font:
                if txt.lower() == "watch the video":
                    out.append(f'      <h2 class="reveal">{frag}</h2>'); section = txt; continue
                if len(txt) < 12 and size < body_size * 1.2:
                    continue   # decorative words inside a Canva figure (e.g. "Crazy", "8!")
                out.append(f'      <h2 class="reveal">{frag}</h2>'); section = txt
            elif size >= body_size * 1.05:
                if len(txt) <= 40 and not txt.endswith("."):
                    out.append(f'      <h3 class="reveal">{frag}</h3>'); section = txt
                else:
                    out.append(f'      <blockquote class="case-quote reveal">{frag}</blockquote>')
            elif b.get("bold"):
                if len(txt) <= 40:
                    out.append(f'      <h4 class="case-label">{frag}</h4>')
                else:
                    out.append(f'      <p class="case-lead">{frag}</p>')
            else:
                out.append(f"      <p>{frag}</p>")
        elif t == "img":
            close_list()
            name = b["src"].split("/")[-1]
            path = os.path.join(imgdir, name)
            if not os.path.exists(path) or name.endswith(".svg"):
                continue
            w, h = dims(path)
            if w < MIN_W or h < MIN_H:
                continue
            href = b.get("href") or ""
            is_video = "youtu" in href
            if counts[b["src"]] > 1 and not is_video:
                continue   # repeated device frames and backgrounds from Canva collages
            if is_video:
                if video:
                    continue
                video = href
            if name in used:
                continue
            n += 1
            ext = os.path.splitext(name)[1]
            dest_rel = f"assets/cases/{slug}/{n:02d}{ext}"
            used[name] = dest_rel
            os.makedirs(os.path.join(ROOT, "assets", "cases", slug), exist_ok=True)
            dest = os.path.join(ROOT, dest_rel)
            shutil.copyfile(path, dest)
            if max(w, h) > 1800:
                subprocess.run(["sips", "-Z", "1800", dest], capture_output=True)
                w, h = dims(dest)
            alt = H.escape(f"{company} {title}: {section}", quote=True)
            img = f'<img src="{dest_rel}" alt="{alt}" width="{w}" height="{h}" loading="lazy">'
            if is_video:
                out.append(f'      <a class="case-video reveal" href="{H.escape(href, quote=True)}" target="_blank" rel="noopener">{img}<span class="play" aria-hidden="true"></span><span class="visually-hidden">Watch the video on YouTube</span></a>')
            else:
                tall = " is-tall" if h > w * 1.15 else ""
                out.append(f'      <figure class="case-fig reveal{tall}">{img}</figure>')
        elif t == "embed":
            continue
    close_list()

    next_company, next_title = TITLES[nxt]
    title_html, accent, ink, card = HEADERS[slug]
    page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{H.escape(title)} – {company} case study – Jessica Lascar</title>
<meta name="description" content="{H.escape(text_of(summary)[:155], quote=True)}">
<link rel="canonical" href="https://jexyla.com/{slug}">
<link rel="icon" type="image/png" sizes="32x32" href="assets/images/site/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="assets/images/site/favicon-192.png">
<link rel="apple-touch-icon" href="assets/images/site/apple-touch-icon.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Jessica Lascar">
<meta property="og:title" content="{H.escape(title)} – {company} case study">
<meta property="og:description" content="{H.escape(text_of(summary)[:155], quote=True)}">
<meta property="og:url" content="https://jexyla.com/{slug}">
<meta property="og:image" content="https://jexyla.com/assets/images/site/og-portfolio.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Fraunces:ital,wght@0,600;1,600&family=Inter:wght@300;400;600&family=Poppins:wght@600;800&display=swap">
<link rel="stylesheet" href="about.css">
<link rel="stylesheet" href="case.css?v=9">
<script type="importmap">
{{ "imports": {{ "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js" }} }}
</script>
</head>
<body class="case-page" data-project="{project}" data-next="{nxt}" style="--sum-bg:{card}">
<!-- Generated by scripts/build_cases.py from the old Canva page; edit the text here freely. -->
<header class="top">
  <a class="back" href="index.html"><span aria-hidden="true">←</span> Work</a>
</header>
<main>
  <section class="case-hero">
    <div class="case-hero-text">
      <img class="case-logo" id="case-logo" alt="{company}">
      <h1 class="case-title">{title_html}</h1>
    </div>
    <figure class="case-art"><img src="assets/cases/{slug}/hero.png?v=8" alt="{H.escape(company)}: {H.escape(title)}, header illustration" width="1100" height="961"></figure>
  </section>

  <article class="case-body">
    <section class="summary-card">
      <p class="case-label">Summary</p>
      <p class="summary-text">{summary}</p>
    </section>
{chr(10).join(out)}
  </article>

  <section class="case-next">
    <a class="next-card" id="next-card" href="{nxt}.html">
      <span class="case-label">Next project</span>
      <span class="next-title">{H.escape(next_title)}</span>
      <span class="next-company">{next_company} <span aria-hidden="true">→</span></span>
    </a>
  </section>

{CONNECT}
</main>
<script type="module" src="src/case.js?v=4"></script>
</body>
</html>
"""
    # Cleo prompt engineering: Canva layered a grid image behind the diagram. Rebuild it as one framed figure
    # (diagram on its white card inside the purple grid) with the caption and its link underneath.
    if slug == "cleo-ai-prompt-engineering-case-study":
        page = re.sub(
            r'      <figure class="case-fig reveal"><img src="([^"]*?)/04\.png"[^>]*></figure>\n'
            r'      <figure class="case-fig reveal"><img src="[^"]*?/05\.png" alt="([^"]*)"[^>]*></figure>\n'
            r'      <p>(Learn more about Prompt Engineering <a [^>]*>here</a>)</p>',
            lambda m: ('      <figure class="case-frame reveal">\n'
                       f'        <div class="frame" style="--frame:url({m.group(1)}/04.png)"><img src="{m.group(1)}/05.png" alt="Diagram: a prompt, ‘What are 3 good books?’, goes into the model and produces the output ‘1984, Lord of the Rings, The Kite Runner’" width="1171" height="437" loading="lazy"></div>\n'
                       f'        <figcaption>{m.group(3)}</figcaption>\n'
                       '      </figure>'),
            page)
    # Cleo AI chat: Canva built several figures from layered pieces (backgrounds, frames, logos, overlays).
    # They are replaced here by the finished compositions (saved as fix-N.* beside the other images).
    if slug == "cleo-ai-chat-case-study":
        base = f"assets/cases/{slug}"
        def fig_re(n):
            return re.compile(r'      <figure class="case-fig reveal(?: is-tall)?"><img src="' + re.escape(base) + rf'/{n:02d}\.png"[^>]*></figure>\n')
        def new_fig(img, w, h, alt, cls=""):
            return (f'      <figure class="case-fig reveal{cls}"><img src="{base}/{img}" alt="{alt}" '
                    f'width="{w}" height="{h}" loading="lazy"></figure>\n')
        # (first piece to replace, extra pieces to drop, new figure)
        swaps = [
            (4, [], new_fig("fix-1.jpg", 1422, 968, "Cleo’s reply to an angry user: ‘Go fly a kite. You suck!’ is answered with ‘Ouch that stings a bit. But hey, I’d probably look fabulous flying a kite. Feel free to drop me a line when you’re ready to talk money again. Keep it breezy.’, with a Talk to a human button")),
            (5, [6], new_fig("fix-2.png", 1776, 772, "The annotation tool’s conversation view: the user asks ‘until when’ and the GPT response says ‘Your next repayment date is now Aug 32. That’s 15 days more than the original Aug 17’, with the mistake circled")),
            (7, [], new_fig("fix-3.jpg", 1866, 1060, "The first, rudimentary system: a spreadsheet of requests and responses, with columns for whether the intent was classified correctly, which response is better, and notes")),
            (9, [10, 11], new_fig("fix-4.png", 1238, 1090, "GPT versus Cleo: the GPT Responses Annotations tool, showing the user request, the GPT and Cleo responses side by side, rating buttons and the question ‘Did we classify the request correctly?’")),
            (12, [13], new_fig("fix-6.jpg", 1798, 1400, "The GPT Responses Annotations tool with a sticky note listing what annotators want to provide: an overall judgement of which response was better, feedback on utility, tone of voice and factual accuracy, and a judgement of whether the actions were sensible")),
            (16, [], new_fig("fix-7.jpg", 2000, 950, "The completion screen: ‘Great! That’s all 25 requests annotated. Thank you’, with a machine learning meme as a thank-you and confetti on both sides")),
        ]
        for first, extra, replacement in swaps:
            page, n = fig_re(first).subn(lambda m, r=replacement: r, page, 1)
            assert n == 1, f"figure {first} not found"
            for e in extra:
                page, n = fig_re(e).subn("", page, 1)
                assert n == 1, f"figure {e} not found"
        # the four overall-judgement panels (GPT better / Cleo better / both good / both bad), after the side-by-side paragraph
        panel = new_fig("fix-5.png", 1013, 2000, "The overall judgement options: GPT response was better, Cleo response was better, both good and both bad, each shown with the GPT and Cleo responses side by side", " is-tall")
        page, n = re.subn(r'(      <p>This side-by-side comparison[^\n]*</p>\n)', lambda m: m.group(1) + panel, page, 1)
        assert n == 1, "side-by-side paragraph not found"
    # Moneybox: Canva layered the two customer quotes, the phone screen and the award badge. They are replaced by
    # one finished composition (fix-quotes.jpg, beside the other images).
    if slug == "moneybox-mortgages-case-study":
        base = f"assets/cases/{slug}"
        trio_re = re.compile(
            r'      <figure class="case-fig reveal"><img src="' + re.escape(base) + r'/11\.png"[^>]*></figure>\n'
            r'      <figure class="case-fig reveal"><img src="' + re.escape(base) + r'/12\.png"[^>]*></figure>\n'
            r'      <figure class="case-fig reveal"><img src="' + re.escape(base) + r'/13\.png"[^>]*></figure>\n')
        quotes = (f'      <figure class="case-fig reveal"><img src="{base}/fix-quotes.jpg" '
                  'alt="Two Moneybox Mortgages customer quotes beside the Mortgage in Principle screen, with the What Mortgage Awards 2023 badge. '
                  'Gary: ‘I can’t believe the service is free but even if it wasn’t, I’d still happily pay. Moneybox made the process and our journey of buying our first home so smooth.’ '
                  'Susie: ‘I’m so happy to have bought my first home and the whole package made it stress-free. As the first in my family to buy a home, I needed a lot of hand holding, which is exactly what I got.’" '
                  'width="2000" height="976" loading="lazy"></figure>\n')
        page, hits = trio_re.subn(lambda m: quotes, page, 1)
        assert hits == 1, "Moneybox quote figures not found"
    page = page.replace('<h2 class="reveal">Watch the video</h2>',
        '<h2 class="reveal watch-title"><span>Watch the video</span>'
        '<svg class="watch-arrow" viewBox="745 88 190 124" aria-hidden="true"><path d="M752 108 C 800 90, 862 96, 870 128 C 874 152, 836 164, 821 149 C 808 136, 834 117, 860 128 C 886 139, 906 166, 916 200"/>'
        '<path d="M927 176 L916 204 L884 193"/></svg></h2>')
    # Monese: Canva built several figures from layered pieces. They are replaced by the finished compositions
    # (img-N.jpg beside the other images, N = the order Jessica numbered them), each in the figure's original place.
    if slug == "monese-credit-case-study":
        base = f"assets/cases/{slug}"
        def fig_re(n):
            return re.compile(r'      <figure class="case-fig reveal(?: is-tall)?"><img src="' + re.escape(base) + rf'/{n:02d}\.png"[^>]*></figure>\n')
        def new_fig(img, w, h, alt):
            return (f'      <figure class="case-fig reveal"><img src="{base}/{img}" alt="{alt}" '
                    f'width="{w}" height="{h}" loading="lazy"></figure>\n')
        i2 = new_fig("img-2.jpg", 2000, 1022, "Two phones: the Monese home screen with an Early Bird available transaction, and the confirmation ‘Hooray! Your money is on its way! You’ll receive £200 in your GBP account shortly’")
        i3 = new_fig("img-3.jpg", 2000, 1016, "Personal loan offers: ‘Please see your offers below’, with a pre-approved offer from Paragon at £293.91 a month, the loan amount, APRC, term and total repayment, an Apply now button and the lender’s details")
        i4 = new_fig("img-4.jpg", 1143, 633, "Three loan screens: ‘Last step – almost there!’ to confirm details, ‘Checking lending partners to find the best offers for you…’, and the pre-approved Paragon offer")
        i5 = new_fig("img-5.jpg", 2000, 1008, "The three sections of the application: Section 1 Contact details (address history, email and phone) with the ‘Your address history’ screen; Section 2 Employment (employment type and status, income) with ‘What’s your employment status?’; Section 3 Expenditure (rent or mortgage, outstanding loans, dependants) with ‘Other regular expenses?’")
        i6 = new_fig("img-6.jpg", 1452, 797, "Three screens that start a loan application: the Monese home screen with an ‘Apply for a personal loan’ card, the ‘Apply for a personal loan’ screen (quick application, no impact on credit score, see your chances of approval) and ‘Keep this information…’ (UK address, employment)")
        i7 = new_fig("img-7.jpg", 2000, 1016, "Jessica’s Credit Assistant screen: a credit score gauge showing 985, Excellent, and a checklist of receiving your salary, saving regularly, paying your bills on time and opening a Monese account, with 1 of 4 tasks completed")
        i8 = new_fig("img-8.jpg", 1205, 684, "The Credit Assistant checklist in three states: 1 of 4 tasks completed, the ‘Save regularly’ screen with an ‘Open a pot’ button, and 4 of 4 tasks completed")
        i9 = new_fig("img-9.jpg", 1404, 813, "Three Credit Assistant task screens: ‘Do you get your salary paid directly into your account?’, ‘Join the electoral roll’ with a Register to vote button, and ‘Pay your bills on time’ with a Set up Direct Debits button")
        f4 = new_fig("fix-4.jpg", 2000, 1054, "User testing findings. Loan amount and term: 8 out of 8 participants engaged with the slider, although they were a bit put off by the extra granularity, and 2 out of 8 asked for a calculator. Loan questions: 8 out of 8 had no major issues answering all the questions, and 1 out of 8 was worried about tapping ‘Self-employed’")
        f5 = new_fig("fix-5.jpg", 2000, 1022, "Five quotes from user testing, including ‘I love it! I really liked that you can edit from this screen’, ‘I like the progress bar at the top, it’s cool!’, ‘The flow was pretty straightforward, it was split nicely with not all the questions on one page’, ‘I think it’s very straightforward and a lot less painful than what is out there’ and ‘your journey was a lot more coherent’")
        f6 = new_fig("fix-6.jpg", 2000, 1190, "The loan calculator flow: the ‘I want to borrow’ and ‘I want to repay in’ sliders, the estimated total to pay (£1,080.42 for a £1,000 loan over 12 months) and the credit agreement to read and confirm")
        def swap(n, replacement, drop=()):
            nonlocal page
            page, k = fig_re(n).subn(lambda m: replacement, page, 1)
            assert k == 1, f"figure {n} not found"
            for d in drop:
                page, k = fig_re(d).subn("", page, 1)
                assert k == 1, f"figure {d} not found"
        swap(5, i2)     # end of "Our vision": the two-phone cut-out becomes the two phones on the blue panel
        swap(6, i3)     # end of the Salary advance lists (after "Helps our Credit Risk team…")
        swap(7, i4)     # end of the Personal Loans lists (after the same line)
        page, k = re.subn(r'(        <li>Expenditure</li>\n      </ul>\n)', lambda m: m.group(1) + i5, page, 1)   # after Contact details / Employment / Expenditure
        assert k == 1, "section list not found"
        swap(9, i6)     # after "We also ensured that from the very beginning…"
        swap(11, f4, drop=(12,))
        swap(13, f5)
        swap(19, f6)
        swap(22, i7)    # after "The drop-off decreased by 5.5%…"
        swap(23, i8)    # after "Advanced features could be monetized…"
        swap(24, i9)    # after "This approach not only educates users…"
    # Monzo: the forum screenshot sits in a coral rounded frame, with the card centred in it (fix-forum.png,
    # composed from the original so the frame and card are one image).
    if slug == "monzo-gambling-block-case-study":
        base = f"assets/cases/{slug}"
        forum_re = re.compile(r'      <figure class="case-fig reveal(?: is-tall)?"><img src="' + re.escape(base) + r'/07\.png"[^>]*></figure>\n')
        forum = (f'      <figure class="case-fig reveal"><img src="{base}/fix-forum.png" '
                 'alt="Monzo community forum post by Richard Cook, Social Media Manager, titled ‘Supporting People to Self-Exclude from Gambling’: ‘We’re working on a feature that lets people block transactions to gambling sites, directly from the Monzo app.’" '
                 'width="1668" height="780" loading="lazy"></figure>\n')
        page, hits = forum_re.subn(lambda m: forum, page, 1)
        assert hits == 1, "Monzo forum figure not found"
    # Cleo prompt engineering: the automated evaluation screen sits in a blue rounded frame, with the card centred in it
    # (fix-eval.png, composed from the original so the frame and card are one image).
    if slug == "cleo-ai-prompt-engineering-case-study":
        base = f"assets/cases/{slug}"
        eval_re = re.compile(r'      <figure class="case-fig reveal(?: is-tall)?"><img src="' + re.escape(base) + r'/19\.png"[^>]*></figure>\n')
        evalfig = (f'      <figure class="case-fig reveal is-tall" style="width:min(620px,100%)"><img src="{base}/fix-eval.png" '
                   'alt="The automated evaluation results screen: an overall winning score of 80% for Cleo against 20% for the LLM, scores for utility, tone of voice, factual accuracy and sensible actions, and an expanded test case comparing the Cleo and LLM responses, marked ‘Cleo response was better!’" '
                   'width="960" height="1301" loading="lazy"></figure>\n')
        page, hits = eval_re.subn(lambda m: evalfig, page, 1)
        assert hits == 1, "Cleo evaluation figure not found"
    open(os.path.join(ROOT, f"{slug}.html"), "w", encoding="utf-8").write(page)
    print(f"{slug}.html: {len(out)} blocks, {n} images" + (", video" if video else ""))


for slug, project, nxt in CASES:
    build(slug, project, nxt)
