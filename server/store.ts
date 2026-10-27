import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import type { Run } from "../shared/types.ts";

export const dataDir = resolve(process.env.DATA_DIR || "data");
export function prepareData(dir = dataDir) {
  mkdirSync(dir, { recursive: true });
  const ledger = new DatabaseSync(join(dir, "ledger.sqlite"));
  ledger.exec(`CREATE TABLE IF NOT EXISTS matters (
    id TEXT PRIMARY KEY, clientName TEXT NOT NULL, lei TEXT,
    matterName TEXT NOT NULL, matterRef TEXT NOT NULL, role TEXT NOT NULL,
    relationship TEXT NOT NULL, status TEXT NOT NULL, partner TEXT NOT NULL, note TEXT NOT NULL
  )`);
  // These engagements are invented for the prototype. Public entity names and LEIs are identifiers only.
  const insert = ledger.prepare(
    "INSERT OR IGNORE INTO matters VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const rows = [
    [
      "demo-1",
      "HSBC BANK PLC",
      "MP6I5ZYZBEU3UXPYFY54",
      "银行监管咨询（虚构）",
      "DEMO-2026-014",
      "委托人",
      "现有客户",
      "进行中",
      "林律师（虚构）",
      "纯演示委托，不代表该企业与任何律所存在关系。LEI 精确一致，仍需律师判断具体事项与义务。",
    ],
    [
      "demo-2",
      "HSBC HOLDINGS PLC",
      "MLU0ZO3ML4LN2LL2TL39",
      "集团治理专项（虚构）",
      "DEMO-2025-038",
      "委托人",
      "既往客户",
      "已结案",
      "周律师（虚构）",
      "纯演示委托。母子公司关系本身不自动构成法律利益冲突；既往事项和保密义务需人工核实。",
    ],
    [
      "demo-3",
      "HSBC BANK SERVICES LIMITED",
      null,
      "信息技术采购咨询（虚构）",
      "DEMO-2026-027",
      "委托人",
      "待识别记录",
      "进行中",
      "陈律师（虚构）",
      "完全虚构的近似名称记录，无 LEI，专门演示同名/近似名误报的人工排除。",
    ],
    [
      "demo-4",
      "澄川科技有限公司（虚构）",
      null,
      "软件许可咨询（虚构）",
      "DEMO-2024-006",
      "委托人",
      "既往客户",
      "已结案",
      "林律师（虚构）",
      "虚构台账；当前原型仅核查选定对方主体，不自动核查事项背景中的拟委托人。",
    ],
  ];
  for (const row of rows) insert.run(...row);
  ledger.close();
}

export class Store {
  db: DatabaseSync;
  constructor(private dir = dataDir) {
    prepareData(dir);
    this.db = new DatabaseSync(join(dir, "app.sqlite"));
    this.db
      .exec(`CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, createdAt TEXT NOT NULL, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, at TEXT NOT NULL, kind TEXT NOT NULL, data TEXT NOT NULL)`);
    // A process restart cannot resume a half-finished external request safely.
    for (const run of this.list()) {
      if (run.status === "running") {
        run.status = "failed";
        run.error = "服务重启中断了核查，请新建核查重试。";
        run.completedAt = new Date().toISOString();
        this.save(run);
      }
    }
  }
  save(run: Run) {
    this.db
      .prepare("INSERT OR REPLACE INTO runs VALUES (?, ?, ?)")
      .run(run.id, run.createdAt, JSON.stringify(run));
  }
  get(id: string): Run | undefined {
    const row = this.db.prepare("SELECT data FROM runs WHERE id=?").get(id) as
      | { data: string }
      | undefined;
    return row ? JSON.parse(row.data) : undefined;
  }
  list(): Run[] {
    return (
      this.db
        .prepare("SELECT data FROM runs ORDER BY createdAt DESC")
        .all() as { data: string }[]
    ).map((row) => JSON.parse(row.data));
  }
  audit(kind: string, data: unknown) {
    this.db
      .prepare("INSERT INTO audit (at,kind,data) VALUES (?, ?, ?)")
      .run(new Date().toISOString(), kind, JSON.stringify(data));
  }
  countLedger() {
    const db = new DatabaseSync(join(this.dir, "ledger.sqlite"), {
      readOnly: true,
    });
    const n = (
      db.prepare("SELECT count(*) n FROM matters").get() as { n: number }
    ).n;
    db.close();
    return n;
  }
  close() {
    this.db.close();
  }
}
