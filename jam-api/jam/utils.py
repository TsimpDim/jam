import re
import requests
import json
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)


def fetch_job_ad_snapshot(url: str):
    """
    Robustly fetches job ad content from a URL using multiple strategies:
    1. JSON-LD (Schema.org JobPosting)
    2. Meta Tags
    3. Heuristic HTML scraping
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.google.com/'
        }
        
        try:
            response = requests.get(url, timeout=15, headers=headers)
            response.raise_for_status()
        except Exception as e:
            logger.error(f"Request failed for {url}: {e}")
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Strategy 1: JSON-LD (Schema.org JobPosting)
        # Many modern job boards (LinkedIn, Greenhouse, Lever, etc.) embed structured data
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        for script in json_ld_scripts:
            try:
                if not script.string:
                    continue
                    
                data = json.loads(script.string)
                # Handle list of objects or single object
                items = data if isinstance(data, list) else [data]
                
                for item in items:
                    if item.get('@type') == 'JobPosting':
                        description = item.get('description')
                        if description:
                            # Description is often HTML escaped
                            desc_soup = BeautifulSoup(description, 'html.parser')
                            text = desc_soup.get_text(separator='\n\n', strip=True)
                            if len(text) > 100:
                                logger.info(f"Extracted job ad from JSON-LD for {url}")
                                return text[:75000]
            except Exception:
                continue

        # Strategy 2: Meta Tags
        # Sometimes the description is in OG tags
        meta_desc = soup.find('meta', property='og:description') or \
                    soup.find('meta', name='description') or \
                    soup.find('meta', name='twitter:description')
        
        if meta_desc and meta_desc.get('content'):
            content = meta_desc.get('content')
            if len(content) > 500: # Only if it's substantial, otherwise it's just a summary
                logger.info(f"Extracted job ad from Meta Tags for {url}")
                return content[:75000]

        # Strategy 3: Heuristic HTML Scraping (Improved)
        
        # Remove clutter
        for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'noscript', 'form', 'link', 'meta', 'svg', 'button', 'input']):
            element.decompose()
            
        # Remove elements by class/id names efficiently
        bad_keywords = ['nav', 'menu', 'sidebar', 'footer', 'header', 'cookie', 'popup', 'modal', 'advertisement', 'social', 'share', 'related', 'comment', 'login', 'register']
        
        for tag in soup.find_all(True):
            if not tag.attrs:
                continue
            try:
                # Check class and id
                classes = tag.get('class', [])
                if isinstance(classes, list):
                    classes = ' '.join(classes)
                elif not isinstance(classes, str):
                    classes = ''
                
                id_val = tag.get('id', '')
                if not isinstance(id_val, str):
                    id_val = ''
                
                combined = (classes + ' ' + id_val).lower()
                
                if any(keyword in combined for keyword in bad_keywords):
                    # Be conservative: only delete if it doesn't look like the main job content
                    if 'job' not in combined and 'description' not in combined and 'content' not in combined:
                         tag.decompose()
            except Exception:
                continue
        
        # Priority selectors for job content
        job_selectors = [
            '[class*="description"]', '[id*="description"]',
            '[class*="job-body"]', '[id*="job-body"]',
            '[class*="job-content"]', '[id*="job-content"]',
            '[class*="job-detail"]', '[id*="job-detail"]',
            'article', 'main', '[role="main"]',
            'div#app', 'div#root' # Single page apps often dump everything here
        ]
        
        best_text = ""
        max_len = 0
        
        # Try specific selectors first
        for selector in job_selectors:
            elements = soup.select(selector)
            for el in elements:
                text = el.get_text(separator='\n\n', strip=True)
                # Prefer longer texts, assuming job ads are verbose
                if len(text) > max_len:
                    max_len = len(text)
                    best_text = text
        
        # Fallback to body if nothing good found or text is too short
        if max_len < 200:
            body = soup.find('body')
            if body:
                text = body.get_text(separator='\n\n', strip=True)
                if len(text) > max_len:
                    best_text = text

        # Cleanup
        if best_text and len(best_text) > 100:
            # Fix excessive newlines
            cleaned_text = re.sub(r'\n{3,}', '\n\n', best_text)
            return cleaned_text.strip()[:75000]
            
        return None

    except Exception as e:
        logger.error(f"Error fetching job ad snapshot from {url}: {e}")
        return None
