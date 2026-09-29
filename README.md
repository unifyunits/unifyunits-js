# UnifyUnits JavaScript SDK

JavaScript and TypeScript client for the hosted UnifyUnits Measurement API.
Conversions use decimal strings to preserve precision. The SDK does not bundle
conversion factors or private measurement data.

## Requirements and install

Node.js 18 or newer is required. Install the first release directly from
GitHub:

```sh
npm install github:unifyunits/unifyunits-js#v0.1.0
```

The GitHub install builds the TypeScript package during installation. After
publication to npm, install it with `npm install @unifyunits/sdk` instead.

## Usage

```js
import { UnifyUnits } from "@unifyunits/sdk";

const units = new UnifyUnits({ apiKey: process.env.UNIFYUNITS_API_KEY });
const result = await units.convert({ value: "1000", from: "m", to: "km" });
console.log(result.data.result); // { value: "1", unit: "km" }
```

Available methods are `convert`, `convertBatch`, `categories`, `category`,
`units`, `unit`, and `health`. Conversion endpoints require an API key.
Catalog and health methods are public. Keep API keys in server-side secret
configuration; do not bundle them in browser applications.

HTTP failures throw `UnifyUnitsApiError` with `status`, `errorCode`,
`requestId`, and optional `details`. Network and timeout errors are fetch errors.

## Development

```sh
npm install
npm run check
```

Tests use a mocked Fetch implementation and do not require a live API key.
GitHub releases and npm publication are separate; this repository does not
publish automatically to npm.
