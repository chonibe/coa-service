import axios from 'axios';
import { verifyCustomerIdentity } from '../config/auth';

// Define interfaces for stronger typing
export interface ArtworkMetadata {
  id: string;
  title: string;
  artist: string;
  creationDate: Date;
  provenance: string[];
  certificationType: 'digital' | 'physical' | 'hybrid';
}

export interface CertificationVerificationResult {
  isValid: boolean;
  details: {
    certificationId: string;
    verifiedAt: Date;
    verificationMethod: string;
  };
}

export interface DigitalArtCertification {
  id: string;
  artworkTitle: string;
  artistName: string;
  certificationDate: Date;
  nfcTagId?: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
}

export interface CustomerData {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
}

class CertificationService {
  private baseUrl: string;

  constructor() {
    // TODO: Replace with actual backend URL
    this.baseUrl = process.env.REACT_APP_CERTIFICATION_API || 'https://api.streetcollector.com';
  }

  // Public method to fetch customer data
  public async fetchCustomerData(customerId: string): Promise<CustomerData> {
    try {
      const response = await axios.get(`${this.baseUrl}/customers/${customerId}`);
      const customerData = response.data as CustomerData;
      
      if (!customerData || !customerData.id) {
        throw new Error('Invalid customer data');
      }

      return customerData;
    } catch (error) {
      console.error('Failed to fetch customer data', error);
      throw error;
    }
  }

  // Public method to get certifications
  public async getCertifications(customerId: string): Promise<DigitalArtCertification[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/customers/${customerId}/certifications`);
      const certifications = response.data as DigitalArtCertification[];
      
      return certifications || [];
    } catch (error) {
      console.error('Failed to fetch certifications', error);
      return [];
    }
  }

  // Fetch artwork metadata
  public async getArtworkMetadata(artworkId: string): Promise<ArtworkMetadata> {
    try {
      const response = await axios.get(`${this.baseUrl}/artworks/${artworkId}`);
      const artworkMetadata = response.data as ArtworkMetadata;

      if (!artworkMetadata || !artworkMetadata.id) {
        throw new Error('Unable to retrieve artwork details');
      }

      return artworkMetadata;
    } catch (error) {
      console.error('Failed to fetch artwork metadata', error);
      throw new Error('Unable to retrieve artwork details');
    }
  }

  // Verify NFC certification
  public async verifyCertification(certificationId: string): Promise<CertificationVerificationResult> {
    try {
      const response = await axios.post(`${this.baseUrl}/verify-certification`, { 
        certificationId 
      });

      const verificationResult = response.data as { isValid: boolean };

      return {
        isValid: verificationResult.isValid,
        details: {
          certificationId,
          verifiedAt: new Date(),
          verificationMethod: 'NFC'
        }
      };
    } catch (error) {
      console.error('Certification verification failed', error);
      return {
        isValid: false,
        details: {
          certificationId,
          verifiedAt: new Date(),
          verificationMethod: 'NFC'
        }
      };
    }
  }

  // Track artwork provenance
  public async getArtworkProvenance(artworkId: string): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/artworks/${artworkId}/provenance`);
      const provenance = response.data as { provenance: string[] };
      
      return provenance.provenance || [];
    } catch (error) {
      console.error('Failed to fetch artwork provenance', error);
      return [];
    }
  }

  // Enhanced customer verification
  async verifyCustomer(customerId: string) {
    try {
      const customerData = await this.fetchCustomerData(customerId);
      return await verifyCustomerIdentity(customerData);
    } catch (error) {
      console.error('Customer verification failed', error);
      return { 
        verified: false, 
        customerType: 'unverified' 
      };
    }
  }
}

export default new CertificationService(); 