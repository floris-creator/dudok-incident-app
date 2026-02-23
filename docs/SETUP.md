# Horeca AI Incident Systeem - Setup Checklist

## 1. Supabase project

1. Maak een nieuw Supabase project op [supabase.com](https://supabase.com)
2. Ga naar **Project Settings** -> **API** en noteer:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key -> `SUPABASE_SERVICE_ROLE_KEY`

## 2. Database migratie uitvoeren

1. Ga naar **SQL Editor** in Supabase
2. Open `supabase/migrations/20260221120000_incident_system.sql`
3. Kopieer de volledige inhoud en klik **Run**

## 3. Environment variabelen

1. Kopieer `.env.local.example` naar `.env.local`
2. Vul alle variabelen:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=Horeca AI <noreply@jouwdomein.nl>
INCIDENT_ALERT_RECIPIENTS=teamlead@bedrijf.nl,veiligheid@bedrijf.nl
```

## 4. Manager-account aanmaken (1 account)

1. Supabase -> **Authentication** -> **Users** -> **Add user**
2. Maak gebruiker aan met email + wachtwoord
3. Kopieer de `User UID`
4. Voer in **SQL Editor** uit:

```sql
UPDATE public.profiles
SET role = 'manager'
WHERE id = 'USER_UUID_HIER';
```

5. Verifieer:
   - Log in via `/manager/login`
   - Je wordt doorgestuurd naar `/manager/incidents`

## 5. Applicatie starten

```bash
npm install
npm run dev
```

Test daarna:
1. `/report` -> incident insturen
2. `/manager/incidents` -> status/risico aanpassen
3. `/manager/notifications` -> notificaties markeren als gelezen
