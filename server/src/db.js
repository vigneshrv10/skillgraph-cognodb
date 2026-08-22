import neo4j from "neo4j-driver";

let driver;

export function getDriver() {
  if (!driver) {
    const uri = process.env.COGNODB_URI;
    const user = process.env.COGNODB_USER || "cognodb";
    const password = process.env.COGNODB_PASSWORD;
    if (!uri || !password) throw new Error("Missing COGNODB_URI or COGNODB_PASSWORD in environment.");
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
}

export async function closeDriver() {
  if (driver) await driver.close();
}
