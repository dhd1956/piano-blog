// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Minimal interface to call burn() on the PXP token contract
interface IPXPToken is IERC20 {
    function burn(uint256 amount) external;
}

/**
 * @title PXP Rewards Contract
 * @dev Simplified contract focused only on PXP token rewards and payment tracking
 * All venue data is stored off-chain in PostgreSQL for performance
 */
contract PXPRewards is Ownable, ReentrancyGuard {
    IPXPToken public immutable pxpToken;

    // Reward amounts (in PXP tokens with 18 decimals) - Now configurable!
    uint256 public newUserReward = 25 * 10**18;      // 25 PXP
    uint256 public scoutReward = 50 * 10**18;         // 50 PXP
    uint256 public verifierReward = 25 * 10**18;      // 25 PXP

    // Reward limits for validation (1-1000 PXP)
    uint256 public constant MIN_REWARD = 1 * 10**18;
    uint256 public constant MAX_REWARD = 1000 * 10**18;

    // Verification requirements
    uint256 public constant MIN_VERIFICATIONS = 2;
    uint256 public constant MAX_VERIFICATIONS = 3;

    // Tipping with burn
    uint256 public burnRateBps = 1000; // 10% in basis points (1000/10000)
    uint256 public totalBurned;        // Cumulative PXP burned (18 decimals)

    // Authorized verifiers (curators)
    mapping(address => bool) public authorizedVerifiers;

    // Track user rewards to prevent double-claiming
    mapping(address => bool) public hasClaimedNewUserReward;
    mapping(bytes32 => bool) public venueVerificationPaid;
    mapping(bytes32 => uint256) public venueVerificationCount;
    mapping(bytes32 => mapping(address => bool)) public hasVerified;

    // Events
    event NewUserRewarded(address indexed user, uint256 amount);
    event ScoutRewarded(address indexed scout, bytes32 indexed venueHash, uint256 amount);
    event VerifierRewarded(address indexed verifier, bytes32 indexed venueHash, uint256 amount);
    event VenueVerified(bytes32 indexed venueHash, address indexed verifier, bool approved);
    event PaymentTracked(address indexed from, address indexed to, uint256 amount, string memo);
    event VerifierStatusUpdated(address indexed verifier, bool authorized);
    event RewardAmountUpdated(string indexed rewardType, uint256 oldAmount, uint256 newAmount);
    event TipWithBurn(address indexed from, address indexed to, uint256 recipientAmount, uint256 burnAmount);
    event BurnRateUpdated(uint256 oldBps, uint256 newBps);

    constructor(address _pxpToken) Ownable(msg.sender) {
        pxpToken = IPXPToken(_pxpToken);
    }

    /**
     * @dev Tip another user with a 10% burn (configurable via burnRateBps).
     *      Caller must first approve this contract to spend `amount` PXP.
     * @param recipient Address to receive the tip (minus burn)
     * @param amount Total PXP to deduct from sender (recipient gets amount * (1 - burnRate))
     */
    function tipWithBurn(address recipient, uint256 amount) external nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(recipient != msg.sender, "Cannot tip yourself");
        require(amount > 0, "Amount must be > 0");

        uint256 burnAmount = (amount * burnRateBps) / 10000;
        uint256 recipientAmount = amount - burnAmount;

        // Pull full amount from sender into this contract
        require(pxpToken.transferFrom(msg.sender, address(this), amount), "TransferFrom failed");

        // Forward recipient's share
        require(pxpToken.transfer(recipient, recipientAmount), "Recipient transfer failed");

        // Burn our share (we are msg.sender in the burn call, so _burn targets our balance)
        pxpToken.burn(burnAmount);
        totalBurned += burnAmount;

        emit TipWithBurn(msg.sender, recipient, recipientAmount, burnAmount);
    }

    /**
     * @dev Update the burn rate. Max 30% (3000 bps). Owner only.
     */
    function setBurnRate(uint256 bps) external onlyOwner {
        require(bps <= 3000, "Burn rate exceeds 30%");
        emit BurnRateUpdated(burnRateBps, bps);
        burnRateBps = bps;
    }

    function claimNewUserReward() external nonReentrant {
        require(!hasClaimedNewUserReward[msg.sender], "Already claimed");
        require(pxpToken.balanceOf(address(this)) >= newUserReward, "Insufficient balance");

        hasClaimedNewUserReward[msg.sender] = true;
        require(pxpToken.transfer(msg.sender, newUserReward), "Transfer failed");

        emit NewUserRewarded(msg.sender, newUserReward);
    }

    function verifyVenue(
        bytes32 venueHash,
        address scout,
        bool approved
    ) external nonReentrant {
        require(authorizedVerifiers[msg.sender], "Not authorized");
        require(!hasVerified[venueHash][msg.sender], "Already verified");
        require(scout != address(0), "Invalid scout");

        hasVerified[venueHash][msg.sender] = true;

        if (approved) {
            venueVerificationCount[venueHash]++;

            require(pxpToken.balanceOf(address(this)) >= verifierReward, "Insufficient balance");
            require(pxpToken.transfer(msg.sender, verifierReward), "Transfer failed");
            emit VerifierRewarded(msg.sender, venueHash, verifierReward);

            if (venueVerificationCount[venueHash] >= MIN_VERIFICATIONS &&
                !venueVerificationPaid[venueHash]) {
                venueVerificationPaid[venueHash] = true;

                require(pxpToken.balanceOf(address(this)) >= scoutReward, "Insufficient balance");
                require(pxpToken.transfer(scout, scoutReward), "Transfer failed");
                emit ScoutRewarded(scout, venueHash, scoutReward);
            }
        }

        emit VenueVerified(venueHash, msg.sender, approved);
    }

    function trackPayment(
        address to,
        uint256 amount,
        string calldata memo
    ) external {
        emit PaymentTracked(msg.sender, to, amount, memo);
    }

    function setVerifierStatus(address verifier, bool authorized) external onlyOwner {
        authorizedVerifiers[verifier] = authorized;
        emit VerifierStatusUpdated(verifier, authorized);
    }

    function addVerifiersBatch(address[] calldata verifiers) external onlyOwner {
        for (uint i = 0; i < verifiers.length; i++) {
            authorizedVerifiers[verifiers[i]] = true;
            emit VerifierStatusUpdated(verifiers[i], true);
        }
    }

    /**
     * @dev Set the new user reward amount
     * @param amount The new reward amount in wei (with 18 decimals)
     */
    function setNewUserReward(uint256 amount) external onlyOwner {
        require(amount >= MIN_REWARD && amount <= MAX_REWARD, "Reward out of range");
        uint256 oldAmount = newUserReward;
        newUserReward = amount;
        emit RewardAmountUpdated("NEW_USER", oldAmount, amount);
    }

    /**
     * @dev Set the scout reward amount
     * @param amount The new reward amount in wei (with 18 decimals)
     */
    function setScoutReward(uint256 amount) external onlyOwner {
        require(amount >= MIN_REWARD && amount <= MAX_REWARD, "Reward out of range");
        uint256 oldAmount = scoutReward;
        scoutReward = amount;
        emit RewardAmountUpdated("SCOUT", oldAmount, amount);
    }

    /**
     * @dev Set the verifier reward amount
     * @param amount The new reward amount in wei (with 18 decimals)
     */
    function setVerifierReward(uint256 amount) external onlyOwner {
        require(amount >= MIN_REWARD && amount <= MAX_REWARD, "Reward out of range");
        uint256 oldAmount = verifierReward;
        verifierReward = amount;
        emit RewardAmountUpdated("VERIFIER", oldAmount, amount);
    }

    /**
     * @dev Set all reward amounts at once
     * @param newUser New user reward amount
     * @param scout Scout reward amount
     * @param verifier Verifier reward amount
     */
    function setAllRewards(
        uint256 newUser,
        uint256 scout,
        uint256 verifier
    ) external onlyOwner {
        require(newUser >= MIN_REWARD && newUser <= MAX_REWARD, "New user reward out of range");
        require(scout >= MIN_REWARD && scout <= MAX_REWARD, "Scout reward out of range");
        require(verifier >= MIN_REWARD && verifier <= MAX_REWARD, "Verifier reward out of range");

        uint256 oldNewUser = newUserReward;
        uint256 oldScout = scoutReward;
        uint256 oldVerifier = verifierReward;

        newUserReward = newUser;
        scoutReward = scout;
        verifierReward = verifier;

        emit RewardAmountUpdated("NEW_USER", oldNewUser, newUser);
        emit RewardAmountUpdated("SCOUT", oldScout, scout);
        emit RewardAmountUpdated("VERIFIER", oldVerifier, verifier);
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = pxpToken.balanceOf(address(this));
        require(pxpToken.transfer(owner(), balance), "Withdrawal failed");
    }

    function fundRewards(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(pxpToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }

    function getContractBalance() external view returns (uint256) {
        return pxpToken.balanceOf(address(this));
    }

    function isVenueVerified(bytes32 venueHash) external view returns (bool) {
        return venueVerificationCount[venueHash] >= MIN_VERIFICATIONS;
    }

    function getVenueVerificationInfo(bytes32 venueHash) external view returns (
        uint256 verificationCount,
        bool scoutPaid,
        bool isVerified
    ) {
        verificationCount = venueVerificationCount[venueHash];
        scoutPaid = venueVerificationPaid[venueHash];
        isVerified = verificationCount >= MIN_VERIFICATIONS;
    }

    function generateVenueHash(
        string calldata name,
        string calldata city,
        address scout
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(name, city, scout));
    }

    /**
     * @dev Get all current reward amounts
     * @return newUser Current new user reward
     * @return scout Current scout reward
     * @return verifier Current verifier reward
     */
    function getAllRewards() external view returns (
        uint256 newUser,
        uint256 scout,
        uint256 verifier
    ) {
        return (newUserReward, scoutReward, verifierReward);
    }

    /**
     * @dev Get reward limits
     * @return min Minimum allowed reward
     * @return max Maximum allowed reward
     */
    function getRewardLimits() external pure returns (uint256 min, uint256 max) {
        return (MIN_REWARD, MAX_REWARD);
    }
}
