const hre = require("hardhat");
const crypto = require("crypto"); // For encryption/decryption
const { performance } = require("perf_hooks"); // For performance metrics

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
        "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"
    ];

    const start = performance.now();  // Record the start time

    // Process each device concurrently
    let promises = deviceAddresses.map(async (deviceAddress) => {
        console.log(`Processing device: ${deviceAddress}...`);

        try {
            // Record time for Handshake and Registration
            const handshakeStart = performance.now();
            let token = await iotAuth.registerDevice(deviceAddress);
            const handshakeEnd = performance.now();
            console.log(`Handshake (Registration) for ${deviceAddress} took: ${(handshakeEnd - handshakeStart).toFixed(2)} ms`);

            console.log(`Device registered with token: ${deviceAddress}: ${token.value}`);
            
            // Verify Token
            let isValid = await iotAuth.verifyToken(deviceAddress, token.value);
            console.log(`Token validation result: ${isValid}`);
        } catch (error) {
            console.log(`Device already registered. Fetching token...`);
            let token = await iotAuth.getDeviceToken(deviceAddress);
            console.log(`Existing token: ${token}`);
        }

        // Assign a Secret Key
        const keyGenerationStart = performance.now();
        const deviceKey = crypto.randomBytes(32).toString("hex"); // Generate a 256-bit key
        await iotAuth.assignKey(deviceAddress, deviceKey);
        const keyGenerationEnd = performance.now();
        console.log(`Key generation for ${deviceAddress} took: ${(keyGenerationEnd - keyGenerationStart).toFixed(2)} ms`);
        
        // Retrieve & Confirm Key
        let storedKey = await iotAuth.getKey(deviceAddress);
        console.log(`Retrieved Key: ${storedKey}`);

        // Encrypt Data
        const encryptionStart = performance.now();
        const originalData = `Temperature: 25°C, Humidity: 60%`;
        const encryptedData = encryptData(originalData, deviceKey);
        await iotAuth.storeData(deviceAddress, encryptedData);
        const encryptionEnd = performance.now();
        console.log(`Encryption for ${deviceAddress} took: ${(encryptionEnd - encryptionStart).toFixed(2)} ms`);
        console.log(`Encrypted data stored on-chain.`);

        // Retrieve & Decrypt Data
        let storedData = await iotAuth.getData(deviceAddress);
        console.log(`Retrieved Encrypted Data: ${storedData}`);

        // Decrypt Data
        const decryptionStart = performance.now();
        const decryptedData = decryptData(storedData, deviceKey);
        const decryptionEnd = performance.now();
        console.log(`Decryption for ${deviceAddress} took: ${(decryptionEnd - decryptionStart).toFixed(2)} ms`);
        console.log(`Decrypted Data: ${decryptedData}`);
    });

    // Wait for all promises to finish
    await Promise.all(promises);

    const end = performance.now();  // Record the end time
    console.log(`Time to process ${deviceAddresses.length} devices: ${(end - start).toFixed(2)} ms`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
