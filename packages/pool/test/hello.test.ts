import { Hello } from '../src/pipeline';

test('hello', () => {
  expect(new Hello().sayHello()).toBe('hello, world!');
});