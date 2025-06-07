const Database = require("./database");
const colors = require("colors");

async function main() {
  console.log("🚀 Flashcards app starting...".cyan);

  const database = new Database();
  const connected = await database.connect();

  if (!connected) {
    console.log("Error while connecting to the database".red);
    process.exit(1);
  }

  process.on("SIGINT", async () => {
    console.log("\n👋 Shutting down...".yellow);
    await database.disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n👋 Shutting down...".yellow);
    await database.disconnect();
    process.exit(0);
  });

  try {
    await menu.start();
  } catch (error) {
    console.error("❌ Critical error:".red, error.message);
  } finally {
    await database.disconnect();
  }
}

main().catch(console.error);
