# Generated by Django 4.0.4 on 2022-04-25 18:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jam', '0004_timeline'),
    ]

    operations = [
        migrations.AddField(
            model_name='timeline',
            name='completed',
            field=models.BooleanField(default=False),
        ),
    ]
