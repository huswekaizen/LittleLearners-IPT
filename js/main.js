const learningData = window.LittleLearnersData;
let lastCompletion = null;

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character];
    });
}

function announceQuiz(message) {
    const region = document.querySelector("[data-quiz-announcement]");
    if (!region) return;
    region.textContent = "";
    window.requestAnimationFrame(function () { region.textContent = message; });
}

function initializeAccessibilitySettings() {
    const preferencesApi = window.LittleLearnersAccessibilityPreferences;
    const dialog = document.getElementById("accessibility-dialog");
    const opener = document.querySelector("[data-open-accessibility]");
    const status = document.querySelector("[data-accessibility-status]");
    if (!preferencesApi || !dialog || !opener || !status) return;

    function syncControls(preferences) {
        const selectedSize = dialog.querySelector('input[name="textSize"][value="' + preferences.textSize + '"]');
        if (selectedSize) selectedSize.checked = true;
        dialog.querySelector('input[name="highContrast"]').checked = preferences.highContrast;
        dialog.querySelector('input[name="reduceMotion"]').checked = preferences.reduceMotion;
    }

    function describeStorageStatus(storageStatus) {
        if (storageStatus === "corrupt" || storageStatus === "invalid" || storageStatus === "unsupported-version") {
            return "These settings work for now, but saved accessibility settings could not be changed because the saved data is " +
                (storageStatus === "unsupported-version" ? "from a newer version." : "not valid.");
        }
        if (storageStatus === "unavailable") return "These settings work for now, but could not be saved on this device.";
        return "Accessibility setting updated and saved.";
    }

    syncControls(preferencesApi.get());
    dialog.querySelectorAll("input").forEach(function (control) {
        control.addEventListener("change", function () {
            let update;
            if (control.name === "textSize") update = preferencesApi.update({ textSize: control.value });
            else if (control.name === "highContrast") update = preferencesApi.update({ highContrast: control.checked });
            else update = preferencesApi.update({ reduceMotion: control.checked });
            syncControls(update.preferences);
            status.textContent = describeStorageStatus(update.status);
        });
    });

    opener.addEventListener("click", function () {
        syncControls(preferencesApi.get());
        const storageStatus = preferencesApi.load().status;
        if (storageStatus === "corrupt" || storageStatus === "invalid" || storageStatus === "unsupported-version") {
            status.textContent = describeStorageStatus(storageStatus);
        } else if (storageStatus === "unavailable") {
            status.textContent = describeStorageStatus(storageStatus);
        } else {
            status.textContent = "";
        }
        if (typeof dialog.showModal === "function") {
            dialog.showModal();
            const selected = dialog.querySelector('input[name="textSize"]:checked');
            if (selected) selected.focus();
        }
    });

    dialog.querySelectorAll("[data-close-accessibility]").forEach(function (button) {
        button.addEventListener("click", function () { dialog.close(); });
    });
    dialog.addEventListener("close", function () {
        if (opener.isConnected) opener.focus();
    });
}

initializeAccessibilitySettings();

function findCategory(categoryId) {
    return learningData.categories.find(function (category) {
        return category.id === categoryId;
    }) || null;
}

function findLesson(category, lessonId) {
    return category && category.lessons.find(function (lesson) {
        return lesson.id === lessonId;
    }) || null;
}

function renderGroups(groups, className) {
    return '<div class="' + className + '">' + groups.map(function (group) {
        const operator = group.symbolBefore
            ? '<span class="visual-operator" aria-hidden="true">' + escapeHtml(group.symbolBefore) + '</span>'
            : "";
        const items = (group.items || []).map(function (item) {
            return '<span>' + escapeHtml(item) + '</span>';
        }).join("");

        return '<div class="visual-group">' + operator +
            '<div class="visual-group-content">' +
            '<div class="visual-items" aria-hidden="true">' + items + '</div>' +
            '<span class="visual-caption">' + escapeHtml(group.caption) + '</span>' +
            '</div></div>';
    }).join("") + "</div>";
}

function getCurrentCompletedLessons(document) {
    return learningData.categories.reduce(function (entries, category) {
        category.lessons.forEach(function (lesson) {
            const progress = window.LittleLearnersStorage.getLessonProgress(document, category.id, lesson.id);
            if (progress && progress.completed && progress.latestAttempt) {
                entries.push({ category: category, lesson: lesson, progress: progress });
            }
        });
        return entries;
    }, []).sort(function (a, b) {
        return Date.parse(b.progress.latestAttempt.completedAt) - Date.parse(a.progress.latestAttempt.completedAt);
    });
}

function getSavedCompletion(attemptId) {
    const loaded = window.LittleLearnersStorage.load();
    if (!loaded.writable || !loaded.document) return null;

    const candidates = learningData.categories.reduce(function (attempts, category) {
        category.lessons.forEach(function (lesson) {
            const record = loaded.document.lessons[category.id + "/" + lesson.id];
            if (!record) return;
            record.attempts.forEach(function (attempt) {
                if (!attemptId || attempt.attemptId === attemptId) {
                    attempts.push({ category: category, lesson: lesson, attempt: attempt });
                }
            });
        });
        return attempts;
    }, []);
    if (!candidates.length) return null;

    const selected = candidates.sort(function (a, b) {
        return Date.parse(b.attempt.completedAt) - Date.parse(a.attempt.completedAt);
    })[0];
    const attempt = selected.attempt;
    return {
        attemptId: attempt.attemptId,
        category: selected.category,
        lesson: selected.lesson,
        summary: {
            score: attempt.score,
            totalQuestions: attempt.totalQuestions,
            percentage: attempt.percentage,
            correctAnswers: attempt.correctAnswers,
            incorrectAnswers: attempt.incorrectAnswers
        },
        saved: true
    };
}

function resolveResultsCompletion(route) {
    if (route.attemptId && lastCompletion && lastCompletion.attemptId === route.attemptId) {
        return lastCompletion;
    }
    if (!route.attemptId && lastCompletion) return lastCompletion;
    return getSavedCompletion(route.attemptId);
}

function getContinueRecommendation(document, overall, recent) {
    if (!overall || overall.totalLessons === 0) return null;
    if (overall.completedLessons === overall.totalLessons) {
        return recent.length ? { category: recent[0].category, lesson: recent[0].lesson, mode: "practice" } : null;
    }
    if (overall.completedLessons === 0) {
        const category = learningData.categories[0];
        return { category: category, lesson: category.lessons[0], mode: "start" };
    }

    const mostRecentCategory = recent.length ? recent[0].category : null;
    const categories = mostRecentCategory
        ? [mostRecentCategory].concat(learningData.categories.filter(function (category) { return category.id !== mostRecentCategory.id; }))
        : learningData.categories;
    for (const category of categories) {
        const lesson = category.lessons.find(function (candidate) {
            const progress = window.LittleLearnersStorage.getLessonProgress(document, category.id, candidate.id);
            return !progress || !progress.completed;
        });
        if (lesson) return { category: category, lesson: lesson, mode: "explore" };
    }
    return recent.length ? { category: recent[0].category, lesson: recent[0].lesson, mode: "practice" } : null;
}

function renderContinueLearning(container, recommendation, unavailable) {
    if (unavailable) {
        const category = learningData.categories[0];
        const lesson = category.lessons[0];
        container.innerHTML = '<p class="eyebrow">A GENTLE NEXT STEP</p><h3>Pick a learning path.</h3><p>Your saved progress is unavailable. You can still explore any lesson.</p><a class="button button-dark" href="#lesson/' + category.id + '/' + lesson.id + '" data-screen-link>Explore a lesson <span aria-hidden="true">→</span></a>';
        return;
    }
    if (!recommendation) {
        container.innerHTML = '<p class="eyebrow">A GENTLE NEXT STEP</p><h3>Choose an adventure.</h3><p>Pick any learning path that sounds fun.</p><a class="button button-dark" href="#dashboard" data-screen-link>Explore learning paths <span aria-hidden="true">→</span></a>';
        return;
    }
    const category = recommendation.category;
    const lesson = recommendation.lesson;
    let eyebrow = "A GENTLE NEXT STEP", title = "Ready for another little step?", description = "Explore " + lesson.title + " in " + category.shortTitle + ".", action = "Explore this lesson";
    if (recommendation.mode === "start") {
        title = "Every journey starts somewhere.";
        description = "Try a short lesson in " + category.shortTitle + ".";
        action = "Start a lesson";
    } else if (recommendation.mode === "practice") {
        eyebrow = "KEEP YOUR SKILLS GROWING";
        title = "Keep practicing!";
        description = "Visit " + lesson.title + " in " + category.shortTitle + " again.";
        action = "Practice this lesson";
    }
    container.innerHTML = '<p class="eyebrow">' + escapeHtml(eyebrow) + '</p><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(description) + '</p>' +
        '<a class="button button-dark" href="#lesson/' + encodeURIComponent(category.id) + '/' + encodeURIComponent(lesson.id) + '" data-screen-link>' + escapeHtml(action) + ' <span aria-hidden="true">→</span></a>';
}

function renderDashboard() {
    const overallView = document.querySelector("[data-overall-progress]");
    const recentView = document.querySelector("[data-recent-activity]");
    const continueView = document.querySelector("[data-continue-learning]");
    const loaded = window.LittleLearnersStorage.load();

    if (!loaded.writable || !loaded.document) {
        const messages = {
            corrupt: "Saved progress data is malformed and cannot be displayed.",
            invalid: "Saved progress data is invalid and cannot be displayed.",
            "unsupported-version": "Saved progress uses a newer format and cannot be displayed here.",
            unavailable: "Progress is unavailable on this device right now."
        };
        const message = messages[loaded.status] || messages.unavailable;
        overallView.innerHTML = '<span>PROGRESS UNAVAILABLE</span><p class="dashboard-progress-message" role="status">' + escapeHtml(message) + '</p>';
        recentView.innerHTML = '<p class="dashboard-empty" role="status">' + escapeHtml(message) + '</p>';
        renderContinueLearning(continueView, null, true);
        return;
    }

    const overall = window.LittleLearnersStorage.getOverallProgress(loaded.document, learningData.categories);
    if (!overall) {
        overallView.innerHTML = '<span>PROGRESS UNAVAILABLE</span><p class="dashboard-progress-message" role="status">Saved progress could not be summarized.</p>';
        recentView.innerHTML = '<p class="dashboard-empty" role="status">Recent activity is unavailable.</p>';
        renderContinueLearning(continueView, null, true);
        return;
    }

    overallView.innerHTML = '<span>OVERALL LEARNING PROGRESS</span><strong>' + overall.completedLessons + ' <small>of ' + overall.totalLessons + ' lessons</small></strong>' +
        '<div class="dashboard-progress-track" role="progressbar" aria-label="Overall lesson completion" aria-valuemin="0" aria-valuemax="' + overall.totalLessons + '" aria-valuenow="' + overall.completedLessons + '"><span style="width:' + overall.percentage + '%"></span></div>' +
        '<span class="dashboard-progress-percent">' + overall.percentage + '% complete</span>';

    const recent = getCurrentCompletedLessons(loaded.document);
    if (!recent.length) {
        recentView.innerHTML = '<p class="dashboard-empty">No completed lessons yet. Your recent learning will appear here.</p>';
    } else {
        const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
        recentView.innerHTML = '<ul class="recent-activity-list">' + recent.slice(0, 3).map(function (entry) {
            const latest = entry.progress.latestAttempt;
            const best = entry.progress.bestAttempt;
            const completedAt = latest.completedAt;
            return '<li class="recent-activity-card"><div><p class="card-label">' + escapeHtml(entry.category.title) + '</p><h3>' + escapeHtml(entry.lesson.title) + '</h3>' +
                '<p class="recent-completion">Completed <time datetime="' + escapeHtml(completedAt) + '">' + escapeHtml(dateFormat.format(new Date(completedAt))) + '</time></p></div>' +
                '<div class="recent-scores"><span>Latest: ' + latest.score + '/' + latest.totalQuestions + ' (' + latest.percentage + '%)</span><span>Best: ' + best.score + '/' + best.totalQuestions + ' (' + best.percentage + '%)</span></div>' +
                '<a class="text-link" href="#lesson/' + encodeURIComponent(entry.category.id) + '/' + encodeURIComponent(entry.lesson.id) + '" data-screen-link>Review lesson <span aria-hidden="true">→</span></a></li>';
        }).join("") + '</ul>';
    }

    renderContinueLearning(continueView, getContinueRecommendation(loaded.document, overall, recent), false);
}

function renderExplore() {
    const container = document.querySelector("[data-explore-view]");
    const cardColors = ["card-lime", "card-blue", "card-peach", "card-lavender", "card-yellow"];
    container.innerHTML = learningData.categories.map(function (category, index) {
        return '<article class="category-card ' + cardColors[index % cardColors.length] + '">' +
            '<div class="category-top"><span class="category-emoji" aria-hidden="true">' + escapeHtml(category.icon) + '</span>' +
            '<span class="card-arrow" aria-hidden="true">↗</span></div>' +
            '<p class="card-label">LEARNING PATH</p><h2>' + escapeHtml(category.title) + '</h2>' +
            '<p>' + escapeHtml(category.description) + '</p>' +
            '<a class="text-link" href="#category/' + encodeURIComponent(category.id) + '" data-screen-link>Explore ' +
            escapeHtml(category.shortTitle) + ' <span aria-hidden="true">→</span></a></article>';
    }).join("");
}

function renderMyLearning() {
    const container = document.querySelector("[data-my-learning-view]");
    const loaded = window.LittleLearnersStorage.load();
    const available = loaded.writable && loaded.document;
    const storageMessages = {
        corrupt: "Saved progress data is malformed and cannot be displayed.",
        invalid: "Saved progress data is invalid and cannot be displayed.",
        "unsupported-version": "Saved progress uses a newer format and cannot be displayed here.",
        unavailable: "Progress is unavailable on this device right now."
    };
    const storageNote = available ? "" : '<p class="my-learning-storage-note" role="status">' +
        escapeHtml(storageMessages[loaded.status] || storageMessages.unavailable) + '</p>';

    const categorySections = learningData.categories.map(function (category) {
        const categoryProgress = available
            ? window.LittleLearnersStorage.getCategoryProgress(loaded.document, category)
            : null;
        const lessons = category.lessons.map(function (lesson) {
            const progress = available
                ? window.LittleLearnersStorage.getLessonProgress(loaded.document, category.id, lesson.id)
                : null;
            const completed = Boolean(progress && progress.completed);
            const status = !available ? "Progress unavailable" : completed ? "Completed" : "Not completed yet";
            const scoreDetails = completed
                ? '<p class="my-learning-scores"><span>Latest: ' + progress.latestAttempt.score + '/' + progress.latestAttempt.totalQuestions +
                    ' (' + progress.latestAttempt.percentage + '%)</span><span>Best: ' + progress.bestAttempt.score + '/' + progress.bestAttempt.totalQuestions +
                    ' (' + progress.bestAttempt.percentage + '%)</span></p>'
                : (available ? '<p class="my-learning-scores">No saved completion yet</p>' : '');
            const action = !available ? "Open Lesson" : completed ? "Practice Again" : "Start Lesson";
            const statusClass = !available ? "is-unavailable" : completed ? "is-completed" : "is-not-completed";
            const destination = completed ? "activity" : "lesson";
            return '<li class="my-learning-lesson"><div class="my-learning-lesson-heading"><div><h3>' + escapeHtml(lesson.title) +
                '</h3><p>' + escapeHtml(lesson.introduction) + '</p></div><span class="my-learning-status ' + statusClass + '">' + escapeHtml(status) + '</span></div>' +
                scoreDetails + '<a class="button ' + (completed ? 'button-quiet' : 'button-primary') + '" href="#' + destination + '/' +
                encodeURIComponent(category.id) + '/' + encodeURIComponent(lesson.id) + '" data-screen-link>' + action + '</a></li>';
        }).join("");
        const categorySummary = categoryProgress
            ? '<p class="my-learning-category-count">Completed <strong>' + categoryProgress.completedLessons + ' of ' + categoryProgress.totalLessons +
                ' lessons</strong> · ' + categoryProgress.percentage + '%</p><div class="my-learning-progress-track" role="progressbar" aria-label="' +
                escapeHtml(category.title) + ' lesson completion" aria-valuemin="0" aria-valuemax="' + categoryProgress.totalLessons +
                '" aria-valuenow="' + categoryProgress.completedLessons + '"><span style="width:' + categoryProgress.percentage + '%"></span></div>'
            : '<p class="my-learning-category-count">Category progress unavailable</p>';
        return '<section class="my-learning-category" aria-labelledby="my-learning-' + escapeHtml(category.id) + '">' +
            '<div class="my-learning-category-heading"><span class="category-heading-icon" aria-hidden="true">' + escapeHtml(category.icon) + '</span>' +
            '<div><h2 id="my-learning-' + escapeHtml(category.id) + '">' + escapeHtml(category.title) + '</h2><p>' + escapeHtml(category.description) + '</p></div>' +
            '</div>' + categorySummary + '<ul class="my-learning-lesson-list">' + lessons + '</ul></section>';
    }).join("");

    container.innerHTML = '<a class="back-link" href="#dashboard" data-screen-link><span aria-hidden="true">←</span> Dashboard</a>' +
        '<header class="my-learning-heading"><p class="eyebrow">YOUR LITTLE LEARNING GARDEN</p><h1>My learning</h1>' +
        '<p>Explore each learning path and find a lesson to try or practice again.</p></header>' + storageNote +
        '<p class="my-learning-note">A lesson is marked complete after its activity has a saved result. Lessons without a saved result are shown as not completed.</p>' +
        '<div class="my-learning-categories">' + categorySections + '</div>';
}

function renderCategory(category) {
    const objectives = category.objectives.map(function (objective) {
        return "<li>" + escapeHtml(objective) + "</li>";
    }).join("");
    const lessons = category.lessons.map(function (lesson, index) {
        const firstObjective = lesson.objectives[0] || lesson.introduction;
        const lessonNumber = String(index + 1).padStart(2, "0");

        return '<article class="lesson-card">' +
            '<span class="lesson-order" aria-hidden="true">' + lessonNumber + '</span>' +
            '<div><h3>' + escapeHtml(lesson.title) + '</h3>' +
            '<p>' + escapeHtml(firstObjective) + '</p>' +
            '<a class="text-link" href="#lesson/' + category.id + '/' + lesson.id + '" data-screen-link>' +
            'Open lesson <span aria-hidden="true">→</span></a></div></article>';
    }).join("");

    document.querySelector("[data-category-view]").innerHTML =
        '<a class="back-link" href="#explore" data-screen-link><span aria-hidden="true">←</span> All learning paths</a>' +
        '<div class="category-page-heading">' +
        '<p class="eyebrow">YOUR LITTLE LEARNING GARDEN</p>' +
        '<h1><span class="category-heading-icon" aria-hidden="true">' + escapeHtml(category.icon) + '</span>' +
        escapeHtml(category.title) + '</h1>' +
        '<p>' + escapeHtml(category.description) + '</p></div>' +
        '<div class="category-content-grid">' +
        '<section class="category-goals-panel" aria-labelledby="category-goals-title">' +
        '<p class="eyebrow">WHAT WE’LL EXPLORE</p><h2 id="category-goals-title">Little learning goals</h2>' +
        '<ul class="category-objectives">' + objectives + '</ul>' +
        '<div class="category-note"><span aria-hidden="true">🌱</span><p>Take your time. You can come back to any lesson whenever you like.</p></div>' +
        '</section>' +
        '<section class="lesson-list-panel" aria-labelledby="lesson-list-title">' +
        '<p class="eyebrow">CHOOSE A LITTLE LESSON</p><h2 id="lesson-list-title">Start exploring</h2>' +
        '<div class="lesson-list">' + lessons + '</div>' +
        '</section></div>';
}

function renderLesson(category, lesson) {
    const objectives = lesson.objectives.map(function (objective) {
        return "<li>" + escapeHtml(objective) + "</li>";
    }).join("");

    document.querySelector("[data-lesson-view]").innerHTML =
        '<a class="back-link" href="#category/' + category.id + '" data-screen-link>' +
        '<span aria-hidden="true">←</span> Back to ' + escapeHtml(category.shortTitle) + '</a>' +
        '<div class="lesson-layout"><div class="lesson-copy">' +
        '<p class="eyebrow">' + escapeHtml(category.shortTitle.toUpperCase()) + ' · LITTLE LESSON</p>' +
        '<h1>' + escapeHtml(lesson.title) + '</h1>' +
        '<p class="lesson-intro">' + escapeHtml(lesson.introduction) + '</p>' +
        '<section class="lesson-objectives" aria-labelledby="lesson-objectives-title">' +
        '<h2 id="lesson-objectives-title">We will learn to…</h2><ul>' + objectives + '</ul></section>' +
        '<div class="instruction-panel"><span class="instruction-icon" aria-hidden="true">👆</span>' +
        '<p><strong>Let’s try it together.</strong><br>' + escapeHtml(lesson.instructions) + '</p></div>' +
        '<a class="button button-primary" href="#activity/' + category.id + '/' + lesson.id + '" data-screen-link>' +
        'Try a little activity <span aria-hidden="true">→</span></a></div>' +
        '<div class="lesson-visual" aria-label="Visual example: ' + escapeHtml(lesson.example.label) + '">' +
        '<span class="visual-label">' + escapeHtml(lesson.example.label) + '</span>' +
        renderGroups(lesson.example.groups, "visual-groups") +
        '<div class="practice-callout"><span class="eyebrow">YOUR TURN</span>' +
        '<p>' + escapeHtml(lesson.practicePrompt) + '</p></div></div></div>';
}

function renderActivity(focusChoiceId, focusQuestion) {
    const state = window.LittleLearnersActivity.current();
    const category = state.category, lesson = state.lesson, question = state.questions[state.index];
    const view = document.querySelector("[data-activity-view]");
    if (!question) { view.innerHTML = '<div class="quiz-panel"><h1>No questions are ready yet</h1><p>Please choose another lesson.</p><a class="button button-primary" href="#category/' + category.id + '" data-screen-link>Back to lessons</a></div>'; return; }
    const submitted = state.submitted[state.index];
    const choices = question.choices.map(function(choice) {
        const selected = state.selectedChoiceId === choice.id;
        const correct = submitted && choice.id === question.correctChoiceId;
        const wrong = submitted && selected && !submitted.correct;
        const symbol = choice.symbol ? '<span class="answer-symbol" aria-hidden="true">' + escapeHtml(choice.symbol) + '</span>' : '';
        const stateText = correct ? ' <span class="answer-state">Correct answer</span>' : (wrong ? ' <span class="answer-state">Your answer</span>' : '');
        return '<button class="answer-option' + (correct ? ' is-correct' : '') + (wrong ? ' is-incorrect' : '') + '" type="button" aria-pressed="' + selected + '" data-answer-option="' + escapeHtml(choice.id) + '" ' + (submitted ? 'disabled' : '') + '>' + symbol + '<span>' + escapeHtml(choice.label) + stateText + '</span></button>';
    }).join('');
    const feedback = submitted ? '<p class="answer-feedback ' + (submitted.correct ? 'feedback-correct' : 'feedback-incorrect') + '">' + escapeHtml(submitted.correct ? question.feedback.correct : question.feedback.incorrect) + '</p>' : '<p class="selection-hint" data-selection-hint aria-live="polite">Choose an answer, then submit it.</p>';
    const action = submitted ? '<button class="button button-primary" type="button" data-next>' + (state.index === state.questions.length - 1 ? 'See my results' : 'Next question') + ' <span aria-hidden="true">→</span></button>' : '<button class="button button-primary" type="button" data-submit ' + (state.selectedChoiceId ? '' : 'disabled') + '>Submit answer</button>';
    const progress = Math.round((state.index + 1) / state.questions.length * 100);
    view.innerHTML = '<a class="back-link" href="#lesson/' + category.id + '/' + lesson.id + '" data-screen-link><span aria-hidden="true">←</span> Back to ' + escapeHtml(lesson.title) + '</a>' +
        '<div class="activity-topline"><span class="activity-tag">' + escapeHtml(category.shortTitle.toUpperCase()) + ' · PRACTICE TOGETHER</span><span class="question-count">Question <strong>' + (state.index + 1) + '</strong> of <strong>' + state.questions.length + '</strong></span></div>' +
        '<div class="question-progress" role="progressbar" aria-label="Question progress" aria-valuemin="0" aria-valuemax="' + state.questions.length + '" aria-valuenow="' + (state.index + 1) + '"><span style="width:' + progress + '%"></span></div>' +
        '<div class="quiz-panel"><div class="quiz-heading"><span class="quiz-illustration" aria-hidden="true">' + escapeHtml(category.icon) + '</span><div><p class="eyebrow">TAKE YOUR TIME</p><h1>' + escapeHtml(lesson.title) + '</h1><p class="activity-intro">Choose the answer that you think is right.</p></div></div>' +
        '<article class="activity-question"><p class="question-label">PRACTICE ' + String(state.index + 1).padStart(2,'0') + '</p><h2>' + escapeHtml(question.prompt) + '</h2><p class="question-instruction">' + escapeHtml(question.instruction) + '</p>' +
        '<div class="question-visual" role="img" aria-label="' + escapeHtml(question.visualDescription) + '">' + renderGroups(question.groups, 'visual-groups') + '</div><div class="answer-grid" role="group" aria-label="Answer choices for question ' + (state.index + 1) + '">' + choices + '</div>' + feedback + '<div class="quiz-actions">' + action + '</div></article></div><p class="reassurance">There’s no rush. Learning is all about trying.</p>';
    if (focusChoiceId) {
        const selectedOption = Array.from(view.querySelectorAll('[data-answer-option]')).find(function (option) {
            return option.dataset.answerOption === focusChoiceId;
        });
        if (selectedOption) selectedOption.focus();
    } else if (focusQuestion) {
        const firstChoice = view.querySelector('[data-answer-option]');
        if (firstChoice) firstChoice.focus();
    } else if (submitted) {
        const nextButton = view.querySelector('[data-next]');
        if (nextButton) nextButton.focus();
    }
}

function renderResults(completion) {
    if (!completion) return;
    const result = completion.summary;
    const saveNote = completion.saved ? "" : '<p class="progress-save-note" role="status">Your activity is complete, but progress could not be saved on this device.</p>';
    document.querySelector('[data-results-content]').innerHTML='<p class="eyebrow">A MOMENT TO CELEBRATE</p><h1 aria-label="Quiz complete. Final score: '+result.score+' out of '+result.totalQuestions+'. '+result.percentage+' percent. '+result.correctAnswers+' correct answers and '+result.incorrectAnswers+' incorrect answers.">You did a lovely job!</h1><p class="results-description">'+escapeHtml(completion.category.shortTitle+' · '+completion.lesson.title)+'</p><div class="results-score"><strong>'+result.score+' / '+result.totalQuestions+'</strong><span>'+result.percentage+'%</span></div><dl class="results-breakdown"><div><dt>Total questions</dt><dd>'+result.totalQuestions+'</dd></div><div><dt>Correct answers</dt><dd>'+result.correctAnswers+'</dd></div><div><dt>Incorrect answers</dt><dd>'+result.incorrectAnswers+'</dd></div></dl>'+saveNote+'<div class="results-actions"><button class="button button-primary" type="button" data-retry>Try this activity again <span aria-hidden="true">↻</span></button><a class="button button-quiet" href="#category/'+completion.category.id+'" data-screen-link>Back to this category</a><a class="button button-quiet" href="#dashboard" data-screen-link>Return to dashboard</a></div>';
}

document.addEventListener("littlelearners:navigate", function (event) {
    const route = event.detail;
    const category = findCategory(route.categoryId);
    const lesson = findLesson(category, route.lessonId);

    if (route.screen === "dashboard") {
        renderDashboard();
    } else if (route.screen === "explore") {
        renderExplore();
    } else if (route.screen === "my-learning") {
        renderMyLearning();
    } else if (route.screen === "results") {
        const completion = resolveResultsCompletion(route);
        if (!completion) {
            route.redirectTo = "#dashboard";
            return;
        }
        lastCompletion = completion;
        renderResults(completion);
    } else if (!category) {
        return;
    } else if (route.screen === "category") {
        renderCategory(category);
    } else if (route.screen === "lesson") {
        if (!lesson) return;
        renderLesson(category, lesson);
    } else if (route.screen === "activity") {
        if (!lesson) return;
        lastCompletion = null;
        window.LittleLearnersActivity.start(category, lesson, learningData.questions);
        renderActivity();
    }
});

document.addEventListener("click", function(event) {
    const answer=event.target.closest('[data-answer-option]');
    if(answer){window.LittleLearnersActivity.select(answer.dataset.answerOption);renderActivity(answer.dataset.answerOption);return;}
    if(event.target.closest('[data-submit]')){
        const state=window.LittleLearnersActivity.current();
        if(!state.selectedChoiceId){const hint=document.querySelector('[data-selection-hint]');if(hint)hint.textContent='Choose an answer before you submit.';return;}
        const answer = window.LittleLearnersActivity.submit();
        if (answer) {
            const state = window.LittleLearnersActivity.current();
            const question = state.questions[state.index];
            announceQuiz(question.feedback[answer.correct ? "correct" : "incorrect"]);
        }
        renderActivity();
    }else if(event.target.closest('[data-next]')){
        const result=window.LittleLearnersActivity.next();
        if(result==='complete'){
            const state=window.LittleLearnersActivity.current();
            const summary=window.LittleLearnersScoring.summarize(state.questions,state.submitted);
            const saved=window.LittleLearnersStorage.recordCompletion({attemptId:state.attemptId,categoryId:state.category.id,lessonId:state.lesson.id,summary:summary});
            lastCompletion={attemptId:state.attemptId,category:state.category,lesson:state.lesson,summary:summary,saved:saved.ok};
            window.LittleLearnersNavigation.go('#results/' + encodeURIComponent(state.attemptId));
        }else {
            const state = window.LittleLearnersActivity.current();
            const question = state.questions[state.index];
            announceQuiz("Question " + (state.index + 1) + " of " + state.questions.length + ". " + question.prompt);
            renderActivity(null,true);
        }
    }else if(event.target.closest('[data-retry]')){
        const completion = lastCompletion;
        if (completion) window.LittleLearnersNavigation.go('#activity/'+completion.category.id+'/'+completion.lesson.id);
    }
});
