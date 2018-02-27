// Client-side, which assumes you've already requested the right to send web notifications
// Note that params are the same as they were when you subscribed to the channel.
// App.chatChannel = App.cable.subscriptions.create { channel: "ChatChannel", room: "Best Room" },
// received: (data) ->
// data => { sent_by: "Paul", body: "This is a cool chat app." }
// App.chatChannel.send({ sent_by: "Paul", body: "This is a cool chat app." })

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
      console.log(data);
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
    if (this.acknowledgedCallback) this.acknowledgedCallback(data);
  }
  _error(data) {
    if (this.errorCallback) this.errorCallback(data);
  }
  _operationsReceived(operations, clientId) {
    // ignore our own messages
    if (clientId === this.clientId) return;
    if (this.receivedCallback) this.receivedCallback(operations);
  }
}
