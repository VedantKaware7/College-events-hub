# College-Events-hub REST API

Base URL: `http://localhost:8080/api` (Docker), `http://localhost:5000/api` (Node), or `https://college-events-hub-api2.onrender.com/api` (production on Render).

Roles: `student`, `faculty` (event coordinator), `admin`. 👑 = admin only; 🎓 = admin or faculty (faculty only for events they organise).

Protected routes need the header `Authorization: Bearer <token>`. Errors return `{ "message": "..." }` with a 4xx or 5xx status.

---

## Health

### `GET /health`
```json
{ "status": "ok", "db": "connected", "uptime": 132, "version": "a1b2c3d" }
```
Returns `503` with `"status": "degraded"` when MongoDB is unreachable.

---

## Auth

### `POST /auth/signup`
```json
{ "name": "Sneha Deshmukh", "email": "sneha@college.edu", "password": "secret12" }
```
`201` → `{ "message": "Verification code sent to your email", "email": "sneha@college.edu" }`

### `POST /auth/verify-otp`
```json
{ "email": "sneha@college.edu", "otp": "482913" }
```
`200` → session object:
```json
{ "_id": "…", "name": "Sneha Deshmukh", "email": "sneha@college.edu", "role": "student", "token": "eyJhbGci…" }
```

### `POST /auth/signin`
```json
{ "email": "admin@college.edu", "password": "password123" }
```
- `200` → session object (same shape as above)
- `200` → `{ "mfaRequired": true, "mfaToken": "…", "email": "…" }` when the account has two-factor authentication on. Finish with `POST /auth/mfa/verify`
- `403` → `{ "needsVerification": true, "email": "…" }`. A new OTP is sent
- `429` → too many attempts (20 per 15 min per IP)

### `POST /auth/mfa/verify`
```json
{ "mfaToken": "<from signin>", "code": "123456" }
```
`code` is the 6-digit TOTP from Google / Microsoft Authenticator. `200` → session object; `400` wrong code; `401` expired `mfaToken` (5 min). An `mfaToken` is not a session token: other endpoints reject it with `401`.

### `POST /auth/mfa/setup` 🔒
`200` → `{ "otpauthUrl", "secret", "qrCode" }` (`qrCode` is a PNG data URL to scan). MFA stays off until `/auth/mfa/enable` confirms a code.

### `POST /auth/mfa/enable` 🔒
`{ "code": "123456" }` → `200` `{ "mfaEnabled": true }`, or `400` for a wrong code.

### `GET /auth/me` 🔒
`200` → `{ "_id", "name", "email", "role", "mfaEnabled", "createdAt" }`

---

## Events

### `GET /events`
| Query | Example | Notes |
|---|---|---|
| `category` | `Hackathon` | One of Technical, Cultural, Sports, Workshop, Seminar, Hackathon |
| `club` | `Coding Club` | Exact club name |
| `search` | `docker` | Case-insensitive title match |
| `when` | `upcoming` / `past` | Omit for all |

`200` → array of events:
```json
[{
  "_id": "…",
  "title": "CodeSprint 24-Hour Hackathon",
  "description": "…",
  "date": "2026-09-25T09:00:00.000Z",
  "venue": "Main Computer Lab, Block A",
  "category": "Hackathon",
  "club": "Coding Club",
  "capacity": 120,
  "seatsLeft": 117,
  "entryFee": 200,
  "bannerUrl": "https://…",
  "organizer": { "_id": "…", "name": "Admin", "email": "admin@college.edu" }
}]
```

### `GET /events/filters`
`200` → `{ "categories": ["Technical", …], "clubs": ["Coding Club", "Cultural Committee", …] }`

### `GET /events/:id`
`200` → event object. `404` if not found.

### `POST /events` 🔒👑
```json
{
  "title": "Quiz Night",
  "description": "General knowledge quiz for teams of two.",
  "date": "2026-10-10T13:30:00.000Z",
  "venue": "Seminar Hall 1",
  "category": "Cultural",
  "club": "Quiz Club",
  "capacity": 60,
  "entryFee": 0,
  "bannerUrl": ""
}
```
`201` → created event (`seatsLeft = capacity`).

### `PUT /events/:id` 🔒🎓
`401` without a valid token, `403` for students or for faculty editing someone else's event. Send any subset of the fields above. When `capacity` changes, `seatsLeft` is recalculated. It is rejected if the new capacity is lower than the number of approved registrations.

### `DELETE /events/:id` 🔒🎓
Same access rules as `PUT`. `200` → `{ "message": "Event deleted" }`. The event's registrations are deleted too.

---

## Registrations

### `POST /registrations/otp` 🔒
Sends a 6-digit code to the signed-in student's email. The code is valid for 5 minutes.

### `POST /registrations` 🔒
```json
{ "eventId": "…", "otp": "193847" }
```
`201` → `{ "message": "Registration submitted for approval", "registration": { … "status": "pending" } }`

Errors:
- `400` for an invalid OTP, a past event, a full event, or an existing registration
- `404` when the event is not found

### `GET /registrations/mine` 🔒
`200` → array of registrations with the `event` field populated.

### `DELETE /registrations/:id` 🔒
The owner or an admin can cancel. If the registration was approved, the seat is released.

### `GET /registrations` 🔒👑
Query: `status=pending|approved|cancelled`, `eventId=…`. Populates `student` (name, email) and `event`.

### `PUT /registrations/:id/approve` 🔒👑
```json
{ "feeStatus": "paid" }
```
Atomically takes one seat (`seatsLeft > 0`), marks the registration `approved`, and emails the student.

### `GET /registrations/stats` 🔒👑
```json
{
  "totalEvents": 8,
  "upcomingEvents": 7,
  "pending": 10,
  "approved": 22,
  "cancelled": 8,
  "feesCollected": 2500,
  "eventsByCategory": [{ "category": "Workshop", "count": 2 }]
}
```
