import CollaborationClient from "./CollaborationClient";
import { transformOffset } from "./transform";

class CollaborativeDocument {
  constructor(documentId, content, version, onChange) {
    this.content = content;
    this.offset = 0;
    this.onChange = onChange;
    if (window.App && window.App.cable) {
      this.collaborationClient = new CollaborationClient({
        onOperationReceived: this._receivedOperation
      });
      this.collaborationClient.connect(documentId, version);
    }
  }

  perform(operation) {
    this._apply(operation);
    if (this.collaborationClient) {
      this.collaborationClient.submitOperations([operation]);
    }
  }

  setOffset(newOffset) {
    this._updateOffset(newOffset);
    this.onChange && this.onChange(this);
  }

  undo() {}
  redo() {}

  _receivedOperation = operation => {
    this._apply(operation);
  };

  // Apply an operation to the current document's content. After this
  // function runs, content should take the new operation into
  // account, and offset should also be adjusted to take the new
  // offset into account.
  _apply(operation) {
    const { content } = this;
    const { kind, data } = operation;

    switch (kind) {
      case "insert": {
        const { offset, text } = data;
        let newContent = content.substring(0, offset) + text;

        if (offset < content.length) {
          newContent += content.substring(offset);
        }

        this.content = newContent;
        break;
      }
      case "remove": {
        const { offset, text } = data;
        let newContent = content.substring(0, offset);

        if (offset < content.length - 1) {
          newContent += content.substring(offset + text.length);
        }
        this.content = newContent;
        break;
      }
    }

    this._updateOffset(transformOffset(this.offset, [operation]));
    this.onChange && this.onChange(this);
    return this;
  }

  _updateOffset(newOffset) {
    this.offset = newOffset;
  }
}

export default CollaborativeDocument;
