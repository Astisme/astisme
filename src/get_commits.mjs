import { Octokit } from "octokit"; 
import * as fs from "fs";

const owner = "Astisme";
const octokit = new Octokit({ auth: process.env.TOKEN });

async function getRepos() {
  const repos = await octokit.request(`GET https://api.github.com/users/${owner}/repos`);
  return await repos.data;
}

async function getCommits(repoName) {
  const commits = await octokit.request(`GET https://api.github.com/repos/${repoName}/commits`);
  return await commits.data;
}

async function getLatestCommits(repos) {
  const latest = {};
  for(const repo of repos){
    const repoName = repo.full_name;
    const commits = await getCommits(repo.full_name);
    let i = 0;
    for(const com of commits){
      if(i >= 10) break;
      if(latest[repoName] == null){
        latest[repoName] = [com];
      } else {
        latest[repoName].push(com);
      }
      i++;
    }
  }
  return latest;
}

async function getDetailedCommits(reposWithCommits) {
  const detailedMap = {};
  for(const repoName in reposWithCommits) {
    for(const com of reposWithCommits[repoName]) {
      const ref = com.sha;
      console.log({repoName,ref});
      const detailed = await octokit.request(`GET /repos/${repoName}/commits/${ref}`, {
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
          "Accept": "application/vnd.github+json"
        }
      });
      if(detailedMap[repoName] == null){
        detailedMap[repoName] = [await detailed];
      } else {
        detailedMap[repoName].push(await detailed);
      }
    }
  }
  return detailedMap;
}

async function getStarredByMe() {
  const starred = await octokit.request('GET /user/starred?sort=created', {
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
      "Accept": "application/vnd.github.star+json"
     }
  });
  return await starred.data;
}

async function getReadMe() {
  const buffer = await fs.readFileSync("README.md");
  return await buffer.toString();
}

function formatCommit(commit) {
  return commit;
}

function formatAllCommits(commits) {
  const formattedCommits = [];
  for(const com of commits)
    formattedCommits.push(formatCommit(com));
  return formattedCommits;
}
 
function updateReadme(readmeFile, afterThisRow, toInsert) {}

const myRepos = await getRepos();
const latestCommitsByRepo = await getLatestCommits(myRepos);
const latestWithDetail = await getDetailedCommits(latestCommitsByRepo);
console.log({latestWithDetail});

const sortedCommits = latestWithDetail
                        .sort((a,b) => {
                          console.log({a,b});
                          return a.commit.author.date - b.commit.author.date)
                        }
                        .slice(0, 10);
//commit.message, commit.author.date, commit.html_url, +/-
const formattedCommits = formatAllCommits(sortedCommits);
//console.log({zero:formattedCommits[0],com:formattedCommits[0].commit});

const readme = await getReadMe();

const starred = await getStarredByMe();
//console.log({starred});
