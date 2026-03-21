// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IStreamToken {
    function burnFrom(address account, uint256 amount) external;
    function mint(address to, uint256 amount) external;
}

interface ITokenizedAccess {
    function hasTicketForEvent(address ticketOwner, uint256 eventId)
        external
        view
        returns (bool);
}

/// @title StreamAccessController – Upgradeable controller with stablecoin exchange
/// @notice Manages stream access via SPRX token burns and stablecoin (USDC) payments
/// @notice EIP-1967 transparent proxy on Polygon
/// @custom:oz-upgrades-unsafe-allow constructor
contract StreamAccessController is
    Initializable,
    PausableUpgradeable,
    AccessControlUpgradeable
{
    using SafeERC20 for IERC20;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @dev Simple reentrancy lock (1 = unlocked, 2 = locked)
    uint256 private _locked;

    modifier nonReentrant() {
        require(_locked != 2, "ReentrancyGuard: reentrant call");
        _locked = 2;
        _;
        _locked = 1;
    }

    struct AccessGrant {
        uint64 accessUntil;
        uint256 totalBurned;
        uint256 totalStablePaid;
    }

    IStreamToken public streamToken;
    ITokenizedAccess public ticketContract;
    IERC20 public stablecoin; // USDC on Polygon

    /// @notice SPRX per 1 stablecoin unit (6-decimal adjusted). e.g. 100 = 100 SPRX per USDC
    uint256 public sprxPerStable;

    /// @notice Fee basis points on stablecoin purchases (100 = 1%)
    uint256 public feeBps;

    /// @notice Accumulated protocol fees in stablecoin
    uint256 public accumulatedFees;

    /// @notice Stablecoin cost per access-minute (6-decimal)
    uint256 public stableCostPerMinute;

    mapping(address => mapping(uint256 => AccessGrant)) public accessGrants;

    event AccessGranted(
        address indexed user,
        uint256 indexed eventId,
        uint256 burnedAmount,
        uint64 accessUntil
    );
    event AccessGrantedStable(
        address indexed user,
        uint256 indexed eventId,
        uint256 stablePaid,
        uint64 accessUntil
    );
    event TokensPurchased(
        address indexed buyer,
        uint256 stableIn,
        uint256 sprxOut
    );
    event TokensSold(
        address indexed seller,
        uint256 sprxIn,
        uint256 stableOut
    );
    event StableTransferred(
        address indexed from,
        address indexed to,
        uint256 amount
    );

    /// @dev Disable initializers on the implementation contract.
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address streamTokenAddress,
        address ticketAddress,
        address stablecoinAddress,
        uint256 sprxPerStable_,
        uint256 stableCostPerMinute_,
        uint256 feeBps_,
        address defaultAdmin
    ) public initializer {
        __Pausable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        _grantRole(OPERATOR_ROLE, defaultAdmin);

        _locked = 1;

        streamToken = IStreamToken(streamTokenAddress);
        ticketContract = ITokenizedAccess(ticketAddress);
        stablecoin = IERC20(stablecoinAddress);
        sprxPerStable = sprxPerStable_;
        stableCostPerMinute = stableCostPerMinute_;
        feeBps = feeBps_;
    }

    // ─── Pause controls ───────────────────────────────────────────────

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ─── Admin setters ────────────────────────────────────────────────

    function setStreamToken(address addr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        streamToken = IStreamToken(addr);
    }

    function setTicketContract(address addr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        ticketContract = ITokenizedAccess(addr);
    }

    function setStablecoin(address addr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        stablecoin = IERC20(addr);
    }

    function setSprxPerStable(uint256 rate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(rate > 0, "Rate must be positive");
        sprxPerStable = rate;
    }

    function setStableCostPerMinute(uint256 cost) external onlyRole(DEFAULT_ADMIN_ROLE) {
        stableCostPerMinute = cost;
    }

    function setFeeBps(uint256 bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bps <= 1000, "Fee too high"); // max 10%
        feeBps = bps;
    }

    function withdrawFees(address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");
        accumulatedFees = 0;
        stablecoin.safeTransfer(to, amount);
    }

    // ─── Burn-for-access (original SPRX burn flow) ────────────────────

    function burnForAccess(
        uint256 eventId,
        uint256 accessMinutes,
        uint256 burnAmount
    ) external nonReentrant whenNotPaused {
        require(accessMinutes > 0, "Access minutes required");
        require(burnAmount > 0, "Burn amount required");

        streamToken.burnFrom(msg.sender, burnAmount);

        AccessGrant storage grant = accessGrants[msg.sender][eventId];
        uint64 base = grant.accessUntil > uint64(block.timestamp)
            ? grant.accessUntil
            : uint64(block.timestamp);
        uint64 newUntil = base + uint64(accessMinutes * 1 minutes);

        grant.accessUntil = newUntil;
        grant.totalBurned += burnAmount;

        emit AccessGranted(msg.sender, eventId, burnAmount, newUntil);
    }

    // ─── Stablecoin direct access purchase ────────────────────────────

    /// @notice Pay stablecoin (USDC) directly for stream access minutes
    function payStableForAccess(
        uint256 eventId,
        uint256 accessMinutes
    ) external nonReentrant whenNotPaused {
        require(accessMinutes > 0, "Access minutes required");
        require(stableCostPerMinute > 0, "Stable cost not set");

        uint256 totalCost = accessMinutes * stableCostPerMinute;
        uint256 fee = (totalCost * feeBps) / 10_000;

        stablecoin.safeTransferFrom(msg.sender, address(this), totalCost + fee);
        accumulatedFees += fee;

        AccessGrant storage grant = accessGrants[msg.sender][eventId];
        uint64 base = grant.accessUntil > uint64(block.timestamp)
            ? grant.accessUntil
            : uint64(block.timestamp);
        uint64 newUntil = base + uint64(accessMinutes * 1 minutes);

        grant.accessUntil = newUntil;
        grant.totalStablePaid += totalCost + fee;

        emit AccessGrantedStable(msg.sender, eventId, totalCost + fee, newUntil);
    }

    // ─── Token exchange: buy SPRX with stablecoin ─────────────────────

    /// @notice Buy SPRX tokens using stablecoin at the configured rate
    function buyTokens(uint256 stableAmount) external nonReentrant whenNotPaused {
        require(stableAmount > 0, "Amount required");
        require(sprxPerStable > 0, "Exchange rate not set");

        uint256 fee = (stableAmount * feeBps) / 10_000;
        uint256 net = stableAmount - fee;
        // stablecoin is 6 decimals, SPRX is 18 decimals
        uint256 sprxAmount = (net * sprxPerStable * 1e12);

        stablecoin.safeTransferFrom(msg.sender, address(this), stableAmount);
        accumulatedFees += fee;

        streamToken.mint(msg.sender, sprxAmount);

        emit TokensPurchased(msg.sender, stableAmount, sprxAmount);
    }

    /// @notice Sell SPRX tokens back for stablecoin
    function sellTokens(uint256 sprxAmount) external nonReentrant whenNotPaused {
        require(sprxAmount > 0, "Amount required");
        require(sprxPerStable > 0, "Exchange rate not set");

        // SPRX 18 decimals -> stablecoin 6 decimals
        uint256 grossStable = sprxAmount / (sprxPerStable * 1e12);
        uint256 fee = (grossStable * feeBps) / 10_000;
        uint256 netStable = grossStable - fee;

        require(
            stablecoin.balanceOf(address(this)) >= grossStable,
            "Insufficient stablecoin liquidity"
        );

        streamToken.burnFrom(msg.sender, sprxAmount);
        accumulatedFees += fee;
        stablecoin.safeTransfer(msg.sender, netStable);

        emit TokensSold(msg.sender, sprxAmount, netStable);
    }

    // ─── Stablecoin transfer on user demand ───────────────────────────

    /// @notice Transfer stablecoin held by this contract to another address (admin only)
    function transferStable(address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(to != address(0), "Zero address");
        stablecoin.safeTransfer(to, amount);
        emit StableTransferred(address(this), to, amount);
    }

    // ─── Access check ─────────────────────────────────────────────────

    function hasAccess(address user, uint256 eventId)
        external
        view
        returns (bool)
    {
        if (address(ticketContract) != address(0)) {
            if (ticketContract.hasTicketForEvent(user, eventId)) {
                return true;
            }
        }
        return accessGrants[user][eventId].accessUntil >= block.timestamp;
    }
}
