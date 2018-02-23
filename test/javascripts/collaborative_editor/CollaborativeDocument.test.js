import CollaborativeDocument from "collaborative_editor/CollaborativeDocument";

describe("CollaborativeDocument", () => {
  describe("constructor", () => {
    it("can be constructed with content and a version", () => {
      const doc = new CollaborativeDocument("test content", 1);
      expect(doc.content).toEqual("test content");
      expect(doc.version).toEqual(1);
      expect(doc.offset).toEqual(0);
    });
  });

  describe("apply", () => {
    it("should adjust the cursor position", () => {
      const doc = new CollaborativeDocument("car", 1);
      doc.offset = 3;

      const operation = {
        type: "insert",
        data: {
          text: "h",
          offset: 1
        }
      };
      expect(doc._apply(operation).offset).toBe(4);
    });

    describe("an insert operation", () => {
      it("on an empty document", () => {
        const doc = new CollaborativeDocument("", 1);
        const operation = {
          type: "insert",
          data: {
            text: "a",
            offset: 0
          }
        };
        expect(doc._apply(operation).content).toBe("a");
      });
      it("at the beginning of a document", () => {
        const doc = new CollaborativeDocument("hello", 1);
        const operation = {
          type: "insert",
          data: {
            text: "a",
            offset: 0
          }
        };
        expect(doc._apply(operation).content).toBe("ahello");
      });
      it("in the middle of a document", () => {
        const doc = new CollaborativeDocument("car", 1);
        const operation = {
          type: "insert",
          data: {
            text: "h",
            offset: 1
          }
        };
        expect(doc._apply(operation).content).toBe("char");
      });
      it("at the end of a document", () => {
        const doc = new CollaborativeDocument("car", 1);
        const operation = {
          type: "insert",
          data: {
            text: "t",
            offset: 3
          }
        };
        expect(doc._apply(operation).content).toBe("cart");
      });
    });

    describe("a remove operation", () => {
      it("on an empty document", () => {
        const doc = new CollaborativeDocument("", 1);
        const operation = {
          type: "remove",
          data: {
            text: "",
            offset: 0
          }
        };
        expect(doc._apply(operation).content).toBe("");
      });

      it("at the beginning of a document", () => {
        const doc = new CollaborativeDocument("ahello", 1);
        const operation = {
          type: "remove",
          data: {
            text: "a",
            offset: 0
          }
        };
        expect(doc._apply(operation).content).toBe("hello");
      });

      it("in the middle of a document", () => {
        const doc = new CollaborativeDocument("char", 1);
        const operation = {
          type: "remove",
          data: {
            text: "h",
            offset: 1
          }
        };
        expect(doc._apply(operation).content).toBe("car");
      });

      it("at the end of a document", () => {
        const doc = new CollaborativeDocument("cart", 1);
        const operation = {
          type: "remove",
          data: {
            text: "t",
            offset: 3
          }
        };
        expect(doc._apply(operation).content).toBe("car");
      });
    });
  });
});
