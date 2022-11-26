import { ethers } from "hardhat";
import { expect } from "chai";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("CakeDAO", function () {
    async function deployDaoWith3BalancesFixture() {
        const [alice, bob, charle, dan] = await ethers.getSigners();

        const Cake = await ethers.getContractFactory("CakeToken");
        const cake = await Cake.deploy();

        const CakeDAO = await ethers.getContractFactory("CakeDAO");
        const cakeDAO = await CakeDAO.deploy(cake.address);

        await cake.connect(alice).transfer(bob.address, 40 * 10 ** 6);
        await cake.connect(alice).transfer(charle.address, 35 * 10 ** 6);

        return { cake, cakeDAO, alice, bob, charle, dan };
    }

    describe("Deployment", function () {
        it("Should be right balances", async function () {
            const { cake, alice, bob, charle } = await loadFixture(deployDaoWith3BalancesFixture);

            expect(await cake.balanceOf(alice.address)).to.equal(25 * 10 ** 6);
            expect(await cake.balanceOf(bob.address)).to.equal(40 * 10 ** 6);
            expect(await cake.balanceOf(charle.address)).to.equal(35 * 10 ** 6);
        });

        it("Should be right totalSupply", async function () {
            const { cake } = await loadFixture(deployDaoWith3BalancesFixture);

            expect(await cake.totalSupply()).to.equal(100 * 10 ** 6);
        });

        it("Should be empty proposal list", async function () {
            const { cakeDAO } = await loadFixture(deployDaoWith3BalancesFixture);

            expect(await cakeDAO.getCurrentProposalsCount()).to.equal(0);
        })
    })

    describe("Create proposal", function () {
        it("Should be able to create a proposal", async function () {
            const { cakeDAO, alice } = await loadFixture(deployDaoWith3BalancesFixture);

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1"));

            await cakeDAO.connect(alice).createProposal(prop);

            const [event] = await cakeDAO.queryFilter(cakeDAO.filters.NewProposal(null, null));

            expect(event.args.proposalId).to.equal(prop);
            expect(event.args.expiration).to.equal(await time.latest() + 3 * 24 * 60 * 60);

            expect(await cakeDAO.getCurrentProposalsCount()).to.equal(1);

            expect(await cakeDAO.getProposalExpiration(prop)).to.equal(await time.latest() + 3 * 24 * 60 * 60);
            expect(await cakeDAO.getProposalState(prop)).to.equal(1);

            (await cakeDAO.getProposalVotes(prop)).forEach(vote => {
                expect(vote).to.equal(0);
            })
        });

        it("Shouldn't be able to create a proposal if already exists", async function () {
            const { cakeDAO, alice } = await loadFixture(deployDaoWith3BalancesFixture);

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1"));

            await cakeDAO.connect(alice).createProposal(prop);

            await expect(cakeDAO.connect(alice).createProposal(prop)).to.be.revertedWith("Proposal already exists");
        });

        it("Shouldn't be able to create a proposal if not enough balance", async function () {
            const { cakeDAO, dan } = await loadFixture(deployDaoWith3BalancesFixture);

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1"));

            await expect(cakeDAO.connect(dan).createProposal(prop)).to.be.revertedWith("Not enough balance");
        });

        it("Shouldn't be able to create a proposal if 3 proposals already exists", async function () {
            const { cakeDAO, alice, bob, charle } = await loadFixture(deployDaoWith3BalancesFixture);

            await cakeDAO.connect(alice).createProposal(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1")));
            await cakeDAO.connect(bob).createProposal(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 2")));
            await cakeDAO.connect(charle).createProposal(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 3")));

            await expect(
                cakeDAO.connect(alice).createProposal(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 4")))
                ).to.be.revertedWith("Already 3 active proposals");
        });

        it("Should be able to create a proposal if 3 proposals already exists and one is expired", async function () {
            const { cakeDAO, alice, bob, charle } = await loadFixture(deployDaoWith3BalancesFixture);

            await cakeDAO.connect(alice).createProposal(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1")));
            await time.increase(24 * 60 * 60);

            await cakeDAO.connect(bob).createProposal(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 2")));
            await time.increase(24 * 60 * 60);

            await cakeDAO.connect(charle).createProposal(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 3")));
            await time.increase(24 * 60 * 60);

            await cakeDAO.connect(alice).createProposal(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 4")));

            const [_fst, _snd, _thd, event] = await cakeDAO.queryFilter(cakeDAO.filters.NewProposal(null, null));

            expect(event.args.proposalId).to.equal(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 4")));

            expect(await cakeDAO.getCurrentProposalsCount()).to.equal(3);

            const [realesd] = await cakeDAO.queryFilter(cakeDAO.filters.ProposalResult(null, null));

            expect(realesd.args.proposalId).to.equal(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1")));
            expect(realesd.args.state).to.equal(4);
        });
    });

    describe("Vote", function () {
    });


});