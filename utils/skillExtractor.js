const skillDictionary = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C",
  "C++",
  "HTML",
  "CSS",
  "React",
  "Next.js",
  "Node.js",
  "Express.js",
  "MongoDB",
  "MySQL",
  "PostgreSQL",
  "Git",
  "GitHub",
  "Docker",
  "AWS",
  "REST API",
  "Socket.IO",
  "WebSocket",
  "Machine Learning",
  "Deep Learning",
  "TensorFlow",
  "PyTorch",
  "Pandas",
  "NumPy",
  "scikit-learn",
  "OpenCV",
  "FastAPI",
  "Flask",
  "SQL",
  "NoSQL"
];

export const extractSkills = (text) => {
  const normalizedText = text.toLowerCase();

  const skills = [];

  for (const skill of skillDictionary) {
    if (
      normalizedText.includes(
        skill.toLowerCase()
      )
    ) {
      skills.push(skill);
    }
  }

  return skills;
};