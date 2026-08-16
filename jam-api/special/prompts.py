def build_cv_review_prompt(roles: str, industry: str, experience_level: str) -> str:
    return f"""
    Please conduct a comprehensive review of the attached CV, specifically tailoring your feedback for a candidate targeting **{roles}** roles within the **{industry}** industry at the **{experience_level}** level. 

    Evaluate the document against the following 15 criteria. Provide specific feedback, point out weak spots, and suggest exact rewrites for improvement, keeping the target role, industry, and experience level strictly in mind:

    1. Target Alignment: Does the overall narrative immediately position the candidate as a strong, credible fit for {roles} positions in the {industry} sector?
    2. Professional Summary: Is the summary compelling and focused on the value proposition expected of an {experience_level} professional, if one exists? If it doesn't, is it expected for this experience level and industry?
    3. Career Progression Clarity: Does the work history show a logical trajectory and scope of responsibility appropriate for their {experience_level} status?
    4. Action Verb Usage: Do the bullet points start with strong, active verbs highly relevant to core {roles} responsibilities?
    5. Quantifiable Achievements: Are metrics and hard numbers used effectively to demonstrate impact in a way that {industry} hiring managers and stakeholders value?
    6. Keyword Optimization (ATS): Does the CV prominently feature industry-standard terminology, tools, and methodologies specific to {roles} in {industry}?
    7. Educational Background Formatting: Is the education section positioned correctly and given the appropriate weight based on the candidate being at the {experience_level} level?
    8. Skills Section Relevance: Are the listed skills directly aligned with modern requirements for {roles}, and are they cleanly categorized? Is a section doesn't exist, is it expected for this experience level and industry?
    9. Formatting and Layout Consistency: Is the visual presentation polished, uniform, and aligned with the aesthetic and professional standards of the {industry} industry?
    10. Grammar, Spelling, and Punctuation: Are there any typographical errors, passive voice misuse, or grammatical inconsistencies?
    11. Employment Gap Handling: Are the timelines clear, and are any employment gaps or transitions addressed logically without undermining the candidate's {experience_level} standing?
    12. Certifications and Projects: Are external credentials, portfolio items, or projects highlighted effectively, particularly those that carry heavy weight in {industry}?
    13. Tone and Professionalism: Is the leadership and communication tone appropriate for an {experience_level} candidate communicating with {industry} decision-makers?
    14. Length and Conciseness: Is the document's length strictly appropriate for an {experience_level} professional, avoiding fluff while covering necessary {roles} criteria?
    15. Readability and Scanning: Can a recruiter easily scan the document and find key {roles}-specific qualifications within the first 10 seconds?

    Structure your response with an executive summary first (assessing overall market readiness for {roles}), followed by a detailed breakdown of the 15 points, and conclude with the top 3 immediate action items the candidate must take to be highly competitive in the {industry} market.
    Format your response with Markdown.
    Reply as if you're talking to the candidate directly.
    """

def build_cover_letter_prompt(company: str, role: str, location: str, notes: str, snapshot_text: str = '') -> str:
    role_display = role if role else "the position"
    location_display = f" in {location}" if location else ""
    notes_display = f"\nAdditional context about the lead: {notes}" if notes else ""

    job_description_block = ""
    if snapshot_text:
        job_description_block = f"""

            ## Job Description (from the job posting URL)
            {snapshot_text}

            Use the job description above to tailor the cover letter to the specific requirements,
            responsibilities, and qualifications mentioned. Highlight how the candidate's CV matches
            these requirements."""

    return f"""You are an expert cover letter writer. Write a professional, compelling cover letter for a candidate applying to **{company}** for the role of **{role_display}**{location_display}.{notes_display}{job_description_block}

        The candidate's CV is attached. Tailor the cover letter specifically to this company and role based on the CV content.

        Guidelines:
        - Keep the cover letter professional, concise, and engaging
        - Highlight relevant skills and experience from the CV that match this specific role and company
        - Use a standard business letter format with proper salutation and closing
        - Do NOT use placeholder text like "[Your Name]" or "[Date]" - use actual content from the CV when possible, or omit if not available
        - Aim for 3-4 paragraphs (250-400 words)
        - End with a call to action expressing interest in an interview

        Format your response with Markdown."""


def _format_search_results(search_results: list[dict]) -> str:
    if not search_results:
        return "No search results available."
    lines = []
    for i, r in enumerate(search_results, 1):
        lines.append(f"{i}. Title: {r.get('title', 'N/A')}")
        lines.append(f"   URL: {r.get('url', 'N/A')}")
        lines.append(f"   Snippet: {r.get('snippet', 'N/A')}")
        lines.append("")
    return "\n".join(lines)


def build_lead_generation_prompt(existing_lead_companies: set[str], industries: list[str], experience_level: str, countries: list[str], cities: list[str], modes: list[str], company_sizes: list[str], roles: list[str], company_leads_only: bool, num_leads: int = 15, additional_comment: str = None, search_results: list[dict] = None) -> str:
    industries_str = ', '.join(industries) if industries else 'all industries'
    countries_str = ', '.join(countries) if countries else 'any country'
    cities_str = ', '.join(cities) if cities else 'any city'
    search_results_str = _format_search_results(search_results or [])
    additional_requirements_block = ""
    if additional_comment:
        additional_requirements_block = f"""
## Additional Requirements from the User
{additional_comment}

When selecting results, treat these additional requirements as the highest
priority criteria. Only include results that match them whenever possible."""


    if company_leads_only:
        return f"""
You are an expert executive recruiter and corporate market researcher.

## CRITICAL RULE
Below you will find real search results from the web. You MUST use ONLY these results as your source of companies and URLs. DO NOT invent, hallucinate, or fabricate any company names, URLs, or data. If a company or URL is not in the search results below, you MUST NOT include it.

## Search Results (Real Web Data)
<search_results>
{search_results_str}
</search_results>

## Search Criteria
- Industries: {industries_str}
- Countries: {countries_str}
- Cities: {cities_str}
- Modes: {', '.join(modes)}
- Company Sizes: {', '.join(company_sizes)}
- Existing leads to avoid: {existing_lead_companies}
{additional_requirements_block}
## Task
From the search results above, select up to {num_leads} companies that best match the criteria. Extract the company name from the title/snippet. Use the EXACT URL from the search results.

## Output Format
Output ONLY a valid JSON array. No thinking tags, no explanation, no markdown. Start with [ and end with ].

Each object must have:
- "company": company name (max 40 chars)
- "location": specific job location from criteria (max 50 chars)
- "external_link": exact URL from search results (max 500 chars)
- "notes": brief explanation of why this company matches (size, mode, industry)

If a search result is a job board aggregator (like LinkedIn, Indeed, Glassdoor), extract the ACTUAL company name mentioned in the title or snippet, and use the URL that points to that company's careers page.
"""
    else:
        return f"""
You are an expert executive recruiter and corporate market researcher.

## CRITICAL RULE
Below you will find real search results from the web. You MUST use ONLY these results as your source of companies, job postings, and URLs. DO NOT invent, hallucinate, or fabricate any company names, job titles, URLs, or data. If a job posting or URL is not in the search results below, you MUST NOT include it.

## Search Results (Real Web Data)
<search_results>
{search_results_str}
</search_results>

## Search Criteria
- Industries: {industries_str}
- Countries: {countries_str}
- Cities: {cities_str}
- Modes: {', '.join(modes)}
- Company Sizes: {', '.join(company_sizes)}
- Roles: {', '.join(roles) if roles else 'any role'}
- Experience Level: {experience_level}
- Existing leads to avoid: {existing_lead_companies}
{additional_requirements_block}
## Task
From the search results above, select up to {num_leads} job postings that best match the criteria. Extract the exact job title from the title/snippet. Use the EXACT URL from the search results.

## Output Format
Output ONLY a valid JSON array. No thinking tags, no explanation, no markdown. Start with [ and end with ].

Each object must have:
- "company": company name (max 40 chars)
- "location": specific job location from criteria (max 50 chars)
- "external_link": exact URL from search results (max 500 chars)
- "notes": brief explanation of why this role matches
- "role": exact job title from search results (max 100 chars)

If a search result is a job board aggregator (like LinkedIn, Indeed, Glassdoor), extract the ACTUAL company name and job title mentioned in the title or snippet.
"""
