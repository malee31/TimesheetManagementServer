# New API Plan
This document outlines the endpoints and specifications for creating a new version of the outdated server API currently in use.  
To be PR'd into the original as a replacement at a later date

# Specifications
## Basic Info
API Namespace: `/api/v1/*`

## Endpoints
The following sections documents all implemented endpoints and their inputs and outputs.

### Public Endpoints
The following endpoints may be used by anyone, without any authorization, even if they are not a user of the server.  
They are meant to expose information for display on the frontends.  
Future modifications may make these endpoints only accessible by any user with a VALID API key instead of just any user.

#### GET /users - List all user data (No passwords ofc)
> Response:
> - (200) Should always be ok unless the server is unreachable
>
> > Related Convenience Endpoint:  
> > GET /users/status - List all user data WITH their latest sessions attached. Intended for the list of users signed in.  
> > Responses: User objects with a `session` key in each containing their latest session (See `/user` and `/session/latest`)

### User Authorization
Authentication is handled using generated API keys.  
Each user has a password which has the sole purpose of being exchanged for an active API key.  
A user can have multiple functional API keys and each key has the ability to revoke any and all API keys in exchange for a new one to invalidate all other sessions.  
You may store this API key on the device instead of a password.

> **Warning**
> Changing a password does not implicitly revoke all API keys.
> Changing a password will not affect the API keys and revoking or regenerating API keys will not affect the password.

#### POST /user/auth/exchange - Given a password, returns a randomly generated, valid api key that does not expire for the user
> Input: Send password in body in the `password` key  
> Response:
> - (200) API key is provided in the `api_key` field
>
> Errors:
> - (401) `invalid_password` No user with this password exists
>
#### POST /user/auth/revoke - Revokes and regenerates the api key
> Errors:
> - (401) `not_authed` when no auth header is provided
> - (404) `user_not_found` when no user with a matching auth header is found
>
> Response:
> - (200) Successfully revoked API key. Returns new key under the `new_api_key` key

### User Methods
These endpoints handle viewing and modifying information about a single user (normally the person signed in).

#### GET /user - The user's public info (Auth header)
> Response:
> - (200) User object is returned. Not in a `user` key
>
> Errors:
> - (404) `user_not_found` when the user with the corresponding auth header does not exist

#### PATCH /user/password - Alternative user edit options. (Changing passwords etc) (Auth header)
> Is an optional feature provided for convenience
> Response:
> - (204) No content is returned. Success
>
> Errors:
> - (422) `invalid_password` Password is invalid. Other errors may be more specific in the future

#### GET /user/sessions - All user sessions (Auth header)
> Response:
> - (200) List of sessions in the `sessions` key
>
> Errors:
> - (401) `not_authed` when no auth header is provided
> - (404) `user_not_found` when no user with a matching auth header is found

#### GET /user/session/latest - Latest session (Auth header)
> Response:
> - (200) Returns the latest session
>
> Warnings:
> - (204) `NO_SESSIONS` No session is found
>
> Errors:
> - (401) `not_authed` when no auth header is provided
> - (404) `user_not_found` when no user with a matching auth header is found

#### PATCH /user/session/latest - Switch to log out (Auth header)
> Input: Use `method` key for `sign_in` or `sign_out`  
> Response:
> - (200) Success. Returns the updated session even if no changes were made
>
> Errors:
> - (401) `not_authed` when no auth header is provided
> - (404) `user_not_found` when no user with a matching auth header is found

### Admin Methods
These endpoints are intended for people with the admin password only and have a lot more power.

Note that server admins also have the ability to look up anyone's API key to use any of the `User Methods` as well.  
The ability to impersonate normal users has not been added for normal Admin users yet.

#### POST /user - Add user (Admin auth header)
> Input: New user object in body  
> Response:
> - (200) New user object is returned (Same form as `/user`)
>
> Errors:
> - (401) `not_authed` when no admin header is provided
> - (401) `invalid_admin_auth` when admin header is invalid
> - (409) `user_already_exists` when a user with the same password exists

#### PUT /user - Edit user (Changing passwords etc) (Auth header)
> Input: New user object in body  
> Response:
> - (200) New user object is returned (Same form as `/user`)
>
> Errors:
> - (401) `not_authed` when no admin header is provided
> - (401) `invalid_admin_auth` when admin header is invalid
> - (404) `user_not_found` when no user with the provided auth header exists

#### DELETE /user - Delete the user (Admin auth header)
> Response:
> - (204) No content is returned
>
> Warnings:
> - (204) `user_already_deleted` User has already been deleted. No content is returned
>
> Errors:
> - (401) `not_authed` when no admin header is provided
> - (401) `invalid_admin_auth` when admin header is invalid

#### GET /users/sessions - All user sessions grouped by user (Admin auth header)
> Response:
> - (200) All sessions from all users in `[user id]: [sessions]` format
>
> Errors:
> - (401) `not_authed` when no admin auth header is provided
> - (401) `invalid_admin_auth` when an invalid admin auth header is provided

#### POST /user/sessions - For creating a completely new and arbitrary session (Admin auth header)
> Input: A complete session object under the `session` key and the target user's identifier as `user_id`    
> Response:
> - (200) New session is returned
>
> Errors:
> - (401) `not_authed` when no auth header is provided
> - (401) `invalid_admin_auth` when an invalid admin auth header is provided
> - (404) `user_not_found` when no user with a matching auth header is found
> - (422) `user_not_specified` when no target user to add the session to is specified

#### DELETE /user/session/:session-id - For removing a specific session (Admin auth header)
> Response:
> - (204) No content returned. Successfully deleted
>
> Errors:
> - (401) `not_authed` when no admin auth header is provided
> - (401) `invalid_admin_auth` when an invalid admin auth header is provided

### Planned:
The following endpoints are planned but not implemented. Their functionalities may change.

#### WS /ws/users/status - Websocket invoked each time any user has their status change (Provides the new user's status)
> Response:
> - (200) Contains the changed user in the `user` key and `message_id` and `next_message_id` to detect missed messages

#### POST /users/status/sync - To signal the server to sync data to external sources like Google Sheets or a file on-demand
> Response:
> - (200) Successful sync
>
> Errors:
> - (500) `sync_failed` - Generic failure code. More specific codes added as needed

# Auth notes
As a side effect of revoke, all auth-related endpoints can also fail with `error: "already_revoked"`

# API Responses
After consuming/checking the status of the request, you may delete the keys `ok`, `warning`, and `error` to leave a standard response for the endpoint that you can store in a variable or state
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

# Considerations
Since not being able to find the user is also indicates an invalid API key, the code returned could be unauthorized instead.

For the admin side of things, an identifier still has to be chosen. It will likely be the SQL row id

To differentiate an admin key from a user key, admin keys and user keys will be prefixed differently. Likely `A-` for admins and `U-` for users.

Admin API key exchange may be worth adding at a later date to avoid leaking the credentials with physical device access

Logging can be added silently to any endpoint, provided it fails silently in most cases.

There are no GETs or other methods for `/user/session/:session-id`