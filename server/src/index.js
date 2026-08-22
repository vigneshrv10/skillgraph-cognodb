import "dotenv/config";
import express from "express";
import cors from "cors";
import { getDriver, closeDriver } from "./db.js";
import { listRoles, listSkills, pathToRole, recommendations } from "./queries.js";

const app = express();
app.use(cors());
app.use(express.json());

async function runQuery(query, params = {}) {
  const session = getDriver().session();
  try {
    const result = await session.executeRead(tx => tx.run(query, params));
    return result.records;
  } finally {
    await session.close();
  }
}

app.get("/api/health", async (_req, res) => {
  try {
    const session = getDriver().session();
    await session.run("RETURN 1 AS ok");
    await session.close();
    res.json({ ok: true, database: true });
  } catch (error) {
    res.status(503).json({ ok: false, database: false, error: "CognoDB is unreachable." });
  }
});

app.get("/api/roles", async (_req, res) => {
  try {
    const records = await runQuery(listRoles);
    res.json(records.map(r => ({ name: r.get("name"), description: r.get("description") })));
  } catch (error) {
    res.status(503).json({ error: "Could not load roles. Check your CognoDB connection." });
  }
});

app.get("/api/skills", async (_req, res) => {
  try {
    const records = await runQuery(listSkills);
    res.json(records.map(r => ({ name: r.get("name") })));
  } catch (error) {
    res.status(503).json({ error: "Could not load skills. Check your CognoDB connection." });
  }
});

app.get("/api/path", async (req, res) => {
  const { role, skill = null } = req.query;
  if (!role) return res.status(400).json({ error: "role is required" });
  try {
    const records = await runQuery(pathToRole, { role, skill });
    if (!records.length) return res.status(404).json({ error: "Role not found." });
    const r = records[0];
    const path = r.get("path");
    const hops = r.get("hops").toNumber ? r.get("hops").toNumber() : r.get("hops");
    const relatedRoles = r.get("relatedRoles").toNumber ? r.get("relatedRoles").toNumber() : r.get("relatedRoles");
    res.json({
      role: r.get("role"),
      path,
      hops,
      requiredSkills: r.get("requiredSkills"),
      relatedRoles,
      explanation: "The same skill can participate in many relationships. The graph can traverse those connections directly, making multi-hop discovery natural."
    });
  } catch (error) {
    console.error(error);
    res.status(503).json({ error: "Graph query failed. Check your CognoDB connection and seed data." });
  }
});

app.get("/api/recommendations", async (req, res) => {
  const { skill } = req.query;
  if (!skill) return res.json([]);
  try {
    const records = await runQuery(recommendations, { skill });
    res.json(records.map(r => ({
      name: r.get("name"),
      sharedSkills: r.get("sharedSkills").toNumber ? r.get("sharedSkills").toNumber() : r.get("sharedSkills")
    })));
  } catch (error) {
    res.status(503).json({ error: "Could not calculate recommendations." });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`SkillGraph API running on http://localhost:${port}`));

process.on("SIGTERM", async () => { await closeDriver(); process.exit(0); });
