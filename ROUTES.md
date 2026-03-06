# API Routes Documentation

## Authentication Routes

### POST /auth/signup
Register a new user
- **Parameters**: email, username, password, passwordConfirm
- **Response**: User object or error

### POST /auth/login
Login and get JWT token
- **Parameters**: email, password
- **Response**: JWT token and user data

### POST /auth/verify-email
Verify email with token
- **Parameters**: token
- **Response**: Success status

### POST /auth/request-password-reset
Request password reset email
- **Parameters**: email

### POST /auth/reset-password
Reset password with token
- **Parameters**: token, password, passwordConfirm

## User Routes (Protected)

### GET /auth/me
Get current user profile

### PUT /auth/profile
Update user profile
- **Parameters**: username, avatar, settings (optional)

### POST /auth/change-password
Change user password
- **Parameters**: currentPassword, newPassword, newPasswordConfirm

### POST /auth/logout
Logout user

## Chemical Routes

### GET /chemicals
Get all chemicals from the database

### GET /chemicals/:id
Get a chemical by id

### POST /chemicals (Protected)
Create a chemical
- **Parameters**: name, formula, state
- **Optional Parameters**: colorHex, color, solubleInWater, opacity, hasRefraction, molarMass, density, isPublic

### PUT /chemicals/:id (Protected)
Update a chemical (full replacement)
- **Optional Parameters**: name, formula, colorHex, color, state, solubleInWater, opacity, hasRefraction, molarMass, density, isPublic

### PATCH /chemicals/:id (Protected)
Partially update a chemical
- **Optional Parameters**: name, formula, colorHex, color, state, solubleInWater, opacity, hasRefraction, molarMass, density, isPublic

### DELETE /chemicals/:id (Protected)
Delete a chemical by id

## Equipment Instance Routes

### GET /equipment-instances
Get all equipment instances from the database

### GET /equipment-instances/:id
Get an equipment instance by id

### POST /equipment-instances (Protected)
Create an equipment instance
- **Parameters**: typeId
- **Optional Parameters**: name, currentWorkspaceId, positionX, positionY, contents, temperature, isReacting

### PUT /equipment-instances/:id (Protected)
Update an equipment instance (full replacement)
- **Optional Parameters**: typeId, name, currentWorkspaceId, positionX, positionY, contents, temperature, isReacting

### PATCH /equipment-instances/:id (Protected)
Partially update an equipment instance
- **Optional Parameters**: typeId, name, currentWorkspaceId, positionX, positionY, contents, temperature, isReacting

### DELETE /equipment-instances/:id (Protected)
Delete an equipment instance by id

## Favorites Routes

### POST /favorites (Protected)
Add a chemical to favorites
- **Parameters**: favoriteId
- **Optional Parameters**: note

### DELETE /favorites (Protected)
Remove a chemical from favorites
- **Parameters**: favoriteId

### GET /favorites (Protected)
Get all favorited chemicals for the current user

### POST /favorites/check/:favoriteId (Protected)
Check if a specific chemical is favorited
- **Path Parameters**: favoriteId

## Workspace Routes

### GET /workspaces (Protected)
Get all workspaces for the current user

### GET /workspaces/:id (Protected)
Get a specific workspace by id

### POST /workspaces (Protected)
Create a new workspace
- **Parameters**: name, labState
- **Optional Parameters**: description, equipmentPositions, activeReactions, labTemperature, isFumeHoodActive

### PUT /workspaces/:id (Protected)
Update a workspace
- **Optional Parameters**: name, description, labState, equipmentPositions, activeReactions, labTemperature, isFumeHoodActive

### DELETE /workspaces/:id (Protected)
Delete a workspace by id

### POST /workspaces/:id/snapshot (Protected)
Save a workspace snapshot (auto-save/version history)
- **Parameters**: snapshot (JSON object of lab state)
