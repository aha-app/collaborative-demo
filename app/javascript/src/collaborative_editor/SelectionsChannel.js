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

    received: selectionData => {
      channelClass.received(selectionData);
    }
  };
}

export default class SelectionsChannel {
  channel = null;

  constructor({ clientId, documentId, version, onSelectionUpdate }) {
    this.clientId = clientId;
    this.documentId = documentId;
    this.version = version;
    this.selectionUpdatedCallback = onSelectionUpdate;
  }

  received(selectionData) {
    const { clientId, offset, version } = selectionData;
    if (clientId === this.clientId) return;
    if (version < this.version) return;
    if (version > this.version) return;
    // ^--- we could also queue newer selections, and release them
    // when we update to their specific version.
    this.selectionUpdatedCallback &&
      this.selectionUpdatedCallback(selectionData);
  }

  setOffset(clientId, version, offset) {
    this.channel.perform("set_offset", { clientId, version, offset });
  }

  updateVersion(newVersion) {
    this.version = newVersion;
  }

  connect(onConnected) {
    this.onConnected = onConnected;
    this.channel = window.App.cable.subscriptions.create(
      {
        channel: "SelectionsChannel",
        client_id: this.clientId,
        document_id: this.documentId
      },
      channelCallbacks(this, onConnected)
    );
  }
}
