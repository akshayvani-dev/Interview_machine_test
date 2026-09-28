# Incident Real-Time Updates

## Overview

The incident real-time system uses:

* **REST API** for incident operations
* **Prisma + PostgreSQL** for storing incident events and notifications
* **Socket.IO** for real-time notification delivery
* **React AuthContext** for managing the socket connection
* **React Query** for refreshing notification data
* **Toast + sound** for immediate user feedback

The database is the source of truth. Socket.IO is only the real-time delivery mechanism.

---

## 1. System Flow

```text
User performs incident action
        |
        v
Incident Controller
        |
        v
createIncidentEvent()
        |
        +---- Create IncidentEvent in DB
        |
        +---- Create Notifications
                    |
                    v
              Notification DB
                    |
                    v
              Socket.IO Server
                    |
                    v
              User Socket Room
                    |
                    v
              React Client
                    |
          +---------+---------+
          |         |         |
          v         v         v
        Toast     Sound    React Query
                           refresh
```

---

# 2. Socket.IO Connection

The frontend connects to Socket.IO using the logged-in user's JWT.

```ts
const socket = io(SOCKET_URL, {
  auth: {
    token,
  },
});
```

The token is sent through:

```text
socket.handshake.auth.token
```

The backend verifies the JWT before accepting the connection.

The authenticated user contains:

```text
userId
orgId
role
```

After authentication, the socket joins the user's personal room:

```text
user:{userId}
```

Example:

```text
user:123
```

This room is used for personal notifications.

---

# 3. Socket Rooms

The backend currently uses these rooms:

```text
user:{userId}
org:{orgId}:admins
org:{orgId}:managers
incident:{incidentId}
```

### User room

Used for notifications.

```text
user:{userId}
```

Only that user receives events sent to the room.

### Organization role rooms

Admins join:

```text
org:{orgId}:admins
```

Managers join:

```text
org:{orgId}:managers
```

These rooms can be used for future organization-level realtime events.

### Incident room

Users can join:

```text
incident:{incidentId}
```

This can be used for future incident-detail realtime updates such as comments or live incident changes.

The incident room should verify that the authenticated user has access to the incident before allowing the join.

---

# 4. AuthContext Controls the Socket

The Socket.IO connection is managed by `AuthContext`.

When a token exists:

```text
JWT exists
   |
   v
connectSocket(token)
```

When the user signs out:

```text
clearAuthToken()
      |
      v
AUTH_CHANGE_EVENT
      |
      v
hasToken = false
      |
      v
disconnectSocket()
```

Therefore individual pages do not need to connect or disconnect the socket.

`AuthContext` owns the socket lifecycle.

---

# 5. Incident Event Creation

When an incident is created or updated, the controller calls:

```ts
createIncidentEvent(...)
```

The event service:

1. Finds the actor.
2. Generates the event title/message.
3. Creates the `IncidentEvent`.
4. Calls the notification service.

Example:

```text
Akshay vani (ADMIN)
changed incident severity
from HIGH to CRITICAL
```

The event service creates:

```text
Title:
Incident severity changed
```

```text
Message:
Akshay vani (ADMIN) changed incident severity from HIGH to CRITICAL
```

---

# 6. Notification Creation

The event service calls:

```ts
createIncidentNotification({
  event,
  orgId,
  actorUserId,
  title,
  message,
});
```

The notification service determines who should receive the notification.

### Incident created

```text
ADMIN
MANAGER
Assigned user, if applicable
```

### Incident assigned

```text
New assignee
```

### Incident updated

```text
ADMIN
MANAGER
Assigned user
```

Recipient IDs are stored in a `Set` so the same user cannot be added twice.

---

# 7. Notification Persistence

Notifications are stored in the database before Socket.IO delivery.

Example:

```text
Notification
------------------------------
userId
incidentId
incidentEventId
type
title
message
readAt
createdAt
```

There is also a unique constraint:

```prisma
@@unique([incidentEventId, userId])
```

This prevents the same event from creating duplicate notifications for the same user.

---

# 8. Socket Notification Delivery

After notifications are stored, the backend sends realtime events.

It uses the recipient's personal room:

```ts
io.to(`user:${notification.userId}`).emit(
  "notification",
  payload,
);
```

The payload contains:

```ts
{
  id,
  incidentId,
  type,
  title,
  message,
  createdAt
}
```

Example:

```text
user:123
      |
      v
notification event
```

Only the intended connected user receives the event.

---

# 9. Actor Notification

The actor can receive a notification in the database.

However, the actor does not receive the realtime Socket.IO notification.

The notification service filters the actor:

```ts
const socketNotifications = notifications.filter(
  (notification) =>
    notification.userId !== actorUserId,
);
```

So:

```text
Actor
  |
  +-- Notification stored in DB
  |
  +-- No Socket.IO event

Other recipients
  |
  +-- Notification stored in DB
  |
  +-- Socket.IO event
```

---

# 10. Frontend Notification Flow

The `AuthContext` listens for:

```ts
socket.on("notification", handleNotification);
```

When a notification arrives:

```text
Socket.IO
    |
    v
handleNotification()
    |
    +--> Play notification sound
    |
    +--> Show toast
    |
    +--> Invalidate notifications query
    |
    +--> Invalidate unread count query
```

The client does not need to manually insert the notification into the notification list.

Instead, React Query refetches the persisted data from the API.

---

# 11. React Query Synchronization

Realtime notification:

```text
Socket.IO
    |
    v
notification received
    |
    +--> invalidate ["notifications"]
    |
    +--> invalidate ["notification-unread-count"]
```

The notification list then gets the latest data from:

```text
GET /api/v1/notifications
```

The notification badge gets the latest count from:

```text
GET /api/v1/notifications/unread-count
```

This keeps the client synchronized with the database.

---

# 12. Offline Users

Socket.IO is not the source of truth.

If a user is offline:

```text
Incident happens
      |
      v
Notification saved in DB
      |
      X
Socket.IO cannot deliver
```

When the user comes back:

```text
Login / page load
      |
      v
Notification API
      |
      v
Database
      |
      v
Unread notifications displayed
```

Therefore notifications are not lost just because the user was disconnected.

---

# 13. Example

Suppose:

```text
Akshay vani (ADMIN)
creates an incident
and assigns it to
Rahul Kumar (MEMBER)
```

The flow is:

```text
1. Incident created
        |
        v
2. createIncidentEvent()
        |
        v
3. IncidentEvent stored
        |
        v
4. Notification recipients calculated
        |
        v
5. Notifications stored
        |
        v
6. Socket.IO sends notifications
        |
        v
7. Admin/Manager/Assignee receive realtime event
        |
        v
8. React shows toast + sound
        |
        v
9. React Query refreshes notification data
```

The notification title can be:

```text
Incident created and assigned
```

And the message:

```text
Akshay vani (ADMIN) created incident and assigned it to Rahul Kumar (MEMBER)
```

---

# 14. Important Design Rule

The system follows this rule:

```text
IncidentEvent
    =
What happened

Notification
    =
Who needs to know

Database
    =
Source of truth

Socket.IO
    =
Realtime delivery

React Query
    =
Client synchronization
```

This separation keeps incident history, notifications, realtime delivery, and frontend state independent and easier to maintain.
