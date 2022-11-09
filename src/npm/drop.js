module.exports = async function (...args) {
  const factory = require("../../build/drop");
  const instance = await factory();
  return instance.callMain(...args);
};
