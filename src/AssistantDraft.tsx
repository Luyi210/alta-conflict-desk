import { useState } from "react";
import { ArrowRight, Check, Clipboard } from "lucide-react";
import type { AssistantAction } from "../shared/assistant";
import { useReviewDraft } from "./useReviewDraft";

export default function AssistantDraft({
  action,
  draftKey,
  adopted,
  disabled,
  onApply,
  onError,
}: {
  action: AssistantAction;
  draftKey: string;
  adopted: boolean;
  disabled: boolean;
  onApply: (d: { missing: string; request: string }) => Promise<void>;
  onError: (s: string) => void;
}) {
  const draft = useReviewDraft(`assistant:${draftKey}`, {
    missing: action.missing,
    request: action.request,
  });
  const [copied, setCopied] = useState(false);
  return (
    <div className="assistant-draft">
      <div className="assistant-section-head">
        <h5>补证工作草稿</h5>
        <span>{adopted ? "已采用 · 未发送" : "可编辑 · 未发送"}</span>
      </div>
      <label className="assistant-field">
        待补材料与信息
        <textarea
          rows={3}
          value={adopted ? action.missing : draft.value.missing}
          maxLength={1500}
          disabled={adopted || disabled}
          onChange={(e) =>
            draft.setValue({ ...draft.value, missing: e.target.value })
          }
        />
      </label>
      <label className="assistant-field">
        补证请求正文
        <textarea
          rows={6}
          value={adopted ? action.request : draft.value.request}
          maxLength={1800}
          disabled={adopted || disabled}
          onChange={(e) => {
            setCopied(false);
            draft.setValue({ ...draft.value, request: e.target.value });
          }}
        />
      </label>
      <div className="assistant-draft-actions">
        <button
          className="btn secondary"
          onClick={() =>
            void navigator.clipboard
              .writeText(adopted ? action.request : draft.value.request)
              .then(() => setCopied(true))
              .catch(() => onError("复制失败，请选中正文手动复制。"))
          }
        >
          {copied ? <Check size={14} /> : <Clipboard size={14} />}
          {copied ? "已复制正文" : "复制正文"}
        </button>
        <button
          className="btn primary"
          disabled={
            disabled ||
            adopted ||
            draft.value.missing.trim().length < 2 ||
            draft.value.request.trim().length < 2
          }
          onClick={() => void onApply(draft.value)}
        >
          {adopted ? <Check size={14} /> : <ArrowRight size={14} />}
          {adopted
            ? "已带入审查问题"
            : action.targetIssueId
              ? "补充到已有问题"
              : "采用为审查问题"}
        </button>
      </div>
      <p>
        {action.targetIssueId
          ? "采用后追加到已有问题，保留原文字和意见历史。"
          : "采用后建立复核中的问题，并附上上述原文依据。"}
        不会自动解决问题或确认收案。
      </p>
      {draft.dirty && !adopted && (
        <small className="draft-status">
          {draft.storageAvailable
            ? "草稿已在当前标签页暂存"
            : "当前浏览器无法暂存，请采用或复制后离开"}
        </small>
      )}
    </div>
  );
}
