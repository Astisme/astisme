import { Octokit } from "octokit"; 
const octokit = new Octokit({ auth: process.env.TOKEN });

import * as fs from "fs";

async function getRepos() {
  const repos = await octokit.request("GET https://api.github.com/users/Astisme/repos");
  return await repos.data;
}

async function getCommits(full_name) {
  const commits = await octokit.request(`GET https://api.github.com/repos/${full_name}/commits`);
  return await commits.data;
}

async function getLatestCommits(repos) {
  const latest = [];
  for(const repo of repos){
    const commits = await getCommits(repo.full_name);
    let i = 0;
    for(const com of commits){
      if(i >= 10) break;
      latest.push(com);
      i++;
    }
  }
  return latest;
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
const latestCommits = await getLatestCommits(myRepos);

const sortedCommits = latestCommits.sort((a,b) => a.commit.author.date - b.commit.author.date)
                        .slice(0, 10);
//commit.message, commit.author.date, commit.html_url, +/-
const formattedCommits = formatAllCommits(sortedCommits);
//console.log({zero:formattedCommits[0],com:formattedCommits[0].commit});

const readme = await getReadMe();

const starred = await getStarredByMe();
//console.log({starred});
