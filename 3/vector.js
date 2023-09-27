/**
 *
 * @param {Float32Array} vector
 * @param {number} vectorLength
 * @returns number
 */
const getMagnitude = (vector, vectorLength) => {
  let magnitude = 0;
  for (let i = 0; i < vectorLength; i++) {
    magnitude += vector[i] * vector[i];
  }
  return Math.sqrt(magnitude);
};

/**
 * @param {Float32Array} targetVector
 * @param {Record<string, [number, Float32Array]} vectors
 * @param {number} length
 * @param {number} threshold
 */
const findSimilarVectors = (targetVector, vectors, length, threshold = 0.8) => {
  const targetMagnitude = getMagnitude(targetVector, length);

  const similarVectors = new Array();

  for (const [vectorId, [magnitude, vector]] of Object.entries(vectors)) {
    let dotProduct = 0;

    for (let i = 0; i < length; i++) {
      dotProduct += targetVector[i] * vector[i];
    }

    const similarity = dotProduct / (targetMagnitude * magnitude);

    if (similarity >= threshold) {
      similarVectors.push({ id: vectorId, score: similarity });
    }
  }

  return similarVectors.sort((a, b) => b.score - a.score);
};

module.exports = {
  getMagnitude,
  findSimilarVectors,
};
