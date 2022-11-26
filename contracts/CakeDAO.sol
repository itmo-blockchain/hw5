// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

pragma solidity ^0.8.9;

contract CakeDAO {

    enum ProposalState { Unknown, Active, Accepted, Discarded, Expired }

    struct Proposal {
        ProposalState state;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 expiration;
    }

    uint8 public constant MAX_PROPOSALS = 3;
    uint256 public constant VOTING_DURATION = 3 days;
        
    IERC20 public token;
    
    mapping (bytes32 => Proposal) proposals;

    // Simple queue to keep track of the proposals   
    bytes32[MAX_PROPOSALS] private currentProposals;
    // The index of the next proposal to be added to currentProposals
    uint8 private nextProposalNum = 0;

    event NewProposal(bytes32 indexed proposalId, uint256 expiration);
    event Vote(bytes32 indexed proposalId, address indexed voter, bool forVote);
    event ProposalResult(bytes32 indexed proposalId, ProposalState state);
    
    constructor(address _token) {
        token = IERC20(_token);
    }

    function createProposal(bytes32 _proposalHash) external {
        require(
            token.balanceOf(msg.sender) > 0,
            "Not enough balance"
        );

        require(
            proposals[_proposalHash].state == ProposalState.Unknown,
            "Proposal already exists"
        );

        bytes32 oldProposal = currentProposals[nextProposalNum];

        require(
            oldProposal == bytes32(0) 
            || proposals[oldProposal].state != ProposalState.Active
            || proposals[oldProposal].expiration < block.timestamp,
            "Already 3 active proposals"
        );

        if (oldProposal != bytes32(0)) {
            proposals[oldProposal].state = ProposalState.Expired;
            emit ProposalResult(oldProposal, ProposalState.Expired);
        }    

        proposals[_proposalHash] = Proposal({
            state: ProposalState.Active,
            forVotes: 0,
            againstVotes: 0,
            expiration: block.timestamp + VOTING_DURATION
        });

        currentProposals[nextProposalNum] = _proposalHash;  
        nextProposalNum = (nextProposalNum + 1) % MAX_PROPOSALS;

        emit NewProposal(_proposalHash, block.timestamp + VOTING_DURATION);
        
    }

    function vote(bytes32 _proposalHash, bool _for) external {
        
    }

    function getProposalState(bytes32 _proposalHash) external view returns (ProposalState) {
        return proposals[_proposalHash].state;
    }

    function getProposalVotes(bytes32 _proposalHash) external view returns (uint256, uint256) {
        return (proposals[_proposalHash].forVotes, proposals[_proposalHash].againstVotes);
    }

    function getProposalExpiration(bytes32 _proposalHash) external view returns (uint256) {
        return proposals[_proposalHash].expiration;        
    }

    function getProposals() external view returns (bytes32[3] memory) {
        return currentProposals;
    }

    function getCurrentProposalsCount() external view returns (uint8) {
        uint8 count = 0;

        for (uint8 i = 0; i < MAX_PROPOSALS; i++) {
            if (proposals[currentProposals[i]].state == ProposalState.Active &&
                proposals[currentProposals[i]].expiration > block.timestamp) {
                count++;
            }
        }

        return count;
    }
}