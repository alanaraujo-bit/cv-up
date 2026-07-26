# Architecture decision records

One file per decision that would be expensive to reverse or surprising to
someone reading the code later. Add a new numbered file rather than editing
history; supersede instead of deleting.

| #                                                      | Decision                                           |
| ------------------------------------------------------ | -------------------------------------------------- |
| [0001](0001-no-separate-backend.md)                    | No separate backend service                        |
| [0002](0002-pdf-via-playwright-service.md)             | PDF generation via a dedicated Playwright service  |
| [0003](0003-resume-content-as-json.md)                 | Resume content stored as a validated JSON document |
| [0004](0004-better-auth.md)                            | Better Auth over Auth.js                           |
| [0005](0005-webpack-for-production-builds.md)          | Production builds run on webpack, not Turbopack    |
| [0006](0006-permissive-storage-advisory-validation.md) | Permissive storage, advisory validation            |
