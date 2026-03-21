// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @title TokenizedAccess – Upgradeable NFT ticket for stream events
/// @notice EIP-1967 transparent proxy on Polygon
/// @custom:oz-upgrades-unsafe-allow constructor
contract TokenizedAccess is
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    ERC2981Upgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct TicketData {
        uint256 eventId;
        uint8 accessLevel;
        string seat;
    }

    uint256 private _nextTokenId;

    mapping(uint256 => TicketData) private _ticketData;
    mapping(uint256 => mapping(address => uint256)) private _eventBalances;

    event TicketMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 indexed eventId,
        uint8 accessLevel,
        string seat
    );

    /// @dev Disable initializers on the implementation contract.
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name_,
        string memory symbol_,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator,
        address defaultAdmin
    ) public initializer {
        __ERC721_init(name_, symbol_);
        __ERC721URIStorage_init();
        __ERC2981_init();
        __Pausable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);

        if (royaltyReceiver != address(0)) {
            _setDefaultRoyalty(royaltyReceiver, royaltyFeeNumerator);
        }
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mintTicket(
        address to,
        uint256 eventId,
        uint8 accessLevel,
        string calldata seat,
        string calldata tokenUri
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256 tokenId) {
        tokenId = ++_nextTokenId;
        _ticketData[tokenId] = TicketData({
            eventId: eventId,
            accessLevel: accessLevel,
            seat: seat
        });

        _safeMint(to, tokenId);
        if (bytes(tokenUri).length > 0) {
            _setTokenURI(tokenId, tokenUri);
        }

        emit TicketMinted(to, tokenId, eventId, accessLevel, seat);
    }

    function ticketInfo(uint256 tokenId)
        external
        view
        returns (uint256 eventId, uint8 accessLevel, string memory seat)
    {
        TicketData memory data = _ticketData[tokenId];
        return (data.eventId, data.accessLevel, data.seat);
    }

    function hasTicketForEvent(address ticketOwner, uint256 eventId)
        external
        view
        returns (bool)
    {
        return _eventBalances[eventId][ticketOwner] > 0;
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721Upgradeable) returns (address from) {
        from = super._update(to, tokenId, auth);

        uint256 eventId = _ticketData[tokenId].eventId;
        if (from != address(0)) {
            _eventBalances[eventId][from] -= 1;
        }
        if (to != address(0)) {
            _eventBalances[eventId][to] += 1;
        } else {
            delete _ticketData[tokenId];
        }

        return from;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable, ERC2981Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
