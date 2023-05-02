const CDKSnapshotSerializer = {
  test(val) {
    return typeof val === 'string';
  },
  print(val) {
    const patterns = [
      { regex: /[a-z0-9]+.json/, replacement: 'GREEDY_JSON' },
      { regex: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/, replacement: 'UUID' },
      { regex: /[0-9a-f]{64}\.zip/, replacement: 'ZIP' },
      { regex: /KarpenterNodeInstanceProfile-\w+/g, replacement: 'KARPENTER_INSTANCE_PROFILE' },
    ];

    const combinedRegex = new RegExp(patterns.map(p => p.regex.source).join('|'), 'g');

    return val.replace(combinedRegex, (match) => {
      for (const pattern of patterns) {
        if (pattern.regex.test(match)) {
          pattern.regex.lastIndex = 0;
          return pattern.replacement;
        }
      }
      return match;
    });
  },
};

module.exports = CDKSnapshotSerializer;