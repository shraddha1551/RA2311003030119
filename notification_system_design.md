# Campus Notification System Design

## Overview

The project implements a campus notification platform with a Node.js backend and a React frontend. Students can view campus notifications, create new notifications, filter by notification type, open a priority inbox, paginate through results, and mark notifications as read.

## Folder Structure

- `logging_middleware`: reusable logging function used by the application.
- `notification_app_be`: Node.js backend API.
- `notification_app_fe`: React frontend application.
- `notification_system_design.md`: architecture and design notes.

## Backend Design

The backend is implemented with Node.js using the built-in `http` module. It stores notifications in memory for this stage and exposes REST-style APIs for the frontend.

Supported APIs:

- `GET /notifications`: returns notifications.
- `GET /notifications?limit=5&page=1`: returns paginated notifications.
- `GET /notifications?notification_type=Placement`: returns notifications filtered by type.
- `POST /notifications`: creates a new notification.
- `POST /notifications/read`: marks a notification as read.
- `POST /logs`: receives frontend logs and forwards them using the logging middleware.

Each notification contains:

- `id`
- `message`
- `type`
- `read`
- `timestamp`

## Frontend Design

The frontend is a React application running on `localhost:3000`. It fetches notification data from the backend running on `localhost:3001`.

Main UI features:

- All notifications view
- Priority inbox view
- Notification type filter
- Pagination using Previous and Next buttons
- Read/unread status display
- Mark as Read action
- Notification creation form

The frontend keeps state for notifications, selected type, selected filter, selected view, current page, and total pages.

## Priority Inbox Logic

Priority is calculated using notification type and recency.

Priority weight:

- `Placement`: 3
- `Result`: 2
- `Event`: 1

The priority inbox only shows unread notifications. Notifications are sorted first by priority weight and then by latest timestamp. The top 10 priority notifications are displayed.

## Pagination and Filtering

The frontend sends `limit`, `page`, and `notification_type` query parameters to the backend. The backend filters the notification list first, then returns the requested page.

This avoids loading unnecessary data into the UI and keeps the behavior aligned with the API contract.

## Read and Unread Handling

Unread notifications are highlighted visually. When a user clicks Mark as Read, the frontend calls `POST /notifications/read` with the notification ID. The backend updates the notification and the frontend refreshes the list.

## Logging Strategy

The `logging_middleware` folder contains a reusable `Log(stack, level, package, message)` function. It validates allowed values and sends logs to the test server log API.

Backend logging is used for:

- fetching notifications
- creating notifications
- marking notifications as read
- invalid JSON requests
- missing routes

Frontend logging is used for:

- successful notification fetches
- failed notification fetches
- notification creation
- mark-as-read actions

Frontend logs are sent to the backend through `POST /logs`, and the backend forwards them through the shared logging middleware.

## Error Handling

The backend returns proper JSON error responses for invalid JSON, missing notifications, and unknown routes. The frontend logs API failures and keeps the UI usable even if logging fails.
