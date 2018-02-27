import OperationsChannel from "./OperationsChannel";
import { transform } from "./transform";
const clientId = Math.floor(Math.random() * 1000000);

class CollaborationClient {
  constructor({ onOperationReceived, onAllOperationsAcknowledged }) {
    this.pendingOperations = [];
    this.operationReceivedCallback = onOperationReceived;
    this.allOperationsAcknowledgedCallback = onAllOperationsAcknowledged;
    this.operationsChannel = null;
    this.operationTimeout = null;
    this.version = 0;
  }

  connect(documentId, initialVersion) {
    this.version = initialVersion;
    const operationsChannel = new OperationsChannel({
      clientId,
      documentId,
      onReceived: this._operationsReceived,
      onAcknowledged: this._operationAcknowledged,
      onError: this._operationError
    });
    operationsChannel.connect(() => {
      this.operationsChannel = operationsChannel;
      operationsChannel.requestOperationsSince(this.version);
    });
  }

  submitOperations(operations) {
    this.pendingOperations.push(...operations);
    if (!this.operationTimeout) {
      this.operationTimeout = setTimeout(this._submitNextOperation, 10);
    }
  }

  _operationsReceived = operations => {
    operations = operations.filter(
      operation => operation.version >= this.version
    );

    const [newOurs, newTheirs] = transform(this.pendingOperations, operations);

    this.pendingOperations = newOurs;
    newTheirs.forEach(operation => {
      if (this.operationReceivedCallback) {
        this.operationReceivedCallback(operation);
        this.version = operation.version + 1;
      }
    });
  };

  _operationError = data => {
    this.operationsChannel.requestOperationsSince(this.version);
    clearTimeout(this.operationTimeout);
    this.operationTimeout = setTimeout(this._submitNextOperation, 10);
  };

  _operationAcknowledged = operation => {
    this.version = operation.version + 1;
    this.pendingOperations.shift();

    if (this.pendingOperations.length > 0) {
      this._submitNextOperation();
    } else {
      this.operationTimeout = null;
      if (this.allOperationsAcknowledgedCallback) {
        this.allOperationsAcknowledgedCallback(this.version);
      }
    }
  };

  _submitNextOperation = () => {
    if (this.pendingOperations.length === 0) {
      this.operationTimeout = null;
      return;
    }

    if (!this.operationsChannel) {
      // wait a bit, hopefully we'll have a connection soon
      clearTimeout(this.operationTimeout);
      this.operationTimeout = setTimeout(this._submitNextOperation, 100);
      return;
    }

    const operation = this.pendingOperations[0];
    this.operationsChannel.submitOperation({
      ...operation,
      version: this.version
    });
  };
}

export default CollaborationClient;
