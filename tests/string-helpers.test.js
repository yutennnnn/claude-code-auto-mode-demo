const { capitalize, slugify, truncate } = require("../src/utils/string-helpers");

describe("capitalize", () => {
  test("先頭文字を大文字にする", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  test("すでに大文字の場合はそのまま", () => {
    expect(capitalize("Hello")).toBe("Hello");
  });

  test("1文字の場合は大文字にする", () => {
    expect(capitalize("a")).toBe("A");
  });

  test("先頭以外は変更しない", () => {
    expect(capitalize("hELLO")).toBe("HELLO");
  });

  test("先頭がスペースの場合はそのまま（スペースのUpperCaseはスペース）", () => {
    expect(capitalize(" hello")).toBe(" hello");
  });

  // エッジケース
  test("空文字の場合は空文字を返す", () => {
    expect(capitalize("")).toBe("");
  });

  test("nullの場合は空文字を返す", () => {
    expect(capitalize(null)).toBe("");
  });

  test("undefinedの場合は空文字を返す", () => {
    expect(capitalize(undefined)).toBe("");
  });

  test("数値の場合は空文字を返す", () => {
    expect(capitalize(123)).toBe("");
  });

  test("配列の場合は空文字を返す", () => {
    expect(capitalize(["hello"])).toBe("");
  });
});

describe("slugify", () => {
  test("スペースをハイフンに変換する", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  test("特殊文字を除去する", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  test("連続スペースをハイフン1つにする", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  test("アンダースコアをハイフンに変換する", () => {
    expect(slugify("hello_world")).toBe("hello-world");
  });

  test("前後のハイフンを除去する", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  test("前後のスペースをトリムする", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
  });

  // エッジケース
  test("空文字の場合は空文字を返す", () => {
    expect(slugify("")).toBe("");
  });

  test("スペースのみの場合は空文字を返す", () => {
    expect(slugify("   ")).toBe("");
  });

  test("特殊文字のみの場合は空文字を返す", () => {
    expect(slugify("!!!")).toBe("");
  });

  test("nullの場合は空文字を返す", () => {
    expect(slugify(null)).toBe("");
  });

  test("undefinedの場合は空文字を返す", () => {
    expect(slugify(undefined)).toBe("");
  });

  test("数値の場合は空文字を返す", () => {
    expect(slugify(42)).toBe("");
  });
});

describe("truncate", () => {
  test("指定文字数で切り詰める", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
  });

  test("文字数以内の場合はそのまま", () => {
    expect(truncate("Hi", 5)).toBe("Hi");
  });

  test("ちょうど境界の文字数は切り詰めない", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });

  test("デフォルト50文字で切り詰める", () => {
    const longStr = "a".repeat(60);
    expect(truncate(longStr)).toBe("a".repeat(50) + "...");
  });

  test("デフォルト50文字以内はそのまま", () => {
    const shortStr = "a".repeat(50);
    expect(truncate(shortStr)).toBe(shortStr);
  });

  // エッジケース
  test("空文字の場合は空文字を返す", () => {
    expect(truncate("")).toBe("");
  });

  test("nullの場合は空文字を返す", () => {
    expect(truncate(null)).toBe("");
  });

  test("undefinedの場合は空文字を返す", () => {
    expect(truncate(undefined)).toBe("");
  });

  test("数値の場合は空文字を返す", () => {
    expect(truncate(12345)).toBe("");
  });

  test("length=0の場合は空文字を返す", () => {
    expect(truncate("hello", 0)).toBe("");
  });

  test("length<0の場合は空文字を返す", () => {
    expect(truncate("hello", -1)).toBe("");
  });

  test("lengthが非数値文字列の場合は空文字を返す", () => {
    expect(truncate("hello", "abc")).toBe("");
  });

  test("lengthがNaNの場合は空文字を返す", () => {
    expect(truncate("hello", NaN)).toBe("");
  });

  test("lengthがInfinityの場合は空文字を返す", () => {
    expect(truncate("hello", Infinity)).toBe("");
  });
});
