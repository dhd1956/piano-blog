// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title VenueRegistryEnhanced - Multi-Curator Venue Management with Editing
 * @dev Enhanced venue registry with curator permissions and uniqueness checks
 */
contract VenueRegistryEnhanced is Ownable, ReentrancyGuard {
    
    struct Venue {
        // Core venue data
        bool hasPiano;
        bool hasJamSession;
        bool verified;
        uint8 venueType;
        address submittedBy;
        address verifiedBy;
        address lastUpdatedBy;
        
        // Venue information
        string name;
        string city;
        string fullAddress;
        string contactType;
        string contactInfo;
        string ipfsHash;
        
        // Timestamps
        uint32 submissionTimestamp;
        uint32 verificationTimestamp;
        uint32 lastUpdatedTimestamp;
        
        // Verification notes
        string curatorNotes;
    }
    
    // State variables
    mapping(uint256 => Venue) public venues;
    mapping(string => uint256[]) public venuesByCity;
    mapping(address => uint256[]) public venuesBySubmitter;
    mapping(address => bool) public authorizedCurators;
    mapping(bytes32 => bool) public venueExists; // uniqueness tracking
    mapping(uint256 => bytes32) public venueHashes; // venue ID to hash
    mapping(address => uint256) public contributorRewards;
    mapping(address => uint256) public curatorVerifications;
    
    uint256 public venueCount;
    IERC20 public rewardToken;
    uint256 public baseReward = 1 * 10**18;
    uint256 public curatorReward = 0.5 * 10**18;
    
    // Events
    event VenueSubmitted(
        uint256 indexed venueId,
        address indexed submitter,
        string name,
        string city,
        bytes32 venueHash
    );
    
    event VenueVerified(
        uint256 indexed venueId,
        address indexed curator,
        bool approved,
        uint256 rewardAmount
    );
    
    event VenueUpdated(
        uint256 indexed venueId,
        address indexed curator,
        string notes
    );
    
    event CuratorAdded(address indexed curator);
    event CuratorRemoved(address indexed curator);
    
    // Custom errors
    error VenueNotFound();
    error VenueAlreadyExists();
    error NotAuthorizedCurator();
    error VenueAlreadyVerified();
    error EmptyString();
    error DuplicateVenue();
    
    modifier onlyCurator() {
        if (!authorizedCurators[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedCurator();
        }
        _;
    }
    
    constructor(address _rewardToken) Ownable(msg.sender) {
        require(_rewardToken != address(0), "Invalid token address");
        rewardToken = IERC20(_rewardToken);
        
        // Owner is automatically a curator
        authorizedCurators[msg.sender] = true;
    }
    
    /**
     * @dev Add a new curator
     */
    function addCurator(address curator) external onlyOwner {
        require(curator != address(0), "Invalid curator address");
        authorizedCurators[curator] = true;
        emit CuratorAdded(curator);
    }
    
    /**
     * @dev Remove a curator
     */
    function removeCurator(address curator) external onlyOwner {
        authorizedCurators[curator] = false;
        emit CuratorRemoved(curator);
    }
    
    /**
     * @dev Create unique hash for venue (name + address)
     */
    function createVenueHash(string memory name, string memory fullAddress) 
        public 
        pure 
        returns (bytes32) 
    {
        return keccak256(abi.encodePacked(
            _toLower(name),
            _toLower(fullAddress)
        ));
    }
    
    /**
     * @dev Simple lowercase conversion for uniqueness checking
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
    
    /**
     * @dev Submit a new venue
     */
    function submitVenue(Venue memory venue) external {
        if (bytes(venue.name).length == 0) revert EmptyString();
        if (bytes(venue.fullAddress).length == 0) revert EmptyString();
        
        // Check for uniqueness
        bytes32 venueHash = createVenueHash(venue.name, venue.fullAddress);
        if (venueExists[venueHash]) revert VenueAlreadyExists();
        
        // Set submission data
        venue.submittedBy = msg.sender;
        venue.submissionTimestamp = uint32(block.timestamp);
        venue.verified = false;
        venue.verifiedBy = address(0);
        venue.lastUpdatedBy = msg.sender;
        venue.lastUpdatedTimestamp = uint32(block.timestamp);
        
        uint256 venueId = venueCount++;
        venues[venueId] = venue;
        venueHashes[venueId] = venueHash;
        venueExists[venueHash] = true;
        
        // Index by city and submitter
        venuesByCity[venue.city].push(venueId);
        venuesBySubmitter[msg.sender].push(venueId);
        
        emit VenueSubmitted(venueId, msg.sender, venue.name, venue.city, venueHash);
    }
    
    /**
     * @dev Verify a venue (curator only)
     */
    function verifyVenue(
        uint256 venueId, 
        bool approved, 
        string memory curatorNotes,
        uint256 bonusReward
    ) external onlyCurator {
        if (venueId >= venueCount) revert VenueNotFound();
        if (venues[venueId].verified) revert VenueAlreadyVerified();
        
        Venue storage venue = venues[venueId];
        venue.verified = approved;
        venue.verifiedBy = msg.sender;
        venue.verificationTimestamp = uint32(block.timestamp);
        venue.curatorNotes = curatorNotes;
        venue.lastUpdatedBy = msg.sender;
        venue.lastUpdatedTimestamp = uint32(block.timestamp);
        
        uint256 totalReward = 0;
        
        if (approved) {
            // Reward submitter
            totalReward = baseReward + bonusReward;
            address contributor = venue.submittedBy;
            
            if (rewardToken.balanceOf(address(this)) >= totalReward) {
                rewardToken.transfer(contributor, totalReward);
                contributorRewards[contributor] += totalReward;
            }
            
            // Reward curator
            if (rewardToken.balanceOf(address(this)) >= curatorReward) {
                rewardToken.transfer(msg.sender, curatorReward);
                curatorVerifications[msg.sender]++;
            }
        } else {
            // Remove from uniqueness tracking if rejected
            venueExists[venueHashes[venueId]] = false;
        }
        
        emit VenueVerified(venueId, msg.sender, approved, totalReward);
    }
    
    /**
     * @dev Update venue information (curator only)
     */
    function updateVenueInfo(
        uint256 venueId,
        string memory newName,
        string memory newFullAddress,
        string memory newContactInfo,
        string memory newContactType,
        string memory updateNotes
    ) external onlyCurator {
        if (venueId >= venueCount) revert VenueNotFound();
        
        Venue storage venue = venues[venueId];
        
        // Check for uniqueness if name or address changed
        bool nameChanged = keccak256(bytes(newName)) != keccak256(bytes(venue.name));
        bool addressChanged = keccak256(bytes(newFullAddress)) != keccak256(bytes(venue.fullAddress));
        
        if (nameChanged || addressChanged) {
            bytes32 newHash = createVenueHash(newName, newFullAddress);
            if (venueExists[newHash] && newHash != venueHashes[venueId]) {
                revert DuplicateVenue();
            }
            
            // Update uniqueness tracking
            venueExists[venueHashes[venueId]] = false;
            venueExists[newHash] = true;
            venueHashes[venueId] = newHash;
        }
        
        // Update venue information
        venue.name = newName;
        venue.fullAddress = newFullAddress;
        venue.contactInfo = newContactInfo;
        venue.contactType = newContactType;
        venue.lastUpdatedBy = msg.sender;
        venue.lastUpdatedTimestamp = uint32(block.timestamp);
        
        // Append to curator notes
        if (bytes(updateNotes).length > 0) {
            venue.curatorNotes = string(abi.encodePacked(
                venue.curatorNotes,
                " | Update: ",
                updateNotes
            ));
        }
        
        emit VenueUpdated(venueId, msg.sender, updateNotes);
    }
    
    /**
     * @dev Get venue by ID
     */
    function getVenueById(uint256 venueId) external view returns (Venue memory) {
        if (venueId >= venueCount) revert VenueNotFound();
        return venues[venueId];
    }
    
    /**
     * @dev Get venues by city
     */
    function getVenuesByCity(string memory city) external view returns (uint256[] memory) {
        return venuesByCity[city];
    }
    
    /**
     * @dev Get pending venues for curator review
     */
    function getPendingVenues() external view returns (uint256[] memory) {
        uint256[] memory pendingIds = new uint256[](venueCount);
        uint256 count = 0;
        
        for (uint256 i = 0; i < venueCount; i++) {
            if (!venues[i].verified) {
                pendingIds[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pendingIds[i];
        }
        
        return result;
    }
    
    /**
     * @dev Check if venue name/address combination exists
     */
    function checkVenueExists(string memory name, string memory fullAddress) 
        external 
        view 
        returns (bool) 
    {
        bytes32 venueHash = createVenueHash(name, fullAddress);
        return venueExists[venueHash];
    }
    
    /**
     * @dev Get curator stats
     */
    function getCuratorStats(address curator) 
        external 
        view 
        returns (bool isAuthorized, uint256 verificationsCount) 
    {
        return (authorizedCurators[curator], curatorVerifications[curator]);
    }
    
    /**
     * @dev Admin functions
     */
    function setBaseReward(uint256 newReward) external onlyOwner {
        baseReward = newReward;
    }
    
    function setCuratorReward(uint256 newReward) external onlyOwner {
        curatorReward = newReward;
    }
    
    function withdrawTokens(uint256 amount) external onlyOwner nonReentrant {
        require(rewardToken.balanceOf(address(this)) >= amount, "Insufficient balance");
        rewardToken.transfer(owner(), amount);
    }
}
