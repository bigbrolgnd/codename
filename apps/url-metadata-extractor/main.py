"""
URL Metadata Extraction Service
Extracts business information from URLs using Open Graph, Twitter Cards,
Schema.org, and HTML meta tags.

Also handles Instagram OAuth for extracting Instagram Business Account data.
"""

import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
import httpx
from typing import Optional, Dict, Any
import re
import json
from html import unescape

app = FastAPI(
    title="URL Metadata Extractor",
    description="Extract business information from URLs for Znapsite onboarding",
    version="1.0.0"
)


class ExtractRequest(BaseModel):
    url: str


class BusinessMetadata(BaseModel):
    businessName: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    logo: Optional[str] = None
    rawMetadata: Optional[Dict[str, Any]] = None
    # For OAuth-required platforms like Instagram
    requiresAuth: Optional[bool] = None
    platform: Optional[str] = None
    authUrl: Optional[str] = None


class InstagramAuthRequest(BaseModel):
    code: str
    redirectUri: Optional[str] = None


class InstagramProfileRequest(BaseModel):
    accessToken: str
    instagramBusinessId: str


def extract_from_schema_org(soup: Any) -> Dict[str, Any]:
    """Extract data from Schema.org JSON-LD scripts"""
    schema_data = {}

    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string)
            if isinstance(data, list):
                for item in data:
                    schema_data.update(_extract_schema_item(item))
            elif isinstance(data, dict):
                schema_data.update(_extract_schema_item(data))
        except (json.JSONDecodeError, AttributeError):
            continue

    return schema_data


def _extract_schema_item(item: Dict[str, Any]) -> Dict[str, Any]:
    """Extract relevant fields from a Schema.org item"""
    result = {}

    # Handle different Schema.org types
    item_type = item.get('@type', '').lower()

    if 'localbusiness' in item_type or 'organization' in item_type or 'business' in item_type:
        result['businessName'] = item.get('name') or item.get('legalName')
        result['description'] = item.get('description')
        result['address'] = _extract_address(item.get('address'))
        result['industry'] = item.get('category') or item.get('keywords')

    elif 'person' in item_type:
        # For personal brands, use name as business name
        result['businessName'] = item.get('name')
        result['description'] = item.get('description')
        result['industry'] = item.get('jobTitle') or item.get('description')

    return result


def _extract_address(address: Any) -> Optional[str]:
    """Extract formatted address from Schema.org address object"""
    if not address:
        return None

    if isinstance(address, str):
        return address

    if isinstance(address, dict):
        parts = [
            address.get('streetAddress'),
            address.get('addressLocality'),
            address.get('addressRegion'),
            address.get('postalCode'),
            address.get('addressCountry')
        ]
        return ', '.join(p for p in parts if p)

    return None


def extract_from_open_graph(soup: Any) -> Dict[str, Any]:
    """Extract data from Open Graph meta tags"""
    og_data = {}

    meta_mapping = {
        'og:title': 'businessName',
        'og:site_name': 'businessName',
        'og:description': 'description',
        'og:image': 'logo',
        'og:url': 'website',
        'og:type': 'industry',
    }

    for meta in soup.find_all('meta', property=True):
        prop = meta.get('property', '').lower()
        content = meta.get('content')

        if prop in meta_mapping and content:
            field = meta_mapping[prop]
            if not og_data.get(field):  # Don't overwrite if already set
                og_data[field] = content

    return og_data


def extract_from_twitter_card(soup: Any) -> Dict[str, Any]:
    """Extract data from Twitter Card meta tags"""
    twitter_data = {}

    meta_mapping = {
        'twitter:title': 'businessName',
        'twitter:description': 'description',
        'twitter:image': 'logo',
    }

    for meta in soup.find_all('meta', attrs={'name': re.compile(r'^twitter:', re.I)}):
        name = meta.get('name', '').lower()
        content = meta.get('content')

        if name in meta_mapping and content:
            field = meta_mapping[name]
            if not twitter_data.get(field):
                twitter_data[field] = content

    return twitter_data


def extract_from_html(soup: Any, url: str) -> Dict[str, Any]:
    """Extract data from basic HTML elements"""
    html_data = {}

    # Title tag
    title = soup.find('title')
    if title:
        html_data['businessName'] = title.get_text().strip()

    # Meta description
    meta_desc = soup.find('meta', attrs={'name': 'description'})
    if meta_desc:
        html_data['description'] = meta_desc.get('content')

    # First h1
    h1 = soup.find('h1')
    if h1:
        html_data['businessName'] = h1.get_text().strip()

    return html_data


def detect_industry_from_url(url: str, soup: Any) -> Optional[str]:
    """Detect industry from URL patterns and page content"""
    url_lower = url.lower()

    # URL pattern matching
    industry_patterns = {
        'salon': ['salon', 'beauty', 'hair', 'nail', 'spa', 'barber'],
        'restaurant': ['restaurant', 'cafe', 'diner', 'bistro', 'eatery'],
        'retail': ['shop', 'store', 'boutique', 'market', 'retail'],
        'fitness': ['fitness', 'gym', 'yoga', 'pilates', 'crossfit'],
        'professional': ['law', 'legal', 'accounting', 'consulting', 'firm'],
        'creative': ['design', 'creative', 'agency', 'studio', 'art'],
        'technology': ['tech', 'software', 'app', 'digital', 'startup'],
        'healthcare': ['medical', 'dental', 'health', 'clinic', 'pharmacy'],
        'education': ['school', 'education', 'tutor', 'learn', 'academy'],
    }

    for industry, patterns in industry_patterns.items():
        if any(pattern in url_lower for pattern in patterns):
            return industry.capitalize()

    return None


def extract_address_from_text(soup: Any) -> Optional[str]:
    """Try to extract address from common patterns"""
    import re

    # Look for common address patterns in footer or contact sections
    footer = soup.find('footer')
    if not footer:
        return None

    text = footer.get_text()

    # US Address pattern (simplified)
    address_pattern = r'\d+\s+[A-Z][a-z]+\s+(?:Street|St|Ave|Avenue|Blvd|Boulevard|Road|Rd|Lane|Ln|Drive|Dr)[,\s]+[A-Z][a-z]+(?:,\s*[A-Z]{2})?(?:\s*\d{5})?'

    matches = re.findall(address_pattern, text)
    if matches:
        return matches[0]

    return None


@app.get("/")
async def root():
    return {
        "service": "URL Metadata Extractor",
        "version": "1.0.0",
        "endpoints": {
            "extract": "POST /extract - Extract business metadata from URL",
            "health": "GET /health - Health check"
        }
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


# ============================================================================
# Instagram OAuth Endpoints
# ============================================================================

def get_instagram_config():
    """Get Instagram OAuth configuration from environment variables."""
    client_id = os.getenv("INSTAGRAM_CLIENT_ID")
    client_secret = os.getenv("INSTAGRAM_CLIENT_SECRET")
    redirect_uri = os.getenv("INSTAGRAM_REDIRECT_URI", "https://znapsite.com/auth/instagram/callback")

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=500,
            detail="Instagram credentials not configured. Please set INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET."
        )

    return {
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri
    }


@app.get("/auth/instagram/url")
async def get_instagram_auth_url():
    """
    Returns the Instagram OAuth URL for user to click.

    This initiates the Instagram Graph API OAuth flow for Business/Creator accounts
    with full permissions for AI agent context collection.
    """
    config = get_instagram_config()

    # Full Instagram Graph API scopes for comprehensive data access
    scope = (
        "pages_show_list,"
        "instagram_basic,"
        "instagram_manage_comments,"
        "instagram_manage_insights,"
        "instagram_content_publish,"
        "instagram_manage_messages,"
        "pages_read_engagement,"
        "instagram_shopping_tag_products,"
        "instagram_branded_content_brand,"
        "instagram_branded_content_creator,"
        "instagram_branded_content_ads_brand,"
        "instagram_manage_upcoming_events,"
        "instagram_creator_marketplace_discovery,"
        "instagram_manage_contents"
    )

    auth_url = (
        f"https://www.facebook.com/v18.0/dialog/oauth"
        f"?client_id={config['client_id']}"
        f"&redirect_uri={config['redirect_uri']}"
        f"&scope={scope}"
        f"&response_type=code"
    )

    return {
        "authUrl": auth_url,
        "platform": "instagram",
        "scopes": scope.split(",")
    }


@app.post("/auth/instagram/callback")
async def instagram_callback(request: InstagramAuthRequest):
    """
    Exchange authorization code for access token.

    This endpoint handles the OAuth callback from Instagram/Facebook.
    It exchanges the short-lived authorization code for a long-lived access token.
    """
    config = get_instagram_config()
    redirect_uri = request.redirectUri or config['redirect_uri']

    try:
        # Step 1: Exchange code for user access token
        async with httpx.AsyncClient() as client:
            token_response = await client.get(
                "https://graph.facebook.com/v18.0/oauth/access_token",
                params={
                    "client_id": config['client_id'],
                    "client_secret": config['client_secret'],
                    "redirect_uri": redirect_uri,
                    "code": request.code,
                }
            )
            token_response.raise_for_status()
            token_data = token_response.json()

            if 'access_token' not in token_data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to get access token: {token_data.get('error', 'Unknown error')}"
                )

            short_lived_token = token_data['access_token']

        # Step 2: Exchange short-lived token for long-lived token (60 days)
        async with httpx.AsyncClient() as client:
            long_lived_response = await client.get(
                "https://graph.instagram.com/access_token",
                params={
                    "grant_type": "ig_exchange_token",
                    "client_secret": config['client_secret'],
                    "access_token": short_lived_token,
                }
            )
            long_lived_response.raise_for_status()
            long_lived_data = long_lived_response.json()

            if 'access_token' not in long_lived_data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to get long-lived token: {long_lived_data.get('error', 'Unknown error')}"
                )

            long_lived_token = long_lived_data['access_token']
            expires_in = long_lived_data.get('expires_in', 5184000)  # Default ~60 days

        return {
            "accessToken": long_lived_token,
            "tokenType": "long-lived",
            "expiresIn": expires_in
        }

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Token exchange failed: {e.response.text}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OAuth callback failed: {str(e)}"
        )


@app.get("/instagram/pages")
async def get_instagram_business_accounts(accessToken: str):
    """
    Get Instagram Business Accounts connected to user's Facebook Pages.

    This retrieves the Facebook Pages that the user manages and their
    associated Instagram Business Accounts.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://graph.facebook.com/v18.0/me/accounts",
                params={
                    "fields": "instagram_business_account,id,name",
                    "access_token": accessToken,
                }
            )
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Failed to fetch pages: {e.response.text}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve Instagram accounts: {str(e)}"
        )


@app.post("/instagram/profile", response_model=BusinessMetadata)
async def get_instagram_profile(request: InstagramProfileRequest):
    """
    Fetch Instagram Business Account profile data.

    Extracts business information from an Instagram Business Account
    including username, name, biography, profile picture, website, and follower count.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://graph.facebook.com/v18.0/{request.instagramBusinessId}",
                params={
                    "fields": "username,name,biography,profile_pic_url,website,followers_count,media_count,ig_id",
                    "access_token": request.accessToken,
                }
            )
            response.raise_for_status()
            profile_data = response.json()

            if 'error' in profile_data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Instagram API error: {profile_data['error']}"
                )

            # Map Instagram data to BusinessMetadata format
            return BusinessMetadata(
                businessName=profile_data.get('name') or profile_data.get('username'),
                description=profile_data.get('biography'),
                industry='Social Media',
                website=profile_data.get('website'),
                logo=profile_data.get('profile_pic_url'),
                rawMetadata={
                    'platform': 'instagram',
                    'username': profile_data.get('username'),
                    'followersCount': profile_data.get('followers_count'),
                    'mediaCount': profile_data.get('media_count'),
                    'igId': profile_data.get('ig_id'),
                }
            )

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Failed to fetch Instagram profile: {e.response.text}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Profile extraction failed: {str(e)}"
        )


@app.post("/extract", response_model=BusinessMetadata)
async def extract_metadata(request: ExtractRequest):
    """
    Extract business metadata from a URL.

    Returns:
    - businessName: Name of the business
    - description: Business description
    - industry: Detected industry/category
    - address: Physical address if found
    - website: The URL itself
    - logo: URL to business logo/image
    - rawMetadata: All extracted metadata
    - requiresAuth: True if OAuth is needed (e.g., Instagram)
    - platform: Platform name if auth is required
    - authUrl: OAuth URL if auth is required
    """

    url = request.url

    # Validate URL
    if not url.startswith(('http://', 'https://')):
        raise HTTPException(status_code=400, detail="Invalid URL format")

    # For Instagram URLs, return minimal data - user can connect via OAuth later in the flow
    if "instagram.com" in url.lower():
        return BusinessMetadata(
            businessName=None,  # Will be filled via OAuth if user chooses to connect
            description=None,
            industry="Social Media",
            website=url,
            rawMetadata={"source": "instagram", "oauthAvailable": True}
        )

    try:
        async with httpx.AsyncClient(
            timeout=10.0,
            follow_redirects=True,
            headers={
                'User-Agent': 'Mozilla/5.0 (compatible; ZnapsiteBot/1.0; +https://znapsite.com)'
            }
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

        from bs4 import BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract from all sources
        schema_data = extract_from_schema_org(soup)
        og_data = extract_from_open_graph(soup)
        twitter_data = extract_from_twitter_card(soup)
        html_data = extract_from_html(soup, url)

        # Detect industry from URL and content
        detected_industry = detect_industry_from_url(url, soup)

        # Try to extract address
        detected_address = extract_address_from_text(soup)

        # Merge with priority: Schema.org > Open Graph > Twitter > HTML
        merged_data = {
            'businessName': (
                schema_data.get('businessName') or
                og_data.get('businessName') or
                twitter_data.get('businessName') or
                html_data.get('businessName')
            ),
            'description': (
                schema_data.get('description') or
                og_data.get('description') or
                twitter_data.get('description') or
                html_data.get('description')
            ),
            'industry': (
                schema_data.get('industry') or
                og_data.get('industry') or
                detected_industry
            ),
            'address': (
                schema_data.get('address') or
                detected_address
            ),
            'website': og_data.get('website') or url,
            'logo': (
                schema_data.get('logo') or
                og_data.get('logo') or
                twitter_data.get('logo')
            ),
            'rawMetadata': {
                'schema': schema_data,
                'openGraph': og_data,
                'twitter': twitter_data,
                'html': html_data,
                'detectedIndustry': detected_industry,
            }
        }

        # Clean up business name (remove emojis, extra whitespace)
        if merged_data['businessName']:
            merged_data['businessName'] = re.sub(r'[^\w\s\-\&]', '', merged_data['businessName']).strip()

        return BusinessMetadata(**merged_data)

    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Request timed out")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"HTTP error: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5009)
