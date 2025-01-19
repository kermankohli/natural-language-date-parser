import { VERSION } from './index';

describe('Date Parser', () => {
  it('should have a version number', () => {
    expect(VERSION).toBeDefined();
    expect(typeof VERSION).toBe('string');
  });
}); 