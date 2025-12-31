from django.core.management.base import BaseCommand
from django.db import transaction
from slugify import slugify

from catalog.models import Category, Subcategory


DEFAULT_CATALOG = {
    "Mantenimiento": [
        "Plomería",
        "Electricidad",
        "Gasista matriculado",
        "Pintura",
        "Albañilería",
        "Herrería",
        "Carpintería",
        "Cerrajería",
        "Vidriería",
        "Impermeabilización",
        "Techista",
        "Aire acondicionado / Refrigeración",
        "Calefacción / Calderas",
        "Bombas de agua / Hidráulica",
    ],
    "Ascensores": [
        "Mantenimiento de ascensores",
        "Reparación",
        "Inspecciones / certificaciones",
        "Montacargas",
    ],
    "Limpieza": [
        "Limpieza general",
        "Limpieza final de obra",
        "Pulido / encerado",
        "Limpieza de vidrios",
        "Limpieza en altura",
    ],
    "Jardinería y espacios verdes": [
        "Jardinería",
        "Poda",
        "Paisajismo",
        "Riego",
        "Terrazas verdes",
    ],
    "Seguridad": [
        "Vigilancia",
        "CCTV / Cámaras",
        "Alarmas",
        "Control de acceso",
        "Portero eléctrico",
        "Cerco eléctrico",
    ],
    "Plagas y sanitización": [
        "Fumigación",
        "Desratización",
        "Desinfección",
        "Control de palomas",
        "Limpieza / desinfección de tanques",
    ],
    "Incendio y seguridad e higiene": [
        "Matafuegos",
        "Sistemas contra incendio",
        "Señalética",
        "Plan de evacuación",
        "Auditorías / informes",
    ],
    "Obras y reformas": [
        "Reformas integrales",
        "Durlock / yesería",
        "Revestimientos",
        "Andamios",
        "Demoliciones",
    ],
    "Aberturas y persianas": [
        "Aluminio / aberturas",
        "Persianas",
        "Cortinas de enrollar",
        "Mosquiteros",
    ],
    "Servicios profesionales": [
        "Arquitectura",
        "Ingeniería",
        "Contador",
        "Abogado",
        "Gestoría",
        "Seguros",
    ],
    "Logística y residuos": [
        "Volquetes / escombros",
        "Retiro de muebles",
        "Mudanzas",
        "Fletes",
    ],
    "Amenities": [
        "Mantenimiento de pileta",
        "Parrillas / SUM",
        "Gimnasio (mantenimiento)",
    ],
}


class Command(BaseCommand):
    help = "Carga rubros/subrubros por defecto (idempotente por slug)."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Borra rubros/subrubros antes de cargar.")

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write(self.style.WARNING("Borrando Subrubros y Rubros..."))
            Subcategory.objects.all().delete()
            Category.objects.all().delete()

        created_cats = 0
        created_subs = 0
        updated_subs = 0

        for cat_name, subs in DEFAULT_CATALOG.items():
            cat, cat_created = Category.objects.get_or_create(
                name=cat_name,
                defaults={"active": True},
            )
            if cat_created:
                created_cats += 1
            else:
                if not cat.active:
                    cat.active = True
                    cat.save(update_fields=["active"])

            for sub_name in subs:
                # slug canónico: <category-slug>-<sub-name>
                cat_slug = cat.slug or slugify(cat.name)
                sub_slug = slugify(f"{cat_slug}-{sub_name}")

                sub, sub_created = Subcategory.objects.get_or_create(
                    slug=sub_slug,
                    defaults={
                        "category": cat,
                        "name": sub_name,
                        "active": True,
                    },
                )

                if sub_created:
                    created_subs += 1
                else:
                    changed = False
                    if sub.category_id != cat.id:
                        sub.category = cat
                        changed = True
                    # Normalizamos el nombre visible (por ejemplo, Plomeria -> Plomería)
                    if sub.name != sub_name:
                        sub.name = sub_name
                        changed = True
                    if not sub.active:
                        sub.active = True
                        changed = True

                    if changed:
                        sub.save(update_fields=["category", "name", "active"])
                        updated_subs += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"OK. Rubros creados: {created_cats} | Subrubros creados: {created_subs} | Subrubros actualizados: {updated_subs}"
            )
        )
