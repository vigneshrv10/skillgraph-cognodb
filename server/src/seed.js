import "dotenv/config";
import { getDriver, closeDriver } from "./db.js";
import { seed } from "./queries.js";

async function runSeed() {
  const driver = getDriver();
  const session = driver.session();

  try {
    // CognoDB accepts one Cypher statement per request.
    // Split the seed file into individual statements.
    const statements = seed
      .split(";")
      .map(statement => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await session.executeWrite(tx => tx.run(statement));
    }

    console.log("Seed complete: SkillGraph data loaded.");
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await session.close();
    await closeDriver();
  }
}

runSeed();