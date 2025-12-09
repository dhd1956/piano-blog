// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title VenueRegistry V3
 * @dev Enhanced venue registry with IPFS metadata support
 */
contract VenueRegistry {
    struct Venue {
        string name;
        string city;
        string contactInfo;
        string contactType;
        string ipfsHash;        // Stores extended metadata on IPFS
        address submittedBy;
        uint32 timestamp;
        bool hasPiano;
        bool hasJamSession;
        bool verified;
        uint8 venueType;
    }

    address public owner;
    Venue[] public venues;
    uint256 public venueCount;

    event VenueSubmitted(uint256 indexed venueId, address indexed submitter, string name, string ipfsHash);
    event VenueVerified(uint256 indexed venueId, address indexed verifier, bool approved);
    event VenueUpdated(uint256 indexed venueId, address indexed updater, string newName, string newContactInfo);
    event IPFSHashUpdated(uint256 indexed venueId, address indexed updater, string newIPFSHash);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    /**
     * @dev Submit a new venue
     */
    function submitVenue(
        string memory name,
        string memory city, 
        string memory contactInfo,
        string memory contactType,
        string memory ipfsHash,
        bool hasPiano,
        bool hasJamSession,
        uint8 venueType
    ) public {
        venues.push(Venue({
            name: name,
            city: city,
            contactInfo: contactInfo,
            contactType: contactType,
            ipfsHash: ipfsHash,
            submittedBy: msg.sender,
            timestamp: uint32(block.timestamp),
            hasPiano: hasPiano,
            hasJamSession: hasJamSession,
            verified: false,
            venueType: venueType
        }));

        emit VenueSubmitted(venueCount, msg.sender, name, ipfsHash);
        venueCount++;
    }

    /**
     * @dev Update venue basic info (owner only)
     */
    function updateVenue(
        uint256 venueId,
        string memory newName,
        string memory newContactInfo
    ) public onlyOwner {
        require(venueId < venueCount, "Venue does not exist");
        
        venues[venueId].name = newName;
        venues[venueId].contactInfo = newContactInfo;
        
        emit VenueUpdated(venueId, msg.sender, newName, newContactInfo);
    }

    /**
     * @dev Update venue IPFS hash for extended metadata (owner only)
     */
    function updateIPFSHash(
        uint256 venueId,
        string memory newIPFSHash
    ) public onlyOwner {
        require(venueId < venueCount, "Venue does not exist");
        
        venues[venueId].ipfsHash = newIPFSHash;
        
        emit IPFSHashUpdated(venueId, msg.sender, newIPFSHash);
    }

    /**
     * @dev Update venue basic info AND IPFS hash in one transaction (owner only)
     */
    function updateVenueWithIPFS(
        uint256 venueId,
        string memory newName,
        string memory newContactInfo,
        string memory newIPFSHash
    ) public onlyOwner {
        require(venueId < venueCount, "Venue does not exist");
        
        venues[venueId].name = newName;
        venues[venueId].contactInfo = newContactInfo;
        venues[venueId].ipfsHash = newIPFSHash;
        
        emit VenueUpdated(venueId, msg.sender, newName, newContactInfo);
        emit IPFSHashUpdated(venueId, msg.sender, newIPFSHash);
    }

    /**
     * @dev Verify a venue (owner only)
     */
    function verifyVenue(uint256 venueId, bool approved) public onlyOwner {
        require(venueId < venueCount, "Venue does not exist");
        venues[venueId].verified = approved;
        emit VenueVerified(venueId, msg.sender, approved);
    }

    /**
     * @dev Get venue by ID
     */
    function getVenueById(uint256 venueId) public view returns (Venue memory) {
        require(venueId < venueCount, "Venue does not exist");
        return venues[venueId];
    }

    /**
     * @dev Get all venues (for small datasets)
     */
    function getAllVenues() public view returns (Venue[] memory) {
        return venues;
    }

    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}