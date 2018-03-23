import UndoStack from "collaborative_editor/UndoStack";

describe("UndoStack", () => {
  let undoStack;

  describe("with more than one item in the stack", () => {
    beforeEach(() => {
      undoStack = new UndoStack();
      undoStack.performedOperation({
        kind: "insert",
        data: {
          text: "a",
          offset: 0
        }
      });
      undoStack.performedOperation({
        kind: "insert",
        data: {
          text: "c",
          offset: 0
        }
      });
    });

    it("correctly transforms both items in the stack", () => {
      undoStack.receivedOperations([
        {
          kind: "insert",
          data: {
            text: "h",
            offset: 1
          }
        }
      ]);

      expect(undoStack.undos).toEqual([
        {
          kind: "remove",
          data: {
            text: "c",
            offset: 0
          }
        },
        {
          kind: "remove",
          data: {
            text: "a",
            offset: 1
          }
        }
      ]);
    });
  });
});
