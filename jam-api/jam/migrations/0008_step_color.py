# Generated by Django 4.0.4 on 2022-05-01 18:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jam', '0007_jobapplication_completed'),
    ]

    operations = [
        migrations.AddField(
            model_name='step',
            name='color',
            field=models.CharField(default='#8c8c8c', max_length=7),
        ),
    ]