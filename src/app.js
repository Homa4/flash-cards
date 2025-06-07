const Database = require("./database");
const WordService = require("./services/word-service");
const Menu = require("./ui/Menu");

async function main() {
  console.log("🚀 Flashcards app starting...".cyan);

  const database = new Database();
  const connected = await database.connect();

  if (!connected) {
    console.log("Error while connecting to the database".red);
    process.exit(1);
  }

  const wordService = new WordService(database);
  const menu = new Menu(wordService);

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
