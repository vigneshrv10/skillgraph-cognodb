// All application queries use Neo4j/CognoDB parameters.
// No user input is concatenated into Cypher.

export const listRoles = `
  MATCH (r:Role)
  RETURN r.name AS name, r.description AS description
  ORDER BY r.name
`;

export const listSkills = `
  MATCH (s:Skill)
  RETURN s.name AS name
  ORDER BY s.name
`;

export const pathToRole = `
  MATCH (r:Role {name: $role})
  OPTIONAL MATCH p = (s:Skill {name: $skill})-[:REQUIRES|BUILDS_ON*1..4]->(r)
  WITH r, p
  ORDER BY CASE WHEN p IS NULL THEN 999 ELSE length(p) END
  LIMIT 1
  OPTIONAL MATCH (r)-[:REQUIRES]->(required:Skill)
  WITH r, p, collect(required.name) AS requiredSkills
  OPTIONAL MATCH (related:Role)-[:REQUIRES]->(shared:Skill)<-[:REQUIRES]-(r)
  WHERE related <> r
  RETURN
    r.name AS role,
    CASE WHEN p IS NULL THEN [] ELSE [n IN nodes(p) | {name: n.name, type: labels(n)[0]}] END AS path,
    CASE WHEN p IS NULL THEN 0 ELSE length(p) END AS hops,
    requiredSkills,
    count(DISTINCT related) AS relatedRoles
`;

export const roleSkillSummary = `
  MATCH (r:Role {name: $role})-[:REQUIRES]->(s:Skill)
  RETURN r.name AS role, collect(s.name) AS skills
`;

export const recommendations = `
  MATCH (source:Skill {name: $skill})<-[:REQUIRES]-(r:Role)
  MATCH (r)-[:REQUIRES]->(shared:Skill)<-[:REQUIRES]-(other:Role)
  WHERE other <> r
  RETURN other.name AS name, count(DISTINCT shared) AS sharedSkills
  ORDER BY sharedSkills DESC, name
  LIMIT 5
`;

export const seed = `
  MATCH (n) DETACH DELETE n;

  CREATE
    (js:Skill {name:'JavaScript'}),
    (ts:Skill {name:'TypeScript'}),
    (react:Skill {name:'React'}),
    (node:Skill {name:'Node.js'}),
    (sql:Skill {name:'SQL'}),
    (aws:Skill {name:'AWS'}),
    (docker:Skill {name:'Docker'}),
    (java:Skill {name:'Java'}),
    (python:Skill {name:'Python'}),
    (spring:Skill {name:'Spring Boot'}),
    (git:Skill {name:'Git'}),
    (rest:Skill {name:'REST APIs'}),
    (system:Skill {name:'System Design'}),
    (data:Skill {name:'Data Modeling'}),
    (cyber:Skill {name:'Cybersecurity Basics'}),

    (fe:Role {name:'Frontend Engineer', description:'Build accessible, responsive web interfaces and client-side applications.'}),
    (be:Role {name:'Backend Engineer', description:'Build APIs, services, data flows and reliable server-side systems.'}),
    (full:Role {name:'Full-Stack Engineer', description:'Own features across the frontend, backend and persistence layers.'}),
    (cloud:Role {name:'Cloud Engineer', description:'Design and operate scalable infrastructure and cloud services.'}),
    (javaRole:Role {name:'Java Developer', description:'Build enterprise applications and backend services with Java.'}),
    (dataRole:Role {name:'Data Engineer', description:'Build data pipelines, models and systems for analytics.'}),
    (devops:Role {name:'DevOps Engineer', description:'Automate delivery and operate cloud-native software platforms.'}),
    (sec:Role {name:'Security Engineer', description:'Protect applications and infrastructure through secure engineering.'}),

    (js)-[:BUILDS_ON]->(ts),
    (js)-[:BUILDS_ON]->(react),
    (node)-[:BUILDS_ON]->(rest),
    (java)-[:BUILDS_ON]->(spring),

    (fe)-[:REQUIRES]->(js),
    (fe)-[:REQUIRES]->(ts),
    (fe)-[:REQUIRES]->(react),
    (fe)-[:REQUIRES]->(git),

    (be)-[:REQUIRES]->(node),
    (be)-[:REQUIRES]->(rest),
    (be)-[:REQUIRES]->(sql),
    (be)-[:REQUIRES]->(git),

    (full)-[:REQUIRES]->(react),
    (full)-[:REQUIRES]->(node),
    (full)-[:REQUIRES]->(sql),
    (full)-[:REQUIRES]->(rest),
    (full)-[:REQUIRES]->(git),

    (cloud)-[:REQUIRES]->(aws),
    (cloud)-[:REQUIRES]->(docker),
    (cloud)-[:REQUIRES]->(git),
    (cloud)-[:REQUIRES]->(system),

    (javaRole)-[:REQUIRES]->(java),
    (javaRole)-[:REQUIRES]->(spring),
    (javaRole)-[:REQUIRES]->(sql),
    (javaRole)-[:REQUIRES]->(rest),

    (dataRole)-[:REQUIRES]->(python),
    (dataRole)-[:REQUIRES]->(sql),
    (dataRole)-[:REQUIRES]->(data),
    (dataRole)-[:REQUIRES]->(aws),

    (devops)-[:REQUIRES]->(docker),
    (devops)-[:REQUIRES]->(aws),
    (devops)-[:REQUIRES]->(git),
    (devops)-[:REQUIRES]->(system),

    (sec)-[:REQUIRES]->(python),
    (sec)-[:REQUIRES]->(aws),
    (sec)-[:REQUIRES]->(cyber),
    (sec)-[:REQUIRES]->(system);
`;
