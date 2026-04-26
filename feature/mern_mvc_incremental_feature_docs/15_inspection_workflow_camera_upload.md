# 15 — Inspection Workflow and Camera Upload

## Feature name

Mobile inspection workflow, rooms, camera capture, image uploads.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Build the core snagging inspection workflow before AI detection.

## Scope of work

Inspection CRUD, rooms, uploads, status transitions. No AI detection or inspection PDF yet.

## Files/folders to create

```text
backend/src/models/Inspection.js
backend/src/validators/inspection.validator.js
backend/src/controllers/inspection.controller.js
backend/src/services/inspection.service.js
backend/src/services/storage.service.js
backend/src/routes/inspection.routes.js
backend/src/tests/inspection-workflow.test.js
frontend/src/pages/inspections/InspectionListPage.jsx
frontend/src/pages/inspections/InspectionCreatePage.jsx
frontend/src/pages/inspections/InspectionDetailPage.jsx
frontend/src/components/inspections/RoomCapturePanel.jsx
frontend/src/components/inspections/CameraCapture.jsx
frontend/src/services/inspectionApi.js
```

## Files/folders to modify

```text
backend/src/routes/index.js
frontend/src/routes/AppRoutes.jsx
frontend/src/components/Layout.jsx
```

## Backend implementation instructions

Create Inspection model with ownerUserId, createdByUserId, assignedToUserId, status, propertyRef, client, geo, summary, rooms, recommendations, report. Implement CRUD, add/update room, image upload jpg/png/webp <=10MB, status transitions. Access: admin/sub_admin all owner inspections; user created/assigned only.

## Frontend implementation instructions

Add inspection list/create/detail. Implement mobile camera via file input `accept=image/*` and `capture=environment`. Add room upload/progress.

## Database/model changes

Create Inspection collection.

## API routes

| GET/POST | `/api/inspections` | Authenticated | List/create |
| GET/PATCH | `/api/inspections/:id` | Authenticated | Detail/update |
| POST | `/api/inspections/:id/rooms` | Authenticated | Add room |
| PATCH | `/api/inspections/:id/rooms/:roomId` | Authenticated | Update room |
| POST | `/api/inspections/:id/rooms/:roomId/images` | Authenticated | Upload image |
| PATCH | `/api/inspections/:id/status` | Authenticated | Status |

## Controllers/services/middlewares required

inspection controller/service, storage service, multer upload

## Validation rules

address required if no propertyId; room name 1–80; notes <=3000; image jpg/png/webp <=10MB; valid status transitions only.

## Security requirements

Auth required; access checked every route; only admin/sub_admin can assign; server-generated filenames.

## Error handling requirements

Invalid image 400; storage failure 500; invalid transition 400; inaccessible 403/404.

## Test cases to write

1. Create inspection.
2. Admin assigns.
3. User cannot assign others.
4. Assigned user can view.
5. Unrelated user blocked.
6. Add room.
7. Upload valid image.
8. Invalid MIME rejected.
9. Status transitions enforced.

## Commands to run tests

```bash
npm run test
npm run test:backend
npm run test:frontend
```

## Commands to run the complete app

```bash
npm run dev
```

For production verification where applicable:

```bash
npm run build
npm run start
```

## Expected result after implementation

Users can create mobile inspections and upload room photos.

## What the user/developer should see after running the app

Inspection pages work and mobile capture opens camera/file picker.

## Regression check instructions to ensure previous features are not broken

Property reports and all previous tests pass.

## Final checklist

- [ ] Previous tests passed before implementation
- [ ] Required files/folders created
- [ ] Required files/folders modified
- [ ] Backend implementation completed
- [ ] Frontend implementation completed where applicable
- [ ] Database/model changes completed where applicable
- [ ] API routes implemented where applicable
- [ ] Controllers/services/middlewares implemented
- [ ] Validation rules implemented exactly
- [ ] Security requirements implemented exactly
- [ ] Error handling implemented exactly
- [ ] New tests added
- [ ] New tests passed
- [ ] Full test suite passed after implementation
- [ ] Backend runs successfully
- [ ] Frontend runs successfully
- [ ] Feature works manually
- [ ] No previous production-ready feature is broken

