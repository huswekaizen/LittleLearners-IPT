const learningData = window.LittleLearnersData;
let lastCompletion = null;
let discoverState = null;
let activeLessonContext = null;

window.LittleLearnersContentValidation.validate(learningData.categories, learningData.questions);

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

function renderLearningMascot() {
    return '<img src="assets/images/characters/bo-mascot.png" alt="Bo, the Little Learners bear mascot, waving hello." loading="eager" decoding="async">';
}

function categoryIllustrationMarkup(categoryId) {
    const illustrations = {
        numbers: '<circle class="art-sparkle" cx="21" cy="22" r="6"></circle><rect class="art-number-one" x="22" y="34" width="48" height="78" rx="15"></rect><rect class="art-number-two" x="85" y="24" width="52" height="88" rx="17"></rect><rect class="art-number-three" x="151" y="36" width="48" height="76" rx="15"></rect><text class="art-number-text" x="46" y="88">1</text><text class="art-number-text" x="111" y="82">2</text><text class="art-number-text" x="175" y="88">3</text><circle class="art-dot" cx="207" cy="28" r="7"></circle>',
        counting: '<g transform="translate(7 13)"><path class="art-apple-red" d="M29 28c-15-15-31-4-27 14 3 18 14 31 27 25 13 6 24-7 27-25 4-18-12-29-27-14z"></path><path class="art-leaf" d="M28 27c-2-11 4-17 13-18-1 9-6 14-13 18z"></path></g><g transform="translate(61 42) scale(.76)"><path class="art-apple-yellow" d="M29 28c-15-15-31-4-27 14 3 18 14 31 27 25 13 6 24-7 27-25 4-18-12-29-27-14z"></path><path class="art-leaf" d="M28 27c-2-11 4-17 13-18-1 9-6 14-13 18z"></path></g><g transform="translate(108 13)"><path class="art-apple-pink" d="M29 28c-15-15-31-4-27 14 3 18 14 31 27 25 13 6 24-7 27-25 4-18-12-29-27-14z"></path><path class="art-leaf" d="M28 27c-2-11 4-17 13-18-1 9-6 14-13 18z"></path></g><g transform="translate(157 42) scale(.76)"><path class="art-apple-green" d="M29 28c-15-15-31-4-27 14 3 18 14 31 27 25 13 6 24-7 27-25 4-18-12-29-27-14z"></path><path class="art-leaf" d="M28 27c-2-11 4-17 13-18-1 9-6 14-13 18z"></path></g>',
        addition: '<rect class="art-block-coral" x="15" y="26" width="45" height="45" rx="11"></rect><rect class="art-block-orange" x="25" y="78" width="45" height="45" rx="11"></rect><path class="art-plus" d="M78 74h34m-17-17v34"></path><rect class="art-block-teal" x="132" y="26" width="45" height="45" rx="11"></rect><rect class="art-block-blue" x="150" y="78" width="45" height="45" rx="11"></rect><path class="art-join-arrow" d="M60 97h69"></path>',
        subtraction: '<rect class="art-block-coral" x="10" y="49" width="42" height="43" rx="10"></rect><rect class="art-block-orange" x="57" y="49" width="42" height="43" rx="10"></rect><rect class="art-block-teal" x="104" y="49" width="42" height="43" rx="10"></rect><path class="art-take-arrow" d="M142 70h25m-8-8 8 8-8 8"></path><rect class="art-block-removed" x="174" y="49" width="35" height="43" rx="10"></rect><path class="art-dash" d="M162 42l17-17"></path>',
        shapes: '<circle class="art-shape-blue" cx="39" cy="64" r="27"></circle><rect class="art-shape-pink" x="81" y="36" width="54" height="54" rx="9"></rect><path class="art-shape-yellow" d="m174 31 31 59h-62z"></path><rect class="art-shape-green" x="25" y="104" width="68" height="24" rx="8"></rect>'
    };
    return '<svg class="category-art-illustration category-art-' + escapeHtml(categoryId) + '" viewBox="0 0 220 140" focusable="false" aria-hidden="true">' + (illustrations[categoryId] || illustrations.counting) + '</svg>';
}

function renderDashboard() {
    const overallView = document.querySelector("[data-overall-progress]");
    const recentView = document.querySelector("[data-recent-activity]");
    const continueView = document.querySelector("[data-continue-learning]");
    const mascotView = document.querySelector("[data-dashboard-mascot]");
    if (mascotView) mascotView.innerHTML = renderLearningMascot();
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
            return '<li class="recent-activity-card learning-activity-card recent-card-' + escapeHtml(entry.category.id) + '"><div class="recent-card-art">' + categoryIllustrationMarkup(entry.category.id) + '</div>' +
                '<div class="recent-card-content"><div class="recent-card-top"><span class="recent-category-tag">' + escapeHtml(entry.category.title) + '</span><span class="recent-complete-tag"><span aria-hidden="true">&#10003;</span> Completed</span></div>' +
                '<h3>' + escapeHtml(entry.lesson.title) + '</h3><time class="recent-completion" datetime="' + escapeHtml(completedAt) + '">' + escapeHtml(dateFormat.format(new Date(completedAt))) + '</time>' +
                '<div class="recent-scores"><span>Latest ' + latest.score + '/' + latest.totalQuestions + ' &#183; ' + latest.percentage + '%</span><span>Best ' + best.score + '/' + best.totalQuestions + ' &#183; ' + best.percentage + '%</span></div>' +
                '<a class="recent-card-action" href="#lesson/' + encodeURIComponent(entry.category.id) + '/' + encodeURIComponent(entry.lesson.id) + '" data-screen-link>Review lesson</a></div></li>';
        }).join("") + '</ul>';
    }

    renderContinueLearning(continueView, getContinueRecommendation(loaded.document, overall, recent), false);
}

function renderExplore() {
    const container = document.querySelector("[data-explore-view]");
    const cardColors = ["card-lime", "card-blue", "card-peach", "card-lavender", "card-yellow"];
    container.innerHTML = learningData.categories.map(function (category, index) {
        return '<a class="category-card learning-activity-card ' + cardColors[index % cardColors.length] + '" href="#category/' +
            encodeURIComponent(category.id) + '" data-screen-link aria-label="Explore ' + escapeHtml(category.title) +
            ', ' + category.lessons.length + ' lessons">' +
            '<div class="explore-card-top"><span class="card-label">LEARNING PATH</span><span class="card-arrow" aria-hidden="true">&#8599;</span></div>' +
            '<span class="category-illustration">' + categoryIllustrationMarkup(category.id) + '</span>' +
            '<div class="category-card-bottom"><h2 id="explore-category-' + escapeHtml(category.id) + '">' + escapeHtml(category.title) + '</h2>' +
            '<p>' + escapeHtml(category.description) + '</p>' +
            '<span class="category-card-count">' + category.lessons.length + ' little lessons</span></div></a>';
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
            const description = lesson.objectives && lesson.objectives[0] || lesson.introduction;
            const scoreDetails = completed
                ? '<p class="my-learning-scores"><span>Latest: ' + progress.latestAttempt.score + '/' + progress.latestAttempt.totalQuestions +
                    ' (' + progress.latestAttempt.percentage + '%)</span><span>Best: ' + progress.bestAttempt.score + '/' + progress.bestAttempt.totalQuestions +
                    ' (' + progress.bestAttempt.percentage + '%)</span></p>'
                : '';
            const action = !available ? "Open Lesson" : completed ? "Practice Again" : "Start Lesson";
            const statusClass = !available ? "is-unavailable" : completed ? "is-completed" : "is-not-completed";
            const destination = completed ? "activity" : "lesson";
            return '<li class="my-learning-lesson learning-activity-card category-activity-' + escapeHtml(category.id) + ' my-learning-lesson-' + escapeHtml(category.id) + '"><div class="my-learning-lesson-art">' +
                categoryIllustrationMarkup(category.id) + '</div><div class="my-learning-lesson-heading"><div><h3>' + escapeHtml(lesson.title) +
                '</h3><p>' + escapeHtml(description) + '</p></div><span class="my-learning-status ' + statusClass + '">' + escapeHtml(status) + '</span></div>' +
                scoreDetails + '<a class="button ' + (completed ? 'button-quiet' : 'button-primary') + '" href="#' + destination + '/' +
                encodeURIComponent(category.id) + '/' + encodeURIComponent(lesson.id) + '" data-screen-link>' + action + '</a></li>';
        }).join("");
        const categorySummary = categoryProgress
            ? '<p class="my-learning-category-count">Completed <strong>' + categoryProgress.completedLessons + ' of ' + categoryProgress.totalLessons +
                ' lessons</strong> · ' + categoryProgress.percentage + '%</p><div class="my-learning-progress-track" role="progressbar" aria-label="' +
                escapeHtml(category.title) + ' lesson completion" aria-valuemin="0" aria-valuemax="' + categoryProgress.totalLessons +
                '" aria-valuenow="' + categoryProgress.completedLessons + '"><span style="width:' + categoryProgress.percentage + '%"></span></div>'
            : '<p class="my-learning-category-count">Category progress unavailable</p>';
        return '<section class="my-learning-category learning-activity-card category-activity-' + escapeHtml(category.id) + ' my-learning-category-' + escapeHtml(category.id) + '" aria-labelledby="my-learning-' + escapeHtml(category.id) + '">' +
            '<div class="my-learning-category-heading"><span class="my-learning-category-art">' + categoryIllustrationMarkup(category.id) + '</span>' +
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

        return '<article class="lesson-card learning-activity-card category-activity-' + escapeHtml(category.id) + '">' +
            '<div class="lesson-card-art">' + categoryIllustrationMarkup(category.id) +
            '<span class="lesson-order" aria-hidden="true">' + lessonNumber + '</span></div>' +
            '<div class="lesson-card-copy"><h3>' + escapeHtml(lesson.title) + '</h3>' +
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

function hasFlashcardText(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function isValidFlashcardImage(image) {
    if (!image || typeof image !== "object" || Array.isArray(image)) return false;
    if (image.kind === "symbol") {
        return hasFlashcardText(image.value) && hasFlashcardText(image.alt) &&
            (image.repeat === undefined || (Number.isInteger(image.repeat) && image.repeat > 0));
    }
    if (image.kind === "image") {
        return hasFlashcardText(image.src) && !/^[a-z][a-z0-9+.-]*:/i.test(image.src) &&
            image.src.indexOf("//") !== 0 && hasFlashcardText(image.alt);
    }
    if (image.kind === "groups") {
        return Array.isArray(image.groups) && image.groups.length > 0 && image.groups.every(function (group) {
            return group && typeof group === "object" && Array.isArray(group.items) &&
                group.items.every(function (item) { return typeof item === "string"; }) &&
                hasFlashcardText(group.caption) &&
                (group.symbolBefore === undefined || hasFlashcardText(group.symbolBefore));
        });
    }
    return false;
}

function getFlashcards(lesson) {
    if (!lesson || !Array.isArray(lesson.flashcards)) return [];
    const ids = new Set();
    return lesson.flashcards.filter(function (card) {
        if (!card || typeof card !== "object" || Array.isArray(card) ||
            !hasFlashcardText(card.id) || ids.has(card.id) || !hasFlashcardText(card.label) ||
            !hasFlashcardText(card.description) || !hasFlashcardText(card.accessibleText)) return false;
        ids.add(card.id);
        return true;
    });
}

function renderFlashcardVisual(card) {
    const image = card.image;
    if (!isValidFlashcardImage(image)) return "";
    if (image.kind === "symbol") {
        const repetitions = image.repeat || 1;
        const symbols = Array.from({ length: repetitions }, function () {
            return '<span aria-hidden="true">' + escapeHtml(image.value) + '</span>';
        }).join("");
        return '<div class="discover-visual discover-symbol-visual" role="img" aria-label="' +
            escapeHtml(image.alt) + '">' + symbols + '</div>';
    }
    if (image.kind === "image") {
        return '<div class="discover-visual"><img class="discover-visual-image" src="' +
            escapeHtml(image.src) + '" alt="' + escapeHtml(image.alt) + '"></div>';
    }
    return '<div class="discover-visual discover-group-visual" role="img" aria-label="' +
        escapeHtml(card.accessibleText) + '">' + renderGroups(image.groups, "visual-groups") + '</div>';
}

function canRenderLearnData(learn) {
    return Boolean(learn && typeof learn.title === "string" && learn.title.trim() &&
        typeof learn.introduction === "string" && learn.introduction.trim() &&
        typeof learn.instructions === "string" && learn.instructions.trim() &&
        Array.isArray(learn.objectives) && learn.objectives.length > 0 &&
        learn.objectives.every(function (objective) { return typeof objective === "string" && objective.trim(); }) &&
        Array.isArray(learn.examples) && learn.examples.length > 0 &&
        learn.examples.every(function (example) {
            return example && typeof example.id === "string" && typeof example.label === "string" &&
                Array.isArray(example.groups) && example.groups.length > 0 &&
                example.groups.every(function (group) {
                    return group && Array.isArray(group.items) &&
                        group.items.every(function (item) { return typeof item === "string"; }) &&
                        typeof group.caption === "string" &&
                        (group.symbolBefore === undefined || typeof group.symbolBefore === "string");
                });
        }));
}

function renderLearn(category, lesson) {
    const learn = lesson.learn;
    const hasCards = getFlashcards(lesson).length > 0;
    const objectives = learn.objectives.map(function (objective) {
        return "<li>" + escapeHtml(objective) + "</li>";
    }).join("");
    const examples = learn.examples.map(function (example, index) {
        const visualDescription = [example.label].concat(example.groups.map(function (group) {
            return group.caption;
        })).join(". ");
        return '<article class="learn-example-card learning-activity-card category-activity-' + escapeHtml(category.id) + '" aria-labelledby="learn-example-title-' + index + '">' +
            '<h3 id="learn-example-title-' + index + '">' + escapeHtml(example.label) + '</h3>' +
            '<div class="learn-example-visual" role="img" aria-label="' + escapeHtml(visualDescription) + '">' +
            renderGroups(example.groups, "visual-groups") + '</div></article>';
    }).join("");

    document.querySelector("[data-lesson-view]").innerHTML =
        '<a class="back-link" href="#category/' + encodeURIComponent(category.id) + '" data-screen-link>' +
        '<span aria-hidden="true">←</span> Back to ' + escapeHtml(category.shortTitle) + '</a>' +
        '<header class="learn-page-heading"><p class="eyebrow">' + escapeHtml(category.shortTitle.toUpperCase()) +
        ' · LESSON: ' + escapeHtml(lesson.title) + '</p><h1>' + escapeHtml(learn.title) + '</h1>' +
        '<p class="learn-introduction">' + escapeHtml(learn.introduction) + '</p></header>' +
        '<div class="learn-content"><div class="learn-guidance">' +
        '<section class="instruction-panel learn-instructions learning-activity-card category-activity-' + escapeHtml(category.id) + '" aria-labelledby="learn-instructions-title">' +
        '<span class="instruction-icon" aria-hidden="true">👆</span><div><h2 id="learn-instructions-title">Let’s try it together</h2>' +
        '<p>' + escapeHtml(learn.instructions) + '</p></div></section>' +
        '<section class="lesson-objectives learn-objectives learning-activity-card category-activity-' + escapeHtml(category.id) + '" aria-labelledby="learn-objectives-title">' +
        '<h2 id="learn-objectives-title">We will learn to…</h2><ul>' + objectives + '</ul></section></div>' +
        '<section class="learn-examples-panel learning-activity-card category-activity-' + escapeHtml(category.id) + '" aria-labelledby="learn-examples-title">' +
        '<p class="eyebrow">LOOK AND LEARN</p><h2 id="learn-examples-title">Let’s look together</h2>' +
        '<div class="learn-example-list">' + examples + '</div></section></div>' +
        '<section class="learn-next-steps learning-activity-card category-activity-' + escapeHtml(category.id) + '" aria-label="Next learning phases">' +
        '<div class="learn-discover-placeholder ' + (hasCards ? 'is-available' : 'is-unavailable') + '"><span class="learn-phase-number" aria-hidden="true">2</span>' +
        '<div><p class="eyebrow">NEXT PHASE · DISCOVER</p><h2>' + (hasCards ? 'Explore with flashcards' : 'Flashcards are not available yet') + '</h2>' +
        '<p>' + (hasCards ? 'Turn over each card and discover a little more.' : 'You can still try the activity when you are ready.') + '</p></div></div>' +
        '<div class="learn-phase-actions">' + (hasCards
            ? '<button class="button button-quiet" type="button" data-open-discover>Explore flashcards <span aria-hidden="true">→</span></button>'
            : '') +
        '<a class="button button-primary learn-practice-link" href="#activity/' + encodeURIComponent(category.id) + '/' +
        encodeURIComponent(lesson.id) + '" data-screen-link>Try a little activity <span aria-hidden="true">→</span></a></div></section>';
}

function renderDiscover(category, lesson, focusTarget, announcement) {
    const cards = getFlashcards(lesson);
    if (!cards.length) {
        discoverState = null;
        renderLesson(category, lesson);
        return;
    }
    if (!discoverState || discoverState.categoryId !== category.id || discoverState.lessonId !== lesson.id ||
        discoverState.index < 0 || discoverState.index >= cards.length) {
        discoverState = { categoryId: category.id, lessonId: lesson.id, index: 0, revealed: false };
    }

    const card = cards[discoverState.index];
    const view = document.querySelector("[data-lesson-view]");
    const answer = discoverState.revealed
        ? '<section class="discover-answer learning-activity-card category-activity-' + escapeHtml(category.id) + '" aria-labelledby="discover-answer-title"><h2 id="discover-answer-title">Here is what we learned</h2><p>' +
            escapeHtml(card.accessibleText) + '</p></section>'
        : '';
    view.innerHTML = '<div class="discover-heading"><div><p class="eyebrow">' + escapeHtml(category.shortTitle.toUpperCase()) +
        ' · DISCOVER</p><h1 id="discover-card-title" tabindex="-1">' + escapeHtml(card.label) + '</h1>' +
        '<p class="discover-description">' + escapeHtml(card.description) + '</p></div>' +
        '<p class="discover-position" aria-label="Card ' + (discoverState.index + 1) + ' of ' + cards.length + '">Card <strong>' +
        (discoverState.index + 1) + '</strong> of <strong>' + cards.length + '</strong></p></div>' +
        '<article class="discover-card learning-activity-card category-activity-' + escapeHtml(category.id) + '" aria-labelledby="discover-card-title">' + renderFlashcardVisual(card) + answer +
        '<button class="button button-primary discover-reveal" type="button" data-discover-reveal aria-expanded="' +
        String(discoverState.revealed) + '">' + (discoverState.revealed ? 'Hide answer' : 'Reveal answer') + '</button></article>' +
        '<div class="discover-card-controls" role="group" aria-label="Flashcard controls">' +
        '<button class="button button-quiet" type="button" data-discover-previous ' + (discoverState.index === 0 ? 'disabled' : '') + '>Previous card</button>' +
        '<button class="button button-quiet" type="button" data-discover-next ' + (discoverState.index === cards.length - 1 ? 'disabled' : '') + '>Next card</button></div>' +
        '<div class="discover-bottom-actions"><button class="back-link discover-back" type="button" data-return-learn>← Back to Learn</button>' +
        '<a class="button button-primary" href="#activity/' + encodeURIComponent(category.id) + '/' + encodeURIComponent(lesson.id) +
        '" data-screen-link>Continue to Practice <span aria-hidden="true">→</span></a></div>';

    if (focusTarget === "heading") {
        const heading = view.querySelector("#discover-card-title");
        if (heading) heading.focus();
    } else if (focusTarget === "reveal") {
        const revealButton = view.querySelector("[data-discover-reveal]");
        if (revealButton) revealButton.focus();
    }
    if (announcement) announceQuiz(announcement);
}

function renderLesson(category, lesson) {
    if (canRenderLearnData(lesson.learn)) {
        renderLearn(category, lesson);
        return;
    }

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
        '<section class="lesson-objectives learning-activity-card category-activity-' + escapeHtml(category.id) + '" aria-labelledby="lesson-objectives-title">' +
        '<h2 id="lesson-objectives-title">We will learn to…</h2><ul>' + objectives + '</ul></section>' +
        '<div class="instruction-panel learning-activity-card category-activity-' + escapeHtml(category.id) + '"><span class="instruction-icon" aria-hidden="true">👆</span>' +
        '<p><strong>Let’s try it together.</strong><br>' + escapeHtml(lesson.instructions) + '</p></div>' +
        '<a class="button button-primary" href="#activity/' + category.id + '/' + lesson.id + '" data-screen-link>' +
        'Try a little activity <span aria-hidden="true">→</span></a></div>' +
        '<div class="lesson-visual learning-activity-card category-activity-' + escapeHtml(category.id) + '" aria-label="Visual example: ' + escapeHtml(lesson.example.label) + '">' +
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
        '<div class="quiz-panel learning-activity-card category-activity-' + escapeHtml(category.id) + '"><div class="quiz-heading"><span class="quiz-illustration quiz-category-art">' + categoryIllustrationMarkup(category.id) + '</span><div><p class="eyebrow">TAKE YOUR TIME</p><h1>' + escapeHtml(lesson.title) + '</h1><p class="activity-intro">Choose the answer that you think is right.</p></div></div>' +
        '<article class="activity-question learning-activity-card"><p class="question-label">PRACTICE ' + String(state.index + 1).padStart(2,'0') + '</p><h2>' + escapeHtml(question.prompt) + '</h2><p class="question-instruction">' + escapeHtml(question.instruction) + '</p>' +
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
    discoverState = null;
    const category = findCategory(route.categoryId);
    const lesson = findLesson(category, route.lessonId);
    activeLessonContext = route.screen === "lesson" && category && lesson
        ? { categoryId: category.id, lessonId: lesson.id }
        : null;

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
    const openDiscover = event.target.closest("[data-open-discover]");
    if (openDiscover) {
        const category = findCategory(activeLessonContext && activeLessonContext.categoryId);
        const lesson = findLesson(category, activeLessonContext && activeLessonContext.lessonId);
        if (!category || !lesson) return;
        discoverState = { categoryId: category.id, lessonId: lesson.id, index: 0, revealed: false };
        const firstCard = getFlashcards(lesson)[0];
        renderDiscover(category, lesson, "heading", "Discover card 1 of " + getFlashcards(lesson).length + ". " + firstCard.label + ".");
        return;
    }
    const returnToLearn = event.target.closest("[data-return-learn]");
    if (returnToLearn) {
        const category = findCategory(discoverState && discoverState.categoryId);
        const lesson = findLesson(category, discoverState && discoverState.lessonId);
        if (!category || !lesson) return;
        discoverState = null;
        renderLesson(category, lesson);
        const view = document.querySelector("[data-lesson-view]");
        const learnButton = view.querySelector("[data-open-discover]");
        if (learnButton) learnButton.focus();
        announceQuiz("Returned to the Learn phase for " + lesson.title + ".");
        return;
    }
    const revealFlashcard = event.target.closest("[data-discover-reveal]");
    const previousFlashcard = event.target.closest("[data-discover-previous]");
    const nextFlashcard = event.target.closest("[data-discover-next]");
    if (revealFlashcard || previousFlashcard || nextFlashcard) {
        const category = findCategory(discoverState && discoverState.categoryId);
        const lesson = findLesson(category, discoverState && discoverState.lessonId);
        const cards = getFlashcards(lesson);
        if (!category || !lesson || !cards.length || !discoverState) return;
        if (revealFlashcard) {
            discoverState.revealed = !discoverState.revealed;
            const card = cards[discoverState.index];
            renderDiscover(category, lesson, "reveal", discoverState.revealed
                ? card.accessibleText
                : "Answer hidden for " + card.label + ".");
        } else {
            const nextIndex = discoverState.index + (nextFlashcard ? 1 : -1);
            if (nextIndex < 0 || nextIndex >= cards.length) return;
            discoverState.index = nextIndex;
            discoverState.revealed = false;
            const card = cards[nextIndex];
            renderDiscover(category, lesson, "heading", "Card " + (nextIndex + 1) + " of " + cards.length + ". " + card.label + ".");
        }
        return;
    }
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
