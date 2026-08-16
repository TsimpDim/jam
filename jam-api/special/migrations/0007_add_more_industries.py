from django.db import migrations

NEW_INDUSTRIES = [
    ("FinTech", "fintech"),
    ("Motorsports", "motorsports"),
    ("Cybersecurity", "cybersecurity"),
    ("Crypto & Web3", "crypto-web3"),
    ("Artificial Intelligence & Machine Learning", "artificial-intelligence-machine-learning"),
    ("Data Science & Analytics", "data-science-analytics"),
    ("Cloud Computing", "cloud-computing"),
    ("SaaS", "saas"),
    ("Internet of Things (IoT)", "internet-of-things-iot"),
    ("AR & VR", "ar-vr"),
    ("Robotics", "robotics"),
    ("Semiconductors", "semiconductors"),
    ("Quantum Computing", "quantum-computing"),
    ("Nanotechnology", "nanotechnology"),
    ("Space & Satellite", "space-satellite"),
    ("Sustainability & ESG", "sustainability-esg"),
    ("HealthTech", "healthtech"),
    ("EdTech", "edtech"),
    ("PropTech", "proptech"),
    ("AgTech", "agtech"),
    ("InsurTech", "insurtech"),
    ("LegalTech", "legaltech"),
    ("Wealth Management", "wealth-management"),
    ("Aviation", "aviation"),
    ("Maritime & Shipping", "maritime-shipping"),
    ("Consumer Electronics", "consumer-electronics"),
    ("Cosmetics & Beauty", "cosmetics-beauty"),
    ("Pet Care", "pet-care"),
    ("Furniture & Home Goods", "furniture-home-goods"),
    ("Esports", "esports"),
    ("Sports Betting", "sports-betting"),
    ("Performing Arts", "performing-arts"),
]


def add_more_industries(apps, schema_editor):
    Industry = apps.get_model('special', 'Industry')
    for name, slug in NEW_INDUSTRIES:
        Industry.objects.get_or_create(slug=slug, defaults={'name': name})


def remove_more_industries(apps, schema_editor):
    Industry = apps.get_model('special', 'Industry')
    slugs = [slug for _, slug in NEW_INDUSTRIES]
    Industry.objects.filter(slug__in=slugs).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('special', '0006_leadgenerationrequest_additional_comment_and_more'),
    ]

    operations = [
        migrations.RunPython(add_more_industries, remove_more_industries),
    ]
