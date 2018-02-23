class CollaborationClient {
  connect(documentId, initialVersion) {}
  submitOperations(operations) {}

  // newVersion
  onAllOperationsAcknowledged(callback) {}

  // op, version
  onOperationReceived(callback) {}
}

export default CollaborationClient;
