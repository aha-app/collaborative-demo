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

  get selectionIsCollapsed() {
    return this.editor.selectionStart === this.editor.selectionEnd;
  }

  get selectionStart() {
    const { selectionAnchor, selectionFocus } = this.state.document;
    return this.selectionDirection === "backward"
      ? selectionFocus
      : selectionAnchor;
  }

  get selectionEnd() {
    const { selectionAnchor, selectionFocus } = this.state.document;
    return this.selectionDirection === "backward"
      ? selectionAnchor
      : selectionFocus;
  }

  get selectionDirection() {
    const { selectionAnchor, selectionFocus } = this.state.document;
    if (selectionAnchor === selectionFocus) return "none";
    if (selectionAnchor > selectionFocus) return "backward";
    return "forward";
  }

  // Called whenever document changes, either from our own change or
  // one made collaboratively by someone else.
  onChange = document => {
    this.setState({ document });
  };

  onSelect = event => {
    if (!this.editor) return;

    const selectionAnchor = this.selectionIsCollapsed
      ? this.editor.selectionStart
      : this.state.document.selectionAnchor;

    let selectionFocus = selectionAnchor;
    if (this.editor.selectionStart < selectionAnchor) {
      selectionFocus = this.editor.selectionStart;
    } else if (this.editor.selectionEnd > selectionAnchor) {
      selectionFocus = this.editor.selectionEnd;
    }

    this.state.document.setSelection(selectionAnchor, selectionFocus);
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
    document.addEventListener("selectionchange", this.onSelect);
    this.state.document.startCollaborating(this.props.version);
  }

  componentWillUnmount() {
    document.removeEventListener("selectionchange", this.onSelect);
  }

  componentDidUpdate() {
    // When a textarea gets recreated by React, it loses its selection
    // attributes. That means we have to recreate them from the document.
    this.editor.setSelectionRange(
      this.selectionStart,
      this.selectionEnd,
      this.selectionDirection
    );
  }

  render() {
    return (
      <div className="editor">
        <textarea
          ref={editor => (this.editor = editor)}
          onKeyDown={this.onKeyDown}
          onKeyPress={this.onKeyPress}
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
    this.editor.selectionStart = this.editor.selectionEnd = this.state.document.selectionAnchor;
    this.editor.selectionDirection = "none";
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
    if (this.selectionIsCollapsed) return;
    const operation = this._removeText(this.selectionStart, this.selectionEnd);
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
