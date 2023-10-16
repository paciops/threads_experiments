import { isMainThread, parentPort, Worker, workerData } from "worker_threads";
import { readFile } from "fs/promises";
import {
  Magnitude,
  SimilarVector,
  VectorType,
  findSimilarVectors,
  getMagnitude,
  createSharedArrayBuffer,
  createArrayBuffer,
} from "./vector";

const FILE_NAME = "./output.json";
const POOL_SIZE = parseInt(process.argv[2], 10) || 4;
const SKIP = parseInt(process.argv[3] || "-1", 10);


const main = (
  target: number[],
  vectors: Float32Array[],
  skip = -1
): Promise<SimilarVector[]> => {
  return new Promise(async (next) => {
    const n = target.length,
      pool = Array(POOL_SIZE)
        .fill(0)
        .map(() => new Worker(__filename, { workerData: { n } })),
      sharedTarget = createSharedArrayBuffer(target, target.length),
      results: SimilarVector[] = [];

    let threadCount = 0;

    pool.forEach((worker) =>
      worker
        .on("message", (msg) => results.push(...msg))
        .on("online", () => console.log("online"))
        .on("exit", (code) => {
          console.log("exit code %d ", code);
          threadCount++;
          if (threadCount == POOL_SIZE) {
            next(results);
          }
        })
        .postMessage({ target: sharedTarget })
    );

    console.time("vectors send");

    if (skip != -1) {
      let index = 0,
        vectorsIndex = 0;
      const m = vectors.length;
      for (
        let i = 0, end = Math.min(i + skip, m);
        i < m;
        i += skip, end = Math.min(i + skip, m), index++, vectorsIndex += skip
      ) {
        const sliceOfVectors = vectors.slice(i, end);
        pool[index % POOL_SIZE].postMessage(
          sliceOfVectors.map((vector, i) => ({
            id: `${i + vectorsIndex}`,
            magnitude: getMagnitude(vector, n),
            vector,
          })),
          [...sliceOfVectors.map(({ buffer }) => buffer)]
        );
      }
    } else {
      vectors.forEach((vector, i) =>
        pool[i % POOL_SIZE].postMessage(
          { id: `${i}`, magnitude: getMagnitude(vector, n), vector },
          [vector.buffer]
        )
      );
    }

    console.timeEnd("vectors send");

    pool.forEach((worker) => worker.postMessage({ compute: true }));
  });
};

const worker = async () => {
  return new Promise((resolve) => {
    parentPort?.on("message", handleMessage(workerData.n, resolve));
  });
};

if (isMainThread) {
  readFile(FILE_NAME).then((file) => {
    const { target, vectors }: { target: number[]; vectors: number[][] } =
        JSON.parse(file.toString()),
      floatVectors = vectors.map(createArrayBuffer);
    console.time("main thread");
    main(target, floatVectors, SKIP).then((vectors) => {
      console.timeEnd("main thread");
      vectors.sort((a, b) => b.score - a.score);
      console.table(vectors.slice(0, 20));
      console.log("number of similar vectors ", vectors.length);
    });
  });
} else {
  worker().then(() => console.log("worker ends"));
}

function handleMessage(n: number, resolve: (value: unknown) => void) {
  let target: Float32Array;
  const vectors: Record<string, [Magnitude, VectorType]> = {};
  return (message: any) => {
    if (message.target) {
      target = message.target;
    } else if (message.vector) {
      vectors[message.id] = [message.magnitude, message.vector];
    } else if (Array.isArray(message)) {
      message.forEach(({ id, magnitude, vector }) => {
        vectors[id] = [magnitude, vector];
      });
    } else if (message.compute) {
      const similarVectors = findSimilarVectors(target, vectors, n);
      parentPort?.postMessage(similarVectors);
      parentPort?.close();
      resolve(null);
    }
  };
}
