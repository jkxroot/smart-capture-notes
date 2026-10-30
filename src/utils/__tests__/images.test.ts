import { getPrimaryImagePath, getRecordImagePaths, normalizeLocalImageUris } from '../images';

describe('images helpers', () => {
  it('prefers image_paths over image_path', () => {
    expect(
      getRecordImagePaths({
        image_path: 'a.jpg',
        image_paths: ['b.jpg', 'c.jpg'],
      })
    ).toEqual(['b.jpg', 'c.jpg']);
  });

  it('falls back to image_path', () => {
    expect(getPrimaryImagePath({ image_path: 'a.jpg', image_paths: [] })).toBe('a.jpg');
  });

  it('normalizes local uri inputs', () => {
    expect(normalizeLocalImageUris('x')).toEqual(['x']);
    expect(normalizeLocalImageUris(['a', '', 'b'])).toEqual(['a', 'b']);
    expect(normalizeLocalImageUris(null)).toEqual([]);
  });
});
