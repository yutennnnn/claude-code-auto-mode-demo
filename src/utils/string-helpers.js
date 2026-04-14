/**
 * 先頭文字を大文字にする
 * @param {string} str - 対象文字列
 * @returns {string} 先頭が大文字になった文字列。null/undefined/非文字列/空文字の場合は空文字を返す
 * @example
 * capitalize("hello")       // => "Hello"
 * capitalize("world peace") // => "World peace"
 * capitalize("")            // => ""
 * capitalize(null)          // => ""
 */
function capitalize(str) {
  if (str == null || typeof str !== "string" || str.length === 0) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 文字列をURL用スラッグに変換する。
 * 小文字に変換し、英数字・ハイフン以外を除去し、スペース/アンダースコアをハイフンに置換する。
 * @param {string} str - 対象文字列
 * @returns {string} URL用スラッグ。null/undefined/非文字列/空文字の場合は空文字を返す
 * @example
 * slugify("Hello World")     // => "hello-world"
 * slugify("Hello, World!")   // => "hello-world"
 * slugify("hello_world")     // => "hello-world"
 * slugify("  hello   world") // => "hello-world"
 * slugify(null)              // => ""
 */
function slugify(str) {
  if (str == null || typeof str !== "string" || str.trim().length === 0) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * 指定文字数で切り詰めて末尾に "..." を付ける。
 * @param {string} str - 対象文字列
 * @param {number} [length=50] - 最大文字数（正の有限な数値）。0以下または非数値の場合は空文字を返す
 * @returns {string} 切り詰められた文字列。null/undefined/非文字列/空文字の場合は空文字を返す
 * @example
 * truncate("Hello World", 5) // => "Hello..."
 * truncate("Hi", 5)          // => "Hi"
 * truncate("Hello", 5)       // => "Hello"  (ちょうど境界は切り詰めない)
 * truncate("Hello", 0)       // => ""
 * truncate(null)             // => ""
 */
function truncate(str, length = 50) {
  if (str == null || typeof str !== "string" || str.length === 0) return "";
  const maxLength = Number(length);
  if (!Number.isFinite(maxLength) || maxLength <= 0) return "";
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

module.exports = { capitalize, slugify, truncate };
