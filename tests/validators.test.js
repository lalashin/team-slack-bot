const { isValidTaskTitle, isValidTaskStatus, escapeSlackMrkdwn } = require('../src/utils/validators');

describe('validators', () => {
  test('isValidTaskTitle', () => {
    expect(isValidTaskTitle('hello')).toBe(true);
    expect(isValidTaskTitle('')).toBe(false);
    expect(isValidTaskTitle('   ')).toBe(false);
    expect(isValidTaskTitle('a'.repeat(201))).toBe(false);
    expect(isValidTaskTitle('\u200b')).toBe(false);
    expect(isValidTaskTitle('\u200bvisible')).toBe(true);
  });

  test('escapeSlackMrkdwn', () => {
    expect(escapeSlackMrkdwn('a*b_c')).toBe('a\\*b\\_c');
  });

  test('isValidTaskStatus', () => {
    expect(isValidTaskStatus('open')).toBe(true);
    expect(isValidTaskStatus('done')).toBe(true);
    expect(isValidTaskStatus('invalid')).toBe(false);
  });
});
