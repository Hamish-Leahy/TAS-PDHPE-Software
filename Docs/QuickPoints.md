# Quick Points Feature

## Overview
The Quick Points feature allows users to quickly add points to houses as runners finish races.

## Key Components
- **QuickPoints.tsx**: Main component for adding points.
- **fetchHousePoints**: Fetches current house points for display.
- **handleAddPoint**: Adds points to a specific house.
- **handleRefresh**: Refreshes the displayed points.

## Implementation Details
- **State Management**: Uses `useState` for managing house points and loading states.
- **Data Fetching**: Fetches data from Supabase to ensure points are up-to-date.
- **User Interaction**: Provides buttons for adding points and refreshing data, with immediate feedback on the UI.
