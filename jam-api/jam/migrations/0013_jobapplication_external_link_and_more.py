# Generated by Django 4.0.4 on 2023-01-15 21:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jam', '0012_jobapplication_applied_through'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobapplication',
            name='external_link',
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='jobapplication',
            name='applied_through',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
