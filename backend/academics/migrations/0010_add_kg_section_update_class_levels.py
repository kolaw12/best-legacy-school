"""
Add KG section and rename Basic -> Primary in class level names.

This migration:
  1. Moves all existing rows to very high temporary order values
  2. Creates KG 1 and KG 2 class levels
  3. Renames "Basic 1".."Basic 6" to "Primary 1".."Primary 6"
  4. Assigns final order values
"""
from django.db import migrations, models


def forwards(apps, schema_editor):
    ClassLevel = apps.get_model("academics", "ClassLevel")

    # Step 1: Move everything to temporary high values (1000+) to avoid any collisions
    for cl in ClassLevel.objects.all():
        cl.order = cl.order + 1000
        cl.save(update_fields=["order"])

    # Step 2: Create KG levels at positions 1, 2
    ClassLevel.objects.get_or_create(name="KG 1", defaults={"section": "kg", "order": 1})
    ClassLevel.objects.get_or_create(name="KG 2", defaults={"section": "kg", "order": 2})

    # Step 3: Rename Basic -> Primary and assign final orders
    # Nursery stays at 3, 4
    ClassLevel.objects.get_or_create(name="Nursery 1", defaults={"section": "nursery", "order": 3})
    ClassLevel.objects.get_or_create(name="Nursery 2", defaults={"section": "nursery", "order": 4})

    rename_map = {
        "Basic 1": ("Primary 1", 5),
        "Basic 2": ("Primary 2", 6),
        "Basic 3": ("Primary 3", 7),
        "Basic 4": ("Primary 4", 8),
        "Basic 5": ("Primary 5", 9),
        "Basic 6": ("Primary 6", 10),
    }

    for old_name, (new_name, order) in rename_map.items():
        try:
            cl = ClassLevel.objects.get(name=old_name)
            cl.name = new_name
            cl.order = order
            cl.save(update_fields=["name", "order"])
        except ClassLevel.DoesNotExist:
            pass

    # Fix nursery orders (they are at 1001/1002 now)
    for name, order in [("Nursery 1", 3), ("Nursery 2", 4)]:
        try:
            cl = ClassLevel.objects.get(name=name)
            cl.order = order
            cl.save(update_fields=["order"])
        except ClassLevel.DoesNotExist:
            pass


def backwards(apps, schema_editor):
    ClassLevel = apps.get_model("academics", "ClassLevel")

    revert_map = {
        "Primary 1": ("Basic 1", 3),
        "Primary 2": ("Basic 2", 4),
        "Primary 3": ("Basic 3", 5),
        "Primary 4": ("Basic 4", 6),
        "Primary 5": ("Basic 5", 7),
        "Primary 6": ("Basic 6", 8),
    }
    for old_name, (new_name, order) in revert_map.items():
        try:
            cl = ClassLevel.objects.get(name=old_name)
            cl.name = new_name
            cl.order = order
            cl.save(update_fields=["name", "order"])
        except ClassLevel.DoesNotExist:
            pass

    # Remove KG levels
    ClassLevel.objects.filter(section="kg").delete()

    # Restore nursery orders
    for name, order in [("Nursery 1", 1), ("Nursery 2", 2)]:
        try:
            cl = ClassLevel.objects.get(name=name)
            cl.order = order
            cl.save(update_fields=["order"])
        except ClassLevel.DoesNotExist:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0009_add_teacher_comment"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
