// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PXP Rewards Contract
 * @dev Simplified contract focused only on PXP token rewards and payment tracking
 * All venue data is stored off-chain in PostgreSQL for performance
 */
contract PXPRewards is Ownable, ReentrancyGuard {
    IERC20 public immutable pxpToken;

    // Reward amounts (in PXP tokens with 18 decimals)
    uint256 public constant NEW_USER_REWARD = 25 * 10**18;      // 25 PXP
    uint256 public constant SCOUT_REWARD = 50 * 10**18;         // 50 PXP
    uint256 public constant VERIFIER_REWARD = 25 * 10**18;      // 25 PXP

    // Verification requirements
    uint256 public constant MIN_VERIFICATIONS = 2;
    uint256 public constant MAX_VERIFICATIONS = 3;

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

    constructor(address _pxpToken) Ownable(msg.sender) {
        pxpToken = IERC20(_pxpToken);
    }

    function claimNewUserReward() external nonReentrant {
        require(!hasClaimedNewUserReward[msg.sender], "Already claimed");
        require(pxpToken.balanceOf(address(this)) >= NEW_USER_REWARD, "Insufficient balance");

        hasClaimedNewUserReward[msg.sender] = true;
        require(pxpToken.transfer(msg.sender, NEW_USER_REWARD), "Transfer failed");

        emit NewUserRewarded(msg.sender, NEW_USER_REWARD);
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

            require(pxpToken.balanceOf(address(this)) >= VERIFIER_REWARD, "Insufficient balance");
            require(pxpToken.transfer(msg.sender, VERIFIER_REWARD), "Transfer failed");
            emit VerifierRewarded(msg.sender, venueHash, VERIFIER_REWARD);

            if (venueVerificationCount[venueHash] >= MIN_VERIFICATIONS &&
                !venueVerificationPaid[venueHash]) {
                venueVerificationPaid[venueHash] = true;

                require(pxpToken.balanceOf(address(this)) >= SCOUT_REWARD, "Insufficient balance");
                require(pxpToken.transfer(scout, SCOUT_REWARD), "Transfer failed");
                emit ScoutRewarded(scout, venueHash, SCOUT_REWARD);
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
}
