window.LittleLearnersScoring = {
    summarize: function (questions, submittedAnswers) {
        const totalQuestions = Array.isArray(questions) ? questions.length : 0;
        const answers = Array.isArray(submittedAnswers) ? submittedAnswers : [];
        const answered = new Map();
        answers.forEach(function (answer) {
            if (answer && answer.questionId && !answered.has(answer.questionId)) {
                answered.set(answer.questionId, answer.correct === true);
            }
        });
        let correctAnswers = 0;
        let incorrectAnswers = 0;
        (questions || []).forEach(function (question) {
            if (!answered.has(question.id)) return;
            if (answered.get(question.id)) correctAnswers += 1;
            else incorrectAnswers += 1;
        });
        return {
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers,
            incorrectAnswers: incorrectAnswers,
            score: correctAnswers,
            percentage: totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0
        };
    }
};
