/**
 *  Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */
import * as cdk from 'aws-cdk-lib';
import { expect, test } from '@jest/globals';

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

    expect(stack).toMatchSnapshot();
  });
}
