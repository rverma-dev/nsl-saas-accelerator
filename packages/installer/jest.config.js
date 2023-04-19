const sharedConfig = require('../../jest.config.js');

module.exports = {
  ...sharedConfig,
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};
