const hre = require("hardhat");
const crypto = require("crypto");
const { performance } = require("perf_hooks");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

// csv for individual device metrics
const metricsWriter = createCsvWriter({
    path: 'metrics.csv',
    header: [
        { id: 'Device', title: 'Device' },
        { id: 'HandshakeTime', title: 'HandshakeTime(ms)' },
        { id: 'KeyGenerationTime', title: 'KeyGenerationTime(ms)' },
        { id: 'EncryptionTime', title: 'EncryptionTime(ms)' },
        { id: 'DecryptionTime', title: 'DecryptionTime(ms)' }
    ],
    append: false
});

// csv for concurrency metrics
const concurrencyWriter = createCsvWriter({
    path: 'concurrency_metrics.csv',
    header: [
        { id: 'Clients', title: 'Clients' },
        { id: 'TotalTime', title: 'TotalTime(ms)' }
    ],
    append: false
});

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

async function runClients(deviceAddresses) {
    const [deployer] = await hre.ethers.getSigners();
    const IoTAuth = await hre.ethers.getContractFactory("IoTAuth", deployer);
    const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
    const iotAuth = await IoTAuth.attach(contractAddress);

    const metrics = [];

    const start = performance.now(); // Time before all clients

    await Promise.all(deviceAddresses.map(async (deviceAddress) => {
        let handshakeTime = 0, keyTime = 0, encTime = 0, decTime = 0;

        try {
            const handshakeStart = performance.now();
            let token = await iotAuth.registerDevice(deviceAddress);
            const handshakeEnd = performance.now();
            handshakeTime = (handshakeEnd - handshakeStart);
            console.log(`Handshake (Registration) for ${deviceAddress}: ${handshakeTime.toFixed(2)} ms`);
        } catch (err) {
            const fallbackStart = performance.now();
            await iotAuth.getDeviceToken(deviceAddress);
            const fallbackEnd = performance.now();
            handshakeTime = (fallbackEnd - fallbackStart);
            console.log(`Fetched existing token for ${deviceAddress}: ${handshakeTime.toFixed(2)} ms`);
        }

        // Key Generation
        const keyStart = performance.now();
        const key = crypto.randomBytes(32).toString("hex");
        await iotAuth.assignKey(deviceAddress, key);
        const keyEnd = performance.now();
        keyTime = (keyEnd - keyStart);

        // Encryption
        const originalData = "Temperature: 25°C, Humidity: 60%";
        const encStart = performance.now();
        const encrypted = encryptData(originalData, key);
        await iotAuth.storeData(deviceAddress, encrypted);
        const encEnd = performance.now();
        encTime = (encEnd - encStart);

        // Decryption
        const decStart = performance.now();
        const stored = await iotAuth.getData(deviceAddress);
        const decrypted = decryptData(stored, key);
        const decEnd = performance.now();
        decTime = (decEnd - decStart);

        console.log(`${deviceAddress}: Key=${key.slice(0, 8)}..., Encrypted=${encrypted.slice(0, 8)}..., Decrypted=${decrypted}`);

        // Push to csv
        metrics.push({
            Device: deviceAddress,
            HandshakeTime: handshakeTime.toFixed(2),
            KeyGenerationTime: keyTime.toFixed(2),
            EncryptionTime: encTime.toFixed(2),
            DecryptionTime: decTime.toFixed(2)
        });
    }));

    const end = performance.now();
    const totalTime = (end - start).toFixed(2);
    console.log(`Total time for ${deviceAddresses.length} clients: ${totalTime} ms`);

    // Write csvs
    if (deviceAddresses.length <= 10) {
        await metricsWriter.writeRecords(metrics);
    }    
    await concurrencyWriter.writeRecords([{ Clients: deviceAddresses.length, TotalTime: totalTime }]);
}

async function main() {
    const allDevices = [
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
        
        "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
        
        "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
        
        "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
        
        "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097",
        
        "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
        
        "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
        
        "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
        
        "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
        
        "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
        
        "0x09DB0a93B389bEF724429898f539AEB7ac2Dd55f",
        
        "0x02484cb50AAC86Eae85610D6f4Bf026f30f6627D",
        
        "0x08135Da0A343E492FA2d4282F2AE34c6c5CC1BbE",
        
        "0x5E661B79FE2D3F6cE70F5AAC07d8Cd9abb2743F1",
        
        "0x61097BA76cD906d2ba4FD106E757f7Eb455fc295",
        
        "0xDf37F81dAAD2b0327A0A50003740e1C935C70913",
        
        "0x553BC17A05702530097c3677091C5BB47a3a7931",
        
         "0x87BdCE72c06C21cd96219BD8521bDF1F42C78b5e", 
        
         "0x40Fc963A729c542424cD800349a7E4Ecc4896624",
        
         "0x9DCCe783B6464611f38631e6C851bf441907c710",
        
         "0x1BcB8e569EedAb4668e55145Cfeaf190902d3CF2",
        
         "0x8263Fce86B1b78F95Ab4dae11907d8AF88f841e7",
        
         "0xcF2d5b3cBb4D7bF04e3F7bFa8e27081B52191f91",
        
         "0x86c53Eb85D0B7548fea5C4B4F82b4205C8f6Ac18",
        
         "0x1aac82773CB722166D7dA0d5b0FA35B0307dD99D", 
        
         "0x2f4f06d218E426344CFE1A83D53dAd806994D325", 
        
         "0x1003ff39d25F2Ab16dBCc18EcE05a9B6154f65F4", 
        
         "0x9eAF5590f2c84912A08de97FA28d0529361Deb9E", 
        
         "0x11e8F3eA3C6FcF12EcfF2722d75CEFC539c51a1C", 
        
        "0x7D86687F980A56b832e9378952B738b614A99dc6", 
        
         "0x9eF6c02FB2ECc446146E05F1fF687a788a8BF76d", 
        
         "0x08A2DE6F3528319123b25935C92888B16db8913E",  
        
         "0xe141C82D99D85098e03E1a1cC1CdE676556fDdE0",  
        
         "0x4b23D303D9e3719D6CDf8d172Ea030F80509ea15",  
        
         "0xC004e69C5C04A223463Ff32042dd36DabF63A25a",  
        
         "0x5eb15C0992734B5e77c888D713b4FC67b3D679A2",  
        
         "0x7Ebb637fd68c523613bE51aad27C35C4DB199B9c",  
        
         "0x3c3E2E178C69D4baD964568415a0f0c84fd6320A",  
        
         "0x35304262b9E87C00c430149f28dD154995d01207",  
        
         "0xD4A1E660C916855229e1712090CcfD8a424A2E33",  
        
         "0xEe7f6A930B29d7350498Af97f0F9672EaecbeeFf",  
        
         "0x145e2dc5C8238d1bE628F87076A37d4a26a78544",  
        
         "0xD6A098EbCc5f8Bd4e174D915C54486B077a34A51",  
        
         "0x042a63149117602129B6922ecFe3111168C2C323",  
        
         "0xa0EC9eE47802CeB56eb58ce80F3E41630B771b04",  
        
         "0xe8B1ff302A740fD2C6e76B620d45508dAEc2DDFf",  
        
         "0xAb707cb80e7de7C75d815B1A653433F3EEc44c74",  
        
         "0x0d803cdeEe5990f22C2a8DF10A695D2312dA26CC",  
        
         "0x1c87Bb9234aeC6aDc580EaE6C8B59558A4502220",  
        
         "0x4779d18931B35540F84b0cd0e9633855B84df7b8",  
        
        "0xC0543b0b980D8c834CBdF023b2d2A75b5f9D1909",  
        
         "0x73B3074ac649A8dc31c2C90a124469456301a30F",  
        
         "0x265188114EB5d5536BC8654d8e9710FE72C28c4d",  
        
        "0x924Ba5Ce9f91ddED37b4ebf8c0dc82A40202fc0A",  
        
         "0x64492E25C30031EDAD55E57cEA599CDB1F06dad1",  
        
         "0x262595fa2a3A86adACDe208589614d483e3eF1C0",  
        
         "0xDFd99099Fa13541a64AEe9AAd61c0dbf3D32D492",  
        
         "0x63c3686EF31C03a641e2Ea8993A91Ea351e5891a",  
        
         "0x9394cb5f737Bd3aCea7dcE90CA48DBd42801EE5d",  
        
         "0x344dca30F5c5f74F2f13Dc1d48Ad3A9069d13Ad9",  
        
         "0xF23E054D8b4D0BECFa22DeEF5632F27f781f8bf5",  
        
         "0x6d69F301d1Da5C7818B5e61EECc745b30179C68b",  
        
         "0xF0cE7BaB13C99bA0565f426508a7CD8f4C247E5a",  
        
         "0x011bD5423C5F77b5a0789E27f922535fd76B688F",  
        
         "0xD9065f27e9b706E5F7628e067cC00B288dddbF19",  
        
         "0x54ccCeB38251C29b628ef8B00b3cAB97e7cAc7D5",  
        
         "0xA1196426b41627ae75Ea7f7409E074BE97367da2",  
        
         "0xE74cEf90b6CF1a77FEfAd731713e6f53e575C183",  
        
         "0x7Df8Efa6d6F1CB5C4f36315e0AcB82b02Ae8BA40",  
        
         "0x9E126C57330FA71556628e0aabd6B6B6783d99fA",  
        
        "0x586BA39027A74e8D40E6626f89Ae97bA7f616644",  
        
         "0x9A50ed082Cf2fc003152580dcDB320B834fA379E",  
        
         "0xbc8183bac3E969042736f7af07f76223D11D2148",  
        
         "0x586aF62EAe7F447D14D25f53918814e04d3A5BA4",  
        
         "0xCcDd262f272Ee6C226266eEa13eE48D4d932Ce66",  
        
         "0xF0eeDDC5e015d4c459590E01Dcc2f2FD1d2baac7",  
        
        "0x4edFEDFf17ab9642F8464D6143900903dD21421a",  
        
        "0x492C973C16E8aeC46f4d71716E91b05B245377C9",  
        
        "0xE5D3ab6883b7e8c35c04675F28BB992Ca1129ee4",  
        
        "0x71F280DEA6FC5a03790941Ad72956f545FeB7a52",  
        
        "0xE77478D9E136D3643cFc6fef578Abf63F9Ab91B1",  
        
        "0x6C8EA11559DFE79Ae3dBDD6A67b47F61b929398f",  
        
         "0x48fA7b63049A6F4E7316EB2D9c5BDdA8933BCA2f",  
        
        "0x16aDfbeFdEfD488C992086D472A4CA577a0e5e54",  
        
        "0x225356FF5d64889D7364Be2c990f93a66298Ee8D",  
        
        "0xcBDc0F9a4C38f1e010bD3B6e43598A55D1868c23", 
        
        "0xBc5BdceE96b1BC47822C74e6f64186fbA7d686be", 
        
        "0x0536896a5e38BbD59F3F369FF3682677965aBD19", 
        
        "0xFE0f143FcAD5B561b1eD2AC960278A2F23559Ef9", 
        
        "0x98D08079928FcCB30598c6C6382ABfd7dbFaA1cD"
          ];

    await runClients(allDevices.slice(0, 10));  // Run 10 clients
    await runClients(allDevices.slice(0, 25));  // Run 25 clients
    await runClients(allDevices.slice(0, 50));  // Run 50 clients
    await runClients(allDevices.slice(0, 75));  // Run 75 clients
    await runClients(allDevices.slice(0, 100)); // Run 100 clients
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
