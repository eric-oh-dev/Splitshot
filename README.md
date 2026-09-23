# SplitShot

A tiny bill-splitting tool for two people. Add items by hand, or scan a
receipt photo (read entirely in the browser with [Tesseract.js](https://github.com/naptha/tesseract.js) —
no server, no API key, no account). Tap each item to assign it to one of
you, the other, or split it down the middle.

This is a plain static website — three files (`index.html`, `styles.css`,
`app.js`) plus a manifest and icons for "Add to Home Screen". No build step,
no framework, no backend.

## Put it on GitHub Pages (free hosting, works on your phone)

Open a terminal in this folder (`splitshot-app`) and run:

```
git init
git add .
git commit -m "SplitShot: split the bill, just the two of you"
```

**If you have the GitHub CLI (`gh`) set up already**, this creates the repo
and pushes in one step:

```
gh repo create splitshot --public --source=. --remote=origin --push
```

**If you don't use `gh`**, create an empty repo instead at
https://github.com/new (name it `splitshot`, don't add a README), then:

```
git remote add origin https://github.com/<your-username>/splitshot.git
git branch -M main
git push -u origin main
```

### Turn on Pages

If you used `gh`, you can enable Pages from the same terminal:

```
gh api -X POST repos/<your-username>/splitshot/pages -f "source[branch]=main" -f "source[path]=/"
```

Otherwise: on github.com, open the repo → **Settings → Pages** → under
"Build and deployment" choose **Deploy from a branch**, branch **main**,
folder **/ (root)** → **Save**.

Give it a minute, then your app is live at:

```
https://<your-username>.github.io/splitshot/
```

Open that link on your phone and use **Add to Home Screen** (Safari: Share →
Add to Home Screen; Chrome: menu → Install app / Add to Home screen) — it'll
sit on your home screen as its own icon and open full-screen like a real app.

## Updating it later

Edit the files, then:

```
git add .
git commit -m "describe the change"
git push
```

GitHub Pages redeploys automatically within a minute or two.

## Notes

- The first time you scan a receipt on a given device, the browser downloads
  a small English-language reader (a few MB) from a CDN and caches it —
  after that, scans are instant and work offline.
- OCR reads text off a photo; it isn't as smart as a person, so double-check
  the item names and prices it finds before you trust the split. Wrong
  reads are common with faded or crumpled receipts — just correct or delete
  the line.
- Nothing about your receipts or names leaves your phone — there's no
  backend at all.
