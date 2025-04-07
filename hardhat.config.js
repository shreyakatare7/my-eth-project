require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      // Hardhat's default network configuration for local node
      accounts: {
        // Create 100 accounts with 10000 ether each
        count: 100, // Number of accounts
        initialBalance: "10000000000000000000000", // 10,000 ETH in wei (10000 ether)
      }
    }
  }
};
