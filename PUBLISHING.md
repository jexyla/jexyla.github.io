# Publishing jexyla.com

The new site is ready to upload as a static site. Every page keeps its old address, so existing links keep working:

| Page | File | Live address |
|---|---|---|
| Work (landing) | `index.html` | jexyla.com |
| About | `about.html` | jexyla.com/about |
| Author | `author.html` | jexyla.com/author |
| Case study: Prompt Engineering (Cleo) | `cleo-ai-prompt-engineering-case-study.html` | jexyla.com/cleo-ai-prompt-engineering-case-study |
| Case study: AI-generated Chats (Cleo) | `cleo-ai-chat-case-study.html` | jexyla.com/cleo-ai-chat-case-study |
| Case study: Mortgage Advice (Moneybox) | `moneybox-mortgages-case-study.html` | jexyla.com/moneybox-mortgages-case-study |
| Case study: Credit (Monese) | `monese-credit-case-study.html` | jexyla.com/monese-credit-case-study |
| Case study: Ethical design: Gambling block (Monzo) | `monzo-gambling-block-case-study.html` | jexyla.com/monzo-gambling-block-case-study |
| Case study: Engage Canvas (Deel), password protected | `deel-engage-canvas-case-study.html` | jexyla.com/deel-engage-canvas-case-study |
| Book: We May Be Fractured | `we-may-be-fractured.html` | jexyla.com/we-may-be-fractured |
| Book: Love is a Mess | `love-is-a-mess.html` | jexyla.com/love-is-a-mess |
| Illustrations | `illustrations.html` | jexyla.com/illustrations |
| Page not found | `404.html` | any missing address |

GitHub Pages serves `about.html` at `/about` (and so on), so the addresses above work as written. The site is published on **GitHub Pages**.

## 1. Build the upload folder

```bash
./scripts/build.sh
```

This creates `dist/` (about 60 MB, most of it case-study images and the Deel video) with only the files the site needs. The planning docs and tooling are left out. Re-run it after every change.

## 2. Put it on GitHub Pages

The repository is `jexyla/jexyla.github.io`: public, default branch `master`. Today it holds your 2023 Jekyll site, with a `CNAME` for jexyla.com. The new site replaces it, and the old one stays in the repository's git history, so nothing is lost.

In Terminal:

```bash
git clone https://github.com/jexyla/jexyla.github.io.git ~/Developer/jexyla.github.io
cd ~/Developer/jexyla.github.io
git rm -r -q .                       # clear the old site (it stays in history)
rsync -a --exclude private --exclude dist --exclude .DS_Store ~/Developer/immersive-portfolio/ ./
git add -A
git status                           # check that "private/" does NOT appear anywhere
git commit -m "New portfolio site"
git push origin master
```

- **Keep `private/` out.** It holds the unencrypted Deel case study, and the repository is public. The command above excludes it and the `.gitignore` backs that up. Never force-add it.
- **Signing in.** The first push asks you to sign in to GitHub. GitHub Desktop or `gh auth login` is the easiest way.
- **Turn on the workflow.** In the repository, go to **Settings → Pages → Source: GitHub Actions**. After that, every push to `master` builds the site (`scripts/build.sh`) and publishes it. Progress shows on the **Actions** tab.
- **Previewing.** Because the repository has a custom domain set, `jexyla.github.io` redirects to jexyla.com, which is still Canva until you change the DNS. To check the new site first, open the Pages settings, remove the custom domain, look at `https://jexyla.github.io`, then add `jexyla.com` back.
- **Later updates.** Edit the project, run `./scripts/build.sh` to check it, copy the changes into the repository folder the same way, and push.

## 3. Point jexyla.com at GitHub

1. In **Settings → Pages → Custom domain**, check that it says `jexyla.com`.
2. **Write down or screenshot your current DNS records first.** They point at Canva, and you'll want them if you ever need to switch back.
3. Where the domain's DNS is managed, replace those records with:
   - Four **A** records for `jexyla.com`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Optionally four **AAAA** records: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - One **CNAME** for `www` pointing to `jexyla.github.io`
4. Wait for DNS to update (minutes, sometimes a few hours), then tick **Enforce HTTPS** in **Settings → Pages**. GitHub issues the certificate itself, which can take up to an hour.

Push and check the new site **before** changing the DNS. Once DNS points at GitHub, visitors get whatever is in the repository at that moment.

## Pages that were not rebuilt

The old Canva site also had a pre-order "freebies" page and a Chapter 1 page for We May Be Fractured. They were not rebuilt, so the **Get freebies** and **Read chapter 1** buttons were removed from `we-may-be-fractured.html`. Once jexyla.com moves to GitHub, those two old addresses show the "page not found" page.

## What's included

- The case studies are generated from the old Canva content by `scripts/build_cases.py`. After that, edit the `.html` files directly, since re-running the script would overwrite them.
- The book pages keep the Canva character cards, excerpt quotes, mini comic and Deluxe Edition as images. Their full text is in each image's description, for screen readers and search engines.

- All images are stored in the site itself. Nothing loads from the old Canva site.
- Each page has a title, a description, a share image (`assets/images/site/og-*.png`) and a favicon.
- `robots.txt` and `sitemap.xml` are included, so search engines can find every page.
- Deel shows no "Open case study" link until there is one. To add it, set the Deel `url` in `data/projects.js`.

## The password-protected Deel case study

The Deel case study opens behind a password. The password is deliberately not written down anywhere in this project, because the repository is public. Its text and all 25 images are encrypted (AES-256-GCM, with the key derived from the password), so the published files contain only scrambled data. Without the password nobody can read it, even by viewing the page source or opening the image files. Once someone unlocks it, it stays open in that browser tab until they close it.

- **Edit it:** change `private/deel/content.html` (images go in `private/deel/assets/`), then re-lock:

  ```bash
  node scripts/lock_page.mjs "<your password>"
  ```

- **Change the password:** run the same command with the new password. The old one stops working.
- **Keep the source private:** `private/` is never copied into `dist/` and is in `.gitignore`. Don't commit it, because a public repository would expose the unencrypted case study.
- **Limits:**
  - Anyone you give the password to can share it.
  - Anyone can download the encrypted files and try guesses offline, so use a long random password (16+ random characters, or four or more random words), not a short or guessable one.
  - The page is marked "noindex" and isn't in the sitemap, so search engines won't list it.

## Optional extras

- **Smaller images:** most of the 38 MB is large PNG mock-ups. Images below the fold load only as visitors scroll, but running the PNGs in `assets/` through a compressor such as TinyPNG would make pages faster.
- **Analytics:** a privacy-friendly tracker such as Plausible can be added to each page later.
