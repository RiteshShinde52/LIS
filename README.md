# LIS Mobile Workflow Prototype

This repository contains a mobile-friendly, offline-first LIS workflow web app prototype tailored for Android technician use.

## Run

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Included workflow modules

- Role-based login (Admin / Technician / Doctor) with optional OTP input and session timeout.
- Patient registration with auto-generated patient ID.
- Doctor/hospital database selection.
- Test panel loading and department-like test structure.
- Technician result entry with abnormal highlighting, H/L flags, keyboard shortcuts, Enter navigation, auto-next focus.
- Previous result comparison in entry table.
- CBC auto-calculation + morphology interpretation.
- Critical value alerts.
- Comments/notes area.
- Patient timeline history and report reprint in read-only mode.
- Trend graph visualization for key tests.
- Admin export actions (CSV/Excel/PDF).
- Smart dashboard cards.
- Feature toggle settings and optional Supabase sync toggle.

Data is persisted in browser localStorage for offline-first behavior.
