import { test } from "node:test"
import assert from "node:assert/strict"
import { lineBreakSegments } from "./line-break.ts"

// react-pdf 只在 segments 之間斷行；'' 讓斷點不插入連字號
test("中文每個字之間都能斷行", () => {
  assert.deepEqual(lineBreakSegments("身分證健保卡"), ["身", "", "分", "", "證", "", "健", "", "保", "", "卡"])
})

test("英文單字與數字不從中間斷開", () => {
  assert.deepEqual(lineBreakSegments("INQR5000"), ["INQR5000"])
  assert.deepEqual(lineBreakSegments("Websocket標準"), ["Websocket", "", "標", "", "準"])
})

test("頓號、句號、右括號、冒號不放行首：黏在前一個字", () => {
  assert.deepEqual(lineBreakSegments("證、健保。"), ["證、", "", "健", "", "保。"])
  assert.deepEqual(lineBreakSegments("型號:INQR5000"), ["型", "", "號:", "", "INQR5000"])
})

test("左括號不放行尾：黏在後一個字", () => {
  assert.deepEqual(lineBreakSegments("（大通證）"), ["（大", "", "通", "", "證）"])
  assert.deepEqual(lineBreakSegments("(機讀區)、居"), ["(機", "", "讀", "", "區)、", "", "居"])
})

test("不會遺失任何字元：片段接起來等於原文", () => {
  const samples = [":abc", ")開頭", "(", "、、開頭", "a:b", "x)、(y", "全形（", "，。", "混合abc、（def）。123"]
  for (const s of samples) assert.equal(lineBreakSegments(s).join(""), s, s)
})
