// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title VenueRegistryV2 - User-Friendly Piano Venue Management
 * @dev Balances gas efficiency with UX by storing key user-facing data on-chain
 */
contract VenueRegistryV2 is Ownable, ReentrancyGuard {
    
    struct Venue {
        // User-facing data (on-chain for immediate updates)
        string name;              // Users expect to see changes
        string city;              // For searching/filtering  
        string contactInfo;       // Key user information
        string contactType;       // email/phone/website
        bool hasPiano;           // Core feature flag
        bool hasJamSession;      // Core feature flag
        bool verified;           // Trust indicator
        uint8 venueType;         // Cafe/Restaurant/Bar/etc
        
        // Metadata
        address submittedBy;
        address verifiedBy;
        address lastUpdatedBy;
        uint32 submissionTimestamp;
        uint32 verificationTimestamp; 
        uint32 lastUpdatedTimestamp;
        
        // Extended details (IPFS for rich content)
        string ipfsHash;         // Full address, photos, hours, reviews
        string curatorNotes;     // Private curator notes
    }
    
    mapping(uint256 => Venue) public venues;
    mapping(string => uint256[]) public venuesByCity;
    mapping(address => uint256[]) public venuesBySubmitter;
    mapping(bytes32 => bool) public venueExists; // Prevent duplicates
    
    uint256 public venueCount;
    
    // Events
    event VenueSubmitted(uint256 indexed venueId, address indexed submitter, string name, string city);
    event VenueVerified(uint256 indexed venueId, address indexed curator, bool approved);
    event VenueUpdated(uint256 indexed venueId, address indexed updater, string updateType);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Submit new venue - stores key data on-chain
     */
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
        require(venueType <= 4, "Invalid venue type");
        
        // Check for duplicates
        bytes32 venueKey = keccak256(abi.encodePacked(
            _toLower(name), 
            _toLower(city)
        ));
        require(!venueExists[venueKey], "Venue already exists");
        
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
        
        venueExists[venueKey] = true;
        venuesByCity[city].push(venueId);
        venuesBySubmitter[msg.sender].push(venueId);
        
        emit VenueSubmitted(venueId, msg.sender, name, city);
    }
    
    /**
     * @dev Update venue - now updates visible data immediately
     */
    function updateVenue(
        uint256 venueId,
        string memory newName,
        string memory newContactInfo,
        string memory newContactType,
        string memory newIpfsHash,
        string memory updateNotes
    ) external onlyOwner {
        require(venueId < venueCount, "Venue not found");
        
        Venue storage venue = venues[venueId];
        
        // Update user-visible data immediately
        venue.name = newName;
        venue.contactInfo = newContactInfo;
        venue.contactType = newContactType;
        venue.ipfsHash = newIpfsHash;
        venue.lastUpdatedBy = msg.sender;
        venue.lastUpdatedTimestamp = uint32(block.timestamp);
        
        // Append to curator notes
        if (bytes(updateNotes).length > 0) {
            venue.curatorNotes = string(abi.encodePacked(
                venue.curatorNotes,
                " | ",
                block.timestamp,
                ": ",
                updateNotes
            ));
        }
        
        emit VenueUpdated(venueId, msg.sender, "info_update");
    }
    
    /**
     * @dev Verify venue
     */
    function verifyVenue(uint256 venueId, bool approved, string memory notes) external onlyOwner {
        require(venueId < venueCount, "Venue not found");
        require(!venues[venueId].verified, "Already verified");
        
        venues[venueId].verified = approved;
        venues[venueId].verifiedBy = msg.sender;
        venues[venueId].verificationTimestamp = uint32(block.timestamp);
        venues[venueId].curatorNotes = notes;
        
        emit VenueVerified(venueId, msg.sender, approved);
    }
    
    /**
     * @dev Get venue by ID
     */
    function getVenueById(uint256 venueId) external view returns (Venue memory) {
        require(venueId < venueCount, "Venue not found");
        return venues[venueId];
    }
    
    /**
     * @dev Get venues by city
     */
    function getVenuesByCity(string memory city) external view returns (uint256[] memory) {
        return venuesByCity[city];
    }
    
    /**
     * @dev Get venues with pianos in city
     */
    function getVenuesWithPianos(string memory city) external view returns (uint256[] memory) {
        uint256[] memory cityVenues = venuesByCity[city];
        uint256[] memory pianoVenues = new uint256[](cityVenues.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < cityVenues.length; i++) {
            if (venues[cityVenues[i]].hasPiano) {
                pianoVenues[count] = cityVenues[i];
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pianoVenues[i];
        }
        return result;
    }
    
    /**
     * @dev Simple lowercase conversion
     */
    function _toLower(string memory str) internal pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            if ((uint8(bStr[i]) >= 65) && (uint8(bStr[i]) <= 90)) {
                bLower[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        return string(bLower);
    }
}