// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CakeToken is ERC20Snapshot {
    constructor () ERC20("CakeToken", "CAKE") {
        _mint(msg.sender, 100_000_000);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}