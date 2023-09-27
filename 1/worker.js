const { parentPort } = require("worker_threads");

parentPort.on("message", (msg) => {
  console.log("thread", msg);
  msg.sort();
  parentPort.postMessage(msg, [msg.buffer]);
  parentPort.close();
});
