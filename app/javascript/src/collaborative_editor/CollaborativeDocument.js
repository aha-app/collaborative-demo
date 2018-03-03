import CollaborationClient from "./CollaborationClient";
import { transformOffset } from "./transform";
import UndoStack from "./UndoStack";

class CollaborativeDocument {
  constructor(documentId, content, onChange) {
    this.content = content;
    this.offset = 0;
    this.onChange = onChange;
    this.id = documentId;
    this.selections = {};
    this.undoStack = new UndoStack();
  }

  startCollaborating(version) {
    this.collaborationClient = new CollaborationClient({
      onOperationReceived: this._receivedOperation,
      allOperationsAcknowledged: this._allOperationsAcknowledged,
      onSelectionUpdate: this._receivedUpdatedSelection
    });
    this.collaborationClient.connect(this, version);
  }

  perform(operation, allowUndo = true) {
    this._transformRemoteSelections(operation);
    if (this.collaborationClient) {
      this.collaborationClient.submitOperations([operation]);
    }

    this._apply(operation);

    if (allowUndo) {
      this.undoStack.performedOperation(operation);
    }
  }

  setOffset(newOffset) {
    this._updateOffset(newOffset);
    this._change();
  }

  undo() {
    if (this.undoStack.canUndo) {
      this.perform(this.undoStack.popUndoItem(), false);
    }
  }

  redo() {
    if (this.undoStack.canRedo) {
      this.perform(this.undoStack.popRedoItem(), false);
    }
  }

  _change() {
    this.onChange && this.onChange(this);
  }

  _receivedUpdatedSelection = ({ clientId, offset }) => {
    this.selections[clientId] = { clientId, offset };
    this._change();
  };

  _receivedOperation = operation => {
    this._transformRemoteSelections(operation);
    this.undoStack.receivedOperations([operation]);
    this._apply(operation);
  };

  _transformRemoteSelections(operation) {
    Object.entries(this.selections).forEach(([key, value]) => {
      value.offset = transformOffset(value.offset, [operation]);
    });
  }

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
    this._change();
    return this;
  }

  _updateOffset(newOffset) {
    this.offset = newOffset;
    this.collaborationClient && this.collaborationClient.setOffset(newOffset);
  }

  _allOperationsAcknowledged() {
    this.collaborationClient && this.collaborationClient.setOffset(this.offset);
  }
}

export default CollaborativeDocument;
