---
description: Use when the user wants a commercial proposal (КП), estimate, смета, расчёт стоимости, or quote for injection repair, crack sealing, waterproofing, or structural strengthening.
---

# How to issue a Panda Core КП

## 1. Load this skill, then work the draft

1. `get_proposal_draft` — see what is already known.
2. `list_price_catalog` — pick `serviceCode` values from the catalog, never free-text prices.
3. Ask only for **required** gaps, in one message. Optional gaps can wait if the user wants a draft now.
4. `save_proposal_draft` after each batch of answers.
5. `calculate_estimate` with quantities and site coefficients.
6. `format_commercial_proposal` and paste its `markdown` as the reply. Do not retype totals.

## 2. Map the job to catalog codes

| User says | Codes |
| --- | --- |
| Трещина течёт, вода, паркинг, подвал | `crack_prep` + `polymer_injection_pu` |
| Силовая трещина в балке/колонне, сухо | `crack_prep` + `polymer_injection_epoxy` |
| Крупные пустоты, массив | `cement_injection` |
| Дефшов, стык плит | `joint_waterproofing` |
| Напор за стеной, завеса | `curtain_grouting` |
| Фундамент, тоннель, приямок | `underground_waterproofing` |
| Стилобат, рампа, плита паркинга | `parking_waterproofing` |
| Усиление лентой | `cfrp_strengthening` |
| Маяки / мониторинг | `crack_monitoring` |
| Дальше 40 км | `mobilization` (км сверх 40; `save_proposal_draft` can add this from `distanceKm`) |

Always keep `survey` (1 выезд) unless the user forbids it.

## 3. Coefficients (multiply only catalog rows with applyCoefficients)

- Height: `0-5` / `5-15` / `15-30` / `30+`
- Water: `dry` / `damp` / `active_leak`
- Access: `easy` / `restricted` / `confined`
- Season: `above_5c` / `winter`
- Urgency: `normal` / `rush` / `emergency`

If unknown, calculate with defaults (`0-5`, `dry`, `easy`, `above_5c`, `normal`) and list the defaults in the reply.

## 4. Required vs optional intake

Required before a КП:

- Заказчик: компания **или** ФИО
- Объект: адрес **или** описание
- Объём: хотя бы одна позиция с количеством

Optional, but it changes the number:

- Тип объекта, конструкция
- Вода, высота, доступ, сезон, срочность
- Можно ли останавливать эксплуатацию
- Срок, НДС, график оплаты, ИНН, плечо в км

Do not block a draft КП on optional fields.

## 5. Reply shape

1. Two-line recap of what you assumed.
2. The formatted КП (`markdown` from the tool).
3. If `belowMinimum`, say the brigade minimum is 80 000 ₽.
4. Offer the next step: free engineer visit.

If the user only greets you, introduce yourself in one sentence and ask for the object + problem.
