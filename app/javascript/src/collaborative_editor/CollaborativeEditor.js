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
      ),
      selectionStart: 0,
      selectionEnd: 0
    };
    this.editor = null;
  }

  get selectionIsCollapsed() {
    return this.editor.selectionStart === this.editor.selectionEnd;
  }

  get selectionAnchorPoint() {
    return this.editor.selectionDirection === "forward"
      ? this.editor.selectionEnd
      : this.editor.selectionStart;
  }

  get selectionFocusPoint() {
    return this.editor.selectionDirection === "backward"
      ? this.editor.selectionEnd
      : this.editor.selectionStart;
  }

  onChange = document => {
    this.setState({
      document
    });

    if (this.selectionIsCollapsed) {
      this.setState({
        selectionStart: document.offset,
        selectionEnd: document.offset
      });
    }
  };

  onSelect = event => {
    if (!this.editor) return;
    this.setState({
      selectionStart: this.editor.selectionStart,
      selectionEnd: this.editor.selectionEnd
    });
    this.state.document.setOffset(this.selectionFocusPoint);
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

    if (event.key === "Backspace") {
      operation = this._remove(-1);
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

    event.preventDefault();
    this.state.document.perform(this._removeSelectedText());
    this.state.document.perform(this._insertText(key));
  };

  componentDidMount() {
    this.state.document.startCollaborating(this.props.version);
  }

  componentDidUpdate() {
    this.editor.selectionStart = this.state.selectionStart;
    this.editor.selectionEnd = this.state.selectionEnd;
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
          onChange={() => undefined}
          value={this.state.document.content}
        />
        <Selections
          textarea={this.editor}
          selections={this.state.document.selections}
        />
      </div>
    );
  }

  _collapseSelection() {
    this.editor.selectionStart = this.editor.selectionEnd = this.selectionAnchorPoint;
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

  _remove(offset) {
    if (this.selectionIsCollapsed) {
      return this._removeText(this.state.document.offset + offset);
    } else {
      return this._removeSelectedText();
    }
  }

  _removeSelectedText() {
    const operation = this._removeText(
      this.state.selectionStart,
      this.state.selectionEnd
    );
    this._collapseSelection();
    return operation;
  }

  _removeText(startIndex, endIndex = startIndex + 1) {
    if (startIndex < 0) return;

    return {
      kind: "remove",
      data: {
        text: this.state.document.content.slice(startIndex, endIndex),
        offset: startIndex
      }
    };
  }
}

export default CollaborativeEditor;
