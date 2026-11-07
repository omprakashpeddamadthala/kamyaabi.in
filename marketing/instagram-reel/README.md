# Kamyaabi Instagram Reels

## ⭐ Full-catalog price reel (recommended)

All **14 live products × 3 sizes (100 g / 250 g / 500 g)** with sale price, struck-through MRP and savings,
pulled from the live store API (`/api/products` + each product's `variations`) and the current jar photos.

| File | Use |
|------|-----|
| `kamyaabi-catalog-reel.mp4` | **Post this.** 1080×1920, 30 fps, H.264 + AAC, 58 s, original royalty-free music, -14 LUFS |
| `kamyaabi-catalog-reel-no-audio.mp4` | Silent version for adding a trending Instagram sound |
| `kamyaabi-catalog-reel-cover.jpg` | Cover frame ("Premium Dry Fruits starting at just ₹100") |
| `story-cards/*.jpg` | One finished 1080×1920 price card per product, for Stories / WhatsApp Status |
| `CATALOG_REEL_CAPTION.txt` | Ready-to-paste caption with the full price list, generated from the same data |

**Storyboard (58 s; every cut is on the 120 BPM beat):**
0–3 s hook "Premium Dry Fruits starting at just ₹100 · up to 20% OFF · free delivery" →
3–6 s all 14 jars pop into a grid →
6–48 s one 3-second card per product (category chip, `01 / 14` counter, jar, "20% OFF" stamp, three price cards) →
48–52 s Why Kamyaabi (free delivery, up to 20% off, sealed fresh, secure payments) →
52–58 s `kamyaabi.in` + pulsing **Shop Now**, "Prices as on <date> · subject to change".

**Rebuilding when prices change** (needs network access to `kamyaabi.in` and `res.cloudinary.com`):

```bash
cd marketing/instagram-reel/catalog-reel
./build.sh             # fetch live catalog -> frames -> music -> MP4s + story cards
./build.sh --offline   # re-render from the last fetched data/
```

New products show up automatically (add a display name, tagline and colour in `STYLE` in
`fetch_catalog.py`, otherwise a fallback is used). Out-of-stock sizes are left out. The % OFF uses the
same `Math.round` as the storefront.

> ⚠️ **Pricing check:** for Chilean Walnuts and California Almonds, the 250 g pack costs more per 100 g
> than the 100 g pack (Walnuts ₹232 vs ₹200; Almonds ₹160 vs ₹150 per 100 g). Customers comparing
> sizes in the reel may notice that, so you may want to adjust those prices and re-run `./build.sh`.

---

## Original 30 s brand reel

> Note: this one uses the older **pouch** packaging images bundled in the frontend repo; the live store
> now shows **jars**. Prefer the catalog reel above.

| File | Use |
|------|-----|
| `kamyaabi-reel-30s.mp4` | **Post this.** 1080×1920, 30 fps, H.264 + AAC, 30.0 s, original royalty-free soundtrack, -14 LUFS |
| `kamyaabi-reel-30s-no-audio.mp4` | Silent version for adding a trending sound from Instagram's audio library (usually gets more reach) |
| `kamyaabi-reel-cover.jpg` | Cover frame (the "Shop Now" CTA), for "Edit cover → Add from camera roll" |

## Storyboard

| Time | Scene | On-screen |
|------|-------|-----------|
| 0–3 s | Hook | "Still buying ~~loose, stale~~ dry fruits?" with floating cashews |
| 3–6.6 s | Brand | Kamyaabi logo, "Premium Dry Fruits, hand-picked for you", 3-pack shot (music drops in) |
| 6.6–10 s | Almonds (teal) | California Almonds: 22.7 g protein, 11.6 g fibre per 100 g |
| 10–13.4 s | Pistachios (green) | Roasted & salted: 20.9 g protein, 9.9 g fibre per 100 g |
| 13.4–16.8 s | Cashews (purple) | Split + Whole W320: buttery & rich, healthy fats, magnesium |
| 16.8–20 s | Jumbo Almonds (white) | 22.6 g protein, 628 kcal per 100 g |
| 20–24.6 s | Why Kamyaabi | Hand-picked · Sealed for freshness · FREE delivery · Secure payments |
| 24.6–30 s | CTA | kamyaabi.in · pulsing **Shop Now** · Link in bio · Free delivery |

Text stays within Instagram's safe zone (clear of the top bar and the bottom caption/buttons).

### Where the claims come from
- Nutrition figures: the product packaging images in `kamyaabi-frontend/public/assets/img/product/`
- "Hand-picked", "sealed for freshness", "across India": site copy (`SiteHead.tsx`, `AboutPage.tsx`, `HomePage.tsx`)
- "FREE delivery": cart and checkout always show Delivery = FREE (`CartPage.tsx`, `OrderSummaryCard.tsx`)
- "Secure payments (UPI / cards / netbanking)": Razorpay checkout
- Prices are deliberately left out because the seed prices in `DataInitializer.java` may not match production.
- Returns aren't mentioned because product pages say "Non-Returnable". Home-page testimonials aren't used either.

## Suggested caption

```
Still buying loose, stale dry fruits? 🥜
Switch to Kamyaabi: premium almonds, pistachios & cashews, hand-picked and sealed for freshness.

✅ California & Jumbo Almonds
✅ Roasted & Salted Pistachios
✅ Split & Whole W320 Cashews
🚚 FREE delivery across India
🔒 Secure UPI / card payments

🛒 Shop now at kamyaabi.in (link in bio)

#Kamyaabi #DryFruits #Almonds #Cashews #Pistachios #HealthySnacking #ProteinSnacks #HealthyIndia #DryFruitsOnline #Badam #Kaju #Pista #NutsAboutNuts #FestiveGifting #ShopOnline
```

## Re-rendering / editing

The source in `source/` uses the storefront's own images from `kamyaabi-frontend/public/assets/img`.
Edit text, colors, or timing in `source/reel.html` (the `SCENES` array and `render(t)`), then:

```bash
cd marketing/instagram-reel/source
node render.js frames 30                 # 900 JPEG frames (Playwright + Chromium)
python3 music.py music.wav               # original soundtrack (numpy)
ffmpeg -framerate 30 -i frames/f%04d.jpg -i music.wav -map 0:v -map 1:a \
  -c:v libx264 -profile:v high -crf 18 -pix_fmt yuv420p -r 30 \
  -af "loudnorm=I=-14:TP=-1.5:LRA=7" -c:a aac -b:a 192k -movflags +faststart -t 30 \
  ../kamyaabi-reel-30s.mp4
```

Preview a single moment: `node render.js stills 30 8.5,15.5` writes `stills/t8.50.jpg`, etc.
