const sharedConfig = require('../../jest.config.js');

module.exports = {
  ...sharedConfig,
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 70,
      lines: 90,
      statements: 90,
    },
  },
};
