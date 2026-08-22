# SkillGraph — CognoDB Take-Home Assignment

A small graph-backed career exploration application built for the Wexa AI CognoDB assignment.

## 1. What the app does

SkillGraph lets a non-technical user choose:

- a target technology role
- an optional starting skill

It then uses a graph traversal to show how that skill connects to the target role and which other roles are nearby in the graph.

### Why a graph database?

The interesting data here is **relationships**:

`Skill -> BUILDS_ON -> Skill -> ... -> Role`

and:

`Role -> REQUIRES -> Skill <- REQUIRES <- Other Role`

A relational database can store these facts, but questions such as “which roles are reachable from this skill through several skill relationships?” or “which roles share skills with this target?” become increasingly join-heavy. A graph database represents the relationships directly and makes traversal the primary operation.

## 2. Data model

```text
(:Skill)-[:BUILDS_ON]->(:Skill)
    |
    | REQUIRES
    v
(:Role)

(:Role)-[:REQUIRES]->(:Skill)<-[:REQUIRES]-(:Role)
```

Nodes:

- `Skill { name }`
- `Role { name, description }`

Relationships:

- `BUILDS_ON`
- `REQUIRES`

## 3. Architecture

```text
React + Vite
     |
     | HTTP / JSON
     v
Express API
     |
     | official neo4j-driver
     v
CognoDB Cloud
(openCypher over Bolt)
```

The frontend never receives the database password. The server reads all connection details from environment variables.

## 4. Requirements covered

- Thoughtful labeled graph model: yes
- Typed relationships and properties: yes
- Diagram in README: yes
- Realistic seed data: `server/src/queries.js`
- Seed script: `npm run seed`
- Multi-hop traversal: `/api/path`
- Relationally awkward query: skill-to-role traversal + related-role discovery
- Parameterised Cypher: all user input is passed through `$parameters`
- Functional web UI: React/Vite
- Loading state: included
- Empty state: included in selector/results flow
- Error state: included
- Environment secrets: `.env`, ignored by git
- Graceful database failure: `/api/health` and API error responses
- Hosted demo: deploy the client and server using any free hosting tier

## 5. Setup

### Step A — Create CognoDB

Create a free CognoDB instance from the CognoDB Cloud console.

Save:

- Bolt URI
- username (`cognodb`)
- generated password

The password is shown once, so save it immediately.

### Step B — Configure server

```bash
cd server
cp ../.env.example .env
```

Fill in:

```env
COGNODB_URI=bolt+s://your-instance.databases.cognodb.cloud
COGNODB_USER=cognodb
COGNODB_PASSWORD=your-password
PORT=4000
```

Never commit `.env`.

### Step C — Install and seed

From the project root:

```bash
npm install
npm run install:all
npm run seed
```

Expected result:

```text
Seed complete: SkillGraph data loaded.
```

### Step D — Run

```bash
npm run dev
```

Frontend:

`http://localhost:5173`

Backend:

`http://localhost:4000`

## 6. Main Cypher queries

### Multi-hop traversal

```cypher
MATCH (r:Role {name: $role})
OPTIONAL MATCH p = (s:Skill {name: $skill})-[:REQUIRES|BUILDS_ON*1..4]->(r)
...
```

This asks the graph to follow up to four relationship hops from a starting skill toward the selected role.

### Related roles

```cypher
MATCH (r:Role {name: $role})-[:REQUIRES]->(shared:Skill)<-[:REQUIRES]-(related:Role)
WHERE related <> r
RETURN related.name, count(DISTINCT shared)
```

This discovers roles that overlap with the target role's skills.

### Parameterisation

User input is never inserted into Cypher strings. For example:

```js
tx.run(query, { role, skill })
```

This is safer and easier to reason about than string concatenation.

## 7. Project structure

```text
skillgraph-cognodb/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   └── package.json
├── server/
│   ├── src/
│   │   ├── db.js
│   │   ├── index.js
│   │   ├── queries.js
│   │   └── seed.js
│   └── package.json
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 8. Deployment

Deploy the Express server first.

Set these environment variables in the hosting provider:

```text
COGNODB_URI
COGNODB_USER
COGNODB_PASSWORD
PORT
```

Then deploy the React client. Set:

```text
VITE_API_URL=https://your-api-domain.example
```

Build command:

```bash
npm run build
```

The client can be deployed to a free static-hosting tier and the API to a free Node-compatible hosting tier.

After deployment:

1. Open the demo URL.
2. Choose a target role.
3. Optionally choose a starting skill.
4. Click **Explore**.
5. Verify the path and recommendations appear.
6. Capture screenshots for the README.
7. Record a short screen walkthrough.

## 9. Screen recording script

Keep the recording around 60–90 seconds:

1. Show the landing page.
2. Explain that roles and skills come from CognoDB.
3. Select `Full-Stack Engineer`.
4. Select `JavaScript` as the starting skill.
5. Click Explore.
6. Point out the multi-hop path.
7. Point out the related-role recommendations.
8. Briefly show the repository structure and README.
9. Finish on the working hosted URL.

## 10. Submission

Email the GitHub repository URL and hosted demo URL to:

`hr@wexa.ai`

Subject:

`CognoDB Assignment 2 – <Your Name>`

Keep the CognoDB instance running after submission so the evaluator can test the live application.

## 11. Important interview note

AI coding assistants are explicitly allowed by the assignment, but you must be able to explain and defend every part of the submission.

Be ready to explain:

- why `Skill` and `Role` are nodes
- why `REQUIRES` and `BUILDS_ON` are relationships
- why the path query is a graph problem
- how Bolt works with the Neo4j driver
- why parameters are used
- where secrets are stored
- what happens when CognoDB is unavailable
