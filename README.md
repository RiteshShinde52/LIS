# LIS Master Data & Report Designer

A front-end implementation of a configurable LIS administration module with:

- Master data management (tests, formulas, panels, doctors, departments, inventory)
- Report template settings (header/footer/signatures/logo/start line)
- Feature toggle settings
- Professional diagnostic style report preview with abnormal highlighting and QR verification
- Print/PDF-friendly A4 layout and responsive mobile preview

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.
# Mobile LIS (Android, Offline-first)

A professional **Laboratory Information System (LIS)** mobile app skeleton built in **Kotlin + Jetpack Compose** for hospital laboratory workflows.

## Features implemented

1. **Login System**
   - Role-based login (Admin, Technician, Doctor-view oriented).
   - Optional OTP login field.
   - Session timeout object model.

2. **Patient Registration**
   - Auto-generated patient ID (`PAT-XXXXXXXX`).
   - Name, age, sex, phone, address, referring doctor, date.

3. **Department-based Tests**
   - Hematology: CBC, ESR, Hemoglobin, Peripheral smear.
   - Biochemistry: Blood glucose, LFT, KFT, Lipid profile, Uric acid.
   - Serology: Widal, CRP, RA factor, Dengue.
   - Hormones: T3, T4, TSH, HbA1c.
   - Coagulation: PT, INR.
   - Multi-select test ordering.

4. **Result Entry Foundation**
   - Structured `TestOrder` entity with test, result, normal range, units, abnormal flag.
   - Dynamic normal-range helper by sex and age.

5. **Automatic Calculations**
   - MCV, MCH, MCHC formulas implemented in `CalculationEngine`.

6. **Morphology Interpretation**
   - Normocytic normochromic, microcytic hypochromic, macrocytic anemia.

7. **AI Interpretation Rules**
   - Hepatitis-like pattern and kidney dysfunction pattern detection.
   - Confidence levels low/medium/high.

8. **PT/INR Interpretation**
   - INR-based interpretation (clotting risk / therapeutic range / bleeding risk).

9. **PDF Report Generation (Service layer stub)**
   - Includes lab logo, patient details, doctor signature, QR verification mention.

10. **WhatsApp Sharing (Service layer)**
   - Generates WhatsApp share link from phone + report id.

11. **Billing System**
   - Bill model with payment method: Cash, UPI, Card.
   - Bill number matches report number.

12. **Patient Search**
   - DAO search by name, phone, or date.

13. **Settings-ready architecture**
   - Clean domain/data/ui separation enables admin settings extension.

14. **Offline DB + Cloud Sync readiness**
   - Room offline database.
   - Optional `CloudSyncManager` stub for backup flow.

15. **Extra Features Foundation**
   - Dark mode via Material3 dynamic theme handling.
   - Critical alerts in analysis engine.
   - Fast single-screen technician workflow.

## Tech stack
- Kotlin
- Jetpack Compose (Material 3)
- Room (offline persistence)
- MVVM architecture

## Run
1. Open in Android Studio (JDK 17).
2. Sync Gradle.
3. Run `app` on Android device/emulator.

## Next production steps
- Add full result-entry screen with validation and real-time abnormal highlighting.
- Generate actual PDF file + QR image.
- Integrate WorkManager for periodic cloud sync.
- Add encrypted local storage + token refresh.
- Add OTP backend integration.
