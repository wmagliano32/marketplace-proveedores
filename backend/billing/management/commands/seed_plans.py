from django.core.management.base import BaseCommand
from billing.models import Plan

DISCOUNT_ANNUAL = 0.15  # 15% (ajustable)


class Command(BaseCommand):
    help = "Crea planes BASIC/SILVER/GOLD mensual y anual (idempotente)."

    def handle(self, *args, **options):
        monthly = [
            ("BASIC_MONTHLY", "Basic (Mensual)", 1, 1, 20000),
            ("SILVER_MONTHLY", "Silver (Mensual)", 2, 1, 50000),
            ("GOLD_MONTHLY", "Gold (Mensual)", 3, 1, 80000),
        ]

        yearly = []
        for code, name, tier, months, price in monthly:
            y_code = code.replace("_MONTHLY", "_YEARLY")
            y_name = name.replace("(Mensual)", "(Anual)")
            annual_price = int(price * 12 * (1 - DISCOUNT_ANNUAL))
            yearly.append((y_code, y_name, tier, 12, annual_price))

        created = 0
        for code, name, tier, interval_months, price in monthly + yearly:
            obj, c = Plan.objects.get_or_create(
                code=code,
                defaults={
                    "name": name,
                    "tier": tier,
                    "interval_months": interval_months,
                    "price_cents": price * 100,
                    "currency": "ARS",
                    "active": True,
                },
            )
            if not c:
                # update por si cambiaste precios
                obj.name = name
                obj.tier = tier
                obj.interval_months = interval_months
                obj.price_cents = price * 100
                obj.currency = "ARS"
                obj.active = True
                obj.save()
            else:
                created += 1

        self.stdout.write(self.style.SUCCESS(f"OK seed_plans. created={created}"))
