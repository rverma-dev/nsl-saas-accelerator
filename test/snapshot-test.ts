import * as cdk from 'aws-cdk-lib';

export function snapShotTest(testNamePrefix: string, stack: cdk.Stack) {
  test(`${testNamePrefix} Snapshot Test`, () => {
    // greedy implementation: eg, because "/path/home/temp.json" matches on
    // temp.json, replace the whole string to "replaced-json-path.json".
    const greedyJsonRegex = /[a-z0-9]+.json/;

    // limited: only match length of generated zip file or UUID spec lengths.
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
    const zipRegex = /[0-9a-f]{64}\.zip/;
    const karpenterRegex = /KarpenterNodeInstanceProfile-\w+/g;

    // test each serialized object - if any part of string matches regex
    // replace with value of print()
    expect.addSnapshotSerializer({
      test: (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        val: any,
      ) => typeof val === 'string' && val.match(uuidRegex) != null,
      print: () => '"REPLACED-UUID"',
    });

    expect.addSnapshotSerializer({
      test: (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        val: any,
      ) => typeof val === 'string' && val.match(zipRegex) != null,
      print: () => '"REPLACED-GENERATED-NAME.zip"',
    });

    expect.addSnapshotSerializer({
      test: (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        val: any,
      ) => typeof val === 'string' && val.match(greedyJsonRegex) != null,
      print: () => '"REPLACED-JSON-PATH.json"',
    });

    expect.addSnapshotSerializer({
      test: (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        val: any,
      ) => typeof val === 'string' && val.match(karpenterRegex) != null,
      print: () => 'KarpenterNodeInstanceProfile-af1b4d33eeef7b22739df2faa2679bfb',
    });

    expect(stack.toYamlString).toMatchSnapshot();
  });
}
