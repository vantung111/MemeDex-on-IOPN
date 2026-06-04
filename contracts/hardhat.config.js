require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";

module.exports = {
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    opnTestnet: {
      url: "https://testnet-rpc.iopn.tech",
      chainId: 984,
      accounts: [PRIVATE_KEY],
      gasPrice: 7000000000,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 984,
    },
  },
  etherscan: {
    apiKey: {
      opnTestnet: "opn-testnet",
    },
    customChains: [
      {
        network: "opnTestnet",
        chainId: 984,
        urls: {
          apiURL: "https://testnet.iopn.tech/api",
          browserURL: "https://testnet.iopn.tech",
        },
      },
    ],
  },
  sourcify: { enabled: false },
};
