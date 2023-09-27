const { findSimilarVectors, getMagnitude } = require("./vector");

const createArray = (n) => new Float32Array(Array(n).fill(0).map(Math.random));

function main(n = 10, m = parseInt(process.argv[2], 10) || 100) {
  const target = createArray(n);
  const vectors = Array(m)
    .fill(0)
    .map((_) => createArray(n))
    .reduce(
      (map, array, i) => ({
        ...map,
        [`${i}`]: [getMagnitude(array, n), array],
      }),
      {}
    );

  const similarArrays = findSimilarVectors(target, vectors, n);
  console.log({ vectors: m, similar: similarArrays.length });
}

main();
