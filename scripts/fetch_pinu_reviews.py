import json
import re
import sys
import urllib.parse
import urllib.request

APP_ID = "6758291757"
COUNTRY = "us"
APP_URL = f"https://apps.apple.com/us/app/pinu-language-learning/id{APP_ID}"
REVIEWS_URL = f"https://apps.apple.com/us/app/{APP_ID}?see-all=reviews&platform=iphone"


def read_url(url):
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", "ignore"), response.geturl()


def read_json(url):
    text, _ = read_url(url)
    return json.loads(text)


def extract_review_objects(html):
    reviews = []
    seen = set()
    needle = '{"$kind":"Review"'
    pos = 0
    while True:
        start = html.find(needle, pos)
        if start == -1:
            break
        depth = 0
        in_string = False
        escaped = False
        end = start
        while end < len(html):
            char = html[end]
            if in_string:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == '"':
                    in_string = False
            elif char == '"':
                in_string = True
            elif char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    end += 1
                    break
            end += 1
        try:
            review = json.loads(html[start:end])
            review_id = review.get("id")
            if review_id and review_id not in seen:
                seen.add(review_id)
                reviews.append(review)
        except json.JSONDecodeError:
            pass
        pos = end
    return reviews


def main():
    lookup_url = "https://itunes.apple.com/lookup?" + urllib.parse.urlencode(
        {"id": APP_ID, "country": COUNTRY}
    )
    lookup = read_json(lookup_url)
    app = lookup["results"][0]
    html, final_reviews_url = read_url(REVIEWS_URL)
    rating_matches = re.findall(r'"ratingCounts"\s*:\s*\[(\d+),(\d+),(\d+),(\d+),(\d+)\]', html)
    rating_counts = [0, 0, 0, 0, 0]
    if rating_matches:
        groups = [[int(value) for value in match] for match in rating_matches]
        rating_counts = max(groups, key=sum)
    reviews = extract_review_objects(html)
    payload = {
        "app": {
            "id": APP_ID,
            "name": app.get("trackName"),
            "version": app.get("version"),
            "averageUserRating": app.get("averageUserRating"),
            "userRatingCount": app.get("userRatingCount"),
            "currentVersionReleaseDate": app.get("currentVersionReleaseDate"),
            "trackViewUrl": app.get("trackViewUrl") or APP_URL,
        },
        "ratingCounts": rating_counts,
        "reviews": reviews,
        "source": {
            "lookupUrl": lookup_url,
            "reviewsUrl": REVIEWS_URL,
            "finalReviewsUrl": final_reviews_url,
        },
    }
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        raise
