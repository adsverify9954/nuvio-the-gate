# The Gate worker (live backend)

Production source of truth: `my-anime-gate.js` (deployed as Cloudflare Worker `my-anime-gate`).

## Ye file hi deploy karo

```
wrangler deploy --no-bundle --keep-vars
```

`--keep-vars` zaroori hai: saare secrets dashboard par hain (STREAMTAPE_KEY/USER, MIXDROP_KEY/EMAIL,
UFOLOAD_*, ABYSS_API_KEY, BYSE_API_KEY, DOODSTREAM_API_KEY, EARNVIDS_API_KEY, TMDB_API_KEY, SYNC_KEY,
UPLOADS_JSON). Config mein sirf `DB` (D1) binding + cron `* * * * *` hai.

## Fixes included

- TMDB pe match na hone par bhi upload catalog mein aata hai (title-only row + playable host URL).
  Pehle `tmdbMatch` null hote hi worker `continue` kar deta tha, isliye naye videos app par nahi dikhte the.
- Filename sanitizer (`(GROUP)-`, `CineVood`, `Dubbed Movie`, `South` etc. hata ke TMDB match).
- `Thumb_*.jpg` / non-video files skip (pehle junk cards ban rahe the).
- Listing cache 3 min + 900 KB (pehle 15 min + 60 KB truncation se cache JSON toot jata tha).
- `Too many subrequests` par crash nahi, sync agle run mein continue.

## Endpoints

`/health`, `/debug/sync`, `/debug/runsync`, `/debug/clearcache`, `/debug/names`, `/debug/db`,
`/api/catalog?q=`, `/catalog/:type/:id.json`, `/meta/:type/:id.json`, `/stream/:type/:id.json`.