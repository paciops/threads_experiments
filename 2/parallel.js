const {
  Worker,
  isMainThread,
  MessageChannel,
  workerData,
} = require("worker_threads");

const runParallel = ({ n = 10, m = 1_000_000, poolSize = 4 }) =>
  new Promise((resolve, reject) => {
    const ports = Array(poolSize)
        .fill(0)
        .map(() => ({
          send: new MessageChannel(),
          receive: new MessageChannel(),
        })),
      pool = Array(poolSize)
        .fill(0)
        .map((_, i) => new Worker("./worker.js")),
      target = new Float32Array(Array(n).fill(0).map(Math.random)),
      similarArrays = [];
    let threadCount = 0;

    pool.forEach((worker, i) => {
      const { send, receive } = ports[i];
      worker.postMessage({ receive: send.port1, send: receive.port1 }, [
        send.port1,
        receive.port1,
      ]);
    });

    for (let i = 0; i < poolSize; i++) {
      const { send, receive } = ports[i];
      const copy = structuredClone(target);

      send.port2.postMessage({ target: copy }, [copy.buffer]);

      receive.port2
        .on("message", (result) => similarArrays.push(result))
        .on("messageerror", console.error)
        .on("close", () => {
          console.log(`${i} terminated`);
          threadCount++;
          if (threadCount === poolSize) {
            resolve(similarArrays.length);
          }
        });
    }

    for (let i = 0; i < m; i++) {
      const array = new Float32Array(Array(n).fill(0).map(Math.random));
      const { send } = ports[i % poolSize];

      send.port2.postMessage({ array }, [array.buffer]);

      if (i % Math.round(m / 10) === 0) process.stdout.write("=");
    }
    process.stdout.write("\n");

    ports.forEach(({ send }) => send.port2.postMessage({ last: true }));
  });

module.exports = { runParallel };
