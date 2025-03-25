const hre = require("hardhat");
const crypto = require("crypto"); // For off-chain encryption simulation

// Simulated NuCypher (Off-Chain Encryption/Decryption)
function encryptData(data, key) {
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key, "hex"), Buffer.alloc(16, 0));
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
}

function decryptData(encryptedData, key) {
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key, "hex"), Buffer.alloc(16, 0));
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

async function main() {
    const [deployer] = await hre.ethers.getSigners(); 

    const IoTAuth = await hre.ethers.getContractFactory("IoTAuth", deployer);
    const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
    const iotAuth = await IoTAuth.attach(contractAddress);

    console.log("Contract attached at:", contractAddress);

    // List of device addresses
    const deviceAddresses = [
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
        "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
        "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
        "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
        "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
        "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
        "0x71bE63f3384f5fb98995898A86B02Fb2426c5788"
        ];

    for (let deviceAddress of deviceAddresses) {
        console.log(`\nProcessing device: ${deviceAddress}...`);

        // Register Device & Get Token
        try {
            let token = await iotAuth.registerDevice(deviceAddress);
            console.log(`Device registered with token: ${deviceAddress}: ${token.value}`);

            // Verify Token
            let isValid = await iotAuth.verifyToken(deviceAddress, token);
            console.log(`Token validation result: ${isValid}`);
        } catch (error) {
            console.log(`Device already registered. Fetching token...`);
            let token = await iotAuth.getDeviceToken(deviceAddress);
            console.log(`Existing token: ${token}`);
        }

        // Assign a Secret Key
        const deviceKey = crypto.randomBytes(32).toString("hex"); // Generate a 256-bit key
        await iotAuth.assignKey(deviceAddress, deviceKey);
        console.log(`Key assigned successfully.`);

        // Retrieve & Confirm Key
        let storedKey = await iotAuth.getKey(deviceAddress);
        console.log(`Retrieved Key: ${storedKey}`);

        // Encrypt & Store Data
        const originalData = `Temperature: 25°C, Humidity: 60%`;
        const encryptedData = encryptData(originalData, deviceKey);
        await iotAuth.storeData(deviceAddress, encryptedData);
        console.log(`Encrypted data stored on-chain.`);

        // Retrieve & Decrypt Data
        let storedData = await iotAuth.getData(deviceAddress);
        console.log(`Retrieved Encrypted Data: ${storedData}`);

        // Decrypt Data
        const decryptedData = decryptData(storedData, deviceKey);
        console.log(`Decrypted Data: ${decryptedData}`);
    }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
