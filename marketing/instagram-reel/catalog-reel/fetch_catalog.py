"""Pull the LIVE Kamyaabi catalog (products, sizes, prices, jar photos) for the reel.

Writes:
  data/catalog-data.js   -> window.CATALOG = [...]  (read by reel.html)
  data/jars/<id>.webp    -> trimmed, transparent jar photos (900px tall)

Usage: python3 fetch_catalog.py [--base https://kamyaabi.in]
"""
import argparse, datetime, io, json, os, subprocess
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))

# Display copy + label accent colour per product id. Taglines come from the
# storefront's category copy (HomePage.tsx CATEGORY_STYLE_MAP). The order of
# this dict is the order products appear in the reel (alternating colours).
STYLE = {
    58:  ("California Almonds",          "Badam · Rich, Nutty, Crunchy",        "#875246"),
    92:  ("Roasted & Salted Pistachios", "Pista · Savory, Crunchy, Salty",      "#3a7656"),
    86:  ("Cashew Nuts",                 "Kaju · Creamy, Buttery, Rich",        "#494c88"),
    102: ("Dried Anjeer",                "Figs · Sweet, Chewy, Fiber-Rich",     "#874044"),
    99:  ("Chilean Walnuts",             "Akhrot · Brain Food, Premium Halves", "#6a4654"),
    81:  ("Seedless Raisins",            "Kishmish · Sweet, Tangy, Juicy",      "#ba9528"),
    89:  ("Roasted Cashews",             "Kaju · Creamy, Buttery, Rich",        "#33675c"),
    61:  ("Roasted Almonds",             "Badam · Rich in Protein & Fiber",     "#916054"),
    96:  ("Split Cashews",               "Kaju Tukda · Creamy, Buttery, Rich",  "#505498"),
    66:  ("Yellow Dry Dates",            "Khajur · Naturally Sweet & Healthy",  "#b07a3e"),
    84:  ("Afghani Black Raisins",       "Seedless · Sweet, Tangy, Juicy",      "#4a4a52"),
    72:  ("Pumpkin Seeds",               "Pepitas · Nutrient-Dense Superfood",  "#5c8167"),
    78:  ("Sunflower Seeds",             "Nutrient-Dense Superfood",            "#c4a11a"),
    75:  ("Chia Seeds",                  "Rich in Fiber & Protein",             "#5d6066"),
}
DEFAULT_COLOR = "#7a6a52"


def get(url):
    # curl honours the sandbox/corporate proxy + CA bundle without extra config
    return subprocess.run(["curl", "-sSfL", "-m", "60", url], check=True, capture_output=True).stdout


def short_name(name):
    return name.split("|")[0].split("–")[0].strip()


def prep_jar(raw, out_path):
    im = Image.open(io.BytesIO(raw)).convert("RGBA")
    # Images without transparency (e.g. chia) sit on white: knock the white out
    # by flood-filling from the corners so the label's own whites survive.
    if im.getextrema()[3][0] == 255:
        import numpy as np
        from PIL import ImageDraw
        mask_src = im.convert("RGB")
        for corner in [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]:
            # generous threshold also removes the soft grey floor shadow
            ImageDraw.floodfill(mask_src, corner, (255, 0, 255), thresh=115)
        arr = np.asarray(mask_src)
        bg = (arr[..., 0] == 255) & (arr[..., 1] == 0) & (arr[..., 2] == 255)
        keep = ~bg
        # The jar is a cylinder as wide as its lid: drop anything (the floor
        # shadow) outside the lid's columns, and light-grey shadow pixels
        # along the very bottom edge.
        ys, xs = np.nonzero(keep)
        top, bottom = ys.min(), ys.max()
        lid_row = keep[top + int((bottom - top) * 0.04)]
        lx = np.nonzero(lid_row)[0]
        keep[:, : max(0, lx.min() - 2)] = False
        keep[:, lx.max() + 3:] = False
        rgb = np.asarray(im.convert("RGB")).astype(int)
        lum = rgb.mean(axis=2)
        sat = rgb.max(axis=2) - rgb.min(axis=2)
        band = np.zeros_like(keep)
        band[bottom - int((bottom - top) * 0.07):, :] = True
        keep &= ~(band & (lum > 120) & (sat < 25))
        alpha = Image.fromarray(np.where(keep, 255, 0).astype("uint8"), "L")
        im.putalpha(alpha)
    bbox = im.getchannel("A").point(lambda a: 255 if a > 12 else 0).getbbox()
    im = im.crop(bbox)
    im.thumbnail((900, 900), Image.LANCZOS)
    im.save(out_path, "WEBP", quality=90, method=6)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="https://kamyaabi.in")
    args = ap.parse_args()
    os.makedirs(os.path.join(HERE, "data", "jars"), exist_ok=True)

    listing = json.loads(get(f"{args.base}/api/products?page=0&size=200"))["data"]["content"]
    products = []
    for item in listing:
        if not item.get("active", True):
            continue
        p = json.loads(get(f"{args.base}/api/products/{item['id']}"))["data"]
        variations = sorted(p.get("variations") or [{
            "weight": p["weight"], "unit": p["unit"], "price": p["price"],
            "discountPrice": p.get("discountPrice"), "stock": p.get("stock", 0)}],
            key=lambda v: float(v["weight"]))
        sizes = []
        for v in variations:
            if (v.get("stock") or 0) <= 0:
                continue  # don't advertise sizes that are out of stock
            mrp = float(v["price"])
            sale = float(v["discountPrice"]) if v.get("discountPrice") else mrp
            sizes.append({
                "label": f"{v['weight']} {v['unit']}",
                "price": round(sale), "mrp": round(mrp),
                # same rounding as ProductCard.tsx / ProductDetailPage.tsx
                "off": round((mrp - sale) / mrp * 100) if sale < mrp else 0,
            })
        if not sizes:
            continue
        name, tagline, color = STYLE.get(p["id"], (short_name(p["name"]), p.get("categoryName", "").title(), DEFAULT_COLOR))
        jar = f"data/jars/{p['id']}.webp"
        prep_jar(get(p.get("mainImageUrl") or p["imageUrl"]), os.path.join(HERE, jar))
        products.append({"id": p["id"], "name": name, "tagline": tagline, "color": color,
                         "category": p.get("categoryName", ""), "slug": p["slug"], "jar": jar, "sizes": sizes})
        print(f"{p['id']:>4} {name:30} " + "  ".join(f"{s['label']} ₹{s['price']} (₹{s['mrp']})" for s in sizes))

    order = list(STYLE.keys())
    products.sort(key=lambda x: order.index(x["id"]) if x["id"] in order else 999)
    data = {"asOf": datetime.date.today().strftime("%d %b %Y"), "products": products}
    with open(os.path.join(HERE, "data", "catalog-data.js"), "w") as f:
        f.write("window.CATALOG = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")
    print(f"{len(products)} products written (prices as on {data['asOf']})")


if __name__ == "__main__":
    main()
