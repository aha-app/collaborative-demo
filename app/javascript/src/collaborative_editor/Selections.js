import React from "react";
import SelectionIndicator from "./SelectionIndicator";

const selectionIsCurrent = selection => new Date() - selection.lastSeen < 15000;

export default props => {
  const { textarea, selections } = props;
  if (!textarea) return null;

  const selectionIndicators = Object.values(selections)
    .filter(selectionIsCurrent)
    .map((selection, i) => (
      <SelectionIndicator
        key={i}
        textarea={textarea}
        offset={selection.offset}
        clientId={selection.clientId}
      />
    ));
  return <div className="selections">{selectionIndicators}</div>;
};
