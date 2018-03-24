export function transform(ourOperations, theirOperations) {
  if (ourOperations.length === 0 || theirOperations.length === 0) {
    return [ourOperations, theirOperations];
  }

  if (ourOperations.length === 1 && theirOperations.length === 1) {
    return [
      toArray(transformOperation(ourOperations[0], theirOperations[0], true)),
      toArray(transformOperation(theirOperations[0], ourOperations[0], false))
    ];
  }

  let [left, top] = [ourOperations, theirOperations];
  let right = [];
  let bottom = [];

  left.forEach(leftOp => {
    let transformedOp = leftOp;
    bottom = [];

    top.forEach(topOp => {
      const [rightOp, bottomOp] = transform(
        toArray(transformedOp),
        toArray(topOp)
      );
      transformedOp = rightOp;
      bottom = bottom.concat(bottomOp);
    });

    right = right.concat(transformedOp);
    top = bottom;
  });

  return [right, bottom];
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function operationBounds(operation) {
  const { data: { offset, text } } = operation;
  return {
    start: offset,
    end: offset + text.length,
    length: text.length
  };
}

function adjustOffsetAfterInsert(offset, insertOp, transformEqualOffsets) {
  if (
    offset > insertOp.data.offset ||
    (offset === insertOp.data.offset && transformEqualOffsets)
  ) {
    return offset + insertOp.data.text.length;
  }
  return offset;
}

function adjustOffsetAfterRemove(offset, removeOp) {
  const bounds = operationBounds(removeOp);
  if (offset > bounds.start && offset <= bounds.end) {
    return bounds.start;
  }
  if (offset > bounds.end) {
    return offset - removeOp.data.text.length;
  }
  return offset;
}

function operationWithNewData(operation, newData) {
  const mergedData = Object.assign({}, operation.data, newData);
  return Object.assign({}, operation, { data: mergedData });
}

function transformInsertInsert(left, right, winTies) {
  const newOffset = adjustOffsetAfterInsert(left.data.offset, right, !winTies);
  return operationWithNewData(left, { offset: newOffset });
}

function transformInsertRemove(left, right, winTies) {
  const newOffset = adjustOffsetAfterRemove(left.data.offset, right);
  return operationWithNewData(left, { offset: newOffset });
}

function transformRemoveInsert(left, right, winTies) {
  const bounds = operationBounds(left);
  const { offset: insertOffset, text: insertText } = right.data;
  const { text } = left.data;

  // If the insert was in the middle of the text we were deleting, so
  // we need to split into two operations -- one for the text before
  // the insert, and one after.
  if (bounds.start < insertOffset && bounds.end > insertOffset) {
    const firstOperation = operationWithNewData(left, {
      text: text.slice(0, insertOffset - bounds.start)
    });

    const secondOperation = operationWithNewData(left, {
      offset: insertOffset + insertText.length,
      text: text.slice(
        insertOffset - bounds.start,
        bounds.end - insertOffset + 1
      )
    });

    // Since this new operation now happens after the first, we need to
    // transform it against the first operation.

    return [
      firstOperation,
      transformOperation(secondOperation, firstOperation)
    ];
  }

  const newOffset = adjustOffsetAfterInsert(left.data.offset, right, true);
  return operationWithNewData(left, { offset: newOffset });
}

function transformRemoveRemove(left, right, winTies) {
  const myBounds = operationBounds(left);
  const theirBounds = operationBounds(right);
  const { offset, text } = left.data;

  // If their delete also deleted everything in our delete, our
  // operation becomes meaningless.
  if (theirBounds.start <= myBounds.start && theirBounds.end >= myBounds.end) {
    return;
  }

  // If their delete is entirely after ours, it can't affect
  // us. Return the original operation.
  if (theirBounds.start >= myBounds.end) {
    return left;
  }

  // If their delete is entirely before ours, we just have to adjust
  // the offset.
  if (theirBounds.end <= myBounds.start) {
    const newOffset = adjustOffsetAfterRemove(myBounds.start, right);
    return operationWithNewData(left, { offset: newOffset });
  }

  // If we have overlapping deletes, we need to slice up the text to
  // ignore anything they've already deleted.

  let newText = "";
  let newOffset = offset;

  // Keep text at the beginning that isn't overlapped by their delete
  if (theirBounds.start > myBounds.start) {
    newText += text.slice(0, theirBounds.start - myBounds.start);
  }

  // Keep text at the end that isn't overlapped by their delete
  if (theirBounds.end < myBounds.end) {
    newText += text.slice(theirBounds.end - myBounds.start, myBounds.end + 1);
  }

  // If they deleted text before us, we'll end up at their original spot.
  if (theirBounds.start < myBounds.start) {
    newOffset = theirBounds.start;
  }

  return operationWithNewData(left, { offset: newOffset, text: newText });
}

export function transformOperation(left, right, winTies) {
  if (left.kind === "insert" && right.kind === "insert") {
    return transformInsertInsert(left, right, winTies);
  } else if (left.kind === "insert" && right.kind === "remove") {
    return transformInsertRemove(left, right, winTies);
  } else if (left.kind === "remove" && right.kind === "insert") {
    return transformRemoveInsert(left, right, winTies);
  } else if (left.kind === "remove" && right.kind === "remove") {
    return transformRemoveRemove(left, right, winTies);
  }
  return left;
}

export function transformOffset(offset, operations) {
  return operations.reduce((offset, operation) => {
    const { kind, data } = operation;
    switch (kind) {
      case "insert":
        return adjustOffsetAfterInsert(offset, operation, true);
      case "remove":
        return adjustOffsetAfterRemove(offset, operation);
    }
    return offset;
  }, offset);
}
