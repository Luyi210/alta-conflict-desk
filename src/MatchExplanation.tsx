import type { Finding } from "../shared/types";
import { explainMatch } from "../shared/match-explanation";
export default function MatchExplanation({ finding }: { finding: Finding }) {
  const e = explainMatch(finding);
  return (
    <section className="match-explanation">
      <span className="eyebrow small">IDENTITY COMPARISON</span>
      <h3>{e.summary}</h3>
      <p>逐项比对：{e.subject} 与台账记录</p>
      <div className="match-comparison-scroll">
        <table>
          <thead>
            <tr>
              <th>字段</th>
              <th>公开登记</th>
              <th>内部台账</th>
              <th>核对结果</th>
            </tr>
          </thead>
          <tbody>
            {e.rows.map((r) => (
              <tr key={r.field}>
                <th>{r.field}</th>
                <td>{r.source}</td>
                <td>{r.ledger}</td>
                <td>
                  <span className={`compare-state ${r.state}`}>
                    {r.state === "same"
                      ? "一致"
                      : r.state === "different"
                        ? "不同"
                        : "资料缺失"}
                  </span>
                  <small>{r.detail}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="case-hint">{e.relation}</p>
    </section>
  );
}
