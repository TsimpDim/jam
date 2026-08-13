import os
import time
import logging
from ddgs import DDGS

try:
    from tavily import TavilyClient
except ImportError:  # pragma: no cover
    TavilyClient = None

SEARCH_DELAY = 0.5
SEARCH_TIMEOUT = 15
MAX_RETRIES = 2
BACKENDS = "bing,brave,google"

# "advanced" = 2 credits/query, "basic" = 1 credit/query.
SEARCH_DEPTH = "advanced"
TAVILY_MAX_RETRIES = 2

_tavily_client = None


class WebSearch:
    """Web search for real-time job and company discovery.

    When TAVILY_API_KEY is set, Tavily is used as the primary provider with
    purpose-built natural-language queries across the whole web. DDGS is the
    per-query fallback.
    """

    # ------------------------------------------------------------------ #
    # Public entry points                                                  #
    # ------------------------------------------------------------------ #

    @staticmethod
    def search_jobs(roles, industries, countries, country_codes, cities, modes,
                    experience_level, company_sizes, max_results_per_query=20):
        client = WebSearch._get_or_create_tavily_client()
        print(f"search_jobs: provider={'Tavily' if client else 'DDGS'}, "
                    f"roles={roles}, countries={countries}")

        if client:
            queries = WebSearch._build_job_queries_tavily(
                roles, industries, countries, cities, modes, experience_level)
            results = WebSearch._run_queries_tavily(
                client, queries, max_results_per_query)
        else:
            queries = WebSearch._build_job_queries_ddgs(
                roles, industries, countries, country_codes, cities, modes,
                experience_level, company_sizes)
            results = WebSearch._run_queries_ddgs(queries, max_results_per_query)

        deduped = WebSearch._deduplicate_by_url(results)
        print(f"search_jobs complete: {len(deduped)} unique results")
        return deduped

    @staticmethod
    def search_companies(industries, countries, country_codes, cities, modes,
                         company_sizes, max_results_per_query=20):
        client = WebSearch._get_or_create_tavily_client()
        print(f"search_companies: provider={'Tavily' if client else 'DDGS'}, "
                    f"industries={industries}, countries={countries}")

        if client:
            queries = WebSearch._build_company_queries_tavily(
                industries, countries, cities, modes, company_sizes)
            results = WebSearch._run_queries_tavily(
                client, queries, max_results_per_query)
        else:
            queries = WebSearch._build_company_queries_ddgs(
                industries, countries, cities, modes, company_sizes)
            results = WebSearch._run_queries_ddgs(queries, max_results_per_query)

        deduped = WebSearch._deduplicate_by_url(results)
        print(f"search_companies complete: {len(deduped)} unique results")
        return deduped

    # ------------------------------------------------------------------ #
    # Query runners                                                        #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _run_queries_tavily(client, queries, max_results_per_query):
        all_results = []
        for i, query in enumerate(queries[:8], 1):
            print(f"Tavily query {i}: {query}")
            results = WebSearch._search_tavily(
                client, query, max_results=max_results_per_query)
            print(f"  -> {len(results)} results")
            all_results.extend(results)
            if i < len(queries[:8]):
                time.sleep(SEARCH_DELAY)
        return all_results

    @staticmethod
    def _run_queries_ddgs(queries, max_results_per_query):
        all_results = []
        for i, query in enumerate(queries[:8], 1):
            print(f"DDGS query {i}: {query}")
            results = WebSearch._search_ddgs(query, max_results=max_results_per_query)
            print(f"  -> {len(results)} results")
            all_results.extend(results)
            if i < len(queries[:8]):
                time.sleep(SEARCH_DELAY)
        return all_results

    # ------------------------------------------------------------------ #
    # Provider calls                                                       #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _get_or_create_tavily_client():
        global _tavily_client
        if _tavily_client is not None:
            return _tavily_client
        if TavilyClient is None:
            print("tavily-python not installed")
            return None
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            print("TAVILY_API_KEY not set - using DDGS only")
            return None
        try:
            _tavily_client = TavilyClient(api_key=api_key)
            print("Tavily client initialized")
        except Exception as e:
            print(f"Failed to initialize Tavily client: {e}")
        return _tavily_client

    @staticmethod
    def _search_tavily(client, query, max_results=20):
        for attempt in range(TAVILY_MAX_RETRIES):
            try:
                response = client.search(
                    query=query,
                    search_depth=SEARCH_DEPTH,
                    max_results=max_results,
                    topic="general",
                )
                return [
                    {
                        "title": r.get("title", ""),
                        "url": r.get("url", ""),
                        "snippet": r.get("content", ""),
                    }
                    for r in response.get("results", [])
                    if r.get("url")
                ]
            except Exception as e:
                print(f"Tavily attempt {attempt + 1} failed: {e}")
                if attempt < TAVILY_MAX_RETRIES - 1:
                    time.sleep(SEARCH_DELAY * (attempt + 1))
        return []

    @staticmethod
    def _search_ddgs(query, max_results=20):
        for attempt in range(MAX_RETRIES):
            try:
                with DDGS(timeout=SEARCH_TIMEOUT) as ddgs:
                    raw = ddgs.text(query, max_results=max_results, backend=BACKENDS)
                    return [
                        {
                            "title": r.get("title", ""),
                            "url": r.get("href", r.get("url", "")),
                            "snippet": r.get("body", r.get("snippet", "")),
                        }
                        for r in raw
                        if r.get("href") or r.get("url")
                    ]
            except Exception as e:
                print(f"DDGS attempt {attempt + 1} failed: {e}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(SEARCH_DELAY * (attempt + 1))
        return []

    # ------------------------------------------------------------------ #
    # Tavily query builders - natural language, no site: operators         #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _build_job_queries_tavily(roles, industries, countries, cities, modes, experience_level):
        role_str = " ".join(roles) if roles else "all roles"
        industry_str = " ".join(industries) if industries else "all industries"
        country_str = " ".join(countries) if countries else "everywhere"
        city_str = " ".join(cities) if cities else "all cities"
        exp_str = experience_level or "all experience levels"
        mode_str = " ".join(modes) if modes else "all work modes"
        loc_parts = []
        if city_str and city_str != "all cities":
            loc_parts.append(city_str)
        if country_str and country_str != "everywhere":
            loc_parts.append(country_str)
        loc_str = " ".join(loc_parts) if loc_parts else "worldwide"

        return list(dict.fromkeys([
            f"{role_str} {exp_str} jobs {loc_str} {mode_str} {industry_str}".strip(),
            f"{industry_str} companies hiring {role_str} {exp_str} {loc_str} {mode_str}".strip(),
            f"{role_str} {exp_str} career openings {loc_str} {mode_str}".strip(),
            f"{role_str} {exp_str} {loc_str} {mode_str} {industry_str} apply now".strip(),
            f"hiring {role_str} {exp_str} {loc_str} {mode_str} {industry_str}".strip(),
            f"{role_str} {exp_str} positions {loc_str} {mode_str}".strip(),
            f"{industry_str} {role_str} {exp_str} openings {loc_str} {mode_str}".strip(),
            f"{loc_str} {mode_str} {role_str} {exp_str} {industry_str} jobs".strip(),
        ]))

    @staticmethod
    def _build_company_queries_tavily(industries, countries, cities, modes, company_sizes):
        industry_str = " ".join(industries) if industries else "all industries"
        country_str = " ".join(countries) if countries else "everywhere"
        city_str = " ".join(cities) if cities else "all cities"
        mode_str = " ".join(modes) if modes else "all work modes"
        size_str = " ".join(company_sizes) if company_sizes else "all company sizes"
        loc_parts = []
        if city_str and city_str != "all cities":
            loc_parts.append(city_str)
        if country_str and country_str != "everywhere":
            loc_parts.append(country_str)
        loc_str = " ".join(loc_parts) if loc_parts else "worldwide"

        return list(dict.fromkeys([
            f"{industry_str} {size_str} companies {loc_str} {mode_str} hiring".strip(),
            f"{industry_str} companies {loc_str} {mode_str} careers open positions".strip(),
            f"top {industry_str} {size_str} companies {loc_str} {mode_str} jobs".strip(),
            f"{industry_str} {size_str} {loc_str} {mode_str} company careers page".strip(),
            f"{industry_str} startups {loc_str} {mode_str} we are hiring".strip(),
            f"best {industry_str} {size_str} companies to work for {loc_str} {mode_str}".strip(),
            f"{loc_str} {mode_str} {industry_str} companies hiring {size_str}".strip(),
            f"{industry_str} {loc_str} {size_str} employer job board".strip(),
        ]))

    # ------------------------------------------------------------------ #
    # DDGS query builders - site: operators for targeted fallback          #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _build_job_queries_ddgs(roles, industries, countries, country_codes, cities,
                                 modes, experience_level, company_sizes):
        role_str = " ".join(roles) if roles else "all roles"
        country_str = " ".join(countries) if countries else "everywhere"
        city_str = " ".join(cities) if cities else "all cities"
        exp_str = experience_level or "all levels"
        industry_str = " ".join(industries) if industries else "all industries"
        mode_str = " ".join(modes) if modes else "all modes"
        size_str = " ".join(company_sizes) if company_sizes else "all sizes"

        return list(dict.fromkeys([
            f"{role_str} {exp_str} {country_str} {city_str} {mode_str} {industry_str} {size_str} careers hiring",
            f"{role_str} {exp_str} {country_str} {mode_str} {industry_str} jobs",
            f"{role_str} {exp_str} {city_str} {mode_str} {industry_str} openings",
            f"{role_str} {exp_str} {country_str} {industry_str} apply now",
            f"{industry_str} {role_str} {exp_str} {country_str} {mode_str} careers",
            f"{role_str} {exp_str} {country_str} {city_str} {mode_str} positions",
            f"{size_str} {industry_str} hiring {role_str} {exp_str} {country_str} {mode_str}",
            f"{role_str} {country_str} {city_str} {industry_str} jobs",
        ]))

    @staticmethod
    def _build_company_queries_ddgs(industries, countries, cities,
                                     modes, company_sizes):
        industry_str = " ".join(industries) if industries else "all industries"
        country_str = " ".join(countries) if countries else "everywhere"
        city_str = " ".join(cities) if cities else "all cities"
        mode_str = " ".join(modes) if modes else "all modes"
        size_str = " ".join(company_sizes) if company_sizes else "all sizes"

        return list(dict.fromkeys([
            f"{industry_str} {size_str} companies {country_str} {city_str} {mode_str} hiring",
            f"{industry_str} companies {country_str} {mode_str} careers",
            f"{industry_str} {size_str} {country_str} {mode_str} employer jobs",
            f"{industry_str} {size_str} companies {city_str} {mode_str} openings",
            f"{industry_str} startups {country_str} {mode_str} we are hiring",
            f"{industry_str} {size_str} {country_str} {mode_str} company careers page",
            f"top {industry_str} {size_str} companies {country_str} {mode_str}",
            f"{country_str} {mode_str} {industry_str} companies hiring",
        ]))

    # ------------------------------------------------------------------ #
    # Deduplication                                                        #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _deduplicate_by_url(results):
        seen = set()
        unique = []
        for r in results:
            url = r.get("url", "")
            if not url:
                continue
            normalized = url.split("?")[0].rstrip("/")
            if normalized not in seen:
                seen.add(normalized)
                unique.append(r)
        return unique
