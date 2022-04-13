//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@interep/contracts/IInterep.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BrightidInterep is ERC721,Ownable {
    IInterep public interep;

    bytes32 public context;
    address public verifier;

    struct Verification {
        uint256 time;
        bool isVerified;
    }
    mapping(address => Verification) public verifications;

    event SetBrightIdSettings(bytes32 context, address verifier);
    event Sponsor(address indexed addr);
    event saveMessage(uint256 indexed externalNullifier, bytes32 signal);
    
    /**
     * @param _context BrightID context used for verifying users
     * @param _verifier BrightID verifier address that signs BrightID verifications
     */
    constructor(address interepAddress, bytes32 _context, address _verifier) ERC721("InterepBrightidv1", "IRBIv1") {
        interep = IInterep(interepAddress);
        
        // ecrecover returns zero on error
        require(_verifier != address(0), "verifier is not valid");

        context = _context;
        verifier = _verifier;
    }

    /**
     * @notice Sponsor a BrightID user by context id
     * @param addr BrightID context id
     */
    function sponsor(address addr) public {
        emit Sponsor(addr);
    }

    /**
     * @notice Set BrightID settings
     * @param _context BrightID context used for verifying users
     * @param _verifier BrightID verifier address that signs BrightID verifications
     */
    function setSettings(bytes32 _context, address _verifier) external onlyOwner {
        // ecrecover returns zero on error
        require(_verifier != address(0), "verifier is not valid");

        context = _context;
        verifier = _verifier;
        emit SetBrightIdSettings(_context, _verifier);
    }

    /**
     * @notice Check a user is verified or not
     * @param _user BrightID context id used for verifying users
     */
    function isVerifiedUser(address _user)
      external
      view
      returns (bool)
    {
        return verifications[_user].isVerified;
    }

    /**
     * @notice Register a user by BrightID verification
     * @param _context The context used in the users verification
     * @param _addrs The history of addresses used by this user in this context
     * @param _timestamp The BrightID node's verification timestamp
     * @param _v Component of signature
     * @param _r Component of signature
     * @param _s Component of signature
     */
    function register(
        bytes32 _context,
        address[] calldata _addrs,
        uint _timestamp,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external {
        require(context == _context, "context is not valid");
        require(verifications[_addrs[0]].time < _timestamp, "newer verification registered before");
        require (_timestamp > block.timestamp - 1 days, "Verification is too old. Try linking again.");

        bytes32 message = keccak256(abi.encodePacked(_context, _addrs, _timestamp));
        address signer = ecrecover(message, _v, _r, _s);
        require(verifier == signer, "not authorized by verifier");

        verifications[_addrs[0]].time = _timestamp;
        verifications[_addrs[0]].isVerified = true;
        for(uint i = 1; i < _addrs.length; i++) {
            require(verifications[_addrs[i]].time < block.timestamp - 7 days, "recently register. can't update verifications at least 7days");
            // update time of all previous context ids to be sure no one can use old verifications again
            verifications[_addrs[i]].time = _timestamp;
            // set old verifications unverified
            verifications[_addrs[i]].isVerified = false;
        }
    }
    
    function checkMyBrightid(address _user)
      private
      view
      returns (bool)
    {
        require(_user == msg.sender, "only sender can check verified of brightid");
        return verifications[_user].isVerified;
    }

    function leaveMessage(
        uint256 _groupId,
        bytes32 _signal,
        uint256 _nullifierHash,
        uint256 _externalNullifier,
        uint256[8] calldata _proof
    ) public {
        require(checkMyBrightid(msg.sender), "your brightid is not verified");
        interep.verifyProof(_groupId, _signal, _nullifierHash, _externalNullifier, _proof); //check the event

        emit saveMessage(_externalNullifier, _signal);
    }

    function mint(uint256 nullifierHash, uint256[8] calldata proof) public {
        require(checkMyBrightid(msg.sender), "your brightid is not verified");

        uint256 groupId = 173940653116352066111980355808565635588994233647684490854317820238565998592; //formatUint248String("brightidv1")
        bytes32 signal = bytes32("brightidv1-nft");

        interep.verifyProof(groupId, signal, nullifierHash, groupId, proof);

        _mint(msg.sender, nullifierHash);
    }
}