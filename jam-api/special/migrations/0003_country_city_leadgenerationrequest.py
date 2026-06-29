from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('special', '0002_load_reference_data'),
    ]

    operations = [
        migrations.CreateModel(
            name='Country',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('slug', models.SlugField(max_length=100, unique=True)),
                ('code', models.CharField(help_text='ISO 3166-1 alpha-2 code', max_length=2, unique=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='City',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('slug', models.SlugField(max_length=100, unique=True)),
                ('country', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='cities', to='special.country')),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='LeadGenerationRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('company_leads_only', models.BooleanField(default=False)),
                ('modes', models.JSONField(default=list)),
                ('company_sizes', models.JSONField(default=list)),
                ('result', models.TextField(blank=True, null=True)),
                ('is_done', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lead_generation_requests', to=settings.AUTH_USER_MODEL)),
                ('countries', models.ManyToManyField(blank=True, related_name='lead_requests', to='special.country')),
                ('cities', models.ManyToManyField(blank=True, related_name='lead_requests', to='special.city')),
                ('roles', models.ManyToManyField(blank=True, related_name='lead_requests', to='special.role')),
                ('industries', models.ManyToManyField(blank=True, related_name='lead_requests', to='special.industry')),
                ('experience_level', models.ManyToManyField(blank=True, related_name='lead_requests', to='special.experiencelevel')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
