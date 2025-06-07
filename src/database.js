const { MongoClient } = require("mongodb");

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.uri = process.env.MONGODB_URI;
    this.dbName = "flashcards_db";
  }

  async connect() {
    try {
      this.client = new MongoClient(this.uri);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      console.log("Successfully connected to db");

      await this.createIndexes();
      return true;
    } catch (error) {
      console.error("Error connecting to db:", error.message);
      return false;
    }
  }

  async createIndexes() {
    try {
      const wordsCollection = this.db.collection("words");
      await wordsCollection.createIndex({ word: 1 }, { unique: true });
      await wordsCollection.createIndex({ difficulty: 1 });
      await wordsCollection.createIndex({ lastReviewed: 1 });
    } catch (error) {
      console.log("👹 hehehe, something went wrong, \n", error);
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log("Disconnected from db");
    }
  }

  getCollection(name) {
    return this.db.collection(name);
  }
}

module.exports = Database;
