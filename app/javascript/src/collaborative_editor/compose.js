import { operationWithNewData } from "./utils";

// Takes a list of operations and a new operation, and returns an
// array of operations that have the same effect as operations +
// operation. Hopefully, this new array will be smaller than the sum
// of lengths of the other two, because it allows us to transform and
// broadcast operations more efficiently.
export default function compose(operations, operation) {
  if (operations.length === 0) return [operation];
  return operations
    .slice(0, -1)
    .concat(composeOperation(operations[operations.length - 1], operation));
}

// We can compose a lot of different operations, but we'll get most of
// the impact by focusing on two scenarios: typing sequential
// characters and backwards-deleting sequential characters. We'll get
// almost all of the benefit just from handling those two cases.
function composeOperation(operation1, operation2) {
  const { kind: kind1, data: data1 } = operation1;
  const { kind: kind2, data: data2 } = operation2;
  if (kind1 === "insert" && kind2 === "insert") {
    if (data1.offset + data1.text.length === data2.offset) {
      return [
        operationWithNewData(operation1, {
          text: data1.text + data2.text
        })
      ];
    }
  }
  if (kind1 === "remove" && kind2 === "remove") {
    if (data2.offset + data2.text.length === data1.offset) {
      return [
        operationWithNewData(operation2, {
          text: data2.text + data1.text
        })
      ];
    }
  }
  return [operation1, operation2];
}
