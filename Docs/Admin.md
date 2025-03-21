# Admin Feature

## Overview
The Admin feature allows administrators to manage house points, view logs, and perform administrative tasks.

## Key Components
- **Admin.tsx**: Main component for the admin dashboard.
- **fetchHousePoints**: Fetches current house points from the database.
- **handleLogin**: Manages admin login functionality.
- **handleResetPoints**: Resets house points with confirmation.

## Implementation Details
- **State Management**: Uses `useState` for managing admin state and data.
- **Data Fetching**: Interacts with Supabase to fetch and update data.
- **User Interaction**: Provides forms for login and resetting points, with appropriate validation and error handling.

## Usage
1. Access the Admin dashboard.
2. Log in with admin credentials.
3. View and manage house points.
4. Reset points as necessary, confirming the action when prompted.
