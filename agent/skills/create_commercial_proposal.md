---
description: Use when the user wants a commercial proposal (КП), estimate, смета, or quote for CFRP / carbon lamella strengthening, FibArm, tape hoops, or when they share a reinforcement sketch.
---

# How to issue an SDT КП

Follow the live template: customer МБ-Проект Бюро / walls C4–C5, outgoing ref, labor vs materials, 30% overhead, VAT 22%, nine standard notes.

## 1. Tools in order

1. `get_proposal_draft`
2. `list_price_catalog` if you need codes or norms
3. If the user sent a sketch BOM (L, b, qty) → `takeoff_reinforcement`
4. `save_proposal_draft` for customer, object, wall area
5. `calculate_estimate` — prefer the standard package from `wallAreaM2` + `lamellaM` + `tapeM2`
6. `format_commercial_proposal` and paste `markdown` unchanged

## 2. Standard package (as in the sample sheet)

| Work | Qty source | Code |
| --- | --- | --- |
| Подготовка поверхности | площадь усиления, м² | `surface_prep` |
| Ремонт Mapegrout + Манопокс | та же площадь | `surface_repair` |
| Монтаж ламели FibArm Lamel 1.4/150 | ΣL заготовок, м.п. | `lamella_install` |
| Монтаж холста FibArm Tape 530+ | площадь холста, м² | `tape_install` |
| Огнезащита Айсберг-Б | площадь усиления, м² | `fire_protection` |

Norms (already in the catalog):

- Ламель и холст: +10% раскрой
- Клей Laminate+: 1,65 кг на 1 м ламели
- Связующее 530+: 2,2 кг на 1 м² холста
- Mapegrout 2 кг/м², Манопокс 1 кг/м², Айсберг-Б 2,5 кг/м²
- Накладные 30% только на работу

## 3. Sketch vs sheet

The C4/C5 sketch Σ ламель = 86,77 м (в штампе ошибочно 86,87). Σ хомутов = 27,185 м при b=200 мм → L×b = 5,437 м², а в смете холст **6,99 м²**. If both numbers exist, take **6,99 м² from the sheet** (`tapeAreaOverrideM2`) and mention the difference.

Crack injection (Epojet > 0,2 мм), Mapefer on exposed rebar, sandblasting — in notes and design, not in this bill unless the user adds a custom line.

## 4. Required intake

- Заказчик
- Объект / конструкции
- Объёмы: площадь стен + погонаж ламелей + м² холста (или таблица заготовок)

Optional: адрес, исх. номер, график, «без НДС».

## 5. Reply

1. One line: what volumes you used
2. The formatted КП
3. Flag if tape m² was overridden vs L×b
