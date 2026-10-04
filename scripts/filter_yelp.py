"""
filter_yelp.py — Extract agritourism/farm-tour reviews from the Yelp Open Dataset

Source: Yelp Open Dataset (https://www.yelp.com/dataset)
License: Yelp Dataset Challenge agreement — academic/non-commercial use
Size: ~10 million reviews, 8 GB compressed

USAGE
-----
1. Download the Yelp dataset from https://www.yelp.com/dataset/download
2. Unzip to get yelp_academic_dataset_business.json and yelp_academic_dataset_review.json
3. Run:
      python scripts/filter_yelp.py \
          --business yelp_academic_dataset_business.json \
          --reviews  yelp_academic_dataset_review.json \
          --out      src/data/yelpReviews.json

The script writes a JSON array of review strings ready to paste into sampleData.ts.

TARGET CATEGORIES (agritourism, small operators)
-------------------------------------------------
Tours | Agriculture | Coffee & Tea | Bed & Breakfast | Vineyards |
Wineries | Breweries | Farms | Guest Houses | Nature Tours |
Country Clubs | Herb Shops | Flowers & Gifts
"""

import json
import argparse
import re
from pathlib import Path

TARGET_CATEGORIES = {
    "tours", "agriculture", "coffee & tea", "bed & breakfast",
    "vineyards", "wineries", "breweries", "farms", "guest houses",
    "nature tours", "farm tours", "agritourism", "herb shops",
    "eco tours", "harvest festivals",
}

AGRI_KEYWORDS = re.compile(
    r"coffee|farm|harvest|crop|brew|vine|winery|tour|orchard|"
    r"tea|organic|sustainable|rural|countryside|plantation",
    re.IGNORECASE,
)

MIN_STARS = 3      # include 3–5 star reviews for balanced training data
MIN_CHARS = 120    # reviews shorter than this carry little signal
MAX_CHARS = 600    # cap very long reviews to keep token costs low
MAX_PER_BIZ = 5    # diversity: no more than 5 reviews per business
TOTAL_TARGET = 400  # how many to write to the output file


def load_target_businesses(path: str) -> set[str]:
    """Return business IDs whose categories overlap with TARGET_CATEGORIES."""
    hits: set[str] = set()
    with open(path, encoding="utf-8") as f:
        for line in f:
            try:
                biz = json.loads(line)
                cats = {c.strip().lower() for c in (biz.get("categories") or "").split(",")}
                if cats & TARGET_CATEGORIES:
                    hits.add(biz["business_id"])
            except json.JSONDecodeError:
                continue
    print(f"  Found {len(hits)} target businesses")
    return hits


def extract_reviews(review_path: str, biz_ids: set[str]) -> list[str]:
    """Stream reviews and return those matching the criteria."""
    per_biz: dict[str, int] = {}
    results: list[str] = []

    with open(review_path, encoding="utf-8") as f:
        for line in f:
            if len(results) >= TOTAL_TARGET:
                break
            try:
                r = json.loads(line)
            except json.JSONDecodeError:
                continue

            bid = r.get("business_id", "")
            if bid not in biz_ids:
                continue
            if r.get("stars", 0) < MIN_STARS:
                continue
            text: str = r.get("text", "").replace("\n", " ").strip()
            if not (MIN_CHARS <= len(text) <= MAX_CHARS):
                continue
            if not AGRI_KEYWORDS.search(text):
                continue
            if per_biz.get(bid, 0) >= MAX_PER_BIZ:
                continue

            per_biz[bid] = per_biz.get(bid, 0) + 1
            results.append(text)

    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--business", required=True)
    parser.add_argument("--reviews",  required=True)
    parser.add_argument("--out",      default="src/data/yelpReviews.json")
    args = parser.parse_args()

    print("Loading businesses …")
    biz_ids = load_target_businesses(args.business)

    print("Extracting reviews …")
    reviews = extract_reviews(args.reviews, biz_ids)
    print(f"  Extracted {len(reviews)} reviews")

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(reviews, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  Written to {out}")
    print()
    print("Paste the array into src/data/sampleData.ts as `export const sampleReviews`")
    print("Dataset citation: Yelp Open Dataset, Yelp Inc., academic use licence")


if __name__ == "__main__":
    main()
