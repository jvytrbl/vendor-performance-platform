// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  mutate: [
    "lib/domain/vendors/findDuplicateVendor.ts",
  ],
  testRunner: "vitest",
  reporters: ["progress", "clear-text", "html"],
  coverageAnalysis: "perTest",
};
export default config;