import { DatabaseSync } from "node:sqlite";
import { fork } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  Material,
  MaterialEvidence,
  MaterialPage,
  MaterialReview,
} from "../shared/materials.ts";
import { HttpError } from "./connectors.ts";

export function extractPdf(bytes: Buffer): Promise<string[]> {
  if (!bytes.length || bytes.length > 8 * 1024 * 1024)
    throw new HttpError(400, "PDF 文件须为 1 字节至 8 MB");
  if (!bytes.subarray(0, 1024).includes(Buffer.from("%PDF-")))
    throw new HttpError(400, "仅支持有效的 PDF 文件");
  return new Promise((resolve, reject) => {
    const child = fork(
      fileURLToPath(new URL("./pdf-worker.ts", import.meta.url)),
      [],
      {
        execArgv: ["--max-old-space-size=256", "--import", "tsx"],
        stdio: ["ignore", "ignore", "ignore", "ipc"],
        env: { PATH: process.env.PATH },
      },
    );
    let settled = false;
    const finish = (error?: Error, pages?: string[]) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill();
      if (error) reject(error);
      else resolve(pages!);
    };
    const timer = setTimeout(
      () => finish(new HttpError(422, "PDF 解析超时，请拆分或转换文件")),
      20000,
    );
    child.on("message", (m: any) =>
      m.error
        ? finish(new HttpError(422, `PDF 无法解析：${m.error}`))
        : finish(undefined, m.pages),
    );
    child.on("error", () => finish(new HttpError(422, "PDF 解析进程未能启动")));
    child.on("exit", () =>
      finish(new HttpError(422, "PDF 解析中断，文件可能损坏或过于复杂")),
    );
    child.send({ bytes: bytes.toString("base64") });
  });
}

export class MaterialStore {
  db: DatabaseSync;
  constructor(
    private dir: string,
    readOnly = false,
  ) {
    if (!readOnly) mkdirSync(join(dir, "materials"), { recursive: true });
    this.db = new DatabaseSync(join(dir, "materials.sqlite"), { readOnly });
    if (!readOnly)
      this.db.exec(`
      CREATE TABLE IF NOT EXISTS materials (id TEXT PRIMARY KEY, caseId TEXT NOT NULL, documentId TEXT NOT NULL, version INTEGER NOT NULL, data TEXT NOT NULL, pages TEXT NOT NULL, allowed INTEGER NOT NULL DEFAULT 0, UNIQUE(caseId,documentId,version));
      CREATE TABLE IF NOT EXISTS material_reviews (id TEXT PRIMARY KEY, caseId TEXT NOT NULL, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS material_evidence (id TEXT PRIMARY KEY, caseId TEXT NOT NULL, data TEXT NOT NULL);
    `);
  }
  list(caseId: string): Material[] {
    const rows = this.db
      .prepare(
        "SELECT data, allowed FROM materials WHERE caseId=? ORDER BY rowid DESC",
      )
      .all(caseId) as { data: string; allowed: number }[];
    const seen = new Set<string>();
    return rows.map((row) => {
      const d = JSON.parse(row.data) as Material;
      const latest = !seen.has(d.documentId);
      seen.add(d.documentId);
      return { ...d, modelAllowed: Boolean(row.allowed), latest };
    });
  }
  get(caseId: string, id: string, modelAccess = false): Material {
    const d = this.list(caseId).find((d) => d.id === id);
    if (!d) throw new HttpError(404, "本案中不存在该材料版本");
    if (modelAccess && !d.modelAllowed)
      throw new HttpError(403, "该材料版本未获 AI 授权或授权已撤回");
    return d;
  }
  page(
    caseId: string,
    id: string,
    page: number,
    modelAccess = false,
  ): MaterialPage {
    const material = this.get(caseId, id, modelAccess);
    if (!Number.isInteger(page) || page < 1 || page > material.pageCount)
      throw new HttpError(400, "页码不在材料范围内");
    const row = this.db
      .prepare("SELECT pages FROM materials WHERE id=? AND caseId=?")
      .get(id, caseId) as { pages: string };
    return {
      material,
      page,
      text: (JSON.parse(row.pages) as string[])[page - 1],
    };
  }
  async add(caseId: string, title: string, bytes: Buffer, previous?: string) {
    if (this.list(caseId).length >= 30)
      throw new HttpError(409, "本案最多保存 30 个材料版本");
    if (previous) this.get(caseId, previous);
    const pages = await extractPdf(bytes);
    // Re-read after async extraction so concurrently imported versions never overwrite one another.
    const prior = previous ? this.get(caseId, previous) : undefined;
    const versions = prior
      ? this.list(caseId).filter((d) => d.documentId === prior.documentId)
      : [];
    const id = randomUUID();
    const d: Material = {
      id,
      caseId,
      documentId: prior?.documentId || randomUUID(),
      version: Math.max(0, ...versions.map((d) => d.version)) + 1,
      title,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      size: bytes.length,
      pageCount: pages.length,
      createdAt: new Date().toISOString(),
      modelAllowed: false,
      latest: true,
    };
    writeFileSync(join(this.dir, "materials", `${id}.pdf`), bytes, {
      flag: "wx",
      mode: 0o600,
    });
    this.db.exec("BEGIN");
    try {
      this.db
        .prepare(
          "UPDATE materials SET allowed=0 WHERE caseId=? AND documentId=?",
        )
        .run(caseId, d.documentId);
      this.db
        .prepare("INSERT INTO materials VALUES (?,?,?,?,?,?,0)")
        .run(
          id,
          caseId,
          d.documentId,
          d.version,
          JSON.stringify(d),
          JSON.stringify(pages),
        );
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return d;
  }
  permit(caseId: string, id: string, allowed: boolean) {
    this.get(caseId, id);
    this.db
      .prepare("UPDATE materials SET allowed=? WHERE id=? AND caseId=?")
      .run(Number(allowed), id, caseId);
  }
  bytes(caseId: string, id: string) {
    this.get(caseId, id);
    return readFileSync(join(this.dir, "materials", `${id}.pdf`));
  }
  saveReview(r: MaterialReview) {
    this.db
      .prepare("INSERT OR REPLACE INTO material_reviews VALUES (?,?,?)")
      .run(r.id, r.caseId, JSON.stringify(r));
  }
  reviews(caseId: string): MaterialReview[] {
    return (
      this.db
        .prepare(
          "SELECT data FROM material_reviews WHERE caseId=? ORDER BY rowid DESC",
        )
        .all(caseId) as { data: string }[]
    ).map((r) => JSON.parse(r.data));
  }
  recover() {
    for (const row of this.db
      .prepare("SELECT data FROM material_reviews")
      .all() as { data: string }[]) {
      const r = JSON.parse(row.data) as MaterialReview;
      if (r.status === "running") {
        r.status = "failed";
        r.error = "服务重启中断了材料复核；旧记录保留，请重新运行。";
        this.saveReview(r);
      }
    }
  }
  evidence(caseId: string): MaterialEvidence[] {
    return (
      this.db
        .prepare(
          "SELECT data FROM material_evidence WHERE caseId=? ORDER BY rowid DESC",
        )
        .all(caseId) as { data: string }[]
    ).map((r) => JSON.parse(r.data));
  }
  addEvidence(e: MaterialEvidence) {
    this.db
      .prepare("INSERT INTO material_evidence VALUES (?,?,?)")
      .run(e.id, e.caseId, JSON.stringify(e));
  }
  close() {
    this.db.close();
  }
}
