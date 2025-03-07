# TAS Cross Country System

<img width="1305" alt="Screenshot 2025-03-08 at 10 32 57 AM" src="https://github.com/user-attachments/assets/26bad156-6e52-4601-a918-de9fdf92c1c1" />

A comprehensive cross country race management system built for The Armidale School, featuring real-time race tracking, house points management, and administrative controls.

## Features

### Race Management
- Create and manage multiple race events
- Track runners in real-time as they cross the finish line
- Record running times and positions automatically
- Filter runners by age group and house
- Export results in multiple formats (CSV, PDF)

### House Points System
- Automatic points calculation based on race positions
- Quick points allocation feature
- Real-time house points leaderboard
- Points backup and restore functionality

<img width="1306" alt="Screenshot 2025-03-08 at 10 33 53 AM" src="https://github.com/user-attachments/assets/5caec885-5afc-4efe-a20b-bcb2be16916f" />

### Runner Management
- Add individual runners or bulk import via CSV
- Assign runners to specific races
- Filter and search capabilities
- Age group auto-calculation based on date of birth

<img width="1289" alt="Screenshot 2025-03-08 at 10 33 30 AM" src="https://github.com/user-attachments/assets/9db75a84-7b39-44e8-96fe-a0be6bfc07e3" />


### Administrative Controls
- Master admin dashboard for system-wide control
- Platform status monitoring
- Security logs and audit trails
- System notifications
- User management

### Security Features
- Role-based access control
- Login attempt monitoring
- Emergency killswitch capability
- Audit logging

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Supabase
- **Build Tool**: Vite
- **PDF Generation**: jsPDF
- **State Management**: Zustand

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
├── src/
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   │   ├── cross-country/ # Cross country specific pages
│   │   └── master-admin/  # Admin dashboard pages
│   ├── store/            # State management
│   ├── lib/              # Utilities and configurations
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper functions
├── public/               # Static assets
└── supabase/            # Database migrations and configurations
```

## Key Components

### Cross Country Module
- Dashboard: Race creation and management
- Finish Line: Real-time runner tracking
- Results: Race results and exports
- Quick Points: Rapid house points allocation

### Master Admin Module
- System Status: Platform health monitoring
- Security Logs: Access and security auditing
- User Management: System user administration
- System Settings: Configuration management
- Notifications: System-wide alerts

## Database Schema

### Main Tables
- `race_events`: Race information and status
- `runners`: Runner details and results
- `runner_races`: Runner-race assignments
- `house_points`: House points records
- `admin_settings`: System configuration
- `admin_logs`: Audit trail
- `platform_status`: System status tracking

## Security

### Access Control
- Email domain restriction (@as.edu.au only)
- Role-based permissions
- Master admin privileges

### Monitoring
- Failed login attempt tracking
- Security event logging
- Platform status monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary and confidential. All rights reserved.

## Support

For support, please contact:
- Technical Support: [contact information]
- System Administrator: [contact information]
