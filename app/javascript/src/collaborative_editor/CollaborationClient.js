import OperationsChannel from "./OperationsChannel";
import SelectionsChannel from "./SelectionsChannel";
import { transform, transformOffset } from "./transform";
const clientId = Math.floor(Math.random() * 1000000);

class CollaborationClient {
  constructor({
    onOperationReceived,
    onAllOperationsAcknowledged,
    onSelectionUpdate
  }) {
    this.pendingOperations = [];
    this.operationReceivedCallback = onOperationReceived;
    this.allOperationsAcknowledgedCallback = onAllOperationsAcknowledged;
    this.selectionUpdateCallback = onSelectionUpdate;
    this.operationsChannel = null;
    this.operationTimeout = null;
    this.selectionsChannel = null;
    this.version = 0;
  }

  connect(document, initialVersion) {
    this.version = initialVersion;
    this.connectOperationsChannel(document.id, initialVersion);
    this.connectSelectionsChannel(document, initialVersion);
  }

  connectOperationsChannel(documentId, initialVersion) {
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

  connectSelectionsChannel(document, initialVersion) {
    const selectionsChannel = new SelectionsChannel({
      clientId,
      documentId: document.id,
      version: initialVersion,
      onSelectionUpdate: this._selectionReceived
    });
    selectionsChannel.connect(() => {
      this.selectionsChannel = selectionsChannel;
      this.setOffset(document.offset);
    });
  }

  submitOperations(operations) {
    this.pendingOperations.push(...operations);
    if (!this.operationTimeout) {
      this.operationTimeout = setTimeout(this._submitNextOperation, 10);
    }
  }

  setOffset(newOffset) {
    if (this.pendingOperations.length === 0) {
      this.selectionsChannel &&
        this.selectionsChannel.setOffset(clientId, this.version, newOffset);
    }
  }

  updateVersion(newVersion) {
    this.version = newVersion;
    this.selectionsChannel && this.selectionsChannel.updateVersion(newVersion);
  }

  _operationsReceived = operations => {
    operations = operations.filter(
      operation => operation.version >= this.version
    );

    // We can only transform their operations against our operations
    // if both sets start from the same document version.
    if (operations.length > 0 && operations[0].version !== this.version) return;

    const [newOurs, newTheirs] = transform(this.pendingOperations, operations);

    this.pendingOperations = newOurs;

    newTheirs.forEach(operation => {
      if (operation.version !== this.version) return;
      this.operationReceivedCallback &&
        this.operationReceivedCallback(operation);
      this.updateVersion(operation.version + 1);
    });
  };

  _operationError = data => {
    this.operationsChannel.requestOperationsSince(this.version);
    clearTimeout(this.operationTimeout);
    this.operationTimeout = setTimeout(this._submitNextOperation, 10);
  };

  _operationAcknowledged = operation => {
    this.updateVersion(operation.version + 1);
    this.pendingOperations.shift();

    if (this.pendingOperations.length > 0) {
      this._submitNextOperation();
    } else {
      this.operationTimeout = null;
      this.allOperationsAcknowledgedCallback &&
        this.allOperationsAcknowledgedCallback(this.version);
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

  _selectionReceived = ({ clientId, offset }) => {
    offset = transformOffset(offset, this.pendingOperations);
    this.selectionUpdateCallback &&
      this.selectionUpdateCallback({ clientId, offset });
  };
}

export default CollaborationClient;
