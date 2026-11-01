import { describe, expect, it } from 'vitest';
import { isAppFrame, isLogException } from './logFormat';

const frame = (file: string | null) => ({ file, line: 1, class: null, type: null, function: 'run' });

describe('isLogException', () => {
  it('reconnaît une exception normalisée avec stack trace', () => {
    expect(isLogException({ class: 'RuntimeException', message: 'Boom', trace: [] })).toBe(true);
  });

  it.each(['Message seul', null, undefined, { message: 'sans classe', trace: [] }, { class: 'X', message: 'sans trace' }])(
    'refuse le format historique %p',
    (value) => {
      expect(isLogException(value)).toBe(false);
    }
  );
});

describe('isAppFrame', () => {
  it.each([
    ['src/Service/AccountService.php', true],
    ['vendor/symfony/mime/Message.php', false],
    ['D:\\workspace\\api\\vendor\\symfony\\mailer\\Mailer.php', false],
    [null, false],
  ])('%s → %s', (file, expected) => {
    expect(isAppFrame(frame(file))).toBe(expected);
  });
});
