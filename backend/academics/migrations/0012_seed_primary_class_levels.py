"""
Ensure all 9 canonical class levels exist.

The initial migration (0010) tried to rename Basic → Primary, but some
production databases may not have had "Basic 1".."Basic 6" rows to rename.
This follow-up creates any missing Primary levels directly.
"""
from django.db import migrations


def forwards(apps, schema_editor):
    ClassLevel = apps.get_model("academics", "ClassLevel")

    # All 9 canonical levels with their expected order
    canonical = [
        ("KG 1",       "kg",      1),
        ("KG 2",       "kg",      2),
        ("Nursery 1",  "nursery", 3),
        ("Nursery 2",  "nursery", 4),
        ("Primary 1",  "basic",   5),
        ("Primary 2",  "basic",   6),
        ("Primary 3",  "basic",   7),
        ("Primary 4",  "basic",   8),
        ("Primary 5",  "basic",   9),
    ]

    for name, section, order in canonical:
        cl, created = ClassLevel.objects.get_or_create(
            name=name,
            defaults={"section": section, "order": order},
        )
        if not created and cl.order != order:
            # Fix order if it drifted
            cl.order = order
            cl.save(update_fields=["order"])


def backwards(apps, schema_editor):
    # Remove Primary levels that didn't exist before
    ClassLevel = apps.get_model("academics", "ClassLevel")
    ClassLevel.objects.filter(name__startswith="Primary").delete()
    ClassLevel.objects.filter(section="kg").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0011_alter_classlevel_order_alter_classlevel_section_and_more"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
