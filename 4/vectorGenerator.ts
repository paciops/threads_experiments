import { writeFile } from "fs/promises";
import { resolve } from "path";

type Vector = Record<string, [number, Float32Array]>;

const FILE_NAME = "output.json";
const VECTORS_NUMBER = parseInt(process.argv[2].replaceAll("_", ""), 10) || 100;
const VECTOR_SIZE = parseInt(process.argv[3], 10) || 10;
const createRandomArray = (n: number) => Array(n).fill(0).map(Math.random);

console.log({ VECTORS_NUMBER, VECTOR_SIZE });

const data = {
  target: createRandomArray(VECTOR_SIZE),
  vectors: Array(VECTORS_NUMBER)
    .fill(0)
    .map(() => createRandomArray(VECTOR_SIZE)),
};

writeFile(resolve(__dirname, FILE_NAME), JSON.stringify(data))
  .then(() => console.log("done"))
  .catch(console.error);
