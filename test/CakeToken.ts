import { ethers } from "hardhat";
import { expect } from "chai";

describe("CakeDAO", function () {
    async function deployTokenFixture() {
        const [owner] = await ethers.getSigners();
        const Cake = await ethers.getContractFactory("CakeToken");

        const cake = await Cake.deploy();

        return { cake, owner };
    }

    describe("Deployment", function () {

        it("Should set the right name", async function () {
            const { cake } = await deployTokenFixture();

            expect(await cake.name()).to.equal("Cake Token");
        });

        it("Should set the right symbol", async function () {
            const { cake } = await deployTokenFixture();

            expect(await cake.symbol()).to.equal("CAKE");
        });

        it("Should set the right decimals", async function () {
            const { cake } = await deployTokenFixture();

            expect(await cake.decimals()).to.equal(6);
        });

        it("Should set the right totalSupply", async function () {
            const { cake } = await deployTokenFixture();

            expect(await cake.totalSupply()).to.equal(100_000_000);
        });
    });

    describe("Transfers", function () {
        it("Should transfer tokens between accounts", async function () {
            const { cake, owner } = await deployTokenFixture();

            const bob = (await ethers.getSigners())[1];

            console.log("owner: " + owner.address);
            console.log("bob: " + bob.address);

            await cake.connect(owner).transfer(bob.address, 100);

            const [_, event] = await cake.queryFilter(cake.filters.Transfer(null, null, null));

            expect(event.args.to).to.equal(bob.address);
            expect(event.args.value).to.equal(100);
        });

        it("Should fail if sender doesn’t have enough tokens", async function () {
            const { cake, owner } = await deployTokenFixture();

            const bob = (await ethers.getSigners())[1];

            await expect(cake.connect(bob).transfer(owner.address, 1)).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });
    });
});