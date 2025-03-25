// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract IoTAuth {
    address public owner;
    
    struct Device {
        string token;
        string data; // Data stored on-chain
        string key;
    }

    mapping(address => Device) private devices;

    event DeviceRegistered(address indexed device, string token);
    event KeyAssigned(address indexed device, string key);
    event DataStored(address indexed device, string data);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }

    function registerDevice(address device) public onlyOwner returns (string memory) {
        require(bytes(devices[device].token).length == 0, "Device already registered");

        string memory token = string(abi.encodePacked("TOKEN-", toAsciiString(device)));
        devices[device].token = token;
        emit DeviceRegistered(device, token);
        return token;
    }

    function verifyToken(address device, string memory token) public view returns (bool) {
        return keccak256(abi.encodePacked(devices[device].token)) == keccak256(abi.encodePacked(token));
    }

    function storeData(address device, string memory data) public {
        require(bytes(devices[device].token).length > 0, "Device not registered");
        devices[device].data = data;
        emit DataStored(device, data);
    }

    function getData(address device) public view returns (string memory) {
        require(bytes(devices[device].token).length > 0, "Device not registered");
        return devices[device].data;
    }

    function assignKey(address device, string memory key) public onlyOwner {
        require(bytes(devices[device].token).length > 0, "Device not registered");
        devices[device].key = key;
        emit KeyAssigned(device, key);
    }

    function getKey(address device) public view returns (string memory) {
        require(bytes(devices[device].token).length > 0, "Device not registered");
        return devices[device].key;
    }

    function getDeviceToken(address device) public view returns (string memory) {
        require(bytes(devices[device].token).length > 0, "Device not registered");
        return devices[device].token;
    }

    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint160(x) >> (8 * (19 - i))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2 * i] = char(hi);
            s[2 * i + 1] = char(lo);
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) {
            return bytes1(uint8(b) + 48);
        } else {
            return bytes1(uint8(b) + 87);
        }
    }
}
