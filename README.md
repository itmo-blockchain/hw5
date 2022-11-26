# Sample DAO project

This is a sample DAO project. It is a simple DAO that allows you to create a new Cake DAO, and then create a new proposal.

## Usage

1) DAO using CAKE token which is just ERC20Voted token. So for start voting you should delegate your tokens to someone.
2) When you create a proposal you should provide a keccak256 hash of the proposal. You should know that you must have some tokens to create a proposal. And also you should delegate some tokens to vote for the proposal.
3) To vote for the proposal you must have some tokens on the start of the voting period or you won't be able to vote.

## Testing

To run tests you should install npm and run `npm install` in the root directory of the project. Then you can run `npm test` to run tests.

Output of `npm test`:

```
➜  hw5 npm test

> hw5@1.0.0 test
> npx hardhat test



  CakeDAO
    Deployment
      ✔ Should be right balances (1629ms)
      ✔ Should be right totalSupply
      ✔ Should be empty proposal list
    Create proposal
      ✔ Should be able to create a proposal (66ms)
      ✔ Shouldn't be able to create a proposal if already exists (53ms)
      ✔ Shouldn't be able to create a proposal if not enough balance
      ✔ Shouldn't be able to create a proposal if 3 proposals already exists (109ms)
      ✔ Should be able to create a proposal if 3 proposals already exists and one is expired (121ms)
    Vote
      ✔ Should be able to vote (60ms)
      ✔ Shouldn't be able to vote if proposal doesn't exists
      ✔ Shouldn't be able to vote if proposal is expired
      ✔ Shouldn't be able to vote if not enough balance
      ✔ Should be able to vote second time if not all balance is used (74ms)
      ✔ Should be able to delegate all votes to another address (112ms)
      ✔ Shouldn't be able to vote after delegate (57ms)
      ✔ Shouldn't be able to vote if delegate start after proposal (100ms)
      ✔ Shouldn't be able to vote if proposal is finished (76ms)
    Vote result
      ✔ Should be able to get vote result (88ms)
      ✔ Should be able to get vote result after delegate (108ms)
      ✔ Should finish proposal if accept quorum is reached (98ms)
      ✔ Should finish proposal if reject quorum is reached (88ms)

  CakeDAO
    Deployment
      ✔ Should set the right name (119ms)
      ✔ Should set the right symbol (80ms)
      ✔ Should set the right decimals (90ms)
      ✔ Should set the right totalSupply (77ms)
    Transfers
      ✔ Should transfer tokens between accounts (100ms)
      ✔ Should fail if sender doesn’t have enough tokens (84ms)
    Delegate
      ✔ Should delegate (108ms)

  Lock
    Deployment
      ✔ Should set the right unlockTime (49ms)
      ✔ Should set the right owner
      ✔ Should receive and store the funds to lock
      ✔ Should fail if the unlockTime is not in the future
    Withdrawals
      Validations
        ✔ Should revert with the right error if called too soon
        ✔ Should revert with the right error if called from another account
        ✔ Shouldn't fail if the unlockTime has arrived and the owner calls it
      Events
        ✔ Should emit an event on withdrawals
      Transfers
        ✔ Should transfer the funds to the owner


  37 passing (4s)
```