const Word = require("../models/word");

class WordService {
  constructor(database) {
    this.db = database;
    this.collection = database.getCollection("words");
  }

  async addWord(wordData) {
    try {
      const word = new Word(wordData);
      const result = await this.collection.insertOne(word.toObject());
      return { success: true, id: result.insertedId };
    } catch (error) {
      if (error.code === 11000) {
        return {
          success: false,
          error: "The word already exists in the database",
        };
      }
      return { success: false, error: error.message };
    }
  }

  async getAllWords(limit = 50) {
    try {
      const words = await this.collection
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      return words.map((w) => new Word(w));
    } catch (error) {
      throw new Error(`Error retrieving words: ${error.message}`);
    }
  }

  async searchWords(query) {
    try {
      const words = await this.collection
        .find({
          $or: [
            { word: { $regex: query, $options: "i" } },
            { translation: { $regex: query, $options: "i" } },
          ],
        })
        .toArray();
      return words.map((w) => new Word(w));
    } catch (error) {
      throw new Error(`Search error: ${error.message}`);
    }
  }

  async getWordsForReview(limit = 10) {
    try {
      const words = await this.collection
        .find({})
        .sort({ lastReviewed: 1 })
        .limit(limit * 2)
        .toArray();

      const wordsForReview = words
        .map((w) => new Word(w))
        .filter((w) => w.shouldReview())
        .slice(0, limit);

      return wordsForReview;
    } catch (error) {
      throw new Error(
        `Error retrieving words for repetition: ${error.message}`
      );
    }
  }

  async updateWordStats(word, isCorrect) {
    try {
      const updateData = {
        totalAttempts: word.totalAttempts + 1,
        correctAnswers: word.correctAnswers + (isCorrect ? 1 : 0),
        lastReviewed: new Date(),
        updatedAt: new Date(),
      };

      if (isCorrect && word.getSuccessRate() > 80) {
        updateData.difficulty = Math.max(1, word.difficulty - 1);
      } else if (!isCorrect) {
        updateData.difficulty = Math.min(5, word.difficulty + 1);
      }

      await this.collection.updateOne(
        { word: word.word },
        { $set: updateData }
      );

      return true;
    } catch (error) {
      throw new Error(`Statistics update error: ${error.message}`);
    }
  }

  async deleteWord(word) {
    try {
      const result = await this.collection.deleteOne({ word: word });
      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(`Word deletion error: ${error.message}`);
    }
  }

  async getStats() {
    try {
      const totalWords = await this.collection.countDocuments();
      const pipeline = [
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: "$totalAttempts" },
            totalCorrect: { $sum: "$correctAnswers" },
            avgDifficulty: { $avg: "$difficulty" },
          },
        },
      ];

      const stats = await this.collection.aggregate(pipeline).toArray();
      const result = stats[0] || {
        totalAttempts: 0,
        totalCorrect: 0,
        avgDifficulty: 0,
      };

      return {
        totalWords,
        totalAttempts: result.totalAttempts,
        totalCorrect: result.totalCorrect,
        successRate:
          result.totalAttempts > 0
            ? Math.round((result.totalCorrect / result.totalAttempts) * 100)
            : 0,
        avgDifficulty: Math.round(result.avgDifficulty * 100) / 100,
      };
    } catch (error) {
      throw new Error(`Error retrieving statistics: ${error.message}`);
    }
  }
}

module.exports = WordService;
