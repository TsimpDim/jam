import json
import os
from django.db import migrations


def load_country_city_data(apps, schema_editor):
    Country = apps.get_model('special', 'Country')
    City = apps.get_model('special', 'City')

    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')

    # Load countries
    countries_path = os.path.join(data_dir, 'countries.json')
    with open(countries_path, 'r', encoding='utf-8') as f:
        countries_data = json.load(f)
    for item in countries_data:
        # countries.json may contain duplicate entries (e.g. Switzerland),
        # so use get_or_create keyed on the unique slug to stay idempotent.
        Country.objects.get_or_create(
            slug=item['slug'],
            defaults={'name': item['name'], 'code': item['code']},
        )

    # Build country slug -> id map from database
    country_ids = {c.slug: c.id for c in Country.objects.all()}

    # Load cities
    cities_path = os.path.join(data_dir, 'cities.json')
    with open(cities_path, 'r', encoding='utf-8') as f:
        cities_data = json.load(f)

    batch_size = 1000
    batch = []
    for item in cities_data:
        country_slug = item.get('country')
        country_id = country_ids.get(country_slug) if country_slug else None
        batch.append(City(
            name=item['name'],
            slug=item['slug'],
            country_id=country_id,
        ))
        if len(batch) >= batch_size:
            City.objects.bulk_create(batch)
            batch = []
    if batch:
        City.objects.bulk_create(batch)


def unload_country_city_data(apps, schema_editor):
    City = apps.get_model('special', 'City')
    Country = apps.get_model('special', 'Country')
    City.objects.all().delete()
    Country.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('special', '0003_country_city_leadgenerationrequest'),
    ]

    operations = [
        migrations.RunPython(load_country_city_data, unload_country_city_data),
    ]
