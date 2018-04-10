import {
  transformOperation,
  transformOffset,
  transform
} from "collaborative_editor/transform";

import CollaborativeDocument from "collaborative_editor/CollaborativeDocument";

function randomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function generateRandomInsertOp(document) {
  const words = ["Hello", "World", "a", " ", "I", "abc", "\n"];
  const index = randomInt(words.length);
  const word = words[index];
  return {
    kind: "insert",
    data: { text: word, offset: randomInt(document.content.length) }
  };
}

function generateRandomRemoveOp(document) {
  const start = randomInt(document.content.length);
  const end = start + randomInt(document.content.length - start);
  return {
    kind: "remove",
    data: { text: document.content.slice(start, end + 1), offset: start }
  };
}

function generateOpStream(document, count) {
  let newDocument = new CollaborativeDocument(
    document.id,
    document.content.slice(0)
  );
  let operations = [];
  const operationFunctions = [generateRandomInsertOp, generateRandomRemoveOp];

  for (let i = 0; i < count; i++) {
    const operation = operationFunctions[randomInt(operationFunctions.length)](
      newDocument
    );
    operations.push(operation);
    newDocument._apply(operation);
  }

  return { document: newDocument, operations: operations };
}

it("passes the fuzzer", () => {
  const opStreamLength = 10;
  const iterations = 1000;
  let document = new CollaborativeDocument(1, "");

  for (let i = 0; i < iterations; i++) {
    let { document: topDocument, operations: topOperations } = generateOpStream(
      document,
      opStreamLength
    );

    let {
      document: leftDocument,
      operations: leftOperations
    } = generateOpStream(document, opStreamLength);

    const [bottomOperations, rightOperations] = transform(
      topOperations,
      leftOperations
    );

    bottomOperations.forEach(op => leftDocument._apply(op));
    rightOperations.forEach(op => topDocument._apply(op));

    // console.log("document", document.content);
    // console.log("top", topOperations);
    // console.log("left", leftOperations);
    // console.log("bottom", bottomOperations);
    // console.log("right", rightOperations);

    expect(topDocument.content).toEqual(leftDocument.content);
    document = topDocument;
  }
});
