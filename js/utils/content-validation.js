(function () {
    function isRecord(value) {
        return Boolean(value && typeof value === "object" && !Array.isArray(value));
    }

    function hasText(value) {
        return typeof value === "string" && value.trim().length > 0;
    }

    function createContext(category, lesson, categoryIndex, lessonIndex) {
        const categoryLabel = category && hasText(category.id) ? category.id : "category at index " + categoryIndex;
        const categoryTitle = category && hasText(category.title) ? ' ("' + category.title + '")' : "";
        if (lessonIndex === undefined) return 'category "' + categoryLabel + '"' + categoryTitle;
        const lessonLabel = lesson && hasText(lesson.id) ? lesson.id : "lesson at index " + lessonIndex;
        const lessonTitle = lesson && hasText(lesson.title) ? ' ("' + lesson.title + '")' : "";
        return 'category "' + categoryLabel + '"' + categoryTitle + ', lesson "' + lessonLabel + '"' + lessonTitle;
    }

    function validateGroupList(groups, context, property, errors) {
        if (!Array.isArray(groups) || groups.length === 0) {
            errors.push({ context: context, property: property, message: "must be a non-empty array of visual groups" });
            return;
        }

        groups.forEach(function (group, index) {
            const groupProperty = property + "[" + index + "]";
            if (!isRecord(group)) {
                errors.push({ context: context, property: groupProperty, message: "must be an object" });
                return;
            }
            if (!Array.isArray(group.items)) {
                errors.push({ context: context, property: groupProperty + ".items", message: "must be an array of strings" });
            } else {
                group.items.forEach(function (item, itemIndex) {
                    if (!hasText(item)) errors.push({ context: context, property: groupProperty + ".items[" + itemIndex + "]", message: "must be a non-empty string" });
                });
            }
            if (!hasText(group.caption)) errors.push({ context: context, property: groupProperty + ".caption", message: "must be a non-empty string" });
            if (group.symbolBefore !== undefined && !hasText(group.symbolBefore)) {
                errors.push({ context: context, property: groupProperty + ".symbolBefore", message: "must be a non-empty string when provided" });
            }
        });
    }

    function validateLearn(learn, context, errors) {
        if (!isRecord(learn)) {
            errors.push({ context: context, property: "learn", message: "must be an object" });
            return;
        }
        ["title", "introduction", "instructions"].forEach(function (property) {
            if (!hasText(learn[property])) errors.push({ context: context, property: "learn." + property, message: "must be a non-empty string" });
        });
        if (!Array.isArray(learn.objectives) || learn.objectives.length === 0) {
            errors.push({ context: context, property: "learn.objectives", message: "must be a non-empty array of strings" });
        } else {
            learn.objectives.forEach(function (objective, index) {
                if (!hasText(objective)) errors.push({ context: context, property: "learn.objectives[" + index + "]", message: "must be a non-empty string" });
            });
        }
        if (!Array.isArray(learn.examples) || learn.examples.length === 0) {
            errors.push({ context: context, property: "learn.examples", message: "must be a non-empty array" });
        } else {
            const exampleIds = new Set();
            learn.examples.forEach(function (example, index) {
                const property = "learn.examples[" + index + "]";
                if (!isRecord(example)) {
                    errors.push({ context: context, property: property, message: "must be an object" });
                    return;
                }
                if (!hasText(example.id)) errors.push({ context: context, property: property + ".id", message: "must be a non-empty string" });
                else if (exampleIds.has(example.id)) errors.push({ context: context, property: property + ".id", message: 'duplicates example id "' + example.id + '" in this lesson' });
                else exampleIds.add(example.id);
                if (!hasText(example.label)) errors.push({ context: context, property: property + ".label", message: "must be a non-empty string" });
                validateGroupList(example.groups, context, property + ".groups", errors);
            });
        }
        ["concept", "difficulty"].forEach(function (property) {
            if (learn[property] !== undefined && !hasText(learn[property])) {
                errors.push({ context: context, property: "learn." + property, message: "must be a non-empty string when provided" });
            }
        });
    }

    function validateFlashcardImage(image, context, property, errors) {
        if (!isRecord(image)) {
            errors.push({ context: context, property: property, message: "must be an image object" });
            return;
        }
        if (image.kind === "symbol") {
            if (!hasText(image.value)) errors.push({ context: context, property: property + ".value", message: "is required for symbol images" });
            if (!hasText(image.alt)) errors.push({ context: context, property: property + ".alt", message: "is required for symbol images" });
            if (image.repeat !== undefined && (!Number.isInteger(image.repeat) || image.repeat < 1)) {
                errors.push({ context: context, property: property + ".repeat", message: "must be a positive integer when provided" });
            }
        } else if (image.kind === "image") {
            if (!hasText(image.src)) {
                errors.push({ context: context, property: property + ".src", message: "is required for local image images" });
            } else if (/^[a-z][a-z0-9+.-]*:/i.test(image.src) || image.src.indexOf("//") === 0) {
                errors.push({ context: context, property: property + ".src", message: "must refer to a local image source" });
            }
            if (!hasText(image.alt)) errors.push({ context: context, property: property + ".alt", message: "is required for image images" });
        } else if (image.kind === "groups") {
            validateGroupList(image.groups, context, property + ".groups", errors);
        } else {
            errors.push({ context: context, property: property + ".kind", message: 'must be "symbol", "image", or "groups"' });
        }
    }

    function validateFlashcards(flashcards, context, errors) {
        if (!Array.isArray(flashcards) || flashcards.length === 0) {
            errors.push({ context: context, property: "flashcards", message: "must be a non-empty array when provided" });
            return;
        }
        const ids = new Set();
        flashcards.forEach(function (flashcard, index) {
            const property = "flashcards[" + index + "]";
            if (!isRecord(flashcard)) {
                errors.push({ context: context, property: property, message: "must be an object" });
                return;
            }
            if (!hasText(flashcard.id)) errors.push({ context: context, property: property + ".id", message: "must be a non-empty string" });
            else if (ids.has(flashcard.id)) errors.push({ context: context, property: property + ".id", message: 'duplicates flashcard id "' + flashcard.id + '" in this lesson' });
            else ids.add(flashcard.id);
            ["label", "description", "accessibleText"].forEach(function (field) {
                if (!hasText(flashcard[field])) errors.push({ context: context, property: property + "." + field, message: "must be a non-empty string" });
            });
            validateFlashcardImage(flashcard.image, context, property + ".image", errors);
            ["concept", "difficulty"].forEach(function (field) {
                if (flashcard[field] !== undefined && !hasText(flashcard[field])) {
                    errors.push({ context: context, property: property + "." + field, message: "must be a non-empty string when provided" });
                }
            });
        });
    }

    function getQuestionCategoryId(question) {
        // Existing question data calls this field "category"; accept the explicit alias too.
        if (question.categoryId !== undefined) return question.categoryId;
        return question.category;
    }

    function validateQuestions(questions, categoryLessons, errors) {
        if (!isRecord(questions)) {
            errors.push({ context: "learningData", property: "questions", message: "must be an object keyed by question id" });
            return;
        }

        const questionIds = new Set();
        Object.keys(questions).forEach(function (questionKey) {
            const context = 'question "' + questionKey + '"';
            const question = questions[questionKey];
            if (!isRecord(question)) {
                errors.push({ context: context, property: "question", message: "must be an object" });
                return;
            }

            if (!hasText(question.id)) {
                errors.push({ context: context, property: "id", message: "must be a non-empty string" });
            } else {
                if (questionIds.has(question.id)) {
                    errors.push({ context: context, property: "id", message: 'duplicates question id "' + question.id + '"' });
                } else {
                    questionIds.add(question.id);
                }
                if (question.id !== questionKey) {
                    errors.push({ context: context, property: "id", message: "must match its question map key" });
                }
            }

            const categoryId = getQuestionCategoryId(question);
            if (!hasText(categoryId)) {
                errors.push({ context: context, property: "categoryId", message: "must be a non-empty string" });
            } else {
                if (question.categoryId !== undefined && hasText(question.category) && question.category !== question.categoryId) {
                    errors.push({ context: context, property: "categoryId", message: "must match category when both fields are provided" });
                }
                const lessons = categoryLessons.get(categoryId);
                if (!lessons) {
                    errors.push({ context: context, property: "categoryId", message: 'references missing category "' + categoryId + '"' });
                }
            }

            if (!hasText(question.lessonId)) {
                errors.push({ context: context, property: "lessonId", message: "must be a non-empty string" });
            } else if (hasText(categoryId)) {
                const lessons = categoryLessons.get(categoryId);
                if (lessons && !lessons.has(question.lessonId)) {
                    errors.push({ context: context, property: "lessonId", message: 'references missing lesson "' + question.lessonId + '" in category "' + categoryId + '"' });
                }
            }

            if (!hasText(question.prompt)) {
                errors.push({ context: context, property: "prompt", message: "must be a non-empty string" });
            }

            if (!Array.isArray(question.choices)) {
                errors.push({ context: context, property: "choices", message: "must be an array with at least two choices" });
            } else {
                if (question.choices.length < 2) {
                    errors.push({ context: context, property: "choices", message: "must contain at least two choices" });
                }
                const choiceIds = new Set();
                question.choices.forEach(function (choice, choiceIndex) {
                    const property = "choices[" + choiceIndex + "]";
                    if (!isRecord(choice)) {
                        errors.push({ context: context, property: property, message: "must be an object" });
                        return;
                    }
                    if (!hasText(choice.id)) {
                        errors.push({ context: context, property: property + ".id", message: "must be a non-empty string" });
                    } else if (choiceIds.has(choice.id)) {
                        errors.push({ context: context, property: property + ".id", message: 'duplicates choice id "' + choice.id + '" within this question' });
                    } else {
                        choiceIds.add(choice.id);
                    }
                    if (!hasText(choice.label)) {
                        errors.push({ context: context, property: property + ".label", message: "must be a non-empty string" });
                    }
                });

                if (!hasText(question.correctChoiceId)) {
                    errors.push({ context: context, property: "correctChoiceId", message: "must be a non-empty string" });
                } else if (!choiceIds.has(question.correctChoiceId)) {
                    errors.push({ context: context, property: "correctChoiceId", message: 'must reference an existing choice id "' + question.correctChoiceId + '"' });
                }
            }

            if (!isRecord(question.feedback)) {
                errors.push({ context: context, property: "feedback", message: "must be an object" });
            }
            if (!question.feedback || !hasText(question.feedback.correct)) {
                errors.push({ context: context, property: "feedback.correct", message: "must be a non-empty string" });
            }
            if (!question.feedback || !hasText(question.feedback.incorrect)) {
                errors.push({ context: context, property: "feedback.incorrect", message: "must be a non-empty string" });
            }
        });
    }

    function validate(categories, questions) {
        const errors = [];
        const categoryLessons = new Map();
        if (!Array.isArray(categories)) {
            errors.push({ context: "learningData", property: "categories", message: "must be an array" });
        } else {
            const categoryIds = new Set();
            categories.forEach(function (category, categoryIndex) {
                const categoryContext = createContext(category, null, categoryIndex);
                if (!isRecord(category)) {
                    errors.push({ context: "category at index " + categoryIndex, property: "category", message: "must be an object" });
                    return;
                }
                if (!hasText(category.id)) errors.push({ context: categoryContext, property: "id", message: "must be a non-empty string" });
                else if (categoryIds.has(category.id)) errors.push({ context: categoryContext, property: "id", message: "duplicates a category id" });
                else {
                    categoryIds.add(category.id);
                    categoryLessons.set(category.id, new Set());
                }

                if (!Array.isArray(category.lessons)) {
                    errors.push({ context: categoryContext, property: "lessons", message: "must be an array" });
                    return;
                }
                const lessonIds = new Set();
                category.lessons.forEach(function (lesson, lessonIndex) {
                    const context = createContext(category, lesson, categoryIndex, lessonIndex);
                    if (!isRecord(lesson)) {
                        errors.push({ context: context, property: "lesson", message: "must be an object" });
                        return;
                    }
                    if (!hasText(lesson.id)) errors.push({ context: context, property: "id", message: "must be a non-empty string" });
                    else if (lessonIds.has(lesson.id)) errors.push({ context: context, property: "id", message: "duplicates a lesson id within this category" });
                    else {
                        lessonIds.add(lesson.id);
                        if (categoryLessons.has(category.id)) categoryLessons.get(category.id).add(lesson.id);
                    }
                    if (!hasText(lesson.title)) errors.push({ context: context, property: "title", message: "is required and must be a non-empty string" });

                    if (lesson.learn !== undefined) validateLearn(lesson.learn, context, errors);
                    if (lesson.flashcards !== undefined) validateFlashcards(lesson.flashcards, context, errors);

                    if (!Array.isArray(lesson.questionIds)) {
                        errors.push({ context: context, property: "questionIds", message: "must be an array of existing question ids" });
                        return;
                    }
                    const questionIds = new Set();
                    lesson.questionIds.forEach(function (questionId, questionIndex) {
                        const property = "questionIds[" + questionIndex + "]";
                        if (!hasText(questionId)) {
                            errors.push({ context: context, property: property, message: "must be a non-empty question id" });
                            return;
                        }
                        if (questionIds.has(questionId)) errors.push({ context: context, property: property, message: 'duplicates question id "' + questionId + '" in this lesson' });
                        else questionIds.add(questionId);
                        if (!isRecord(questions) || !Object.prototype.hasOwnProperty.call(questions, questionId)) {
                            errors.push({ context: context, property: property, message: 'references missing question "' + questionId + '"' });
                            return;
                        }
                        const question = questions[questionId];
                        if (!isRecord(question)) {
                            errors.push({ context: context, property: property, message: 'question "' + questionId + '" must be an object' });
                            return;
                        }
                        if (question.id !== questionId) errors.push({ context: context, property: property, message: 'question "' + questionId + '" has a mismatched id' });
                        const questionCategoryId = getQuestionCategoryId(question);
                        if (questionCategoryId !== category.id) errors.push({ context: context, property: property, message: 'question "' + questionId + '" belongs to category "' + questionCategoryId + '" instead of "' + category.id + '"' });
                        if (question.lessonId !== lesson.id) errors.push({ context: context, property: property, message: 'question "' + questionId + '" belongs to lesson "' + question.lessonId + '" instead of "' + lesson.id + '"' });
                    });
                });
            });
        }

        validateQuestions(questions, categoryLessons, errors);

        errors.forEach(function (error) {
            console.error("[Learning content] " + error.context + "." + error.property + ": " + error.message);
        });
        return { valid: errors.length === 0, errors: errors };
    }

    window.LittleLearnersContentValidation = { validate: validate };
})();
