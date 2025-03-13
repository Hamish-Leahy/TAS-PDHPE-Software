# Results Feature

## Overview
The Results feature displays the results of races, allowing users to view, delete, and export race results.

## Key Components
- **Results.tsx**: Main component for displaying race results.
- **fetchRaces**: Fetches race data from the Supabase database.
- **fetchRaceResults**: Retrieves results for a specific race.
- **exportToCsv**: Exports race results to a CSV file.
- **handleDeleteRace**: Handles the deletion of a selected race.

## Implementation Details
- **State Management**: Utilizes React's `useState` for managing race data and loading states.
- **Data Fetching**: Uses Supabase for fetching race data and results.
- **User Interaction**: Provides buttons for exporting results and deleting races, with confirmation dialogs for deletion.

## Usage
1. Navigate to the Results page.
2. View the list of races and their results.
3. Use the export button to download results in CSV format.
4. Click on the delete button to remove a race, confirming the action when prompted.
