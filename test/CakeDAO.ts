import { ethers } from "hardhat";

describe("CakeDAO", function () {
    async function deployTokenFixture() {
        const [owner] = await ethers.getSigners();
        const Cake = await ethers.getContractFactory("CakeToken");

        const cake = await Cake.deploy();

        return { cake, owner };
    }

    
});