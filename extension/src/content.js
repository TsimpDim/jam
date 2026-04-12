function extractPageData() {
  const pageData = {
    url: window.location.href,
    title: document.title,
    company: null,
    location: null,
    description: null
  };
  
  // Try to extract company name
  const companySelectors = [
    '[data-testid="job-detail-header"] .job-details-card__header',
    '.job-details-header__company-name',
    '.company-name',
    '[class*="company"]',
    'a[href*="company"]',
    '.雇主名称',
    '.company-title',
    '.job-company',
    '[itemprop="hiringOrganization"]',
    '.company-info'
  ];
  
  for (const selector of companySelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      if (text && text.length < 100) {
        pageData.company = text;
        break;
      }
    }
  }
  
  // Try to extract location
  const locationSelectors = [
    '[data-testid="job-detail-location"]',
    '.job-details-header__location',
    '.location',
    '[class*="location"]',
    '.工作地点',
    '.job-location',
    '[itemprop="jobLocation"]'
  ];
  
  for (const selector of locationSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      if (text && text.length < 100) {
        pageData.location = text;
        break;
      }
    }
  }
  
  // Try LinkedIn specific selectors
  if (window.location.hostname.includes('linkedin.com')) {
    const linkedInCompany = document.querySelector('.job-details-clustered-entity__title, .job-card-container__company-name');
    if (linkedInCompany && !pageData.company) {
      pageData.company = linkedInCompany.textContent.trim();
    }
    
    const linkedInLocation = document.querySelector('.job-details-container__metadata-item, .job-card-container__metadata-item');
    if (linkedInLocation && !pageData.location) {
      pageData.location = linkedInLocation.textContent.trim();
    }
  }
  
  // Try Indeed specific selectors
  if (window.location.hostname.includes('indeed.com')) {
    const indeedCompany = document.querySelector('.jobsearch-CompanyInfoContainer a, [data-testid="company-name"]');
    if (indeedCompany && !pageData.company) {
      pageData.company = indeedCompany.textContent.trim();
    }
    
    const indeedLocation = document.querySelector('.jobsearch-CompanyInfoContainer div:not([class]), [data-testid="job-location"]');
    if (indeedLocation && !pageData.location) {
      pageData.location = indeedLocation.textContent.trim();
    }
  }
  
  // Try Glassdoor specific selectors
  if (window.location.hostname.includes('glassdoor.com')) {
    const glassdoorCompany = document.querySelector('.employer-short-name, [data-test="employer-name"]');
    if (glassdoorCompany && !pageData.company) {
      pageData.company = glassdoorCompany.textContent.trim();
    }
    
    const glassdoorLocation = document.querySelector('.location, [data-test="location"]');
    if (glassdoorLocation && !pageData.location) {
      pageData.location = glassdoorLocation.textContent.trim();
    }
  }
  
  // Try to extract from meta tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  
  if (ogTitle && !pageData.company) {
    pageData.company = ogTitle.getAttribute('content');
  }
  
  if (ogDescription && !pageData.description) {
    pageData.description = ogDescription.getAttribute('content');
  }
  
  // Try to get job title from h1 or main heading
  const h1 = document.querySelector('h1, [data-testid="job-detail-header"] h1, .job-title');
  if (h1 && !pageData.title) {
    pageData.title = h1.textContent.trim();
  }
  
  return pageData;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractPageData' || message.action === 'getPageData') {
    const pageData = extractPageData();
    sendResponse({ pageData });
  }
  return true;
});