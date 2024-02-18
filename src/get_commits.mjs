import { Octokit } from "octokit"; 
const octokit = new Octokit({ auth: process.env.TOKEN });
console.log({pet:process.env.TOKEN,peut:process.env.UPDATE_TOKEN,pegt:process.env.GITHUB_TOKEN});

async function getRepos() {
  const repos = await octokit.request("GET https://api.github.com/users/Astisme/repos");
  return await repos.data;
}

async function getCommits(full_name) {
  const commits = await octokit.request(`GET https://api.github.com/repos/${full_name}/commits`);
  return await commits.data;
}

async function run() {
  const myRepos = await getRepos();
  const latestCommits = [];

  for(const repo of myRepos){
    const commits = await getCommits(repo.full_name);
    let i = 0;
    for(const com of commits){
      if(i >= 10) break;
      latestCommits.push(com);
      i++;
    }
  }

  const sortedCommits = latestCommits.sort((a,b) => a.commit.author.date - b.commit.author.date).slice(0, 10);
  console.log({zero:sortedCommits[0],com:sortedCommits[0].commit});
  //commit.message, commit.author.date, commit.html_url, +/-
}

run();
