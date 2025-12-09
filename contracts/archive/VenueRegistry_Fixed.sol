// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VenueRegistry {
    struct Venue {
        string name;
        string city;
        string contactInfo;
        bool hasPiano;
        bool verified;
        address submittedBy;
        uint32 timestamp;
    }
    
    mapping(uint256 => Venue) public venues;
    uint256 public venueCount;
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    // Simple 4-parameter submitVenue to match expected ABI
    function submitVenue(
        string calldata name,
        string calldata city,
        string calldata contactInfo,
        bool hasPiano
    ) external {
        require(bytes(name).length > 0, "Name required");
        require(bytes(city).length > 0, "City required");
        
        venues[venueCount] = Venue({
            name: name,
            city: city,
            contactInfo: contactInfo,
            hasPiano: hasPiano,
            verified: false,
            submittedBy: msg.sender,
            timestamp: uint32(block.timestamp)
        });
        
        venueCount++;
    }
    
    function updateVenue(
        uint256 venueId,
        string calldata newName,
        string calldata newContactInfo
    ) external onlyOwner {
        require(venueId < venueCount, "Venue not found");
        
        venues[venueId].name = newName;
        venues[venueId].contactInfo = newContactInfo;
        venues[venueId].timestamp = uint32(block.timestamp);
    }
    
    function verifyVenue(uint256 venueId, bool approved) external onlyOwner {
        require(venueId < venueCount, "Venue not found");
        venues[venueId].verified = approved;
    }
    
    function getVenueById(uint256 venueId) external view returns (Venue memory) {
        require(venueId < venueCount, "Venue not found");
        return venues[venueId];
    }
}