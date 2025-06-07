class Word {
  constructor(data) {
    this.word = data.word;
    this.translation = data.translation;
    this.definition = data.definition || "";
    this.example = data.example || "";
    this.difficulty = data.difficulty || 1;
    this.correctAnswers = data.correctAnswers || 0;
    this.totalAttempts = data.totalAttempts || 0;
    this.lastReviewed = data.lastReviewed || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toObject() {
    return {
      word: this.word,
      translation: this.translation,
      definition: this.definition,
      example: this.example,
      difficulty: this.difficulty,
      correctAnswers: this.correctAnswers,
      totalAttempts: this.totalAttempts,
      lastReviewed: this.lastReviewed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  getSuccessRate() {
    if (this.totalAttempts === 0) return 0;
    return Math.round((this.correctAnswers / this.totalAttempts) * 100);
  }

  shouldReview() {
    if (!this.lastReviewed) return true;

    const daysSinceReview =
      (Date.now() - this.lastReviewed.getTime()) / (1000 * 60 * 60 * 24);
    const reviewInterval = this.getReviewInterval();

    return daysSinceReview >= reviewInterval;
  }

  getReviewInterval() {
    const successRate = this.getSuccessRate();

    if (successRate >= 90) return 7;
    if (successRate >= 70) return 3;
    if (successRate >= 50) return 1;
    return 0.5;
  }
}

module.exports = Word;
