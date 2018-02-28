function channelCallbacks(channelClass, onConnected) {
  return {
    connected: () => {
      onConnected();
    },
    disconnected: () => {
      console.log("disconnected");
    },
    rejected: () => {
      console.log("rejected");
    },
    received: data => {
      switch (data.type) {
        case "op":
          return channelClass._operationsReceived(data.message, data.client_id);
        case "error":
          return channelClass._error(data.message);
        case "ack":
          return channelClass._operationAcknowledged(data.message);
        default:
          console.warn(`Can't process message with type ${data.type}`);
      }
    }
  };
}

export default class OperationsChannel {
  channel = null;

  constructor({ clientId, documentId, onReceived, onAcknowledged, onError }) {
    this.clientId = clientId;
    this.documentId = documentId;
    this.receivedCallback = onReceived;
    this.acknowledgedCallback = onAcknowledged;
    this.errorCallback = onError;
  }

  connect(onConnected) {
    this.channel = window.App.cable.subscriptions.create(
      {
        channel: "OperationsChannel",
        client_id: this.clientId,
        document_id: this.documentId
      },
      channelCallbacks(this, onConnected)
    );
  }

  requestOperationsSince(version) {
    this.channel.perform("operations", { version });
  }

  submitOperation(operation) {
    this.channel.perform("submit", { operation });
  }

  _operationAcknowledged(data) {
    this.acknowledgedCallback && this.acknowledgedCallback(data);
  }
  _error(data) {
    this.errorCallback && this.errorCallback(data);
  }
  _operationsReceived(operations, clientId) {
    // ignore our own messages
    if (clientId === this.clientId) return;
    this.receivedCallback && this.receivedCallback(operations);
  }
}
