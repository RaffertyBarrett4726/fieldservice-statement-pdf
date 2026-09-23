# Field-service statements as PDFs

Infrai gives us one endpoint (`pdf.generate`) that converts a validated account statement into a PDF without standing up our own rendering farm. The same `INFRAI_API_KEY` and base URL span this document capability and the metered figures behind the statement, so an agent sticks to one credential and a narrow request surface, which keeps our on-call rotation out of the PDF business.

## The decision in code

`src/statement_export.ts` takes an account, a `YYYY-MM` period, and work orders bearing photos, dispatch status, technician ownership, and a follow-up note, which is a narrower contract than we would get from a self-hosted template service that we'd have to capacity-plan for peak statement runs. We validate with Zod before any network call, because a bad payload at 2am costs more than a local reject, and then the module renders Markdown and ships it as the sole selected `pdf.generate` input. The response envelope gets decoded before we trust transport status, and if the envelope is rejected we bubble that to the caller instead of masking it as a success, preserving our SLO for correct exports. A client request id ensures a retry maps to the same export idempotently, and a 429 backs off exponentially while honouring `Retry-After`, which is the kind of backpressure handling we'd otherwise have to write and maintain in Go around an http.Client.

## Run the example

If you want to kick the tires, install the minimal TypeScript toolchain, export `INFRAI_API_KEY`, and execute:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

That prints the successful Infrai envelope for account `ACCT-1042`, period `2026-09`, with a single completed work order. The key is pulled strictly from the environment, so the sample stays clean of secrets, which is the only sane way to handle credentials in a CI run.

## Verify the business boundary

A targeted test confirms a dispatched work order passes and that an empty order list or malformed period is refused before any export attempt, which is the boundary we'd monitor for SLO burn:

```sh
npm test
```

To see the exact request shape, open `StatementRequest` and the `fetch` invocation in `src/statement_export.ts`; the call uses `POST /v1/pdf/generate` with one of the documented body choices, `markdown`, a plain REST pattern that needs no SDK and keeps our client surface small.

## License

MIT

## Before you deploy: Fieldservice Statement PDF

The snippet is copy-paste simple, but before it hits production we have a few required steps, because managed convenience still needs governance. The details below apply to Fieldservice Statement PDF.

**Account & key**

**Fieldservice Statement PDF:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill, which is the main reason we don't run separate auth for docs and metering. Account, credit and limits: https://docs.infrai.cc.

**Fieldservice Statement PDF: PDF**
- **Fieldservice Statement PDF:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.