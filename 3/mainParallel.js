const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
  threadId,
} = require("worker_threads");
const { getMagnitude, findSimilarVectors } = require("./vector");

const createArray = (n) => new Float32Array(Array(n).fill(0).map(Math.random));

const workerHandler = (n) => {
  let target;
  const vectors = {};
  return (msg) => {
    if (msg.target) {
      target = msg.target;
    } else if (msg.vector) {
      const { id, array } = msg.vector;
      vectors[id] = [getMagnitude(array, array.length), array];
    } else if (msg.compute) {
      const similarVectors = findSimilarVectors(target, vectors, n);
      console.log({
        threadId,
        vectors: Object.keys(vectors).length,
        similar: similarVectors.length,
      });
      parentPort.postMessage(similarVectors);
      parentPort.close();
    }
  };
};

if (isMainThread) {
  const n = 10,
    m = parseInt(process.argv[2], 10) || 100,
    sharedArray = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * n),
    target = new Float32Array(sharedArray),
    worker = new Worker(__filename, { workerData: { n } });
  for (let i = 0; i < n; i++) {
    target[i] = Math.random();
  }
  worker.postMessage({ target });

  for (let i = 0; i < m; i++) {
    const array = createArray(n);
    worker.postMessage({ vector: { id: `${i}`, array } }, [array.buffer]);
  }

  const result = [];
  worker
    .on("online", () => console.log("online"))
    .on("exit", (exitCode) => {
      console.log(`exit code ${exitCode}`);
      console.log("total = ", result.length);
      console.table(result.slice(0, 10));
    })
    .on("message", (msg) => result.push(...msg))
    .on("error", console.error);
  worker.postMessage({ compute: true });
} else {
  parentPort.on("message", workerHandler(workerData.n));
}
