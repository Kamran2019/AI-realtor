# 11 — Bookmarks and Property Notes

## Feature name

Save listings and add analysis notes.

## Regression check before making changes

Before changing any code for this feature, run the full test suite for all previously completed production-ready features:

```bash
npm run test
npm run test:backend
npm run test:frontend
```

If any existing test fails, stop and fix that regression first. Do not add this feature on top of a broken build.


## Objective

Allow users to bookmark properties and maintain notes on property listings.

## Scope of work

Bookmarks and notes only. No alerts/reports.

## Files/folders to create

```text
backend/src/models/PropertyBookmark.js
backend/src/models/PropertyNote.js
backend/src/validators/bookmarkNote.validator.js
backend/src/controllers/bookmark.controller.js
backend/src/controllers/propertyNote.controller.js
backend/src/services/bookmark.service.js
backend/src/services/propertyNote.service.js
backend/src/routes/bookmark.routes.js
backend/src/routes/propertyNote.routes.js
backend/src/tests/bookmarks-notes.test.js
frontend/src/components/properties/BookmarkButton.jsx
frontend/src/components/properties/PropertyNotes.jsx
frontend/src/services/bookmarkApi.js
frontend/src/services/propertyNoteApi.js
```

## Files/folders to modify

```text
backend/src/routes/index.js
frontend/src/pages/properties/PropertyListPage.jsx
frontend/src/pages/properties/PropertyDetailPage.jsx
```

## Backend implementation instructions

Create PropertyBookmark unique userId+propertyId. Create PropertyNote with userId, propertyId, text. Implement toggle/list bookmarks and CRUD notes. Note owner or admin/sub_admin can update/delete.

## Frontend implementation instructions

Add bookmark button to cards/detail. Add notes panel to detail with list/add/edit/delete.

## Database/model changes

Create PropertyBookmark and PropertyNote collections.

## API routes

| POST | `/api/bookmarks/:propertyId/toggle` | Authenticated | Toggle |
| GET | `/api/bookmarks` | Authenticated | List |
| GET | `/api/properties/:propertyId/notes` | Authenticated | List notes |
| POST | `/api/properties/:propertyId/notes` | Authenticated | Create note |
| PATCH | `/api/notes/:id` | Owner/admin/sub_admin | Update |
| DELETE | `/api/notes/:id` | Owner/admin/sub_admin | Delete |

## Controllers/services/middlewares required

bookmark controller/service, note controller/service

## Validation rules

ObjectIds valid; note text 1–3000 after trim.

## Security requirements

Auth required; property access checked; users cannot edit others' notes unless admin/sub_admin.

## Error handling requirements

Not found 404; forbidden 403; duplicate bookmark race handled gracefully.

## Test cases to write

1. Toggle bookmark add/remove.
2. Unique bookmark.
3. List own bookmarks.
4. Create note.
5. Edit own note.
6. User cannot edit others.
7. Admin can edit.
8. Empty note 400.

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

Users can shortlist and annotate properties.

## What the user/developer should see after running the app

Bookmark state changes and notes appear on property detail.

## Regression check instructions to ensure previous features are not broken

Scoring and property dashboard tests pass.

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

