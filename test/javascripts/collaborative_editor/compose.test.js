import compose from "collaborative_editor/compose";

const insertOp = (text, offset) => ({ kind: "insert", data: { text, offset } });
const removeOp = (text, offset) => ({ kind: "remove", data: { text, offset } });

describe("compose", () => {
  describe("an insert", () => {
    const operation = insertOp("abc", 2);
    describe("with an insert", () => {
      it("of a single character, right before our position", () => {
        const operations = [insertOp("a", 1)];
        expect(compose(operations, operation)).toEqual([insertOp("aabc", 1)]);
      });

      it("of a string, right before our position", () => {
        const operations = [insertOp("ba", 0)];
        expect(compose(operations, operation)).toEqual([insertOp("baabc", 0)]);
      });

      it("of a character too far before our position", () => {
        const operations = [insertOp("b", 0)];
        expect(compose(operations, operation)).toEqual([
          insertOp("b", 0),
          insertOp("abc", 2)
        ]);
      });

      it("of a string spanning our position", () => {
        const operations = [insertOp("abc", 1)];
        expect(compose(operations, operation)).toEqual([
          insertOp("abc", 1),
          insertOp("abc", 2)
        ]);
      });
    });
  });

  describe("a remove", () => {
    const operation = removeOp("abc", 2);
    describe("with a remove", () => {
      it("of a single character, right after our position", () => {
        const operations = [removeOp("d", 5)];
        expect(compose(operations, operation)).toEqual([removeOp("abcd", 2)]);
      });

      it("of a character too far after our position", () => {
        const operations = [removeOp("b", 7)];
        expect(compose(operations, operation)).toEqual([
          removeOp("b", 7),
          removeOp("abc", 2)
        ]);
      });

      it("of a character before our position", () => {
        const operations = [removeOp("b", 2)];
        expect(compose(operations, operation)).toEqual([
          removeOp("b", 2),
          removeOp("abc", 2)
        ]);
      });

      it("of a string spanning our position", () => {
        const operations = [removeOp("abc", 1)];
        expect(compose(operations, operation)).toEqual([
          removeOp("abc", 1),
          removeOp("abc", 2)
        ]);
      });
    });
  });
});
