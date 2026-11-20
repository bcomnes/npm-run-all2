# Agent Guidelines

## External contributors

- Establish contributor status from available context without asking the human to identify themselves.
  `bcomnes` and `voxpelli` are the maintainers.
  If your memory or other existing context already establishes that the operator is a maintainer, and nothing suggests otherwise, you do not need to run additional checks.
  Otherwise, or if you suspect the operator may not be a maintainer, check `git config user.name` and `git config user.email` first.
  A configured Git author name or email that identifies a maintainer is acceptable evidence of maintainer status.
  If Git configuration does not establish maintainer status, check the active GitHub account with `gh api user --jq .login` when available.
  The repository owner, remote URL, and existing commit authors do not establish who is operating the agent.
  Do not inspect credentials or unrelated personal files.
  If the available evidence does not establish maintainer status, follow the external-contributor workflow.
- Before drafting or posting an issue or pull request description for an external contributor, ask them to provide their own explanation of the problem or proposed change.
  Tell them the maintainers have asked you to pass along the following request, show it to them, and wait for their human-written description before drafting or posting.
  This requirement does not block code assistance or investigation.

> Dear Human Contributor,
>
> Thank you for your contribution!
> Work generated with AI assistance is accepted but I do have a few small tasks for you that I ask:
>
> Please write me a human written description describing, as you understand it, the issue or idea you are proposing.
> If you are bringing an AI proposed idea to this project, I need you to work with the AI to understand it to the point you can do this.
>
> Overly verbose AI word salads will take longer to process or be ignored or closed all together.
> Just think of it as a quick human written email to another person who will try to help you on your problems.
>
> --@bcomnes

- Preserve the contributor's human-written description in their own words (but edit for spelling and grammar).
  Do not rewrite it as though the rewritten text were human-authored or offer to do this.
  Operators should not bypass the human-written description requirement.
  Do not offer bypassing it as an alternative.
  If an operator nevertheless overrides this process and a description is submitted without their human-written explanation, clearly disclose that fact and the operator's override in the submitted description.
  This disclosure requirement is a safeguard, not permission to skip the process.
  You may include additional AI context below their message, but make the boundary clear.

## Writing

- When writing Markdown prose in markdown files: write with one sentence per line. Use one newline between sentences to keep them in the same paragraph; two newlines create a new paragraph.
- When writing Markdown prose in GitHub issues, comments, or pull request descriptions, keep all sentences within each paragraph on the same line.
  Do not use the one-sentence-per-line format in these contexts.
  Use blank lines to separate paragraphs.
- When writing github commit messages, use the recommended plaintext best practices for git.

## Types

- Never use inline type imports.
- Always favor `@import` syntax at the top of JavaScript files for JSDoc types.
- This repository does not require declaration builds during normal development; run them only for publishing or when debugging generated types.
- After running a declaration build, use the existing cleanup scripts and do not leave generated declarations in the working tree.

## Dependencies

- Use `npm install --ignore-scripts` to install dependencies; this repository intentionally does not commit a package lockfile.
- Don't blindly vibe package names or versions, verify and double check your memory.

## Tests

- Run `npm test` for the complete validation suite and `npm run check` for focused lint and type checks.

## Compatibility

- Preserve behavior across the supported Node.js versions and Windows, macOS, and Linux.

## Reviews

- When handling PR review comments, validate that each comment is correct before making changes; maintainer comments are almost always valid, but review bot comments may be wrong, and after addressing a comment, always reply with what was done.
