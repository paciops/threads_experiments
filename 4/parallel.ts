import { isMainThread, parentPort, Worker, workerData } from "worker_threads";
import { readFile } from "fs/promises";
import {
  Magnitude,
  SimilarVector,
  VectorType,
  findSimilarVectors,
  getMagnitude,
} from "./vector";

const FILE_NAME = "./output.json";
const POOL_SIZE = parseInt(process.argv[2], 10) || 4;

const createSharedArrayBuffer = (array: number[], n: number) => {
  const sharedArray = new Float32Array(
    new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * n)
  );
  for (let i = 0; i < n; i++) sharedArray[i] = array[i];
  return sharedArray;
};

const createArrayBuffer = (array: number[]) => new Float32Array(array);

const main = (
  target: number[],
  vectors: Float32Array[]
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

    if (true) {
      const offset = 1_000;
      let index = 0,
        vectorsIndex = 0;
      while (vectors.length !== 0) {
        const sliceOfVectors = vectors.splice(0, offset);
        pool[index % POOL_SIZE].postMessage(
          sliceOfVectors.map((vector, i) => ({
            id: `${i + vectorsIndex}`,
            magnitude: getMagnitude(vector, n),
            vector,
          })),
          [...sliceOfVectors.map(({ buffer }) => buffer)]
        );
        index++;
        vectorsIndex += offset;
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
  return new Promise((resolve, reject) => {
    parentPort?.on("message", handleMessage(workerData.n, resolve, reject));
  });
};

if (isMainThread) {
  readFile(FILE_NAME).then((file) => {
    const { target, vectors }: { target: number[]; vectors: number[][] } =
        JSON.parse(file.toString()),
      floatVectors = vectors.map(createArrayBuffer);
    console.time("main thread");
    main(target, floatVectors).then((vectors) => {
      console.timeEnd("main thread");
      vectors.sort((a, b) => b.score - a.score);
      console.table(vectors.slice(0, 20));
      console.log("number of similar vectors ", vectors.length);
    });
  });
} else {
  worker().then(() => console.log("worker ends"));
}

function handleMessage(
  n: number,
  resolve: (value: unknown) => void,
  reject: (reason?: any) => void
) {
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
