import { Octokit } from "octokit"; 
const octokit = new Octokit({ auth: process.env.TOKEN });

async function getRepos() {
  //return await fetch("https://api.github.com/users/Astisme/repos");
  return await octokit.request("GET https://api.github.com/users/Astisme/repos");
}

async function getCommits(full_name) {
  //return await fetch(`https://api.github.com/repos/${full_name}/commits`);
  return await octokit.request(`GET https://api.github.com/repos/${full_name}/commits`);
}

//async function run() {
  const myRepos = await getRepos();
  const latestCommits = [];

  for(const repo in myRepos){
    const commits = await getCommits(repo.full_name);
    console.log({commits});
    let i = 0;
    for(const com in commits){
      if(i >= 10) break;
      latestCommits.push(com);
      i++;
    }
  }

  console.log({latestCommits,zero:latestCommits[0]});
  const sortedCommits = latestCommits.sort((a,b) => a.commit.author.date - b.commit.author.date).slice(0, 10);
  console.log({sortedCommits})
//}

//run();
