# Blockchain for IoT Security and Trust Management Project
## Overview
This project implements a blockchain-based authentication and data encryption system for IoT devices. It enables secure device registration, key management, and data encryption/decryption using Ethereum smart contracts and cryptographic techniques. The system also evaluates performance metrics like: 
- Time to complete handshake (token issuance/fetching) 
- Time for key generation 
- Time for encryption/decryption 
- Impact of increasing concurrent clients on response time
## Setup Instructions
### Prerequisites
- Node.js
- Hardhat
- Javascript
- Solidity
### Installation
#### Clone the repository
git clone https://github.com/your-username/my-eth-project.git <br />
cd my-eth-project
#### Install dependencies
npm install
#### Start Hardhat local blockchain
npx hardhat node
#### In a new command line in the same directory, deploy smart contracts
npx hardhat run scripts/deploy.js --network localhost
#### Copy the contract address and account numbers to appropriate section in interact.js
const contractAddress = "contract address here"; <br />
const deviceAddresses = [add addresses here];
#### Run the simulation
npx hardhat run scripts/interact.js --network localhost
