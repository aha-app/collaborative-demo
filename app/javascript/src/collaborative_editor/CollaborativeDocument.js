import { transformOffset } from "./transform";

class CollaborativeDocument {
  constructor(content, version, onChange) {
    this.version = version;
    this.content = content;
    this.offset = 0;
    this.onChange = onChange;
  }

  perform(operation) {
    // Need to do collaboration here, eventually
    this._apply(operation);
  }

  setOffset(newOffset) {
    this._updateOffset(newOffset);
    this.onChange && this.onChange(this);
  }

  undo() {}
  redo() {}

  // Apply an operation to the current document's content. After this
  // function runs, content should take the new operation into
  // account, and offset should also be adjusted to take the new
  // offset into account.
  _apply(operation) {
    const { content } = this;
    const { type, data } = operation;

    switch (type) {
      case "insert": {
        const { offset, text } = data;
        let newContent = content.substring(0, offset) + text;

        if (offset < content.length - 1) {
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
