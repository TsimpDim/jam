
/**
 * Return trimmed text from the first matching selector, or null.
 * @param {string[]} selectors
 * @param {number} maxLen - ignore matches longer than this (avoids grabbing whole sections)
 */
function firstText(selectors, maxLen = 120) {
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (!el) continue;
      const text = (el.innerText || el.textContent || '').trim();
      if (text && text.length <= maxLen) return text;
    } catch (_) { /* bad selector - skip */ }
  }
  return null;
}

/**
 * Return trimmed text of the first element that matches the selector AND
 * whose text matches the given RegExp test.
 */
function firstTextMatching(selector, re, maxLen = 200) {
  try {
    for (const el of document.querySelectorAll(selector)) {
      const text = (el.innerText || el.textContent || '').trim();
      if (text && text.length <= maxLen && re.test(text)) return text;
    }
  } catch (_) {}
  return null;
}

/**
 * Clean a raw title string:
 *  - strip trailing " | Company" / " - Company" / " at Company" suffixes
 *  - strip trailing site names like "| LinkedIn", "| Indeed", "| Glassdoor"
 *  - collapse excess whitespace
 */
function cleanTitle(raw) {
  if (!raw) return null;
  const siteSuffixes = [
    'linkedin', 'indeed', 'glassdoor', 'monster', 'ziprecruiter',
    'greenhouse', 'lever', 'workday', 'wellfound', 'angellist',
    'seek', 'stepstone', 'xing', 'simplyhired', 'dice', 'careerbuilder',
    'jobs', 'job board', 'careers'
  ];
  let title = raw.trim();
  // Remove everything after the last pipe/dash/em-dash that contains a site name
  title = title.replace(/[\|\-–—]\s*.{0,60}$/i, (match) => {
    const lower = match.toLowerCase();
    for (const s of siteSuffixes) {
      if (lower.includes(s)) return '';
    }
    return match; // keep if it's not a site name
  });
  return title.trim() || raw.trim();
}

/**
 * Derive the "applied through" platform name from a hostname.
 */
function platformFromHost(hostname) {
  const map = [
    [/linkedin\.com/,       'LinkedIn'],
    [/indeed\.com/,         'Indeed'],
    [/glassdoor\.com/,      'Glassdoor'],
    [/monster\.com/,        'Monster'],
    [/ziprecruiter\.com/,   'ZipRecruiter'],
    [/greenhouse\.io/,      'Greenhouse'],
    [/lever\.co/,           'Lever'],
    [/myworkdayjobs\.com/,  'Workday'],
    [/wellfound\.com/,      'Wellfound'],
    [/angel\.co/,           'AngelList'],
    [/seek\.com/,           'Seek'],
    [/stepstone\./,         'StepStone'],
    [/xing\.com/,           'Xing'],
    [/simplyhired\.com/,    'SimplyHired'],
    [/dice\.com/,           'Dice'],
    [/careerbuilder\.com/,  'CareerBuilder'],
    [/smartrecruiters\.com/,'SmartRecruiters'],
    [/jobvite\.com/,        'Jobvite'],
    [/ashbyhq\.com/,        'Ashby'],
    [/remoteok\.com/,       'RemoteOK'],
    [/weworkremotely\.com/, 'We Work Remotely'],
    [/builtin\.com/,        'Built In'],
    [/hired\.com/,          'Hired'],
    [/recruitee\.com/,      'Recruitee'],
    [/breezy\.hr/,          'Breezy'],
    [/dover\.com/,          'Dover'],
    [/workable\.com/,       'Workable'],
  ];
  for (const [re, name] of map) {
    if (re.test(hostname)) return name;
  }
  return null;
}

/**
 * Parse all JSON-LD blocks on the page and return the first JobPosting object
 * (or null).  This is the most reliable source on modern job boards.
 */
function extractFromJsonLd() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        // Handle @graph
        const candidates = item['@graph']
          ? [...items, ...item['@graph']]
          : items;
        for (const candidate of candidates) {
          if (!candidate) continue;
          const type = candidate['@type'];
          const isJobPosting =
            type === 'JobPosting' ||
            (Array.isArray(type) && type.includes('JobPosting'));
          if (!isJobPosting) continue;

          const result = {};

          // Title
          if (candidate.title) result.title = candidate.title;

          // Company
          const org = candidate.hiringOrganization;
          if (org) {
            result.company = typeof org === 'string' ? org : org.name;
          }

          // Location
          const loc = candidate.jobLocation;
          if (loc) {
            const locArr = Array.isArray(loc) ? loc : [loc];
            const parts = [];
            for (const l of locArr) {
              const addr = l.address || l;
              if (typeof addr === 'string') {
                parts.push(addr);
              } else {
                const city = addr.addressLocality || '';
                const region = addr.addressRegion || '';
                const country = addr.addressCountry || '';
                const joined = [city, region, country].filter(Boolean).join(', ');
                if (joined) parts.push(joined);
              }
            }
            if (parts.length) result.location = parts.join(' | ');
          }

          // Remote
          if (candidate.jobLocationType === 'TELECOMMUTE') {
            result.remote = true;
            if (!result.location) result.location = 'Remote';
          }

          // Employment type
          if (candidate.employmentType) {
            result.employmentType = Array.isArray(candidate.employmentType)
              ? candidate.employmentType.join(', ')
              : candidate.employmentType;
          }

          // Salary
          const salary = candidate.baseSalary;
          if (salary) {
            const val = salary.value;
            const currency = salary.currency || '';
            if (val) {
              if (val.minValue && val.maxValue) {
                result.salary = `${currency} ${val.minValue} - ${val.maxValue}`.trim();
              } else if (val.value) {
                result.salary = `${currency} ${val.value}`.trim();
              }
            }
          }

          // Description (truncated - we only want a snippet)
          if (candidate.description) {
            result.description = candidate.description
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 1000);
          }

          return result;
        }
      }
    } catch (_) { /* malformed JSON-LD */ }
  }
  return null;
}

function extractLinkedIn() {
  return {
    title: firstText([
      '.job-details-jobs-unified-top-card__job-title h1',
      '.jobs-unified-top-card__job-title h1',
      '.topcard__title',
      'h1.jobs-unified-top-card__job-title',
      'h1[class*="job-title"]',
    ]),
    company: firstText([
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
      '.topcard__org-name-link',
      '[data-tracking-control-name="public_jobs_topcard-org-name"]',
      '.job-details-clustered-entity__title',
      '.job-card-container__company-name',
    ]),
    location: firstText([
      '.job-details-jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__bullet',
      '.topcard__flavor--bullet',
      '.job-details-jobs-unified-top-card__workplace-type',
      '.job-card-container__metadata-item',
    ]),
  };
}

function extractIndeed() {
  return {
    title: firstText([
      '[data-testid="jobsearch-JobInfoHeader-title"] span',
      '[data-testid="jobsearch-JobInfoHeader-title"]',
      '.jobsearch-JobInfoHeader-title',
      'h1.jobsearch-JobInfoHeader-title',
      'h1[class*="jobTitle"]',
    ]),
    company: firstText([
      '[data-testid="inlineHeader-companyName"] a',
      '[data-testid="inlineHeader-companyName"]',
      '[data-testid="company-name"]',
      '.jobsearch-CompanyInfoContainer a',
      '.jobsearch-CompanyInfoWithoutHeaderImage a',
      '[class*="companyName"]',
    ]),
    location: firstText([
      '[data-testid="job-location"]',
      '[data-testid="inlineHeader-companyLocation"]',
      '.jobsearch-JobInfoHeader-subtitle [class*="location"]',
      '[class*="companyLocation"]',
      '.jobsearch-CompanyInfoContainer div:not([class])',
    ]),
  };
}

function extractGlassdoor() {
  return {
    title: firstText([
      '[data-test="job-title"]',
      '.JobDetails_jobTitle__Rw_gn',
      'h1[class*="jobTitle"]',
      'h1[class*="JobTitle"]',
      '.job-title',
    ]),
    company: firstText([
      '[data-test="employer-name"]',
      '.EmployerProfile_employerName__Rq2xg',
      '[class*="employerName"]',
      '.employer-short-name',
      'h4[class*="employer"]',
    ]),
    location: firstText([
      '[data-test="location"]',
      '[data-test="job-location"]',
      '.JobDetails_location__PHTvJ',
      '[class*="jobLocation"]',
      '[class*="location"]',
    ]),
  };
}

function extractGreenhouse() {
  return {
    title: firstText([
      '#header .app-title',
      '.job-post h1',
      'h1.app-title',
      '.posting-headline h2',
      'h1[class*="app-title"]',
    ]),
    company: firstText([
      '.company-name',
      '#header .company-name',
      '[class*="company-name"]',
    ]),
    location: firstText([
      '.location',
      '#header .location',
      '.posting-categories .location',
      '[class*="location"]',
    ]),
  };
}

function extractLever() {
  return {
    title: firstText([
      '.posting-headline h2',
      '.job-title',
      'h2.posting-title',
      '[class*="posting-title"]',
    ]),
    company: firstText([
      '.main-header-logo img[alt]',
    ]) || (() => {
      const img = document.querySelector('.main-header-logo img');
      return img ? img.getAttribute('alt') : null;
    })(),
    location: firstText([
      '.posting-categories .sort-by-location',
      '.posting-headline .posting-categories .location',
      '[class*="location"]',
      '.workplaceTypes',
    ]),
  };
}

function extractWorkday() {
  // Workday URLs look like "companyname.wdXXX.myworkdayjobs.com" or "companyname.myworkdayjobs.com"
  // We need to extract just the company name part (first subdomain before the tenant id)
  const companyFromHost = (() => {
    const match = window.location.hostname.match(/^([a-zA-Z0-9-]+)\.(?:wd\d+\.)?myworkdayjobs/);
    if (match) {
      return match[1]
        .split(/[-_]/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    return null;
  })();

  // Try multiple Workday-specific selectors
  const title = firstText([
    // New Workday UI patterns
    '[data-automation-id="jobPostingHeader"]',
    'h1[data-automation-id="jobPostingHeader"]',
    // Common Workday heading patterns
    '.wd-headings h1',
    '.job-details-header h1',
    '[data-automation-id="jobTitle"]',
    'h1[class*="jobTitle"]',
    // Generic h1 as last resort
    'h1',
  ], 200);

  // Try to find company name in the page content
  const companyFromPage = firstText([
    '[data-automation-id="company"]',
    '[data-automation-id="companyName"]',
    '.company-name',
    '[class*="company-name"]',
    '.employer-name',
    // Workday often puts company in the header/logo area
    '.wd-logo img[alt]',
    'header img[alt]',
    // Look for links to the company career page
    'a[href*="careers"][class]',
  ], 100);

  const location = firstText([
    '[data-automation-id="locations"]',
    '[data-automation-id="job-posting-details-locations"]',
    '[data-automation-id="location"]',
    '[data-automation-id="workerLocation"]',
    '.location',
    '[class*="location"]',
    '[class*="Location"]',
    // Workday often has location in a details list
    '.job-details-location',
    '[data-automation-id="jobPostingLocation"]',
  ], 150);

  // Also try to extract from the URL path as a fallback
  // e.g., /job/Software-Architect--m-f-x-_JR100186
  const titleFromUrl = (() => {
    const match = window.location.pathname.match(/\/job\/(.+?)(?:-_|$)/);
    if (match) {
      return decodeURIComponent(match[1])
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    return null;
  })();

  return {
    title: title || titleFromUrl,
    company: companyFromPage || companyFromHost,
    location,
  };
}

function extractSmartRecruiters() {
  return {
    title: firstText([
      'h1.job-title',
      '[class*="job-title"] h1',
      'h1[itemprop="title"]',
    ]),
    company: firstText([
      '.company-name',
      'span[itemprop="name"]',
      '[class*="company-name"]',
    ]),
    location: firstText([
      '[itemprop="jobLocation"]',
      '.job-location',
      '[class*="location"]',
    ]),
  };
}

function extractWellfound() {
  return {
    title: firstText([
      'h1[class*="jobTitle"]',
      '.job-title h1',
      'h1',
    ]),
    company: firstText([
      'a[class*="companyName"]',
      '[class*="company-name"]',
      '.company-name',
    ]),
    location: firstText([
      '[class*="location"]',
      '.location',
    ]),
  };
}

function extractRemoteOK() {
  return {
    title: firstText([
      'h1[itemprop="title"]',
      '.job h2',
    ]),
    company: firstText([
      'h3[itemprop="name"]',
      '.company_and_position h3',
    ]),
    location: firstText([
      '.location',
      '.tag.location',
    ]),
  };
}

function extractJobvite() {
  return {
    title: firstText([
      'h1.jv-header',
      '.jv-job-detail-meta h1',
      'h1[class*="header"]',
    ]),
    company: firstText([
      '.jv-company',
      '[class*="company"]',
    ]),
    location: firstText([
      '.jv-job-detail-meta li',
      '[class*="location"]',
    ]),
  };
}

function extractAshby() {
  return {
    title: firstText([
      'h1[class*="jobTitle"]',
      '.ashby-job-posting-title',
      'h1',
    ]),
    company: firstText([
      '[class*="company"]',
      '.company-name',
    ]),
    location: firstText([
      '[class*="location"]',
      '.location',
    ]),
  };
}

function extractGeneric() {
  // Title: prefer h1, then og:title, then <title>
  const h1 = firstText([
    'h1[class*="job"]',
    'h1[class*="title"]',
    'h1[class*="position"]',
    'h1[class*="role"]',
    'h1',
  ]);

  // Company: look for itemprop or common class patterns
  const company = firstText([
    '[itemprop="hiringOrganization"] [itemprop="name"]',
    '[itemprop="hiringOrganization"]',
    '[class*="company-name"]',
    '[class*="companyName"]',
    '[class*="employer-name"]',
    '[class*="employerName"]',
    '[class*="company_name"]',
    'a[href*="/company/"]',
    '[class*="company"]',
    '[class*="organization"]',
  ]);

  // Location
  const location = firstText([
    '[itemprop="jobLocation"] [itemprop="addressLocality"]',
    '[itemprop="jobLocation"]',
    '[class*="job-location"]',
    '[class*="jobLocation"]',
    '[class*="location"]',
    '[data-automation*="location"]',
    '[data-testid*="location"]',
  ]);

  return { title: h1, company, location };
}

//  Meta-tag helpers 

function metaContent(selector) {
  const el = document.querySelector(selector);
  return el ? el.getAttribute('content') : null;
}

function extractPageData() {
  const hostname = window.location.hostname;

  const pageData = {
    url: window.location.href,
    title: null,
    company: null,
    location: null,
    description: null,
    salary: null,
    employmentType: null,
    remote: false,
    appliedThrough: platformFromHost(hostname),
  };

  // Site agnostic
  const jsonLd = extractFromJsonLd();
  if (jsonLd) {
    pageData.title        = jsonLd.title        || pageData.title;
    pageData.company      = jsonLd.company      || pageData.company;
    pageData.location     = jsonLd.location     || pageData.location;
    pageData.description  = jsonLd.description  || pageData.description;
    pageData.salary       = jsonLd.salary       || pageData.salary;
    pageData.employmentType = jsonLd.employmentType || pageData.employmentType;
    pageData.remote       = jsonLd.remote       || pageData.remote;
  }

  // Site specific
  let siteData = null;

  if (hostname.includes('linkedin.com'))        siteData = extractLinkedIn();
  else if (hostname.includes('indeed.com'))     siteData = extractIndeed();
  else if (hostname.includes('glassdoor.com'))  siteData = extractGlassdoor();
  else if (hostname.includes('greenhouse.io'))  siteData = extractGreenhouse();
  else if (hostname.includes('lever.co'))       siteData = extractLever();
  else if (hostname.includes('myworkdayjobs.com')) siteData = extractWorkday();
  else if (hostname.includes('smartrecruiters.com')) siteData = extractSmartRecruiters();
  else if (hostname.includes('wellfound.com') || hostname.includes('angel.co')) siteData = extractWellfound();
  else if (hostname.includes('remoteok.com'))   siteData = extractRemoteOK();
  else if (hostname.includes('jobvite.com'))    siteData = extractJobvite();
  else if (hostname.includes('ashbyhq.com'))    siteData = extractAshby();

  if (siteData) {
    if (!pageData.title    && siteData.title)    pageData.title    = siteData.title;
    if (!pageData.company  && siteData.company)  pageData.company  = siteData.company;
    if (!pageData.location && siteData.location) pageData.location = siteData.location;
  }

  // Generic fallback
  if (!pageData.title || !pageData.company || !pageData.location) {
    const generic = extractGeneric();
    if (!pageData.title    && generic.title)    pageData.title    = generic.title;
    if (!pageData.company  && generic.company)  pageData.company  = generic.company;
    if (!pageData.location && generic.location) pageData.location = generic.location;
  }

  // Meta-tag fallback
  if (!pageData.title) {
    const ogTitle = metaContent('meta[property="og:title"]');
    if (ogTitle) pageData.title = ogTitle;
  }
  if (!pageData.description) {
    const ogDesc = metaContent('meta[property="og:description"]')
      || metaContent('meta[name="description"]');
    if (ogDesc) pageData.description = ogDesc.slice(0, 1000);
  }

  // Title-tag fallback
  if (!pageData.title && document.title) {
    pageData.title = document.title;
  }


  pageData.title = cleanTitle(pageData.title);

  for (const key of ['title', 'company', 'location', 'description', 'salary', 'employmentType']) {
    if (pageData[key]) pageData[key] = pageData[key].trim();
  }

  if (!pageData.remote && pageData.location) {
    pageData.remote = /\bremote\b/i.test(pageData.location);
  }

  return pageData;
}

// Message listener (de-duplicated)

if (typeof window.jamHasRun === 'undefined') {
  window.jamHasRun = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'extractPageData') {
      const pageData = extractPageData();
      sendResponse({ pageData });
    }
    return true;
  });
}
