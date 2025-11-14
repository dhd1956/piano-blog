// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/PXPRewards.sol";
import "../src/PXPToken.sol";

contract PXPRewardsTest is Test {
    PXPToken public token;
    PXPRewards public rewards;

    address public owner;
    address public verifier1;
    address public verifier2;
    address public scout;
    address public user1;

    // Initial reward amounts
    uint256 constant INITIAL_NEW_USER_REWARD = 25 * 10**18;
    uint256 constant INITIAL_SCOUT_REWARD = 50 * 10**18;
    uint256 constant INITIAL_VERIFIER_REWARD = 25 * 10**18;

    // Reward limits
    uint256 constant MIN_REWARD = 1 * 10**18;
    uint256 constant MAX_REWARD = 1000 * 10**18;

    function setUp() public {
        owner = address(this);
        verifier1 = address(0x1);
        verifier2 = address(0x2);
        scout = address(0x3);
        user1 = address(0x4);

        // Deploy contracts
        token = new PXPToken();
        rewards = new PXPRewards(address(token));

        // Fund rewards contract
        token.transfer(address(rewards), 100_000 * 10**18);

        // Add authorized verifiers
        rewards.setVerifierStatus(verifier1, true);
        rewards.setVerifierStatus(verifier2, true);
    }

    /* ========== REWARD CONFIGURATION TESTS ========== */

    function testInitialRewardAmounts() public view {
        assertEq(rewards.newUserReward(), INITIAL_NEW_USER_REWARD);
        assertEq(rewards.scoutReward(), INITIAL_SCOUT_REWARD);
        assertEq(rewards.verifierReward(), INITIAL_VERIFIER_REWARD);
    }

    function testSetNewUserReward() public {
        uint256 newAmount = 30 * 10**18;

        vm.expectEmit(true, false, false, true);
        emit PXPRewards.RewardAmountUpdated("NEW_USER", INITIAL_NEW_USER_REWARD, newAmount);

        rewards.setNewUserReward(newAmount);
        assertEq(rewards.newUserReward(), newAmount);
    }

    function testSetScoutReward() public {
        uint256 newAmount = 75 * 10**18;

        vm.expectEmit(true, false, false, true);
        emit PXPRewards.RewardAmountUpdated("SCOUT", INITIAL_SCOUT_REWARD, newAmount);

        rewards.setScoutReward(newAmount);
        assertEq(rewards.scoutReward(), newAmount);
    }

    function testSetVerifierReward() public {
        uint256 newAmount = 35 * 10**18;

        vm.expectEmit(true, false, false, true);
        emit PXPRewards.RewardAmountUpdated("VERIFIER", INITIAL_VERIFIER_REWARD, newAmount);

        rewards.setVerifierReward(newAmount);
        assertEq(rewards.verifierReward(), newAmount);
    }

    function testSetAllRewards() public {
        uint256 newUserAmount = 30 * 10**18;
        uint256 scoutAmount = 75 * 10**18;
        uint256 verifierAmount = 35 * 10**18;

        rewards.setAllRewards(newUserAmount, scoutAmount, verifierAmount);

        assertEq(rewards.newUserReward(), newUserAmount);
        assertEq(rewards.scoutReward(), scoutAmount);
        assertEq(rewards.verifierReward(), verifierAmount);
    }

    function testGetAllRewards() public view {
        (uint256 newUser, uint256 scout, uint256 verifier) = rewards.getAllRewards();

        assertEq(newUser, INITIAL_NEW_USER_REWARD);
        assertEq(scout, INITIAL_SCOUT_REWARD);
        assertEq(verifier, INITIAL_VERIFIER_REWARD);
    }

    function testGetRewardLimits() public view {
        (uint256 min, uint256 max) = rewards.getRewardLimits();

        assertEq(min, MIN_REWARD);
        assertEq(max, MAX_REWARD);
    }

    function testSetRewardTooLow() public {
        uint256 tooLow = 0.5 * 10**18; // Below MIN_REWARD

        vm.expectRevert("Reward out of range");
        rewards.setNewUserReward(tooLow);
    }

    function testSetRewardTooHigh() public {
        uint256 tooHigh = 1001 * 10**18; // Above MAX_REWARD

        vm.expectRevert("Reward out of range");
        rewards.setScoutReward(tooHigh);
    }

    function testSetRewardOnlyOwner() public {
        uint256 newAmount = 30 * 10**18;

        vm.prank(user1);
        vm.expectRevert();
        rewards.setNewUserReward(newAmount);
    }

    function testSetAllRewardsValidation() public {
        // Test new user reward too low
        vm.expectRevert("New user reward out of range");
        rewards.setAllRewards(0.5 * 10**18, 50 * 10**18, 25 * 10**18);

        // Test scout reward too high
        vm.expectRevert("Scout reward out of range");
        rewards.setAllRewards(25 * 10**18, 1001 * 10**18, 25 * 10**18);

        // Test verifier reward too low
        vm.expectRevert("Verifier reward out of range");
        rewards.setAllRewards(25 * 10**18, 50 * 10**18, 0);
    }

    /* ========== REWARD DISTRIBUTION WITH UPDATED AMOUNTS ========== */

    function testNewUserRewardWithUpdatedAmount() public {
        // Update reward amount
        uint256 newAmount = 40 * 10**18;
        rewards.setNewUserReward(newAmount);

        // Claim reward
        vm.prank(user1);
        rewards.claimNewUserReward();

        // Verify user received updated amount
        assertEq(token.balanceOf(user1), newAmount);
    }

    function testVerifierRewardWithUpdatedAmount() public {
        // Update verifier reward
        uint256 newVerifierReward = 40 * 10**18;
        rewards.setVerifierReward(newVerifierReward);

        // Generate venue hash
        bytes32 venueHash = rewards.generateVenueHash("Test Venue", "Test City", scout);

        // Verifier approves venue
        vm.prank(verifier1);
        rewards.verifyVenue(venueHash, scout, true);

        // Verify verifier received updated amount
        assertEq(token.balanceOf(verifier1), newVerifierReward);
    }

    function testScoutRewardWithUpdatedAmount() public {
        // Update scout reward
        uint256 newScoutReward = 100 * 10**18;
        rewards.setScoutReward(newScoutReward);

        // Generate venue hash
        bytes32 venueHash = rewards.generateVenueHash("Test Venue", "Test City", scout);

        // Get 2 verifiers to approve
        vm.prank(verifier1);
        rewards.verifyVenue(venueHash, scout, true);

        vm.prank(verifier2);
        rewards.verifyVenue(venueHash, scout, true);

        // Verify scout received updated amount
        assertEq(token.balanceOf(scout), newScoutReward);
    }

    function testFullWorkflowWithUpdatedRewards() public {
        // Update all rewards
        uint256 newUserAmount = 30 * 10**18;
        uint256 scoutAmount = 80 * 10**18;
        uint256 verifierAmount = 40 * 10**18;

        rewards.setAllRewards(newUserAmount, scoutAmount, verifierAmount);

        // New user claims welcome reward
        vm.prank(user1);
        rewards.claimNewUserReward();
        assertEq(token.balanceOf(user1), newUserAmount);

        // Scout submits venue
        bytes32 venueHash = rewards.generateVenueHash("Piano Bar", "New York", scout);

        // Verifier 1 approves
        vm.prank(verifier1);
        rewards.verifyVenue(venueHash, scout, true);
        assertEq(token.balanceOf(verifier1), verifierAmount);

        // Verifier 2 approves (triggers scout reward)
        vm.prank(verifier2);
        rewards.verifyVenue(venueHash, scout, true);
        assertEq(token.balanceOf(verifier2), verifierAmount);
        assertEq(token.balanceOf(scout), scoutAmount);
    }

    /* ========== EXISTING FUNCTIONALITY TESTS ========== */

    function testClaimNewUserReward() public {
        uint256 balanceBefore = token.balanceOf(user1);

        vm.prank(user1);
        rewards.claimNewUserReward();

        assertEq(token.balanceOf(user1), balanceBefore + INITIAL_NEW_USER_REWARD);
        assertTrue(rewards.hasClaimedNewUserReward(user1));
    }

    function testCannotClaimNewUserRewardTwice() public {
        vm.startPrank(user1);
        rewards.claimNewUserReward();

        vm.expectRevert("Already claimed");
        rewards.claimNewUserReward();
        vm.stopPrank();
    }

    function testVenueVerification() public {
        bytes32 venueHash = rewards.generateVenueHash("Piano Bar", "NYC", scout);

        vm.prank(verifier1);
        rewards.verifyVenue(venueHash, scout, true);

        assertTrue(rewards.hasVerified(venueHash, verifier1));
        assertEq(token.balanceOf(verifier1), INITIAL_VERIFIER_REWARD);
    }

    function testScoutRewardAfterMinVerifications() public {
        bytes32 venueHash = rewards.generateVenueHash("Jazz Club", "Chicago", scout);

        uint256 scoutBalanceBefore = token.balanceOf(scout);

        // First verification
        vm.prank(verifier1);
        rewards.verifyVenue(venueHash, scout, true);
        assertEq(token.balanceOf(scout), scoutBalanceBefore); // Scout not paid yet

        // Second verification (meets MIN_VERIFICATIONS)
        vm.prank(verifier2);
        rewards.verifyVenue(venueHash, scout, true);
        assertEq(token.balanceOf(scout), scoutBalanceBefore + INITIAL_SCOUT_REWARD); // Scout now paid
    }

    function testUnauthorizedVerifierCannotVerify() public {
        bytes32 venueHash = rewards.generateVenueHash("Test Venue", "Test City", scout);

        vm.prank(user1); // user1 is not an authorized verifier
        vm.expectRevert("Not authorized");
        rewards.verifyVenue(venueHash, scout, true);
    }

    function testContractBalance() public view {
        uint256 balance = rewards.getContractBalance();
        assertEq(balance, 100_000 * 10**18);
    }
}
