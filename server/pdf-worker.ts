import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

process.once("message", async (input: { bytes: string }) => {
  let task;
  try {
    task = getDocument({
      data: new Uint8Array(Buffer.from(input.bytes, "base64")),
      useSystemFonts: false,
      stopAtErrors: true,
    });
    const document = await task.promise;
    if (document.numPages > 20)
      throw new Error("首版支持最多 20 页的带文本 PDF");
    const pages: string[] = [];
    for (let n = 1; n <= document.numPages; n++) {
      const page = await document.getPage(n);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) =>
          "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "",
        )
        .join("")
        .replace(/[ \t]+/g, " ")
        .trim();
      if (text.length > 40000) throw new Error("单页文本过长，请拆分材料");
      pages.push(text);
    }
    if (!pages.some((p) => /[\p{L}\p{N}]/u.test(p)))
      throw new Error("未提取到文字，扫描件需要先完成 OCR；本版不支持 OCR");
    process.send?.({ pages });
  } catch (error) {
    process.send?.({
      error: error instanceof Error ? error.message : "PDF 无法解析",
    });
  } finally {
    await task?.destroy();
    process.disconnect();
  }
});
