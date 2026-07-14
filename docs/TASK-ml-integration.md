# Задача для фронтенда: интеграция маршрутных листов Smart Cargo ML в CPP-приложение

Прод: <https://cpp-smart-cargo-1.vercel.app>
Репозиторий: <https://github.com/Askenap/CPP-SmartCargo>
Стек: Vite + React 18 + TypeScript, react-router-dom, qrcode.react, hosted on Vercel (Root Directory = `frontend`).

Изменения сегодня вкатили на прод; задача — принять модуль в проектную базу, познакомиться с архитектурой и довести до боевого состояния (пункты в разделе [«Что осталось / open items»](#что-осталось--open-items)).

---

## TL;DR — что появилось в прод-приложении

1. **Параллельный модуль «Маршрутные листы Smart ML»** — отдельная сущность рядом с существующим ЦПП.
2. **Пограничный сценарий по QR (`/ml/:code`)** — пограничник сканирует 6-значный код, видит карточку МЛ из Smart ML и фиксирует «выпустил/отказал».
3. **УВЭД-сценарий (`/uved/*`)** — декларант создаёт МЛ из приложения, получает QR + 6-значный код, отслеживает статус.
4. **Главное меню переработано** — единый список ЦПП и МЛ с типовыми чипами, общая кнопка «+ Создать перевозку» с выбором типа.
5. **Серверный прокси на Vercel Functions** (`/api/ml/*` и `/api/uved/*`) — клиент к Smart ML не ходит напрямую, ключи и CORS прячутся за прокси.

Внешняя система: <https://test-routelist-smartcargo.codecraft.kz> (тест). Прод-инстанс Smart ML — <https://routelist.smartcargo.global>, переключение через env var. Старые адреса на `*.fly.dev` навсегда выключены.
Swagger: <https://test-routelist-smartcargo.codecraft.kz/swagger-ui/index.html>.

---

## Структура каталогов

```
frontend/
  api/                                      ← Vercel serverless functions
    ml/route-sheet/[code].ts                  GET protected by-code (X-API-Key)
    ml/route-sheet/[code]/border-pass.ts      POST border-pass (X-API-Key)
    uved/svh-dictionary.ts                    GET public SVH list
    uved/route-sheets.ts                      POST create (public)
    uved/route-sheets/by-code/[code].ts       GET public by-code
  src/
    data/
      currentUser.ts                        ← мок-пользователь (ИИН + телефон)
      colors.ts (C), borderColors.ts (CB)
    screens/
      ml/                                   ← пограничный сценарий
        MLRouteSheetScreen.tsx              карточка МЛ для пограничника
        api.ts, types.ts, format.ts, demoFixture.ts
      uved/                                 ← УВЭД-сценарий
        UvedCreateWizard.tsx                3-step визард создания
        UvedRouteSheetScreen.tsx            карточка МЛ для УВЭДа
        UvedDemoScreen.tsx                  ← пока стаб
        api.ts, types.ts, status.ts, storage.ts
      MenuScreen.tsx                        ← редизайнен: единый список + chooser
      border/BorderScanModal.tsx            ← добавлено поле ввода 6-значного QR
    main.tsx                                ← маршруты + MobileShell-обёртка (max-width 420)
  vite.config.ts                            ← env loadEnv + плагин mlDevPlugin
  vite-plugin-ml-dev.ts                     ← общий dev-прокси для /api/ml и /api/uved
  vercel.json                               ← SPA-fallback для /ml/*, /uved/*
  .env.example                              ← задокументированы переменные
```

---

## Маршруты приложения

| URL | Что | Где живёт |
|---|---|---|
| `/` | Главное меню, единый список ЦПП + МЛ | `App.tsx` → `MenuScreen.tsx` |
| `/ml/:code` | Карточка МЛ глазами **пограничника** (через прокси с ключом) | `screens/ml/MLRouteSheetScreen.tsx` |
| `/ml/_demo` | Та же карточка на захардкоженной фикстуре | то же |
| `/uved/new` | 3-step визард создания МЛ | `screens/uved/UvedCreateWizard.tsx` |
| `/uved/by-code/:code` | Карточка МЛ глазами **УВЭДа** (через прокси, без ключа) | `screens/uved/UvedRouteSheetScreen.tsx` |
| `/uved/_demo` | Заглушка, нужен пикер фикстур по всем статусам | `screens/uved/UvedDemoScreen.tsx` |

Все `/ml/*` и `/uved/*` обёрнуты в `MobileShell` (max-width 420 центрированно). `App.tsx` сам по себе ограничен 420.

---

## Окружения и секреты (Vercel)

| Переменная | Где читается | Назначение |
|---|---|---|
| `SMARTML_API_KEY` | Vercel Functions `/api/ml/*` | X-API-Key для **пограничных** эндпоинтов Smart ML. Выдаётся командой Smart ML. **В клиент НЕ попадает.** Production + Preview. |
| `SMARTML_API_BASE` | `/api/ml/*`, `/api/uved/*`, Vite dev middleware | Базовый URL Smart ML. Тест — `https://test-routelist-smartcargo.codecraft.kz`. Прод — `https://routelist.smartcargo.global`. |
| `VITE_SMARTML_BASE` | Клиент, ТОЛЬКО для PDF-ссылки | Top-level navigation на `/pdf`, CORS неприменим. Тот же URL. |

Локально: скопировать `frontend/.env.example` → `frontend/.env.local`, подставить значения.

---

## Архитектурные решения и почему

### 1. Серверный прокси к Smart ML, **не** прямой fetch с клиента

- **Пограничный модуль (`/api/ml/*`):** Smart ML requires `X-API-Key`. Ключ нельзя светить в клиентском JS — поднят серверный прокси, ключ читается из `process.env.SMARTML_API_KEY`.
- **УВЭД-модуль (`/api/uved/*`):** хотя эндпоинты публичные (без ключа), CORS на тест-стенде Smart ML отдавал `403 Invalid CORS request` для домена Vercel (только `localhost` в allowlist). Прямой fetch с прод-домена падал с network error. Поэтому **тоже через прокси** — Smart ML видит origin нашего сервера, CORS не триггерится. Если на новом хосте CORS открыт, прокси всё равно оставляем: единая точка конфигурации URL и симметрия с пограничным модулем.

Если команда Smart ML добавит наш домен в CORS-allowlist, можно убрать прокси у УВЭДа (в `api.ts` поменять `BASE` обратно на полный URL) — но сейчас работает надёжно.

### 2. Vercel Functions inline, без shared `_lib`

Изначально была общая `frontend/api/_lib/smartml.ts`, но Vercel падал с `FUNCTION_INVOCATION_FAILED` — папки с префиксом `_` ведут себя странно при разрешении импортов из соседних функций. Перевели логику inline в каждую функцию — стабильно.

### 3. Vite dev middleware дублирует прокси

`frontend/vite-plugin-ml-dev.ts` поднимает все четыре прокси-эндпоинта (`/api/ml/route-sheet/:code`, `/api/ml/route-sheet/:code/border-pass`, `/api/uved/svh-dictionary`, `/api/uved/route-sheets`, `/api/uved/route-sheets/by-code/:code`) в Vite dev server — так `npm run dev` работает без Vercel CLI. Env-переменные читаются из `.env.local` через `loadEnv`.

### 4. UVED не авторизуется в Smart ML, идентификатор МЛ = `lookupCode`

УВЭД нигде не логинится в Smart ML. После создания получает 6-значный `lookupCode` (он же содержимое QR) и `serialNumber` (после ISSUED). Список «моих МЛ» хранится **только на устройстве** — `localStorage['smartml.uved.routeSheets']`, FIFO cap = 50, **без PII** (только публично-видимые поля).

### 5. Главное меню — единый список ЦПП + МЛ

Не отдельные «режимы», а смешанный feed. Карточки различаются:
- цветным чипом «ЦПП» (`C.primary`) / «МЛ» (амбер `#d97706`)
- `borderLeft` подкрашивается по статусу (для МЛ — через `statusMeta(status)` из `screens/uved/status.ts`)

Кнопка «+ Создать перевозку» открывает bottom-sheet с выбором: ЦПП → старый визард, МЛ → `/uved/new`.

Пограничный режим (`appMode = "border"` в `App.tsx`) **не трогали** — это всё ещё отдельная кнопка-вход внизу, выбор роли (часовой / досмотр / админ) тоже остался.

### 6. Авторизация пользователя — мок в одном файле

Боевая часть Smart Cargo имеет учётки с фиксированным ИИН + телефон. Сейчас имитируется через `src/data/currentUser.ts`:

```ts
export const CURRENT_USER = { iinBin: "022041412441", phone: "+77001234567" };
```

В визарде эти два поля рендерятся как `disabled readOnly` с серым фоном и подписью «🔒 из учётной записи». Название компании и ФИО остаются редактируемыми.

**Что заменить:** этот файл целиком, на чтение из реального auth-контекста / SDK. Все потребители (сейчас только `UvedCreateWizard`) автоматически возьмут актуальные данные.

---

## Контракт Smart ML (что используется)

### Пограничные эндпоинты (с `X-API-Key`, через `/api/ml/*`)

- `GET /api/v1/external/route-sheets/by-code/{code}` → карточка МЛ
- `POST /api/v1/external/route-sheets/{code}/border-pass` body `{ passed, inspectorFullName, comment?, passedAt }` → фиксация пересечения поста

### УВЭД-эндпоинты (без auth, через `/api/uved/*`)

- `GET /api/v1/public/svh-dictionary` → список СВХ для выпадашки
- `POST /api/v1/public/route-sheets` body — см. `CreateRouteSheetRequest` в `screens/uved/types.ts` → создание DRAFT
- `GET /api/v1/public/route-sheets/by-code/{code}` → карточка МЛ для УВЭДа (с `dtTdEntries`, `svhAccountingNumber`, `dxtNumber`)
- `GET /api/v1/public/route-sheets/by-code/{code}/pdf` → PDF (доступен только после ISSUED, до — 409). Открывается через `window.open`, CORS не применяется.

Статусы МЛ (полный enum в `screens/uved/types.ts` + цветовая мапа в `screens/uved/status.ts`):

| status | Группа цвета |
|---|---|
| DRAFT | серый |
| ISSUED | синий (активный таймер до `expiresAt`) |
| ARRIVED / SVH_NUMBER_ASSIGNED / DXT_ASSIGNED / DT_TD_FILLED | янтарный |
| COMPLETED / ARRIVED_AT_POST | зелёный (terminal) |
| RELEASE_PARTIAL | янтарно-зелёный (terminal) |
| REJECTED / RELEASE_REJECTED | красный (terminal) |

`isTerminal(status)` останавливает авто-refetch.

---

## Поведение, на которое стоит обратить внимание

- **Mobile-first, max-width 420.** Любые новые экраны должны вписываться в эту ширину или быть обёрнуты в `MobileShell` в `main.tsx`.
- **Все строки в UI на русском.**
- **Время от Smart ML — UTC ISO-8601.** В UI конвертируем в Asia/Almaty через `screens/ml/format.ts` (`fmtAlmaty`, `minutesUntil`). Никаких `toLocaleString` без явной таймзоны.
- **Моноширинный шрифт** для ГРНЗ, VIN, кодов МЛ, ИИН — `ui-monospace, "SF Mono", "JetBrains Mono", ...`.
- **Палитра `C`** — driver-сторона (главное меню, УВЭД-визард, УВЭД-карточка). **Палитра `CB`** — пограничная (border-режим, `/ml/:code`).
- **PII не хранится.** В `localStorage` слим-копия МЛ — `lookupCode`, `serialNumber`, `statusDisplay`, `status`, `destinationName`, `createdAt`, `grnz`, `addedAt`. Никаких телефонов/ИИН/ФИО.

---

## Что осталось / open items

### Обязательные (для боевого запуска УВЭД-флоу)

1. **Подключить реальную авторизацию** — заменить `src/data/currentUser.ts` на чтение из auth-контекста Smart Cargo.
2. **Завершить демо-роут `/uved/_demo`** — пикер фикстур по всем статусам (DRAFT, ISSUED, ARRIVED, SVH_NUMBER_ASSIGNED, DXT_ASSIGNED, DT_TD_FILLED, COMPLETED, RELEASE_PARTIAL, REJECTED, OVERDUE). Сейчас файл-заглушка.
3. **CORS на Smart ML** — попросить добавить наш прод-домен в allowlist (`cpp-smart-cargo-1.vercel.app` или будущий боевой). Это уберёт необходимость в прокси `/api/uved/*` (но не помешает оставить).
4. **Переключение на прод Smart ML** — выставить `SMARTML_API_BASE=https://routelist.smartcargo.global` и `VITE_SMARTML_BASE=https://routelist.smartcargo.global` в Vercel Production env боевого ЦПП. Preview можно оставить на тестовом хосте.
5. **PDF на проде** — проверить, что top-level navigation на прод-эндпоинт PDF работает (CORS на navigation не действует, но имеет смысл сверить headers).
6. **Реальный сканер камеры** — сейчас `BorderScanModal` это ручной ввод 6 цифр в поле + симуляция выбора из списка ЦПП. Подключить камеру (`zxing-js/browser` или `react-qr-reader`), оставить поле как fallback.

### Желательные

7. **Перевести existing CPP-визард ([CreateWizard.tsx](frontend/src/screens/CreateWizard.tsx))** на ту же модель валидации/локированных полей, что и УВЭД-визард — для единообразия.
8. **Toasts** — сейчас успех/ошибка выводятся inline или в alert. Положить лёгкую систему уведомлений.
9. **Идемпотентность POST border-pass** — на стороне Smart ML это уже есть (повторная отметка перезаписывает), но в UI стоит явно отрисовать состояние «уже обработан» с указанием времени и инспектора (частично есть, но можно усилить).
10. **i18n** — пока всё захардкожено на русском, миграция на ключи если будет нужен kk/en.

### Хорошо бы

11. **Удалить мёртвый Backend (`/backend`)** или довести его до состояния, в котором он действительно нужен. Сейчас не подключён, в проде не участвует.
12. **Удалить старый `IMPLEMENTATION.md` и `cpp-redesign.jsx`** — наследие прототипа, проектом уже не используются.
13. **Sentry / прод-телеметрия** — нет.

---

## Как запустить локально

```bash
cd frontend
cp .env.example .env.local        # подставить SMARTML_API_KEY от Smart ML
npm install
npm run dev                       # http://localhost:5173
```

Проверка прокси:
```bash
curl http://localhost:5173/api/uved/svh-dictionary
curl http://localhost:5173/api/ml/route-sheet/055131
```

Демо-роут с фикстурой (без обращений к Smart ML):
<http://localhost:5173/ml/_demo>

---

## Контакты / переписка

- Backend / Smart ML — ключи, CORS, переключение прод-урла: команда Smart ML.
- Текущий проект — `dinaratyulegenova`, репозиторий [github.com/Askenap/CPP-SmartCargo](https://github.com/Askenap/CPP-SmartCargo).

## Лог коммитов сегодня

```
229f8f3  Lock ИИН/БИН and phone fields to current user account in ML wizard
8f5d8d8  Fix UVED prod CORS: route public endpoints through our proxy
1bdd747  UVED carrier view: status hero + sections + auto-refetch + QR/PDF
8d57346  UVED create wizard: 3 steps with live Smart ML POST + QR
845e5ee  Constrain /ml and /uved routes to max-width 420 (mobile-first)
160f01f  Unify ЦПП and МЛ in main menu with create chooser
9f1885d  UVED module scaffolding: types, public API client, storage, routes
702a545  ML view: align styling with BorderCppView
cb1f200  Drop ML proxy diagnostic headers
f9f3600  Diag headers for ML proxy: X-ML-Upstream/Key-Len/Key-Sample
e9e5dad  Configurable Smart ML base URL via SMARTML_API_BASE env
f9129da  Fix Vercel 500: inline ML proxy handlers, drop shared _lib
233bd65  Smart ML route sheet: card view, demo route, 6-digit QR
2ba225a  Smart ML proxy: Vercel functions + Vite dev middleware
```
