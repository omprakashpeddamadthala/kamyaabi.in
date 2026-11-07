# Kamyaabi — 30s Instagram Reel

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
