# M-CARE — Updated Twi / Symptom Review / Notifications Setup

## What was updated

- Expo frontend API defaults to the forwarded backend tunnel:
  `https://p2hztfsz-5000.uks1.devtunnels.ms/api`
- Multipart upload no longer manually sets the multipart Content-Type boundary.
- Report Symptoms now submits to the backend instead of simulating submission.
- Optional symptom photos are stored privately in Supabase Storage.
- Patient symptom review history shows status, AI assessment, clinician feedback, review date, and signed photo URLs.
- Doctor Symptom Reviews screen lists pending reports from assigned mothers and lets the doctor submit clinical feedback.
- Doctor review creates an in-app notification and attempts an Expo push notification.
- Expo push tokens are registered after authentication.
- The supplied `M-CARE_Twi_Knowledge_Base.pdf` is included and converted to `backend/kb-content/mcare-twi-pdf-kb.json` (120 chunks).
- KB ingestion defaults to the supplied PDF-derived knowledge base.
- Twi TalkingHead avatar speaks the TTS response and performs Twi viseme lip-sync.

## 1. Supabase

1. Create a **private** Storage bucket named `symptom-images`.
2. Run `backend/database/mcare_symptom_review_migration.sql` in Supabase SQL Editor.
3. Assign patients to doctors, for example:

```sql
UPDATE public.users
SET doctor_id = 'DOCTOR_UUID'
WHERE id = 'PATIENT_UUID';
```

The backend uses the Supabase service-role client for server-side access, so keep the service-role key on the backend only.

## 2. Backend environment

Copy `.env.example` / `backend/.env.example` and provide real credentials in the local backend environment. Never commit real secrets.

Important variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `GROQ_API_KEY`
- `GHANA_API_KEY`
- `TAVUS_API_KEY`, `TAVUS_PERSONA_ID`, `TAVUS_REPLICA_ID` as required for English/Tavus features
- `ML_SERVICE_URL=http://localhost:8000`
- `KB_INGEST_TOKEN` if configured

The current forwarded backend URL is already set as the frontend development fallback. If the Dev Tunnel URL changes, replace it in `.env` using:

`EXPO_PUBLIC_DEV_API_URL=https://NEW-TUNNEL/api`

## 3. Install dependencies

Frontend:

```bash
npm install
npx expo install expo-notifications
```

Backend:

```bash
cd backend
npm install
```

## 4. Start ML service

```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 5. Ingest the supplied PDF knowledge base

With the ML service running:

```bash
cd backend
npm run ingest:kb -- --replace
```

The command now defaults to:

`backend/kb-content/mcare-twi-pdf-kb.json`

Verify the service:

`http://localhost:8000/kb/status`

## 6. Start backend

```bash
cd backend
npm run dev
```

The backend listens on port 5000.

## 7. Start Expo

```bash
npx expo start -c
```

Keep the frontend on 8081. The frontend calls the backend through the port-5000 Dev Tunnel.

## 8. Push notifications

Remote push notifications require a physical device and an Expo/EAS project ID. Configure an EAS project before testing push notifications. After a successful login, the app requests permission, obtains the Expo push token, and registers it with the backend.

The notification flow is:

Patient submits symptom -> doctor reviews -> backend saves clinician feedback -> in-app notification is inserted -> Expo push is sent -> patient opens Report Symptoms and sees feedback.

## 9. Current external-service limitation

The application code cannot manufacture valid third-party credentials. The GhanaNLP/Khaya ASR subscription key must be active and authorized for the ASR API version your subscription provides. If the provider returns HTTP 401, voice transcription remains unavailable until that credential/subscription issue is fixed.

Likewise, Tavus, Groq, Supabase, and push notification functionality require valid credentials/configuration.
