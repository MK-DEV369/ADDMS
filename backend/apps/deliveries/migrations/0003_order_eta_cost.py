from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('deliveries', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='deliveryorder',
            name='estimated_duration_minutes',
            field=models.IntegerField(null=True, blank=True, help_text='Predicted duration in minutes'),
        ),
        migrations.AddField(
            model_name='deliveryorder',
            name='total_cost',
            field=models.DecimalField(null=True, blank=True, max_digits=10, decimal_places=2, help_text='Computed delivery cost'),
        ),
    ]
