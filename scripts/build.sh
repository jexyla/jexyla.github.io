#!/bin/sh
# Collects the publishable site into dist/ (no planning docs or tooling).
# dist/ is what gets published on GitHub Pages (any static host also works).
# GitHub Pages serves about.html at /about and author.html at /author.
set -e
cd "$(dirname "$0")/.."
rm -rf dist
mkdir -p dist
# Every page and stylesheet at the root is part of the site
cp ./*.html ./*.css robots.txt sitemap.xml dist/
cp -R src data assets dist/
# Superseded by monzo-cover.png; kept in the project only for reference
rm -f dist/assets/images/monzo-1.png dist/assets/images/monzo-2.png
find dist -name '.DS_Store' -delete
# GitHub Pages: the custom domain, and no Jekyll processing (the site is already plain HTML)
printf 'jexyla.com\n' > dist/CNAME
touch dist/.nojekyll
echo "Built dist/ ($(du -sh dist | cut -f1))"
