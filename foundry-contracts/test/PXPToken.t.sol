// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/PXPToken.sol";

contract PXPTokenTest is Test {
    PXPToken public token;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        token = new PXPToken();
    }

    function testInitialSupply() public view {
        assertEq(token.totalSupply(), 1_000_000 * 10**18);
        assertEq(token.balanceOf(owner), 1_000_000 * 10**18);
    }

    function testTokenMetadata() public view {
        assertEq(token.name(), "Piano eXPerience Token");
        assertEq(token.symbol(), "PXP");
        assertEq(token.decimals(), 18);
    }

    function testTransfer() public {
        token.transfer(user1, 1000 * 10**18);
        assertEq(token.balanceOf(user1), 1000 * 10**18);
    }

    function testMintOnlyOwner() public {
        token.mint(user1, 500 * 10**18);
        assertEq(token.balanceOf(user1), 500 * 10**18);

        // Non-owner cannot mint
        vm.prank(user1);
        vm.expectRevert();
        token.mint(user2, 100 * 10**18);
    }

    function testBurn() public {
        token.transfer(user1, 1000 * 10**18);

        vm.prank(user1);
        token.burn(500 * 10**18);

        assertEq(token.balanceOf(user1), 500 * 10**18);
        assertEq(token.totalSupply(), 1_000_000 * 10**18 - 500 * 10**18);
    }
}
