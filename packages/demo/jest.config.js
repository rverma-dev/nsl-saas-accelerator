const sharedConfig = require('../../jest.config.js');

module.exports = {
  ...sharedConfig,
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 50,
      lines: 75,
      statements: 75,
    },
  },
};
