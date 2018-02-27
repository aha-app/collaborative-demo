export function transform(ourOperations, theirOperations) {
  if (ourOperations.length === 0 || theirOperations.length === 0) {
    return [ourOperations, theirOperations];
  }

  if (ourOperations.length === 1 && theirOperations.length === 1) {
    return [
      toArray(transformComponent(ourOperations[0], theirOperations[0], "left")),
      toArray(transformComponent(theirOperations[0], ourOperations[0], "right"))
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

function transformInsertInsert(left, right, priority) {
  if (
    left.data.offset > right.data.offset ||
    (left.data.offset === right.data.offset && priority === "right")
  ) {
    const newData = Object.assign({}, left.data, {
      offset: left.data.offset + 1
    });

    return Object.assign({}, left, { data: newData });
  }
  return left;
}

function transformInsertRemove(left, right, priority) {
  if (left.data.offset > right.data.offset) {
    const newData = Object.assign({}, left.data, {
      offset: left.data.offset - 1
    });

    return Object.assign({}, left, { data: newData });
  }

  return left;
}

function transformRemoveInsert(left, right, priority) {
  if (left.data.offset >= right.data.offset) {
    const newData = Object.assign({}, left.data, {
      offset: left.data.offset + 1
    });

    return Object.assign({}, left, { data: newData });
  }

  return left;
}

function transformRemoveRemove(left, right, priority) {
  // If they both target the same character, the second operation is
  // a no-op -- it's already gone, no point deleting it again.
  if (left.data.offset === right.data.offset) return;

  if (left.data.offset > right.data.offset) {
    const newData = Object.assign({}, left.data, {
      offset: left.data.offset - 1
    });

    return Object.assign({}, left, { data: newData });
  }

  return left;
}

export function transformComponent(left, right, priority) {
  if (left.kind === "insert" && right.kind === "insert") {
    return transformInsertInsert(left, right, priority);
  } else if (left.kind === "insert" && right.kind === "remove") {
    return transformInsertRemove(left, right, priority);
  } else if (left.kind === "remove" && right.kind === "insert") {
    return transformRemoveInsert(left, right, priority);
  } else if (left.kind === "remove" && right.kind === "remove") {
    return transformRemoveRemove(left, right, priority);
  }
  return left;
}

export function transformOffset(offset, operations) {
  return operations.reduce((offset, { kind, data }) => {
    switch (kind) {
      case "insert":
        if (data.offset <= offset) {
          return offset + 1;
        }
        break;
      case "remove":
        if (data.offset < offset) {
          return offset - 1;
        }
    }
    return offset;
  }, offset);
}
