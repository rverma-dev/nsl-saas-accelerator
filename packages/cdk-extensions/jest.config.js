const sharedConfig = require('../../jest.config.js');

module.exports = {
  ...sharedConfig,
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
