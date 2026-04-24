from __future__ import annotations

import re
import statistics
import time
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict, Any
from urllib.parse import quote_plus, urlparse, unquote

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.mudah.my/malaysia/properties-for-sale"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.mudah.my/",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}


@dataclass
class MudahListing:
    title: str
    price: Optional[float]
    sqft: Optional[float]
    tenure: Optional[str]
    location: Optional[str]
    property_type: Optional[str]
    url: Optional[str]
    price_psf: Optional[float]
    source: str = "Mudah"


def _clean_text(value: Optional[str]) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def _extract_price(text: str) -> Optional[float]:
    text = _clean_text(text)
    if not text:
        return None

    patterns = [
        r"RM\s*([\d,]+(?:\.\d+)?)",
        r"RM([\d,]+(?:\.\d+)?)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            try:
                return float(match.group(1).replace(",", ""))
            except ValueError:
                return None
    return None


def _extract_sqft(text: str) -> Optional[float]:
    text = _clean_text(text)
    if not text:
        return None

    patterns = [
        r"([\d,]+(?:\.\d+)?)\s*(?:sq\.?\s*ft|sqft|sf)\b",
        r"built[\s-]*up[:\s]*([\d,]+(?:\.\d+)?)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            try:
                return float(match.group(1).replace(",", ""))
            except ValueError:
                return None
    return None


def _extract_tenure(text: str) -> Optional[str]:
    lowered = _clean_text(text).lower()
    if "freehold" in lowered:
        return "Freehold"
    if "leasehold" in lowered:
        return "Leasehold"
    return None


def _guess_property_type(text: str) -> Optional[str]:
    lowered = _clean_text(text).lower()
    if not lowered:
        return None

    mapping = {
        "condominium": "Condominium",
        "condo": "Condominium",
        "apartment": "Apartment",
        "flat": "Flat",
        "service residence": "Service Residence",
        "serviced residence": "Service Residence",
        "terrace": "Terraced House",
        "terraced house": "Terraced House",
        "semi-d": "Semi-Detached House",
        "semi detached": "Semi-Detached House",
        "semi-detached": "Semi-Detached House",
        "bungalow": "Bungalow House",
        "townhouse": "Townhouse",
        "residential land": "Residential Land",
        "land": "Residential Land",
        "others": "Other",
    }

    for key, value in mapping.items():
        if key in lowered:
            return value
    return None


def _extract_location(text: str, state: Optional[str] = None) -> Optional[str]:
    text = _clean_text(text)
    if not text:
        return None

    match = re.search(
        r"RM\s*[\d,]+(?:\.\d+)?\s+(.*?)\s+[\d,]+(?:\.\d+)?\s*(?:sq\.?\s*ft|sqft|sf)\b",
        text,
        flags=re.IGNORECASE,
    )
    if match:
        candidate = _clean_text(match.group(1))
        if candidate:
            return candidate

    parts = [p.strip(" ,|-") for p in re.split(r"[|•·]{1,}", text) if p.strip()]
    bad_keywords = [
        "rm", "sqft", "sq ft", "freehold", "leasehold",
        "condominium", "apartment", "terrace", "bungalow",
        "townhouse", "semi-d", "semi detached", "semi-detached",
        "for sale", "others for sale"
    ]

    candidates = []
    for part in parts:
        p = part.lower()
        if any(k in p for k in bad_keywords):
            continue
        if re.search(r"\d", p) and not re.search(r"[a-zA-Z]", p):
            continue
        if len(part) < 3:
            continue
        candidates.append(part)

    if state:
        state_lower = state.lower()
        for c in candidates:
            if state_lower in c.lower():
                return c

    return candidates[0] if candidates else None


def _build_search_url(state: Optional[str] = None, property_type: Optional[str] = None) -> str:
    query_parts = []
    if property_type:
        query_parts.append(property_type)
    if state:
        query_parts.append(state)

    if query_parts:
        return f"{BASE_URL}?q={quote_plus(' '.join(query_parts))}"
    return BASE_URL


def _fetch_html_requests(url: str, timeout: int = 20) -> str:
    session = requests.Session()
    session.headers.update(HEADERS)
    response = session.get(url, timeout=timeout)
    response.raise_for_status()
    return response.text


def _fetch_html_selenium(url: str, wait_seconds: float = 5.0) -> str:
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.support.ui import WebDriverWait
    except ImportError as exc:
        raise RuntimeError("Selenium is not installed. Run: pip install selenium") from exc

    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1920,3000")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--lang=en-US")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )

    driver = webdriver.Chrome(options=options)

    try:
        driver.get(url)

        WebDriverWait(driver, 15).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
        time.sleep(wait_seconds)

        last_height = driver.execute_script("return document.body.scrollHeight")
        for _ in range(4):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1.8)
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height

        return driver.page_source
    finally:
        driver.quit()


def _fetch_html(
    url: str,
    use_selenium: bool = True,
    wait_seconds: float = 5.0,
    fallback_to_requests: bool = True,
) -> str:
    if use_selenium:
        try:
            return _fetch_html_selenium(url=url, wait_seconds=wait_seconds)
        except Exception:
            if not fallback_to_requests:
                raise

    return _fetch_html_requests(url=url)


def _candidate_blocks_from_dom(soup: BeautifulSoup):
    selectors = [
        "a[href]",
        "article",
        "div",
        "li",
    ]

    seen = set()
    blocks = []

    for selector in selectors:
        for node in soup.select(selector):
            text = _clean_text(node.get_text(" ", strip=True))
            href = node.get("href") if getattr(node, "get", None) else None

            if "RM" not in text:
                continue

            combined = f"{text} {href or ''}".lower()
            looks_property = any(
                token in combined
                for token in [
                    "/properties", "condo", "condominium", "apartment", "residence",
                    "terrace", "semi-d", "bungalow", "townhouse", "freehold", "leasehold",
                    "for sale"
                ]
            )

            if not looks_property:
                continue

            key = (text[:220], href or "")
            if key in seen:
                continue
            seen.add(key)
            blocks.append(node)

    return blocks


def _normalize_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    if url.startswith("http://") or url.startswith("https://"):
        return url
    if url.startswith("/"):
        return f"https://www.mudah.my{url}"
    return url


def _extract_url_from_block(block) -> Optional[str]:
    if getattr(block, "name", "") == "a":
        href = block.get("href")
        if href:
            return _normalize_url(href)

    anchor = block.find("a", href=True)
    if anchor:
        return _normalize_url(anchor.get("href"))

    return None


def _is_generic_title(title: str) -> bool:
    generic_patterns = [
        r"^condominium for sale$",
        r"^apartment for sale$",
        r"^others for sale$",
        r"^property for sale$",
        r"^house for sale$",
        r"^residential land for sale$",
        r"^townhouse for sale$",
        r"^terraced house for sale$",
        r"^semi[- ]detached house for sale$",
        r"^bungalow( house)? for sale$",
        r"^for sale$",
        r"^others$",
    ]
    t = _clean_text(title).lower()
    return any(re.fullmatch(pattern, t) for pattern in generic_patterns)


def _prettify_slug_title(slug: str) -> str:
    slug = unquote(slug)
    slug = slug.split("?")[0].split("#")[0]
    slug = re.sub(r"\.(html|htm|php)$", "", slug, flags=re.IGNORECASE)
    slug = re.sub(r"[-_]+", " ", slug)
    slug = re.sub(r"\b\d{5,}\b", "", slug)
    slug = re.sub(r"\s+", " ", slug).strip(" -_/")

    if not slug:
        return ""

    # remove very generic suffixes/prefixes
    slug = re.sub(r"\b(for sale|property|properties|sale)\b", "", slug, flags=re.IGNORECASE)
    slug = re.sub(r"\s+", " ", slug).strip()

    words = []
    for word in slug.split():
        if word.lower() in {"kl", "pj", "ukay", "ampang", "shah", "alam", "selangor"}:
            words.append(word.title())
        else:
            words.append(word.capitalize())

    result = " ".join(words).strip()
    result = re.sub(r"\s+", " ", result)

    if len(result) < 4:
        return ""
    return result


def _extract_title_from_url(url: Optional[str]) -> str:
    if not url:
        return ""

    parsed = urlparse(url)
    path = parsed.path.strip("/")
    if not path:
        return ""

    parts = [p for p in path.split("/") if p]
    if not parts:
        return ""

    # usually the last path segment is the ad slug
    slug = parts[-1]
    title = _prettify_slug_title(slug)
    return title


def _extract_title_from_block(block) -> str:
    selectors = [
        "h1", "h2", "h3", "h4", "strong",
        "[title]",
        "a[href][title]",
        "a[href]",
    ]

    candidates = []

    for selector in selectors:
        for elem in block.select(selector):
            title = _clean_text(elem.get("title") or elem.get_text(" ", strip=True))
            if title and len(title) > 4:
                candidates.append(title)

    # prioritize non-generic headings first
    for candidate in candidates:
        if not _is_generic_title(candidate):
            return candidate

    # then allow generic visible titles if nothing better exists
    if candidates:
        return candidates[0]

    return ""


def _best_listing_title(block, url: Optional[str], fallback_text: str, property_type: Optional[str]) -> str:
    visible_title = _extract_title_from_block(block)
    url_title = _extract_title_from_url(url)

    if visible_title and not _is_generic_title(visible_title):
        return visible_title

    if url_title and not _is_generic_title(url_title):
        return url_title

    if visible_title:
        return visible_title

    if url_title:
        return url_title

    if property_type:
        return f"{property_type} for sale"

    return fallback_text[:160] if fallback_text else "Property for sale"


def _extract_listing_from_block(block, state: Optional[str] = None) -> Optional[MudahListing]:
    text = _clean_text(block.get_text(" ", strip=True))
    if not text or "RM" not in text:
        return None

    url = _extract_url_from_block(block)
    price = _extract_price(text)
    sqft = _extract_sqft(text)
    tenure = _extract_tenure(text)
    property_type = _guess_property_type(text)
    location = _extract_location(text, state=state)
    title = _best_listing_title(block, url, text, property_type)

    if not title and not price:
        return None

    price_psf = None
    if price and sqft and sqft > 0:
        price_psf = price / sqft

    return MudahListing(
        title=title,
        price=price,
        sqft=sqft,
        tenure=tenure,
        location=location,
        property_type=property_type,
        url=url,
        price_psf=price_psf,
    )


def _parse_listings_from_html(
    html: str,
    max_items: int = 20,
    state: Optional[str] = None,
    property_type: Optional[str] = None,
) -> List[MudahListing]:
    soup = BeautifulSoup(html, "html.parser")
    blocks = _candidate_blocks_from_dom(soup)

    listings: List[MudahListing] = []
    seen_keys = set()

    for block in blocks:
        listing = _extract_listing_from_block(block, state=state)
        if not listing:
            continue

        combined = f"{listing.title} {listing.location or ''} {listing.price or ''}".strip().lower()
        if combined in seen_keys:
            continue

        if listing.price is None:
            continue

        listings.append(listing)
        seen_keys.add(combined)

        if len(listings) >= max_items:
            break

    return listings


def scrape_mudah_listings(
    state: Optional[str] = None,
    property_type: Optional[str] = None,
    max_items: int = 20,
    use_selenium: bool = True,
    wait_seconds: float = 5.0,
) -> List[MudahListing]:
    url = _build_search_url(state=state, property_type=property_type)
    html = _fetch_html(
        url=url,
        use_selenium=use_selenium,
        wait_seconds=wait_seconds,
        fallback_to_requests=True,
    )
    return _parse_listings_from_html(
        html=html,
        max_items=max_items,
        state=state,
        property_type=property_type,
    )


def summarize_mudah_benchmark(
    state: Optional[str] = None,
    property_type: Optional[str] = None,
    max_items: int = 20,
    use_selenium: bool = True,
    wait_seconds: float = 5.0,
) -> Dict[str, Any]:
    listings = scrape_mudah_listings(
        state=state,
        property_type=property_type,
        max_items=max_items,
        use_selenium=use_selenium,
        wait_seconds=wait_seconds,
    )

    prices = [x.price for x in listings if x.price is not None]
    psf_values = [x.price_psf for x in listings if x.price_psf is not None]

    median_price = statistics.median(prices) if prices else None
    median_psf = statistics.median(psf_values) if psf_values else None

    return {
        "source": "Mudah",
        "query": {
            "state": state,
            "property_type": property_type,
        },
        "listing_count": len(listings),
        "median_price": median_price,
        "median_psf": median_psf,
        "min_price": min(prices) if prices else None,
        "max_price": max(prices) if prices else None,
        "listings": [asdict(x) for x in listings],
    }


if __name__ == "__main__":
    result = summarize_mudah_benchmark(
        state="Selangor",
        property_type="Condominium",
        max_items=10,
        use_selenium=True,
        wait_seconds=5.0,
    )

    from pprint import pprint
    pprint(result)