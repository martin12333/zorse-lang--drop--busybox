// From: https://github.com/kumavis/browser-process-hrtime/blob/38920d3d06ddecf0ad1b51f0f6872db946e3c035/index.js
// polyfill for window.performance.now
const performance = globalThis.performance || {};
const performanceNow =
  performance.now ||
  performance.mozNow ||
  performance.msNow ||
  performance.oNow ||
  performance.webkitNow ||
  function () {
    return new Date().getTime();
  };

// generate timestamp or delta
// see http://nodejs.org/api/process.html#process_process_hrtime
function hrtime(previousTimestamp) {
  const clocktime = performanceNow.call(performance) * 1e-3;
  let seconds = Math.floor(clocktime);
  let nanoseconds = Math.floor((clocktime % 1) * 1e9);
  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0];
    nanoseconds = nanoseconds - previousTimestamp[1];
    if (nanoseconds < 0) {
      seconds--;
      nanoseconds += 1e9;
    }
  }
  return [seconds, nanoseconds];
}

module.exports =
  typeof window !== "undefined" || typeof postMessage !== "undefined"
    ? {
        on: () => {},
        env: {},
        argv: [],
        platform: "linux",
        hrtime,
        exit(status) {
          // if (status !== 0) throw new Error(`exit code: ${status}`);
          // in browser we don't want to exit...
        },
        binding(name) {
          if (name === "constants") return require("constants-browserify");
          throw new Error(`process.binding("${name}") is not supported`);
        },
      }
    : require("processExt");
