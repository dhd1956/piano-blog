// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title DrinkPayment - Venue Payment System with Tips
 * @dev Handles TCoin payments for drinks, food, and tips at venues
 */
contract DrinkPayment is Ownable, ReentrancyGuard {
    
    struct Payment {
        address payer;
        address venue;
        uint256 amount;
        uint256 tip;
        uint256 timestamp;
        string paymentType; // "drink", "food", "tip", "other"
        bool completed;
    }
    
    struct Venue {
        address wallet;
        string name;
        bool active;
        uint256 totalReceived;
        uint256 transactionCount;
        uint8 feePercentage; // 0-10% platform fee
    }
    
    // State variables
    IERC20 public paymentToken;
    mapping(uint256 => Payment) public payments;
    mapping(address => Venue) public venues;
    mapping(address => uint256[]) public userPayments;
    mapping(address => uint256[]) public venuePayments;
    
    uint256 public paymentCount;
    uint256 public defaultDrinkPrice = 5 * 10**18; // 5 tokens
    uint256 public platformFeePercentage = 2; // 2% default
    address public feeRecipient;
    
    // Events
    event PaymentProcessed(
        uint256 indexed paymentId,
        address indexed payer,
        address indexed venue,
        uint256 amount,
        uint256 tip,
        string paymentType
    );
    
    event VenueAdded(
        address indexed venueAddress,
        string name
    );
    
    event VenueUpdated(
        address indexed venueAddress,
        bool active
    );
    
    event DrinkPriceUpdated(
        uint256 oldPrice,
        uint256 newPrice
    );
    
    // Custom errors
    error VenueNotActive();
    error InsufficientBalance();
    error InvalidAmount();
    error PaymentNotFound();
    error VenueNotFound();
    
    constructor(address _paymentToken, address _feeRecipient) Ownable(msg.sender) {
        if (_paymentToken == address(0)) revert("Invalid token address");
        paymentToken = IERC20(_paymentToken);
        feeRecipient = _feeRecipient != address(0) ? _feeRecipient : owner();
    }
    
    /**
     * @dev Add a new venue to the payment system
     * @param venueAddress Venue's wallet address
     * @param name Venue name
     * @param feePercentage Custom fee percentage (0-10%)
     */
    function addVenue(
        address venueAddress, 
        string memory name,
        uint8 feePercentage
    ) external onlyOwner {
        require(venueAddress != address(0), "Invalid venue address");
        require(feePercentage <= 10, "Fee too high");
        
        venues[venueAddress] = Venue({
            wallet: venueAddress,
            name: name,
            active: true,
            totalReceived: 0,
            transactionCount: 0,
            feePercentage: feePercentage
        });
        
        emit VenueAdded(venueAddress, name);
    }
    
    /**
     * @dev Update venue status
     * @param venueAddress Venue's wallet address
     * @param active Whether venue is active
     */
    function updateVenueStatus(address venueAddress, bool active) external onlyOwner {
        if (venues[venueAddress].wallet == address(0)) revert VenueNotFound();
        venues[venueAddress].active = active;
        emit VenueUpdated(venueAddress, active);
    }
    
    /**
     * @dev Pay for drink at venue
     * @param venueAddress Venue's wallet address
     * @param amount Payment amount (0 uses default drink price)
     * @param tip Additional tip amount
     * @param paymentType Type of payment ("drink", "food", "tip")
     */
    function payAtVenue(
        address venueAddress,
        uint256 amount,
        uint256 tip,
        string memory paymentType
    ) public nonReentrant returns (uint256 paymentId) {
        if (!venues[venueAddress].active) revert VenueNotActive();
        
        // Use default drink price if amount is 0
        uint256 paymentAmount = amount == 0 ? defaultDrinkPrice : amount;
        uint256 totalAmount = paymentAmount + tip;
        
        if (totalAmount == 0) revert InvalidAmount();
        if (paymentToken.balanceOf(msg.sender) < totalAmount) revert InsufficientBalance();
        
        // Transfer tokens from payer to contract
        paymentToken.transferFrom(msg.sender, address(this), totalAmount);
        
        // Calculate platform fee
        uint256 feePercentage = venues[venueAddress].feePercentage;
        if (feePercentage == 0) feePercentage = platformFeePercentage;
        
        uint256 platformFee = (paymentAmount * feePercentage) / 100;
        uint256 venueAmount = paymentAmount - platformFee + tip; // Venue gets full tip
        
        // Transfer to venue and fee recipient
        if (venueAmount > 0) {
            paymentToken.transfer(venueAddress, venueAmount);
        }
        if (platformFee > 0) {
            paymentToken.transfer(feeRecipient, platformFee);
        }
        
        // Record payment
        paymentId = paymentCount++;
        payments[paymentId] = Payment({
            payer: msg.sender,
            venue: venueAddress,
            amount: paymentAmount,
            tip: tip,
            timestamp: block.timestamp,
            paymentType: paymentType,
            completed: true
        });
        
        // Update venue stats
        venues[venueAddress].totalReceived += venueAmount;
        venues[venueAddress].transactionCount++;
        
        // Index payments
        userPayments[msg.sender].push(paymentId);
        venuePayments[venueAddress].push(paymentId);
        
        emit PaymentProcessed(
            paymentId,
            msg.sender,
            venueAddress,
            paymentAmount,
            tip,
            paymentType
        );
        
        return paymentId;
    }
    
    /**
     * @dev Quick drink payment with default price
     * @param venueAddress Venue's wallet address
     */
    function payForDrink(address venueAddress) external returns (uint256) {
        return payAtVenue(venueAddress, 0, 0, "drink");
    }
    
    /**
     * @dev Pay with tip
     * @param venueAddress Venue's wallet address
     * @param tipAmount Tip amount
     */
    function payForDrinkWithTip(address venueAddress, uint256 tipAmount) external returns (uint256) {
        return payAtVenue(venueAddress, 0, tipAmount, "drink");
    }
    
    /**
     * @dev Send tip to venue staff
     * @param venueAddress Venue's wallet address
     * @param tipAmount Tip amount
     */
    function tipVenueStaff(address venueAddress, uint256 tipAmount) external returns (uint256) {
        return payAtVenue(venueAddress, 0, tipAmount, "tip");
    }
    
    /**
     * @dev Get payment details
     * @param paymentId Payment ID
     * @return Payment struct
     */
    function getPayment(uint256 paymentId) external view returns (Payment memory) {
        if (paymentId >= paymentCount) revert PaymentNotFound();
        return payments[paymentId];
    }
    
    /**
     * @dev Get user's payment history
     * @param user User address
     * @return Array of payment IDs
     */
    function getUserPayments(address user) external view returns (uint256[] memory) {
        return userPayments[user];
    }
    
    /**
     * @dev Get venue's payment history
     * @param venueAddress Venue address
     * @return Array of payment IDs
     */
    function getVenuePayments(address venueAddress) external view returns (uint256[] memory) {
        return venuePayments[venueAddress];
    }
    
    /**
     * @dev Get venue stats
     * @param venueAddress Venue address
     * @return Venue struct with stats
     */
    function getVenueStats(address venueAddress) external view returns (Venue memory) {
        if (venues[venueAddress].wallet == address(0)) revert VenueNotFound();
        return venues[venueAddress];
    }
    
    /**
     * @dev Set default drink price
     * @param newPrice New default price
     */
    function setDrinkPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Invalid price");
        uint256 oldPrice = defaultDrinkPrice;
        defaultDrinkPrice = newPrice;
        emit DrinkPriceUpdated(oldPrice, newPrice);
    }
    
    /**
     * @dev Set platform fee percentage
     * @param newFeePercentage New fee percentage (0-10%)
     */
    function setPlatformFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 10, "Fee too high");
        platformFeePercentage = newFeePercentage;
    }
    
    /**
     * @dev Set fee recipient address
     * @param newFeeRecipient New fee recipient
     */
    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid address");
        feeRecipient = newFeeRecipient;
    }
    
    /**
     * @dev Get contract stats
     * @return totalPayments Total number of payments
     * @return totalVolume Total payment volume
     * @return activeVenues Number of active venues
     */
    function getContractStats() external view returns (
        uint256 totalPayments,
        uint256 totalVolume,
        uint256 activeVenues
    ) {
        totalPayments = paymentCount;
        
        // Calculate total volume and active venues
        // Note: This is gas-expensive for large datasets, consider off-chain calculation
        for (uint256 i = 0; i < paymentCount; i++) {
            totalVolume += payments[i].amount + payments[i].tip;
        }
        
        // Count active venues (simplified - in practice use a counter)
        // This is a placeholder - in production, maintain an activeVenueCount variable
        activeVenues = 0; // Implement proper counting if needed
    }
    
    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = paymentToken.balanceOf(address(this));
        if (balance > 0) {
            paymentToken.transfer(owner(), balance);
        }
    }
}

