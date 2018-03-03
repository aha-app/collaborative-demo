import React from "react";
import CollaborativeDocument from "./CollaborativeDocument";
import Selections from "./Selections";

class CollaborativeEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      document: new CollaborativeDocument(
        props.documentId,
        props.content,
        this.onChange.bind(this)
      )
    };
    this.editor = null;
  }

  onChange = document => {
    this.setState({ document });
  };

  onSelect = event => {
    if (!this.editor) return;
    const selectionOffset =
      this.editor.selectionDirection === "backward"
        ? this.editor.selectionEnd
        : this.editor.selectionStart;

    this.state.document.setOffset(selectionOffset);
  };

  // For handling special characters, like Backspace and Tab
  onKeyDown = event => {
    let operation;

    if (event.shiftKey && event.metaKey && event.key === "z") {
      event.preventDefault();
      this.state.document.redo();
      return;
    }

    if (event.metaKey && event.key === "z") {
      event.preventDefault();
      this.state.document.undo();
      return;
    }

    if (event.key === "Backspace" && this.state.document.offset !== 0) {
      operation = this._removeText(-1);
    } else if (!event.shiftKey && event.key === "Tab") {
      operation = this._insertText("\t");
    }

    if (operation) {
      event.preventDefault();
      this.state.document.perform(operation);
    }
  };

  // For handling most content characters
  onKeyPress = event => {
    let key = event.key;

    if (event.metaKey || event.ctrlKey) return;
    if (event.key === "Enter") key = "\n";

    const operation = this._insertText(key);

    event.preventDefault();
    this.state.document.perform(operation);
  };

  componentDidUpdate() {
    this._setSelection(this.state.document.offset);
  }

  componentDidMount() {
    this.state.document.startCollaborating(this.props.version);
  }

  render() {
    return (
      <div className="editor">
        <textarea
          ref={editor => (this.editor = editor)}
          onKeyDown={this.onKeyDown}
          onKeyPress={this.onKeyPress}
          onSelect={this.onSelect}
          className="editor-content"
          value={this.state.document.content}
        />
        <Selections
          textarea={this.editor}
          selections={this.state.document.selections}
        />
      </div>
    );
  }

  _insertText(text) {
    return {
      kind: "insert",
      data: {
        text: text,
        offset: this.state.document.offset
      }
    };
  }

  _removeText(index) {
    return {
      kind: "remove",
      data: {
        text: this.state.document.content[this.state.document.offset + index],
        offset: this.state.document.offset + index
      }
    };
  }

  _setSelection(offset) {
    this.editor.selectionStart = this.editor.selectionEnd = offset;
  }
}

export default CollaborativeEditor;
