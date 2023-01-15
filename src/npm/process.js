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
const NS_PER_SEC = 1e9;
const hrtime = (previousTimestamp) => {
  const clocktime = performanceNow.call(performance) * 1e-3;
  let seconds = Math.floor(clocktime);
  let nanoseconds = Math.floor((clocktime % 1) * NS_PER_SEC);
  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0];
    nanoseconds = nanoseconds - previousTimestamp[1];
    if (nanoseconds < 0) {
      seconds--;
      nanoseconds += NS_PER_SEC;
    }
  }
  return [seconds, nanoseconds];
};
// https://github.com/sagemathinc/cowasm/blob/7ec0dad2ef471edf893c75d65a86000d82d16024/packages/wasi-js/src/bindings/browser-hrtime.ts
hrtime.bigint = (time) => {
  const diff = hrtime(time);
  return diff[0] * NS_PER_SEC + diff[1];
};

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
