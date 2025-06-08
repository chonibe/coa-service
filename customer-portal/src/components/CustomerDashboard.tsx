import React, { useState, useEffect } from 'react';

// Custom Polaris import to bypass type declaration
const Polaris = {
  Card: (props: any) => React.createElement('div', { ...props, className: 'polaris-card' }),
  Text: (props: any) => React.createElement('p', { ...props, className: 'polaris-text' }),
  Button: (props: any) => React.createElement('button', { ...props, className: 'polaris-button' }),
  Heading: (props: any) => React.createElement('h2', { ...props, className: 'polaris-heading' }),
  TextField: (props: any) => React.createElement('input', { 
    ...props, 
    className: 'polaris-text-field',
    type: props.type || 'text'
  }),
  BlockStack: (props: any) => React.createElement('div', { 
    ...props, 
    className: `polaris-block-stack ${props.className || ''}`,
    style: { display: 'flex', flexDirection: 'column', gap: props.gap || '0' }
  }),
  InlineStack: (props: any) => React.createElement('div', { 
    ...props, 
    className: `polaris-inline-stack ${props.className || ''}`,
    style: { display: 'flex', gap: props.gap || '0' }
  })
};

import { 
  retrieveCustomerId, 
  verifyCustomerIdentity, 
  handleAuthenticationError,
  CustomerIdentity,
  MultiFactorAuthService
} from '../config/auth';

import CertificationService, { 
  DigitalArtCertification,
  CustomerData
} from '../services/CertificationService';

const CustomerDashboard: React.FC = () => {
  const [customer, setCustomer] = useState<CustomerIdentity | null>(null);
  const [certifications, setCertifications] = useState<DigitalArtCertification[]>([]);
  const [error, setError] = useState<{ message: string; redirect?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Multi-Factor Authentication State
  const [mfaRequired, setMfaRequired] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [mfaMessage, setMfaMessage] = useState('');

  // Multi-Factor Authentication Service
  const mfaService = MultiFactorAuthService.getInstance();

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Retrieve customer ID from multiple sources
        const customerId = retrieveCustomerId();
        
        if (!customerId) {
          throw new Error('Invalid customer data');
        }

        // Fetch customer data and verify identity
        const customerData: CustomerData = await CertificationService.fetchCustomerData(customerId);
        const verifiedCustomer = await verifyCustomerIdentity(customerData);
        
        if (!verifiedCustomer.verified) {
          // Trigger Multi-Factor Authentication
          setMfaRequired(true);
          setCustomer(verifiedCustomer);
        } else {
          // Proceed with dashboard initialization
          setCustomer(verifiedCustomer);

          // Fetch customer's digital art certifications
          const fetchedCertifications = await CertificationService.getCertifications(customerId);
          setCertifications(fetchedCertifications);
        }

        setIsLoading(false);
      } catch (err) {
        // Centralized error handling
        const errorDetails = handleAuthenticationError(err as Error);
        setError(errorDetails);
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  // Verify MFA Code
  const handleMfaVerification = async () => {
    try {
      // In a real scenario, you'd get the expected code from the backend
      const result = await mfaService.verifyCode(verificationCode, '123456');
      
      if (result.verified) {
        // Complete customer verification
        setMfaRequired(false);
        
        // Fetch certifications after successful MFA
        if (customer?.id) {
          const fetchedCertifications = await CertificationService.getCertifications(customer.id);
          setCertifications(fetchedCertifications);
        }
      } else {
        setMfaMessage('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setMfaMessage('An error occurred during verification.');
    }
  };

  // Redirect on error
  useEffect(() => {
    if (error?.redirect) {
      window.location.href = error.redirect;
    }
  }, [error]);

  // Loading state
  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <Polaris.Text>Loading your dashboard...</Polaris.Text>
      </div>
    );
  }

  // Multi-Factor Authentication State
  if (mfaRequired) {
    return (
      <Polaris.Card>
        <Polaris.BlockStack gap="4">
          <Polaris.Heading>Multi-Factor Authentication</Polaris.Heading>
          <Polaris.Text>
            A verification code has been sent to {customer?.email}. 
            Please enter the code below.
          </Polaris.Text>
          
          <Polaris.TextField
            label="Verification Code"
            value={verificationCode}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setVerificationCode(event.target.value)}
            placeholder="Enter 6-digit code"
          />
          
          {mfaMessage && (
            <Polaris.Text color="critical">{mfaMessage}</Polaris.Text>
          )}
          
          <Polaris.Button onClick={handleMfaVerification}>
            Verify Code
          </Polaris.Button>
        </Polaris.BlockStack>
      </Polaris.Card>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="error-state">
        <Polaris.Text>{error.message}</Polaris.Text>
        <Polaris.Button onClick={() => window.location.reload()}>Try Again</Polaris.Button>
      </div>
    );
  }

  // Main dashboard view
  return (
    <Polaris.BlockStack gap="4">
      <Polaris.Heading>Welcome, {customer?.name}</Polaris.Heading>
      
      {certifications.length === 0 ? (
        <Polaris.Card>
          <Polaris.BlockStack gap="2">
            <Polaris.Text>You haven't received any digital art certifications yet.</Polaris.Text>
            <Polaris.Button>Explore Certifications</Polaris.Button>
          </Polaris.BlockStack>
        </Polaris.Card>
      ) : (
        <Polaris.Card>
          <Polaris.Heading>Your Digital Art Certifications</Polaris.Heading>
          {certifications.map(cert => (
            <Polaris.Card key={cert.id}>
              <Polaris.InlineStack gap="4">
                <Polaris.Text>{cert.artworkTitle}</Polaris.Text>
                <Polaris.Text>{cert.artistName}</Polaris.Text>
                <Polaris.Text>{cert.verificationStatus}</Polaris.Text>
              </Polaris.InlineStack>
            </Polaris.Card>
          ))}
        </Polaris.Card>
      )}
    </Polaris.BlockStack>
  );
};

export default CustomerDashboard; 