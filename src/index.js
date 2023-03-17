async function main() {
  const core = require('@actions/core');
  const github = require('@actions/github');

  // --- Inputs ---
  const token = core.getInput('token');
  const repository = core.getInput('repository');
  const issueNumber = core.getInput('issue-number');
  const directory = core.getInput('directory').replace(/.*\//g, '');
  const stdout = core.getInput('stdout');
  const stderr = core.getInput('stderr');

  // --- Calculations ---
  const hasChanges = !stdout.includes('No changes. Your infrastructure matches the configuration.');
  const hasError = stderr.length > 0;
  const rex = /Plan:.*?\./;
  const plan = rex.exec(stdout);

  /**
   * Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
   *   ~ update in-place
   *   -/+ destroy and then create replacement
   *   <= read (data resources)
   */
  const result = stdout
    .replace(/.*Terraform will perform the following actions:/g, '')
    .replace(/─────────────────────────────────────────────────────────────────────────────.*/g, '')
    .split('\n')
    .map((line) => (line.includes(' ~ ') ? `+${line}` : line))
    .map((line) => (line.includes(' + ') ? `+${line}` : line))
    .map((line) => (line.includes(' - ') ? `-${line}` : line))
    .join('\n');

  // --- Find Previous Comment ---
  const octokit = github.getOctokit(token);
  const [owner, repo] = repository.split('/');
  const parameters = {
    owner: owner,
    repo: repo,
    issue_number: issueNumber,
  };
  async function findPreviousComment() {
    for await (const { data: comments } of octokit.paginate.iterator(octokit.rest.issues.listComments, parameters)) {
      const comment = comments.find((comment) => comment.body.includes(`**${directory}**  \n`));
      if (comment) return comment;
    }
  }
  const previousComment = await findPreviousComment();

  let output;

  // --- Outputs ---
  if (hasChanges === false) return;
  if (hasError === true) {
    output = `**${directory}**  \n`;

    output += `Error: ${result}\n\n`;

    output += '<details><summary>Detail</summary>\n\n';

    output += '```\n';
    output += error;
    output += '```\n\n';

    output += '</details>';
  } else {
    output = `**${directory}**  \n`;

    output += `${plan}\n\n`;

    output += '<details><summary>Detail</summary>\n\n';

    output += '```diff\n';
    output += result;
    output += '```\n\n';

    output += '</details>';
  }

  if (previousComment) {
    await octokit.rest.issues.updateComment({
      issue_number: github.context.issue.number,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      body: output,
    });
  } else {
    await octokit.rest.issues.createComment({
      issue_number: github.context.issue.number,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      body: output,
    });
  }
}

main();
