export const evaluateCodingSubmission = async ({
  code,
  language = "javascript",
  testCases = []
}) => {
  if (!code) {
    throw new Error("Code is required");
  }

  if (!Array.isArray(testCases)) {
    testCases = [];
  }

  if (testCases.length === 0) {
    return {
      success: true,
      score: 0,
      passed: 0,
      total: 0,
      results: [],
      message: "No test cases provided"
    };
  }

  const results = [];

  for (const testCase of testCases) {
    results.push({
      input: testCase.input ?? "",
      expectedOutput: testCase.expectedOutput ?? "",
      actualOutput: null,
      passed: false,
      status: "pending"
    });
  }

  return {
    success: true,
    score: 0,
    passed: 0,
    total: testCases.length,
    results,
    message: "Coding submission received"
  };
};