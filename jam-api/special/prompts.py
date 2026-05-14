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