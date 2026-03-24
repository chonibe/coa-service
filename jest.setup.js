/* eslint-disable @typescript-eslint/no-require-imports */
import '@testing-library/jest-dom'
// Polyfill for Web APIs used by Next.js
import 'whatwg-fetch';

if (typeof Request === 'undefined') {
  const { Request, Response, Headers } = require('next/dist/compiled/@edge-runtime/primitives');
  global.Request = Request;
  global.Response = Response;
  global.Headers = Headers;
}

// NextResponse.json() uses Response.json() - ensure it exists (edge-runtime may not provide it)
if (typeof global.Response !== 'undefined' && typeof global.Response.json !== 'function') {
  global.Response.json = function (body, init = {}) {
    return new global.Response(JSON.stringify(body), {
      ...init,
      headers: new global.Headers({
        'Content-Type': 'application/json',
        ...(init.headers && (init.headers instanceof global.Headers ? Object.fromEntries(init.headers) : init.headers)),
      }),
    });
  };
}

// jsdom / @exodus/bytes need TextDecoder (Jest jsdom may not define it)
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
