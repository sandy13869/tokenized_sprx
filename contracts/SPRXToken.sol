// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SPRXToken
 * @dev Platform token for the AR/VR Sports Streaming Platform
 * Users can earn and spend SPRX tokens to access premium content
 */
contract SPRXToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    
    // Mapping to track rewards for users
    mapping(address => uint256) public rewards;
    
    event TokensRewarded(address indexed user, uint256 amount);
    event TokensSpent(address indexed user, uint256 amount, string purpose);
    
    constructor() ERC20("SPRX Platform Token", "SPRX") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Reward tokens to users for engagement
     * @param user Address of the user to reward
     * @param amount Amount of tokens to reward
     */
    function rewardUser(address user, uint256 amount) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");
        
        _transfer(owner(), user, amount);
        rewards[user] += amount;
        
        emit TokensRewarded(user, amount);
    }
    
    /**
     * @dev Batch reward multiple users
     * @param users Array of user addresses
     * @param amounts Array of token amounts
     */
    function batchReward(address[] calldata users, uint256[] calldata amounts) external onlyOwner {
        require(users.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] != address(0) && amounts[i] > 0) {
                _transfer(owner(), users[i], amounts[i]);
                rewards[users[i]] += amounts[i];
                emit TokensRewarded(users[i], amounts[i]);
            }
        }
    }
    
    /**
     * @dev Burn tokens
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
