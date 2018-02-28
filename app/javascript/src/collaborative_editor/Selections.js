import React from "react";
import SelectionIndicator from "./SelectionIndicator";

export default props => {
  const { textarea, selections } = props;
  if (!textarea) return null;

  const selectionIndicators = Object.entries(selections).map(
    ([clientId, selection], i) => (
      <SelectionIndicator
        key={i}
        textarea={textarea}
        offset={selection.offset}
        clientId={selection.clientId}
      />
    )
  );
  return <div className="selections">{selectionIndicators}</div>;
};
