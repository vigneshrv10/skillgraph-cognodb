import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, ChevronRight, CircleAlert, Compass, Database, GitBranch, LoaderCircle, Network, Search, Sparkles, Target, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function App() {
  const [roles, setRoles] = useState([]);
  const [skills, setSkills] = useState([]);
  const [role, setRole] = useState("");
  const [skill, setSkill] = useState("");
  const [result, setResult] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/roles`).then(r => r.json()),
      fetch(`${API}/api/skills`).then(r => r.json()),
      fetch(`${API}/api/health`).then(r => r.json())
    ])
      .then(([r, s, h]) => {
        if (r.error || s.error) throw new Error(r.error || s.error);
        setRoles(r);
        setSkills(s);
        setConnected(Boolean(h.database));
      })
      .catch(e => setError(e.message || "Could not connect to the API."));
  }, []);

  const selectedRole = useMemo(() => roles.find(x => x.name === role), [roles, role]);
  const selectedSkill = useMemo(() => skills.find(x => x.name === skill), [skills, skill]);

  async function explore() {
    if (!role) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const params = new URLSearchParams({ role });
      if (skill) params.set("skill", skill);
      const response = await fetch(`${API}/api/path?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Query failed");
      setResult(data);
      if (skill) {
        const rec = await fetch(`${API}/api/recommendations?skill=${encodeURIComponent(skill)}`);
        setRecommendations(await rec.json());
      } else {
        setRecommendations([]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Network size={21}/></div><span>SkillGraph</span></div>
        <div className={`status ${connected ? "online" : "offline"}`}>
          <span className="dot"></span>{connected ? "CognoDB connected" : "Database unavailable"}
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow"><Sparkles size={15}/> GRAPH-POWERED CAREER EXPLORER</div>
          <h1>Turn skills into<br/><span>career paths.</span></h1>
          <p>Explore how your current skills connect to real technology roles, and see the missing skills between where you are and where you want to go.</p>
        </section>

        {error && <div className="error"><CircleAlert size={18}/><span>{error}</span><button onClick={() => setError("")}><X size={16}/></button></div>}

        <section className="explorer-card">
          <div className="card-heading">
            <div><div className="kicker">EXPLORE A PATH</div><h2>Where can your skills take you?</h2></div>
            <Compass size={30}/>
          </div>
          <div className="form-grid">
            <label>Target role
              <div className="select-wrap"><BriefcaseBusiness size={17}/><select value={role} onChange={e => setRole(e.target.value)}><option value="">Choose a role...</option>{roles.map(r => <option key={r.name}>{r.name}</option>)}</select></div>
            </label>
            <label>Starting skill <span className="optional">optional</span>
              <div className="select-wrap"><GitBranch size={17}/><select value={skill} onChange={e => setSkill(e.target.value)}><option value="">Choose a skill...</option>{skills.map(s => <option key={s.name}>{s.name}</option>)}</select></div>
            </label>
            <button className="primary" disabled={!role || loading} onClick={explore}>{loading ? <LoaderCircle className="spin" size={18}/> : <Search size={18}/>} Explore</button>
          </div>
          {selectedRole && <div className="role-hint"><Target size={16}/><span><b>{selectedRole.name}</b> — {selectedRole.description}</span></div>}
          {selectedSkill && <div className="role-hint"><GitBranch size={16}/><span>Starting from <b>{selectedSkill.name}</b>. The graph will find connections to <b>{role || "your target role"}</b>.</span></div>}
        </section>

        {result && <Results result={result} recommendations={recommendations} />}
        {!result && !loading && <HowItWorks />}
      </main>
    </div>
  );
}

function Results({ result, recommendations }) {
  return (
    <section className="results">
      <div className="section-title"><div><div className="kicker">GRAPH RESULT</div><h2>Your connection map</h2></div><span className="badge">{result.hops} hops</span></div>
      <div className="path-card">
        <div className="path-header"><span>Shortest useful path</span><span>{result.path.length} nodes</span></div>
        <div className="path">
          {result.path.map((node, i) => <div className="path-item" key={`${node.name}-${i}`}>
            <div className={`node ${node.type.toLowerCase()}`}>{node.type === "Skill" ? <GitBranch size={16}/> : node.type === "Role" ? <BriefcaseBusiness size={16}/> : <Database size={16}/>}</div>
            <div><strong>{node.name}</strong><small>{node.type}</small></div>
            {i < result.path.length - 1 && <ArrowRight className="arrow" size={20}/>}
          </div>)}
        </div>
        <div className="query-note"><Database size={15}/> Multi-hop Cypher traversal: the graph follows connected nodes rather than joining flat tables.</div>
      </div>

      <div className="grid-2">
        <div className="info-card">
          <div className="icon-box"><Target size={19}/></div><h3>Skills to build</h3>
          <p>Skills directly connected to the target role that aren't the starting point.</p>
          <div className="chips">{result.requiredSkills.map(s => <span className="chip" key={s}>{s}</span>)}</div>
        </div>
        <div className="info-card">
          <div className="icon-box"><Network size={19}/></div><h3>Why the graph helps</h3>
          <p>{result.explanation}</p>
          <div className="mini-stat"><b>{result.relatedRoles}</b><span>related roles share skills with this target</span></div>
        </div>
      </div>

      {recommendations.length > 0 && <div className="info-card recommendations">
        <div className="icon-box"><Sparkles size={19}/></div><h3>Explore next</h3>
        <p>Other roles connected to your starting skill.</p>
        <div className="rec-list">{recommendations.map(r => <div className="rec" key={r.name}><div><strong>{r.name}</strong><span>{r.sharedSkills} shared skill{r.sharedSkills === 1 ? "" : "s"}</span></div><ChevronRight size={18}/></div>)}</div>
      </div>}
    </section>
  );
}

function HowItWorks() {
  return <section className="how">
    <div className="section-title"><div><div className="kicker">WHY A GRAPH?</div><h2>Relationships are the data.</h2></div></div>
    <div className="how-grid">
      <div><span>01</span><h3>Skills connect to roles</h3><p>A skill isn't just a value in a row — it can connect to many roles, projects and other skills.</p></div>
      <div><span>02</span><h3>Traverse multiple hops</h3><p>Ask questions like “what roles can I reach through this skill?” without building a maze of SQL joins.</p></div>
      <div><span>03</span><h3>Discover unexpected links</h3><p>The same graph can surface adjacent career paths that share part of your skill set.</p></div>
    </div>
  </section>;
}

export default App;
