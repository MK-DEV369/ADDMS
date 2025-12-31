from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('zones', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='noflyzone',
            name='severity',
            field=models.CharField(
                choices=[('red', 'Red / hard no-fly'), ('yellow', 'Yellow / warning (avoid)')],
                db_index=True,
                default='red',
                help_text='red=no-fly, yellow=warning (treated as avoid)',
                max_length=10,
            ),
        ),
    ]
