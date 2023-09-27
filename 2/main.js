const { runParallel } = require("./parallel");

function main() {
  runParallel({ m: 975, poolSize: 1 }).then((tot) =>
    console.log(`found ${tot} arrays`)
  );
}

main();
