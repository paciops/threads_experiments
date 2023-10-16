import { readFile } from "fs/promises";
import { createArrayBuffer, findSimilarVectors, getMagnitude } from "./vector"

const FILE_NAME = "./output.json";

const main = async () => {
    const file = await readFile(FILE_NAME)

    const { target, vectors }: { target: number[]; vectors: number[][] } =
        JSON.parse(file.toString()),
        n = target.length,
        floatVectorsMap = vectors.reduce((acc, curr, index) => {
            const arrayBuf = createArrayBuffer(curr);
            acc[`${index}`] = [getMagnitude(arrayBuf, n), arrayBuf];
            return acc
        }, {} as Record<string, [number, Float32Array]>);

    console.time("main thread");
    const similarVectors = findSimilarVectors(createArrayBuffer(target), floatVectorsMap, n)
    console.timeEnd("main thread");

    similarVectors.sort((a, b) => b.score - a.score);
    console.table(similarVectors.slice(0, 20));
    console.log("number of similar vectors ", similarVectors.length);

}

main().then(() => console.log("ends")).catch(console.error)