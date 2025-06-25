# Street Collector Customer Portal

## Overview
The Street Collector Customer Portal is a comprehensive web application designed to provide customers with a seamless, secure, and interactive experience for managing their digital art certifications.

## Features
- Multi-Factor Authentication (MFA)
- Secure Customer Identity Verification
- Digital Art Certification Management
- Dynamic Dashboard Experience
- Error Handling and Graceful Degradation

## Technical Architecture
### Components
- `CustomerDashboard`: Main dashboard component
- `CertificationService`: Service for managing digital art certifications
- `MultiFactorAuthService`: Authentication and verification service

### Authentication Flow
1. Customer ID Retrieval
2. Identity Verification
3. Multi-Factor Authentication
4. Dashboard Initialization

## Configuration
### Environment Variables
- `REACT_APP_CERTIFICATION_API`: Base URL for certification API
- `REACT_APP_MFA_ENABLED`: Enable/Disable Multi-Factor Authentication

## API Endpoints
- `/api/certifications/customer/{customerId}`: Retrieve customer data
- `/api/certifications/customer/{customerId}/certifications`: Fetch customer certifications
- `/api/certifications/certificate/{certificationId}/download`: Download certification

## Security Considerations
- Robust error handling
- Multiple customer ID retrieval strategies
- Centralized authentication error management

## Performance Optimization
- Lazy loading of certification data
- Minimal initial render payload
- Efficient state management

## Future Improvements
- Enhanced MFA methods (SMS, Authenticator App)
- Real-time certification updates
- Offline support
- Internationalization

## Deployment
### Prerequisites
- Node.js 16+
- npm or yarn
- Supabase/Shopify Backend

### Installation
```bash
npm install
npm run start
```

## Testing
```bash
npm run test
npm run test:coverage
```

## Troubleshooting
- Check network connectivity
- Verify API endpoint configuration
- Review browser console for detailed errors

## Version
Current Version: 1.0.0
Last Updated: ${new Date().toISOString()}
