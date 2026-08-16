import { parseWarningEntries } from './timesheet';

describe('parseWarningEntries', () => {
  it('splits the comma-separated dates into a list per user', () => {
    const result = parseWarningEntries([
      { key: 'anhvnt2', value: '14/Aug/26' },
      {
        key: 'anhnd137',
        value: '03/Aug/26, 04/Aug/26, 05/Aug/26',
      },
    ]);

    expect(result).toEqual([
      {
        username: 'anhnd137',
        dates: ['03/Aug/26', '04/Aug/26', '05/Aug/26'],
        count: 3,
      },
      { username: 'anhvnt2', dates: ['14/Aug/26'], count: 1 },
    ]);
  });

  it('sorts each user dates chronologically', () => {
    const [user] = parseWarningEntries([
      { key: 'baohq11', value: '10/Aug/26, 03/Aug/26, 14/Sep/26, 28/Jul/26' },
    ]);

    expect(user.dates).toEqual([
      '28/Jul/26',
      '03/Aug/26',
      '10/Aug/26',
      '14/Sep/26',
    ]);
  });

  it('sorts users by most missing days, then by username', () => {
    const result = parseWarningEntries([
      { key: 'zed', value: '03/Aug/26' },
      { key: 'alice', value: '03/Aug/26' },
      { key: 'bob', value: '03/Aug/26, 04/Aug/26' },
    ]);

    expect(result.map(user => user.username)).toEqual(['bob', 'alice', 'zed']);
  });

  it('drops users without any missing dates', () => {
    const result = parseWarningEntries([
      { key: 'nobody', value: '' },
      { key: 'blank', value: '  ,  ' },
      { key: 'baohq11', value: '03/Aug/26' },
    ]);

    expect(result.map(user => user.username)).toEqual(['baohq11']);
  });

  it('returns an empty list for an empty response', () => {
    expect(parseWarningEntries([])).toEqual([]);
  });
});
