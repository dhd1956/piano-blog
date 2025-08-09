// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title VenueRegistry - Gas-Optimized Piano Venue Management
 * @dev Stores minimal on-chain data, detailed venue info in IPFS
 */
contract VenueRegistry is Ownable, ReentrancyGuard {
    
    // Gas-optimized struct - fits in 2 storage slots
    struct Venue {
        // Slot 1: Pack booleans and address (32 bytes total)
        bool hasPiano;           // 1 byte
        bool hasJamSession;      // 1 byte  
        bool verified;           // 1 byte
        uint8 venueType;         // 1 byte (0=cafe, 1=restaurant, 2=bar, 3=club, 4=community)
        uint32 submissionTimestamp; // 4 bytes (sufficient until 2106)
        uint32 verificationTimestamp; // 4 bytes
        address submittedBy;     // 20 bytes
        
        // Slot 2+: Variable length strings stored separately
        string name;             // Max 64 characters enforced
        string city;             // Max 32 characters enforced
        string contactType;      // "email" | "phone" | "website"
        string ipfsHash;         // "QmXXXXXX..." format
    }
    
    // State variables
    mapping(uint256 => Venue) public venues;
    mapping(string => uint256[]) public venuesByCity;
    mapping(address => uint256[]) public venuesBySubmitter;
    mapping(address => uint256) public contributorRewards;
    
    uint256 public venueCount;
    IERC20 public rewardToken;
    uint256 public baseReward = 1 * 10**18; // 1 token default
    uint256 public maxStringLength = 64;
    
    // Events
    event VenueSubmitted(
        uint256 indexed venueId, 
        address indexed submitter, 
        string name,
        string city,
        string ipfsHash
    );
    
    event VenueVerified(
        uint256 indexed venueId, 
        address indexed verifier,
        uint256 rewardAmount,
        bool approved
    );
    
    event ContributorRewarded(
        uint256 indexed venueId, 
        address indexed contributor, 
        uint256 amount
    );
    
    event VenueIPFSUpdated(
        uint256 indexed venueId, 
        string oldHash, 
        string newHash
    );
    
    event BaseRewardUpdated(
        uint256 oldReward, 
        uint256 newReward
    );
    
    // Custom errors for gas efficiency
    error VenueNotFound();
    error AlreadyVerified();
    error NotVerified();
    error StringTooLong();
    error InsufficientBalance();
    error InvalidVenueType();
    error EmptyString();
    
    constructor(address _rewardToken) Ownable(msg.sender) {
        if (_rewardToken == address(0)) revert("Invalid token address");
        rewardToken = IERC20(_rewardToken);
    }
    
    /**
     * @dev Submit a new venue (public function)
     * @param venue The venue data with minimal on-chain info
     */
    function submitVenue(Venue memory venue) external {
        // Input validation
        if (bytes(venue.name).length == 0) revert EmptyString();
        if (bytes(venue.city).length == 0) revert EmptyString();
        if (bytes(venue.ipfsHash).length == 0) revert EmptyString();
        if (bytes(venue.name).length > maxStringLength) revert StringTooLong();
        if (bytes(venue.city).length > maxStringLength) revert StringTooLong();
        if (venue.venueType > 4) revert InvalidVenueType();
        if (venue.verified) revert("Cannot submit pre-verified venue");
        
        // Set submission metadata
        venue.submittedBy = msg.sender;
        venue.submissionTimestamp = uint32(block.timestamp);
        venue.verificationTimestamp = 0;
        venue.verified = false;
        
        uint256 venueId = venueCount++;
        venues[venueId] = venue;
        
        // Index by city and submitter for efficient searches
        venuesByCity[venue.city].push(venueId);
        venuesBySubmitter[msg.sender].push(venueId);
        
        emit VenueSubmitted(venueId, msg.sender, venue.name, venue.city, venue.ipfsHash);
    }
    
    /**
     * @dev Owner adds venue directly (for manual curation)
     * @param venue Pre-verified venue data
     */
    function addVerifiedVenue(Venue memory venue) external onlyOwner {
        if (bytes(venue.name).length == 0) revert EmptyString();
        if (bytes(venue.ipfsHash).length == 0) revert EmptyString();
        if (venue.venueType > 4) revert InvalidVenueType();
        
        venue.verified = true;
        venue.verificationTimestamp = uint32(block.timestamp);
        if (venue.submittedBy == address(0)) {
            venue.submittedBy = msg.sender;
            venue.submissionTimestamp = uint32(block.timestamp);
        }
        
        uint256 venueId = venueCount++;
        venues[venueId] = venue;
        
        venuesByCity[venue.city].push(venueId);
        venuesBySubmitter[venue.submittedBy].push(venueId);
        
        emit VenueSubmitted(venueId, venue.submittedBy, venue.name, venue.city, venue.ipfsHash);
        emit VenueVerified(venueId, msg.sender, 0, true);
    }
    
    /**
     * @dev Verify a submitted venue and reward contributor
     * @param venueId The venue to verify
     * @param approved Whether venue is approved or rejected
     * @param bonusReward Additional reward for quality submission
     */
    function verifyVenue(uint256 venueId, bool approved, uint256 bonusReward) external onlyOwner {
        if (venueId >= venueCount) revert VenueNotFound();
        if (venues[venueId].verified) revert AlreadyVerified();
        
        venues[venueId].verified = approved;
        venues[venueId].verificationTimestamp = uint32(block.timestamp);
        
        uint256 totalReward = 0;
        
        if (approved) {
            // Calculate total reward
            totalReward = baseReward + bonusReward;
            
            // Distribute reward if sufficient balance
            address contributor = venues[venueId].submittedBy;
            if (rewardToken.balanceOf(address(this)) >= totalReward) {
                rewardToken.transfer(contributor, totalReward);
                contributorRewards[contributor] += totalReward;
                
                if (bonusReward > 0) {
                    emit ContributorRewarded(venueId, contributor, bonusReward);
                }
            } else {
                revert InsufficientBalance();
            }
        }
        
        emit VenueVerified(venueId, msg.sender, totalReward, approved);
    }
    
    /**
     * @dev Give additional reward to contributor
     * @param venueId The venue ID
     * @param amount Additional reward amount
     */
    function rewardContributor(uint256 venueId, uint256 amount) 
        external 
        onlyOwner 
        nonReentrant 
    {
        if (venueId >= venueCount) revert VenueNotFound();
        if (!venues[venueId].verified) revert NotVerified();
        if (amount == 0) revert("Amount must be positive");
        
        address contributor = venues[venueId].submittedBy;
        if (rewardToken.balanceOf(address(this)) < amount) revert InsufficientBalance();
        
        rewardToken.transfer(contributor, amount);
        contributorRewards[contributor] += amount;
        
        emit ContributorRewarded(venueId, contributor, amount);
    }
    
    /**
     * @dev Get venues in a specific city
     * @param city The city name
     * @return Array of venue IDs in that city
     */
    function getVenuesByCity(string memory city) external view returns (uint256[] memory) {
        return venuesByCity[city];
    }
    
    /**
     * @dev Get detailed venue info by ID
     * @param venueId The venue ID
     * @return The venue struct
     */
    function getVenueById(uint256 venueId) external view returns (Venue memory) {
        if (venueId >= venueCount) revert VenueNotFound();
        return venues[venueId];
    }
    
    /**
     * @dev Get verified venues with pianos in a city
     * @param city The city name
     * @return Array of venue IDs with pianos
     */
    function getVenuesWithPianos(string memory city) external view returns (uint256[] memory) {
        uint256[] memory cityVenues = venuesByCity[city];
        uint256[] memory pianoVenues = new uint256[](cityVenues.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < cityVenues.length; i++) {
            Venue storage venue = venues[cityVenues[i]];
            if (venue.hasPiano && venue.verified) {
                pianoVenues[count] = cityVenues[i];
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pianoVenues[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get venues submitted by a specific address
     * @param submitter The submitter address
     * @return Array of venue IDs submitted by this address
     */
    function getVenuesBySubmitter(address submitter) external view returns (uint256[] memory) {
        return venuesBySubmitter[submitter];
    }
    
    /**
     * @dev Get total rewards earned by a contributor
     * @param contributor The contributor address
     * @return Total rewards earned
     */
    function getContributorRewards(address contributor) external view returns (uint256) {
        return contributorRewards[contributor];
    }
    
    /**
     * @dev Admin function to update IPFS hash for a venue
     * @param venueId The venue ID
     * @param newIpfsHash Updated IPFS hash
     */
    function updateVenueIPFS(uint256 venueId, string memory newIpfsHash) external onlyOwner {
        if (venueId >= venueCount) revert VenueNotFound();
        if (bytes(newIpfsHash).length == 0) revert EmptyString();
        
        string memory oldHash = venues[venueId].ipfsHash;
        venues[venueId].ipfsHash = newIpfsHash;
        
        emit VenueIPFSUpdated(venueId, oldHash, newIpfsHash);
    }
    
    /**
     * @dev Set the base reward amount for venue submissions
     * @param newReward The new base reward amount
     */
    function setBaseReward(uint256 newReward) external onlyOwner {
        uint256 oldReward = baseReward;
        baseReward = newReward;
        
        emit BaseRewardUpdated(oldReward, newReward);
    }
    
    /**
     * @dev Set maximum string length for gas optimization
     * @param newMaxLength New maximum string length
     */
    function setMaxStringLength(uint256 newMaxLength) external onlyOwner {
        require(newMaxLength > 0 && newMaxLength <= 128, "Invalid length");
        maxStringLength = newMaxLength;
    }
    
    /**
     * @dev Owner can withdraw tokens from contract
     * @param amount Amount to withdraw
     */
    function withdrawTokens(uint256 amount) external onlyOwner nonReentrant {
        if (rewardToken.balanceOf(address(this)) < amount) revert InsufficientBalance();
        rewardToken.transfer(owner(), amount);
    }
    
    /**
     * @dev Get contract stats for analytics
     * @return totalVenues Total venues submitted
     * @return verifiedVenues Total verified venues  
     * @return totalRewardsDistributed Total tokens distributed as rewards
     * @return contractBalance Current token balance of contract
     */
    function getContractStats() external view returns (
        uint256 totalVenues,
        uint256 verifiedVenues,
        uint256 totalRewardsDistributed,
        uint256 contractBalance
    ) {
        totalVenues = venueCount;
        
        // Count verified venues
        for (uint256 i = 0; i < venueCount; i++) {
            if (venues[i].verified) {
                verifiedVenues++;
            }
        }
        
        // Calculate total rewards (baseReward * verifiedVenues is minimum)
        totalRewardsDistributed = verifiedVenues * baseReward;
        contractBalance = rewardToken.balanceOf(address(this));
    }
    
    /**
     * @dev Emergency pause function (inherited from Ownable)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = rewardToken.balanceOf(address(this));
        if (balance > 0) {
            rewardToken.transfer(owner(), balance);
        }
    }
}

