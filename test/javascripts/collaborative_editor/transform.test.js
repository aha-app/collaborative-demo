import {
  transformComponent,
  transformOffset,
  transform
} from "collaborative_editor/transform";

describe("transform", () => {
  describe("transformCursor", () => {
    it("should adjust a cursor against a sequence of operations", () => {
      const operations = [
        {
          type: "insert",
          data: {
            text: "a",
            offset: 2
          }
        },
        {
          type: "remove",
          data: {
            text: "b",
            offset: 1
          }
        },
        {
          type: "insert",
          data: {
            text: "c",
            offset: 3
          }
        }
      ];
      expect(transformOffset(2, operations)).toEqual(2);
      expect(transformOffset(3, operations)).toEqual(4);
      expect(transformOffset(4, operations)).toEqual(5);
    });

    describe("against an insert operation", () => {
      const operation = {
        type: "insert",
        data: {
          text: "c",
          offset: 2
        }
      };

      it("should adjust a cursor after the operation's target", () => {
        expect(transformOffset(4, [operation])).toEqual(5);
      });

      it("should adjust a cursor at the operation's target", () => {
        expect(transformOffset(2, [operation])).toEqual(3);
      });

      it("should not adjust a cursor before the operation's target", () => {
        expect(transformOffset(1, [operation])).toEqual(1);
      });
    });

    describe("against a remove operation", () => {
      const operation = {
        type: "remove",
        data: {
          text: "c",
          offset: 2
        }
      };

      it("should adjust a cursor after the operation's target", () => {
        expect(transformOffset(4, [operation])).toEqual(3);
      });

      it("should not adjust a cursor at the operation's target", () => {
        expect(transformOffset(2, [operation])).toEqual(2);
      });
    });
  });

  describe("transformComponent", () => {
    describe("insert", () => {
      const left = {
        type: "insert",
        data: {
          text: "a",
          offset: 2
        }
      };

      describe("against an insert", () => {
        it("before our position", () => {
          const right = {
            type: "insert",
            data: {
              text: "b",
              offset: 1
            }
          };
          expect(transformComponent(left, right, "left")).toEqual({
            type: "insert",
            data: {
              text: "a",
              offset: 3
            }
          });
        });

        it("at our position, with a lower priority", () => {
          const right = {
            type: "insert",
            data: {
              text: "b",
              offset: 2
            }
          };
          expect(transformComponent(left, right, "right")).toEqual({
            type: "insert",
            data: {
              text: "a",
              offset: 3
            }
          });
        });

        it("at our position, with a higher priority", () => {
          const right = {
            type: "insert",
            data: {
              text: "b",
              offset: 2
            }
          };
          expect(transformComponent(left, right, "left")).toEqual({
            type: "insert",
            data: {
              text: "a",
              offset: 2
            }
          });
        });

        it("after our position", () => {
          const right = {
            type: "insert",
            data: {
              text: "b",
              offset: 3
            }
          };
          expect(transformComponent(left, right, "left")).toEqual({
            type: "insert",
            data: {
              text: "a",
              offset: 2
            }
          });
        });
      });

      describe("against a remove", () => {
        it("before our position", () => {
          const right = {
            type: "remove",
            data: {
              text: "b",
              offset: 1
            }
          };
          expect(transformComponent(left, right, "left")).toEqual({
            type: "insert",
            data: {
              text: "a",
              offset: 1
            }
          });
        });

        it("at our position", () => {
          const right = {
            type: "remove",
            data: {
              text: "b",
              offset: 2
            }
          };
          expect(transformComponent(left, right, "left")).toEqual({
            type: "insert",
            data: {
              text: "a",
              offset: 2
            }
          });
        });

        it("after our position", () => {
          const right = {
            type: "remove",
            data: {
              text: "b",
              offset: 3
            }
          };
          expect(transformComponent(left, right, "left")).toEqual({
            type: "insert",
            data: {
              text: "a",
              offset: 2
            }
          });
        });
      });
    });

    describe("remove", () => {
      const left = {
        type: "remove",
        data: {
          text: "a",
          offset: 2
        }
      };

      describe("against an insert", () => {
        it("before our position", () => {
          const right = {
            type: "insert",
            data: {
              text: "b",
              offset: 1
            }
          };
          expect(transformComponent(left, right, "left")).toEqual({
            type: "remove",
            data: {
              text: "a",
              offset: 3
            }
          });
        });

        it("at our position", () => {
          const right = {
            type: "insert",
            data: {
              text: "b",
              offset: 2
            }
          };
          expect(transformComponent(left, right, "left")).toEqual({
            type: "remove",
            data: {
              text: "a",
              offset: 3
            }
          });
        });

        it("after our position", () => {
          const right = {
            type: "insert",
            data: {
              text: "b",
              offset: 3
            }
          };
          expect(transformComponent(left, right, "left")).toEqual({
            type: "remove",
            data: {
              text: "a",
              offset: 2
            }
          });
        });
      });

      describe("against a remove", () => {
        it("before our position", () => {
          const right = {
            type: "remove",
            data: {
              text: "b",
              offset: 1
            }
          };
          expect(transformComponent(left, right, "left")).toEqual({
            type: "remove",
            data: {
              text: "a",
              offset: 1
            }
          });
        });

        it("at our position", () => {
          const right = {
            type: "remove",
            data: {
              text: "b",
              offset: 2
            }
          };
          expect(transformComponent(left, right, "left")).toBeUndefined();
        });

        it("after our position", () => {
          const right = {
            type: "remove",
            data: {
              text: "b",
              offset: 3
            }
          };
          expect(transformComponent(left, right, "left")).toEqual({
            type: "remove",
            data: {
              text: "a",
              offset: 2
            }
          });
        });
      });
    });
  });

  describe("transform", () => {
    it("should transform a sequence of operations against another sequence of operations", () => {
      const ourOperations = [
        {
          type: "remove",
          data: {
            text: "a",
            offset: 1
          }
        },
        {
          type: "insert",
          data: {
            text: "s",
            offset: 3
          }
        }
      ];
      const theirOperations = [
        {
          type: "remove",
          data: {
            text: "t",
            offset: 3
          }
        },
        {
          type: "insert",
          data: {
            text: "h",
            offset: 1
          }
        }
      ];

      const [newOurs, newTheirs] = transform(ourOperations, theirOperations);

      expect(newOurs).toEqual([
        {
          type: "remove",
          data: {
            text: "a",
            offset: 2
          }
        },
        {
          type: "insert",
          data: {
            text: "s",
            offset: 3
          }
        }
      ]);

      expect(newTheirs).toEqual([
        {
          type: "remove",
          data: {
            text: "t",
            offset: 2
          }
        },
        {
          type: "insert",
          data: {
            text: "h",
            offset: 1
          }
        }
      ]);
    });
    it(
      "should correctly transform operations that turn into multiple operations"
    );
    it("should correctly transform operations that turn into no-ops");
  });
});
