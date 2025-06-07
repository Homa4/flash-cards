const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient } = require("mongodb");
const Database = require("../database");
const WordService = require("../services/word-service");
const Word = require("../models/word");

describe("Word model", () => {
  test("getSuccessRate returns 0 when no attempts", () => {
    const word = new Word({ word: "hello", translation: "привіт" });
    expect(word.getSuccessRate()).toBe(0);
  });

  test("getSuccessRate computes correct percentage", () => {
    const word = new Word({
      word: "test",
      translation: "тест",
      correctAnswers: 3,
      totalAttempts: 4,
    });
    expect(word.getSuccessRate()).toBe(75);
  });

  test("getReviewInterval returns correct intervals based on success rate", () => {
    const cases = [
      { correct: 9, attempts: 10, expected: 7 },
      { correct: 7, attempts: 10, expected: 3 },
      { correct: 5, attempts: 10, expected: 1 },
      { correct: 0, attempts: 1, expected: 0.5 },
    ];

    cases.forEach(({ correct, attempts, expected }) => {
      const w = new Word({
        word: "w",
        translation: "w",
        correctAnswers: correct,
        totalAttempts: attempts,
        lastReviewed: new Date(),
      });
      expect(w.getReviewInterval()).toBe(expected);
    });
  });

  test("shouldReview returns true when never reviewed", () => {
    const word = new Word({ word: "new", translation: "нове" });
    expect(word.shouldReview()).toBe(true);
  });

  test("shouldReview returns true when past interval", () => {
    const pastDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const word = new Word({
      word: "old",
      translation: "старе",
      correctAnswers: 9,
      totalAttempts: 10,
      lastReviewed: pastDate,
    });
    expect(word.shouldReview()).toBe(true);
  });

  test("shouldReview returns false when within interval", () => {
    const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const word = new Word({
      word: "mid",
      translation: "серед",
      correctAnswers: 7,
      totalAttempts: 10,
      lastReviewed: recentDate,
    });
    expect(word.shouldReview()).toBe(false);
  });
});

// jest.setTimeout(60000);

describe("WordService", () => {
  let mongod;
  let uri;
  let dbClient;
  let database;
  let wordService;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    dbClient = new MongoClient(uri);
    await dbClient.connect();
    database = new Database();
    database.client = dbClient;
    database.db = dbClient.db("test");
    wordService = new WordService(database);
  });

  afterAll(async () => {
    if (dbClient) await dbClient.close();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    await database.db.collection("words").deleteMany({});
  });

  test("addWord and getAllWords", async () => {
    const addResult = await wordService.addWord({
      word: "apple",
      translation: "яблуко",
    });
    expect(addResult.success).toBe(true);
    const all = await wordService.getAllWords();
    expect(all.length).toBe(1);
    expect(all[0].word).toBe("apple");
  });

  test("searchWords finds by word and translation", async () => {
    await wordService.addWord({ word: "banana", translation: "банан" });
    await wordService.addWord({ word: "grape", translation: "виноград" });
    let results = await wordService.searchWords("ban");
    expect(results.map((w) => w.word)).toContain("banana");
    results = await wordService.searchWords("град");
    expect(results.map((w) => w.translation)).toContain("виноград");
  });

  test("deleteWord removes a word", async () => {
    await wordService.addWord({ word: "kiwi", translation: "ківі" });
    const deleted = await wordService.deleteWord("kiwi");
    expect(deleted).toBe(true);
    const all = await wordService.getAllWords();
    expect(all).toHaveLength(0);
  });

  test("getStats returns correct statistics", async () => {
    await wordService.addWord({ word: "pear", translation: "груша" });
    const words = await wordService.getWordsForReview(1);

    const wordObj = words[0];
    const updated = await wordService.updateWordStats(wordObj, true);
    expect(updated).toBe(true);
    const stats = await wordService.getStats();
    expect(stats.totalWords).toBe(1);
    expect(stats.totalAttempts).toBe(1);
    expect(stats.totalCorrect).toBe(1);
    expect(stats.successRate).toBe(100);
    expect(stats.avgDifficulty).toBeGreaterThanOrEqual(1);
  });
});
