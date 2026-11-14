/**
 * Authoring helper for content files.
 * Use md`...` (String.raw) so C escapes such as '\0' and "\n" are kept literally.
 * Inline code: «code» or `code` · code fences: ~~~c ... ~~~
 */
export const md = String.raw;
