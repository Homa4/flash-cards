require("colors");
const readlineSync = require("readline-sync");

class Menu {
  constructor(wordService) {
    this.wordService = wordService;
  }

  showMainMenu() {
    console.clear();
    console.log("ФЛЕШКАРТКИ ДЛЯ ВИВЧЕННЯ СЛІВ".rainbow.bold);
    console.log("═".repeat(40).gray);
    console.log("1. 📖 Додати нове слово".cyan);
    console.log("2. 🔄 Повторити слова".yellow);
    console.log("3. 📋 Переглянути всі слова".blue);
    console.log("4. 🔍 Пошук слова".magenta);
    console.log("5. 📊 Статистика".green);
    console.log("6. 🗑️  Видалити слово".red);
    console.log("0. 🚪 Вихід".gray);
    console.log("═".repeat(40).gray);
  }

  async start() {
    while (true) {
      this.showMainMenu();
      const choice = readlineSync.question("Виберіть опцію: ".white.bold);

      try {
        switch (choice) {
          case "1":
            await this.addWord();
            break;
          case "2":
            await this.reviewWords();
            break;
          case "3":
            await this.showAllWords();
            break;
          case "4":
            await this.searchWord();
            break;
          case "5":
            await this.showStats();
            break;
          case "6":
            await this.deleteWord();
            break;
          case "0":
            console.log("👋 До побачення!".yellow);
            return;
          default:
            console.log("❌ Невірний вибір!".red);
            this.pause();
        }
      } catch (error) {
        console.error("❌ Помилка:".red, error.message);
        this.pause();
      }
    }
  }

  async addWord() {
    console.clear();
    console.log("📖 ДОДАВАННЯ НОВОГО СЛОВА".cyan.bold);
    console.log("═".repeat(30).gray);

    const word = readlineSync.question("Слово (англійською): ".white).trim();
    if (!word) {
      console.log("❌ Слово не може бути пустим!".red);
      this.pause();
      return;
    }

    const translation = readlineSync
      .question("Переклад (українською): ".white)
      .trim();
    if (!translation) {
      console.log("❌ Переклад не може бути пустим!".red);
      this.pause();
      return;
    }

    const definition = readlineSync
      .question("Визначення (опціонально): ".gray)
      .trim();
    const example = readlineSync
      .question("Приклад використання (опціонально): ".gray)
      .trim();

    const result = await this.wordService.addWord({
      word: word.toLowerCase(),
      translation,
      definition,
      example,
    });

    if (result.success) {
      console.log("✅ Слово успішно додано!".green);
    } else {
      console.log(`❌ ${result.error}`.red);
    }

    this.pause();
  }

  async reviewWords() {
    console.clear();
    console.log("🔄 ПОВТОРЕННЯ СЛІВ".yellow.bold);
    console.log("═".repeat(20).gray);

    const words = await this.wordService.getWordsForReview(10);

    if (words.length === 0) {
      console.log("🎉 Немає слів для повторення! Всі слова вивчені.".green);
      this.pause();
      return;
    }

    console.log(`Знайдено ${words.length} слів для повторення\n`.blue);

    let correct = 0;
    let total = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      console.clear();
      console.log(`🔄 ПОВТОРЕННЯ (${i + 1}/${words.length})`.yellow.bold);
      console.log("═".repeat(30).gray);

      console.log(`\n📝 Слово: ${word.word.toUpperCase().bold}`);
      if (word.definition) {
        console.log(`💡 Визначення: ${word.definition.italic}`);
      }
      if (word.example) {
        console.log(`📄 Приклад: ${word.example.gray}`);
      }

      console.log(
        `\n📊 Статистика: ${word.getSuccessRate()}% (${word.correctAnswers}/${
          word.totalAttempts
        })`
      );
      console.log("─".repeat(30).gray);

      const userAnswer = readlineSync
        .question("\n🤔 Ваш переклад: ".white)
        .trim();

      const isCorrect =
        userAnswer.toLowerCase() === word.translation.toLowerCase();
      total++;

      if (isCorrect) {
        correct++;
        console.log("✅ Правильно!".green.bold);
      } else {
        console.log(
          `❌ Неправильно. Правильна відповідь: ${word.translation.bold}`.red
        );
      }

      await this.wordService.updateWordStats(word, isCorrect);

      if (i < words.length - 1) {
        readlineSync.question("\nНатисніть Enter для продовження...".gray);
      }
    }

    console.log(
      `\n🎯 Результат: ${correct}/${total} (${Math.round(
        (correct / total) * 100
      )}%)`.bold
    );
    this.pause();
  }

  async showAllWords() {
    console.clear();
    console.log("📋 УСІ СЛОВА".blue.bold);
    console.log("═".repeat(15).gray);

    const words = await this.wordService.getAllWords();

    if (words.length === 0) {
      console.log("📝 База даних порожня. Додайте перше слово!".yellow);
      this.pause();
      return;
    }

    console.log(`\nЗагалом слів: ${words.length}\n`.blue);

    words.forEach((word, index) => {
      const successRate = word.getSuccessRate();
      const rateColor =
        successRate >= 80 ? "green" : successRate >= 50 ? "yellow" : "red";

      console.log(
        `${(index + 1).toString().padStart(3)}. ${word.word.bold} → ${
          word.translation
        }`
      );
      console.log(
        `     📊 ${successRate}% (${word.correctAnswers}/${word.totalAttempts}) | 🎯 Складність: ${word.difficulty}/5`[
          rateColor
        ]
      );
      if (word.definition) {
        console.log(`     💡 ${word.definition}`.gray);
      }
      console.log();
    });

    this.pause();
  }

  async searchWord() {
    console.clear();
    console.log("🔍 ПОШУК СЛОВА".magenta.bold);
    console.log("═".repeat(18).gray);

    const query = readlineSync
      .question("Введіть слово або переклад для пошуку: ".white)
      .trim();

    if (!query) {
      console.log("❌ Запит не може бути пустим!".red);
      this.pause();
      return;
    }

    const words = await this.wordService.searchWords(query);

    if (words.length === 0) {
      console.log("❌ Нічого не знайдено!".red);
      this.pause();
      return;
    }

    console.log(`\n✅ Знайдено ${words.length} результат(ів):\n`.green);

    words.forEach((word, index) => {
      console.log(`${index + 1}. ${word.word.bold} → ${word.translation}`);
      console.log(`   📊 ${word.getSuccessRate()}% | 🎯 ${word.difficulty}/5`);
      if (word.definition) {
        console.log(`   💡 ${word.definition}`.gray);
      }
      if (word.example) {
        console.log(`   📄 ${word.example}`.italic);
      }
      console.log();
    });

    this.pause();
  }

  async showStats() {
    console.clear();
    console.log("📊 СТАТИСТИКА".green.bold);
    console.log("═".repeat(15).gray);

    const stats = await this.wordService.getStats();

    console.log(
      `\n📚 Загальна кількість слів: ${stats.totalWords.toString().bold}`
    );
    console.log(
      `🎯 Загальна кількість спроб: ${stats.totalAttempts.toString().bold}`
    );
    console.log(
      `✅ Правильних відповідей: ${stats.totalCorrect.toString().bold}`
    );
    console.log(
      `📈 Загальний відсоток успіху: ${stats.successRate.toString().bold}%`
    );
    console.log(`Середня складність: ${stats.avgDifficulty.toString().bold}/5`);

    console.log("\n" + "─".repeat(30).gray);

    if (stats.successRate >= 80) {
      console.log("🏆 Відмінно! Ви чудово справляєтесь!".green);
    } else if (stats.successRate >= 60) {
      console.log("👍 Добре! Продовжуйте вчитися!".yellow);
    } else {
      console.log("💪 Не здавайтесь! Практика - шлях до успіху!".red);
    }

    this.pause();
  }

  async deleteWord() {
    console.clear();
    console.log("🗑️  ВИДАЛЕННЯ СЛОВА".red.bold);
    console.log("═".repeat(20).gray);

    const word = readlineSync
      .question("Введіть слово для видалення: ".white)
      .trim()
      .toLowerCase();

    if (!word) {
      console.log("❌ Слово не може бути пустим!".red);
      this.pause();
      return;
    }

    const confirm = readlineSync.keyInYNStrict(
      `Ви впевнені, що хочете видалити слово "${word}"?`.yellow
    );

    if (!confirm) {
      console.log("❌ Видалення скасовано.".gray);
      this.pause();
      return;
    }

    const deleted = await this.wordService.deleteWord(word);

    if (deleted) {
      console.log("✅ Слово успішно видалено!".green);
    } else {
      console.log("❌ Слово не знайдено!".red);
    }

    this.pause();
  }

  pause() {
    readlineSync.question("\nНатисніть Enter для продовження...".gray);
  }
}

module.exports = Menu;
