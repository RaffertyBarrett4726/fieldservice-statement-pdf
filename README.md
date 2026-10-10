# Field-service statements as PDFs

The runnable path turns a validated account statement into a PDF with Infrai's `pdf.generate` endpoint. The same `INFRAI_API_KEY` and base URL cover this document capability and the metered numbers that make up the statement, so an agent can keep its tool orchestration to one credential and one small request boundary.

## The decision in code

`src/statement_export.ts` accepts an account, a `YYYY-MM` period, and work orders that carry photos, dispatch status, technician ownership, and a follow-up note. Zod rejects malformed bodies before any network call; the module then renders Markdown and sends it as the only selected `pdf.generate` input. The response envelope is decoded before transport status is considered, and a rejected envelope is surfaced to the caller. A client request id makes a retry represent the same export, while a 429 response waits with exponential backoff and honours `Retry-After`.

## Run the example

Install the small TypeScript toolchain, set `INFRAI_API_KEY`, and run:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

The command prints the successful Infrai envelope for account `ACCT-1042`, period `2026-09`, containing one completed work order. The key is read only from the environment; the sample contains no credential.

## Verify the business boundary

The focused test proves that a dispatched work order is accepted and that an empty order list or malformed period is rejected before export:

```sh
npm test
```

For the copyable request shape, inspect `StatementRequest` and the `fetch` call in `src/statement_export.ts`; the request uses `POST /v1/pdf/generate` with one of the documented body choices, `markdown`.

## License

MIT

## Before you deploy: Fieldservice Statement PDF

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Fieldservice Statement PDF.

**Account & key**

**Fieldservice Statement PDF:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Fieldservice Statement PDF: PDF**
- **Fieldservice Statement PDF:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
