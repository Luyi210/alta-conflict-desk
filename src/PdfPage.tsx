import { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
GlobalWorkerOptions.workerSrc = workerUrl;
export default function PdfPage({ url, page }: { url: string; page: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setError("");
    setLoading(true);
    const task = getDocument({ url });
    void task.promise
      .then(async (doc) => {
        const p = await doc.getPage(page);
        if (cancelled || !canvas.current) return;
        const viewport = p.getViewport({ scale: 1.45 });
        canvas.current.width = viewport.width;
        canvas.current.height = viewport.height;
        await p.render({ canvas: canvas.current, viewport }).promise;
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("该页预览失败，可下载原文件核对。");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      void task.destroy();
    };
  }, [url, page]);
  return (
    <div className="pdf-page">
      {loading && <p role="status">正在绘制原文页面…</p>}
      {error && <p role="alert">{error}</p>}
      <canvas
        ref={canvas}
        aria-label={`PDF 原文第 ${page} 页`}
        style={{ display: loading || error ? "none" : "block" }}
      />
    </div>
  );
}
