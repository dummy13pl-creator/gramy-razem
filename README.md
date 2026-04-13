# 🏟️ GramyRazem — Publikacja: GitHub + Vercel + Neon

Instrukcja krok po kroku jak opublikować aplikację w internecie za darmo.

---

## Czego potrzebujesz

1. **Konto GitHub** — https://github.com (darmowe)
2. **Konto Vercel** — https://vercel.com (darmowe, logowanie przez GitHub)
3. **Konto Neon** — https://neon.tech (darmowe, 0.5 GB bazy danych)
4. **Node.js 18+** zainstalowany lokalnie — https://nodejs.org

---

## KROK 1: Przygotuj bazę danych (Neon)

### 1.1 Utwórz projekt w Neon

1. Zaloguj się na https://console.neon.tech
2. Kliknij **New Project**
3. Nazwa projektu: `gramy-razem`
4. Region: `eu-central-1` (Frankfurt — najbliżej Polski)
5. Kliknij **Create Project**
6. **Skopiuj connection string** — wygląda tak:
   ```
   postgresql://user:haslo@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   Zapisz go — będzie potrzebny w kroku 3.

### 1.2 Utwórz tabele

Otwórz **SQL Editor** w dashboardzie Neon. Uruchom **każde zapytanie osobno** (kliknij Run po każdym):

**Zapytanie 1:**
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

**Zapytanie 2:**
```sql
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Zapytanie 3:**
```sql
CREATE TABLE events (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  date        TEXT NOT NULL,
  time        TEXT NOT NULL,
  location    TEXT NOT NULL,
  capacity    INTEGER NOT NULL CHECK(capacity > 0),
  created_by  INTEGER NOT NULL REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Zapytanie 4:**
```sql
CREATE TABLE registrations (
  id          SERIAL PRIMARY KEY,
  event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);
```

**Zapytanie 5:**
```sql
CREATE TABLE invite_codes (
  id          SERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  used_by     INTEGER REFERENCES users(id),
  created_by  INTEGER NOT NULL REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at     TIMESTAMP
);
```

**Zapytanie 6 — utwórz konto administratora:**
```sql
INSERT INTO users (name, email, password, role)
VALUES (
  'Twoje Imię',
  'twoj@email.pl',
  crypt('TwojeHaslo123', gen_salt('bf', 10)),
  'admin'
);
```
Zmień imię, email i hasło na swoje.

---

## KROK 2: Wrzuć kod na GitHub

### 2.1 Utwórz repozytorium

1. Wejdź na https://github.com/new
2. Nazwa repozytorium: `gramy-razem`
3. Ustaw jako **Private** (prywatne)
4. Kliknij **Create repository**

### 2.2 Wyślij kod

Otwórz terminal w folderze projektu i uruchom:

```bash
git init
git add .
git commit -m "GramyRazem v2.0 — Vercel + Neon"
git branch -M main
git remote add origin https://github.com/TWOJ-LOGIN/gramy-razem.git
git push -u origin main
```

Zamień `TWOJ-LOGIN` na swoją nazwę użytkownika GitHub.

---

## KROK 3: Opublikuj na Vercel

### 3.1 Połącz z GitHub

1. Zaloguj się na https://vercel.com (przez konto GitHub)
2. Kliknij **Add New → Project**
3. Znajdź repozytorium `gramy-razem` i kliknij **Import**

### 3.2 Skonfiguruj projekt

Na stronie konfiguracji ustaw:

- **Framework Preset:** `Vite`
- **Root Directory:** `.` (domyślne, nie zmieniaj)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### 3.3 Dodaj zmienne środowiskowe

W sekcji **Environment Variables** dodaj dwie zmienne:

| Klucz          | Wartość                                                        |
|----------------|----------------------------------------------------------------|
| `DATABASE_URL` | `postgresql://user:haslo@ep-xxx.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET`   | (losowy ciąg — wygeneruj poniższą komendą)                     |

Jak wygenerować `JWT_SECRET` — uruchom w terminalu:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Skopiuj wynik i wklej jako wartość.

### 3.4 Publikuj

Kliknij **Deploy** i poczekaj ~1-2 minuty.

Po zakończeniu Vercel poda adres aplikacji, np.:
```
https://gramy-razem.vercel.app
```

---

## KROK 4: Gotowe!

1. Otwórz adres podany przez Vercel
2. Zaloguj się emailem i hasłem, które podałeś w kroku 1.6
3. Wejdź w **Panel administracyjny → Kody zaproszeń**
4. Wygeneruj kody i przekaż je pracownikom
5. Pracownicy rejestrują się podając kod na stronie logowania

---

## Aktualizacja aplikacji

Każda zmiana wypchnięta na GitHub automatycznie zaktualizuje aplikację na Vercel:

```bash
git add .
git commit -m "Opis zmian"
git push
```

Vercel wykryje push i automatycznie zbuduje nową wersję (~1 min).

---

## Rozwiązywanie problemów

### „Nieprawidłowy email lub hasło"
Sprawdź w Neon SQL Editor czy użytkownik istnieje:
```sql
SELECT id, name, email, role FROM users;
```

### „Brak zmiennej DATABASE_URL"
Sprawdź zmienne środowiskowe w Vercel:
Dashboard → Settings → Environment Variables

### Strona się ładuje ale API nie działa
Sprawdź logi w Vercel: Dashboard → Deployments → ostatni → Logs

### Chcę dodać kolejnego admina ręcznie
W Neon SQL Editor:
```sql
INSERT INTO users (name, email, password, role)
VALUES ('Imię', 'email@firma.pl', crypt('haslo123', gen_salt('bf', 10)), 'admin');
```

### Chcę zresetować hasło użytkownika
```sql
UPDATE users SET password = crypt('nowehaslo123', gen_salt('bf', 10))
WHERE email = 'email@firma.pl';
```

---

## Koszty

Wszystko jest **darmowe** w ramach free tier:

| Serwis | Darmowy limit                    |
|--------|----------------------------------|
| Neon   | 0.5 GB bazy, 190h aktywności/mies.|
| Vercel | 100 GB transferu, bez limitu wdrożeń |
| GitHub | Bez limitu prywatnych repozytoriów    |

Dla małej firmy (do ~50 użytkowników) te limity w zupełności wystarczą.

---

## Struktura projektu

```
gramy-razem/
├── api/                          # Serverless API (Vercel Functions)
│   ├── _lib/helpers.js           # Wspólne: DB, JWT, auth
│   ├── auth/
│   │   ├── [action].js           # POST /api/auth/login, /register
│   │   └── me.js                 # GET /api/auth/me
│   ├── events/
│   │   ├── index.js              # GET/POST /api/events
│   │   └── [id]/
│   │       ├── index.js          # GET/PUT/DELETE /api/events/:id
│   │       └── register.js       # POST/DELETE /api/events/:id/register
│   └── admin/
│       ├── users/
│       │   ├── index.js          # GET /api/admin/users
│       │   └── [id]/
│       │       ├── index.js      # DELETE /api/admin/users/:id
│       │       └── role.js       # PATCH /api/admin/users/:id/role
│       └── invite-codes/
│           ├── index.js          # GET/POST /api/admin/invite-codes
│           └── [id].js           # DELETE /api/admin/invite-codes/:id
├── src/                          # Frontend React
├── vercel.json                   # Konfiguracja Vercel
└── package.json
```
