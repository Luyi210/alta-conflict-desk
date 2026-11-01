import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "lucide-react";
import "./tutorial.css";

const steps = [
  {
    title: "接入资料",
    summary: "让工作台知道可以查哪些来源。",
    action: "打开「连接器」，连接三项来源并测试。",
    result: "每项显示「已连接」。",
  },
  {
    title: "建立案件",
    summary: "写清委托范围，再确认每一家相关公司。",
    action: "点「新建审查」，填写事项、查询身份并确认主体。",
    result: "案件建立后开始主体核查。",
  },
  {
    title: "核对主体线索",
    summary: "看清公开登记和本所事项为何被关联。",
    action: "在「主体与线索」点「查看证据与逐项复核」。",
    result: "能看到匹配理由和实际工具调用。",
  },
  {
    title: "阅读委托材料",
    summary: "把原文、页码和不同版本留在案件里。",
    action: "在「材料与原文」导入 PDF，按需授权一个版本。",
    result: "可逐页查看 PDF；保存的引用能返回原文。",
  },
  {
    title: "整理核实建议",
    summary: "根据获授权的材料，列出下一步要问什么。",
    action: "模型已配置后，在「核实建议」发起材料核实，先检查引用。",
    result: "补证草稿可修改，再采用为审查问题。",
  },
  {
    title: "处理审查问题",
    summary: "把待核实事项交给具体的人，并留下依据。",
    action: "在「审查问题」记录责任人、原文依据和处理意见。",
    result: "未处理的问题继续留在清单中。",
  },
  {
    title: "记录总意见",
    summary: "保存律师判断，准备交接本轮工作。",
    action: "在「案件总意见」保存；Word 导出在「审查问题」。",
    result: "案件顶部还可下载文字版记录。",
  },
] as const;

export default function TutorialDialog({
  step,
  hasCases,
  caseContext,
  onStep,
  onClose,
  onVisit,
}: {
  step: number;
  hasCases: boolean;
  caseContext: boolean;
  onStep: (step: number) => void;
  onClose: () => void;
  onVisit: (step: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const previous = useRef<HTMLElement | null>(null);
  const close = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();
  close.current = onClose;
  const current = steps[step];

  useEffect(() => {
    const element = dialog.current!;
    previous.current = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal();
    element.focus();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      if (previous.current?.isConnected)
        previous.current.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialog}
      className="tutorial-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      onCancel={(event) => {
        event.preventDefault();
        close.current();
      }}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          const items = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled), a[href], [tabindex="0"]',
            ),
          ).filter((item) => item.getClientRects().length > 0);
          const first = items[0];
          const last = items[items.length - 1];
          if (
            event.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === event.currentTarget)
          ) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
          return;
        }
        if (event.key === "ArrowLeft" && step > 0) {
          event.preventDefault();
          onStep(step - 1);
        } else if (event.key === "ArrowRight" && step < steps.length - 1) {
          event.preventDefault();
          onStep(step + 1);
        }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          close.current();
      }}
    >
      <div className="tutorial-layout">
        <aside className="tutorial-cover" aria-label="教程进度">
          <div className="tutorial-cover-brand">
            <span>a.</span>
            <div>
              altalex
              <small>CONFLICT DESK</small>
            </div>
          </div>
          <div className="tutorial-cover-center">
            <span>一宗案件，七个环节</span>
            <strong>{String(step + 1).padStart(2, "0")}</strong>
            <p>律师收案审查</p>
          </div>
          <div className="tutorial-cover-progress">
            <span>
              当前进度{" "}
              <b>
                {step + 1} / {steps.length}
              </b>
            </span>
            <div aria-label="选择教程步骤">
              {steps.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  className={index === step ? "active" : ""}
                  aria-label={`第 ${index + 1} 步：${item.title}`}
                  aria-current={index === step ? "step" : undefined}
                  onClick={() => onStep(index)}
                />
              ))}
            </div>
          </div>
        </aside>
        <section className="tutorial-page">
          <div className="tutorial-page-top">
            <span>操作教程 · {String(step + 1).padStart(2, "0")}</span>
            <button
              type="button"
              className="tutorial-close"
              aria-label="关闭教程"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
          <div className="tutorial-copy" aria-live="polite">
            <h2 id={titleId}>{current.title}</h2>
            <p id={descriptionId}>{current.summary}</p>
            <div className="tutorial-instruction">
              <span>现在做</span>
              <strong>{current.action}</strong>
            </div>
            <div className="tutorial-result">
              <span>完成后看</span>
              <p>{current.result}</p>
            </div>
          </div>
          <div className="tutorial-page-bottom">
            <button
              type="button"
              className="tutorial-visit"
              onClick={() => onVisit(step)}
            >
              {step > 1 && !caseContext
                ? hasCases
                  ? "先选择案件"
                  : "先新建案件"
                : "打开对应页面"}
              <ArrowUpRight size={15} />
            </button>
            <div>
              <button
                type="button"
                className="tutorial-back"
                disabled={step === 0}
                onClick={() => onStep(step - 1)}
              >
                <ArrowLeft size={15} /> 上一步
              </button>
              <button
                type="button"
                className="tutorial-next"
                onClick={() =>
                  step === steps.length - 1 ? onClose() : onStep(step + 1)
                }
              >
                {step === steps.length - 1 ? "完成" : "下一步"}
                {step < steps.length - 1 && <ArrowRight size={15} />}
              </button>
            </div>
          </div>
        </section>
      </div>
    </dialog>,
    document.body,
  );
}
