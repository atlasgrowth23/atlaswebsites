# HVAC Service History System

This document provides information about the HVAC service history system, which allows businesses to track service records, schedule appointments, and manage customer equipment.

## Features

- **Service Records**: Track complete history of service for customer equipment
- **Appointment Scheduling**: Create and manage service appointments
- **Job Status Management**: Update job status throughout the service lifecycle
- **Equipment Management**: Track customer equipment details and service history

## Database Schema

The service history system uses the following tables:

1. `hvac_equipment` - Stores information about customer equipment
2. `hvac_jobs` - Tracks service appointments and jobs
3. `hvac_service_history` - Records service history for equipment

## API Endpoints

### Service Records API

**Endpoint**: `/api/hvac/service-records`

Methods:
- `GET`: Fetch service records (filtered by company, contact, equipment, or job)
- `POST`: Create a new service record
- `PUT`: Update an existing service record
- `DELETE`: Delete a service record

### Appointments API

**Endpoint**: `/api/hvac/appointments`

Methods:
- `GET`: Fetch upcoming appointments (filtered by company, contact, date range)
- `POST`: Create a new appointment
- `PUT`: Update an existing appointment
- `DELETE`: Cancel an appointment

### Job Status API

**Endpoint**: `/api/hvac/job-status`

Methods:
- `PUT`: Update a job's status (scheduled, in-progress, completed, cancelled, etc.)

## Setup

To set up the service history system:

1. Run the database setup script:
   ```
   npx ts-node scripts/create-service-tables.ts
   ```

2. Ensure your `.env` file contains the correct database connection string:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/mydatabase
   ```

## Frontend Components

The service history system includes the following front-end components:

1. `ServiceHistoryList`: Displays a timeline of service records for a customer's equipment
2. `ScheduleServiceForm`: Form for creating new service appointments
3. `ServiceRecordForm`: Form for creating/editing service records

These components are located in the `/components/service` directory.

## JavaScript API Client

A JavaScript API client for the service history system is available in `/lib/service-api.ts`. This provides type-safe functions for interacting with the service history API endpoints.

Example usage:

```typescript
import { 
  fetchServiceRecords, 
  createServiceRecord, 
  updateJobStatus 
} from '@/lib/service-api';

// Fetch service records for a contact
const records = await fetchServiceRecords('company-id', 123);

// Create a service record
const newRecord = await createServiceRecord({
  company_id: 'company-id',
  equipment_id: 456,
  service_date: '2023-05-15',
  service_type: 'Maintenance',
  findings: 'System in good condition',
  work_performed: 'Annual tune-up'
});

// Update job status to completed
await updateJobStatus('company-id', 789, 'completed');
```

## Testing

A test script is available at `/scripts/test-service-api.js`. To run the tests:

1. Start the development server:
   ```
   npm run dev
   ```

2. In another terminal, run the test script:
   ```
   node scripts/test-service-api.js
   ```