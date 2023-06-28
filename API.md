# New API Plan
This document outlines the endpoints and specifications for creating a new version of the outdated server API currently in use.  
To be PR'd into the original as a replacement at a later date

# Specifications
Namespace: /api/v1/*

GET /users - List all user data (No passwords ofc)  
Response:
- (200) Should always be ok unless the server is unreachable

> Convenience methods:  
> GET /users/status - List all user data WITH their latest sessions  
> Responses: User objects with a `session` key in each containing their latest session (See `/user` and `/session/latest`)

WS /ws/users/status - Invoked each time any user has their status change (Provides the new user status)  
Response:
- (200) Contains the changed user in the `user` key and `message_id` and `next_message_id` to detect missed messages

GET /user - Public user data (Auth header)  
Response:
- (200) User object is returned. Not in a `user` key

Errors: 
- (404) `user_not_found` when the user with the corresponding auth header does not exist

POST /user - Add user (Admin auth header)  
Input: New user object in body  
Response:
- (200) New user object is returned (Same form as `/user`)

Errors:
- (401) `not_authed` when no admin header is provided
- (401) `invalid_admin_auth` when admin header is invalid
- (409) `user_already_exists` when a user with the same password exists

PUT /user - Edit user (Changing passwords etc) (Auth header)  
Input: New user object in body  
Response:
- (200) New user object is returned (Same form as `/user`)

Errors:
- (401) `not_authed` when no admin header is provided
- (401) `invalid_admin_auth` when admin header is invalid
- (404) `user_not_found` when no user with the provided auth header exists

(Option) PATCH /user/password - Alternative user edit options (Changing passwords etc) (Auth header)  
Response:
- (204) No content is returned. Success

Errors:
- (422) `invalid_password` Password is invalid. Other errors may be more specific in the future

DELETE /user - Delete the user (Admin auth header)
Response:
- (204) No content is returned

Warnings:
- (204) `user_already_deleted` User has already been deleted. No content is returned

Errors:
- (401) `not_authed` when no admin header is provided
- (401) `invalid_admin_auth` when admin header is invalid

GET /user/sessions - All user sessions (Auth header)
Response:
- (200) List of sessions in the `sessions` key

Errors:
- (401) `not_authed` when no auth header is provided
- (404) `user_not_found` when no user with a matching auth header is found

GET /users/sessions - All user sessions grouped by user (Admin auth header)
Response:
- (200) All sessions from all users in `[user id]: [sessions]` format

Errors:
- (401) `not_authed` when no admin auth header is provided
- (401) `invalid_admin_auth` when an invalid admin auth header is provided

POST /user/sessions - For creating a completely new and arbitrary session (Admin auth header)
Input: A complete session object under the `session` key and the target user's identifier as `user_id`    
Response:
- (200) New session is returned

Errors:
- (401) `not_authed` when no auth header is provided
- (401) `invalid_admin_auth` when an invalid admin auth header is provided
- (404) `user_not_found` when no user with a matching auth header is found
- (422) `user_not_specified` when no target user to add the session to is specified

DELETE /user/session/:session-id - For removing a specific session (Admin auth header)  
Response:
- (204) No content returned. Successfully deleted

Errors:
- (401) `not_authed` when no admin auth header is provided
- (401) `invalid_admin_auth` when an invalid admin auth header is provided

GET /user/session/latest - Latest session (Auth header)  
Response:
- (200) Returns the latest session

Warnings:
- (204) `NO_SESSIONS` No session is found

Errors:
- (401) `not_authed` when no auth header is provided
- (404) `user_not_found` when no user with a matching auth header is found

PATCH /user/session/latest - Switch to log out (Auth header)  
Input: Use `method` key for `sign_in` or `sign_out`  
Response:
- (200) Success. Returns the updated session even if no changes were made

Errors:
- (401) `not_authed` when no auth header is provided
- (404) `user_not_found` when no user with a matching auth header is found

POST /user/auth/exchange - Given a password, returns a randomly generated, valid api key that does not expire for the user  
Input: Send password in body in the `password` key  
Response:
- (200) API key is provided in the `api_key` field

Errors:
- (401) `invalid_password` No user with this password exists

POST /user/auth/revoke - Revokes and regenerates the api key  
Errors:
- (401) `not_authed` when no auth header is provided
- (404) `user_not_found` when no user with a matching auth header is found

Response:
- (200) Successfully revoked API key. Returns new key under the `new_api_key` key

# Auth notes
As a side effect of revoke, all auth-related endpoints can fail with `error: "AUTH_REVOKED_BY_USER"`

# API Responses
After consuming/checking the status of the request, deleting the keys `ok`, `warning`, and `error` should leave a standard response for the endpoint for storing in a variable or state
```json
{
	"ok": "true/false",
	"warning": "UNKNOWN_WARNING",
	"error": "UNKNOWN_ERROR",
	"other data": {
		"...stuff": "etc"
	}
}
```

# Additional Convenience Routes
POST /users/status/sync - For syncing data to external sources on-demand  
Response:
- (200) Successful sync

Errors:
- (500) `sync_failed` - Generic failure code. More specific codes added as needed

# Considerations
Since not being able to find the user is also indicates an invalid API key, the code returned could be unauthorized instead.

For the admin side of things, an identifier still has to be chosen. It will likely be the SQL row id

To differentiate an admin key from a user key, admin keys and user keys will be prefixed differently. Likely `A-` for admins and `U-` for users.

Admin API key exchange may be worth adding at a later date to avoid leaking the credentials with physical device access

Logging can be added silently to any endpoint, provided it fails silently in most cases.

There are no GETs or other methods for `/user/session/:session-id`