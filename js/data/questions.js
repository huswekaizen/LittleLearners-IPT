window.LittleLearnersData.questions = {
    "number-symbols-one": {
        id: "number-symbols-one", category: "numbers", lessonId: "number-symbols",
        correctChoiceId: "number-symbols-one-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is 2. Let’s try the next one." },
        prompt: "Which number matches these stars?",
        instruction: "Count the stars, then choose a number.",
        visualDescription: "Two stars",
        groups: [{ items: ["⭐", "⭐"], caption: "Two stars" }],
        choices: [{ id: "number-symbols-one-choice-1", label: "1" }, { id: "number-symbols-one-choice-2", label: "2" }, { id: "number-symbols-one-choice-3", label: "3" }]
    },
    "number-symbols-two": {
        id: "number-symbols-two", category: "numbers", lessonId: "number-symbols",
        correctChoiceId: "number-symbols-two-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is 4. Let’s try the next one." },
        prompt: "How many dots do you see?",
        instruction: "Look at the dots and find the number that tells how many.",
        visualDescription: "Four dots",
        groups: [{ items: ["●", "●", "●", "●"], caption: "Four dots" }],
        choices: [{ id: "number-symbols-two-choice-1", label: "3" }, { id: "number-symbols-two-choice-2", label: "4" }, { id: "number-symbols-two-choice-3", label: "5" }]
    },
    "number-order-one": {
        id: "number-order-one", category: "numbers", lessonId: "number-order",
        correctChoiceId: "number-order-one-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is 3. Let’s try the next one." },
        prompt: "Which number comes after 2?",
        instruction: "Say the numbers in order: 1, 2, ...",
        visualDescription: "Number sequence one, two, then a question mark",
        groups: [{ items: ["1", "2", "?"], caption: "What comes next?" }],
        choices: [{ id: "number-order-one-choice-1", label: "1" }, { id: "number-order-one-choice-2", label: "3" }, { id: "number-order-one-choice-3", label: "4" }]
    },
    "number-order-two": {
        id: "number-order-two", category: "numbers", lessonId: "number-order",
        correctChoiceId: "number-order-two-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is 4. Let’s try the next one." },
        prompt: "Which number comes before 5?",
        instruction: "Count backward one small step from 5.",
        visualDescription: "Number sequence with a missing number before 5",
        groups: [{ items: ["3", "?", "5"], caption: "Find the missing number" }],
        choices: [{ id: "number-order-two-choice-1", label: "2" }, { id: "number-order-two-choice-2", label: "4" }, { id: "number-order-two-choice-3", label: "6" }]
    },
    "count-objects-one": {
        id: "count-objects-one", category: "counting", lessonId: "count-objects",
        correctChoiceId: "count-objects-one-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is 4. Let’s try the next one." },
        prompt: "How many apples are there?",
        instruction: "Point to each apple once as you count.",
        visualDescription: "Four apples",
        groups: [{ items: ["🍎", "🍎", "🍎", "🍎"], caption: "Count the apples" }],
        choices: [{ id: "count-objects-one-choice-1", label: "3" }, { id: "count-objects-one-choice-2", label: "4" }, { id: "count-objects-one-choice-3", label: "5" }]
    },
    "count-objects-two": {
        id: "count-objects-two", category: "counting", lessonId: "count-objects",
        correctChoiceId: "count-objects-two-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is 5. Let’s try the next one." },
        prompt: "How many stars are in the group?",
        instruction: "Count each star one time.",
        visualDescription: "Five stars",
        groups: [{ items: ["⭐", "⭐", "⭐", "⭐", "⭐"], caption: "Count the stars" }],
        choices: [{ id: "count-objects-two-choice-1", label: "4" }, { id: "count-objects-two-choice-2", label: "5" }, { id: "count-objects-two-choice-3", label: "6" }]
    },
    "count-sequence-one": {
        id: "count-sequence-one", category: "counting", lessonId: "count-sequence",
        correctChoiceId: "count-sequence-one-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is 4. Let’s try the next one." },
        prompt: "What number comes after 3?",
        instruction: "Keep counting from 1: 1, 2, 3, ...",
        visualDescription: "Number sequence one, two, three, then a question mark",
        groups: [{ items: ["1", "2", "3", "?"], caption: "Keep the count going" }],
        choices: [{ id: "count-sequence-one-choice-1", label: "2" }, { id: "count-sequence-one-choice-2", label: "4" }, { id: "count-sequence-one-choice-3", label: "5" }]
    },
    "count-sequence-two": {
        id: "count-sequence-two", category: "counting", lessonId: "count-sequence",
        correctChoiceId: "count-sequence-two-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is 3. Let’s try the next one." },
        prompt: "Which number is missing?",
        instruction: "Look at the count from 1 to 5.",
        visualDescription: "Number sequence one, two, blank, four, five",
        groups: [{ items: ["1", "2", "?", "4", "5"], caption: "Find the missing number" }],
        choices: [{ id: "count-sequence-two-choice-1", label: "2" }, { id: "count-sequence-two-choice-2", label: "3" }, { id: "count-sequence-two-choice-3", label: "4" }]
    },
    "join-groups-one": {
        id: "join-groups-one", category: "addition", lessonId: "join-groups",
        correctChoiceId: "join-groups-one-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is 3. Let’s try the next one." },
        prompt: "Two apples join one more. How many apples altogether?",
        instruction: "Count both groups together.",
        visualDescription: "Two apples and one apple",
        groups: [
            { items: ["🍎", "🍎"], caption: "Two apples" },
            { symbolBefore: "+", items: ["🍎"], caption: "One more" }
        ],
        choices: [{ id: "join-groups-one-choice-1", label: "2" }, { id: "join-groups-one-choice-2", label: "3" }, { id: "join-groups-one-choice-3", label: "4" }]
    },
    "join-groups-two": {
        id: "join-groups-two", category: "addition", lessonId: "join-groups",
        correctChoiceId: "join-groups-two-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is 4. Let’s try the next one." },
        prompt: "One apple joins three more. How many are there now?",
        instruction: "Put the groups together, then count.",
        visualDescription: "One apple and three apples",
        groups: [
            { items: ["🍎"], caption: "One apple" },
            { symbolBefore: "+", items: ["🍎", "🍎", "🍎"], caption: "Three more" }
        ],
        choices: [{ id: "join-groups-two-choice-1", label: "3" }, { id: "join-groups-two-choice-2", label: "4" }, { id: "join-groups-two-choice-3", label: "5" }]
    },
    "add-to-five-one": {
        id: "add-to-five-one", category: "addition", lessonId: "add-to-five",
        correctChoiceId: "add-to-five-one-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is 4. Let’s try the next one." },
        prompt: "What is 2 + 2?",
        instruction: "Count two dots, then two more dots.",
        visualDescription: "Two dots plus two dots",
        groups: [
            { items: ["●", "●"], caption: "Two" },
            { symbolBefore: "+", items: ["●", "●"], caption: "Two more" }
        ],
        choices: [{ id: "add-to-five-one-choice-1", label: "3" }, { id: "add-to-five-one-choice-2", label: "4" }, { id: "add-to-five-one-choice-3", label: "5" }]
    },
    "add-to-five-two": {
        id: "add-to-five-two", category: "addition", lessonId: "add-to-five",
        correctChoiceId: "add-to-five-two-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is 4. Let’s try the next one." },
        prompt: "What is 1 + 3?",
        instruction: "Join the one dot and the three dots.",
        visualDescription: "One dot plus three dots",
        groups: [
            { items: ["●"], caption: "One" },
            { symbolBefore: "+", items: ["●", "●", "●"], caption: "Three more" }
        ],
        choices: [{ id: "add-to-five-two-choice-1", label: "3" }, { id: "add-to-five-two-choice-2", label: "4" }, { id: "add-to-five-two-choice-3", label: "5" }]
    },
    "take-away-one": {
        id: "take-away-one", category: "subtraction", lessonId: "take-away",
        correctChoiceId: "take-away-one-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is 3. Let’s try the next one." },
        prompt: "Five apples. Take two away. How many stay?",
        instruction: "Imagine moving two apples away, then count what is left.",
        visualDescription: "Five apples minus two apples",
        groups: [
            { items: ["🍎", "🍎", "🍎", "🍎", "🍎"], caption: "Five apples" },
            { symbolBefore: "−", items: ["🍎", "🍎"], caption: "Take away two" }
        ],
        choices: [{ id: "take-away-one-choice-1", label: "2" }, { id: "take-away-one-choice-2", label: "3" }, { id: "take-away-one-choice-3", label: "4" }]
    },
    "take-away-two": {
        id: "take-away-two", category: "subtraction", lessonId: "take-away",
        correctChoiceId: "take-away-two-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is 3. Let’s try the next one." },
        prompt: "Four balloons. One floats away. How many are left?",
        instruction: "Start with four, then take away one.",
        visualDescription: "Four balloons minus one balloon",
        groups: [
            { items: ["🎈", "🎈", "🎈", "🎈"], caption: "Four balloons" },
            { symbolBefore: "−", items: ["🎈"], caption: "One floats away" }
        ],
        choices: [{ id: "take-away-two-choice-1", label: "2" }, { id: "take-away-two-choice-2", label: "3" }, { id: "take-away-two-choice-3", label: "4" }]
    },
    "subtract-to-five-one": {
        id: "subtract-to-five-one", category: "subtraction", lessonId: "subtract-to-five",
        correctChoiceId: "subtract-to-five-one-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is 3. Let’s try the next one." },
        prompt: "What is 4 − 1?",
        instruction: "Take one dot away from the group of four.",
        visualDescription: "Four dots minus one dot",
        groups: [
            { items: ["●", "●", "●", "●"], caption: "Four" },
            { symbolBefore: "−", items: ["●"], caption: "Take away one" }
        ],
        choices: [{ id: "subtract-to-five-one-choice-1", label: "2" }, { id: "subtract-to-five-one-choice-2", label: "3" }, { id: "subtract-to-five-one-choice-3", label: "4" }]
    },
    "subtract-to-five-two": {
        id: "subtract-to-five-two", category: "subtraction", lessonId: "subtract-to-five",
        correctChoiceId: "subtract-to-five-two-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is 3. Let’s try the next one." },
        prompt: "What is 5 − 2?",
        instruction: "Start with five dots and take two away.",
        visualDescription: "Five dots minus two dots",
        groups: [
            { items: ["●", "●", "●", "●", "●"], caption: "Five" },
            { symbolBefore: "−", items: ["●", "●"], caption: "Take away two" }
        ],
        choices: [{ id: "subtract-to-five-two-choice-1", label: "2" }, { id: "subtract-to-five-two-choice-2", label: "3" }, { id: "subtract-to-five-two-choice-3", label: "4" }]
    },
    "meet-shapes-one": {
        id: "meet-shapes-one", category: "shapes", lessonId: "meet-shapes",
        correctChoiceId: "meet-shapes-one-choice-2",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is Triangle. Let’s try the next one." },
        prompt: "Which shape has three straight sides?",
        instruction: "Look at the shape outlines.",
        visualDescription: "A circle, square, triangle, and rectangle",
        groups: [
            { items: ["●"], caption: "Circle" },
            { items: ["■"], caption: "Square" },
            { items: ["▲"], caption: "Triangle" },
            { items: ["▬"], caption: "Rectangle" }
        ],
        choices: [{ id: "meet-shapes-one-choice-1", label: "Circle", symbol: "●" }, { id: "meet-shapes-one-choice-2", label: "Triangle", symbol: "▲" }, { id: "meet-shapes-one-choice-3", label: "Rectangle", symbol: "▬" }]
    },
    "meet-shapes-two": {
        id: "meet-shapes-two", category: "shapes", lessonId: "meet-shapes",
        correctChoiceId: "meet-shapes-two-choice-1",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is Circle. Let’s try the next one." },
        prompt: "Which shape is round and has no corners?",
        instruction: "Find the shape with a curved outline.",
        visualDescription: "A circle, square, and triangle",
        groups: [
            { items: ["●"], caption: "Circle" },
            { items: ["■"], caption: "Square" },
            { items: ["▲"], caption: "Triangle" }
        ],
        choices: [{ id: "meet-shapes-two-choice-1", label: "Circle", symbol: "●" }, { id: "meet-shapes-two-choice-2", label: "Square", symbol: "■" }, { id: "meet-shapes-two-choice-3", label: "Triangle", symbol: "▲" }]
    },
    "shapes-around-us-one": {
        id: "shapes-around-us-one", category: "shapes", lessonId: "shapes-around-us",
        correctChoiceId: "shapes-around-us-one-choice-1",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is Circle. Let’s try the next one." },
        prompt: "A clock face is often shaped like which shape?",
        instruction: "Think about the outline around a round clock.",
        visualDescription: "A circle shape beside a clock",
        groups: [{ items: ["●", "🕒"], caption: "Circle and clock" }],
        choices: [{ id: "shapes-around-us-one-choice-1", label: "Circle", symbol: "●" }, { id: "shapes-around-us-one-choice-2", label: "Square", symbol: "■" }, { id: "shapes-around-us-one-choice-3", label: "Triangle", symbol: "▲" }]
    },
    "shapes-around-us-two": {
        id: "shapes-around-us-two", category: "shapes", lessonId: "shapes-around-us",
        correctChoiceId: "shapes-around-us-two-choice-3",
        feedback: { correct: "That is right! Great thinking.", incorrect: "That is okay. The correct answer is Rectangle. Let’s try the next one." },
        prompt: "Which shape looks most like a door?",
        instruction: "Think about the tall, straight sides of a door.",
        visualDescription: "A rectangle shape beside a door",
        groups: [{ items: ["▬", "🚪"], caption: "Rectangle and door" }],
        choices: [{ id: "shapes-around-us-two-choice-1", label: "Circle", symbol: "●" }, { id: "shapes-around-us-two-choice-2", label: "Triangle", symbol: "▲" }, { id: "shapes-around-us-two-choice-3", label: "Rectangle", symbol: "▬" }]
    }
};