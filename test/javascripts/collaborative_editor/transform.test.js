import {
  transformOperation,
  transformOffset,
  transform
} from "collaborative_editor/transform";

const insertOp = (text, offset) => ({ kind: "insert", data: { text, offset } });
const removeOp = (text, offset) => ({ kind: "remove", data: { text, offset } });

describe("transform", () => {
  describe("transformCursor", () => {
    it("should adjust a cursor against a sequence of operations", () => {
      const operations = [insertOp("a", 2), removeOp("b", 1), insertOp("c", 3)];

      expect(transformOffset(2, operations)).toEqual(2);
      expect(transformOffset(3, operations)).toEqual(4);
      expect(transformOffset(4, operations)).toEqual(5);
    });

    describe("against an insert operation", () => {
      const operation = insertOp("cat", 2);

      it("should adjust a cursor after the operation's target", () => {
        expect(transformOffset(4, [operation])).toEqual(7);
      });

      it("should adjust a cursor at the operation's target", () => {
        expect(transformOffset(2, [operation])).toEqual(5);
      });

      it("should not adjust a cursor before the operation's target", () => {
        expect(transformOffset(1, [operation])).toEqual(1);
      });
    });

    describe("against a remove operation", () => {
      const operation = removeOp("cat", 2);

      it("should adjust a cursor after the deleted range", () => {
        expect(transformOffset(7, [operation])).toEqual(4);
      });

      it("should adjust a cursor inside the deleted range", () => {
        expect(transformOffset(3, [operation])).toEqual(2);
      });

      it("should adjust a cursor at the end of the deleted range", () => {
        expect(transformOffset(5, [operation])).toEqual(2);
      });

      it("should not adjust a cursor at the operation's target", () => {
        expect(transformOffset(2, [operation])).toEqual(2);
      });
    });
  });

  describe("transformOperation", () => {
    describe("insert", () => {
      const left = insertOp("a", 2);

      describe("against an insert", () => {
        it("before our position", () => {
          const right = insertOp("ab", 1);

          expect(transformOperation(left, right, true)).toEqual(
            insertOp("a", 4)
          );
        });

        it("at our position, with a lower priority", () => {
          const right = insertOp("b", 2);
          expect(transformOperation(left, right, false)).toEqual(
            insertOp("a", 3)
          );
        });

        it("at our position, with a higher priority", () => {
          const right = insertOp("b", 2);
          expect(transformOperation(left, right, true)).toEqual(
            insertOp("a", 2)
          );
        });

        it("after our position", () => {
          const right = insertOp("b", 3);
          expect(transformOperation(left, right, true)).toEqual(
            insertOp("a", 2)
          );
        });
      });

      describe("against a remove", () => {
        it("before our position", () => {
          const right = removeOp("b", 1);

          expect(transformOperation(left, right, true)).toEqual(
            insertOp("a", 1)
          );
        });

        it("at our position", () => {
          const right = removeOp("b", 2);

          expect(transformOperation(left, right, true)).toEqual(
            insertOp("a", 2)
          );
        });

        it("spanning our position", () => {
          const right = removeOp("abc", 0);

          expect(transformOperation(left, right, true)).toEqual(
            insertOp("a", 0)
          );
        });

        it("after our position", () => {
          const right = removeOp("b", 3);

          expect(transformOperation(left, right, true)).toEqual(
            insertOp("a", 2)
          );
        });
      });
    });

    describe("remove", () => {
      const left = removeOp("abc", 2);

      describe("against an insert", () => {
        it("before our position", () => {
          const right = insertOp("ab", 1);

          expect(transformOperation(left, right, true)).toEqual(
            removeOp("abc", 4)
          );
        });

        it("at our position", () => {
          const right = insertOp("b", 2);

          expect(transformOperation(left, right, true)).toEqual(
            removeOp("abc", 3)
          );
        });

        it("inside our position", () => {
          const right = insertOp("x", 3);

          expect(transformOperation(left, right, true)).toEqual([
            removeOp("a", 2),
            removeOp("bc", 3)
          ]);
        });

        it("inside our position, deleting the entire content", () => {
          const left = removeOp("World  a", 0);
          const right = insertOp(" ", 2);

          expect(transformOperation(left, right, true)).toEqual([
            removeOp("Wo", 0),
            removeOp("rld  a", 1)
          ]);
        });

        it("after our position", () => {
          const right = insertOp("b", 5);

          expect(transformOperation(left, right, true)).toEqual(
            removeOp("abc", 2)
          );
        });
      });

      describe("against a remove", () => {
        it("before our position", () => {
          const right = removeOp("ab", 0);

          expect(transformOperation(left, right, true)).toEqual(
            removeOp("abc", 0)
          );
        });

        it("at our range", () => {
          const right = removeOp("abc", 2);

          expect(transformOperation(left, right, true)).toEqual(
            removeOp("", 2)
          );
        });

        it("overlapping the start of our range", () => {
          const right = removeOp("xa", 1);

          expect(transformOperation(left, right, true)).toEqual(
            removeOp("bc", 1)
          );
        });

        it("contained inside our range", () => {
          const right = removeOp("b", 3);

          expect(transformOperation(left, right, true)).toEqual(
            removeOp("ac", 2)
          );
        });

        it("overlapping the end of our range", () => {
          const right = removeOp("cx", 4);

          expect(transformOperation(left, right, true)).toEqual(
            removeOp("ab", 2)
          );
        });

        it("containing our range", () => {
          const right = removeOp("abcd", 2);

          expect(transformOperation(left, right, true)).toEqual(
            removeOp("", 2)
          );
        });

        it("after our range", () => {
          const right = removeOp("b", 6);

          expect(transformOperation(left, right, true)).toEqual(
            removeOp("abc", 2)
          );
        });
      });
    });
  });

  describe("transform", () => {
    it("should transform a sequence of operations against another sequence of operations", () => {
      const ourOperations = [removeOp("a", 1), insertOp("s", 3)];
      const theirOperations = [removeOp("t", 3), insertOp("h", 1)];

      const [newOurs, newTheirs] = transform(ourOperations, theirOperations);

      expect(newOurs).toEqual([removeOp("a", 2), insertOp("s", 3)]);

      expect(newTheirs).toEqual([removeOp("t", 2), insertOp("h", 1)]);
    });
    it("should correctly transform single operations", () => {
      const ourOperations = [insertOp("a", 0)];
      const theirOperations = [insertOp("b", 0)];

      const [newOurs, newTheirs] = transform(ourOperations, theirOperations);

      expect(newOurs).toEqual([insertOp("a", 0)]);
      expect(newTheirs).toEqual([insertOp("b", 1)]);
    });

    it("should correctly transform operations that turn into multiple operations", () => {
      const ourOperations = [removeOp("abc", 1), insertOp("s", 3)];
      const theirOperations = [insertOp("x", 2), insertOp("h", 1)];

      const [newOurs, newTheirs] = transform(ourOperations, theirOperations);

      expect(newOurs).toEqual([
        removeOp("a", 2),
        removeOp("bc", 3),
        insertOp("s", 5)
      ]);
      expect(newTheirs).toEqual([insertOp("x", 1), insertOp("h", 1)]);
    });
    it("should correctly transform operations that turn into no-ops", () => {
      const ourOperations = [removeOp("bcd", 1), insertOp("s", 0)];
      const theirOperations = [removeOp("bc", 1), insertOp("e", 1)];

      const [newOurs, newTheirs] = transform(ourOperations, theirOperations);

      expect(newOurs).toEqual([removeOp("d", 2), insertOp("s", 0)]);
      expect(newTheirs).toEqual([removeOp("", 2), insertOp("e", 2)]);
    });
  });
});
