(function () {
    const STORAGE_KEY = "littleLearners.progress";
    const SCHEMA_VERSION = 1;

    function emptyDocument() {
        return {
            schemaVersion: SCHEMA_VERSION,
            updatedAt: new Date().toISOString(),
            lessons: {}
        };
    }

    function isTimestamp(value) {
        return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
    }

    function isCount(value) {
        return Number.isInteger(value) && value >= 0;
    }

    function validate(document) {
        if (!document || typeof document !== "object" || Array.isArray(document) ||
            document.schemaVersion !== SCHEMA_VERSION || !isTimestamp(document.updatedAt) ||
            !document.lessons || typeof document.lessons !== "object" || Array.isArray(document.lessons)) {
            return false;
        }

        const attemptIds = new Set();
        return Object.keys(document.lessons).every(function (key) {
            const lesson = document.lessons[key];
            if (!lesson || typeof lesson !== "object" || Array.isArray(lesson) ||
                typeof lesson.categoryId !== "string" || !lesson.categoryId ||
                typeof lesson.lessonId !== "string" || !lesson.lessonId ||
                key !== lesson.categoryId + "/" + lesson.lessonId ||
                !Array.isArray(lesson.attempts) || lesson.attempts.length === 0) {
                return false;
            }

            return lesson.attempts.every(function (attempt) {
                if (!attempt || typeof attempt !== "object" || Array.isArray(attempt) ||
                    typeof attempt.attemptId !== "string" || !attempt.attemptId ||
                    attemptIds.has(attempt.attemptId) || !isTimestamp(attempt.completedAt) ||
                    !isCount(attempt.totalQuestions) || attempt.totalQuestions === 0 || !isCount(attempt.correctAnswers) ||
                    !isCount(attempt.incorrectAnswers) || !isCount(attempt.score) ||
                    attempt.correctAnswers > attempt.totalQuestions || attempt.incorrectAnswers > attempt.totalQuestions ||
                    attempt.score !== attempt.correctAnswers ||
                    attempt.correctAnswers + attempt.incorrectAnswers !== attempt.totalQuestions ||
                    !Number.isInteger(attempt.percentage) || attempt.percentage < 0 || attempt.percentage > 100) {
                    return false;
                }
                attemptIds.add(attempt.attemptId);
                return true;
            });
        });
    }

    function getStorage() {
        try {
            return window.localStorage;
        } catch (error) {
            return null;
        }
    }

    function load() {
        const storage = getStorage();
        if (!storage) return { document: null, writable: false, status: "unavailable" };

        let raw;
        try {
            raw = storage.getItem(STORAGE_KEY);
        } catch (error) {
            return { document: null, writable: false, status: "unavailable" };
        }

        if (raw === null) {
            const document = emptyDocument();
            try {
                storage.setItem(STORAGE_KEY, JSON.stringify(document));
                return { document: document, writable: true, status: "initialized" };
            } catch (error) {
                return { document: document, writable: false, status: "unavailable" };
            }
        }

        let document;
        try {
            document = JSON.parse(raw);
        } catch (error) {
            return { document: null, writable: false, status: "corrupt" };
        }

        if (!document || typeof document !== "object" || Array.isArray(document) ||
            !Number.isInteger(document.schemaVersion)) {
            return { document: null, writable: false, status: "invalid" };
        }
        if (document.schemaVersion > SCHEMA_VERSION) {
            return { document: null, writable: false, status: "unsupported-version" };
        }
        if (!validate(document)) {
            return { document: null, writable: false, status: "invalid" };
        }
        return { document: document, writable: true, status: "ready" };
    }

    function save(document) {
        const current = load();
        if (!current.writable) return { ok: false, status: current.status };
        if (!validate(document)) return { ok: false, status: "invalid" };

        const storage = getStorage();
        if (!storage) return { ok: false, status: "unavailable" };
        try {
            storage.setItem(STORAGE_KEY, JSON.stringify(document));
            return { ok: true, status: "saved", document: document };
        } catch (error) {
            return { ok: false, status: "unavailable" };
        }
    }

    function recordCompletion(completion) {
        const current = load();
        if (!current.writable || !current.document) return { ok: false, status: current.status };
        if (!completion || typeof completion.attemptId !== "string" || !completion.attemptId ||
            typeof completion.categoryId !== "string" || !completion.categoryId ||
            typeof completion.lessonId !== "string" || !completion.lessonId) {
            return { ok: false, status: "invalid-completion" };
        }

        const summary = completion.summary;
        if (!summary || !isCount(summary.totalQuestions) || summary.totalQuestions === 0 ||
            !isCount(summary.correctAnswers) || !isCount(summary.incorrectAnswers) ||
            !isCount(summary.score) || summary.correctAnswers > summary.totalQuestions ||
            summary.incorrectAnswers > summary.totalQuestions || summary.score !== summary.correctAnswers ||
            summary.correctAnswers + summary.incorrectAnswers !== summary.totalQuestions ||
            !Number.isInteger(summary.percentage) ||
            summary.percentage < 0 || summary.percentage > 100) {
            return { ok: false, status: "invalid-completion" };
        }

        const document = JSON.parse(JSON.stringify(current.document));
        const key = completion.categoryId + "/" + completion.lessonId;
        if (!document.lessons[key]) {
            document.lessons[key] = {
                categoryId: completion.categoryId,
                lessonId: completion.lessonId,
                attempts: []
            };
        }

        const lesson = document.lessons[key];
        const existingIndex = lesson.attempts.findIndex(function (attempt) {
            return attempt.attemptId === completion.attemptId;
        });
        const existing = existingIndex >= 0 ? lesson.attempts[existingIndex] : null;
        const attempt = {
            attemptId: completion.attemptId,
            completedAt: existing ? existing.completedAt : new Date().toISOString(),
            totalQuestions: summary.totalQuestions,
            correctAnswers: summary.correctAnswers,
            incorrectAnswers: summary.incorrectAnswers,
            score: summary.score,
            percentage: summary.percentage
        };
        if (existingIndex >= 0) lesson.attempts[existingIndex] = attempt;
        else lesson.attempts.push(attempt);
        document.updatedAt = new Date().toISOString();

        const result = save(document);
        if (!result.ok) return result;
        return { ok: true, status: "saved", document: document, attempt: attempt };
    }

    function getLessonProgress(document, categoryId, lessonId) {
        if (!validate(document)) return null;
        const record = document.lessons[categoryId + "/" + lessonId];
        if (!record || !record.attempts.length) {
            return { completed: false, attempts: 0, latestAttempt: null, bestAttempt: null };
        }
        const chronological = record.attempts.slice().sort(function (a, b) {
            return Date.parse(a.completedAt) - Date.parse(b.completedAt);
        });
        const latestAttempt = chronological[chronological.length - 1];
        const bestAttempt = record.attempts.reduce(function (best, attempt) {
            return !best || attempt.percentage > best.percentage ||
                (attempt.percentage === best.percentage && attempt.score > best.score) ? attempt : best;
        }, null);
        return { completed: true, attempts: record.attempts.length, latestAttempt: latestAttempt, bestAttempt: bestAttempt };
    }

    function getCategoryProgress(document, category) {
        if (!validate(document) || !category || !Array.isArray(category.lessons)) return null;
        const completedLessons = category.lessons.filter(function (lesson) {
            return getLessonProgress(document, category.id, lesson.id).completed;
        }).length;
        return {
            categoryId: category.id,
            completedLessons: completedLessons,
            totalLessons: category.lessons.length,
            percentage: category.lessons.length ? Math.round(completedLessons / category.lessons.length * 100) : 0
        };
    }

    function getOverallProgress(document, categories) {
        if (!validate(document) || !Array.isArray(categories)) return null;
        const totals = categories.reduce(function (progress, category) {
            const categoryProgress = getCategoryProgress(document, category);
            progress.completedLessons += categoryProgress.completedLessons;
            progress.totalLessons += categoryProgress.totalLessons;
            return progress;
        }, { completedLessons: 0, totalLessons: 0 });
        totals.percentage = totals.totalLessons ? Math.round(totals.completedLessons / totals.totalLessons * 100) : 0;
        return totals;
    }

    function reset() {
        const current = load();
        if (!current.writable) return { ok: false, status: current.status };
        const storage = getStorage();
        if (!storage) return { ok: false, status: "unavailable" };
        try {
            storage.removeItem(STORAGE_KEY);
            return { ok: true, status: "reset" };
        } catch (error) {
            return { ok: false, status: "unavailable" };
        }
    }

    window.LittleLearnersStorage = {
        key: STORAGE_KEY,
        schemaVersion: SCHEMA_VERSION,
        createEmpty: emptyDocument,
        validate: validate,
        load: load,
        save: save,
        recordCompletion: recordCompletion,
        getLessonProgress: getLessonProgress,
        getCategoryProgress: getCategoryProgress,
        getOverallProgress: getOverallProgress,
        reset: reset
    };
})();
