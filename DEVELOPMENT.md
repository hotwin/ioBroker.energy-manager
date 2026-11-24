# Development

Run `npm ci`, `npm run lint`, `npm test`, `npm run test:integration` and `npm pack --dry-run`. The official integration suite uses a real ioBroker controller and a temporary object and state database. The official test tools require Node.js 22.19 or newer.

Edit the Admin dashboard in `admin/` and run `npm run sync:dashboard` to regenerate its optional Web adapter copy. CI verifies they match.

The [ioBroker Adapter Checker](https://www.iobroker.dev/adapter-check) checks repository and release requirements. It requires signing in. Follow the [ioBroker adapter development guide](https://github.com/Jey-Cee/iobroker-ai-developer-guide) for repository submissions.
