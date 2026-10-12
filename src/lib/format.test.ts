import { test } from "node:test"
import assert from "node:assert/strict"
import { toChineseUpper } from "./format.ts"

test("金額轉中文大寫", () => {
  const cases: [number, string][] = [
    [0, "零"],
    [5, "伍"],
    [10, "壹拾"],
    [105, "壹佰零伍"],
    [1005, "壹仟零伍"],
    [10000, "壹萬"],
    [100005, "壹拾萬零伍"],
    [128100, "壹拾貳萬捌仟壹佰"],
    [10010000, "壹仟零壹萬"],
    [100010000, "壹億零壹萬"],
    [120000000, "壹億貳仟萬"],
  ]
  for (const [n, expected] of cases) assert.equal(toChineseUpper(n), expected, String(n))
})
