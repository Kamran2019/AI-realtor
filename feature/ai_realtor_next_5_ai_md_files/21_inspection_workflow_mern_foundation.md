# 21 — MERN Inspection Workflow Foundation

## Feature name

Inspection workflow foundation in the existing MERN/MVC app.

## Regression check before making changes

Before touching this feature, run all existing tests from the already-completed MERN/MVC features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

Also manually verify these existing flows still work:

```text
- health check
- signup
- login
- refresh/logout/me
- email verification/reset password
- admin/sub_admin/user RBAC
- user management
- billing page/API
- scrape source CRUD
- scraper run pipeline
- property list/detail
- deal scoring
- bookmarks and notes
- alerts and notifications
- legal pack/risk detection
- property CSV/PDF reports
- admin dashboard/audit logs
```

If any existing test or manual flow fails, stop and fix the regression first. Do not implement the new feature on top of a broken build.


## Objective

Add the missing inspection workflow to the existing MERN app before adding any AI model logic. This gives the AI model a proper place to read inspection images from and save detected defects.

## Scope of work

Implement the inspection module inside the existing MERN app only.

This file must create:

```text
- Inspection model
- inspection CRUD
- room-by-room workflow
- image upload/capture
- manual defect add/edit/delete
- inspection access rules
- frontend inspection pages
```

Do **not** create the Python AI microservice in this file.  
Do **not** call YOLO or any external model in this file.  
Do **not** create AI model training files in this file.

## Correct folder structure

The agent must use this exact folder placement.

```text
project-root/
  backend/
    src/
      models/
        Inspection.js
      validators/
        inspection.validator.js
      controllers/
        inspection.controller.js
      services/
        inspection.service.js
        storage.service.js
      routes/
        inspection.routes.js
      middlewares/
        upload.middleware.js
      tests/
        inspection-workflow.test.js

  frontend/
    src/
      pages/
        inspections/
          InspectionListPage.jsx
          InspectionCreatePage.jsx
          InspectionDetailPage.jsx
      components/
        inspections/
          CameraCapture.jsx
          RoomCapturePanel.jsx
          ManualDefectForm.jsx
          DefectList.jsx
      services/
        inspectionApi.js
```

Do not create these files under `ai-service/`.  
Do not create inspection backend files under `frontend/`.  
Do not create inspection frontend files under `backend/`.

## Files/folders to create

```text
backend/src/models/Inspection.js
backend/src/validators/inspection.validator.js
backend/src/controllers/inspection.controller.js
backend/src/services/inspection.service.js
backend/src/services/storage.service.js
backend/src/routes/inspection.routes.js
backend/src/middlewares/upload.middleware.js
backend/src/tests/inspection-workflow.test.js
frontend/src/pages/inspections/InspectionListPage.jsx
frontend/src/pages/inspections/InspectionCreatePage.jsx
frontend/src/pages/inspections/InspectionDetailPage.jsx
frontend/src/components/inspections/CameraCapture.jsx
frontend/src/components/inspections/RoomCapturePanel.jsx
frontend/src/components/inspections/ManualDefectForm.jsx
frontend/src/components/inspections/DefectList.jsx
frontend/src/services/inspectionApi.js
```

## Files/folders to modify

```text
backend/src/routes/index.js
backend/src/app.js
frontend/src/routes/AppRoutes.jsx
frontend/src/components/Layout.jsx
frontend/src/services/apiClient.js
```

## Backend implementation instructions

### 1. Create `Inspection.js`

Create Mongoose model with nested rooms and defects.

Defect fields:

```text
type: crack | damp | mould | poor_finish | structural_issue | peeling_paint | water_seepage | stain | wall_hole | tile_damage | manual_other
source: manual | ai_stub | ai_microservice
severity: low | medium | high
confidence: number between 0 and 1 or null
notes: max 3000 chars
imageUrl: string
box: x, y, w, h
modelVersion: string
reviewedByUserId: User ObjectId or null
reviewedAt: Date or null
```

Inspection fields:

```text
ownerUserId: User ObjectId, required, indexed
createdByUserId: User ObjectId, required, indexed
assignedToUserId: User ObjectId, optional, indexed
status: draft | in_progress | completed | archived
propertyRef.propertyId: optional Property ObjectId
propertyRef.address
propertyRef.postcode
client.name
client.email
client.phone
capturedAt
geo.lat
geo.lng
summary.totalDefects
summary.high
summary.medium
summary.low
summary.notes
rooms[].name
rooms[].notes
rooms[].mediaUrls[]
rooms[].defects[]
recommendations[]
report.lastGeneratedAt
report.latestReportId
```

Add useful indexes:

```text
ownerUserId + status + createdAt
ownerUserId + assignedToUserId + status
ownerUserId + createdByUserId + createdAt
propertyRef.propertyId
```

### 2. Implement access rules

Use existing `auth.middleware.js` and `rbac.middleware.js`.

Rules:

```text
admin:
- can view/create/update/delete/archive all inspections in their account scope

sub_admin:
- can view/create/update all inspections in their account scope
- can assign inspections to users
- cannot permanently delete

user:
- can create inspections
- can view inspections created by them
- can view inspections assigned to them
- can update rooms/images/manual defects only for inspections created by or assigned to them
- cannot assign inspection to another user
```

Because the app has no Team model, use `ownerUserId` as the account scope.

### 3. Implement status transitions

Allowed transitions:

```text
draft -> in_progress
draft -> archived
in_progress -> completed
in_progress -> archived
completed -> archived
```

Reject all other transitions with `400`.

### 4. Implement storage service

Create `backend/src/services/storage.service.js`.

For development:

```text
backend/uploads/inspections/
```

Store uploaded files there.

Return a public relative URL:

```text
/uploads/inspections/<filename>
```

Mount static serving in `backend/src/app.js`:

```js
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
```

Use this only for development/local. Keep service abstraction so S3 can be added later.

### 5. Implement upload middleware

Create `upload.middleware.js` using `multer`.

Allowed MIME types:

```text
image/jpeg
image/png
image/webp
```

Max file size:

```text
10MB
```

Generate server-side filename:

```text
inspection_<inspectionId>_<timestamp>_<random>.<ext>
```

Do not trust original filename.

### 6. Implement controller/service methods

Required service methods:

```text
createInspection
listInspections
getInspectionById
updateInspection
addRoom
updateRoom
uploadRoomImage
addManualDefect
updateDefect
deleteDefect
changeInspectionStatus
recalculateInspectionSummary
```

`recalculateInspectionSummary` must count:

```text
totalDefects
high
medium
low
```

### 7. API routes

Mount under:

```text
/api/inspections
```

Routes:

```text
GET    /api/inspections
POST   /api/inspections
GET    /api/inspections/:id
PATCH  /api/inspections/:id
POST   /api/inspections/:id/rooms
PATCH  /api/inspections/:id/rooms/:roomId
POST   /api/inspections/:id/rooms/:roomId/images
POST   /api/inspections/:id/rooms/:roomId/defects
PATCH  /api/inspections/:id/rooms/:roomId/defects/:defectId
DELETE /api/inspections/:id/rooms/:roomId/defects/:defectId
PATCH  /api/inspections/:id/status
```

## Frontend implementation instructions

### 1. Add routes

Add:

```text
/inspections
/inspections/create
/inspections/:id
```

### 2. Inspection list page

Display:

```text
- status
- property address/postcode
- assigned user if available
- total defects
- createdAt
- action to open detail
```

Filters:

```text
status
created date
search by address/postcode
```

### 3. Inspection create page

Fields:

```text
property address
postcode
optional linked propertyId
client name
client email
client phone
assignedToUserId only for admin/sub_admin
```

### 4. Inspection detail page

Display:

```text
status
property info
client info
rooms
images
manual defects
summary counts
```

Actions:

```text
add room
upload/capture image
add manual defect
edit defect severity/notes
delete defect
change status
```

### 5. Camera capture

Use this reliable mobile-first input first:

```jsx
<input type="file" accept="image/*" capture="environment" />
```

Do not require `getUserMedia` for MVP. It can be optional later.

## Database/model changes

Create:

```text
Inspection
```

No AI model collection yet.

## API routes

```text
GET    /api/inspections
POST   /api/inspections
GET    /api/inspections/:id
PATCH  /api/inspections/:id
POST   /api/inspections/:id/rooms
PATCH  /api/inspections/:id/rooms/:roomId
POST   /api/inspections/:id/rooms/:roomId/images
POST   /api/inspections/:id/rooms/:roomId/defects
PATCH  /api/inspections/:id/rooms/:roomId/defects/:defectId
DELETE /api/inspections/:id/rooms/:roomId/defects/:defectId
PATCH  /api/inspections/:id/status
```

## Controllers/services/middlewares required

```text
Inspection.js
inspection.validator.js
inspection.controller.js
inspection.service.js
storage.service.js
inspection.routes.js
upload.middleware.js
```

## Validation rules

Inspection create:

```text
propertyRef.address required if propertyId is not supplied
propertyRef.postcode max 12 chars
client.email optional valid email
client.phone optional max 30 chars
assignedToUserId optional valid ObjectId
```

Room:

```text
name required
name 1–80 chars
notes max 3000 chars
```

Manual defect:

```text
type required and must be allowed enum
severity required: low/medium/high
notes max 3000 chars
box fields optional numbers
```

Image upload:

```text
jpg/png/webp only
max 10MB
```

Status:

```text
must follow allowed transition map
```

## Security requirements

```text
- All routes require authentication.
- Access check must run before reading/updating inspection.
- Users cannot access unrelated inspections.
- Users cannot assign inspections to other users.
- Uploaded filenames must be generated server-side.
- Do not store raw local filesystem path in MongoDB.
- Do not allow SVG upload.
- Do not allow executable files.
```

## Error handling requirements

```text
- Invalid ObjectId returns 400.
- Inspection not found returns 404.
- Forbidden access returns 403.
- Invalid image type returns 400.
- Oversized image returns 400.
- Invalid status transition returns 400.
- Storage failure returns 500.
```

## Test cases to write

```text
1. admin can create inspection
2. sub_admin can create inspection
3. user can create inspection
4. user cannot assign inspection to another user
5. admin can assign inspection
6. user can see created inspection
7. assigned user can see assigned inspection
8. unrelated user cannot see inspection
9. add room works
10. update room works
11. upload valid image works
12. invalid image MIME rejected
13. oversized image rejected
14. add manual defect works
15. update manual defect works
16. delete manual defect works
17. summary counts update after add/update/delete defect
18. valid status transition works
19. invalid status transition rejected
20. list filters by status
```

## Commands to run tests

```bash
npm run test
npm run test:backend
npm run test:frontend
```

## Commands to run complete app

```bash
npm run dev
```

## Expected result after implementation

The existing MERN app now has a complete inspection workflow with image upload and manual defect tracking, ready for AI detection integration.

## What the user/developer should see

```text
- A new Inspections menu item
- Inspection list page
- Create inspection form
- Inspection detail page
- Add room button
- Upload/capture image button
- Manual defect add/edit/delete
- Summary defect counts
```

## Regression check instructions

After implementation:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

Manually verify:

```text
- login still works
- property dashboard still works
- property reports still work
- alerts still work
- admin dashboard still works
- new inspection pages work
```

## Final checklist

- [x] Previous tests passed before implementation
- [x] Correct folders used exactly as defined in this file
- [x] No files created in the wrong app/folder
- [x] Required backend files created/modified
- [x] Required frontend files created/modified
- [x] Required AI service files created/modified where applicable (N/A: AI service intentionally not part of this feature)
- [x] Database/model changes completed where applicable
- [x] API routes implemented and mounted
- [x] Controllers/services/middlewares implemented
- [x] Validation rules implemented exactly
- [x] Security requirements implemented exactly
- [x] Error handling implemented exactly
- [x] New backend tests added
- [x] New frontend tests added where applicable
- [x] AI service tests added where applicable (N/A: AI service intentionally not part of this feature)
- [x] New tests passed
- [x] Full existing test suite passed after implementation
- [x] Backend runs successfully
- [x] Frontend runs successfully
- [x] AI microservice runs successfully where applicable (N/A: AI service intentionally not part of this feature)
- [x] Feature works manually
- [x] No previous production-ready feature is broken
