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

export interface CustomerData {
  id: string;
  name: string;
  email: string;
}

export interface DigitalArtCertification {
  id: string;
  artworkTitle: string;
  artistName: string;
  verificationStatus: 'Pending' | 'Verified' | 'Rejected';
  issuedDate: Date;
  certificateUrl?: string;
}

export default class CertificationService {
  private static baseUrl = '/api/certifications'; // Adjust based on your actual API endpoint

  static async fetchCustomerData(customerId: string): Promise<CustomerData> {
    try {
      const response = await fetch(`${this.baseUrl}/customer/${customerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch customer data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching customer data:', error);
      throw error;
    }
  }

  static async getCertifications(customerId: string): Promise<DigitalArtCertification[]> {
    try {
      const response = await fetch(`${this.baseUrl}/customer/${customerId}/certifications`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch certifications');
      }

      const certifications: DigitalArtCertification[] = await response.json();
      
      // Transform dates and add default values
      return certifications.map(cert => ({
        ...cert,
        issuedDate: new Date(cert.issuedDate),
        verificationStatus: cert.verificationStatus || 'Pending',
        certificateUrl: cert.certificateUrl || '#'
      }));
    } catch (error) {
      console.error('Error retrieving certifications:', error);
      return []; // Return empty array instead of throwing
    }
  }

  static async downloadCertificate(certificationId: string): Promise<Blob | null> {
    try {
      const response = await fetch(`${this.baseUrl}/certificate/${certificationId}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }

      return await response.blob();
    } catch (error) {
      console.error('Certificate download error:', error);
      return null;
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