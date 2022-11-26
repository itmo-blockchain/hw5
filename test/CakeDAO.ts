import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { CakeDAO } from "../typechain-types";

describe("CakeDAO", function () {
    
    async function deployDaoWith3BalancesFixture() {
        const [alice, bob, charle, dan] = await ethers.getSigners();

        const Cake = await ethers.getContractFactory("CakeToken");
        const cake = await Cake.deploy();

        const CakeDAO = await ethers.getContractFactory("CakeDAO");
        const cakeDAO = await CakeDAO.deploy(cake.address);

        await cake.connect(alice).transfer(bob.address, 40 * 10 ** 6);
        await cake.connect(alice).transfer(charle.address, 35 * 10 ** 6);

        await cake.connect(alice).delegate(alice.address);
        await cake.connect(bob).delegate(bob.address);
        await cake.connect(charle).delegate(charle.address);

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

            [{i: 0, owner: alice}, {i: 1, owner: bob}, {i: 2, owner: charle}].forEach(async ({i, owner}) => {
                const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`Proposal ${i}`));
                await cakeDAO.connect(owner).createProposal(prop);
            })

            await expect(
                cakeDAO.connect(alice).createProposal(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 3")))
                ).to.be.revertedWith("Already 3 active proposals");
        });

        it("Should be able to create a proposal if 3 proposals already exists and one is expired", async function () {
            const { cakeDAO, alice, bob, charle } = await loadFixture(deployDaoWith3BalancesFixture);

            for (const {i, owner} of [{i: 0, owner: alice}, {i: 1, owner: bob}, {i: 2, owner: charle}]) {
                const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`Proposal ${i}`));
                await cakeDAO.connect(owner).createProposal(prop);
                await time.increase(24 * 60 * 60);
            }

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 3"));
            await cakeDAO.connect(alice).createProposal(prop);

            const [event] = await cakeDAO.queryFilter(cakeDAO.filters.NewProposal(prop, null));

            expect(event.args.proposalId).to.equal(prop);

            expect(await cakeDAO.getCurrentProposalsCount()).to.equal(3);

            const [realesed] = await cakeDAO.queryFilter(cakeDAO.filters.ProposalResult(null, null));

            expect(realesed.args.proposalId).to.equal(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 0")));
            expect(realesed.args.state).to.equal(4);
        });
    });

    describe("Vote", function () {
        it("Should be able to vote", async function () {
            const { cakeDAO, alice} = await loadFixture(deployDaoWith3BalancesFixture);

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1"));
            await cakeDAO.connect(alice).createProposal(prop);

            await cakeDAO.connect(alice).vote(prop, 10 * 10 ** 6, true);

            const [event] = await cakeDAO.queryFilter(cakeDAO.filters.Vote(null, null, null, null));

            expect(event.args.proposalId).to.equal(prop);
            expect(event.args.voter).to.equal(alice.address);
            expect(event.args.value).to.equal(10 * 10 ** 6);
            expect(event.args.forVote).to.equal(true);

            expect(await cakeDAO.getProposalVotes(prop)).to.deep.equal([10 * 10 ** 6, 0]);
        }); 

        it("Shouldn't be able to vote if proposal doesn't exists", async function () {
            const { cakeDAO, alice} = await loadFixture(deployDaoWith3BalancesFixture);

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1"));

            await expect(cakeDAO.connect(alice).vote(prop, 10 * 10 ** 6, true)).to.be.revertedWith("Proposal is not active");
        });

        it("Shouldn't be able to vote if proposal is expired", async function () {
            const { cakeDAO, alice} = await loadFixture(deployDaoWith3BalancesFixture);

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1"));
            await cakeDAO.connect(alice).createProposal(prop);

            await time.increase(4 * 24 * 60 * 60);

            await expect(cakeDAO.connect(alice).vote(prop, 10 * 10 ** 6, true)).to.be.revertedWith("Proposal is expired");
        });

        it("Shouldn't be able to vote if not enough balance", async function () {
            const { cakeDAO, charle, dan} = await loadFixture(deployDaoWith3BalancesFixture);

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1"));
            await cakeDAO.connect(charle).createProposal(prop);

            await expect(cakeDAO.connect(dan).vote(prop, 10 * 10 ** 6, true)).to.be.revertedWith("Not enough balance");
        });

        it("Should be able to vote second time if not all balance is used", async function () {
            const { cakeDAO, alice} = await loadFixture(deployDaoWith3BalancesFixture);

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1"));
            await cakeDAO.connect(alice).createProposal(prop);

            await cakeDAO.connect(alice).vote(prop, 10 * 10 ** 6, true);

            await cakeDAO.connect(alice).vote(prop, 10 * 10 ** 6, true);

            const [_, event] = await cakeDAO.queryFilter(cakeDAO.filters.Vote(null, null, null, null));

            expect(event.args.proposalId).to.equal(prop);
            expect(event.args.voter).to.equal(alice.address);
            expect(event.args.value).to.equal(10 * 10 ** 6);
            expect(event.args.forVote).to.equal(true);

            expect(await cakeDAO.getProposalVotes(prop)).to.deep.equal([20 * 10 ** 6, 0]);
        });

        it("Should be able to delegate all votes to another address", async function () {
            const { cake, cakeDAO, alice, bob, charle, dan} = await loadFixture(deployDaoWith3BalancesFixture);

            await cake.connect(alice).delegate(dan.address);
            await cake.connect(bob).delegate(dan.address);
            await cake.connect(charle).delegate(dan.address);

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1"));
            await cakeDAO.connect(alice).createProposal(prop);

            await cakeDAO.connect(dan).vote(prop, 100 * 10 ** 6, true);

            const [event] = await cakeDAO.queryFilter(cakeDAO.filters.Vote(null, null, null, null));

            expect(event.args.proposalId).to.equal(prop);
            expect(event.args.voter).to.equal(dan.address);
            expect(event.args.value).to.equal(100 * 10 ** 6);
            expect(event.args.forVote).to.equal(true);

            expect(await cakeDAO.getProposalVotes(prop)).to.deep.equal([100 * 10 ** 6, 0]);
        });

        it("Shouldn't be able to vote after delegate", async function () {
            const { cake, cakeDAO, alice, dan} = await loadFixture(deployDaoWith3BalancesFixture);

            await cake.connect(alice).delegate(dan.address);

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1"));
            await cakeDAO.connect(alice).createProposal(prop);

            await expect(cakeDAO.connect(alice).vote(prop, 100 * 10 ** 6, true)).to.be.revertedWith("Not enough balance");
        });

        it("Shouldn't be able to vote if delegate start after proposal", async function () {
            const { cake, cakeDAO, alice, bob, charle, dan} = await loadFixture(deployDaoWith3BalancesFixture);

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1"));
            await cakeDAO.connect(alice).createProposal(prop);

            await cake.connect(alice).delegate(dan.address);
            await cake.connect(bob).delegate(dan.address);
            await cake.connect(charle).delegate(dan.address);

            await expect(cakeDAO.connect(dan).vote(prop, 100 * 10 ** 6, true)).to.be.revertedWith("Not enough balance");
        });

        it("Shouldn't be able to vote if proposal is finished", async function () {
            const { cakeDAO, alice, bob, charle} = await loadFixture(deployDaoWith3BalancesFixture);

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1"));
            await cakeDAO.connect(alice).createProposal(prop);

            await cakeDAO.connect(alice).vote(prop, 25 * 10 ** 6, true);
            await cakeDAO.connect(bob).vote(prop, 40 * 10 ** 6, true);

            await expect(cakeDAO.connect(charle).vote(prop, 35 * 10 ** 6, true)).to.be.revertedWith("Proposal is not active");
        });
    });

    describe("Vote result", async function () {
        it("Should be able to get vote result", async function () {
            const { cakeDAO, alice, bob, charle} = await loadFixture(deployDaoWith3BalancesFixture);

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1"));
            await cakeDAO.connect(alice).createProposal(prop);

            await cakeDAO.connect(alice).vote(prop, 10 * 10 ** 6, true);
            await cakeDAO.connect(bob).vote(prop, 20 * 10 ** 6, true);
            await cakeDAO.connect(charle).vote(prop, 30 * 10 ** 6, false);

            expect(await cakeDAO.getProposalVotes(prop)).to.deep.equal([30 * 10 ** 6, 30 * 10 ** 6]);
        });

        it("Should be able to get vote result after delegate", async function () {
            const { cake, cakeDAO, alice, bob, charle, dan} = await loadFixture(deployDaoWith3BalancesFixture);

            await cake.connect(alice).delegate(dan.address);
            await cake.connect(bob).delegate(dan.address);
            await cake.connect(charle).delegate(dan.address);

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1"));
            await cakeDAO.connect(alice).createProposal(prop);

            await cakeDAO.connect(dan).vote(prop, 100 * 10 ** 6, true);

            expect(await cakeDAO.getProposalVotes(prop)).to.deep.equal([100 * 10 ** 6, 0]);
        });

        it("Should finish proposal if accept quorum is reached", async function () {
            const { cakeDAO, alice, bob, charle} = await loadFixture(deployDaoWith3BalancesFixture);

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1"));
            await cakeDAO.connect(alice).createProposal(prop);

            await cakeDAO.connect(alice).vote(prop, 10 * 10 ** 6, true);
            await cakeDAO.connect(bob).vote(prop, 20 * 10 ** 6, true);
            await cakeDAO.connect(charle).vote(prop, 30 * 10 ** 6, true);

            const [event] = await cakeDAO.queryFilter(cakeDAO.filters.ProposalResult(null, null));

            expect(event.args.proposalId).to.equal(prop);
            expect(event.args.state).to.equal(2);
        });

        it("Should finish proposal if reject quorum is reached", async function () {
            const { cakeDAO, alice, bob, charle} = await loadFixture(deployDaoWith3BalancesFixture);

            const prop = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal 1"));
            await cakeDAO.connect(alice).createProposal(prop);

            await cakeDAO.connect(alice).vote(prop, 10 * 10 ** 6, false);
            await cakeDAO.connect(bob).vote(prop, 20 * 10 ** 6, false);
            await cakeDAO.connect(charle).vote(prop, 30 * 10 ** 6, false);

            const [event] = await cakeDAO.queryFilter(cakeDAO.filters.ProposalResult(null, null));

            expect(event.args.proposalId).to.equal(prop);
            expect(event.args.state).to.equal(3);
        })
    });


});