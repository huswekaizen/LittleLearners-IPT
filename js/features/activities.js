(function () {
    let state = null;
    let attemptSequence = 0;

    function createAttemptId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        attemptSequence += 1;
        return "attempt-" + Date.now().toString(36) + "-" + attemptSequence.toString(36) + "-" + Math.random().toString(36).slice(2);
    }

    function start(category, lesson, allQuestions) {
        const questions = lesson.questionIds.map(function (id) {
            return allQuestions[id];
        }).filter(function (question) {
            return question && question.category === category.id && question.lessonId === lesson.id;
        });
        if (!questions.length) {
            state = { attemptId: createAttemptId(), category: category, lesson: lesson, questions: [], index: 0, selectedChoiceId: null, submitted: [], complete: true };
        } else {
            state = { attemptId: createAttemptId(), category: category, lesson: lesson, questions: questions, index: 0, selectedChoiceId: null, submitted: [], complete: false };
        }
        return state;
    }

    function current() {
        return state;
    }

    function select(choiceId) {
        if (!state || state.complete || state.submitted[state.index]) return false;
        const choiceExists = state.questions[state.index].choices.some(function (choice) { return choice.id === choiceId; });
        if (!choiceExists) return false;
        state.selectedChoiceId = choiceId;
        return true;
    }

    function submit() {
        if (!state || state.complete || state.submitted[state.index] || !state.selectedChoiceId) return null;
        const question = state.questions[state.index];
        const result = window.LittleLearnersValidation.validate(question, state.selectedChoiceId);
        if (!result.valid) return null;
        const answer = { questionId: question.id, choiceId: state.selectedChoiceId, correct: result.correct };
        state.submitted[state.index] = answer;
        return answer;
    }

    function next() {
        if (!state || !state.submitted[state.index] || state.complete) return false;
        if (state.index >= state.questions.length - 1) {
            state.complete = true;
            return "complete";
        }
        state.index += 1;
        state.selectedChoiceId = null;
        return true;
    }

    function retry() {
        if (!state) return null;
        return start(state.category, state.lesson, window.LittleLearnersData.questions);
    }

    window.LittleLearnersActivity = { start: start, current: current, select: select, submit: submit, next: next, retry: retry };
})();
