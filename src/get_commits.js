const myRepos = await fetch("https://api.github.com/users/Astisme/repos")
console.log(myRepos);
const latestCommits = [];

for(const repo in myRepos){
  const commits = await fetch(`https://api.github.com/repos/${repo.full_name}/commits`);
  let i = 0;
  while(i < commits.length() && i < 10){
    const com = commits[i];
    latestCommits.push(com);
    i++;
  }
}

console.log({latestCommits});
const sortedCommits = latestCommits.sort((a,b) => a.commit.author.date - b.commit.author.date).slice(0, 10);
console.log({sortedCommits})

/*for(const commit : sortedCommits){
  
}*/
