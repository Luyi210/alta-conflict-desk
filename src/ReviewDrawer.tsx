import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Native modal focus containment, rendered outside the animated workspace. */
export default function ReviewDrawer({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
  returnFocus,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  returnFocus?: HTMLElement | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const previous = useRef(
    returnFocus ?? (document.activeElement as HTMLElement | null),
  );
  const close = useRef(onClose);
  close.current = onClose;
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previous.current?.isConnected)
        previous.current.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className={`review-drawer ${wide ? "review-drawer-wide" : ""}`}
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const items = Array.from(
          e.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]',
          ),
        ).filter((el) => el.getClientRects().length > 0);
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        if (
          e.target === e.currentTarget &&
          (e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom)
        )
          close.current();
      }}
    >
      <div className="review-drawer-head">
        <div>
          <span className="review-kicker">ALTA · REVIEW DESK</span>
          <h2 id={titleId}>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button
          className="review-close"
          aria-label={`关闭${title}`}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <div className="review-drawer-body">{children}</div>
    </dialog>,
    document.body,
  );
}
