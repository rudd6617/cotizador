// 中日文字與全形標點：每個字之間都可斷行；其餘（英文、數字）連續的一段不斷開
const range = (from: number, to: number) => `\\u{${from.toString(16)}}-\\u{${to.toString(16)}}`
const CJK = `\\p{Script=Han}${range(0x3000, 0x303f)}${range(0xff00, 0xffef)}` // 漢字、CJK 標點、全形字元

// 不放行首的標點黏前一字、不放行尾的標點黏後一字
const NO_LINE_START = "、。，．：；！？）」』】〉》:;,.!?)\\]"
const NO_LINE_END = "（「『【〈《(\\["

// 本體：一段英數，或單一個中文字／標點（標點單獨成段，確保任何字元都被比對到、不會遺失）
const BODY = `[^${CJK}${NO_LINE_START}${NO_LINE_END}]+|[${CJK}${NO_LINE_START}${NO_LINE_END}]`
const SEGMENT = new RegExp(`[${NO_LINE_END}]*(?:${BODY})[${NO_LINE_START}]*`, "gu")

/**
 * 給 react-pdf 的斷字函式：回傳可斷行的片段。
 * react-pdf 以空白分詞，中文句子沒有空白會被當成一個詞而無法換行；
 * 片段之間插入 '' 讓斷點不加連字號。
 */
export function lineBreakSegments(word: string): string[] {
  const parts = word.match(SEGMENT) ?? [word]
  return parts.flatMap((part, i) => (i === 0 ? [part] : ["", part]))
}
