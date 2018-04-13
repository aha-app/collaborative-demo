// Returns a brand new clone of operation, with newData overriding
// properties in operation.data. This is helpful for creating new
// operations based on other operations while tranforming or composing
// operations.
export function operationWithNewData(operation, newData) {
  const mergedData = Object.assign({}, operation.data, newData);
  return Object.assign({}, operation, { data: mergedData });
}
