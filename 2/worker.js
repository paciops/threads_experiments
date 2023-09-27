const { threadId, parentPort } = require("worker_threads");

const handleArrays = ({ send, receive }) => {
  const threshold = 2;
  let target,
    n = 0,
    count = 0;
  const result = [];
  return (message) => {
    if (message.target) {
      console.log(`${threadId} has received target`);
      ({ target } = message);
      n = target.length;
    } else if (message.array) {
      let { array } = message;
      let s = 0;
      count++;
      for (let i = 0; i < n; i++) {
        s += Math.abs(target[i] - array[i]);
      }
      if (s <= threshold) result.push(array);
    } else if (message.last === true) {
      console.log(`${threadId} start sending back results`);

      for (const r of result) {
        send.postMessage(r, [r.buffer]);
      }

      console.log({ threadId, count, resultLength: result.length });

      send.close();
      receive.close();
    } else {
      throw new Error(`Cannot handle ${message}`);
    }
  };
};

parentPort.once("message", ({ send, receive }) => {
  console.log(`${threadId} has received ports`);
  receive.on("message", handleArrays({ send, receive }));
});
