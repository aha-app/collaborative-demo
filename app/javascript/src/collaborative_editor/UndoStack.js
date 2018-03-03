import { transform } from "./transform";

export default class UndoStack {
  constructor() {
    this.undos = [];
    this.redos = [];
  }

  get canUndo() {
    return this.undos.length > 0;
  }

  get canRedo() {
    return this.redos.length > 0;
  }

  performedOperation(operation) {
    this.undos.unshift(this._invert(operation));
    this.redos = [];
  }

  receivedOperations(operations) {
    this.undos = this._transformStack(this.undos, operations);
    this.redos = this._transformStack(this.redos, operations);
  }

  popUndoItem() {
    const op = this.undos.shift();
    this.redos.unshift(this._invert(op));
    return op;
  }

  popRedoItem() {
    const op = this.redos.shift();
    this.undos.unshift(this._invert(op));
    return op;
  }

  _transformStack(stack, operations) {
    let newStack = [];
    stack.forEach(operation => {
      const [newStackOp, newOperations] = transform([operation], operations);
      newStack.push(...newStackOp);
      operations = newOperations;
    });
    return newStack;
  }

  _invert(op) {
    let invertedOp = Object.assign({}, op);
    switch (invertedOp.kind) {
      case "insert":
        invertedOp.kind = "remove";
        break;
      case "remove":
        invertedOp.kind = "insert";
        break;
    }
    return invertedOp;
  }
}
