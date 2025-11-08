const username = process.argv[2];

if (!username) {
  console.log("Usage: node index.js <github-username>");
  process.exit(1);
}

const https = require("https");

const url = `https://api.github.com/users/${username}/events`;

const options = {
  headers: {
    "User-Agent": "Node.js", // GitHub API requires this
  },
};

https.get(url, options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      if (res.statusCode !== 200) {
        console.log(`Error: ${res.statusCode} - ${JSON.parse(data).message}`);
        return;
      }

      const events = JSON.parse(data);
      if (!events.length) {
        console.log("No recent activity found.");
        return;
      }

      events.slice(0, 10).forEach((event) => {
        let action = "";

        switch (event.type) {
          case "PushEvent":
            const commitCount = event.payload?.commits?.length || 0;
            action = `Pushed ${commitCount} commit(s) to ${event.repo.name}`;
            break;

          case "IssuesEvent":
            action = `${event.payload?.action || "performed"} an issue in ${event.repo.name}`;
            break;

          case "WatchEvent":
            action = `Starred ${event.repo.name}`;
            break;

          case "CreateEvent":
            action = `Created ${event.payload?.ref_type || "repository"} in ${event.repo.name}`;
            break;

          default:
            action = `Performed ${event.type} in ${event.repo.name}`;
        }

        console.log(`- ${action}`);
      });
    } catch (error) {
      console.error("Error parsing response:", error.message);
    }
  });
}).on("error", (error) => {
  console.error("Failed to fetch data:", error.message);
});

