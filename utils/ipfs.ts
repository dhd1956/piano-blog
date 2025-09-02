/**
 * IPFS Integration using Pinata for storing extended venue metadata
 */

export interface VenueExtendedMetadata {
  // Basic venue details
  description?: string
  fullAddress?: string
  website?: string
  
  // Piano details
  pianoType?: string
  pianoCondition?: string
  pianoBrand?: string
  lastTuned?: string
  
  // Jam session details
  jamSchedule?: string
  jamFrequency?: string
  jamGenres?: string[]
  
  // Operational details
  operatingHours?: string
  wheelchairAccessible?: boolean
  parkingAvailable?: boolean
  publicTransportNear?: boolean
  
  // Social media
  facebook?: string
  instagram?: string
  twitter?: string
  
  // Curator-only fields  
  curatorNotes?: string
  curatorRating?: number
  followUpNeeded?: boolean
  specialNotes?: string
  
  // Curator verification metadata
  curator?: {
    verificationNotes: string
    verifiedBy: string
    verificationDate: string
    verificationStatus: 'approved' | 'rejected'
  }
  
  // Metadata
  version: number
  lastUpdated: string
  updatedBy: string
}

export class IPFSService {
  private static readonly PINATA_API_URL = 'https://api.pinata.cloud'
  private static readonly PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs'
  
  private static getApiKey(): string {
    const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY
    if (!apiKey) {
      throw new Error('PINATA_API_KEY not configured')
    }
    return apiKey
  }
  
  private static getSecretKey(): string {
    const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY
    if (!secretKey) {
      throw new Error('PINATA_SECRET_API_KEY not configured')
    }
    return secretKey
  }

  /**
   * Upload JSON metadata to IPFS via Pinata
   */
  static async uploadMetadata(
    metadata: VenueExtendedMetadata,
    venueId: number
  ): Promise<{ success: boolean; ipfsHash?: string; error?: string }> {
    try {
      const pinataData = {
        pinataContent: {
          ...metadata,
          venueId,
          uploadedAt: new Date().toISOString()
        },
        pinataMetadata: {
          name: `venue-${venueId}-metadata`,
          keyvalues: {
            venueId: venueId.toString(),
            contentType: 'venue-metadata',
            version: metadata.version.toString()
          }
        },
        pinataOptions: {
          cidVersion: 1
        }
      }

      const response = await fetch(`${this.PINATA_API_URL}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.getApiKey(),
          'pinata_secret_api_key': this.getSecretKey()
        },
        body: JSON.stringify(pinataData)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Pinata upload failed: ${error}`)
      }

      const result = await response.json()
      console.log('✅ IPFS upload successful:', result.IpfsHash)
      
      return {
        success: true,
        ipfsHash: result.IpfsHash
      }
    } catch (error: any) {
      console.error('❌ IPFS upload failed:', error)
      return {
        success: false,
        error: error.message || 'Failed to upload to IPFS'
      }
    }
  }

  /**
   * Retrieve metadata from IPFS via Pinata gateway
   */
  static async getMetadata(
    ipfsHash: string
  ): Promise<{ success: boolean; metadata?: VenueExtendedMetadata; error?: string }> {
    if (!ipfsHash || ipfsHash.trim() === '') {
      return {
        success: false,
        error: 'No IPFS hash provided'
      }
    }

    try {
      console.log('🔍 Fetching IPFS data for hash:', ipfsHash)
      
      // Try Pinata gateway first
      let response = await fetch(`${this.PINATA_GATEWAY}/${ipfsHash}`, {
        headers: {
          'Accept': 'application/json'
        }
      })
      
      // Fallback to public IPFS gateway if Pinata fails
      if (!response.ok) {
        console.warn('Pinata gateway failed, trying public IPFS gateway')
        response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`, {
          headers: {
            'Accept': 'application/json'
          }
        })
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch IPFS data: ${response.status} ${response.statusText}`)
      }

      const metadata = await response.json()
      console.log('✅ IPFS data retrieved successfully')
      
      return {
        success: true,
        metadata
      }
    } catch (error: any) {
      console.error('❌ IPFS retrieval failed:', error)
      return {
        success: false,
        error: error.message || 'Failed to retrieve from IPFS'
      }
    }
  }

  /**
   * Update existing metadata by creating a new IPFS entry
   */
  static async updateMetadata(
    currentIpfsHash: string,
    updates: Partial<VenueExtendedMetadata>,
    venueId: number,
    updatedBy: string
  ): Promise<{ success: boolean; ipfsHash?: string; error?: string }> {
    try {
      // Get current metadata
      let currentMetadata: VenueExtendedMetadata = {
        version: 1,
        lastUpdated: new Date().toISOString(),
        updatedBy
      }
      
      if (currentIpfsHash && currentIpfsHash.trim() !== '') {
        const { success, metadata, error } = await this.getMetadata(currentIpfsHash)
        if (success && metadata) {
          currentMetadata = metadata
        } else {
          console.warn('Could not retrieve current metadata, starting fresh:', error)
        }
      }

      // Merge updates
      const updatedMetadata: VenueExtendedMetadata = {
        ...currentMetadata,
        ...updates,
        version: (currentMetadata.version || 0) + 1,
        lastUpdated: new Date().toISOString(),
        updatedBy
      }

      // Upload new version
      return await this.uploadMetadata(updatedMetadata, venueId)
    } catch (error: any) {
      console.error('❌ IPFS update failed:', error)
      return {
        success: false,
        error: error.message || 'Failed to update IPFS metadata'
      }
    }
  }

  /**
   * Create metadata from form data
   */
  static createMetadataFromForm(
    formData: any,
    updatedBy: string
  ): VenueExtendedMetadata {
    return {
      // Basic details
      description: formData.description || '',
      fullAddress: formData.fullAddress || '',
      website: formData.website || '',
      
      // Piano details
      pianoType: formData.pianoType || '',
      pianoCondition: formData.pianoCondition || '',
      pianoBrand: formData.pianoBrand || '',
      lastTuned: formData.lastTuned || '',
      
      // Jam session details
      jamSchedule: formData.jamSchedule || '',
      jamFrequency: formData.jamFrequency || '',
      jamGenres: formData.jamGenres || [],
      
      // Operational details
      operatingHours: formData.operatingHours || '',
      wheelchairAccessible: formData.wheelchairAccessible || false,
      parkingAvailable: formData.parkingAvailable || false,
      publicTransportNear: formData.publicTransportNear || false,
      
      // Social media
      facebook: formData.facebook || '',
      instagram: formData.instagram || '',
      twitter: formData.twitter || '',
      
      // Curator fields
      curatorNotes: formData.curatorNotes || '',
      curatorRating: formData.curatorRating || 0,
      followUpNeeded: formData.followUpNeeded || false,
      specialNotes: formData.specialNotes || '',
      
      // Metadata
      version: 1,
      lastUpdated: new Date().toISOString(),
      updatedBy
    }
  }
}