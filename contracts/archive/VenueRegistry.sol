
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
        string memory name,
        string memory city,
        string memory contactInfo,
        string memory contactType,
        bool hasPiano,
        bool hasJamSession,
        uint8 venueType,
        string memory ipfsHash
    ) external {
        require(bytes(name).length > 0, "Name required");
        require(bytes(city).length > 0, "City required");
        
        uint256 venueId = venueCount++;
        venues[venueId] = Venue({
            name: name,
            city: city,
            contactInfo: contactInfo,
            contactType: contactType,
            hasPiano: hasPiano,
            hasJamSession: hasJamSession,
            verified: false,
            venueType: venueType,
            submittedBy: msg.sender,
            verifiedBy: address(0),
            lastUpdatedBy: msg.sender,
            submissionTimestamp: uint32(block.timestamp),
            verificationTimestamp: 0,
            lastUpdatedTimestamp: uint32(block.timestamp),
            ipfsHash: ipfsHash,
            curatorNotes: ""
        });
        
        venuesByCity[city].push(venueId);
    }
    
    function updateVenue(
        uint256 venueId,
        string memory newName,
        string memory newContactInfo,
        string memory newContactType,
        string memory newIpfsHash
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
    
    function verifyVenue(uint256 venueId, bool approved, string memory notes) external onlyOwner {
        require(venueId < venueCount, "Venue not found");
        
        venues[venueId].verified = approved;
        venues[venueId].verifiedBy = msg.sender;
        venues[venueId].verificationTimestamp = uint32(block.timestamp);
        venues[venueId].curatorNotes = notes;
    }
    
    function getVenueById(uint256 venueId) external view returns (Venue memory) {
        require(venueId < venueCount, "Venue not found");
        return venues[venueId];
    }
    
    function getVenuesByCity(string memory city) external view returns (uint256[] memory) {
        return venuesByCity[city];
    }
}
