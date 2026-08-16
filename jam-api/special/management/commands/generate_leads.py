from django.core.management.base import BaseCommand
from django.utils import timezone
from special.models import LeadGenerationRequest
from special.prompts import build_lead_generation_prompt
from special.aws_client import AwsClient
from special.web_search import WebSearch
from jam.models import Lead, Notification, NotificationType
import json
import re

class Command(BaseCommand):
    help = 'Process pending lead generation requests using real web search.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting lead generation with web search...')

        pending_requests = LeadGenerationRequest.objects.filter(
            is_done=False
        ).prefetch_related(
            'industries', 'experience_level', 'countries', 'cities', 'roles'
        )
        count = pending_requests.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS('No pending lead generation requests to process.'))
            return

        self.stdout.write(f'Found {count} pending lead generation request(s) to process.')

        request: LeadGenerationRequest
        for request in pending_requests:
            try:
                self.stdout.write(f'Processing lead generation request for user: {request.user.username}')

                existing_leads = Lead.objects.filter(user=request.user)
                existing_lead_companies = set(lead.company.lower() for lead in existing_leads)

                industries = [ind.name for ind in request.industries.all()]
                experience_level_names = [el.name for el in request.experience_level.all()]
                experience_level = ", ".join(experience_level_names) if experience_level_names else None
                countries_list = list(request.countries.all())
                countries = [c.name for c in countries_list]
                country_codes = [c.code for c in countries_list]
                cities = [c.name for c in request.cities.all()]
                modes = request.modes
                company_sizes = request.company_sizes
                company_leads_only = request.company_leads_only
                roles_list = list(request.roles.all())
                roles = [role.name for role in roles_list] if roles_list else None
                num_leads = request.num_leads or 15
                additional_comment = request.additional_comment

                self.stdout.write('  Step 1: Performing real web search...')
                try:
                    if company_leads_only:
                        search_results = WebSearch.search_companies(
                            industries=industries,
                            countries=countries,
                            country_codes=country_codes,
                            cities=cities,
                            modes=modes,
                            company_sizes=company_sizes,
                            additional_comment=additional_comment,
                        )
                    else:
                        search_results = WebSearch.search_jobs(
                            roles=roles or [],
                            industries=industries,
                            countries=countries,
                            country_codes=country_codes,
                            cities=cities,
                            modes=modes,
                            experience_level=experience_level,
                            company_sizes=company_sizes,
                            additional_comment=additional_comment,
                        )
                    self.stdout.write(f'  Found {len(search_results)} raw search results.')
                except Exception as e:
                    request.is_done = True
                    request.completed_at = timezone.now()
                    request.save()
                    self.stdout.write(self.style.WARNING(f'  Web search failed: {e}. Leaving request pending for retry.'))
                    search_results = []

                if not search_results:
                    request.is_done = True
                    request.completed_at = timezone.now()
                    request.save()
                    notif_type = NotificationType.objects.get(code='lead_generation_empty')
                    role_str = f"{', '.join(roles)} " if roles else ""
                    country_str = ", ".join(countries) if countries else "all locations"
                    text = notif_type.text_template.format(role_str=role_str, country_str=country_str)
                    Notification.objects.create(user=request.user, notification_type=notif_type, text=text)
                    self.stdout.write(self.style.WARNING('  No search results found. Skipping LLM call to avoid hallucinated leads. Request left pending for retry.'))
                    continue

                # Build the authoritative set of URLs that came from the search.
                # Any external_link the LLM returns that is not in this set is
                # a hallucination and will be dropped before saving.
                valid_search_urls = {r["url"] for r in search_results if r.get("url")}

                self.stdout.write(f'  Step 2: {len(search_results)} results ready for LLM processing.')

                self.stdout.write('  Step 3: Sending to LLM for ranking and formatting...')
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {
                                "text": build_lead_generation_prompt(
                                    existing_lead_companies=existing_lead_companies,
                                    industries=industries,
                                    experience_level=experience_level,
                                    countries=countries,
                                    cities=cities,
                                    modes=modes,
                                    company_sizes=company_sizes,
                                    roles=roles,
                                    company_leads_only=company_leads_only,
                                    num_leads=num_leads,
                                    additional_comment=additional_comment,
                                    search_results=search_results,
                                )
                            }
                        ]
                    }
                ]

                response = AwsClient.converse(messages)
                self.stdout.write('  Step 4: Parsing LLM response and saving leads...')
                try:
                    json_response = Command._extract_json(response)
                    
                    saved_count = 0
                    for item in json_response:
                        company = Command._clip(item.get('company'), 40)
                        notes = item.get('notes')
                        role = Command._clip(item.get('role'), 255)
                        location = Command._clip(item.get('location'), 50)
                        external_link = item.get('external_link')
                        # Drop URLs the LLM fabricated - only allow URLs that
                        # were literally returned by the search provider.
                        if external_link and external_link not in valid_search_urls:
                            self.stdout.write(self.style.WARNING(f'    Dropping hallucinated URL: {external_link[:80]}'))
                            external_link = None
                        # A truncated URL is broken anyway, so drop it.
                        if external_link and len(external_link) > 500:
                            external_link = None

                        if company and company.lower() not in existing_lead_companies:
                            Lead.objects.create(
                                user=request.user,
                                company=company,
                                notes=notes,
                                role=role,
                                external_link=external_link,
                                location=location,
                                generated=True,
                                generation_request=request,
                            )
                            existing_lead_companies.add(company.lower())
                            saved_count += 1
                    
                    self.stdout.write(self.style.SUCCESS(f'  Saved {saved_count} leads.'))
                    request.is_done = True
                    request.completed_at = timezone.now()
                    request.leads_generated_count = saved_count
                    request.save()
                    notif_type = NotificationType.objects.get(code='lead_generation_done')
                    role_str = f"{', '.join(roles)} " if roles else ""
                    country_str = ", ".join(countries) if countries else "all locations"
                    text = notif_type.text_template.format(count=saved_count, role_str=role_str, country_str=country_str)
                    Notification.objects.create(user=request.user, notification_type=notif_type, text=text)
                    self.stdout.write(self.style.SUCCESS(f'Successfully processed lead generation request for user: {request.user.username}'))
                except json.JSONDecodeError as e:
                    self.stdout.write(self.style.ERROR(f'  Error decoding JSON response: {str(e)}'))
                    self.stdout.write(f'  Raw response (first 800 chars): {response[:800]}')
                    self.stdout.write(self.style.WARNING(f'  Request left pending for retry.'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error processing lead generation request for user {request.user.username}: {str(e)}'))
                print(f"Lead generation error for user {request.user.username}")

        self.stdout.write(self.style.SUCCESS('Lead generation processing complete.'))

    @staticmethod
    def _clip(value, length: int):
        if value is None:
            return None
        value = str(value).strip()
        return value[:length]

    @staticmethod
    def _extract_json(text: str) -> list:
        text = text.strip()
        
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        
        text = re.sub(r'<thinking>.*?</thinking>', '', text, flags=re.DOTALL)
        
        start = text.find('[')
        end = text.rfind(']')
        
        if start == -1 or end == -1 or end <= start:
            raise json.JSONDecodeError("No JSON array found", text, 0)
        
        json_str = text[start:end+1].strip()
        return json.loads(json_str)
