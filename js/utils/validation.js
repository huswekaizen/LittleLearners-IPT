window.LittleLearnersValidation = {
    validate: function (question, selectedChoiceId) {
        if (!question || !selectedChoiceId || !Array.isArray(question.choices)) {
            return { valid: false, correct: false };
        }
        const choiceExists = question.choices.some(function (choice) {
            return choice.id === selectedChoiceId;
        });
        if (!choiceExists) {
            return { valid: false, correct: false };
        }
        return {
            valid: true,
            correct: selectedChoiceId === question.correctChoiceId
        };
    }
};
