import json
import time
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "lib" / "definitivosProductos.json"
OUTPUT_DIR = ROOT / "lib" / "menu-products"
TARGETS = {
    "en": "en",
    "fr": "fr",
    "it": "it",
    "zh": "zh-CN",
    "ja": "ja",
    "hi": "hi",
}

GLOSSARY_REPLACEMENTS = {
    "zh": {
        "\u7ec9\u7eb1": "\u53ef\u4e3d\u997c",
        "\u82b1\u751f\u9171": "Nutella",
        "\u5c1a\u8482\u4f0a": "\u9999\u7f07\u5976\u6cb9",
    }
}


def google_translate(texts, target):
    if not texts:
        return []

    joined = "\n".join(texts)
    query = urllib.parse.urlencode(
        {
            "client": "gtx",
            "sl": "es",
            "tl": target,
            "dt": "t",
            "q": joined,
        }
    )
    request = urllib.request.Request(
        f"https://translate.googleapis.com/translate_a/single?{query}",
        headers={"User-Agent": "Mozilla/5.0"},
    )

    with urllib.request.urlopen(request, timeout=45) as response:
        payload = json.loads(response.read().decode("utf-8"))

    translated = "".join(part[0] for part in payload[0] if part and part[0])
    lines = translated.split("\n")

    if len(lines) != len(texts):
        return [translate_one(text, target) for text in texts]

    return lines


def translate_one(text, target):
    if not text:
        return text

    query = urllib.parse.urlencode(
        {
            "client": "gtx",
            "sl": "es",
            "tl": target,
            "dt": "t",
            "q": text,
        }
    )
    request = urllib.request.Request(
        f"https://translate.googleapis.com/translate_a/single?{query}",
        headers={"User-Agent": "Mozilla/5.0"},
    )

    with urllib.request.urlopen(request, timeout=45) as response:
        payload = json.loads(response.read().decode("utf-8"))

    return "".join(part[0] for part in payload[0] if part and part[0])


def chunked(values, size):
    for index in range(0, len(values), size):
        yield values[index:index + size]


def translate_products(products, target):
    texts = []
    for product in products:
        texts.extend([product["name"], product["description"], product["category"]])

    translated_texts = []
    for chunk in chunked(texts, 60):
        translated_texts.extend(google_translate(chunk, target))
        time.sleep(0.15)

    localized = []
    cursor = 0
    for product in products:
        item = dict(product)
        item["name"] = translated_texts[cursor]
        item["description"] = translated_texts[cursor + 1]
        item["category"] = translated_texts[cursor + 2]
        localized.append(item)
        cursor += 3

    return localized


def apply_glossary(products, code):
    replacements = GLOSSARY_REPLACEMENTS.get(code, {})
    if not replacements:
        return products

    localized = []
    for product in products:
        item = dict(product)
        for field in ["name", "description", "category"]:
            value = item[field]
            for source, replacement in replacements.items():
                value = value.replace(source, replacement)
            item[field] = value
        localized.append(item)

    return localized


def main():
    products = json.loads(SOURCE.read_text(encoding="utf-8"))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "es.json").write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8")

    for code, target in TARGETS.items():
        print(f"Translating {code}...")
        localized = apply_glossary(translate_products(products, target), code)
        (OUTPUT_DIR / f"{code}.json").write_text(json.dumps(localized, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Wrote {code}: {len(localized)} products")


if __name__ == "__main__":
    main()
