window.LittleLearnersData = {
    categories: [
        {
            id: "numbers",
            title: "Number recognition",
            shortTitle: "Numbers",
            icon: "🔢",
            description: "Numbers are symbols that tell us how many. Learn to spot them, say their names, and match them to groups.",
            objectives: [
                "Recognize the written numbers 1 to 5.",
                "Match a number symbol to a group of objects.",
                "Notice which number comes next in a short sequence."
            ],
            lessons: [
                {
                    id: "number-symbols",
                    title: "Meet the numbers",
                    introduction: "Numbers have their own shapes and names. Let’s meet 1, 2, and 3.",
                    instructions: "Look at each written number. Count the stars beside it to see what the number tells us.",
                    objectives: ["Name the numbers 1, 2, and 3.", "Match a number symbol to the same number of stars."],
                    example: {
                        label: "A number and its group",
                        groups: [
                            { items: ["1"], caption: "Number one" },
                            { items: ["⭐"], caption: "One star" },
                            { items: ["3"], caption: "Number three" },
                            { items: ["⭐", "⭐", "⭐"], caption: "Three stars" }
                        ]
                    },
                    practicePrompt: "Point to the number that matches two dots.",
                    questionIds: ["number-symbols-one", "number-symbols-two"]
                },
                {
                    id: "number-order",
                    title: "Numbers in a row",
                    introduction: "Numbers like to stay in order. Let’s look at the numbers from 1 to 5.",
                    instructions: "Say each number as you point to it, starting at 1 and moving one step at a time.",
                    objectives: ["Read the numbers 1 to 5 in order.", "Find the number that comes after another number."],
                    example: {
                        label: "Count along the number path",
                        groups: [
                            { items: ["1", "2", "3", "4", "5"], caption: "One, two, three, four, five" }
                        ]
                    },
                    practicePrompt: "Start at 1 and point to the number that comes after 3.",
                    questionIds: ["number-order-one", "number-order-two"]
                }
            ]
        },
        {
            id: "counting",
            title: "Counting",
            shortTitle: "Counting",
            icon: "🍓",
            description: "Count one object at a time, keep track of what you have counted, and find the total.",
            objectives: [
                "Count a group of objects one by one.",
                "Touch or point to each object only once.",
                "Say the total after counting a group."
            ],
            lessons: [
                {
                    id: "count-objects",
                    title: "Count the apples",
                    introduction: "When we count, each object gets one number. Let’s count these apples together.",
                    instructions: "Point to one apple for each number you say. Stop when you have pointed to every apple.",
                    objectives: ["Count each object once.", "Tell how many objects are in the group."],
                    example: {
                        label: "One number for each apple",
                        groups: [
                            { items: ["🍎", "🍎", "🍎", "🍎", "🍎"], caption: "Five apples" }
                        ]
                    },
                    practicePrompt: "Point to the apples one at a time. How many are there?",
                    learn: {
                        title: "Count each object once",
                        introduction: "When we count, we say one number for each object. We touch or point to each object one time.",
                        instructions: "Point to one apple at a time. Say 1, 2, 3, 4. Stop when each apple has a number.",
                        objectives: [
                            "Match one number to each object.",
                            "Count each object only once.",
                            "Say how many objects there are altogether."
                        ],
                        examples: [
                            {
                                id: "apple-one-to-one",
                                label: "One number for each apple",
                                groups: [
                                    { items: ["🍎", "🍎", "🍎", "🍎"], caption: "Point once to each of the four apples." }
                                ]
                            },
                            {
                                id: "blocks-one-to-one",
                                label: "Count three toy blocks",
                                groups: [
                                    { items: ["🧱", "🧱", "🧱"], caption: "Say one, two, three as you point." }
                                ]
                            }
                        ]
                    },
                    flashcards: [
                        {
                            id: "apple-count-once",
                            label: "One number for each apple",
                            description: "Point to each apple once as you count.",
                            accessibleText: "Four apples in a row. Point to each apple one time and say one, two, three, four.",
                            image: {
                                kind: "groups",
                                groups: [{ items: ["🍎", "🍎", "🍎", "🍎"], caption: "Four apples. Count each one once." }]
                            },
                            concept: "one-to-one counting",
                            difficulty: "beginner"
                        },
                        {
                            id: "star-count-total",
                            label: "The last number tells how many",
                            description: "Count each star once. The last number is the total.",
                            accessibleText: "Five stars in one group. Count one, two, three, four, five. There are five stars altogether.",
                            image: {
                                kind: "groups",
                                groups: [{ items: ["⭐", "⭐", "⭐", "⭐", "⭐"], caption: "Five stars altogether." }]
                            },
                            concept: "cardinality",
                            difficulty: "beginner"
                        }
                    ],
                    questionIds: ["count-objects-one", "count-objects-two"]
                },
                {
                    id: "count-sequence",
                    title: "Keep the count going",
                    introduction: "Counting numbers follow a pattern. Each number is one more than the number before it.",
                    instructions: "Start at 1. Say the next number each time you move one step along the path.",
                    objectives: ["Follow the count from 1 to 5.", "Find a missing number in a short sequence."],
                    example: {
                        label: "Take one step at a time",
                        groups: [
                            { items: ["1", "2", "3", "4", "5"], caption: "Each step adds one" }
                        ]
                    },
                    practicePrompt: "Say 1, 2, 3. What number comes next?",
                    learn: {
                        title: "Numbers go in order",
                        introduction: "Counting numbers have a steady order. Each new step is one more than the step before.",
                        instructions: "Start at 1. Point to each number and say it in order. Find the number that comes next.",
                        objectives: [
                            "Say the numbers from 1 to 5 in order.",
                            "Find the number that comes after another number.",
                            "Find a missing number in a short count."
                        ],
                        examples: [
                            {
                                id: "number-path-one-to-five",
                                label: "Take one counting step at a time",
                                groups: [
                                    { items: ["1", "2", "3", "4", "5"], caption: "Each number comes after the one before it." }
                                ]
                            },
                            {
                                id: "missing-three",
                                label: "Find the missing number",
                                groups: [
                                    { items: ["1", "2", "?", "4", "5"], caption: "Three comes after two and before four." }
                                ]
                            }
                        ]
                    },
                    flashcards: [
                        {
                            id: "counting-path",
                            label: "Numbers from one to five",
                            description: "Follow the numbers one step at a time.",
                            accessibleText: "Five numbers in a row: one, two, three, four, five. Each number is one step after the number before it.",
                            image: {
                                kind: "groups",
                                groups: [{ items: ["1", "2", "3", "4", "5"], caption: "One, two, three, four, five." }]
                            },
                            concept: "counting order",
                            difficulty: "beginner"
                        },
                        {
                            id: "one-more-after-three",
                            label: "What comes after three?",
                            description: "Count one more step after three.",
                            accessibleText: "The number three points to the number four. Four comes after three in the counting order.",
                            image: {
                                kind: "groups",
                                groups: [
                                    { items: ["3"], caption: "Three" },
                                    { symbolBefore: "→", items: ["4"], caption: "One more: four" }
                                ]
                            },
                            concept: "next number",
                            difficulty: "beginner"
                        },
                        {
                            id: "missing-number-three",
                            label: "Fill the number gap",
                            description: "Find the number between two and four.",
                            accessibleText: "The row shows one, two, a blank, four, five. Three belongs in the blank between two and four.",
                            image: {
                                kind: "groups",
                                groups: [{ items: ["1", "2", "?", "4", "5"], caption: "Three fills the gap." }]
                            },
                            concept: "missing number",
                            difficulty: "beginner"
                        }
                    ],
                    questionIds: ["count-sequence-one", "count-sequence-two"]
                }
            ]
        },
        {
            id: "addition",
            title: "Addition",
            shortTitle: "Addition",
            icon: "➕",
            description: "Addition means putting groups together. The plus sign (+) tells us to join the groups.",
            objectives: [
                "Understand addition as joining groups.",
                "Recognize the plus sign (+).",
                "Find the total in simple addition examples."
            ],
            lessons: [
                {
                    id: "join-groups",
                    title: "Put groups together",
                    introduction: "When we add, we join groups to find how many there are altogether.",
                    instructions: "Count the first group, then count the next group. Put them together and count all of them.",
                    objectives: ["Join two small groups.", "Read the plus sign (+) as “and some more.”"],
                    example: {
                        label: "Two apples and three more",
                        groups: [
                            { items: ["🍎", "🍎"], caption: "Two apples" },
                            { symbolBefore: "+", items: [], caption: "plus" },
                            { items: ["🍎", "🍎", "🍎"], caption: "Three more" },
                            { symbolBefore: "=", items: ["🍎", "🍎", "🍎", "🍎", "🍎"], caption: "Five apples altogether" }
                        ]
                    },
                    practicePrompt: "Count one button, then two more buttons. How many buttons altogether?",
                    questionIds: ["join-groups-one", "join-groups-two"]
                },
                {
                    id: "add-to-five",
                    title: "Add small numbers",
                    introduction: "We can add small numbers by counting the objects in both groups.",
                    instructions: "Look at the number in each group. Count all the dots to find the total.",
                    objectives: ["Solve addition examples with totals up to 5.", "Connect an addition sentence to a group of objects."],
                    example: {
                        label: "One plus two makes three",
                        groups: [
                            { items: ["●"], caption: "One" },
                            { symbolBefore: "+", items: [], caption: "plus" },
                            { items: ["●", "●"], caption: "Two" },
                            { symbolBefore: "=", items: ["●", "●", "●"], caption: "Three altogether" }
                        ]
                    },
                    practicePrompt: "Use dots or fingers to work out 2 + 2.",
                    questionIds: ["add-to-five-one", "add-to-five-two"]
                }
            ]
        },
        {
            id: "subtraction",
            title: "Subtraction",
            shortTitle: "Subtraction",
            icon: "🧺",
            description: "Subtraction means taking some away from a group. The minus sign (−) shows what is taken away.",
            objectives: [
                "Understand subtraction as taking away.",
                "Recognize the minus sign (−).",
                "Find how many are left in simple examples."
            ],
            lessons: [
                {
                    id: "take-away",
                    title: "Take some away",
                    introduction: "When we subtract, we start with a group and take some away. Then we count what is left.",
                    instructions: "Look at all five apples. Imagine taking two away. Count the apples that stay.",
                    objectives: ["Take a smaller group away from a larger group.", "Tell how many are left."],
                    example: {
                        label: "Five apples, take away two",
                        groups: [
                            { items: ["🍎", "🍎", "🍎", "🍎", "🍎"], caption: "Five apples" },
                            { symbolBefore: "−", items: ["🍎", "🍎"], caption: "Take away two" },
                            { symbolBefore: "=", items: ["🍎", "🍎", "🍎"], caption: "Three apples left" }
                        ]
                    },
                    practicePrompt: "Imagine taking one star away from a group of four. How many stay?",
                    questionIds: ["take-away-one", "take-away-two"]
                },
                {
                    id: "subtract-to-five",
                    title: "Count what is left",
                    introduction: "The minus sign (−) is a reminder that some objects are going away.",
                    instructions: "Start with the first number of dots. Take away the number after the minus sign, then count the dots left.",
                    objectives: ["Read the minus sign (−) in a number sentence.", "Solve take-away examples with small numbers."],
                    example: {
                        label: "Four take away one",
                        groups: [
                            { items: ["●", "●", "●", "●"], caption: "Four dots" },
                            { symbolBefore: "−", items: ["●"], caption: "Take away one" },
                            { symbolBefore: "=", items: ["●", "●", "●"], caption: "Three dots left" }
                        ]
                    },
                    practicePrompt: "Show 3 fingers. Fold one down. How many fingers are still up?",
                    questionIds: ["subtract-to-five-one", "subtract-to-five-two"]
                }
            ]
        },
        {
            id: "shapes",
            title: "Shapes",
            shortTitle: "Shapes",
            icon: "🔷",
            description: "Shapes are all around us. Look at their sides and corners to tell circles, squares, triangles, and rectangles apart.",
            objectives: [
                "Recognize circles, squares, triangles, and rectangles.",
                "Notice simple shape features like sides and corners.",
                "Find shapes in familiar everyday objects."
            ],
            lessons: [
                {
                    id: "meet-shapes",
                    title: "Meet four shapes",
                    introduction: "Shapes can look different from one another. Let’s meet four shapes we see often.",
                    instructions: "Look at the outline of each shape. Notice which ones have straight sides and which one is round.",
                    objectives: ["Name a circle, square, triangle, and rectangle.", "Notice that shapes have different outlines."],
                    example: {
                        label: "Four shapes to spot",
                        groups: [
                            { items: ["●"], caption: "Circle · round" },
                            { items: ["■"], caption: "Square · four equal sides" },
                            { items: ["▲"], caption: "Triangle · three sides" },
                            { items: ["▬"], caption: "Rectangle · four sides" }
                        ]
                    },
                    practicePrompt: "Point to the shape with three straight sides.",
                    questionIds: ["meet-shapes-one", "meet-shapes-two"]
                },
                {
                    id: "shapes-around-us",
                    title: "Shapes all around us",
                    introduction: "We can find shapes in everyday things at home, at school, and outside.",
                    instructions: "Look at each shape, then think of an object that has a similar outline.",
                    objectives: ["Match a familiar object to a shape.", "Describe a simple feature of a shape."],
                    example: {
                        label: "Shapes we see each day",
                        groups: [
                            { items: ["●"], caption: "A clock looks like a circle" },
                            { items: ["■"], caption: "A window can look like a square" },
                            { items: ["▲"], caption: "A roof can look like a triangle" },
                            { items: ["▬"], caption: "A door can look like a rectangle" }
                        ]
                    },
                    practicePrompt: "Look around you. Can you find something shaped like a rectangle?",
                    questionIds: ["shapes-around-us-one", "shapes-around-us-two"]
                }
            ]
        }
    ]
};
