const Word = require("../models/Word");

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
