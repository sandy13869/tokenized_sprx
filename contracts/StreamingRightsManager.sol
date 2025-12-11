// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SPRXToken.sol";
import "./StreamingAccessPass.sol";

/**
 * @title StreamingRightsManager
 * @dev Manages streaming events, payments, and access control
 * Integrates with SPRX tokens and Access Pass NFTs
 */
contract StreamingRightsManager is Ownable, ReentrancyGuard {
    SPRXToken public sprxToken;
    StreamingAccessPass public accessPassNFT;
    
    struct Event {
        uint256 eventId;
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 standardPrice;
        uint256 vipPrice;
        uint256 premiumPrice;
        address organizer;
        bool isActive;
        uint256 totalViewers;
    }
    
    mapping(uint256 => Event) public events;
    mapping(uint256 => mapping(address => bool)) public hasPurchased;
    uint256 public eventCounter;
    
    // Revenue sharing
    uint256 public platformFeePercentage = 10; // 10% platform fee
    uint256 public totalPlatformRevenue;
    
    event EventCreated(uint256 indexed eventId, string name, address organizer);
    event AccessPurchased(uint256 indexed eventId, address indexed buyer, string accessLevel, uint256 price);
    event EventUpdated(uint256 indexed eventId);
    event RevenueWithdrawn(address indexed organizer, uint256 amount);
    
    constructor(address _sprxToken, address _accessPassNFT) Ownable(msg.sender) {
        sprxToken = SPRXToken(_sprxToken);
        accessPassNFT = StreamingAccessPass(_accessPassNFT);
    }
    
    /**
     * @dev Create a new streaming event
     */
    function createEvent(
        string memory name,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 standardPrice,
        uint256 vipPrice,
        uint256 premiumPrice
    ) external returns (uint256) {
        require(startTime > block.timestamp, "Start time must be in the future");
        require(endTime > startTime, "End time must be after start time");
        
        uint256 eventId = eventCounter++;
        
        events[eventId] = Event({
            eventId: eventId,
            name: name,
            description: description,
            startTime: startTime,
            endTime: endTime,
            standardPrice: standardPrice,
            vipPrice: vipPrice,
            premiumPrice: premiumPrice,
            organizer: msg.sender,
            isActive: true,
            totalViewers: 0
        });
        
        emit EventCreated(eventId, name, msg.sender);
        
        return eventId;
    }
    
    /**
     * @dev Purchase access to an event using SPRX tokens
     */
    function purchaseAccess(
        uint256 eventId,
        string memory accessLevel
    ) external nonReentrant {
        Event storage _event = events[eventId];
        require(_event.isActive, "Event is not active");
        require(block.timestamp < _event.endTime, "Event has ended");
        require(!hasPurchased[eventId][msg.sender], "Already purchased access");
        
        uint256 price;
        if (keccak256(bytes(accessLevel)) == keccak256(bytes("standard"))) {
            price = _event.standardPrice;
        } else if (keccak256(bytes(accessLevel)) == keccak256(bytes("vip"))) {
            price = _event.vipPrice;
        } else if (keccak256(bytes(accessLevel)) == keccak256(bytes("premium"))) {
            price = _event.premiumPrice;
        } else {
            revert("Invalid access level");
        }
        
        require(sprxToken.balanceOf(msg.sender) >= price, "Insufficient SPRX tokens");
        
        // Transfer tokens from buyer to contract
        require(
            sprxToken.transferFrom(msg.sender, address(this), price),
            "Token transfer failed"
        );
        
        // Calculate platform fee
        uint256 platformFee = (price * platformFeePercentage) / 100;
        totalPlatformRevenue += platformFee;
        
        // Mint access pass NFT
        uint256 duration = _event.endTime - block.timestamp;
        string memory uri = string(abi.encodePacked("event/", uintToString(eventId)));
        accessPassNFT.mintAccessPass(msg.sender, eventId, duration, accessLevel, uri);
        
        hasPurchased[eventId][msg.sender] = true;
        _event.totalViewers++;
        
        emit AccessPurchased(eventId, msg.sender, accessLevel, price);
    }
    
    /**
     * @dev Update platform fee percentage
     */
    function updatePlatformFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 30, "Fee too high");
        platformFeePercentage = newFeePercentage;
    }
    
    /**
     * @dev Deactivate an event
     */
    function deactivateEvent(uint256 eventId) external {
        Event storage _event = events[eventId];
        require(
            msg.sender == _event.organizer || msg.sender == owner(),
            "Not authorized"
        );
        _event.isActive = false;
        emit EventUpdated(eventId);
    }
    
    /**
     * @dev Get event details
     */
    function getEventDetails(uint256 eventId) external view returns (
        string memory name,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 standardPrice,
        uint256 vipPrice,
        uint256 premiumPrice,
        bool isActive,
        uint256 totalViewers
    ) {
        Event memory _event = events[eventId];
        return (
            _event.name,
            _event.description,
            _event.startTime,
            _event.endTime,
            _event.standardPrice,
            _event.vipPrice,
            _event.premiumPrice,
            _event.isActive,
            _event.totalViewers
        );
    }
    
    /**
     * @dev Convert uint to string
     */
    function uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
