// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

contract CakeDAO {

    enum ProposalState { Active, Accepted, Discarded, Expired }
    struct Proposal {
        ProposalState state;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 expiration;
    }
        
    address public token;
    
    mapping (bytes32 => Proposal) name;
    bytes32[3] private proposals;
    
    constructor(address _token) {
        token = _token;
    }

    function createProposal(bytes32 _proposalHash) external {
        
    }

    function vote(bytes32 _proposalHash, bool _for) external {
        
    }

    function executeProposal(bytes32 _proposalHash) external {
        
    }

    function getProposalState(bytes32 _proposalHash) external view returns (ProposalState) {
        
    }

    function getProposalVotes(bytes32 _proposalHash) external view returns (uint256, uint256) {
        
    }

    function getProposalExpiration(bytes32 _proposalHash) external view returns (uint256) {
        
    }

    function getProposals() external view returns (bytes32[3] memory) {
        
    }
}