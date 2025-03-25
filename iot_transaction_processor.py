import hashlib
import json
import logging

from sawtooth_sdk.processor.core import TransactionProcessor
from sawtooth_sdk.processor.handler import TransactionHandler
from sawtooth_sdk.processor.exceptions import InvalidTransaction
from sawtooth_sdk.processor.context import Context

LOGGER = logging.getLogger(__name__)

# Define the transaction family and namespace prefix
FAMILY_NAME = "iot_auth"
FAMILY_VERSION = "1.0"
NAMESPACE_PREFIX = hashlib.sha512(FAMILY_NAME.encode('utf-8')).hexdigest()[0:6]

class IoTAuthTransactionHandler(TransactionHandler):
    @property
    def family_name(self):
        return FAMILY_NAME

    @property
    def family_versions(self):
        return [FAMILY_VERSION]

    @property
    def namespaces(self):
        return [NAMESPACE_PREFIX]

    def apply(self, transaction, context: Context):
        try:
            payload = json.loads(transaction.payload.decode())
        except Exception as e:
            raise InvalidTransaction("Failed to decode payload: {}".format(e))

        action = payload.get("action")
        device_address = payload.get("device_address")
        key = payload.get("key")
        data = payload.get("data")

        if action == "store_key":
            self._store_key(context, device_address, key)
        elif action == "verify_key":
            self._verify_key(context, device_address, key)
        elif action == "store_data":
            self._store_data(context, device_address, key, data)
        else:
            raise InvalidTransaction("Unknown action: {}".format(action))

    def _store_key(self, context: Context, device_address, key):
        """Store a new device key in the blockchain state."""
        state_address = self._make_address(device_address, "key")
        state_entries = context.get_state([state_address])

        if state_entries:
            raise InvalidTransaction("Key already exists for device: {}".format(device_address))

        addresses = context.set_state({state_address: key.encode()})
        if not addresses:
            raise InvalidTransaction("Failed to store key for device: {}".format(device_address))

        LOGGER.info("Stored key for device %s", device_address)

    def _verify_key(self, context: Context, device_address, key):
        """Check if the provided key matches the stored key."""
        state_address = self._make_address(device_address, "key")
        state_entries = context.get_state([state_address])

        if not state_entries:
            raise InvalidTransaction("No key found for device: {}".format(device_address))
        
        stored_key = state_entries[state_address].decode()
        if stored_key != key:
            raise InvalidTransaction("Key verification failed for device: {}".format(device_address))

        LOGGER.info("Key verified for device %s", device_address)

    def _store_data(self, context: Context, device_address, key, data):
        """Only store data if the provided key is valid."""
        self._verify_key(context, device_address, key)  # Validate key before storing data

        state_address = self._make_address(device_address, "data")
        addresses = context.set_state({state_address: data.encode()})
        if not addresses:
            raise InvalidTransaction("Failed to store data for device: {}".format(device_address))

        LOGGER.info("Stored data for device %s", device_address)

    def _make_address(self, device_address, suffix):
        """Generate a blockchain state address using hashing."""
        device_hash = hashlib.sha512(device_address.encode('utf-8')).hexdigest()[:64]
        suffix_hash = hashlib.sha512(suffix.encode('utf-8')).hexdigest()[:6]
        return NAMESPACE_PREFIX + device_hash + suffix_hash

def main():
    processor = TransactionProcessor(url="tcp://localhost:4004")
    handler = IoTAuthTransactionHandler()
    processor.add_handler(handler)
    try:
        processor.start()
    except KeyboardInterrupt:
        pass
    finally:
        processor.stop()

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    main()
