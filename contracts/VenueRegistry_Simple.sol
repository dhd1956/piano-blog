// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VenueRegistry {
    struct Venue {
        string name;
        string city;
        string contactInfo;
        string contactType;
        string ipfsHash;
        address submittedBy;
        uint32 timestamp;
        bool hasPiano;
        bool hasJamSession;
        bool verified;
        uint8 venueType;
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
        string calldata ipfsHash,
        bool hasPiano,
        bool hasJamSession,
        uint8 venueType
    ) external {
        require(bytes(name).length > 0, "Name required");
        require(bytes(city).length > 0, "City required");
        
        venues[venueCount] = Venue({
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
        });
        
        venuesByCity[city].push(venueCount);
        venueCount++;
    }
    
    function updateVenue(
        uint256 venueId,
        string calldata newName,
        string calldata newContactInfo,
        string calldata newContactType,
        string calldata newIpfsHash
    ) external onlyOwner {
        require(venueId < venueCount, "Venue not found");
        
        venues[venueId].name = newName;
        venues[venueId].contactInfo = newContactInfo;
        venues[venueId].contactType = newContactType;
        venues[venueId].ipfsHash = newIpfsHash;
        venues[venueId].timestamp = uint32(block.timestamp);
    }
    
    function verifyVenue(uint256 venueId, bool approved) external onlyOwner {
        require(venueId < venueCount, "Venue not found");
        venues[venueId].verified = approved;
        venues[venueId].timestamp = uint32(block.timestamp);
    }
    
    function getVenueById(uint256 venueId) external view returns (Venue memory) {
        require(venueId < venueCount, "Venue not found");
        return venues[venueId];
    }
    
    function getVenuesByCity(string calldata city) external view returns (uint256[] memory) {
        return venuesByCity[city];
    }
}