# Dashboard Feature

## Overview
The Dashboard feature provides an overview of ongoing races and allows for race management.

## Key Components
- **Dashboard.tsx**: Main component for the dashboard.
- **fetchData**: Fetches all necessary data for the dashboard.
- **handleCreateRace**: Handles the creation of new races.
- **handleSelectRace**: Allows selection of existing races for management.

## Implementation Details
- **State Management**: Manages race data and loading states using `useState`.
- **Data Fetching**: Interacts with Supabase to fetch race data and house points.
- **User Interaction**: Provides buttons for starting, stopping, and selecting races, with appropriate feedback and error handling.
