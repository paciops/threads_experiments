const { findSimilarVectors, getMagnitude } = require("./vector");

const createArray = (n) => new Float32Array(Array(n).fill(0).map(Math.random));

function main(n = 10, m = 50_000) {
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

  console.table(getMagnitude(target, n));

  console.log(findSimilarVectors(target, vectors, n, 0.9).length);
}

main();
