import React from "react";
import getCaretCoordinates from "textarea-caret";

const COLORS = [
  "#98fdc1",
  "#fda398",
  "#98a9fd",
  "#c7fd98",
  "#fd98e5",
  "#98fdf8",
  "#fdda98",
  "#bd98fd",
  "#98fd9f",
  "#fd98ae",
  "#98cbfd",
  "#e9fd98",
  "#f398fd",
  "#98fdd6",
  "#fdb898",
  "#9b98fd",
  "#b2fd98",
  "#fd98d0",
  "#98edfd",
  "#fdef98",
  "#d298fd",
  "#98fdb4",
  "#fd9899",
  "#98b6fd",
  "#d4fd98",
  "#fd98f1"
];

export default class SelectionIndicator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  recalculateCoordinates() {
    const { textarea, offset } = this.props;
    const caret = getCaretCoordinates(textarea, offset);
    caret.top -= textarea.scrollTop;
    this.setState({ caret });
  }

  componentDidMount() {
    this.recalculateCoordinates();
    this.props.textarea.addEventListener(
      "scroll",
      this.recalculateCoordinates.bind(this)
    );
    window.addEventListener("resize", this.recalculateCoordinates.bind(this));
  }

  componentWillUnmount() {
    this.props.textarea.removeEventListener(
      "scroll",
      this.recalculateCoordinates.bind(this)
    );
    window.removeEventListener(
      "resize",
      this.recalculateCoordinates.bind(this)
    );
  }

  componentDidUpdate() {
    this.recalculateCoordinates();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { offset } = this.props;
    const { offset: nextOffset } = nextProps;
    if (offset !== nextOffset) return true;

    const { caret } = this.state;
    const { caret: nextCaret } = nextState;
    if (!caret || !nextCaret) return true;

    if (caret.top === nextCaret.top && caret.left === nextCaret.left) {
      return false;
    }

    return true;
  }

  render() {
    const { caret } = this.state;
    if (!caret) return null;

    const backgroundColor = COLORS[this.props.clientId % COLORS.length];
    const indicatorStyle = {
      top: caret.top,
      left: caret.left - 1,
      backgroundColor
    };
    const flagStyle = {
      backgroundColor
    };

    return (
      <div style={indicatorStyle} className="selection-indicator">
        <div style={flagStyle} className="selection-flag">
          {this.props.clientId}
        </div>
      </div>
    );
  }
}
