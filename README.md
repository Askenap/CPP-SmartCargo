# SmartCargo ЦПП

Цифровой паспорт перевозки — fullstack прототип управления прохождением грузов через таможенные и пограничные посты Казахстана.

## Демо

Frontend — mobile-first SPA (React + TypeScript + Vite). Работает без backend, состояние хранится в localStorage браузера.

## Стек

- **Frontend:** React 18, TypeScript, Vite, inline styles (DM Sans)
- **Backend:** Node.js, Express, PostgreSQL 17, WebSocket, JWT
- **State:** localStorage (клиент) / PostgreSQL (backend готов, API пока не подключён в UI)

## Запуск локально

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Backend (опционально)
```bash
cd backend
npm install
# Настроить DATABASE_URL в .env
npm run db:migrate
npm run db:seed
npm run dev
# → http://localhost:3001
```

## Деплой на Vercel

Этот репозиторий настроен для деплоя frontend-части на Vercel.

- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### Переменные окружения

Для интеграции с системой Smart Cargo ML (маршрутные листы) нужна переменная:

- `SMARTML_API_KEY` — ключ от команды Smart ML. В Vercel задаётся в Project Settings → Environment Variables для окружений **Production** и **Preview**.

Локально: скопируйте `frontend/.env.example` в `frontend/.env.local` и подставьте ключ. Ключ читается серверным прокси (`frontend/api/ml/...`) и в клиентский бандл НЕ попадает.

### Прокси к Smart Cargo ML

Серверные функции в `frontend/api/ml/`:

- `GET  /api/ml/route-sheet/:code` — карточка МЛ из Smart ML
- `POST /api/ml/route-sheet/:code/border-pass` — фиксация события прохождения поста

Проверка локально:

```bash
curl http://localhost:5173/api/ml/route-sheet/055131
```

UI-демо без живого МЛ: `http://localhost:5173/ml/_demo` (фикстура).

## Экраны прототипа

1. **MenuScreen** — список всех ЦПП с фильтрами
2. **CreateWizard** — создание ЦПП в 6 шагов
3. **DraftScreen** — просмотр черновика
4. **EntryPIScreen** — активный ЦПП въезда по ПИ (с мульти-переключателем и пост-транзитной логикой)
5. **EntryIMScreen** — активный ЦПП въезда (импорт/порожний)
6. **ExitActiveScreen** — активный ЦПП выезда из РК

## Сценарии завершения ЦПП (въезд)

- **Порожний / ИМ:** после "Выезд с территории пограничного поста"
- **Импорт (ДТ):** после "Выезд с поста" при условии, что ДТ выпущена
- **Транзит ПИ → ТОН внутри РК:** после выезда с поста + получения от Кедена "ТД завершена"
- **Транзит ПИ → ТОН на границе:** после выезда с поста → прикрепление электронной очереди Cargo Ruqsat → получения от Кедена "ТД завершена"

## Структура

```
frontend/
  src/
    components/     — UI-компоненты (HScroll, Ring, StepRow, TabBar, ...)
    screens/        — экраны приложения
    data/           — справочники, шаги, цвета, демо-данные
    hooks/          — useCards (localStorage)
    types/          — TypeScript типы
backend/
  src/
    routes/         — API endpoints
    middleware/     — JWT auth
    config/         — БД, миграции, сиды
    ws/             — WebSocket
```

## Правила

- Язык интерфейса: русский
- Mobile-first: max-width 420px
- Этапы таймлайна: снизу вверх
