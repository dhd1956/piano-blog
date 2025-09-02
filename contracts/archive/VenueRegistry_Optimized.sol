// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VenueRegistry {
    struct Venue {
        string name;
        string city;
        string contactInfo;
        string contactType;
        bool hasPiano;
        bool hasJamSession;
        bool verified;
        uint8 venueType;
        address submittedBy;
        address verifiedBy;
        address lastUpdatedBy;
        uint32 submissionTimestamp;
        uint32 verificationTimestamp;
        uint32 lastUpdatedTimestamp;
        string ipfsHash;
        string curatorNotes;
    }
    
    mapping(uint256 => Venue) public venues;
    mapping(string => uint256[]) public venuesByCity;
    uint256 public venueCount;
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function submitVenue(
        string calldata name,
        string calldata city,
        string calldata contactInfo,
        string calldata contactType,
        bool hasPiano,
        bool hasJamSession,
        uint8 venueType,
        string calldata ipfsHash
    ) external {
        require(bytes(name).length > 0, "Name required");
        require(bytes(city).length > 0, "City required");
        
        uint256 venueId = venueCount;
        venueCount = venueId + 1;
        
        // Create venue in storage directly to avoid stack issues
        Venue storage newVenue = venues[venueId];
        newVenue.name = name;
        newVenue.city = city;
        newVenue.contactInfo = contactInfo;
        newVenue.contactType = contactType;
        newVenue.hasPiano = hasPiano;
        newVenue.hasJamSession = hasJamSession;
        newVenue.verified = false;
        newVenue.venueType = venueType;
        newVenue.submittedBy = msg.sender;
        newVenue.verifiedBy = address(0);
        newVenue.lastUpdatedBy = msg.sender;
        newVenue.submissionTimestamp = uint32(block.timestamp);
        newVenue.verificationTimestamp = 0;
        newVenue.lastUpdatedTimestamp = uint32(block.timestamp);
        newVenue.ipfsHash = ipfsHash;
        newVenue.curatorNotes = "";
        
        venuesByCity[city].push(venueId);
    }
    
    function updateVenue(
        uint256 venueId,
        string calldata newName,
        string calldata newContactInfo,
        string calldata newContactType,
        string calldata newIpfsHash
    ) external onlyOwner {
        require(venueId < venueCount, "Venue not found");
        
        Venue storage venue = venues[venueId];
        venue.name = newName;
        venue.contactInfo = newContactInfo;
        venue.contactType = newContactType;
        venue.ipfsHash = newIpfsHash;
        venue.lastUpdatedBy = msg.sender;
        venue.lastUpdatedTimestamp = uint32(block.timestamp);
    }
    
    function verifyVenue(
        uint256 venueId, 
        bool approved, 
        string calldata notes
    ) external onlyOwner {
        require(venueId < venueCount, "Venue not found");
        
        Venue storage venue = venues[venueId];
        venue.verified = approved;
        venue.verifiedBy = msg.sender;
        venue.verificationTimestamp = uint32(block.timestamp);
        venue.curatorNotes = notes;
    }
    
    function getVenueById(uint256 venueId) external view returns (Venue memory) {
        require(venueId < venueCount, "Venue not found");
        return venues[venueId];
    }
    
    function getVenuesByCity(string calldata city) external view returns (uint256[] memory) {
        return venuesByCity[city];
    }
}