import re
import requests
from bs4 import BeautifulSoup


def fetch_job_ad_snapshot(url: str):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, timeout=15, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'noscript', 'form', 'link', 'meta']):
            element.decompose()
        
        for tag in soup.find_all(True):
            tag_attrs = ' '.join(str(v) for v in tag.attrs.values()).lower()
            if 'nav' in tag_attrs or 'menu' in tag_attrs or 'sidebar' in tag_attrs or 'footer' in tag_attrs or 'header' in tag_attrs or 'cookie' in tag_attrs or 'popup' in tag_attrs or 'modal' in tag_attrs or 'advertisement' in tag_attrs or 'social' in tag_attrs:
                tag.decompose()
        
        job_related_selectors = [
            'div[class*="job"]',
            'div[id*="job"]',
            'div[class*="description"]',
            'div[id*="description"]',
            'div[class*="detail"]',
            'div[id*="detail"]',
            'div[class*="content"]',
            'div[id*="content"]',
            'section[class*="job"]',
            'section[id*="job"]',
            'article',
            'main',
            'div[class*="posting"]',
            'div[id*="posting"]',
            'div[class*="position"]',
            'div[id*="position"]',
        ]
        
        candidates = []
        for selector in job_related_selectors:
            elements = soup.select(selector)
            for el in elements:
                text = el.get_text(separator='\n', strip=True)
                if len(text) > 200:
                    candidates.append(text)
        
        if candidates:
            best_text = max(candidates, key=len)
        else:
            body = soup.find('body')
            if body:
                best_text = body.get_text(separator='\n', strip=True)
            else:
                best_text = soup.get_text(separator='\n', strip=True)
        
        lines = [line.strip() for line in best_text.split('\n')]
        cleaned_lines = []
        prev_was_empty = False
        for line in lines:
            if len(line) < 3:
                if not prev_was_empty:
                    cleaned_lines.append('')
                    prev_was_empty = True
            else:
                cleaned_lines.append(line)
                prev_was_empty = False
        
        cleaned_text = '\n'.join(cleaned_lines)
        cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
        cleaned_text = cleaned_text.strip()
        
        if len(cleaned_text) < 100:
            return None
            
        return cleaned_text[:75000]
        
    except Exception:
        return None
