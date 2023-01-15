#!/usr/bin/env zx

import { assert, use } from "chai";

import chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

(async () => {
  await assert.isFulfilled($`node ./dist/bin.js ls -la`);
  await assert.isFulfilled($`node ./dist/bin.js node test.ts`);
  await assert.isFulfilled($`node ./dist/bin.js true`);
  await assert.isRejected($`node ./dist/bin.js false`);
})();
