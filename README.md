# Telegram-бот: 3D-дизайн по планировке квартиры

Бот на фреймворке [eve](https://eve.dev). Пользователь отправляет в Telegram план квартиры (фото, скриншот или PDF). Бот:

1. Разбирает планировку: комнаты, их расположение, двери и окна.
2. Уточняет стиль интерьера: современный, скандинавский, лофт, минимализм, неоклассика, джапанди.
3. Генерирует 3D-визуализацию и отправляет её в чат как фото.
4. По запросу делает рендер отдельной комнаты, вид сверху или вариант в другом стиле.

## Как устроено

| Файл | Назначение |
| --- | --- |
| `agent/agent.ts` | Модель агента (Claude через AI Gateway) |
| `agent/instructions.md` | Поведение бота-дизайнера |
| `agent/channels/telegram.ts` | Telegram-вебхук, приём планов, отправка рендеров через `sendPhoto` |
| `agent/tools/render_3d_design.ts` | Генерация 3D-рендера по плану через модель изображений (по умолчанию `google/gemini-3-pro-image`) |

## Настройка

1. Создайте бота у [@BotFather](https://t.me/BotFather) и получите токен.
2. Задайте переменные окружения (локально в `.env.local`, на Vercel в Project Settings → Environment Variables):

```bash
TELEGRAM_BOT_TOKEN=123456:ABC...          # токен от BotFather
TELEGRAM_WEBHOOK_SECRET_TOKEN=any-random-string
TELEGRAM_BOT_USERNAME=my_design_bot       # необязательно, нужно для групп
AI_GATEWAY_API_KEY=...                     # или OIDC-токен после `vercel env pull`
IMAGE_MODEL=google/gemini-3-pro-image      # необязательно
```

3. Задеплойте (например, `vercel deploy`) и зарегистрируйте вебхук:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://<your-app>.vercel.app/eve/v1/telegram",
       "secret_token":"'"$TELEGRAM_WEBHOOK_SECRET_TOKEN"'",
       "allowed_updates":["message","callback_query"]}'
```

4. Напишите боту `/start` и отправьте план квартиры.

## Локальная разработка

Нужен Node.js 24+.

```bash
pnpm install
pnpm dev
```

Чтобы Telegram достучался до локального сервера, откройте туннель (например, `ngrok http 3000`) и укажите его URL в `setWebhook`.

Документация eve лежит в `node_modules/eve/docs/` после установки зависимостей.
