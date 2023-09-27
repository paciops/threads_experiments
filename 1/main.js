const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");

const run = async (n = 100_000) => {
  const worker = new Worker("./worker.js");
  const array = new Float32Array(Array(n).fill(0).map(Math.random));

  console.log("sender ", array);

  worker.postMessage(array, [array.buffer]);

  worker.on("message", (arraySorted) =>
    console.log("returned array ", arraySorted)
  );

  worker.on("error", console.error);

  worker.on("exit", (x) => console.log("exit code = ", x));
};

run()
  .catch(console.error)
  .finally(() => console.log("end"));
