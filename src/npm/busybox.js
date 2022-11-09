module.exports = async function (...args) {
  const factory = require("../../build/busybox_unstripped");
  const instance = await factory();
  return instance.callMain(...args);
};
