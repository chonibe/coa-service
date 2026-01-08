// Polyfill for Web APIs used by Next.js
import 'whatwg-fetch';

if (typeof Request === 'undefined') {
  const { Request, Response, Headers } = require('next/dist/compiled/@edge-runtime/primitives');
  global.Request = Request;
  global.Response = Response;
  global.Headers = Headers;
}
