// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title StreamingAccessPass
 * @dev NFT-based access passes for streaming events
 * Each NFT represents access to specific sports events with AR/VR features
 */
contract StreamingAccessPass is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    
    struct AccessPass {
        uint256 eventId;
        uint256 expirationTime;
        string accessLevel; // "standard", "vip", "premium"
        bool isActive;
    }
    
    mapping(uint256 => AccessPass) public accessPasses;
    mapping(uint256 => mapping(address => bool)) public eventAccess; // eventId => user => hasAccess
    
    event AccessPassMinted(address indexed owner, uint256 indexed tokenId, uint256 eventId);
    event AccessPassActivated(uint256 indexed tokenId);
    event AccessPassDeactivated(uint256 indexed tokenId);
    
    constructor() ERC721("SPRX Access Pass", "SPRXPASS") Ownable(msg.sender) {}
    
    /**
     * @dev Mint a new access pass NFT
     * @param to Address to mint the NFT to
     * @param eventId ID of the event this pass grants access to
     * @param duration Duration of access in seconds
     * @param accessLevel Level of access ("standard", "vip", "premium")
     * @param uri Metadata URI for the NFT
     */
    function mintAccessPass(
        address to,
        uint256 eventId,
        uint256 duration,
        string memory accessLevel,
        string memory uri
    ) public onlyOwner returns (uint256) {
        require(to != address(0), "Invalid address");
        require(duration > 0, "Duration must be greater than 0");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        accessPasses[tokenId] = AccessPass({
            eventId: eventId,
            expirationTime: block.timestamp + duration,
            accessLevel: accessLevel,
            isActive: true
        });
        
        eventAccess[eventId][to] = true;
        
        emit AccessPassMinted(to, tokenId, eventId);
        
        return tokenId;
    }
    
    /**
     * @dev Check if a user has access to an event
     * @param eventId ID of the event
     * @param user Address of the user
     */
    function hasEventAccess(uint256 eventId, address user) public view returns (bool) {
        return eventAccess[eventId][user];
    }
    
    /**
     * @dev Verify if an access pass is valid
     * @param tokenId Token ID of the access pass
     */
    function isValidPass(uint256 tokenId) public view returns (bool) {
        AccessPass memory pass = accessPasses[tokenId];
        return pass.isActive && block.timestamp < pass.expirationTime;
    }
    
    /**
     * @dev Deactivate an access pass
     * @param tokenId Token ID to deactivate
     */
    function deactivatePass(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        accessPasses[tokenId].isActive = false;
        emit AccessPassDeactivated(tokenId);
    }
    
    /**
     * @dev Get access pass details
     * @param tokenId Token ID to query
     */
    function getAccessPassDetails(uint256 tokenId) external view returns (
        uint256 eventId,
        uint256 expirationTime,
        string memory accessLevel,
        bool isActive
    ) {
        AccessPass memory pass = accessPasses[tokenId];
        return (pass.eventId, pass.expirationTime, pass.accessLevel, pass.isActive);
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
