# Kitchen Table project workflow

For each requested Kitchen Table code revision, start from the latest agreed branch on the project's GitHub remote. Work in this repository and preserve changes already made by other contributors.

- Follow the project layout in `ARCHITECTURE.md` and the checked-in EditorConfig and Prettier settings.
- Run the checks relevant to the change. The commands are in `README.md`.
- Commit the completed revision with a message describing what changed and push it to the agreed branch on `origin`. If branch protection requires a pull request, push a topic branch and open a pull request against the agreed branch.
- Verify the pushed commit on GitHub and include its link in the handoff. If publishing is blocked, report what is still local.
- Track source code, configuration templates and documentation. Keep real household databases, credentials, installed dependencies and compiled release archives out of commits.
