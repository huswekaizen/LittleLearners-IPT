# Little Learners — Project Context

> Codebase snapshot reviewed on 2026-11-24. Recheck the source before relying on this document after later changes.

## 1. Project Overview

Little Learners is a browser-based early mathematics learning application. Its current interface is designed for young learners (the product design target is approximately ages 3–8) and emphasizes short, gentle lessons, clear instructions, visual examples, and practice without time pressure. The app does not collect learner identity or use age-specific personalization.

The learning catalog has five categories and ten lessons:

| Category ID | Category | Lesson IDs |
| --- | --- | --- |
| `numbers` | Number Recognition | `number-symbols`, `number-order` |
| `counting` | Counting | `count-objects`, `count-sequence` |
| `addition` | Addition | `join-groups`, `add-to-five` |
| `subtraction` | Subtraction | `take-away`, `subtract-to-five` |
| `shapes` | Shapes | `meet-shapes`, `shapes-around-us` |

The intended reusable learning sequence is **Learn → Discover → Practice → Review**. Learn and Discover are currently data-backed only for the two Counting lessons. Practice is available for all ten lessons. There is no dedicated Review experience yet.

## 2. Technology Stack

- HTML5, CSS3, and plain browser JavaScript. JavaScript is loaded as ordered classic scripts rather than ES modules.
- Browser APIs used include the DOM, hash URLs, History API (`pushState`, `replaceState`, `popstate`), LocalStorage, native `<dialog>`, `crypto.randomUUID()` with a fallback, `Intl.DateTimeFormat`, `matchMedia`, `requestAnimationFrame`, and `scrollTo`.
- Learning progress and accessibility preferences are stored in separate LocalStorage keys (see [Data Structures and Storage](#6-data-structures-and-storage)). There is no server synchronization.
- No backend, database, frontend framework, package manifest, build system, or dependency manager is present in the project root. There is no formal test runner configured.

## 3. Project Structure

```text
index.html
README.md
css/
  style.css
  layout.css
  components.css
  responsive.css
  accessibility.css
js/
  main.js
  navigation.js
  data/
    lessons.js
    questions.js
  features/
    activities.js
    scoring.js
    accessibility.js       # empty placeholder; not loaded
    lessons.js             # empty placeholder; not loaded
    progress.js            # empty placeholder; not loaded
  utils/
    accessibility-preferences.js
    content-validation.js
    storage.js
    validation.js
assets/
  audio/                   # currently empty
  icons/                   # currently empty
  images/                  # currently empty
```

Responsibilities:

- `index.html` is the single-page shell: header, native settings dialog, live announcement region, and the screen containers. It declares script load order.
- `css/style.css` defines theme variables, reset/base typography, header/footer, shared buttons, and screen transitions.
- `css/layout.css` defines screen and page layouts, dashboards, lesson content, activities, results, Learn, and Discover layouts.
- `css/components.css` styles reusable category cards, lesson cards, next-step cards, and some focus states.
- `css/responsive.css` contains layout breakpoints at 800px, 600px, 420px, and 360px.
- `css/accessibility.css` contains skip/focus styles, accessibility dialog and preference presentation, high-contrast rules, and user/system reduced-motion rules.
- `js/data/lessons.js` defines `window.LittleLearnersData.categories` and lesson data.
- `js/data/questions.js` defines `window.LittleLearnersData.questions`, keyed by question ID.
- `js/navigation.js` parses hash routes, renders screen visibility through a custom navigation event, updates active top-level navigation, and manages browser history, route focus, and the mobile menu.
- `js/main.js` is the central screen renderer and click-event coordinator. It renders Dashboard, Explore, My Learning, Category, Lesson/Learn, Discover, Practice, and Results views.
- `js/features/activities.js` owns transient Practice attempt state and answer-selection/submission transitions.
- `js/features/scoring.js` summarizes submitted answers.
- `js/utils/validation.js` checks a selected choice against a question.
- `js/utils/content-validation.js` checks catalog and question references and logs invalid content. `main.js` calls it during initialization; its return value currently does not block rendering.
- `js/utils/storage.js` validates and persists versioned progress, upserts attempts, and derives lesson/category/overall progress.
- `js/utils/accessibility-preferences.js` loads, validates, saves, and applies preferences independently of learning progress. It is loaded synchronously in the document head to apply settings early.
- `js/features/accessibility.js`, `js/features/lessons.js`, and `js/features/progress.js` are zero-byte files and are not included by `index.html`. Current behavior lives in `main.js` and the utilities above; do not assume these placeholders are active modules.
- `README.md` currently contains only a short project description.

## 4. Application Architecture

### Initialization and rendering

`index.html` loads the accessibility preference utility before stylesheets, followed by deferred lesson/question data, content validation, navigation, validation/scoring/activity modules, progress storage, and finally `main.js`. These scripts communicate through properties on `window`.

`navigation.js` calls `parseRoute`, emits `littlelearners:navigate`, and shows the corresponding `[data-screen]` section. `main.js` listens for that event and fills the relevant data container. User-facing catalog strings inserted into HTML should be escaped with the existing `escapeHtml` helper; route components should be encoded when building URLs.

### Routes and browser history

The current route shapes are:

| Route | Purpose |
| --- | --- |
| `#welcome` | Welcome screen |
| `#dashboard` | Progress overview |
| `#explore` | Category directory |
| `#my-learning` | All lessons and learner progress |
| `#category/{categoryId}` | Category and its lessons |
| `#lesson/{categoryId}/{lessonId}` | Lesson screen; Learn/Discover share this route |
| `#activity/{categoryId}/{lessonId}` | Practice activity |
| `#results/{attemptId}` | Results for an attempt |

There is no separate Discover route. Discover is an in-place state in `main.js` while the hash remains the lesson route. Navigating to Practice uses the existing activity route. Route links are handled with History API entries; initial navigation and `popstate` restore screens and active navigation states. Invalid routes are redirected to a safe supported route. Keep these route shapes and category/lesson IDs stable unless a change is explicitly approved.

For top-level navigation, Dashboard is active on Dashboard; Explore is active on Explore and, by default, Category/Lesson/Activity; My Learning is active on My Learning and Results by default. Nested routes can preserve a preferred Explore or My Learning parent using history state.

### Learning flows

- **Explore:** renders category cards from the learning catalog and links to the corresponding category route.
- **My Learning:** renders every catalog category and lesson, status and latest/best saved scores when progress is available, and Start Lesson/Practice Again actions.
- **Learn:** `renderLesson` uses a lesson's optional `learn` structure when it is valid; otherwise it uses the existing lesson content fields. Only `count-objects` and `count-sequence` currently have Learn data.
- **Discover:** `renderDiscover` renders one data-backed flashcard at a time for lessons with flashcards. Card index and reveal state are transient and are not persisted or scored. Previous/Next reset reveal state. Only the two Counting lessons currently have flashcards (two and three cards respectively). Lessons without flashcards retain a usable lesson/Practice path.
- **Practice:** `activities.js` selects the question IDs listed on a lesson and verifies each question's category and lesson association before placing it in the activity. Learners select an answer, submit it once, see feedback, and advance.
- **Results:** `scoring.js` summarizes submitted answers once at completion. The same summary goes to Results and progress storage. Results can resolve from in-memory completion state or the saved attempt ID; an unsaved result cannot survive a reload.

### Scoring, progress, and accessibility

`validation.js` checks that the selected choice exists and compares its ID with `correctChoiceId`. `scoring.js` scores submitted question IDs once, counts correct/incorrect answers, and calculates the percentage against all questions in the lesson activity.

Progress storage is isolated in `storage.js`. It preserves attempts, upserts a repeated attempt ID, and provides helpers for latest/best lesson results and distinct completed lessons. Dashboard and My Learning consume those helpers rather than implementing their own progress formulas.

Accessibility preferences are loaded/applied by their utility and edited through the native dialog. `main.js` applies each setting immediately and reports storage status. The dialog focuses the selected text-size option on open and returns focus to its opener on close. `navigation.js` leaves an open dialog's Escape handling to the native dialog; a following Escape closes the mobile menu. Reduced motion is honored through both the saved root attribute and `prefers-reduced-motion` CSS, and route scrolling also checks the OS preference.

## 5. Current Feature Status

| Feature | Implementation status | Current coverage | Important limitations |
| --- | --- | --- | --- |
| Dashboard | Implemented | Overall distinct lesson completion, percentage, recent latest attempt per lesson, and Continue Learning recommendation | Uses browser-local progress; unavailable/corrupt data is reported, not reconstructed |
| Explore | Implemented | All five catalog categories; links to category screens | Category directory only; no search/filter |
| My Learning | Implemented | All ten catalog lessons; completion status, latest/best saved scores, start/practice actions, category progress | Scores/progress are only available when the progress document is readable |
| Learn | Partially implemented | Data-driven Learn phase for both Counting lessons; legacy lesson screen for remaining lessons | Eight lessons have no optional `learn` content |
| Discover | Partially implemented | Interactive flashcards for both Counting lessons; reveal/hide and previous/next | No card completion tracking; remaining lessons have no cards. Current catalog uses `groups`; renderer/validator also support `symbol` and local `image` forms, but those data paths are not exercised by current catalog content |
| Practice | Implemented | Two questions for each of ten lessons (20 questions total); select/submit, feedback, progression, retry | No question randomization or additional question types |
| Results | Implemented | Score, percentage, correct/incorrect breakdown, retry, and recovery by saved attempt ID | If saving fails, the in-memory result is temporary and a refresh cannot restore it |
| Progress tracking | Implemented | Version 1 LocalStorage attempt history; current-catalog category and overall calculations | Device/browser-local only; no account, cross-device sync, or backend |
| Accessibility | Partially implemented | Text size, high contrast, reduced motion, keyboard/focus handling, native settings dialog, mobile navigation | Not a certified accessibility audit; browser/screen-reader behavior remains to be manually tested |
| Review | Not implemented | None | No dedicated Review screen or review logic exists |

## 6. Data Structures and Storage

### Catalog and lessons

`window.LittleLearnersData.categories` is an array. A category includes an ID, display titles, icon, description, objectives, and `lessons`. A lesson includes its ID/title, introduction, instructions, objectives, a visual example, practice prompt, and `questionIds`. Optional `learn` and `flashcards` fields are used for phased learning content. Preserve IDs because question references, progress keys, and routes use them.

Learn data currently follows this shape:

```js
{
  title,
  introduction,
  instructions,
  objectives: [/* text */],
  examples: [{ id, label, groups: [{ items: [/* strings */], caption, symbolBefore? }] }]
}
```

Flashcards currently use `id`, `label`, `description`, `accessibleText`, `image`, and optional `concept`/`difficulty`. Validated image kinds are:

- `symbol`: `value`, `alt`, optional positive integer `repeat`.
- `image`: relative local `src` and `alt`; external URLs/schemes are rejected by content validation.
- `groups`: visual groups containing string `items`, a text `caption`, and optional `symbolBefore`.

The catalog currently uses only `groups`. No image files are currently present in the `assets/images` directory.

### Questions and activity state

`window.LittleLearnersData.questions` is an object keyed by question ID. Each current question has `id`, `category`, `lessonId`, `correctChoiceId`, `feedback.correct`, `feedback.incorrect`, `prompt`, `instruction`, `visualDescription`, `groups`, and `choices`. Choices have unique IDs within their question and labels. Lesson `questionIds` define which questions belong to each lesson. There are currently two questions per lesson.

`activities.js` keeps the current activity in memory. Its state includes `attemptId`, category/lesson references, questions, current index, selected choice, submitted answer records, and completion state. A new activity/retry generates a new ID. Do not add persistence to this temporary state; completion summary and progress storage are separate responsibilities.

### Progress LocalStorage

- Key: `littleLearners.progress`
- Schema version: `1`
- Empty document: `{ schemaVersion: 1, updatedAt, lessons: {} }`
- `lessons` is keyed by `"{categoryId}/{lessonId}"`. Each lesson record stores `categoryId`, `lessonId`, and an `attempts` array.
- Each attempt stores `attemptId`, `completedAt`, `totalQuestions`, `correctAnswers`, `incorrectAnswers`, `score`, and `percentage`.

The storage utility initializes a missing document, validates records before reading/writing, does not overwrite malformed/invalid or newer unsupported versions, and reports unavailable storage. A lesson is completed if at least one attempt was saved. Attempts are retained; repeating the same attempt ID updates that attempt rather than adding a duplicate. Latest/best/category/overall values are derived by helpers in `storage.js`.

### Accessibility preference LocalStorage

- Key: `littleLearners.accessibility`
- Schema version: `1`
- Structure: `{ schemaVersion: 1, textSize: "default" | "larger" | "largest", highContrast: boolean, reduceMotion: boolean }`

This document is separate from progress. Invalid or unsupported preference data is not automatically overwritten. Preferences are applied to `document.documentElement` data attributes; system reduced-motion preference remains authoritative through CSS and navigation scroll behavior.

## 7. Important Architectural Decisions and Constraints

- Keep educational catalog data in `js/data/lessons.js` and questions in `js/data/questions.js`; render from those sources rather than duplicating content in UI logic.
- Preserve all current category, lesson, and question IDs and the route formats above.
- Questions must continue to match their lesson and category references. Use lesson `questionIds` as the relationship source.
- Keep activity state, answer validation, scoring, and persistent storage separate. Use `LittleLearnersScoring.summarize` for scoring and pass the resulting summary to storage; storage must not recalculate scores.
- Keep progress schema v1 and accessibility schema v1/key separate. A storage format change requires an explicit migration/versioning plan; never silently overwrite unreadable or newer data.
- Escape dynamic display content with `escapeHtml` before inserting it into HTML. Encode dynamic route segments. Avoid treating catalog strings as trusted HTML.
- Prefer semantic links for route changes and buttons for in-place actions. Preserve keyboard focus visibility, screen-reader announcements, route heading focus, and native dialog behavior.
- Retain the user's saved reduced-motion preference and the operating-system `prefers-reduced-motion` support.
- Flashcard local images must remain local assets. Do not add external image dependencies or remote image URLs.
- Stay frontend-only. Do not add frameworks, backend services, databases, dependencies, or build tooling without explicit authorization.
- Keep new category learning coverage data-driven and incremental; do not change quiz, progress, or preference schemas as a side effect of content work.

## 8. Testing and Known Limitations

- No package manifest, test runner, or committed automated test suite is present.
- The project does include a runtime content validator in `js/utils/content-validation.js`, invoked by `main.js`; it logs data/reference errors but does not currently prevent application startup.
- During this context review, `node --check` passed for all 13 JavaScript files. Running the content validator against the current lesson catalog and question map returned valid. These are syntax/content checks, not a browser test suite.
- No browser/device, visual, keyboard-only, or screen-reader test was performed for this context document. Do not infer those results from source inspection.
- LocalStorage can be unavailable or cleared by the browser/user. There is no cross-device recovery.
- When saving a completed attempt fails, Results can render from in-memory state, but the attempt cannot be restored after refresh.
- Learn/Discover coverage is limited to Counting. Review does not exist. Other image renderer variants are not represented in the current catalog.
- The app relies on native `<dialog>` support for opening settings; `main.js` checks for `showModal`, but no polyfill/fallback dialog implementation is present.
- The app is a single-page implementation with substantial screen-rendering logic in `js/main.js`; the empty feature modules are not currently an alternate architecture.

## 9. Development Roadmap

The intended flow remains **Learn → Discover → Practice → Review**, but the first two phases are only populated for Counting and Review is absent. Before expanding content to other categories, prioritize:

1. Audit lesson and question content across the catalog.
2. Evaluate question quality, age appropriateness, and educational coverage.
3. Review Practice state handling and edge cases.
4. Establish consistent, validated Learn and Discover structures across categories.
5. Plan a meaningful Review experience that does not duplicate Practice or scoring.
6. Preserve existing progress and accessibility behavior as content coverage grows.

This is a direction, not a commitment to implement these items without approval.

## 10. Instructions for Future AI Coding Agents

- Read `PROJECT_CONTEXT.md` before substantial work, then inspect the relevant source files; this document is a snapshot, not a substitute for source verification.
- Prefer small, scoped changes that reuse the existing architecture and data.
- Avoid unnecessary abstractions, dependencies, frameworks, and unrelated redesigns.
- Do not change lesson/question IDs, route formats, scoring formulas, progress storage, or accessibility preference schema unless explicitly authorized.
- Preserve existing behavior unless the task explicitly asks to change it.
- Run relevant JavaScript syntax, content-validation, and regression checks where available. Distinguish automated/source-level checks from actual browser, visual, device, and screen-reader testing.
- Report modified files, implementation decisions, checks and their results, and anything not verified.
- Update this document when significant architecture, data contracts, storage schemas, or feature coverage changes.
