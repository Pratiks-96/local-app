import { describe, it, expect } from 'vitest';
import { formatLocationPath } from './utils';

describe('formatLocationPath', () => {
  it('formats nested locations', () => {
    const location = {
      name: 'Pride Purple Park',
      parent: {
        name: 'Wakad',
        parent: { name: 'Pune', parent: { name: 'Maharashtra' } },
      },
    };
    expect(formatLocationPath(location)).toBe('Maharashtra → Pune → Wakad → Pride Purple Park');
  });

  it('returns empty for null', () => {
    expect(formatLocationPath(null)).toBe('');
  });
});
