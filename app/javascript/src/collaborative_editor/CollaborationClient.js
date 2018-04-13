import OperationsChannel from "./OperationsChannel";
import SelectionsChannel from "./SelectionsChannel";
import { transform, transformOffset } from "./transform";
import compose from "./compose";

const clientId = Math.floor(Math.random() * 1000000);

class CollaborationClient {
  constructor({
    onOperationReceived,
    onAllOperationsAcknowledged,
    onSelectionUpdate
  }) {
    this.inflightOperation = null;
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
    window.setInterval(this._sendCurrentOffset, 2000);
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
    this._queueOperations(operations);
    if (!this.operationTimeout) {
      this.operationTimeout = setTimeout(this._submitNextOperation, 10);
    }
  }

  setOffset(newOffset) {
    this.currentOffset = newOffset;
    setTimeout(this._sendCurrentOffset, 10);
  }

  updateVersion(newVersion) {
    this.version = newVersion;
    this.selectionsChannel && this.selectionsChannel.updateVersion(newVersion);
  }

  _operationsReceived = operations => {
    operations = operations.filter(
      operation => operation.version >= this.version
    );

    if (operations.length === 0) return;

    const firstVersion = operations[0].version;
    const lastVersion = operations[operations.length - 1].version;

    // We can only transform their operations against our operations
    // if both sets start from the same document version.
    if (firstVersion !== this.version) return;

    const [newOurs, newTheirs] = transform(this.pendingOperations, operations);
    this.pendingOperations = newOurs;

    if (this.operationReceivedCallback) {
      newTheirs.forEach(operation => this.operationReceivedCallback(operation));
    }

    this.updateVersion(lastVersion + 1);

    // Catch up on anything else new, that we may have ignored because
    // we didn't have the right version. We could be more efficient by
    // storing every operation we've received, in order, so we don't
    // need to request it again, but this works fine for a demo app.
    this.operationsChannel.requestOperationsSince(this.version);
  };

  _operationError = data => {
    this.inflightOperation = null;
    this.operationsChannel.requestOperationsSince(this.version);
    clearTimeout(this.operationTimeout);
    this.operationTimeout = setTimeout(this._submitNextOperation, 10);
  };

  _operationAcknowledged = operation => {
    this.inflightOperation = null;
    this.pendingOperations.shift();
    this.updateVersion(operation.version + 1);

    if (this.pendingOperations.length > 0) {
      this._submitNextOperation();
    } else {
      this.operationTimeout = null;
      this.allOperationsAcknowledgedCallback &&
        this.allOperationsAcknowledgedCallback(this.version);
    }
  };

  _submitNextOperation = () => {
    clearTimeout(this.operationTimeout);
    this.operationTimeout = null;

    if (this.inflightOperation) return;
    if (this.pendingOperations.length === 0) return;

    if (!this.operationsChannel) {
      // wait a bit, hopefully we'll have a connection soon
      this.operationTimeout = setTimeout(this._submitNextOperation, 100);
      return;
    }

    this.inflightOperation = this.pendingOperations[0];
    this.operationsChannel.submitOperation({
      ...this.inflightOperation,
      version: this.version
    });
  };

  _sendCurrentOffset = () => {
    if (this.pendingOperations.length === 0) {
      this.selectionsChannel &&
        this.selectionsChannel.setOffset(
          clientId,
          this.version,
          this.currentOffset
        );
    }
  };

  _selectionReceived = ({ clientId, offset }) => {
    offset = transformOffset(offset, this.pendingOperations);
    this.selectionUpdateCallback &&
      this.selectionUpdateCallback({ clientId, offset });
  };

  _queueOperations = operations => {
    // safePending, because the first operation in the pending list
    // may or may not get accepted. If it gets accepted and we had
    // composed operations into it, we lose those operations. So it's
    // safest to compose operations that can't be in flight.
    const safePending = operations.reduce(
      (composedOperations, operation) => compose(composedOperations, operation),
      this.pendingOperations.slice(1)
    );

    this.pendingOperations = this.pendingOperations
      .slice(0, 1)
      .concat(safePending);
  };
}

export default CollaborationClient;
