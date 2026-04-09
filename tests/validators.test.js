const { isValidTaskTitle, isValidTaskStatus } = require('../src/utils/validators');

describe('validators', () => {
  test('isValidTaskTitle', () => {
    expect(isValidTaskTitle('hello')).toBe(true);
    expect(isValidTaskTitle('')).toBe(false);
    expect(isValidTaskTitle('   ')).toBe(false);
    expect(isValidTaskTitle('a'.repeat(201))).toBe(false);
  });

  test('isValidTaskStatus', () => {
    expect(isValidTaskStatus('open')).toBe(true);
    expect(isValidTaskStatus('done')).toBe(true);
    expect(isValidTaskStatus('invalid')).toBe(false);
  });
});
