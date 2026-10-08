const MAX_REPOSITORIES = 10;
const MAX_FILES_PER_REPOSITORY = 10;
const MAX_FILE_CONTENT = 10000;

const ignoredFiles = [
  ".env",
  ".env.local",
  ".env.production",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml"
];

const ignoredExtensions = [
  ".csv",
  ".xlsx",
  ".xls",
  ".zip",
  ".rar",
  ".7z",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".mp4",
  ".mp3",
  ".pdf",
  ".doc",
  ".docx",
  ".pkl",
  ".joblib",
  ".h5",
  ".pt",
  ".pth"
];

const ignoredDirectories = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage"
];

const isUsefulFile = (path) => {
  const lowerPath = path.toLowerCase();

  if (
    ignoredFiles.some(
      (file) => lowerPath === file.toLowerCase()
    )
  ) {
    return false;
  }

  if (
    ignoredDirectories.some(
      (directory) =>
        lowerPath.includes(`${directory}/`) ||
        lowerPath.startsWith(`${directory}/`)
    )
  ) {
    return false;
  }

  if (
    ignoredExtensions.some((extension) =>
      lowerPath.endsWith(extension)
    )
  ) {
    return false;
  }

  return true;
};

const getHeaders = () => {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
};

export const getGithubUsername = (githubUrl) => {
  try {
    const url = new URL(githubUrl);

    if (url.hostname !== "github.com") {
      throw new Error("Invalid GitHub URL");
    }

    const parts = url.pathname
      .split("/")
      .filter(Boolean);

    if (!parts[0]) {
      throw new Error("GitHub username not found");
    }

    return parts[0];
  } catch (error) {
    throw new Error("Invalid GitHub profile URL");
  }
};

export const getGithubRepositories = async (username) => {
  const response = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
    {
      headers: getHeaders()
    }
  );

  if (!response.ok) {
    throw new Error("Unable to fetch GitHub repositories");
  }

  return response.json();
};

const getRepositoryTree = async (
  username,
  repository,
  branch
) => {
  const response = await fetch(
    `https://api.github.com/repos/${username}/${repository}/git/trees/${branch}?recursive=1`,
    {
      headers: getHeaders()
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  return data.tree || [];
};

const getFileContent = async (
  username,
  repository,
  path
) => {
  const response = await fetch(
    `https://api.github.com/repos/${username}/${repository}/contents/${path}`,
    {
      headers: getHeaders()
    }
  );

  if (!response.ok) {
    return "";
  }

  const data = await response.json();

  if (!data.content) {
    return "";
  }

  return Buffer.from(
    data.content,
    "base64"
  ).toString("utf-8");
};

const getTechnologies = (
  repository,
  files
) => {
  const technologies = [];

  const language = repository.language;

  if (language) {
    technologies.push(language);
  }

  const filePaths = files.map((file) =>
    file.path.toLowerCase()
  );

  const checks = [
    {
      keyword: "package.json",
      technology: "Node.js"
    },
    {
      keyword: "react",
      technology: "React"
    },
    {
      keyword: "express",
      technology: "Express.js"
    },
    {
      keyword: "mongoose",
      technology: "MongoDB"
    },
    {
      keyword: ".py",
      technology: "Python"
    },
    {
      keyword: "requirements.txt",
      technology: "Python"
    },
    {
      keyword: "dockerfile",
      technology: "Docker"
    }
  ];

  checks.forEach((item) => {
    if (
      filePaths.some((path) =>
        path.includes(item.keyword)
      )
    ) {
      if (!technologies.includes(item.technology)) {
        technologies.push(item.technology);
      }
    }
  });

  return technologies;
};

export const analyzeGithub = async (githubUrl) => {
  const username = getGithubUsername(githubUrl);

  const repositories =
    await getGithubRepositories(username);

  const finalRepositories = [];

  for (const repository of repositories.slice(0, MAX_REPOSITORIES)) {
    if (repository.fork) {
      continue;
    }

    const branch =
      repository.default_branch || "main";

    const tree = await getRepositoryTree(
      username,
      repository.name,
      branch
    );

    const usefulFiles = tree
      .filter(
        (item) =>
          item.type === "blob" &&
          isUsefulFile(item.path)
      )
      .filter((item) => {
        const path = item.path.toLowerCase();

        return (
          path.includes("readme") ||
          path.includes("src/") ||
          path.includes("routes/") ||
          path.includes("controllers/") ||
          path.includes("models/") ||
          path.includes("services/") ||
          path.includes("middleware/") ||
          path.includes("utils/") ||
          path.endsWith("index.js") ||
          path.endsWith("server.js") ||
          path.endsWith("app.js") ||
          path.endsWith("main.py") ||
          path.endsWith("requirements.txt") ||
          path.endsWith("package.json")
        );
      })
      .slice(0,  MAX_FILES_PER_REPOSITORY);

    const importantFiles = [];

    for (const file of usefulFiles) {
      const content = await getFileContent(
        username,
        repository.name,
        file.path
      );

      if (!content) {
        continue;
      }

      importantFiles.push({
        path: file.path,
        type: "source",
        content: content.slice(0, MAX_FILE_CONTENT)
      });
    }

    finalRepositories.push({
      name: repository.name,
      url: repository.html_url,
      description: repository.description || "",
      language: repository.language || "",
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      topics: repository.topics || [],
      technologies: getTechnologies(
        repository,
        usefulFiles
      ),
      importantFiles
    });
  }

  return {
    username,
    profileUrl: githubUrl,
    repositories: finalRepositories
  };
};