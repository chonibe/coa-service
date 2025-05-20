# Database Backup System

This system provides automated backups of the Supabase database with local storage and optional Google Drive integration.

## Features

- Daily SQL database backups
- Weekly full backups
- Automatic compression using gzip
- Automatic cleanup of old backups
- Configurable retention policies
- Optional Google Drive integration

## Configuration

The backup system is configured through environment variables:

### Database Configuration
```
DATABASE_URL=your_database_url
```

### Google Drive Configuration (Optional)
```
GOOGLE_CLIENT_EMAIL=your-email@gmail.com
GOOGLE_PRIVATE_KEY=your-private-key
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

## Backup Schedule

- Daily Backups: Every day at midnight
- Weekly Backups: Every Sunday at midnight
- Cleanup: Automatically removes old backups based on retention policy

## Retention Policy

- Local Storage: 30 days by default
- Google Drive: 90 days by default
- Maximum number of backups: 30 for local, 90 for Google Drive

## Setup

1. Install dependencies:
```bash
npm install node-cron
```

2. Set up environment variables

3. Start the backup system:
```typescript
import { startBackupCron } from './backup/cron/backup-cron';

startBackupCron();
```

Or use the API endpoint:
```bash
curl -X POST http://your-domain/api/backup/start
```

## Recovery

### Database Recovery
1. Locate the desired backup file in the backup directory
2. Use the following command to restore:
```bash
gunzip -c backup-file.sql.gz | psql "your_database_url"
```

## Monitoring

The system logs all backup operations and errors. Monitor the logs for:
- Successful backups
- Failed backups
- Cleanup operations
- Storage usage

## Error Handling

The system includes error handling for:
- Database connection issues
- File system errors
- Compression errors
- Cleanup failures

## Security

- Database credentials are stored in environment variables
- Backup files are compressed and stored securely
- Old backups are automatically cleaned up
- Access to backup files is restricted to the application

## Troubleshooting

1. If backups fail:
   - Check database connection
   - Verify storage directory permissions
   - Check available disk space

2. If cleanup fails:
   - Check file permissions
   - Verify retention settings
   - Check for locked files

3. If Google Drive integration fails:
   - Verify Google credentials
   - Check folder permissions
   - Verify internet connection 