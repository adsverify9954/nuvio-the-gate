var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/hono/dist/http-exception.js
var HTTPException = /* @__PURE__ */ __name(class extends Error {
  res;
  status;
  /**
  * Creates an instance of `HTTPException`.
  * @param status - HTTP status code for the exception. Defaults to 500.
  * @param options - Additional options for the exception.
  */
  constructor(status = 500, options) {
    super(options?.message, { cause: options?.cause });
    this.res = options?.res;
    this.status = status;
  }
  /**
  * Returns the response object associated with the exception.
  * If a response object is not provided, a new response is created with the error message and status code.
  * @returns The response object.
  */
  getResponse() {
    if (this.res)
      return new Response(this.res.body, {
        status: this.status,
        headers: this.res.headers
      });
    return new Response(this.message, { status: this.status });
  }
}, "HTTPException");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  return new Response(arrayBuffer, { headers: { "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase()) } }).formData();
}, "bufferToFormData");

// node_modules/hono/dist/utils/body.js
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = /* @__PURE__ */ __name((request) => "headers" in request, "isRawRequest");
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const mediaType = (isRawRequest(request) ? request.headers : request.raw.headers).get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded")
    return parseFormData(request, {
      all,
      dot
    });
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData)
    return convertFormDataToBodyData(await request.bodyCache.formData, options);
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request))
    request.bodyCache.formData = formDataPromise;
  const formData = await formDataPromise;
  if (formData)
    return convertFormDataToBodyData(formData, options);
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key2) => {
    if (!(options.all || key2.endsWith("[]")))
      form[key2] = value;
    else
      handleParsingAllValues(form, key2, value);
  });
  if (options.dot)
    Object.entries(form).forEach(([key2, value]) => {
      if (key2.includes(".")) {
        handleParsingNestedValues(form, key2, value, nestingState);
        delete form[key2];
      }
    });
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key2, value) => {
  if (form[key2] !== void 0) {
    if (Array.isArray(form[key2]))
      form[key2].push(value);
    else
      form[key2] = [form[key2], value];
  } else if (!key2.endsWith("[]"))
    form[key2] = value;
  else
    form[key2] = [value];
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key2, value, state) => {
  if (/(?:^|\.)(?:__proto__|constructor\.prototype)\./.test(key2))
    return;
  let nestedForm = form;
  const keys = key2.split(".", 34);
  if (keys.length > 33)
    throwNestingLimitExceeded();
  keys.forEach((key3, index) => {
    if (index === keys.length - 1)
      nestedForm[key3] = value;
    else {
      if (!nestedForm[key3] || typeof nestedForm[key3] !== "object" || Array.isArray(nestedForm[key3]) || nestedForm[key3] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS)
          throwNestingLimitExceeded();
        nestedForm[key3] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key3];
    }
  });
}, "handleParsingNestedValues");
var throwNestingLimitExceeded = /* @__PURE__ */ __name(() => {
  throw new Error("Nesting limit exceeded");
}, "throwNestingLimitExceeded");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "")
    paths.shift();
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath2) => {
  const { groups, path } = extractGroupsFromPath(routePath2);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return {
    groups,
    path
  };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--)
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*")
    return "*";
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2])
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [
          cacheKey,
          match2[1],
          new RegExp(`^${match2[2]}(?=/${next})`)
        ] : [
          label,
          match2[1],
          new RegExp(`^${match2[2]}$`)
        ];
      else
        patternCache[cacheKey] = [
          label,
          match2[1],
          true
        ];
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var decodeURIWithPreservedPercent = /* @__PURE__ */ __name((value) => decodeURI(value.includes("%25") ? value.replace(/%25/g, "%2525") : value), "decodeURIWithPreservedPercent");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      const decoded = tryDecode(path, decodeURIWithPreservedPercent);
      if (/%(?![0-9A-Fa-f]{2})/.test(path)) {
        const rewritten = new URL("http://localhost");
        rewritten.pathname = decoded.replace(/[\\\t\n\r]/g, encodeURIComponent);
        if (tryDecode(rewritten.pathname, decodeURIWithPreservedPercent) !== decoded)
          return tryDecode(path.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"), decodeURIWithPreservedPercent);
      }
      return decoded;
    } else if (charCode === 63 || charCode === 35)
      break;
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length)
    sub = mergePath(sub, ...rest);
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":"))
    return null;
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment))
      basePath += "/" + segment;
    else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "")
          results.push("/");
        else
          results.push(basePath);
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else
        basePath += "/" + segment;
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str, "tryDecodeURIComponent");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (value.indexOf("+") !== -1)
    value = value.replace(/\+/g, " ");
  return tryDecodeURIComponent(value);
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key2, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1)
    url = url.slice(0, hashIndex);
  let encoded;
  if (!multiple && key2 && !/[%+&=]/.test(key2)) {
    const queryIndex = url.indexOf("?", 8);
    let keyIndex2 = queryIndex;
    if (keyIndex2 === -1)
      return;
    if (!url.startsWith(key2, keyIndex2 + 1))
      keyIndex2 = url.indexOf(`&${key2}`, keyIndex2 + 1);
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key2.length + 1);
      if (trailingKeyCode === 61 || trailingKeyCode === 38 || isNaN(trailingKeyCode)) {
        if (keyIndex2 > queryIndex && /(?:^|&)[^=&]*[%+]/.test(url.slice(queryIndex + 1, keyIndex2)))
          break;
        if (trailingKeyCode === 61) {
          const valueIndex = keyIndex2 + key2.length + 2;
          const endIndex = url.indexOf("&", valueIndex);
          return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
        }
        return "";
      }
      keyIndex2 = url.indexOf(`&${key2}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded)
      return;
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1)
      valueIndex = -1;
    let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex);
    if (encoded)
      name = _decodeURI(name);
    keyIndex = nextKeyIndex;
    if (name === "")
      continue;
    let value;
    if (valueIndex === -1)
      value = "";
    else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded)
        value = _decodeURI(value);
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name])))
        results[name] = [];
      results[name].push(value);
    } else
      results[name] ??= value;
  }
  return key2 ? results[key2] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key2) => {
  return _getQueryParam(url, key2, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var HonoRequest = /* @__PURE__ */ __name(class {
  /**
  * `.raw` can get the raw Request object.
  *
  * @see {@link https://hono.dev/docs/api/request#raw}
  *
  * @example
  * ```ts
  * // For Cloudflare Workers
  * app.post('/', async (c) => {
  *   const metadata = c.req.raw.cf?.hostMetadata?
  *   ...
  * })
  * ```
  */
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  /**
  * `.path` can get the pathname of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#path}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const pathname = c.req.path // `/about/me`
  * })
  * ```
  */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key2) {
    return key2 ? this.#getDecodedParam(key2) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key2) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key2];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key2 of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key2]);
      if (value !== void 0)
        decoded[key2] = tryDecodeURIComponent(value);
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key2) {
    return getQueryParam(this.url, key2);
  }
  queries(key2) {
    return getQueryParams(this.url, key2);
  }
  header(name) {
    if (name)
      return this.raw.headers.get(name) ?? void 0;
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key2) => {
      headerData[key2] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key2) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key2];
    if (cachedBody)
      return cachedBody;
    for (const anyCachedKey in bodyCache)
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json")
          body = JSON.stringify(body);
        const contentType = anyCachedKey === "formData" ? void 0 : raw2.headers.get("content-type");
        return new Response(body, { headers: contentType ? { "Content-Type": contentType } : void 0 })[key2]();
      });
    return bodyCache[key2] = raw2[key2]();
  };
  /**
  * `.json()` can parse Request body of type `application/json`
  *
  * @see {@link https://hono.dev/docs/api/request#json}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.json()
  * })
  * ```
  */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
  * `.text()` can parse Request body of type `text/plain`
  *
  * @see {@link https://hono.dev/docs/api/request#text}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.text()
  * })
  * ```
  */
  text() {
    return this.#cachedBody("text");
  }
  /**
  * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
  *
  * @see {@link https://hono.dev/docs/api/request#arraybuffer}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.arrayBuffer()
  * })
  * ```
  */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
  * `.bytes()` parses the request body as a `Uint8Array`.
  *
  * @see {@link https://hono.dev/docs/api/request#bytes}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.bytes()
  * })
  * ```
  */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
  * Parses the request body as a `Blob`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.blob();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#blob
  */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
  * Parses the request body as `FormData`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.formData();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#formdata
  */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
  * Adds validated data to the request.
  *
  * @param target - The target of the validation.
  * @param data - The validated data to add.
  */
  addValidatedData(target, data) {
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
  * `.url` can get the request url strings.
  *
  * @see {@link https://hono.dev/docs/api/request#url}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const url = c.req.url // `http://localhost:8787/about/me`
  *   ...
  * })
  * ```
  */
  get url() {
    return this.raw.url;
  }
  /**
  * `.method` can get the method name of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#method}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const method = c.req.method // `GET`
  * })
  * ```
  */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
  * `.matchedRoutes` can return a matched route in the handler
  *
  * @deprecated
  *
  * Use matchedRoutes helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#matchedroutes}
  *
  * @example
  * ```ts
  * app.use('*', async function logger(c, next) {
  *   await next()
  *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
  *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
  *     console.log(
  *       method,
  *       ' ',
  *       path,
  *       ' '.repeat(Math.max(10 - path.length, 0)),
  *       name,
  *       i === c.req.routeIndex ? '<- respond from here' : ''
  *     )
  *   })
  * })
  * ```
  */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
  * `.routePath` can retrieve the path registered within the handler
  *
  * @deprecated
  *
  * Use routePath helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#routepath}
  *
  * @example
  * ```ts
  * app.get('/posts/:id', (c) => {
  *   return c.json({ path: c.req.routePath })
  * })
  * ```
  */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
}, "HonoRequest");

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise))
      str = str.toString();
    if (str instanceof Promise)
      str = await str;
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length)
    return Promise.resolve(str);
  if (buffer)
    buffer[0] += str;
  else
    buffer = [str];
  const resStr = Promise.all(callbacks.map((c) => c({
    phase,
    buffer,
    context
  }))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]));
  if (preserveCallbacks)
    return raw(await resStr, callbacks);
  else
    return resStr;
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = /* @__PURE__ */ __name(class {
  #rawRequest;
  #req;
  /**
  * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
  *
  * @see {@link https://hono.dev/docs/api/context#env}
  *
  * @example
  * ```ts
  * // Environment object for Cloudflare Workers
  * app.get('*', async c => {
  *   const counter = c.env.COUNTER
  * })
  * ```
  */
  env = {};
  #var;
  finalized = false;
  /**
  * `.error` can get the error object from the middleware if the Handler throws an error.
  *
  * @see {@link https://hono.dev/docs/api/context#error}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   await next()
  *   if (c.error) {
  *     // do something...
  *   }
  * })
  * ```
  */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
  * Creates an instance of the Context class.
  *
  * @param req - The Request object.
  * @param options - Optional configuration options for the context.
  */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
  * `.req` is the instance of {@link HonoRequest}.
  */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#event}
  * The FetchEvent associated with the current request.
  *
  * @throws Will throw an error if the context does not have a FetchEvent.
  */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx)
      return this.#executionCtx;
    else
      throw Error("This context has no FetchEvent");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#executionctx}
  * The ExecutionContext associated with the current request.
  *
  * @throws Will throw an error if the context does not have an ExecutionContext.
  */
  get executionCtx() {
    if (this.#executionCtx)
      return this.#executionCtx;
    else
      throw Error("This context has no ExecutionContext");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#res}
  * The Response object for the current request.
  */
  get res() {
    return this.#res ||= createResponseInstance(null, { headers: this.#preparedHeaders ??= new Headers() });
  }
  /**
  * Sets the Response object for the current request.
  *
  * @param _res - The Response object to set.
  */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type")
          continue;
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies)
            _res.headers.append("set-cookie", cookie);
        } else
          _res.headers.set(k, v);
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
  * `.render()` can create a response within a layout.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   return c.render('Hello!')
  * })
  * ```
  */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
  * Sets the layout for the response.
  *
  * @param layout - The layout to set.
  * @returns The layout function.
  */
  setLayout = (layout) => this.#layout = layout;
  /**
  * Gets the current layout for the response.
  *
  * @returns The current layout function.
  */
  getLayout = () => this.#layout;
  /**
  * `.setRenderer()` can set the layout in the custom middleware.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```tsx
  * app.use('*', async (c, next) => {
  *   c.setRenderer((content) => {
  *     return c.html(
  *       <html>
  *         <body>
  *           <p>{content}</p>
  *         </body>
  *       </html>
  *     )
  *   })
  *   await next()
  * })
  * ```
  */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
  * `.header()` can set headers.
  *
  * @see {@link https://hono.dev/docs/api/context#header}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *
  *   // Append multiple headers using the append option (e.g. Vary)
  *   c.header('Vary', 'Accept-Encoding', { append: true })
  *   c.header('Vary', 'User-Agent', { append: true })
  *
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  header = (name, value, options) => {
    if (this.finalized && !this.#res.bodyUsed)
      this.#res = createResponseInstance(this.#res.body, this.#res);
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0)
      headers.delete(name);
    else if (options?.append)
      headers.append(name, value);
    else
      headers.set(name, value);
  };
  status = (status) => {
    this.#status = status;
  };
  /**
  * `.set()` can set the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   c.set('message', 'Hono is hot!!')
  *   await next()
  * })
  * ```
  */
  set = (key2, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key2, value);
  };
  /**
  * `.get()` can use the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   const message = c.get('message')
  *   return c.text(`The message is "${message}"`)
  * })
  * ```
  */
  get = (key2) => {
    return this.#var ? this.#var.get(key2) : void 0;
  };
  /**
  * `.var` can access the value of a variable.
  *
  * @see {@link https://hono.dev/docs/api/context#var}
  *
  * @example
  * ```ts
  * const result = c.var.client.oneMethod()
  * ```
  */
  get var() {
    if (!this.#var)
      return {};
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key2, value] of new Headers(arg.headers))
        if (key2 === "set-cookie")
          responseHeaders.append(key2, value);
        else
          responseHeaders.set(key2, value);
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers)
          if (++count > 1 || typeof headers[k] !== "string") {
            responseHeaders = new Headers();
            break;
          }
      }
      if (responseHeaders)
        for (const k in headers) {
          const v = headers[k];
          if (typeof v === "string")
            responseHeaders.set(k, v);
          else {
            responseHeaders.delete(k);
            for (const v2 of v)
              responseHeaders.append(k, v2);
          }
        }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
  * `.body()` can return the HTTP response.
  * You can set headers with `.header()` and set HTTP status code with `.status`.
  * This can also be set in `.text()`, `.json()` and so on.
  *
  * @see {@link https://hono.dev/docs/api/context#body}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *   // Set HTTP status code
  *   c.status(201)
  *
  *   // Return the response body
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
  * `.text()` can render text as `Content-Type:text/plain`.
  *
  * @see {@link https://hono.dev/docs/api/context#text}
  *
  * @example
  * ```ts
  * app.get('/say', (c) => {
  *   return c.text('Hello!')
  * })
  * ```
  */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(text, arg, setDefaultContentType(TEXT_PLAIN, headers));
  };
  /**
  * `.json()` can render JSON as `Content-Type:application/json`.
  *
  * @see {@link https://hono.dev/docs/api/context#json}
  *
  * @example
  * ```ts
  * app.get('/api', (c) => {
  *   return c.json({ message: 'Hello!' })
  * })
  * ```
  */
  json = (object, arg, headers) => {
    return this.#newResponse(JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
  };
  html = (html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
  * `.redirect()` can Redirect, default status code is 302.
  *
  * @see {@link https://hono.dev/docs/api/context#redirect}
  *
  * @example
  * ```ts
  * app.get('/redirect', (c) => {
  *   return c.redirect('/')
  * })
  * app.get('/redirect-permanently', (c) => {
  *   return c.redirect('/', 301)
  * })
  * ```
  */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header("Location", !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString));
    return this.newResponse(null, status ?? 302);
  };
  /**
  * `.notFound()` can return the Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/context#notfound}
  *
  * @example
  * ```ts
  * app.get('/notfound', (c) => {
  *   return c.notFound()
  * })
  * ```
  */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
}, "Context");

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index)
        throw new Error("next() called multiple times");
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else
        handler = i === middleware.length && next || void 0;
      if (handler)
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else
            throw err;
        }
      else if (context.finalized === false && onNotFound)
        res = await onNotFound(context);
      if (res && (context.finalized === false || isError))
        context.res = res;
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/helper/route/index.js
var matchedRoutes = /* @__PURE__ */ __name((c) => c.req[GET_MATCH_RESULT][0].map(([[, route]]) => route), "matchedRoutes");
var routePath = /* @__PURE__ */ __name((c, index) => matchedRoutes(c).at(index ?? c.req.routeIndex)?.path ?? "", "routePath");

// node_modules/hono/dist/router.js
var METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "patch",
  "query"
];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = /* @__PURE__ */ __name(class extends Error {
}, "UnsupportedPathError");

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/utils/mount.js
var countTrailingSlashes = /* @__PURE__ */ __name((path) => {
  let index = path.length;
  while (index > 0 && path.charCodeAt(index - 1) === 47)
    index--;
  return path.length - index;
}, "countTrailingSlashes");
var getPathPrefixLength = /* @__PURE__ */ __name((c, pathPrefix, routePath2) => {
  if (!/[:*]/.test(pathPrefix))
    return pathPrefix.length;
  const path = c.req.path;
  const matchResult = c.req[GET_MATCH_RESULT];
  const paramNames = /* @__PURE__ */ new Set();
  let length = 0;
  for (const part of splitRoutingPath(pathPrefix)) {
    if (part[0] === ":" && part.endsWith("}?"))
      throw new Error(`mount(): Optional regular expression parameters are not supported in "${routePath2}".`);
    const pattern = getPattern(part);
    if (pattern && pattern !== "*") {
      const name = pattern[1];
      if (paramNames.has(name))
        throw new Error(`mount(): Duplicate path parameter "${name}" in "${routePath2}".`);
      paramNames.add(name);
    }
    if (pattern && pattern !== "*" && pattern[2] !== true) {
      const value = matchResult.length === 2 ? matchResult[1][matchResult[0][c.req.routeIndex][1][pattern[1]]] : matchResult[0][c.req.routeIndex][1][pattern[1]];
      length += value.length + 1;
    } else if (pattern || part.endsWith("*")) {
      const end = path.indexOf("/", length + 1);
      length = end === -1 ? path.length : end;
    } else
      length += part.length + 1;
  }
  return length;
}, "getPathPrefixLength");
var createMountedRequest = /* @__PURE__ */ __name((c, pathPrefix, routePath2) => {
  if (/[^/]\*$/.test(routePath2))
    throw new Error(`mount(): Wildcard must follow "/" in "${routePath2}".`);
  const prefixLength = getPathPrefixLength(c, pathPrefix, routePath2);
  const path = c.req.path.slice(prefixLength) || "/";
  if (prefixLength > c.req.path.length || path[0] !== "/" || /\/(?:\.|%2e){1,2}(?:\/|$)/i.test(path))
    throw new HTTPException(400, { message: "Invalid mounted path" });
  const rawUrl = c.req.raw.url;
  if (/^[^/?#]*\/\/[^/?#\\]*[?#\\]/.test(rawUrl))
    throw new HTTPException(400, { message: "Invalid mounted path" });
  const rawPathEnd = rawUrl.search(/[?#]/);
  const rawTrailingSlashes = countTrailingSlashes(rawPathEnd === -1 ? rawUrl : rawUrl.slice(0, rawPathEnd));
  if (rawTrailingSlashes > 1 && countTrailingSlashes(c.req.path) === rawTrailingSlashes - 1)
    throw new HTTPException(400, { message: "Invalid mounted path" });
  const url = new URL(rawUrl);
  url.pathname = path.replace(/[\\\t\n\r]/g, encodeURIComponent);
  if (path.includes("%")) {
    let decoded;
    try {
      decoded = decodeURI(path);
    } catch {
    }
    if (decoded === void 0) {
      if (tryDecode(url.pathname, (value) => decodeURI(value.replace(/%25/g, "%2525"))) !== path)
        throw new HTTPException(400, { message: "Invalid mounted path" });
    }
  }
  return new Request(url, c.req.raw);
}, "createMountedRequest");

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = /* @__PURE__ */ __name(class Hono2 {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    [...METHODS, "all"].forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string")
          this.#path = args1;
        else
          this.#addRoute(methodName, this.#path, args1);
        args.forEach((handler) => {
          this.#addRoute(methodName, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler of handlers)
            this.#addRoute(methodName, this.#path, handler);
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string")
        this.#path = arg1;
      else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute("ALL", this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono2({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  /**
  * `.route()` allows grouping other Hono instance in routes.
  *
  * @see {@link https://hono.dev/docs/api/routing#grouping}
  *
  * @param {string} path - base Path
  * @param {Hono} app - other Hono instance
  * @returns {Hono} routed Hono instance
  *
  * @example
  * ```ts
  * const app = new Hono()
  * const app2 = new Hono()
  *
  * app2.get("/user", (c) => c.text("user"))
  * app.route("/api", app2) // GET /api/user
  * ```
  */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler)
        handler = r.handler;
      else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
  * `.basePath()` allows base paths to be specified.
  *
  * @see {@link https://hono.dev/docs/api/routing#base-path}
  *
  * @param {string} path - base Path
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * const api = new Hono().basePath('/api')
  * ```
  */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
  * `.onError()` handles an error and returns a customized Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#error-handling}
  *
  * @param {ErrorHandler} handler - request Handler for error
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.onError((err, c) => {
  *   console.error(`${err}`)
  *   return c.text('Custom Error Message', 500)
  * })
  * ```
  */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
  * `.notFound()` allows you to customize a Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#not-found}
  *
  * @param {NotFoundHandler} handler - request handler for not-found
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.notFound((c) => {
  *   return c.text('Custom 404 Message', 404)
  * })
  * ```
  */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
  * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
  *
  * @deprecated Use `mount()` from `hono/mount` instead. `.mount()` will be removed in v5.
  *
  * @see {@link https://hono.dev/docs/api/hono#mount}
  *
  * @param {string} path - base Path
  * @param {Function} applicationHandler - other Request Handler
  * @param {MountOptions} [options] - options of `.mount()`
  * @returns {Hono} mounted Hono instance
  * @throws {Error} If automatic request rewriting encounters duplicate path parameter names or an optional regular expression parameter.
  * @throws {HTTPException} With status 400 if automatic request rewriting cannot safely preserve the routed path.
  *
  * @example
  * ```ts
  * import { Router as IttyRouter } from 'itty-router'
  * import { Hono } from 'hono'
  * // Create itty-router application
  * const ittyRouter = IttyRouter()
  * // GET /itty-router/hello
  * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
  *
  * const app = new Hono()
  * app.mount('/itty-router', ittyRouter.handle)
  * ```
  *
  * @example
  * ```ts
  * const app = new Hono()
  * // Send the request to another application without modification.
  * app.mount('/app', anotherApp, {
  *   replaceRequest: (req) => req,
  * })
  * ```
  */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function")
        optionHandler = options;
      else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false)
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        else
          replaceRequest = options.replaceRequest;
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    const defaultReplaceRequest = /* @__PURE__ */ __name((c) => {
      const mountedRoutePath = routePath(c);
      return createMountedRequest(c, mountedRoutePath.replace(/\/?\*$/, ""), mountedRoutePath);
    }, "defaultReplaceRequest");
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest ? replaceRequest(c.req.raw) : defaultReplaceRequest(c), ...getOptions(c));
      if (res)
        return res;
      await next();
    }, "handler");
    this.#addRoute("ALL", mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error)
      return this.errorHandler(err, c);
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD")
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then((resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized)
          throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
  * `.fetch()` will be entry point of your app.
  *
  * @see {@link https://hono.dev/docs/api/hono#fetch}
  *
  * @param {Request} request - request Object of request
  * @param {Env} env - env Object
  * @param {ExecutionContext} executionCtx - context of execution
  * @returns {Response | Promise<Response>} response of request
  *
  */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
  * `.request()` is a useful method for testing.
  * You can pass a URL or pathname to send a GET request.
  * app will return a Response object.
  * ```ts
  * test('GET /hello is ok', async () => {
  *   const res = await app.request('/hello')
  *   expect(res.status).toBe(200)
  * })
  * ```
  * @see https://hono.dev/docs/api/hono#request
  */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request)
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    input = input.toString();
    return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
  };
  /**
  * `.fire()` automatically adds a global fetch event listener.
  * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
  * @deprecated
  * Use `fire` from `hono/service-worker` instead.
  * ```ts
  * import { Hono } from 'hono'
  * import { fire } from 'hono/service-worker'
  *
  * const app = new Hono()
  * // ...
  * fire(app)
  * ```
  * @see https://hono.dev/docs/api/hono#fire
  * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
  */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
}, "Hono");

// node_modules/hono/dist/router/utils.js
var createNullObject = /* @__PURE__ */ __name(() => /* @__PURE__ */ Object.create(null), "createNullObject");

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name((method2, path2) => {
    const matcher = matchers[method2] || matchers["ALL"];
    const staticMatch = matcher[2][path2];
    if (staticMatch)
      return staticMatch;
    const match3 = path2.match(matcher[0]);
    if (!match3)
      return [[], emptyParam];
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }, "match");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = "[^]*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/[^]*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = /* @__PURE__ */ new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1)
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  if (b.length === 1)
    return 1;
  if (a === "[^]*" || a === "(?:|/[^]*)")
    return b === "[^]*" ? -1 : 1;
  else if (b === "[^]*" || b === "(?:|/[^]*)")
    return -1;
  if (a === "[^/]+")
    return 1;
  else if (b === "[^/]+")
    return -1;
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = /* @__PURE__ */ __name(class Node2 {
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, keys) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? [
        "",
        "",
        ONLY_WILDCARD_REG_EXP_STR
      ] : [
        "",
        "",
        LABEL_REG_EXP_STR
      ] : null : token === "/*" ? [
        "",
        "",
        TAIL_WILDCARD_REG_EXP_STR
      ] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || "[^/]+";
        if (name && pattern[2]) {
          if (new RegExp(regexpStr).test(""))
            throw PATH_ERROR;
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr))
            throw PATH_ERROR;
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr))
            throw PATH_ERROR;
        }
        keys.push(regexpStr);
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== "[^]*" && regexpStr !== "(?:|/[^]*)") {
            for (const k in node.#children)
              if ((regexpStr.length > 1 || k.length > 1) && k !== "[^]*" && k !== "(?:|/[^]*)")
                throw PATH_ERROR;
          }
          nextNode = node.#children[regexpStr] = new Node2();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        keys.push(token);
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children)
            if (k.length > 1 && k !== "[^]*" && k !== "(?:|/[^]*)")
              throw PATH_ERROR;
          nextNode = node.#children[token] = new Node2();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0)
      throw PATH_ERROR;
    node.#index = index;
  }
  buildRegExpStr() {
    const strList = Object.keys(this.#children).sort(compareKey).map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1)
      strList.unshift(`#${this.#index}`);
    if (strList.length === 0)
      return "";
    if (strList.length === 1)
      return strList[0];
    return "(?:" + strList.join("|") + ")";
  }
}, "Node");

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = /* @__PURE__ */ __name(class {
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  paths = createNullObject();
  insert(path, isStatic) {
    const keys = [];
    if (isStatic) {
      this.#root.insert(path.split(""), -1, [], this.#context, keys);
      this.paths[path] = [
        -1,
        [],
        keys
      ];
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{(?:\{[\d,]+\}|[^}])+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced)
        break;
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./gs) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--)
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, keys);
    this.paths[path] = [
      this.#index++,
      paramAssoc,
      keys
    ];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "")
      return [
        /^$/,
        [],
        []
      ];
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [
      new RegExp(`^${regexp}`),
      indexReplacementMap,
      paramReplacementMap
    ];
  }
}, "Trie");

// node_modules/hono/dist/router/reg-exp-router/router.js
function endsWithWildcard(keys) {
  const tail = keys[keys.length - 1];
  return tail === "[^]*" || tail === "(?:|/[^]*)";
}
__name(endsWithWildcard, "endsWithWildcard");
function covers(wildcard, target) {
  const last = wildcard.length - 1;
  for (let i = 0; i < last; i++)
    if (wildcard[i] !== target[i])
      return false;
  return wildcard[last] === "[^]*" || target.length === last || target[last] === "/";
}
__name(covers, "covers");
var RegExpRouter = /* @__PURE__ */ __name(class {
  name = "RegExpRouter";
  #handlers;
  #tries;
  constructor() {
    this.#handlers = { ["ALL"]: [] };
    this.#tries = { ["ALL"]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const handlers = this.#handlers;
    if (!handlers)
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    const tries = this.#tries;
    if (!handlers[method]) {
      tries[method] = new Trie();
      handlers[method] = [...handlers["ALL"]];
      for (const p in tries["ALL"].paths)
        this.#insertPath(method, p);
    }
    if (path === "/*")
      path = "*";
    const methods = method === "ALL" ? Object.keys(handlers) : [method];
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths)
      for (const m of methods) {
        if (!tries[m].paths[path2])
          this.#insertPath(m, path2);
        handlers[m].push([handler, path2]);
      }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#handlers))
      matchers[method] = this.#buildMatcher(method);
    this.#handlers = this.#tries = void 0;
    return matchers;
  }
  #buildMatcher(method) {
    const handlers = this.#handlers[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    const own = createNullObject();
    const entries = handlers.map(([h, p], i) => {
      (own[p] ??= []).push(i);
      return [h, trie.paths[p][1].reduceRight((map, [key2, varIndex]) => {
        map[key2] = paramReplacementMap[varIndex];
        return map;
      }, createNullObject())];
    });
    const wildcards = Object.keys(own).filter((p) => endsWithWildcard(trie.paths[p][2]));
    for (const path in trie.paths) {
      const [index, , keys] = trie.paths[path];
      const indexes = [...own[path]];
      for (const p of wildcards)
        if (p !== path && covers(trie.paths[p][2], keys))
          indexes.push(...own[p]);
      const data = indexes.sort((a, b) => a - b).map((i) => entries[i]);
      if (index === -1) {
        const last = Math.max(-1, ...data.flatMap(([, map]) => Object.values(map)));
        staticMap[path] = [data, last === -1 ? emptyParam : path.match(regexp).slice(0, last + 1)];
      } else
        handlerData[index] = data;
    }
    return [
      regexp,
      indexReplacementMap.map((i) => handlerData[i]),
      staticMap
    ];
  }
}, "RegExpRouter");

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = /* @__PURE__ */ __name(class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes)
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    this.#routes.push([
      method,
      path,
      handler
    ]);
  }
  match(method, path) {
    if (!this.#routes)
      throw new Error("Fatal error");
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++)
          router.add(...routes[i2]);
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError)
          continue;
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len)
      throw new Error("Fatal error");
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1)
      throw new Error("No active router has been determined yet.");
    return this.#routers[0];
  }
}, "SmartRouter");

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node3 = /* @__PURE__ */ __name(class Node4 {
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key2 = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key2] ||= new Node4();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam)
        possibleKeys.add(pattern[1]);
    }
    curNode.#methods.push({ [method]: {
      handler,
      possibleKeys: [...possibleKeys],
      score: ++order
    } });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m["ALL"];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key2 = handlerSet.possibleKeys[i2];
          handlerSet.params[key2] = params?.[key2] && !i2 ? params[key2] : nodeParams[key2] ?? params?.[key2];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    let curNodes = [this];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"])
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else
            tempNodes.push(nextNode);
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true)
            continue;
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              if (!Object.hasOwn(params, name))
                params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"])
                this.#pushHandlerSets(handlerSets, child.#children["*"], method, node.#params, params);
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                (curNodesQueue[componentCount] ||= []).push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            if (!Object.hasOwn(params, name))
              params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"])
                this.#pushHandlerSets(handlerSets, child.#children["*"], method, params, node.#params);
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1])
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
}, "Node");

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = /* @__PURE__ */ __name(class {
  name = "TrieRouter";
  #node = new Node3();
  add(method, path, handler) {
    for (const result of checkOptionalParameter(path) || [path])
      this.#node.insert(method, result, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
}, "TrieRouter");

// node_modules/hono/dist/hono.js
var Hono3 = /* @__PURE__ */ __name(class extends Hono {
  /**
  * Creates an instance of the Hono class.
  *
  * @param options - Optional configuration options for the Hono instance.
  */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({ routers: [new RegExpRouter(), new TrieRouter()] });
  }
}, "Hono");

// src/index.ts
var UA_DEFAULT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
var HOST_HEADERS = {
  streamtape: { Referer: "https://streamtape.com/", Origin: "https://streamtape.com" },
  vidmoly: { Referer: "https://vidmoly.to/", Origin: "https://vidmoly.to" },
  mixdrop: { Referer: "https://mxdrop.click/", Origin: "https://mxdrop.click" },
  ufoload: { Referer: "https://ufoload.io/", Origin: "https://ufoload.io" },
  abyss: { Referer: "https://player.abyssplayer.com/", Origin: "https://player.abyssplayer.com" },
  byse: { Referer: "https://bysetayico.com/", Origin: "https://bysetayico.com" },
  doodstream: { Referer: "https://doodstream.com/", Origin: "https://doodstream.com" }
};
var HOST_FIELD = {
  streamtape: "streamtape_url",
  vidmoly: "vidmoly_url",
  mixdrop: "mixdrop_url",
  ufoload: "ufoload_url",
  abyss: "abyss_url",
  byse: "byse_url",
  doodstream: "doodstream_url",
  earnvids: "earnvids_url"
};
var HOST_LABEL = {
  streamtape: "Streamtape",
  vidmoly: "Vidmoly",
  mixdrop: "MixDrop",
  ufoload: "UFOload",
  abyss: "Abyss",
  byse: "Byse",
  doodstream: "Doodstream",
  earnvids: "EarnVids"
};
var HIDDEN_HOSTS = /* @__PURE__ */ new Set(["abyss", "byse"]);
var DDL_MAIN = `
  CREATE TABLE IF NOT EXISTS media_items (
    id TEXT PRIMARY KEY,
    tmdb_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    poster TEXT NOT NULL DEFAULT '',
    backdrop TEXT NOT NULL DEFAULT '',
    overview TEXT NOT NULL DEFAULT '',
    rating REAL NOT NULL DEFAULT 0,
    season INTEGER,
    episode INTEGER,
    category TEXT NOT NULL DEFAULT '',
    streamtape_url TEXT NOT NULL DEFAULT '',
    vidmoly_url TEXT NOT NULL DEFAULT '',
    mixdrop_url TEXT NOT NULL DEFAULT '',
    ufoload_url TEXT NOT NULL DEFAULT '',
    abyss_url TEXT NOT NULL DEFAULT '',
    byse_url TEXT NOT NULL DEFAULT '',
    earnvids_url TEXT NOT NULL DEFAULT '',
    doodstream_url TEXT NOT NULL DEFAULT '',
    is_title_only INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`;
var DDL_UPLOADS = `
  CREATE TABLE IF NOT EXISTS host_uploads (
    id TEXT PRIMARY KEY,
    host TEXT NOT NULL,
    file_name TEXT NOT NULL,
    size INTEGER NOT NULL DEFAULT 0,
    status INTEGER NOT NULL DEFAULT 0,
    page_url TEXT NOT NULL DEFAULT '',
    direct_url TEXT NOT NULL DEFAULT '',
    last_checked TEXT NOT NULL DEFAULT (datetime('now')),
    is_valid INTEGER NOT NULL DEFAULT 1
  )`;
var DDL_SYNC = `
  CREATE TABLE IF NOT EXISTS sync_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`;
var DDL_WATCHLIST = `
  CREATE TABLE IF NOT EXISTS watchlist (
    url TEXT PRIMARY KEY,
    host TEXT NOT NULL,
    file_name TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT '',
    tmdb_id INTEGER NOT NULL DEFAULT 0,
    added_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`;
var ALTER_COLUMNS = [
  ["media_items", "rating REAL NOT NULL DEFAULT 0"],
  ["media_items", "ufoload_url TEXT NOT NULL DEFAULT ''"],
  ["media_items", "created_at TEXT NOT NULL DEFAULT (datetime('now'))"],
  ["media_items", "updated_at TEXT NOT NULL DEFAULT (datetime('now'))"],
  ["media_items", "byse_url TEXT NOT NULL DEFAULT ''"],
  ["media_items", "earnvids_url TEXT NOT NULL DEFAULT ''"],
  ["media_items", "is_title_only INTEGER NOT NULL DEFAULT 0"],
  ["media_items", "doodstream_url TEXT NOT NULL DEFAULT ''"],
  ["media_items", "category TEXT NOT NULL DEFAULT ''"],
  ["watchlist", "media_type TEXT NOT NULL DEFAULT ''"],
  ["watchlist", "tmdb_id INTEGER NOT NULL DEFAULT 0"]
];
function userAgent(env) {
  return env.USER_AGENT || UA_DEFAULT;
}
__name(userAgent, "userAgent");
function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
__name(escapeHtml, "escapeHtml");
function headersForHost(env, host) {
  return { ...HOST_HEADERS[host] ?? {}, "User-Agent": userAgent(env) };
}
__name(headersForHost, "headersForHost");
async function fetchText(url, headers = {}, timeoutMs = 15e3) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { Accept: "*/*", ...headers } });
    return { ok: res.ok, status: res.status, text: await res.text() };
  } finally {
    clearTimeout(t);
  }
}
__name(fetchText, "fetchText");
async function fetchTextHeaders(url, headers = {}, timeoutMs = 15e3) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { Accept: "*/*", ...headers } });
    return { ok: res.ok, status: res.status, text: await res.text(), headers: res.headers };
  } finally {
    clearTimeout(t);
  }
}
__name(fetchTextHeaders, "fetchTextHeaders");
async function fetchJsonRetry(url, headers = {}, tries = 3) {
  let last = { ok: false, status: 0, json: null, text: "" };
  for (let i = 0; i < tries; i++) {
    const r = await fetchJson(url, headers);
    if (r.status !== 429)
      return r;
    last = r;
    await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
  }
  return last;
}
__name(fetchJsonRetry, "fetchJsonRetry");
async function fetchJson(url, headers = {}, timeoutMs = 15e3) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { Accept: "application/json", ...headers } });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
    }
    return { ok: res.ok, status: res.status, json, text };
  } finally {
    clearTimeout(t);
  }
}
__name(fetchJson, "fetchJson");
function resolveUrl(base, part) {
  if (!part)
    return null;
  if (/^https?:\/\//i.test(part))
    return part;
  try {
    return new URL(part, base).href;
  } catch {
    return null;
  }
}
__name(resolveUrl, "resolveUrl");
async function extractPageTitle(url) {
  try {
    const origin = new URL(url).origin;
    const { ok, text } = await fetchText(url, { Referer: origin + "/", "User-Agent": UA_DEFAULT });
    if (!ok)
      return null;
    const m = text.match(/<title[^>]*>([\s\S]{3,300}?)<\/title>/i);
    if (!m)
      return null;
    const t = m[1].replace(/\s+/g, " ").trim();
    if (!t || /^(mixdrop|vidmoly|ufoload|abyss|player|watch|video)\b/i.test(t))
      return null;
    return t;
  } catch {
    return null;
  }
}
__name(extractPageTitle, "extractPageTitle");
async function ensureSchema(db) {
  const errors = [];
  const single = /* @__PURE__ */ __name(async (label, sql) => {
    try {
      await db.prepare(sql).run();
    } catch (e) {
      errors.push(`${label}: ${String(e)}`);
    }
  }, "single");
  await single("create media_items", DDL_MAIN);
  await single("create host_uploads", DDL_UPLOADS);
  await single("create sync_state", DDL_SYNC);
  await single("create watchlist", DDL_WATCHLIST);
  for (const [table, column] of ALTER_COLUMNS) {
    await single(`alter ${table} + ${column.split(" ")[0]}`, `ALTER TABLE ${table} ADD COLUMN ${column}`);
  }
  return errors;
}
__name(ensureSchema, "ensureSchema");
function parseFilename(fileName) {
  const clean = fileName.replace(/\.[a-z0-9]+$/i, "").replace(/\[[^\]]*\]/g, " ").replace(/_[^_]*_(?=\s|$)/g, " ").replace(/\b(480p|720p|1080p|2160p|4k|WEB-?DL|WEB-?Rip|WEB|BluRay|BDRip|BRRip|HDRip|CAM|TS|REMUX|DVD|x26[45]|HEVC|H\.?26[45]|AVC|AAC\s?2\s?0|Multi\s?Audio|ESub|ESubs|Subbed|Dubbed|Dual|Multi|HDR10\+?|10bit|AnimeDubHindi|Anime\s?Dub\s?Hindi|HindiDub|PROPER|REPACK|AMZN|NF|DNP|UNCUT|CBFC|ORG|HDTC|HDTV|PDTV|HC-?ESubs?|JioHotstar)\b/gi, " ").replace(/\b(Hindi|Tamil|Telugu|English|Malayalam|Kannada|Bengali|Polish|Spanish|French|Russian|Arabic|Korean|Japanese|Chinese|Portuguese|Italian|German|Turkish|Indonesian|Thai|Vietnamese)(?:[-\s]+(?:Hindi|Tamil|Telugu|English|Malayalam|Kannada|Bengali|Polish|Spanish|French|Russian|Arabic|Korean|Japanese|Chinese|Portuguese|Italian|German|Turkish|Indonesian|Thai|Vietnamese))*[-\s]?/gi, " ").replace(/[._]+/g, " ").replace(/\s+/g, " ").trim();
  const out = { tmdbId: null, season: null, episode: null, title: null, year: null };
  const ym = clean.match(/\((19\d{2}|20\d{2})\)|(?:\s|^)(19\d{2}|20\d{2})(?:\s|$)/);
  if (ym)
    out.year = parseInt(ym[1] || ym[2], 10);
  const tmdbMatch2 = clean.match(/tmdb[_\s]?(\d+)(?:[_\s\-]?[Ss](\d+)[_\s\-]?[Ee](\d+))?/);
  if (tmdbMatch2) {
    out.tmdbId = parseInt(tmdbMatch2[1], 10);
    if (tmdbMatch2[2] != null && tmdbMatch2[3] != null) {
      out.season = parseInt(tmdbMatch2[2], 10);
      out.episode = parseInt(tmdbMatch2[3], 10);
    }
    return out;
  }
  const sxx = clean.match(/(\d+)[_\s\-]?[Ee][_\s\-]?(\d+)/);
  if (sxx) {
    out.season = parseInt(sxx[1], 10);
    out.episode = parseInt(sxx[2], 10);
  }
  const title = clean.replace(/[Ss]\d+[_\s\-]?[Ee]\d+/i, "").replace(/\(\d{4}\)|\.?19\d{2}|\.?20\d{2}/g, "").replace(/\.?1080p|\.?720p|\.?4k|\.?WEB-?DL|\.?BluRay|\.?x26[45]|\.?HEVC|\.?AAC|\.?H\.?264|\.?H\.?265|\.?AVC|\.?MP4|\.?MKV|\.?ESubs?|\.?HDTC|\.?JioHotstar|\.?HC-?ESubs?/gi, " ").replace(/(?:Hindi|Tamil|Telugu|English|Malayalam|Kannada|Bengali)(?:[-\s]+(?:Hindi|Tamil|Telugu|English|Malayalam|Kannada|Bengali))*/gi, " ").replace(/[._]+/g, " ").replace(/\s+/g, " ").trim();
  out.title = title || null;
  return out;
}
__name(parseFilename, "parseFilename");
var LANG_WORDS = "Hindi|Tamil|Telugu|English|Malayalam|Kannada|Bengali|Polish|Spanish|French|Russian|Arabic|Korean|Japanese|Chinese|Portuguese|Italian|German|Turkish|Indonesian|Thai|Vietnamese|Multi";
var stripLangTags = /* @__PURE__ */ __name((s) => s.replace(new RegExp(`\\b(?:${LANG_WORDS})(?:[-\\s]+(?:${LANG_WORDS}))*\\b`, "gi"), " ").replace(/\s+/g, " ").trim(), "stripLangTags");
function titleMatches(query, name, queryYear, resultYear) {
  const norm = /* @__PURE__ */ __name((x) => x.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(), "norm");
  const qs = norm(query), ns = norm(name);
  const q = qs.split(" ").filter((w) => w.length > 2);
  const na = ns.split(" ").filter((w) => w.length > 2);
  const n = new Set(na);
  if (!q.length)
    return false;
  if (queryYear && resultYear && Math.abs(queryYear - resultYear) > 2)
    return false;
  const shared = q.filter((w) => n.has(w)).length;
  if (shared >= 2) {
    const idx = q.map((w) => na.indexOf(w));
    if (idx.every((v, i) => v >= 0 && (i === 0 || v > idx[i - 1])))
      return true;
  }
  if (shared >= 1 && queryYear && resultYear && queryYear === resultYear)
    return true;
  if (q.length === 1 && shared === 1)
    return true;
  const fuzzy = /* @__PURE__ */ __name((a, b) => {
    if (a === b)
      return true;
    if (a.length < 5 || b.length < 5)
      return false;
    if (a.includes(b) || b.includes(a))
      return true;
    const lev = /* @__PURE__ */ __name((x, y) => {
      const dp = Array.from({ length: y.length + 1 }, (_, i) => i);
      for (let i = 1; i <= x.length; i++) {
        let prev = dp[0];
        dp[0] = i;
        for (let j = 1; j <= y.length; j++) {
          const t = dp[j];
          dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (x[i - 1] === y[j - 1] ? 0 : 1));
          prev = t;
        }
      }
      return dp[y.length];
    }, "lev");
    return lev(a, b) <= 1;
  }, "fuzzy");
  if (q.length === 1 && na.length === 1 && fuzzy(q[0], na[0]))
    return true;
  if (q.length === na.length && q.every((w, i) => fuzzy(w, na[i])))
    return true;
  return false;
}
__name(titleMatches, "titleMatches");
async function tmdbMatch(env, parsed) {
  const key2 = env.TMDB_API_KEY;
  if (!key2)
    return null;
  const detail = /* @__PURE__ */ __name(async (mediaType, id) => {
    const { ok, json } = await fetchJsonRetry(`https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${key2}&language=en-US`);
    if (!ok || !json)
      return null;
    return {
      tmdbId: id,
      type: mediaType === "movie" ? "movie" : "series",
      title: json.title ?? json.name ?? "Unknown",
      poster: json.poster_path ? `https://image.tmdb.org/t/p/w500${json.poster_path}` : "",
      backdrop: json.backdrop_path ? `https://image.tmdb.org/t/p/w1280${json.backdrop_path}` : "",
      overview: json.overview ?? "",
      rating: typeof json.vote_average === "number" ? json.vote_average : 0,
      genres: (json.genres || []).map((g) => String(g.name || "")).filter(Boolean),
      originCountry: String(json.origin_country?.[0] || json.production_countries?.[0]?.iso_3166_1 || "")
    };
  }, "detail");
  if (parsed.tmdbId != null) {
    if (parsed.season != null) {
      const show = await detail("tv", parsed.tmdbId);
      if (show)
        return { ...show, season: parsed.season, episode: parsed.episode };
      const movie = await detail("movie", parsed.tmdbId);
      if (movie)
        return { ...movie, season: null, episode: null };
    } else {
      const movie = await detail("movie", parsed.tmdbId);
      if (movie)
        return { ...movie, season: null, episode: null };
      const show = await detail("tv", parsed.tmdbId);
      if (show)
        return { ...show, season: parsed.season, episode: parsed.episode };
    }
  }
  if (parsed.title) {
    const parts = parsed.title.split(/\s+[-\u2013\u2014]\s+/).map((x) => x.trim()).filter(Boolean);
    const aka = parsed.title.split(/\s+aka\s+/i).map((x) => x.trim()).filter(Boolean);
    const stripped = [...parts, ...aka].map(stripLangTags).filter(Boolean);
    const candidates = [.../* @__PURE__ */ new Set([
      parsed.title,
      stripLangTags(parsed.title),
      ...parts,
      ...aka,
      ...stripped
    ])].filter(Boolean).slice(0, 2);
    const types = parsed.season != null ? ["tv", "movie"] : ["movie", "tv"];
    for (const candidate of candidates) {
      for (const mediaType of types) {
        const { ok, json } = await fetchJsonRetry(
          `https://api.themoviedb.org/3/search/${mediaType}?api_key=${key2}&query=${encodeURIComponent(candidate)}&language=en-US`
        );
        if (!ok || !json)
          continue;
        for (const r of json.results || []) {
          const name = String(r.title ?? r.name ?? "");
          const rd = r.release_date || r.first_air_date;
          const resultYear = rd ? parseInt(String(rd).slice(0, 4), 10) : null;
          if (!titleMatches(candidate, name, parsed.year, resultYear))
            continue;
          return {
            tmdbId: r.id,
            type: mediaType === "movie" ? "movie" : "series",
            title: name || "Unknown",
            poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : "",
            backdrop: r.backdrop_path ? `https://image.tmdb.org/t/p/w1280${r.backdrop_path}` : "",
            overview: r.overview || "",
            rating: typeof r.vote_average === "number" ? r.vote_average : 0,
            genres: (r.genres || []).map((g) => String(g.name || "")).filter(Boolean).length ? (r.genres || []).map((g) => String(g.name || "")).filter(Boolean) : (r.genre_ids || []).map((gid) => String(TMDB_GENRE_NAMES[gid] || "")).filter(Boolean),
            originCountry: String(r.origin_country?.[0] || r.production_countries?.[0]?.iso_3166_1 || ""),
            // Movie match → season/episode null (recap/compilation movies).
            season: mediaType === "movie" ? null : parsed.season,
            episode: mediaType === "movie" ? null : parsed.episode
          };
        }
      }
    }
  }
  return null;
}
__name(tmdbMatch, "tmdbMatch");
var TMDB_GENRE_NAMES = {
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  28: "Action",
  12: "Adventure",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics"
};
function categoryOf(meta) {
  if (meta?.type === "movie")
    return "movie";
  const genres = Array.isArray(meta?.genres) ? meta.genres : [];
  const origin = String(meta?.originCountry || "").toUpperCase();
  if (genres.some((g) => /animation|anime/i.test(g)) || origin === "JP")
    return "anime";
  return "tv";
}
__name(categoryOf, "categoryOf");
async function enrichGenres(env, meta) {
  if (meta?.genres?.length || !meta?.tmdbId)
    return;
  try {
    const mt = meta.type === "movie" ? "movie" : "tv";
    const { ok, json } = await fetchJsonRetry(`https://api.themoviedb.org/3/${mt}/${meta.tmdbId}?api_key=${env.TMDB_API_KEY}&language=en-US`);
    if (ok && json) {
      meta.genres = (json.genres || []).map((g) => String(g.name || "")).filter(Boolean);
      meta.originCountry = String(json.origin_country?.[0] || json.production_countries?.[0]?.iso_3166_1 || "");
    }
  } catch {
  }
}
__name(enrichGenres, "enrichGenres");
function unpackPackedJs(input) {
  const raw2 = input.trim();
  if (!/^eval\(function\(p,a,c,k,e/.test(raw2) && !raw2.includes("eval(function(p,a,c,k,e"))
    return null;
  const m = raw2.match(/}\('((?:[^'\\]|\\.)*)',(\d+),(\d+),'([^']*)'/);
  if (!m)
    return null;
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const encodeBase = /* @__PURE__ */ __name((value, base2) => {
    if (base2 <= 36)
      return value.toString(base2);
    let n = value, out = "";
    do {
      out = alphabet[n % base2] + out;
      n = Math.floor(n / base2);
    } while (n > 0);
    return out;
  }, "encodeBase");
  const p = m[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\");
  const base = parseInt(m[2], 10) || 62;
  const count = parseInt(m[3], 10) || 0;
  const k = m[4].split("|");
  const r = {};
  for (let i = 0; i < count; i++)
    r[encodeBase(i, base)] = k[i] || encodeBase(i, base);
  let decoded = p;
  let counter = count;
  while (counter--) {
    const token = encodeBase(counter, base);
    const replacement = k[counter] || token;
    if (replacement !== token) {
      decoded = decoded.replace(new RegExp("\\b" + token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g"), replacement);
    }
  }
  return decoded;
}
__name(unpackPackedJs, "unpackPackedJs");
async function extractVidmoly(inputUrl, pageUrl) {
  const embedId = (inputUrl.match(/\/embed(?:-|\/)([A-Za-z0-9]+)\.?html?/i) || [])[1] || (pageUrl ? (pageUrl.match(/\/embed(?:-|\/)([A-Za-z0-9]+)\.?html?/i) || [])[1] : null);
  const embedUrl = embedId ? `https://vidmoly.to/embed-${embedId}.html` : pageUrl || inputUrl;
  const { ok, status, text } = await fetchText(embedUrl, { Referer: "https://vidmoly.to/", Origin: "https://vidmoly.to" });
  if (!ok)
    throw new Error(`Vidmoly HTTP ${status}`);
  const hls = text.match(/['"](https?:[^'"]+\.m3u8[^'"]*)['"]/i) || text.replace(/\\u002F/gi, "/").replace(/\\\//g, "/").match(/['"](https?:[^'"]+\.m3u8[^'"]*)['"]/i);
  if (!hls)
    throw new Error("Vidmoly: no m3u8");
  return resolveUrl(embedUrl, hls[1]);
}
__name(extractVidmoly, "extractVidmoly");
async function streamtapeApiDirect(env, fileId) {
  const login = env.STREAMTAPE_USER || env.STREAMTAPE_LOGIN;
  const key2 = env.STREAMTAPE_KEY;
  if (!login || !key2 || !/^[A-Za-z0-9]+$/.test(fileId))
    return null;
  const tk = await fetchJson(`https://api.streamtape.com/file/dlticket?file=${encodeURIComponent(fileId)}&login=${encodeURIComponent(login)}&key=${encodeURIComponent(key2)}`);
  const ticket = tk.json?.result?.ticket;
  if (!ticket)
    return null;
  const wait = Math.min(Math.max(Number(tk.json?.result?.wait_time || 5), 4), 12);
  await new Promise((r) => setTimeout(r, wait * 1e3));
  for (let i = 0; i < 3; i++) {
    const dl = await fetchJson(`https://api.streamtape.com/file/dl?file=${encodeURIComponent(fileId)}&ticket=${encodeURIComponent(ticket)}`);
    const url = dl.json?.result?.url;
    if (url)
      return String(url);
    if (/wait/i.test(String(dl.json?.msg || ""))) {
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }
    break;
  }
  return null;
}
__name(streamtapeApiDirect, "streamtapeApiDirect");
async function extractStreamtape(inputUrl, pageUrl, cookieJar, env) {
  const embedId = (inputUrl.match(/(?:streamtape\.com)\/(?:e|v|embed)\/([A-Za-z0-9]+)/i) || [])[1] || (pageUrl ? (pageUrl.match(/(?:streamtape\.com)\/(?:e|v|embed)\/([A-Za-z0-9]+)/i) || [])[1] : null);
  const pageUrls = embedId ? [
    `https://streamtape.com/e/${embedId}`,
    `https://stape.io/e/${embedId}`,
    `https://streamtape.com/v/${embedId}`
  ] : [pageUrl || inputUrl];
  if (embedId && env) {
    try {
      const apiDirect = await streamtapeApiDirect(env, embedId);
      if (apiDirect)
        return apiDirect;
    } catch {
    }
  }
  let pageRes = null;
  let resolvedPage = pageUrls[0];
  let ok = false, status = 0, text = "";
  for (const u of pageUrls) {
    const r = await fetchTextHeaders(u, { Referer: "https://streamtape.com/", Origin: "https://streamtape.com" });
    pageRes = r;
    if (r.ok) {
      resolvedPage = u;
      ok = true;
      text = r.text;
      break;
    }
    status = r.status;
  }
  if (cookieJar) {
    try {
      const sc = pageRes.headers.getSetCookie?.() ?? [];
      if (sc.length)
        cookieJar.value = sc.map((c) => c.split(";")[0]).join("; ");
    } catch {
    }
  }
  if (!ok)
    throw new Error(`Streamtape HTTP ${status}`);
  const signed = text.match(/https?:[^'"]*\/get_video\?[^'"]*/i);
  if (signed)
    return signed[0];
  const relSigned = text.match(/(\/streamtape\.com\/get_video\?[^"'<>\s]+)/i);
  if (relSigned)
    return fixRel(relSigned[1]);
  const exprRe = /getElementById\(['"]robotlink['"]\)\.innerHTML\s*=\s*['"]([^'"]*)['"]\s*\+\s*\('([^']*)'\)((?:\.substring\(\d+\))+)/g;
  let em, lastExpr = null;
  while ((em = exprRe.exec(text)) !== null)
    lastExpr = em;
  if (lastExpr) {
    let s = lastExpr[2];
    const ops = [...lastExpr[3].matchAll(/\.substring\((\d+)\)/g)].map((x) => parseInt(x[1], 10));
    for (const n of ops)
      s = s.substring(n);
    return fixRel(lastExpr[1] + s);
  }
  const robot = text.match(/id="(?:robotlink|botlink|ideoolink)"[^>]*>([^<]+)</i);
  if (robot)
    return fixRel(robot[1].trim());
  const token = text.match(/["']?token["']?\s*[:=]\s*["']([A-Za-z0-9]+)["']/);
  if (token && embedId) {
    const { ok: jOk, json } = await fetchJson("https://streamtape.com/ajax.php", {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      Referer: resolvedPage,
      Origin: "https://streamtape.com"
    }, 2e4);
    if (jOk) {
      const direct = json?.result?.data?.link || json?.result?.link || json?.data?.link || (typeof json?.result === "string" ? json.result : null);
      if (direct && /^https?:/.test(direct))
        return direct;
    }
  }
  throw new Error("Streamtape: no robotlink");
}
__name(extractStreamtape, "extractStreamtape");
async function extractMixdrop(inputUrl, pageUrl, cookieJar) {
  const EMBED_RE = /(?:mixdrop|mxdrop)(?:\.co|\.to|\.top|\.ws|\.fm|\.nu|\.ag|\.click|\.ch|\.sx|\.io|\.net|\.com)?\/(?:e|f|v)\/([A-Za-z0-9]+)/i;
  const embedId = (inputUrl.match(EMBED_RE) || [])[1] || (pageUrl ? (pageUrl.match(EMBED_RE) || [])[1] : null);
  const HOSTS = ["mxdrop.click", "mixdrop.co", "mixdrop.ag", "mixdrop.to"];
  const joined = inputUrl + (pageUrl || "");
  const hm = joined.match(/https?:\/\/((?:mixdrop|mxdrop)[^/]*)/i);
  const preferred = hm ? hm[1] : null;
  const candidates = preferred ? [preferred, ...HOSTS.filter((h) => h !== preferred)] : HOSTS;
  let lastErr = "no embed id";
  if (!embedId)
    throw new Error(lastErr);
  for (const host of candidates) {
    const resolvedPage = `https://${host}/e/${embedId}`;
    try {
      const pageRes = await fetchTextHeaders(resolvedPage, { Referer: "https://mixdrop.ag/", Origin: "https://mixdrop.ag" });
      const { ok, status, text } = pageRes;
      if (cookieJar) {
        try {
          const sc = pageRes.headers.getSetCookie?.() ?? [];
          if (sc.length)
            cookieJar.value = sc.map((c) => c.split(";")[0]).join("; ");
        } catch {
        }
      }
      if (!ok) {
        lastErr = `MixDrop HTTP ${status} (${host})`;
        continue;
      }
      const scripts = text.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
      for (const script of scripts) {
        if (!/MDCore|wurl/i.test(script))
          continue;
        const decoded = unpackPackedJs(script);
        if (decoded) {
          const assign = decoded.match(/(?:MDCore\.wurl|wurl)\s*=\s*['"]([^'"]+)['"]/i);
          if (assign)
            return normalizeUrl(assign[1]);
          const urls = decoded.match(/https?:[^\s'"]+/g) || [];
          if (urls.length)
            return urls[urls.length - 1];
        }
      }
      const plain = text.match(/(?:MDCore\.wurl|wurl)\s*=\s*['"]([^'"]+)['"]/i);
      if (plain)
        return normalizeUrl(plain[1]);
      lastErr = `no MDCore.wurl (${host})`;
    } catch (e) {
      lastErr = `${host}: ` + String(e).slice(0, 80);
    }
  }
  throw new Error("MixDrop: " + lastErr);
}
__name(extractMixdrop, "extractMixdrop");
function toStreamtapeProxy(origin, url) {
  const m = url.match(/streamtape\.com\/(?:e|v)\/([A-Za-z0-9]+)/i) || url.match(/get_video\?id=([A-Za-z0-9]+)/i);
  return m ? origin + "/proxy/st/" + m[1] : url;
}
__name(toStreamtapeProxy, "toStreamtapeProxy");
function normalizeUrl(u) {
  return u.startsWith("//") ? "https:" + u : u;
}
__name(normalizeUrl, "normalizeUrl");
function fixRel(u) {
  if (u.startsWith("//"))
    return "https:" + u;
  if (u.startsWith("/"))
    return "https://" + u.slice(1);
  return u;
}
__name(fixRel, "fixRel");
async function listUfoloadUploads(env) {
  const key2 = env.UFOLOAD_API_KEY || env.UFOLOAD_KEY;
  if (!key2)
    return [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  try {
    for (let offset = 0; offset < 300; offset += 100) {
      const { ok, json } = await fetchJson("https://ufoload.com/api/v1/files?status=ready&limit=100&offset=" + offset, {
        Authorization: "Bearer " + key2
      });
      if (!ok || !json)
        break;
      const items = json.items || json.files || json?.result?.files || json?.data?.files || [];
      if (items.length === 0)
        break;
      for (const f of items) {
        const fid = String(f.id || "");
        if (!fid || seen.has(fid))
          continue;
        seen.add(fid);
        out.push({
          id: "ufo_" + fid,
          host: "ufoload",
          fileName: String(f.name || ""),
          size: Number(f.size) || 0,
          status: f.status === "ready" ? 200 : 0,
          pageUrl: "https://ufoload.com/api/v1/files/" + fid
        });
      }
      if (items.length < 100)
        break;
    }
  } catch {
  }
  return out;
}
__name(listUfoloadUploads, "listUfoloadUploads");
async function listEarnvidsUploads(env) {
  const key2 = env.EARNVIDS_API_KEY;
  if (!key2)
    return [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  try {
    for (let page = 1; page <= 5; page++) {
      const { ok, json } = await fetchJson("https://earnvids.com/api/file/list?key=" + encodeURIComponent(key2) + "&per_page=100&page=" + page);
      if (!ok || !json?.result)
        break;
      const files = Array.isArray(json.result) ? json.result : json.result.files || [];
      if (files.length === 0)
        break;
      for (const f of files) {
        const code = String(f.file_code || f.filecode || "");
        if (!code || seen.has(code))
          continue;
        seen.add(code);
        out.push({
          id: "ev_" + code,
          host: "earnvids",
          fileName: String(f.title || f.name || ""),
          size: Number(f.size) || 0,
          status: Number(f.canplay) === 1 ? 200 : 0,
          pageUrl: String(f.link || "") || "https://morencius.com/file/" + code
        });
      }
      if (files.length < 100)
        break;
    }
  } catch {
  }
  return out;
}
__name(listEarnvidsUploads, "listEarnvidsUploads");
async function listDoodstreamUploads(env) {
  return [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  let titleLookups = 0;
  const BASES = ["https://doodapi.co/api", "https://doodstream.com/api"];
  let listing = null;
  for (const base of BASES) {
    try {
      const r = await fetchJson(base + "/file/list?key=" + encodeURIComponent(key) + "&per_page=100&page=1");
      if (r.ok && r.json?.result) {
        listing = r;
        break;
      }
    } catch {
    }
  }
  if (!listing)
    return [];
  for (let page = 1; page <= 5; page++) {
    const { ok, json } = page === 1 ? listing : await fetchJson(
      "https://doodapi.co/api/file/list?key=" + encodeURIComponent(key) + "&per_page=100&page=" + page
    );
    if (!ok || !json?.result)
      break;
    const files = Array.isArray(json.result) ? json.result : json.result.files || [];
    if (files.length === 0)
      break;
    for (const f of files) {
      const code = String(f.file_code || f.filecode || "");
      if (!code || seen.has(code))
        continue;
      seen.add(code);
      let title = String(f.title || f.name || "");
      if (!/[Ss]\d{1,2}[._\- ]?[Ee]\d{1,3}/.test(title) && titleLookups < 6) {
        titleLookups++;
        try {
          const { ok: infoOk, json: infoJson } = await fetchJson(
            "https://doodapi.co/api/file/info?key=" + encodeURIComponent(key) + "&file_code=" + encodeURIComponent(code)
          );
          const infoTitle = String(infoJson?.result?.[0]?.title || "");
          if (infoOk && infoTitle)
            title = infoTitle;
        } catch {
        }
      }
      out.push({
        id: "ds_" + code,
        host: "doodstream",
        fileName: title,
        size: Number(f.size) || 0,
        // canplay=0 (premium/processing) hone par bhi include karo — embed page
        // worker WebView fallback se playable ho sakta hai. status sirf diagnostic.
        status: 200,
        pageUrl: String(f.download_url || f.link || "") || "https://doodstream.com/file/" + code
      });
    }
    if (files.length < 100)
      break;
  }
  return out;
}
__name(listDoodstreamUploads, "listDoodstreamUploads");
async function earnvidsDirectLink(env, code, ip) {
  const key2 = env.EARNVIDS_API_KEY;
  if (!key2 || !code)
    return null;
  const cacheKey = new Request(`https://earnvids-link.internal/${code}/${ip || "any"}`);
  try {
    const hit = await caches.default.match(cacheKey);
    if (hit) {
      const cached = (await hit.text()).trim();
      if (cached)
        return cached;
    }
  } catch {
  }
  const { ok, json } = await fetchJson(
    "https://earnvids.com/api/file/direct_link?key=" + encodeURIComponent(key2) + "&file_code=" + encodeURIComponent(code) + (ip ? "&ip=" + encodeURIComponent(ip) : "")
  );
  const link = ok ? String(json?.result?.hls_direct || json?.result?.url || json?.result?.mp4 || "") : "";
  if (!link)
    return null;
  try {
    await caches.default.put(
      cacheKey,
      new Response(link, { headers: { "cache-control": "max-age=43200" } })
    );
  } catch {
  }
  return link;
}
__name(earnvidsDirectLink, "earnvidsDirectLink");
function fileRefOf(url) {
  const u = String(url || "");
  const m = u.match(/\/(?:e|f|v|file)\/([A-Za-z0-9]+)/i) || u.match(/\/files\/([A-Za-z0-9]+)/i) || u.match(/\/v2\/([A-Za-z0-9]+)\.mp4/i);
  return m ? m[1] : "";
}
__name(fileRefOf, "fileRefOf");
function nameFastIdOf(fileName) {
  const p = parseFilename(String(fileName || ""));
  if (p.tmdbId == null)
    return "";
  return p.tmdbId + ":" + (p.season != null ? "series" : "movie") + ":" + (p.season ?? 0) + ":" + (p.episode ?? 0);
}
__name(nameFastIdOf, "nameFastIdOf");
async function updateHostUrl(env, rowId, host, url) {
  const field = HOST_FIELD[host];
  if (!field || !url)
    return;
  try {
    await env.DB.prepare(
      `UPDATE media_items SET ${field}=?, updated_at=datetime('now') WHERE id=? AND ${field}<>?`
    ).bind(url, rowId, url).run();
  } catch (e) {
    console.log("url update failed", host, String(e).slice(0, 100));
  }
}
__name(updateHostUrl, "updateHostUrl");
async function filemoonDirectLink(host, apiBase, apiKey, code, ip) {
  if (!apiKey || !code)
    return null;
  const cacheKey = new Request(`https://${host}-link.internal/${code}/${ip || "any"}`);
  try {
    const hit = await caches.default.match(cacheKey);
    if (hit) {
      const cached = (await hit.text()).trim();
      if (cached)
        return cached;
    }
  } catch {
  }
  const { ok, json } = await fetchJson(
    `${apiBase}/api/file/direct_link?key=${encodeURIComponent(apiKey)}&file_code=${encodeURIComponent(code)}` + (ip ? `&ip=${encodeURIComponent(ip)}` : "")
  );
  const link = ok ? String(json?.result?.hls_direct || json?.result?.url || json?.result?.mp4 || "") : "";
  if (!link)
    return null;
  try {
    await caches.default.put(
      cacheKey,
      new Response(link, { headers: { "cache-control": "max-age=43200" } })
    );
  } catch {
  }
  return link;
}
__name(filemoonDirectLink, "filemoonDirectLink");
async function doodstreamDirectLink(env, code, ip, originHintUrl) {
  const api = await filemoonDirectLink(
    "doodstream",
    "https://doodstream.com",
    env.DOODSTREAM_API_KEY || "",
    code,
    ip
  ).catch(() => null);
  if (api)
    return api;
  let originHint;
  try {
    originHint = new URL(originHintUrl).origin;
  } catch {
  }
  return extractDoodstreamEmbed(env, code, originHint);
}
__name(doodstreamDirectLink, "doodstreamDirectLink");
async function extractDoodstreamEmbed(env, code, originHint) {
  const origins = [originHint, "https://doodstream.com"].filter(Boolean);
  const candidates = [];
  for (const origin of origins) {
    const base = origin.replace(/\/+$/, "");
    candidates.push(`${base}/e/${code}`, `${base}/file/${code}`);
  }
  for (const pageUrl of candidates) {
    const { ok, text } = await fetchText(pageUrl, {
      "User-Agent": userAgent(env),
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://doodstream.com/",
      Origin: "https://doodstream.com"
    });
    if (!ok || !text || text.length < 2e3)
      continue;
    const scripts = text.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
    for (const script of scripts) {
      const decoded = unpackPackedJs(script);
      if (!decoded)
        continue;
      const wurl = decoded.match(/(?:MDCore\.wurl|wurl)\s*=\s*['"]([^'"]+)['"]/i);
      if (wurl)
        return normalizeUrl(wurl[1]);
      const m3u8 = decoded.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
      if (m3u8)
        return m3u8[0];
      const mp4 = decoded.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/i);
      if (mp4)
        return mp4[0];
    }
    const plain = text.match(/https?:\/\/[^"'\s]+\.(?:m3u8|mp4)[^"'\s]*/i);
    if (plain)
      return plain[0];
  }
  return null;
}
__name(extractDoodstreamEmbed, "extractDoodstreamEmbed");
async function extractUfoload(inputUrl, pageUrl) {
  const embedId = (inputUrl.match(/(?:ufoload\.io)\/(?:v|e|embed)\/([A-Za-z0-9]+)/i) || [])[1] || (pageUrl ? (pageUrl.match(/(?:ufoload\.io)\/(?:v|e|embed)\/([A-Za-z0-9]+)/i) || [])[1] : null);
  const resolvedPage = embedId ? `https://ufoload.io/v/${embedId}` : pageUrl || inputUrl;
  const { ok, status, text } = await fetchText(resolvedPage, { Referer: "https://ufoload.io/", Origin: "https://ufoload.io" });
  if (!ok)
    throw new Error(`UFOload HTTP ${status}`);
  const direct = text.match(/https?:[^'"]+\.mp4[^'"]*/i) || text.match(/(?:file|src)\s*[:=]\s*['"](https?:[^'"]+)['"]/i);
  if (!direct)
    throw new Error("UFOload: no mp4");
  return resolveUrl(resolvedPage, direct[0]);
}
__name(extractUfoload, "extractUfoload");
async function listStreamtape(env) {
  const login = env.STREAMTAPE_USER || env.STREAMTAPE_LOGIN;
  if (!login || !env.STREAMTAPE_KEY)
    return [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const call = /* @__PURE__ */ __name(async (folder) => {
    for (const api of ["https://api.streamtape.com/file/listfolder", "https://api.streamtape.to/file/listfolder"]) {
      const qs = `login=${encodeURIComponent(login)}&key=${encodeURIComponent(env.STREAMTAPE_KEY || "")}`;
      const r = await fetchJson(`${api}?${qs}${folder ? "&folder=" + encodeURIComponent(folder) : ""}`, { Referer: "https://streamtape.com/" });
      if (r.ok && r.json?.status === 200)
        return r.json;
    }
    return null;
  }, "call");
  const collect = /* @__PURE__ */ __name((json) => {
    for (const f of json?.result?.files || []) {
      const fid = String(f.linkid || f.id || "");
      if (!fid || seen.has(fid))
        continue;
      seen.add(fid);
      out.push({
        id: fid,
        host: "streamtape",
        fileName: String(f.name || f.file_name || ""),
        size: Number(f.size) || 0,
        status: 200,
        pageUrl: String(f.link || `https://streamtape.com/v/${fid}`)
      });
    }
  }, "collect");
  const root = await call();
  if (!root)
    return [];
  collect(root);
  const folders = root?.result?.folders || [];
  if (folders.length) {
    const start = (/* @__PURE__ */ new Date()).getUTCMinutes() % folders.length;
    for (let i = 0; i < Math.min(2, folders.length); i++) {
      const folder = folders[(start + i) % folders.length];
      const fid = folder?.id;
      if (!fid)
        continue;
      const j = await call(String(fid));
      if (j)
        collect(j);
    }
  }
  return out;
}
__name(listStreamtape, "listStreamtape");
function parseUploadsJson(env) {
  if (!env.UPLOADS_JSON || !env.UPLOADS_JSON.trim())
    return [];
  try {
    const parsed = JSON.parse(env.UPLOADS_JSON);
    if (!Array.isArray(parsed))
      return [];
    return parsed.map((row, i) => {
      const host = String(row.host || "").toLowerCase();
      const pageUrl = String(row.url || row.pageUrl || row.iframeUrl || "");
      if (!host || !pageUrl)
        return null;
      return {
        id: String(row.id || i || pageUrl),
        host,
        fileName: String(row.fileName || row.name || ""),
        size: Number(row.size) || 0,
        status: Number(row.status) || 200,
        pageUrl,
        webview: host === "abyss"
      };
    }).filter(Boolean);
  } catch {
    return [];
  }
}
__name(parseUploadsJson, "parseUploadsJson");
function detectHost(url) {
  const u = url.toLowerCase();
  if (/streamtape\.com|stape\.io/.test(u))
    return "streamtape";
  if (/vidmoly/.test(u))
    return "vidmoly";
  if (/mixdrop|mxdrop/.test(u))
    return "mixdrop";
  if (/abyss/.test(u))
    return "abyss";
  if (/ufoload/.test(u))
    return "ufoload";
  if (/byse|bysetayico/.test(u))
    return "byse";
  if (/earnvids|morencius|dramiyos/.test(u))
    return "earnvids";
  if (/doodstream|dood\.to|doodcdn|doodreels/.test(u))
    return "doodstream";
  return null;
}
__name(detectHost, "detectHost");
async function listWatchlist(db) {
  try {
    const { results } = await db.prepare("SELECT url, host, file_name, media_type, tmdb_id FROM watchlist").all();
    return (results || []).map((r) => {
      let fileName = String(r.file_name || "");
      if (!fileName && r.tmdb_id) {
        const ep = /[Ss](\d{1,2})[Ee](\d{1,3})/.exec(fileName);
        fileName = r.media_type === "movie" ? `tmdb_${r.tmdb_id}.mp4` : `tmdb_${r.tmdb_id}.mp4`;
      }
      return {
        id: r.url,
        host: r.host,
        fileName,
        size: 0,
        status: 200,
        pageUrl: r.url,
        webview: r.host === "abyss"
      };
    });
  } catch {
    return [];
  }
}
__name(listWatchlist, "listWatchlist");
async function listAbyssUploads(env) {
  if (!env.ABYSS_API_KEY)
    return [];
  const out = [];
  let pageToken = "";
  for (let i = 0; i < 5; i++) {
    let u = "https://api.abyss.to/v1/resources?key=" + env.ABYSS_API_KEY + "&type=files&maxResults=100";
    if (pageToken)
      u += "&pageToken=" + encodeURIComponent(pageToken);
    try {
      const { ok, json } = await fetchJson(u);
      if (!ok || !json?.items)
        break;
      for (const f of json.items) {
        if (f.isDir)
          continue;
        if (f.status !== "ready")
          continue;
        out.push({
          id: "ab_" + f.id,
          host: "abyss",
          fileName: String(f.name || ""),
          size: Number(f.size) || 0,
          status: 200,
          pageUrl: "https://player.abyssplayer.com/" + f.id
        });
      }
      pageToken = json.pageToken || "";
      if (!pageToken)
        break;
    } catch {
      break;
    }
  }
  return out;
}
__name(listAbyssUploads, "listAbyssUploads");
async function listByseUploads(env) {
  if (!env.BYSE_API_KEY)
    return [];
  const key2 = encodeURIComponent(env.BYSE_API_KEY);
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const pushFile = /* @__PURE__ */ __name((f) => {
    const code = String(f.file_code || f.filecode || "");
    if (!code || seen.has(code))
      return;
    seen.add(code);
    out.push({
      id: "byse_" + code,
      host: "byse",
      fileName: String(f.name || f.title || ""),
      size: Number(f.size) || 0,
      status: 200,
      pageUrl: "https://api.byse.sx/e/" + code
    });
  }, "pushFile");
  try {
    const { ok, json } = await fetchJson("https://api.byse.sx/folder/list?key=" + key2 + "&files=1");
    if (ok && json?.result?.folders) {
      const folders = json.result.folders;
      for (const f of json.result.files || [])
        pushFile(f);
      const maxFolders = Math.min(folders.length, 10);
      for (let i = 0; i < maxFolders; i++) {
        const fid = String(folders[i].fld_id ?? "");
        if (!fid)
          continue;
        try {
          const r2 = await fetchJson("https://api.byse.sx/folder/list?key=" + key2 + "&fld_id=" + fid + "&files=1");
          if (r2.ok && r2.json?.result?.files) {
            for (const f of r2.json.result.files)
              pushFile(f);
          }
        } catch {
        }
      }
    }
  } catch {
  }
  try {
    for (let page = 1; page <= 5; page++) {
      const { ok, json } = await fetchJson("https://api.byse.sx/file/list?key=" + key2 + "&per_page=100&page=" + page);
      if (!ok || !json?.result)
        break;
      const files = Array.isArray(json.result) ? json.result : json.result.files || [];
      if (files.length === 0)
        break;
      for (const f of files)
        pushFile(f);
      if (files.length < 100)
        break;
    }
  } catch {
  }
  return out;
}
__name(listByseUploads, "listByseUploads");
async function mixdropListFolder(env, folderId) {
  const E = encodeURIComponent(env.MIXDROP_EMAIL);
  const K = encodeURIComponent(env.MIXDROP_KEY);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { ok, status, json } = await fetchJson("https://api.mixdrop.ag/folderlist?email=" + E + "&key=" + K + "&id=" + folderId + "&page=1", {}, 8e3);
      if (!ok || !json?.success) {
        if (status === 403) {
          try {
            await env.DB.prepare("INSERT INTO sync_state (key,value) VALUES ('mxcooldown',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(Date.now())).run();
          } catch {
          }
          return { folders: [], files: [] };
        }
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
          continue;
        }
        return { folders: [], files: [] };
      }
      let files = json?.result?.files || [];
      if (files.length >= 50) {
        const p2 = await fetchJson("https://api.mixdrop.ag/folderlist?email=" + E + "&key=" + K + "&id=" + folderId + "&page=2");
        if (p2.ok && p2.json?.success) {
          files = files.concat(p2.json.result?.files || []);
        }
      }
      return { folders: json?.result?.folders || [], files };
    } catch {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        continue;
      }
      return { folders: [], files: [] };
    }
  }
  return { folders: [], files: [] };
}
__name(mixdropListFolder, "mixdropListFolder");
async function listMixdropUploads(env, db, cache) {
  if (!env.MIXDROP_EMAIL || !env.MIXDROP_KEY)
    return [];
  const out = [];
  const root = await mixdropListFolder(env, "0");
  if (root.folders.length === 0 && root.files.length === 0)
    return out;
  let cursor = 0;
  try {
    const cr = await db.prepare("SELECT value FROM sync_state WHERE key='mdcursor'").first();
    cursor = cr?.value ? parseInt(cr.value, 10) || 0 : 0;
  } catch {
    cursor = 0;
  }
  const W = 3;
  const folders = [];
  for (let i = 0; i < W && root.folders.length > 0; i++) {
    folders.push(root.folders[(cursor + i) % root.folders.length]);
  }
  const nextCursor = (cursor + W) % root.folders.length;
  try {
    await db.prepare("INSERT INTO sync_state (key,value) VALUES ('mdcursor',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(nextCursor)).run();
  } catch {
  }
  for (const folder of folders) {
    if (!folder)
      continue;
    const fid = String(folder.id);
    const ftitle = String(folder.title || "").trim();
    const generic = /movie|remote|subtitle/i.test(ftitle);
    let tmdbId = cache.get("mdfolder:" + fid) ?? null;
    if (tmdbId == null && !generic) {
      const parsedF = parseFilename(ftitle);
      if (parsedF.title) {
        const meta = await tmdbMatch(env, parsedF).catch(() => null);
        if (meta) {
          tmdbId = meta.tmdbId;
          cache.set("mdfolder:" + fid, tmdbId);
        }
      }
    }
    const main = await mixdropListFolder(env, fid);
    const allFiles = [...main.files];
    for (const sf of main.folders) {
      await new Promise((r) => setTimeout(r, 250));
      const sub = await mixdropListFolder(env, String(sf.id));
      allFiles.push(...sub.files);
    }
    allFiles.sort((a, b) => Number(b.added || 0) - Number(a.added || 0));
    if (folders.length > 1)
      await new Promise((r) => setTimeout(r, 250));
    for (const f of allFiles) {
      if (f.deleted || !f.isvideo)
        continue;
      if (f.status && !/OK/i.test(f.status))
        continue;
      const title = String(f.title || "");
      let fileName;
      if (tmdbId != null) {
        const ep = title.match(/[Ss](\d{1,2})[._\- ]?[Ee](\d{1,3})/) ?? title.match(/\b(?:Ep?|Episode)\s*[.#_-]?\s*(\d{1,3})\b/i);
        if (ep) {
          const epNum = parseInt(ep[1], 10);
          fileName = "tmdb_" + tmdbId + "_S01E" + String(epNum).padStart(2, "0") + ".mp4";
        } else {
          fileName = "tmdb_" + tmdbId + ".mp4";
        }
      } else {
        fileName = title;
      }
      out.push({ id: "md_" + f.fileref, host: "mixdrop", fileName, size: Number(f.size) || 0, status: 200, pageUrl: String(f.embedurl || "https://mixdrop.co/e/" + f.fileref) });
    }
  }
  for (const f of root.files) {
    if (f.deleted || !f.isvideo)
      continue;
    if (f.status && !/OK/i.test(f.status))
      continue;
    out.push({
      id: "md_" + f.fileref,
      host: "mixdrop",
      fileName: String(f.title || ""),
      size: Number(f.size) || 0,
      status: 200,
      pageUrl: String(f.embedurl || "https://mixdrop.co/e/" + f.fileref)
    });
  }
  return out;
}
__name(listMixdropUploads, "listMixdropUploads");
var lastSyncErrors = [];
function cleanReleaseTags(name) {
  let s = String(name || "").replace(/^thumb[_\-\s.]+/i, "").replace(/\.(mp4|mkv|avi|webm|ts|m4v|jpe?g|png|webp)$/i, "");
  s = s.replace(/^[\s._-]*[\(\[\{][^\)\]\}]{1,40}[\)\]\}][\s._-]*-?[\s._-]*/g, " ");
  s = s.replace(/[\(\[\{][^\)\]\}]{1,40}[\)\]\}]/g, (m) => /(19|20)\d{2}/.test(m) ? m : " ");
  s = s.replace(/\b(mkvcine[a-z.]*|cinevood|bollyflix|hdhub4u|vegamovies|filmyzilla|katmoviehd|9xmovies|mkvcinemas|filmyfly|moviesflix|skymovieshd|tamilblasters|1tamilmv|movierulz|hdmoviehub)\b/gi, " ");
  s = s.replace(/\b(full movie|dubbed movie|south hindi|hindi dubbed|full|hqcam|hdcam|camrip|predvd|pre-dvd)\b/gi, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s || String(name || "");
}

async function runSync(env) {
  const db = env.DB;
  lastSyncErrors = [];
  await ensureSchema(db);
  try {
    await db.batch([
      db.prepare("INSERT INTO sync_state (key,value) VALUES ('lastSyncAt',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind((/* @__PURE__ */ new Date()).toISOString()),
      db.prepare("INSERT INTO sync_state (key,value) VALUES ('lastSyncErrors',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("[]")
    ]);
  } catch {
  }
  let budget = 20;
  const mdCache = /* @__PURE__ */ new Map();
  try {
    const cacheRows = await db.prepare("SELECT key, value FROM sync_state WHERE key LIKE 'mdfolder:%'").all();
    for (const r of cacheRows.results || [])
      mdCache.set(r.key, parseInt(r.value, 10) || 0);
  } catch {
  }
  const LISTING_CACHE_MS = 3 * 60 * 1e3;
  const uploads = [];
  let listingFromCache = false;
  let syncCursor = 0;
  let listCursor = 0;
  try {
    const cacheRows = await db.prepare("SELECT key, value FROM sync_state WHERE key IN ('uploads_cache','uploads_cache_at','sync_cursor','list_cursor')").all();
    const cm = /* @__PURE__ */ new Map();
    for (const r of cacheRows.results || [])
      cm.set(String(r.key), String(r.value));
    syncCursor = parseInt(cm.get("sync_cursor") || "0", 10) || 0;
    listCursor = parseInt(cm.get("list_cursor") || "0", 10) || 0;
    const at = Date.parse(cm.get("uploads_cache_at") || "");
    if (cm.has("uploads_cache") && Number.isFinite(at) && Date.now() - at < LISTING_CACHE_MS) {
      const cached = JSON.parse(cm.get("uploads_cache") || "[]");
      if (Array.isArray(cached)) {
        uploads.push(...cached);
        listingFromCache = true;
      }
    }
  } catch {
  }
  try {
    const wl = await listWatchlist(db);
    const seenWl = new Set(uploads.map((u) => u.pageUrl).filter(Boolean));
    for (const u of wl) {
      if (!u.pageUrl || seenWl.has(u.pageUrl))
        continue;
      seenWl.add(u.pageUrl);
      uploads.push(u);
    }
  } catch {
  }
  const GROUPS = [
    ["streamtape"],
    ["mixdrop"],
    ["ufoload", "abyss", "byse", "earnvids", "doodstream"]
  ];
  const groupNames = ["streamtape", "mixdrop", "rest"];
  let groupIdx = listingFromCache ? listCursor % GROUPS.length : -1;
  if (listingFromCache) {
    const g = GROUPS[groupIdx];
    const merged = /* @__PURE__ */ new Map();
    for (const u of uploads)
      if (u.pageUrl)
        merged.set(u.pageUrl, u);
    const fresh = [];
    for (const host of g) {
      try {
        if (host === "streamtape")
          fresh.push(...await listStreamtape(env));
        else if (host === "mixdrop") {
          let mxAllowed = true;
          try {
            const cd = await db.prepare("SELECT value FROM sync_state WHERE key='mxcooldown'").first();
            if (cd?.value && Date.now() - Number(cd.value) < 18e4)
              mxAllowed = false;
          } catch {
          }
          if (mxAllowed)
            fresh.push(...await listMixdropUploads(env, db, mdCache));
        } else if (host === "ufoload")
          fresh.push(...await listUfoloadUploads(env));
        else if (host === "abyss")
          fresh.push(...await listAbyssUploads(env));
        else if (host === "byse")
          fresh.push(...await listByseUploads(env));
        else if (host === "earnvids")
          fresh.push(...await listEarnvidsUploads(env));
        else if (host === "doodstream")
          fresh.push(...await listDoodstreamUploads(env));
      } catch (e) {
        lastSyncErrors.push("group-list " + host + ": " + String(e).slice(0, 80));
      }
    }
    for (const u of fresh)
      if (u.pageUrl)
        merged.set(u.pageUrl, u);
    uploads.length = 0;
    uploads.push(...merged.values());
  } else {
    let mxAllowed = true;
    try {
      const cd = await db.prepare("SELECT value FROM sync_state WHERE key='mxcooldown'").first();
      if (cd?.value && Date.now() - Number(cd.value) < 18e4)
        mxAllowed = false;
    } catch {
    }
    const allUploads = [...await listDoodstreamUploads(env), ...parseUploadsJson(env), ...await listStreamtape(env), ...mxAllowed ? await listMixdropUploads(env, db, mdCache) : [], ...await listAbyssUploads(env), ...await listByseUploads(env), ...await listUfoloadUploads(env), ...await listEarnvidsUploads(env)];
    const seenUp = /* @__PURE__ */ new Set();
    for (const u of allUploads) {
      if (!u.pageUrl || seenUp.has(u.pageUrl))
        continue;
      seenUp.add(u.pageUrl);
      uploads.push(u);
    }
  }
  try {
    const stmts0 = db.prepare("INSERT INTO sync_state (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");
    await db.batch([
      stmts0.bind("uploads_cache", JSON.stringify(uploads).slice(0, 9e5)),
      stmts0.bind("uploads_cache_at", (/* @__PURE__ */ new Date()).toISOString()),
      stmts0.bind("list_cursor", String(listingFromCache ? listCursor + 1 : 0))
    ]);
  } catch {
  }
  lastSyncErrors.push("debug: uploads=" + uploads.length + (listingFromCache ? " (cached, group=" + groupNames[groupIdx] + ")" : " (full)"));
  const existingIds = /* @__PURE__ */ new Set();
  try {
    const allRows = await db.prepare("SELECT id FROM media_items").all();
    for (const r of allRows.results || [])
      existingIds.add(r.id);
  } catch {
  }
  const ingestedUrls = /* @__PURE__ */ new Map();
  try {
    const markerRows = await db.prepare("SELECT key, value FROM sync_state WHERE key LIKE 'ingested:%'").all();
    for (const r of markerRows.results || []) {
      ingestedUrls.set(String(r.key).slice("ingested:".length), String(r.value || ""));
    }
  } catch {
  }
  const hostCheckedAt = /* @__PURE__ */ new Map();
  try {
    const huRows = await db.prepare("SELECT page_url, last_checked FROM host_uploads").all();
    for (const r of huRows.results || []) {
      if (!r?.page_url)
        continue;
      const t = Date.parse(String(r.last_checked || "") + "Z");
      if (Number.isFinite(t))
        hostCheckedAt.set(String(r.page_url), t);
    }
  } catch {
  }
  const DIRECT_URL_HOSTS = /* @__PURE__ */ new Set(["vidmoly", "ufoload"]);
  const REFRESH_AFTER_MS = 6 * 60 * 60 * 1e3;
  const STABLE_URL_HOSTS = /* @__PURE__ */ new Set(["streamtape", "mixdrop", "abyss", "byse", "earnvids"]);
  const PAGE_URL_HOSTS = /* @__PURE__ */ new Set(["streamtape", "mixdrop", "ufoload", "abyss", "byse", "earnvids"]);
  let ingested = 0;
  let processedThisRun = 0;
  const MAX_PROCESSED_PER_RUN = 30;
  const stmts = [];
  const markIngested = /* @__PURE__ */ __name((pageUrl, id, ref) => {
    if (!pageUrl)
      return;
    ingestedUrls.set(pageUrl, id + "|" + (ref ?? ""));
    stmts.push(db.prepare("INSERT INTO sync_state (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("ingested:" + pageUrl, id + "|" + (ref ?? "")));
  }, "markIngested");
  for (const [k2, v2] of mdCache) {
    stmts.push(db.prepare("INSERT INTO sync_state (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(k2, String(v2)));
  }
  if (uploads.length)
    syncCursor = syncCursor % uploads.length;
  const rotatedUploads = uploads.length ? [...uploads.slice(syncCursor), ...uploads.slice(0, syncCursor)] : uploads;
  let examined = 0;
  for (const upload of rotatedUploads) {
    const fnameRaw = String(upload.fileName || "");
    if (/\.(jpe?g|png|webp|gif|bmp|srt|vtt|ass|nfo|txt)$/i.test(fnameRaw) || /^thumb[_\-\s.]/i.test(fnameRaw)) {
      continue;
    }
    if (examined >= 120) {
      lastSyncErrors.push("scan-cap: 120 \u2014 next run continue karega");
      break;
    }
    examined++;
    if (budget < 3) {
      lastSyncErrors.push("budget: pausing \u2014 next run continue karega");
      break;
    }
    if (processedThisRun >= MAX_PROCESSED_PER_RUN) {
      lastSyncErrors.push("processed-cap: " + MAX_PROCESSED_PER_RUN + " \u2014 next run continue karega");
      break;
    }
    const uploadRef = fileRefOf(upload.pageUrl);
    if (STABLE_URL_HOSTS.has(upload.host) && ingestedUrls.has(upload.pageUrl)) {
      const marker = String(ingestedUrls.get(upload.pageUrl) || "");
      const prevId = marker.split("|")[0];
      const prevRef = marker.split("|")[1] || "";
      const sameFile = !prevRef || prevRef === uploadRef;
      const sameEpisode = !uploadRef || !prevId || prevId === nameFastIdOf(upload.fileName);
      if (sameFile && sameEpisode) {
        ingested++;
        continue;
      }
      console.log("re-ingest upload", upload.pageUrl, "marker:", marker, "newRef:", uploadRef);
    }
    let effectiveName = cleanReleaseTags(String(upload.fileName || ""));
    const directUrlFresh = DIRECT_URL_HOSTS.has(upload.host) && (hostCheckedAt.get(upload.pageUrl) ?? 0) > Date.now() - REFRESH_AFTER_MS;
    if ((upload.host === "vidmoly" || upload.host === "ufoload") && budget > 8 && !directUrlFresh) {
      budget--;
      const pageTitle = await extractPageTitle(upload.pageUrl).catch(() => null);
      if (pageTitle && (/\.(mp4|mkv|avi|webm|ts)\b/i.test(pageTitle) || /\d{1,2}\s?[-._ ]?[Ee]\d{1,3}\b/.test(pageTitle))) {
        effectiveName = pageTitle;
      }
    }
    const parsed = parseFilename(effectiveName);
    let fastId = null;
    if (parsed.tmdbId != null) {
      const fastType = parsed.season != null ? "series" : "movie";
      fastId = parsed.tmdbId + ":" + fastType + ":" + (parsed.season ?? 0) + ":" + (parsed.episode ?? 0);
      if (existingIds.has(fastId) && !directUrlFresh) {
        if (PAGE_URL_HOSTS.has(upload.host) && upload.pageUrl) {
          await updateHostUrl(env, fastId, upload.host, upload.pageUrl);
        }
        if (fastType === "series" && /anime/i.test(String(upload.fileName || ""))) {
          try {
            await db.prepare("UPDATE media_items SET category='anime' WHERE id=?").bind(fastId).run();
          } catch {
          }
        }
        processedThisRun++;
        ingested++;
        markIngested(upload.pageUrl, fastId, uploadRef);
        continue;
      }
    }
    let ready = false, valid = false, directUrl = null;
    if (upload.host === "streamtape") {
      valid = Boolean(upload.id) && Number(upload.status) === 200;
      ready = valid;
      if (ready) {
        budget--;
        try {
          directUrl = await extractStreamtape(upload.pageUrl, void 0, void 0, env);
        } catch (e) {
          directUrl = null;
          const es = String(e);
          if (!/404|no robotlink/i.test(es))
            lastSyncErrors.push("streamtape: " + es.slice(0, 120));
        }
      }
    } else if (upload.host === "abyss" || upload.host === "byse" || upload.host === "ufoload" || upload.host === "earnvids") {
      valid = Boolean(upload.pageUrl);
      ready = valid;
      directUrl = upload.pageUrl;
    } else if (upload.host === "doodstream") {
      valid = Boolean(upload.pageUrl) && Number(upload.status) === 200;
      ready = valid;
      directUrl = upload.pageUrl;
    } else {
      const extractor = upload.host === "vidmoly" ? extractVidmoly : upload.host === "mixdrop" ? extractMixdrop : upload.host === "ufoload" ? extractUfoload : null;
      valid = Boolean(upload.pageUrl);
      if (extractor) {
        budget--;
        try {
          directUrl = await extractor(upload.pageUrl);
          ready = Boolean(directUrl);
        } catch (e) {
          ready = false;
          lastSyncErrors.push(upload.host + ": " + String(e).slice(0, 120));
        }
      }
    }
    if (upload.id) {
      stmts.push(db.prepare(
        `INSERT INTO host_uploads (id, host, file_name, size, status, page_url, direct_url, last_checked, is_valid)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
         ON CONFLICT(id) DO UPDATE SET file_name=excluded.file_name, size=excluded.size, status=excluded.status,
           page_url=excluded.page_url, direct_url=excluded.direct_url, last_checked=datetime('now'), is_valid=excluded.is_valid`
      ).bind(upload.id, upload.host, upload.fileName, upload.size, upload.status, upload.pageUrl, directUrl ?? "", valid ? 1 : 0));
    }
    if (!valid || !ready) {
      lastSyncErrors.push("skip-not-ready: " + upload.host + ":" + upload.fileName.slice(0, 40));
      continue;
    }
    let meta = null;
    try {
      meta = await tmdbMatch(env, parsed);
    } catch (e) {
      lastSyncErrors.push("tmdb-err: " + String(e).slice(0, 80));
      break;
    }
    if (!meta) {
      lastSyncErrors.push("tmdb-miss: " + upload.fileName.slice(0, 60));
      try {
        const hostField = HOST_FIELD[upload.host];
        const cleanTitle = String(parsed.title || "").replace(/[._]+/g, " ").replace(/\s+/g, " ").trim();
        const ref = fileRefOf(upload.pageUrl) || String(upload.id || "");
        const isSeries = parsed.season != null;
        const seed = isSeries ? cleanTitle.toLowerCase() : String(ref);
        if (hostField && cleanTitle && seed) {
          let h = 0;
          for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 900000000;
          const synthId = 900000000 + h;
          const rowType = isSeries ? "series" : "movie";
          const rowId = synthId + ":" + rowType + ":" + (parsed.season ?? 0) + ":" + (parsed.episode ?? 0);
          const hostUrl = upload.host === "streamtape" || upload.host === "mixdrop" ? upload.pageUrl : (directUrl ?? upload.pageUrl);
          const sqlIns = "INSERT INTO media_items (id, tmdb_id, type, title, poster, backdrop, overview, rating, season, episode, " + hostField + ", is_title_only, is_active, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,1,datetime('now')) ON CONFLICT(id) DO UPDATE SET title=excluded.title, " + hostField + "=excluded." + hostField + ", is_active=1, is_title_only=1, updated_at=datetime('now')";
          stmts.push(db.prepare(sqlIns).bind(rowId, synthId, rowType, cleanTitle, "", "", "", 0, parsed.season ?? 0, parsed.episode ?? 0, hostUrl));
          markIngested(upload.pageUrl, "", ref);
          ingested++;
          lastSyncErrors.push("title-only: " + cleanTitle.slice(0, 40));
        }
      } catch (e) {
        lastSyncErrors.push("title-only-err: " + String(e).slice(0, 60));
      }
      continue;
    }
    budget--;
    if ((!Array.isArray(meta.genres) || meta.genres.length === 0) && budget > 8) {
      budget--;
      await enrichGenres(env, meta);
    }
    const rawAnime = /anime/i.test(String(upload.fileName || ""));
    let category = categoryOf(meta);
    if (category !== "movie" && rawAnime)
      category = "anime";
    meta.category = category;
    const id = meta.tmdbId + ":" + meta.type + ":" + (meta.season ?? 0) + ":" + (meta.episode ?? 0);
    const urlField = HOST_FIELD[upload.host];
    const hostUrl = upload.host === "streamtape" || upload.host === "mixdrop" ? upload.pageUrl : directUrl ?? upload.pageUrl;
    const rowCategory = meta.category;
    const baseVals = [
      id,
      meta.tmdbId,
      meta.type,
      meta.title,
      meta.poster,
      meta.backdrop,
      meta.overview,
      meta.rating,
      meta.type === "series" ? meta.season : null,
      meta.type === "series" ? meta.episode : null,
      rowCategory
    ];
    const allUrls = ["streamtape", "vidmoly", "mixdrop", "ufoload", "abyss", "byse", "earnvids", "doodstream"].map((h) => h === upload.host ? hostUrl : "");
    stmts.push(db.prepare(
      `INSERT INTO media_items (id, tmdb_id, type, title, poster, backdrop, overview, rating, season, episode, category, streamtape_url, vidmoly_url, mixdrop_url, ufoload_url, abyss_url, byse_url, earnvids_url, doodstream_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON CONFLICT(id) DO UPDATE SET
         title=excluded.title, poster=excluded.poster, backdrop=excluded.backdrop, overview=excluded.overview, rating=excluded.rating,
         season=COALESCE(excluded.season, media_items.season), episode=COALESCE(excluded.episode, media_items.episode),
         category=excluded.category,
         streamtape_url=COALESCE(nullif(excluded.streamtape_url,''), media_items.streamtape_url),
         vidmoly_url=COALESCE(nullif(excluded.vidmoly_url,''), media_items.vidmoly_url),
         mixdrop_url=COALESCE(nullif(excluded.mixdrop_url,''), media_items.mixdrop_url),
         ufoload_url=COALESCE(nullif(excluded.ufoload_url,''), media_items.ufoload_url),
         abyss_url=COALESCE(nullif(excluded.abyss_url,''), media_items.abyss_url),
         byse_url=COALESCE(nullif(excluded.byse_url,''), media_items.byse_url),
         earnvids_url=COALESCE(nullif(excluded.earnvids_url,''), media_items.earnvids_url),
         doodstream_url=COALESCE(nullif(excluded.doodstream_url,''), media_items.doodstream_url),
         is_active=1, updated_at=datetime('now')`
    ).bind(...baseVals, allUrls[0], allUrls[1], allUrls[2], allUrls[3], allUrls[4], allUrls[5], allUrls[6], allUrls[7]));
    ingested++;
    processedThisRun++;
    markIngested(upload.pageUrl, id, uploadRef);
  }
  if (stmts.length > 0) {
    stmts.push(db.prepare("INSERT INTO sync_state (key,value) VALUES ('lastSyncAt',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind((/* @__PURE__ */ new Date()).toISOString()));
    stmts.push(db.prepare("INSERT INTO sync_state (key,value) VALUES ('lastSyncErrors',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(lastSyncErrors).slice(0, 4e3)));
    stmts.push(db.prepare("INSERT INTO sync_state (key,value) VALUES ('sync_cursor',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(uploads.length ? (syncCursor + examined) % uploads.length : 0)));
    try {
      await db.batch(stmts);
    } catch (e) {
      lastSyncErrors.push("batch: " + String(e).slice(0, 140));
    }
  } else {
    try {
      await db.batch([
        db.prepare("INSERT INTO sync_state (key,value) VALUES ('lastSyncAt',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind((/* @__PURE__ */ new Date()).toISOString()),
        db.prepare("INSERT INTO sync_state (key,value) VALUES ('lastSyncErrors',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(lastSyncErrors).slice(0, 4e3)),
        db.prepare("INSERT INTO sync_state (key,value) VALUES ('sync_cursor',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(uploads.length ? (syncCursor + examined) % uploads.length : 0))
      ]);
    } catch (e) {
      lastSyncErrors.push("batch: " + String(e).slice(0, 140));
    }
  }
  const cleanup = [];
  cleanup.push(db.prepare("UPDATE media_items SET is_active=0, updated_at=datetime('now') WHERE streamtape_url='' AND vidmoly_url='' AND mixdrop_url='' AND ufoload_url='' AND abyss_url='' AND byse_url='' AND earnvids_url='' AND doodstream_url='' AND is_title_only=0"));
  cleanup.push(db.prepare("INSERT INTO sync_state (key,value) VALUES ('lastSyncAt',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind((/* @__PURE__ */ new Date()).toISOString()));
  cleanup.push(db.prepare("INSERT INTO sync_state (key,value) VALUES ('lastSyncCount',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(ingested)));
  cleanup.push(db.prepare("INSERT INTO sync_state (key,value) VALUES ('lastSyncErrors',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(lastSyncErrors).slice(0, 4e3)));
  cleanup.push(db.prepare("INSERT INTO sync_state (key,value) VALUES ('sync_cursor',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(uploads.length ? (syncCursor + examined) % uploads.length : 0)));
  try {
    await db.batch(cleanup);
  } catch (e) {
    lastSyncErrors.push("cleanup: " + String(e).slice(0, 120));
  }
  return ingested;
}
__name(runSync, "runSync");
var syncInFlight = null;
var syncStartedAt = 0;
function triggerSync(env) {
  const now = Date.now();
  if (syncInFlight && now - syncStartedAt > 24e4)
    syncInFlight = null;
  if (!syncInFlight) {
    syncStartedAt = now;
    syncInFlight = runSync(env).catch(async (e) => {
      const msg = "lazy sync failed: " + String(e).slice(0, 300);
      console.error(msg);
      try {
        await env.DB.prepare(
          "INSERT INTO sync_state (key,value) VALUES ('lastSyncError',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
        ).bind(msg);
      } catch {
      }
      return 0;
    }).finally(() => {
      syncInFlight = null;
    });
  }
  return syncInFlight;
}
__name(triggerSync, "triggerSync");
var SYNC_STALE_MS = 5 * 60 * 1e3;
async function isSyncStale(env) {
  try {
    const row = await env.DB.prepare("SELECT value FROM sync_state WHERE key='lastSyncAt'").first();
    const t = Date.parse(String(row?.value || ""));
    return !Number.isFinite(t) || Date.now() - t > SYNC_STALE_MS;
  } catch {
    return true;
  }
}
__name(isSyncStale, "isSyncStale");
var app = new Hono3();
var LOGO = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="48" fill="#0d1117"/>
  <path d="M64 160 L128 72 L192 160 Z" fill="#1f6feb"/>
  <path d="M88 160 L128 104 L168 160 Z" fill="#58a6ff"/>
  <rect x="92" y="164" width="72" height="14" rx="7" fill="#58a6ff"/>
</svg>`;
app.get("/", (c) => c.json({ ok: true, name: "The Gate", time: (/* @__PURE__ */ new Date()).toISOString() }));
app.get("/health", async (c) => {
  try {
    await ensureSchema(c.env.DB);
    const row = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM media_items WHERE is_active=1").first();
    const lastSync = await c.env.DB.prepare("SELECT value FROM sync_state WHERE key='lastSyncAt'").first();
    const errRow = await c.env.DB.prepare("SELECT value FROM sync_state WHERE key='lastSyncErrors'").first();
    let errors = [];
    try {
      errors = JSON.parse(errRow?.value || "[]");
    } catch {
    }
    return c.json({ ok: true, activeItems: row?.n ?? 0, lastSync: lastSync?.value ?? null, errors });
  } catch (e) {
    return c.json({ ok: false, error: String(e), stack: e?.stack ?? null }, 500);
  }
});
app.get("/debug/sync", async (c) => {
  try {
    const st = await c.env.DB.prepare("SELECT key, value FROM sync_state WHERE key IN ('lastSyncAt','lastSyncCount','lastSyncErrors','lastSyncError')").all();
    const map = {};
    for (const r of st.results || [])
      map[String(r.key)] = String(r.value);
    let errors = [];
    try {
      errors = JSON.parse(map.lastSyncErrors || "[]");
    } catch {
    }
    const n = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM media_items WHERE is_active=1").first();
    return c.json({
      ok: true,
      activeItems: n?.n ?? 0,
      lastSync: map.lastSyncAt ?? null,
      lastSyncCount: map.lastSyncCount ?? null,
      lastSyncError: map.lastSyncError ?? null,
      errors
    });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 500);
  }
});
app.get("/debug/state", async (c) => {
  try {
    await ensureSchema(c.env.DB);
    const rows = await c.env.DB.prepare("SELECT key, value FROM sync_state WHERE key NOT LIKE '%cache%'").all();
    const out = {};
    for (const r of rows.results || [])
      out[String(r.key)] = String(r.value).slice(0, 400);
    return c.json(out, 200, GATE_RESOLVE_CORS);
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 500);
  }
});
app.get("/debug/db", async (c) => {
  try {
    const schemaErrors = await ensureSchema(c.env.DB);
    const tables = await c.env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const cols = await c.env.DB.prepare("PRAGMA table_info(media_items)").all();
    return c.json({
      tables: tables.results.map((r) => r.name),
      mediaColumns: cols.results.map((r) => r.name),
      schemaErrors
    });
  } catch (e) {
    return c.json({ ok: false, error: String(e), stack: e?.stack ?? null }, 500);
  }
});
app.get("/logo.svg", (c) => {
  c.header("Content-Type", "image/svg+xml; charset=utf-8");
  c.header("Cache-Control", "public, max-age=86400");
  return c.body(LOGO);
});
app.get("/api/catalog", async (c) => {
  try {
    await ensureSchema(c.env.DB);
    const type = c.req.query("type");
    const category = c.req.query("category");
    const q = c.req.query("q");
    let sql = "SELECT * FROM media_items WHERE is_active=1";
    const params = [];
    if (type) {
      sql += " AND type=?";
      params.push(type);
    }
    if (category === "anime" || category === "tv") {
      sql += " AND category=?";
      params.push(category);
    }
    if (q && q.trim()) {
      sql += " AND (title LIKE ? OR CAST(tmdb_id AS TEXT)=?)";
      params.push(`%${q.trim()}%`, q.trim());
    }
    sql += " ORDER BY updated_at DESC, id DESC LIMIT 500";
    const { results } = await c.env.DB.prepare(sql).bind(...params).all();
    return c.json({ items: results });
  } catch (e) {
    return c.json({ error: String(e), stack: e?.stack ?? null }, 500);
  }
});
app.get("/api/stream/:id", async (c) => {
  await ensureSchema(c.env.DB);
  const id = c.req.param("id") ?? "";
  const { results } = await c.env.DB.prepare("SELECT * FROM media_items WHERE is_active=1 AND (CAST(tmdb_id AS TEXT)=? OR title LIKE ?) LIMIT 1").bind(id, `%${id}%`).all();
  const item = results[0];
  if (!item)
    return c.json({ streams: [] });
  const streams = [];
  for (const host of Object.keys(HOST_FIELD)) {
    if (HIDDEN_HOSTS.has(host))
      continue;
    const url = item[HOST_FIELD[host]];
    if (!url)
      continue;
    const playUrl = host === "streamtape" ? toStreamtapeProxy(new URL(c.req.url).origin, url) : url;
    streams.push({
      name: `The Gate \xB7 ${HOST_LABEL[host]}`,
      title: item.title,
      host,
      url: playUrl,
      webview: false,
      behaviorHints: { proxyHeaders: { request: headersForHost(c.env, host) } }
    });
  }
  return c.json({ streams });
});
app.get("/manifest.json", (c) => {
  const origin = new URL(c.req.url).origin;
  return c.json({
    id: c.env.ADDON_ID || "the.gate",
    version: c.env.ADDON_VERSION || "1.0.2",
    name: c.env.ADDON_NAME || "The Gate",
    description: c.env.ADDON_DESCRIPTION || "Your private Nuvio catalog",
    logo: `${origin}/logo.svg`,
    background: `${origin}/logo.svg`,
    resources: ["catalog", "meta", "stream"],
    types: ["movie", "series"],
    catalogs: [
      { type: "movie", id: "movies", name: "The Gate Movies", extraSupported: ["search"], extra: [SEARCH_EXTRA] },
      { type: "series", id: "series", name: "The Gate Series", extraSupported: ["search"], extra: [SEARCH_EXTRA] },
      { type: "series", id: "anime", name: "The Gate Anime", extraSupported: ["search"], extra: [SEARCH_EXTRA] },
      { type: "series", id: "tv", name: "The Gate TV", extraSupported: ["search"], extra: [SEARCH_EXTRA] }
    ],
    behaviorHints: { adult: false, p2p: false }
  });
});
app.get("/catalog/:type/:id.json", async (c) => {
  if (await isSyncStale(c.env)) {
    c.executionCtx.waitUntil(triggerSync(c.env));
  }
  await ensureSchema(c.env.DB);
  const type = c.req.param("type");
  const id = c.req.path.match(/\/catalog\/(?:movie|series)\/([A-Za-z0-9_-]+)\.json$/)?.[1] ?? "series";
  const q = c.req.query("q");
  let sql = "SELECT * FROM media_items WHERE is_active=1 AND type=?";
  const params = [type];
  if (id === "anime" || id === "tv") {
    sql += " AND category=?";
    params.push(id);
  }
  if (q && q.trim()) {
    sql += " AND (title LIKE ? OR CAST(tmdb_id AS TEXT)=?)";
    params.push(`%${q.trim()}%`, q.trim());
  }
  sql += " ORDER BY updated_at DESC, id DESC LIMIT 500";
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  const seen = /* @__PURE__ */ new Set();
  return c.json({
    metas: results.filter((item) => {
      const key2 = `${item.tmdb_id}:${item.type}`;
      if (seen.has(key2))
        return false;
      seen.add(key2);
      return true;
    }).map((item) => {
      const cat = item.category || (item.type === "movie" ? "movie" : "tv");
      const label = cat === "anime" ? "Anime" : cat === "movie" ? "Movie" : "Series";
      return {
        id: `tmdb:${item.tmdb_id}`,
        type: item.type,
        name: item.title,
        poster: item.poster,
        posterShape: "poster",
        background: item.backdrop,
        description: item.overview || item.title,
        releaseInfo: label,
        category: cat
      };
    })
  });
});
var SEARCH_EXTRA = { name: "search", isRequired: false };
async function buildCatalogMetas(env, type, categoryId, q) {
  let sql = "SELECT * FROM media_items WHERE is_active=1 AND type=?";
  const params = [type];
  if (categoryId === "anime" || categoryId === "tv") {
    sql += " AND category=?";
    params.push(categoryId);
  }
  if (q && q.trim()) {
    sql += " AND (title LIKE ? OR CAST(tmdb_id AS TEXT)=?)";
    params.push(`%${q.trim()}%`, q.trim());
  }
  sql += " ORDER BY updated_at DESC, id DESC LIMIT 500";
  const { results } = await env.DB.prepare(sql).bind(...params).all();
  const seen = /* @__PURE__ */ new Set();
  return results.filter((item) => {
    const key2 = `${item.tmdb_id}:${item.type}`;
    if (seen.has(key2))
      return false;
    seen.add(key2);
    return true;
  }).map((item) => {
    const cat = item.category || (item.type === "movie" ? "movie" : "tv");
    const label = cat === "anime" ? "Anime" : cat === "movie" ? "Movie" : "Series";
    return {
      id: `tmdb:${item.tmdb_id}`,
      type: item.type,
      name: item.title,
      poster: item.poster,
      posterShape: "poster",
      background: item.backdrop,
      description: item.overview || item.title,
      releaseInfo: label,
      category: cat
    };
  });
}
__name(buildCatalogMetas, "buildCatalogMetas");
app.get("/catalog/:type/:id/*", async (c) => {
  const pm = new URL(c.req.url).pathname.match(/^\/catalog\/(movie|series)\/([A-Za-z0-9_-]+)\/(.+?)\.json$/);
  if (!pm)
    return c.json({ metas: [] });
  const type = pm[1];
  const categoryId = pm[2];
  const extraPath = decodeURIComponent(pm[3] || "");
  let q = null;
  let skip = 0;
  for (const part of extraPath.split("&")) {
    const [k, v] = part.split("=");
    if (!k)
      continue;
    if (k.toLowerCase() === "search" && v !== void 0)
      q = decodeURIComponent(v.replace(/\+/g, " "));
    if (k.toLowerCase() === "skip" && v)
      skip = Math.max(0, parseInt(v, 10) || 0);
  }
  if (q === null)
    q = c.req.query("q") ?? null;
  try {
    await ensureSchema(c.env.DB);
    const metas = await buildCatalogMetas(c.env, type, categoryId, q);
    return c.json({ metas: skip > 0 ? metas.slice(skip) : metas });
  } catch (e) {
    return c.json({ metas: [], err: String(e?.message ?? e).slice(0, 120) });
  }
});
app.get("/meta/:type/:id.json", async (c) => {
  try {
    await ensureSchema(c.env.DB);
    if (await isSyncStale(c.env)) {
      c.executionCtx.waitUntil(triggerSync(c.env));
    }
    const pm = c.req.path.match(/^\/meta\/(movie|series)\/(.+)\.json$/);
    const m = pm ? decodeURIComponent(pm[2] ?? "").match(/^(?:tmdb:)?(\d+)$/) : null;
    if (!pm || !m)
      return c.json({ meta: null });
    const type = pm[1];
    const tmdbId = parseInt(m[1], 10);
    const { results: rows } = await c.env.DB.prepare("SELECT * FROM media_items WHERE tmdb_id=? AND type=? AND is_active=1 ORDER BY season, episode").bind(tmdbId, type).all();
    if (rows.length === 0)
      return c.json({ meta: null });
    const item = rows[0];
    const videos = type === "series" ? rows.filter((r) => r.season != null && r.episode != null).map((r) => ({
      id: `tmdb:${r.tmdb_id}:S${r.season}E${r.episode}`,
      title: `${item.title} S${r.season}E${r.episode}`,
      season: r.season,
      episode: r.episode
    })) : [];
    return c.json({
      meta: {
        id: `tmdb:${item.tmdb_id}`,
        type: item.type,
        name: item.title,
        poster: item.poster,
        background: item.backdrop,
        description: item.overview || item.title,
        genres: [],
        videos
      }
    });
  } catch (e) {
    return c.json({ error: String(e), stack: e?.stack ?? null }, 500);
  }
});
app.get("/stream/:type/:id.json", async (c) => {
  if (await isSyncStale(c.env)) {
    c.executionCtx.waitUntil(triggerSync(c.env));
  }
  try {
    await ensureSchema(c.env.DB);
    const pm = c.req.path.match(/^\/stream\/(movie|series)\/(.+)\.json$/);
    const raw2 = pm ? decodeURIComponent(pm[2] ?? "") : "";
    const m = raw2.match(/^(?:tmdb:)?(\d+)(?::(?:[Ss](\d+)[Ee](\d+)|(\d+):(\d+)))?$/);
    if (!pm || !m)
      return c.json({ streams: [] });
    const type = pm[1];
    const tmdbId = parseInt(m[1], 10);
    const season = m[2] != null ? parseInt(m[2], 10) : m[4] != null ? parseInt(m[4], 10) : null;
    const episode = m[3] != null ? parseInt(m[3], 10) : m[5] != null ? parseInt(m[5], 10) : null;
    const { results: rows } = await c.env.DB.prepare("SELECT * FROM media_items WHERE tmdb_id=? AND type=? ORDER BY season, episode").bind(tmdbId, type).all();
    let matches = season != null && episode != null ? rows.filter((r) => Number(r.season) === season && Number(r.episode) === episode) : rows.filter((r) => r.season == null && r.episode == null);
    if (matches.length === 0 && season == null && episode == null) {
      matches = rows;
    }
    const streams = [];
    for (const item of matches) {
      for (const host of Object.keys(HOST_FIELD)) {
        if (HIDDEN_HOSTS.has(host))
          continue;
        const url = item[HOST_FIELD[host]];
        if (!url)
          continue;
        let useWebview = host === "abyss";
        let finalUrl = url;
        if (host === "abyss") {
          const abRef = url.match(/(?:abyssplayer\.com|abyss\.to)\/(?:v\/)?([A-Za-z0-9_-]+)/i)?.[1];
          if (abRef)
            finalUrl = new URL(c.req.url).origin + "/abyss/" + abRef;
          useWebview = true;
        }
        if (host === "streamtape") {
          const mxRef = url.match(/\/v2\/([A-Za-z0-9]+)\.mp4/i)?.[1];
          finalUrl = mxRef ? "https://mxdrop.click/e/" + mxRef : url;
          useWebview = true;
        }
        if (host === "mixdrop") {
          const ref = url.match(/\/(?:e|f|v)\/([A-Za-z0-9]+)/i)?.[1] ?? url.match(/\/v2\/([A-Za-z0-9]+)\.mp4/i)?.[1] ?? url.match(/(?:mixdrop|mxdrop)[^/]*\/e\/([A-Za-z0-9]+)/i)?.[1];
          if (ref)
            finalUrl = "https://mxdrop.click/e/" + ref;
          useWebview = true;
        }
        if (host === "earnvids") {
          const evId = url.match(/\/file\/([A-Za-z0-9]+)/i)?.[1] ?? url.match(/\/v\/([A-Za-z0-9]+)/i)?.[1] ?? url.match(/file_code=([A-Za-z0-9]+)/i)?.[1];
          if (evId) {
            const clientIp = c.req.header("CF-Connecting-IP") || (c.req.header("X-Forwarded-For") || "").split(",")[0].trim();
            const m3u8 = await earnvidsDirectLink(c.env, evId, clientIp).catch(() => null);
            if (m3u8) {
              finalUrl = m3u8;
              useWebview = false;
            } else {
              finalUrl = "https://morencius.com/file/" + evId;
              useWebview = true;
            }
          }
        }
        if (host === "ufoload") {
          const ufId = url.match(/\/api\/v1\/files\/([A-Za-z0-9]+)/)?.[1];
          if (ufId) {
            const key2 = c.env.UFOLOAD_API_KEY || c.env.UFOLOAD_KEY;
            if (key2) {
              try {
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), 15e3);
                let playback;
                try {
                  const links = await fetch("https://ufoload.com/api/v1/files/" + ufId + "/links", {
                    method: "POST",
                    signal: ctrl.signal,
                    headers: { Authorization: "Bearer " + key2, Accept: "application/json" }
                  });
                  if (links.ok) {
                    const j = await links.json().catch(() => null);
                    playback = typeof j?.playback === "string" ? j.playback : void 0;
                  }
                } finally {
                  clearTimeout(timer);
                }
                if (playback && /^https?:\/\//.test(playback)) {
                  finalUrl = playback;
                  useWebview = false;
                } else {
                  continue;
                }
              } catch {
                continue;
              }
            }
          }
          if (useWebview) {
            finalUrl = "https://ufoload.com/e/" + (url.match(/\/api\/v1\/files\/([A-Za-z0-9]+)/)?.[1] ?? "");
          }
        }
        if (host === "byse") {
          const byRef = url.match(/\/(?:e|f|v)\/([A-Za-z0-9]+)/i)?.[1];
          if (byRef) {
            try {
              const dom = await fetchJson("https://api.byse.sx/get/domain?key=" + encodeURIComponent(c.env.BYSE_API_KEY ?? ""));
              const nd = dom.json?.embed_domain || dom.json?.new_domain || "";
              const host2 = nd.replace(/^https?:\/\//, "").replace(/\/$/, "");
              if (host2) {
                finalUrl = "https://" + host2 + "/e/" + byRef;
              } else {
                finalUrl = "https://api.byse.sx/e/" + byRef;
              }
            } catch {
              finalUrl = "https://api.byse.sx/e/" + byRef;
            }
          }
          useWebview = true;
        }
        streams.push({
          name: `The Gate \xB7 ${HOST_LABEL[host]}`,
          title: item.season != null ? `${item.title} S${item.season}E${item.episode}` : item.title,
          host,
          url: finalUrl,
          webview: useWebview,
          behaviorHints: {
            proxyHeaders: { request: headersForHost(c.env, host) },
            theGateWebview: useWebview
          }
        });
      }
    }
    streams.sort((a, b) => (a.webview ? 1 : 0) - (b.webview ? 1 : 0));
    if (c.req.query("debug") != null) {
      return c.json({ streams, debug: { raw: raw2, tmdbId, type, season, episode, rows: rows.length, matches: matches.length } });
    }
    return c.json({ streams });
  } catch (e) {
    return c.json({ error: String(e), stack: e?.stack ?? null }, 500);
  }
});
app.get("/debug/ds/:code", async (c) => {
  const code = c.req.param("code") ?? "";
  if (!/^[A-Za-z0-9]+$/.test(code))
    return c.text("bad id", 400);
  const origins = ["https://doodstream.com", "https://playmogo.com"];
  const pages = [];
  for (const origin of origins) {
    for (const p of ["/e/", "/file/", "/d/"]) {
      const pageUrl = origin + p + code;
      const res = await fetch(pageUrl, {
        redirect: "manual",
        headers: {
          "User-Agent": userAgent(c.env),
          Referer: origin + "/",
          Origin: origin,
          Accept: "text/html,application/xhtml+xml,*/*"
        }
      });
      const text = await res.text().catch(() => "");
      const scripts = res.ok ? text.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [] : [];
      let found = "";
      let decodedSample = "";
      for (const s of scripts) {
        const d = unpackPackedJs(s);
        if (!d)
          continue;
        if (!decodedSample)
          decodedSample = d.slice(0, 180);
        const m = d.match(/https?:\/\/[^"'\s]+\.(?:m3u8|mp4)[^"'\s]*/i);
        if (m) {
          found = m[0];
          break;
        }
      }
      pages.push({
        pageUrl,
        ok: res.ok,
        status: res.status,
        location: res.headers.get("location") || "",
        ctype: res.headers.get("content-type") || "",
        size: (text || "").length,
        scripts: scripts.length,
        found,
        decodedSample,
        head: (text || "").slice(0, 120)
      });
    }
  }
  return c.json({ code, pages });
});
app.get("/debug/st/:embedId", async (c) => {
  const embedId = c.req.param("embedId") ?? "";
  try {
    const r = await fetchText("https://streamtape.com/e/" + embedId + "/", { Referer: "https://streamtape.com/" });
    return c.json({
      status: r.status,
      len: r.text.length,
      robotAssign: (r.text.match(/robotlink/g) || []).length,
      getVideo: (r.text.match(/get_video/g) || []).length,
      hasSubstringChain: /getElementById\(['"]robotlink/.test(r.text),
      head: r.text.slice(0, 200)
    });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});
app.get("/debug/mxfolders", async (c) => {
  if (!c.env.MIXDROP_EMAIL || !c.env.MIXDROP_KEY)
    return c.json({ error: "creds missing", email: c.env.MIXDROP_EMAIL ?? null, key: c.env.MIXDROP_KEY ? "set" : null });
  try {
    const E = encodeURIComponent(c.env.MIXDROP_EMAIL);
    const K = encodeURIComponent(c.env.MIXDROP_KEY);
    const res = await fetch("https://api.mixdrop.ag/folderlist?email=" + E + "&key=" + K + "&id=0&page=1");
    const text = await res.text();
    return c.json({ status: res.status, body: text.slice(0, 400) });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});
app.get("/debug/discovery", async (c) => {
  await ensureSchema(c.env.DB);
  try {
    const mdCache = /* @__PURE__ */ new Map();
    try {
      const cacheRows = await c.env.DB.prepare("SELECT key, value FROM sync_state WHERE key LIKE 'mdfolder:%'").all();
      for (const r of cacheRows.results || [])
        mdCache.set(r.key, parseInt(r.value, 10) || 0);
    } catch {
    }
    const all = [
      ...await listStreamtape(c.env),
      ...await listMixdropUploads(c.env, c.env.DB, mdCache),
      ...await listAbyssUploads(c.env),
      ...await listByseUploads(c.env),
      ...await listUfoloadUploads(c.env),
      ...await listEarnvidsUploads(c.env),
      ...await listDoodstreamUploads(c.env),
      ...parseUploadsJson(c.env)
    ];
    const norm = /* @__PURE__ */ __name((u) => {
      const m = u.match(/\/(?:e|f|v|file)\/([A-Za-z0-9]+)/i) || u.match(/\/v2\/([A-Za-z0-9]+)\.mp4/i);
      return m ? "ref:" + m[1] : u.replace(/\/$/, "");
    }, "norm");
    const existingUrls = /* @__PURE__ */ new Set();
    try {
      const rows = await c.env.DB.prepare(
        "SELECT streamtape_url, vidmoly_url, mixdrop_url, ufoload_url, abyss_url, byse_url, earnvids_url FROM media_items WHERE is_active=1"
      ).all();
      for (const r of rows.results || []) {
        for (const k of ["streamtape_url", "vidmoly_url", "mixdrop_url", "ufoload_url", "abyss_url", "byse_url", "earnvids_url"]) {
          if (r[k])
            existingUrls.add(norm(String(r[k])));
        }
      }
    } catch {
    }
    const missing = all.filter((u) => {
      if (!u.pageUrl)
        return false;
      return !existingUrls.has(norm(String(u.pageUrl)));
    }).map((u) => ({
      host: u.host,
      id: u.id,
      file: String(u.fileName || "").slice(0, 70),
      page: (u.pageUrl || "").slice(0, 60)
    }));
    const uploads = all.map((u) => ({
      host: u.host,
      file: String(u.fileName || "").slice(0, 70),
      page: (u.pageUrl || "").slice(0, 70),
      inCatalog: existingUrls.has(norm(String(u.pageUrl || "")))
    }));
    return c.json({ total: all.length, inCatalog: all.length - missing.length, missing, uploads });
  } catch (e) {
    return c.json({ error: String(e), stack: e?.stack ?? null }, 500);
  }
});
async function hlsSign(env, url) {
  const secret = env.SYNC_KEY || "the-gate";
  const key2 = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key2, new TextEncoder().encode(url));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hlsSign, "hlsSign");
async function hlsRewrite(env, playlist, baseUrl, code) {
  const origin = new URL(baseUrl).origin;
  const out = [];
  for (const rawLine of playlist.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      out.push(rawLine);
      continue;
    }
    let abs;
    try {
      abs = new URL(line, baseUrl).toString();
    } catch {
      out.push(rawLine);
      continue;
    }
    const sig = await hlsSign(env, abs);
    out.push(`${origin}/proxy/ds/${code}?u=${encodeURIComponent(abs)}&s=${sig}`);
  }
  return out.join("\n");
}
__name(hlsRewrite, "hlsRewrite");
app.get("/proxy/ds/:code", async (c) => {
  const code = c.req.param("code") ?? "";
  if (!/^[A-Za-z0-9]+$/.test(code))
    return c.text("bad id", 400);
  const target = c.req.query("u") || "";
  const clientIp = c.req.header("CF-Connecting-IP") || (c.req.header("X-Forwarded-For") || "").split(",")[0].trim();
  let url = target;
  if (!url) {
    const m3u8 = await doodstreamDirectLink(c.env, code, clientIp).catch(() => null);
    if (!m3u8)
      return c.text("resolve failed", 502);
    url = m3u8;
  } else {
    const sig = c.req.query("s") || "";
    if (sig !== await hlsSign(c.env, url))
      return c.text("bad signature", 403);
  }
  const range = c.req.header("Range");
  const upstream = await fetch(url, {
    headers: {
      "User-Agent": userAgent(c.env),
      Referer: "https://doodstream.com/",
      Accept: "*/*",
      ...range ? { Range: range } : {}
    }
  });
  if (!upstream.ok && upstream.status !== 206) {
    return new Response("upstream " + upstream.status, { status: 502 });
  }
  const contentType = (upstream.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("mpegurl")) {
    const text = await upstream.text();
    return new Response(await hlsRewrite(c.env, text, url, code), {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  const headers = new Headers();
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const v = upstream.headers.get(h);
    if (v)
      headers.set(h, v);
  }
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(upstream.body, { status: upstream.status, headers });
});
app.get("/proxy/st/:embedId", async (c) => {
  const embedId = c.req.param("embedId") ?? "";
  if (!/^[A-Za-z0-9]+$/.test(embedId))
    return c.text("bad id", 400);
  let direct = null;
  let stCookies = "";
  try {
    const jar = { value: "" };
    direct = await extractStreamtape("https://streamtape.com/e/" + embedId + "/", void 0, jar, c.env);
    stCookies = jar.value;
  } catch {
    direct = null;
  }
  if (!direct)
    return c.text("resolve failed", 502);
  const range = c.req.header("Range");
  const upstream = await fetch(direct, {
    redirect: "follow",
    headers: {
      ...range ? { Range: range } : {},
      ...stCookies ? { Cookie: stCookies } : {},
      Referer: "https://streamtape.com/",
      Origin: "https://streamtape.com",
      "User-Agent": userAgent(c.env),
      Accept: "*/*"
    }
  });
  if (!upstream.ok && upstream.status !== 206) {
    return c.text("upstream " + upstream.status, 502);
  }
  const headers = new Headers();
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const v = upstream.headers.get(h);
    if (v)
      headers.set(h, v);
  }
  headers.set("Access-Control-Allow-Origin", "*");
  if (!headers.has("Content-Type"))
    headers.set("Content-Type", "video/mp4");
  return new Response(upstream.body, { status: upstream.status, headers });
});
app.get("/abyss/:fileId", async (c) => {
  const fileId = c.req.param("fileId") ?? "";
  if (!/^[A-Za-z0-9_-]+$/.test(fileId))
    return c.text("bad id", 400);
  try {
    const { ok, text } = await fetchText("https://player.abyssplayer.com/" + fileId, {
      "User-Agent": userAgent(c.env),
      Referer: new URL(c.req.url).origin + "/"
    });
    if (!ok)
      return c.text("player fetch " + ok, 502);
    let html = text;
    html = html.replace(/window\.location\s*=\s*["']https:\/\/abyss\.to["'];?/gi, ";");
    html = html.replace(/advertising\s*:\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*,?/i, "");
    html = html.replace(/<\/body>/i, `<script>(function(){function rdy(){var o=document.getElementById('overlay');if(!o){setTimeout(rdy,300);return;}var h=function(){o.onclick=null;o.ontouchend=null;try{o.remove();}catch(e){}try{var ts=typeof isTouchScreen!=='undefined'?isTouchScreen:false;if(typeof jwplayer!=='undefined'&&typeof jwplayer().play==='function'&&!ts){jwplayer().play();}}catch(e){}};o.onclick=h;o.ontouchend=h;}rdy();})();<\/script></body>`);
    return c.html(html);
  } catch (e) {
    return c.text(String(e), 502);
  }
});
app.get("/proxy/mx/:fileRef", async (c) => {
  const fileRef = c.req.param("fileRef") ?? "";
  if (!/^[A-Za-z0-9]+$/.test(fileRef))
    return c.text("bad id", 400);
  let direct = null;
  const jar = { value: "" };
  try {
    direct = await extractMixdrop("https://mxdrop.click/e/" + fileRef, void 0, jar);
  } catch {
    direct = null;
  }
  if (!direct)
    return c.text("resolve failed", 502);
  const range = c.req.header("Range");
  const upstream = await fetch(direct, {
    redirect: "follow",
    headers: {
      ...range ? { Range: range } : {},
      ...jar.value ? { Cookie: jar.value } : {},
      Referer: "https://mxdrop.click/",
      Origin: "https://mxdrop.click",
      "User-Agent": userAgent(c.env),
      Accept: "*/*"
    }
  });
  if (!upstream.ok && upstream.status !== 206) {
    return c.text("upstream " + upstream.status, 502);
  }
  const headers = new Headers();
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const v = upstream.headers.get(h);
    if (v)
      headers.set(h, v);
  }
  headers.set("Access-Control-Allow-Origin", "*");
  if (!headers.has("Content-Type"))
    headers.set("Content-Type", "video/mp4");
  return new Response(upstream.body, { status: upstream.status, headers });
});
async function tmdbDetail(env, mediaType, id) {
  const key2 = env.TMDB_API_KEY;
  if (!key2)
    return null;
  const { ok, json } = await fetchJsonRetry(
    `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${key2}&language=en-US`
  );
  if (!ok || !json)
    return null;
  return {
    tmdbId: id,
    type: mediaType === "movie" ? "movie" : "series",
    title: String(json.title ?? json.name ?? "Unknown"),
    poster: json.poster_path ? `https://image.tmdb.org/t/p/w500${json.poster_path}` : "",
    backdrop: json.backdrop_path ? `https://image.tmdb.org/t/w1280${json.backdrop_path}` : "",
    overview: String(json.overview ?? ""),
    rating: typeof json.vote_average === "number" ? json.vote_average : 0
  };
}
__name(tmdbDetail, "tmdbDetail");
async function tmdbSearch(env, query, mediaType) {
  const key2 = env.TMDB_API_KEY;
  if (!key2 || !query)
    return null;
  const { ok, json } = await fetchJsonRetry(
    `https://api.themoviedb.org/3/search/${mediaType}?api_key=${key2}&query=${encodeURIComponent(query)}&language=en-US`
  );
  if (!ok || !json)
    return null;
  for (const r of json.results || []) {
    const title = String(r.title ?? r.name ?? "");
    if (!title)
      continue;
    return {
      tmdbId: Number(r.id),
      type: mediaType === "movie" ? "movie" : "series",
      title,
      poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : "",
      backdrop: r.backdrop_path ? `https://image.tmdb.org/t/w1280${r.backdrop_path}` : "",
      overview: String(r.overview ?? ""),
      rating: typeof r.vote_average === "number" ? r.vote_average : 0
    };
  }
  return null;
}
__name(tmdbSearch, "tmdbSearch");
async function resolveAddMatch(env, tmdbId, title, typeHint) {
  if (tmdbId) {
    const order2 = typeHint === "movie" ? ["movie", "tv"] : typeHint === "series" ? ["tv", "movie"] : ["movie", "tv"];
    for (const t of order2) {
      const d = await tmdbDetail(env, t, tmdbId);
      if (d)
        return d;
    }
    return null;
  }
  const clean = title.replace(/\[[^\]]*\]/g, " ").replace(/\b(480p|720p|1080p|2160p|4k|WEB-?DL|WEBRip|BluRay|x26[45]|HEVC|AAC\s?2\s?0|Multi\s?Audio|ESub|ESubs|Dubbed|HindiDub)\b/gi, " ").replace(/[._]+/g, " ").replace(/\s+/g, " ").trim();
  const parts = clean.split(/\s+[-\u201D\u2014]\s+/).map((x) => x.trim()).filter(Boolean);
  const candidates = [.../* @__PURE__ */ new Set([clean, ...parts])].filter(Boolean).slice(0, 3);
  const types = typeHint === "movie" ? ["movie", "tv"] : typeHint === "series" ? ["tv", "movie"] : ["movie", "tv"];
  for (const cand of candidates) {
    for (const t of types) {
      const m = await tmdbSearch(env, cand, t);
      if (m)
        return m;
    }
  }
  return null;
}
__name(resolveAddMatch, "resolveAddMatch");
async function registerTitle(env, match2, season, episode) {
  const id = `${match2.tmdbId}:${match2.type}:${season ?? 0}:${episode ?? 0}`;
  await env.DB.prepare(
    `INSERT INTO media_items (id, tmdb_id, type, title, poster, backdrop, overview, rating, season, episode, is_title_only, is_active, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,1,1,datetime('now'))
     ON CONFLICT(id) DO UPDATE SET title=excluded.title, poster=excluded.poster, backdrop=excluded.backdrop,
       overview=excluded.overview, rating=excluded.rating, is_title_only=1, is_active=1, updated_at=datetime('now')`
  ).bind(
    id,
    match2.tmdbId,
    match2.type,
    match2.title,
    match2.poster || "",
    match2.backdrop || "",
    match2.overview || "",
    match2.rating || 0,
    season,
    episode
  ).run();
  return id;
}
__name(registerTitle, "registerTitle");
app.get("/add/preview", async (c) => {
  const key2 = c.req.query("key");
  if (!c.env.SYNC_KEY || key2 !== c.env.SYNC_KEY)
    return c.json({ error: "unauthorized" }, 401);
  const tmdbId = Number(c.req.query("tmdb") || 0) || null;
  const title = (c.req.query("title") || "").trim();
  const typeHint = (c.req.query("type") || "auto").trim();
  if (!tmdbId && !title)
    return c.json({ ok: false, error: "TMDB id ya title chahiye" });
  const match2 = await resolveAddMatch(c.env, tmdbId, title, typeHint);
  if (!match2) {
    return c.json({ ok: false, error: "TMDB par match nahi mila - title spelling check karo" });
  }
  return c.json({ ok: true, match: match2 });
});
app.post("/ingest/st", async (c) => {
  const key2 = c.req.query("key");
  if (!c.env.SYNC_KEY || key2 !== c.env.SYNC_KEY)
    return c.json({ ok: false, error: "unauthorized" }, 401);
  try {
    const body = await c.req.json().catch(() => null);
    const items = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0)
      return c.json({ ok: false, error: "items khali hai" }, 400);
    await ensureSchema(c.env.DB);
    const stmts = c.env.DB.prepare(
      `INSERT INTO watchlist (url, host, file_name, media_type, tmdb_id) VALUES (?,?,?,?,?)
       ON CONFLICT(url) DO UPDATE SET file_name=excluded.file_name`
    );
    const batch = [];
    let added = 0;
    for (const it of items) {
      const url = String(it.url || "").trim();
      const fileName = String(it.fileName || "").trim();
      if (!url || !fileName || !/streamtape\.com\/(?:e|v)\/[A-Za-z0-9]+/i.test(url))
        continue;
      const mediaType = /[Ss]\d{1,2}[._\- ]?[Ee]\d{1,3}/.test(fileName) ? "series" : "movie";
      batch.push(stmts.bind(url, "streamtape", fileName, mediaType, 0));
      added++;
    }
    if (batch.length)
      await c.env.DB.batch(batch);
    return c.json({ ok: true, added, total: items.length });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 500);
  }
});
app.get("/add/list", async (c) => {
  const key2 = c.req.query("key");
  if (!c.env.SYNC_KEY || key2 !== c.env.SYNC_KEY)
    return c.json({ error: "unauthorized" }, 401);
  await ensureSchema(c.env.DB);
  const rows = await c.env.DB.prepare(
    `SELECT w.url, w.host, w.file_name, w.media_type, w.tmdb_id, w.added_at,
            m.title AS media_title, m.tmdb_id AS media_tmdb, m.is_active,
            (CASE WHEN COALESCE(m.streamtape_url,'') <> '' OR COALESCE(m.vidmoly_url,'') <> ''
                OR COALESCE(m.mixdrop_url,'') <> '' OR COALESCE(m.ufoload_url,'') <> ''
                OR COALESCE(m.earnvids_url,'') <> '' THEN 1 ELSE 0 END) AS has_streams
       FROM watchlist w LEFT JOIN media_items m
         ON m.tmdb_id = w.tmdb_id
        AND m.type = CASE WHEN w.media_type='movie' THEN 'movie' ELSE 'series' END
      ORDER BY w.added_at DESC LIMIT 25`
  ).all();
  return c.json({ ok: true, items: rows.results || [] });
});
app.get("/add", async (c) => {
  const key2 = c.req.query("key");
  const authorized = !!c.env.SYNC_KEY && key2 === c.env.SYNC_KEY;
  const action = c.req.query("do") || "";
  const tmdbId = Number(c.req.query("tmdb") || 0) || null;
  const title = (c.req.query("title") || "").trim();
  const typeHint = (c.req.query("type") || "auto").trim();
  const epRaw = (c.req.query("ep") || "").trim();
  const url = (c.req.query("url") || "").trim();
  const nameOverride = (c.req.query("name") || "").trim();
  const style = `body{background:#0d1117;color:#e6edf3;font-family:system-ui,sans-serif;max-width:560px;margin:24px auto;padding:0 16px;line-height:1.5}
    h1{font-size:1.35em;color:#58a6ff;margin-bottom:4px} h2{font-size:1.05em;color:#e6edf3;margin:22px 0 6px}
    label{display:block;font-size:.82em;color:#8b949e;margin:12px 0 4px}
    input,select,button{width:100%;padding:13px;margin:4px 0;border-radius:10px;border:1px solid #30363d;box-sizing:border-box;font-size:1em}
    input,select{background:#161b22;color:#e6edf3} input:focus,select:focus{outline:2px solid #1f6feb}
    button{background:#1f6feb;color:#fff;border:none;font-weight:600;cursor:pointer} button:active{background:#388bfd}
    .hint{font-size:.82em;color:#8b949e;margin:6px 0 0} .ok{color:#3fb950;font-weight:700} .err{color:#f85149}
    .card{display:flex;gap:12px;align-items:center;background:#161b22;border:1px solid #30363d;border-radius:12px;padding:12px;margin:8px 0}
    .card img{width:56px;height:84px;object-fit:cover;border-radius:6px;background:#0d1117}
    .row{display:flex;justify-content:space-between;gap:10px;font-size:.85em;color:#8b949e;margin-top:6px}
    .pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:.72em;border:1px solid #30363d}
    .pill.ok{color:#3fb950;border-color:#238636} .pill.wait{color:#d29922;border-color:#9e6a03}
    a{color:#58a6ff}`;
  if (action === "add") {
    if (!authorized)
      return c.text("unauthorized - sahi key daalo", 401);
    if (!tmdbId && !title)
      return c.text("TMDB id ya title chahiye", 400);
    const match2 = await resolveAddMatch(c.env, tmdbId, title, typeHint);
    if (!match2) {
      return c.html(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Add failed</title><style>${style}</style></head><body><h1>Match nahi mila</h1><p class="err">TMDB par "${escapeHtml(title || String(tmdbId))}" nahi mila. Title spelling ya TMDB id check karo.</p><p><a href="/add?key=${encodeURIComponent(key2 || "")}">&#8592; Wapas</a></p></body></html>`);
    }
    let season = null;
    let episode = null;
    const epMatch = epRaw.match(/[Ss]?(\d{1,2})[Ee]?(\d{1,3})/);
    if (match2.type === "series" && epMatch) {
      season = parseInt(epMatch[1], 10);
      episode = parseInt(epMatch[2], 10);
    }
    const rowId = await registerTitle(c.env, match2, season, episode);
    let hostMsg = "";
    if (url) {
      const host = detectHost(url);
      if (!host) {
        hostMsg = "Link ka host pehchana nahi hua (Streamtape/Vidmoly/MixDrop/UFOload/EarnVids link daalo)";
      } else {
        const fileName = nameOverride || (match2.type === "movie" ? `tmdb_${match2.tmdbId}.mp4` : season != null && episode != null ? `tmdb_${match2.tmdbId}_S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}.mp4` : `tmdb_${match2.tmdbId}.mp4`);
        await c.env.DB.prepare(
          `INSERT INTO watchlist (url, host, file_name, media_type, tmdb_id) VALUES (?,?,?,?,?)
           ON CONFLICT(url) DO UPDATE SET file_name=excluded.file_name, media_type=excluded.media_type, tmdb_id=excluded.tmdb_id`
        ).bind(url, host, fileName, match2.type, match2.tmdbId).run();
        hostMsg = `${host} - ${fileName}`;
      }
    }
    let synced = 0;
    try {
      synced = await Promise.race([
        triggerSync(c.env),
        new Promise((r) => setTimeout(() => r(0), 15e3))
      ]);
    } catch {
    }
    return c.html(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Added</title><style>${style}</style></head><body>
      <h1>Add ho gaya</h1>
      <div class="card">
        ${match2.poster ? `<img src="${match2.poster}">` : ""}
        <div>
          <div><b>${escapeHtml(match2.title)}</b></div>
          <div class="hint">TMDB ${match2.tmdbId} - ${match2.type} - ${rowId}</div>
          <div class="hint">${escapeHtml(hostMsg || "Link nahi diya - card abhi se dikhega, file baad me bhi aa sakti hai")}</div>
        </div>
      </div>
      <p class="hint">Sync: ${synced} item(s) processed. App me abhi dikhna chahiye (home - refresh).</p>
      <p><a href="/add?key=${encodeURIComponent(key2 || "")}">Aur add karo</a> - <a href="/add/list?key=${encodeURIComponent(key2 || "")}">List</a></p>
    </body></html>`);
  }
  return c.html(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Gate - Add</title><style>${style}</style></head><body>
    <h1>The Gate - Add</h1>
    <p class="hint">Movie / Anime / Series add karo - TMDB id ya title se match hoga.</p>
    <form method="get" action="/add" id="f">
      <input type="hidden" name="do" value="add">
      <input type="hidden" name="key" value="${escapeHtml(key2 || "")}">
      <label>TMDB id (optional - title se bhi chalta hai)</label>
      <input name="tmdb" inputmode="numeric" placeholder="e.g. 270603" value="${escapeHtml(String(c.req.query("tmdb") || ""))}">
      <label>Title</label>
      <input name="title" placeholder="e.g. The Strongest Magician in the Demon Lord's Army" value="${escapeHtml(title)}">
      <label>Type</label>
      <select name="type">
        <option value="auto"${typeHint === "auto" ? " selected" : ""}>Auto</option>
        <option value="movie"${typeHint === "movie" ? " selected" : ""}>Movie</option>
        <option value="series"${typeHint === "series" ? " selected" : ""}>Anime / Series</option>
      </select>
      <label>Episode (series ke liye, optional)</label>
      <input name="ep" placeholder="S01E05" value="${escapeHtml(epRaw)}">
      <label>Embed link (optional - file register karne ke liye)</label>
      <input name="url" placeholder="https://streamtape.com/e/XXXX" value="${escapeHtml(url)}">
      <button type="button" id="pv">Preview (TMDB match)</button>
      <button type="submit">Add &amp; Sync Now</button>
      <div id="pvOut" class="hint"></div>
    </form>
    <h2>Recent adds</h2>
    <div id="list" class="hint">loading...</div>
    <p class="hint" style="margin-top:20px"><a href="/add/list?key=${encodeURIComponent(key2 || "")}">JSON list</a> - <a href="/">Home</a></p>
    <script>
      const key = ${JSON.stringify(key2 || "")};
      const q = () => new URLSearchParams(new FormData(document.getElementById('f'))).toString();
      document.getElementById('pv').onclick = async () => {
        const out = document.getElementById('pvOut');
        out.textContent = 'checking...';
        try {
          const p = new URLSearchParams(q());
          p.set('do','preview'); p.set('key', key);
          const r = await fetch('/add/preview?' + p.toString());
          const j = await r.json();
          if (!j.ok) { out.innerHTML = '<span class="err">' + (j.error||'no match') + '</span>'; return; }
          const m = j.match;
          out.innerHTML = '<div class="card">' + (m.poster ? '<img src="'+m.poster+'">' : '') +
            '<div><b>'+m.title+'</b><div class="hint">TMDB '+m.tmdbId+' - '+m.type+' - rating '+m.rating+'</div></div></div>';
        } catch(e) { out.innerHTML = '<span class="err">'+e+'</span>'; }
      };
      (async () => {
        const el = document.getElementById('list');
        if (!key) { el.textContent = 'key daalo - list dikhegi'; return; }
        try {
          const r = await fetch('/add/list?key=' + encodeURIComponent(key));
          const j = await r.json();
          if (!j.ok) { el.textContent = 'unauthorized'; return; }
          el.innerHTML = j.items.map(i =>
            '<div class="card"><div style="flex:1"><b>'+(i.media_title||'(match nahi)')+'</b>' +
            '<div class="row"><span>'+(i.host||'')+'</span><span>'+(i.file_name||'')+'</span></div>' +
            '<div class="row"><span class="pill '+(i.has_streams?'ok':'wait')+'">'+(i.has_streams?'streams ready':'streams pending')+'</span>' +
            '<span>'+(i.added_at||'')+'</span></div></div></div>').join('') || 'kuch nahi';
        } catch(e) { el.textContent = String(e); }
      })();
    <\/script>
  </body></html>`);
});
app.get("/remove", async (c) => {
  const key2 = c.req.query("key");
  if (!c.env.SYNC_KEY || key2 !== c.env.SYNC_KEY)
    return c.text("unauthorized", 401);
  const url = c.req.query("url");
  if (!url)
    return c.text("url param required", 400);
  await ensureSchema(c.env.DB);
  await c.env.DB.prepare("DELETE FROM watchlist WHERE url = ?").bind(url).run();
  return c.html(`\u2705 Removed: ${url} <a href="/api/sync?key=${key2}">Sync</a>`);
});
app.get("/api/sync", async (c) => {
  const key2 = c.req.query("key");
  if (!c.env.SYNC_KEY || key2 !== c.env.SYNC_KEY) {
    return c.json({ error: "unauthorized" }, 401);
  }
  try {
    const ingested = await runSync(c.env);
    return c.json({ ok: true, ingested, errors: lastSyncErrors });
  } catch (e) {
    return c.json({ ok: false, error: String(e), stack: e?.stack ?? null }, 500);
  }
});
async function scheduled(event, env, ctx) {
  if (env.CRON_ENABLED === "false")
    return;
  ctx.waitUntil(
    (async () => {
      try {
        const n = await runSync(env);
        console.log(`[cron] done, ingested=${n}`);
      } catch (e) {
        console.error("[cron] failed:", e);
      }
    })()
  );
}
__name(scheduled, "scheduled");
var GATE_RESOLVE_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
var GATE_RESOLVE_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};
function gateParseExternalUrl(raw2) {
  try {
    const u = new URL(raw2);
    if (u.protocol !== "http:" && u.protocol !== "https:")
      return null;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "::1" || h === "127.0.0.1" || h.startsWith("10.") || h.startsWith("192.168.") || h.startsWith("172.16."))
      return null;
    return u;
  } catch {
    return null;
  }
}
__name(gateParseExternalUrl, "gateParseExternalUrl");
function gateHeadersForTarget(target) {
  return {
    Referer: target.origin + "/",
    Origin: target.origin,
    "User-Agent": GATE_RESOLVE_UA
  };
}
__name(gateHeadersForTarget, "gateHeadersForTarget");
var GATE_HOST_SCORES = [
  [/stream\.andromedans\.live/i, 100],
  [/(?:^|\.)ufoload\./i, 90],
  [/(?:^|\.)streamtape\./i, 85],
  [/(?:^|\.)(?:mixdrop|mxdrop)\./i, 80],
  [/(?:^|\.)vidmoly\./i, 75],
  [/(?:^|\.)(?:doodstream|dood)\./i, 70]
];
function gateScoreMediaUrl(u) {
  let score = /\.m3u8(?:\?|$)/i.test(u) ? 40 : 10;
  if (/^https:/i.test(u))
    score += 15;
  try {
    const h = new URL(u).hostname.toLowerCase();
    for (const [re, pts] of GATE_HOST_SCORES) {
      if (re.test(h)) {
        score += pts;
        break;
      }
    }
    if (/(1080|720|hdr)/i.test(u))
      score += 5;
  } catch {
  }
  return score;
}
__name(gateScoreMediaUrl, "gateScoreMediaUrl");
function gateFindBestMediaUrl(html, base) {
  const clean = html.replace(/\\u002F/gi, "/").replace(/\\\//g, "/").replace(/&amp;/gi, "&");
  const found = /* @__PURE__ */ new Set();
  for (const m of clean.matchAll(/https?:\/\/[^\s"'<>]+?\.(?:m3u8|mp4)(?:\?[^\s"'<>]*)?/gi)) {
    found.add(m[0]);
  }
  for (const m of clean.matchAll(
    /(?:get_video_url|video_url|file|url|src)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/gi
  )) {
    const v = m[1];
    try {
      found.add(v.startsWith("http") ? v : new URL(v, base).href);
    } catch {
    }
  }
  for (const m of clean.matchAll(/(\/streamtape\.com\/get_video\?[^"'<>\s]+)/gi)) {
    found.add("https://" + m[1].replace(/^\//, ""));
  }
  if (!found.size)
    return null;
  const ranked = [...found].map((u) => ({ url: u, score: gateScoreMediaUrl(u) })).sort((a, b) => b.score - a.score);
  return { url: ranked[0].url, score: ranked[0].score, count: found.size };
}
__name(gateFindBestMediaUrl, "gateFindBestMediaUrl");
app.get("/resolve", async (c) => {
  const target = gateParseExternalUrl(c.req.query("url") ?? "");
  if (!target) {
    return c.json({ ok: false, error: "invalid or blocked url" }, 400, GATE_RESOLVE_CORS);
  }
  try {
    const headers = gateHeadersForTarget(target);
    const wantProxy = c.req.query("proxy") === "1";
    const gateWrap = /* @__PURE__ */ __name((raw2) => {
      if (!wantProxy)
        return raw2;
      return `${new URL(c.req.url).origin}/proxy?url=${encodeURIComponent(raw2)}`;
    }, "gateWrap");
    const hname = target.hostname.toLowerCase();
    let hostDirect = null;
    let via = "";
    try {
      if (/streamtape/i.test(hname)) {
        hostDirect = await extractStreamtape(target.href, void 0, void 0, c.env);
        via = "streamtape";
      } else if (/mixdrop|mxdrop/i.test(hname)) {
        hostDirect = await extractMixdrop(target.href);
        via = "mixdrop";
      } else if (/vidmoly/i.test(hname)) {
        hostDirect = await extractVidmoly(target.href);
        via = "vidmoly";
      } else if (/ufoload/i.test(hname)) {
        hostDirect = await extractUfoload(target.href);
        via = "ufoload";
      } else if (/dood/i.test(hname)) {
        const code = (target.pathname.match(/\/(?:e|d|file)\/([A-Za-z0-9]+)/i) || [])[1];
        if (code) {
          hostDirect = await extractDoodstreamEmbed(c.env, code, target.origin);
          via = "doodstream";
        }
      }
    } catch {
    }
    if (hostDirect) {
      return c.json(
        {
          ok: true,
          url: gateWrap(hostDirect),
          type: /\.m3u8/i.test(hostDirect) ? "m3u8" : "mp4",
          headers: gateHeadersForTarget(new URL(hostDirect)),
          source: "The Gate",
          via,
          chosen: "best-known-host"
        },
        200,
        GATE_RESOLVE_CORS
      );
    }
    const res = await fetch(target.href, {
      headers,
      redirect: "follow",
      cf: { cacheTtl: 0 }
    });
    const finalUrl = res.url || target.href;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("html") || ct.includes("text")) {
      const html = await res.text();
      const best = gateFindBestMediaUrl(html, new URL(finalUrl));
      if (!best) {
        return c.json(
          { ok: false, error: "no media link found in page", host: target.hostname },
          422,
          GATE_RESOLVE_CORS
        );
      }
      return c.json(
        {
          ok: true,
          url: gateWrap(best.url),
          type: best.url.includes(".m3u8") ? "m3u8" : "mp4",
          headers,
          source: "The Gate",
          via: "extract",
          chosen: "best-ranked",
          servers: best.count,
          score: best.score
        },
        200,
        GATE_RESOLVE_CORS
      );
    }
    const type = ct.includes("mpegurl") || finalUrl.includes(".m3u8") ? "m3u8" : "mp4";
    return c.json(
      { ok: true, url: gateWrap(finalUrl), type, headers, source: "The Gate", via: "direct" },
      200,
      GATE_RESOLVE_CORS
    );
  } catch (e) {
    return c.json(
      { ok: false, error: String(e?.message ?? e) },
      502,
      GATE_RESOLVE_CORS
    );
  }
});
app.get("/proxy", async (c) => {
  const target = gateParseExternalUrl(c.req.query("url") ?? "");
  if (!target)
    return c.json({ ok: false, error: "invalid url" }, 400);
  try {
    const headers = gateHeadersForTarget(target);
    const range = c.req.header("Range");
    if (range)
      headers["Range"] = range;
    const res = await fetch(target.href, { headers, redirect: "follow" });
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("mpegurl") || /\.m3u8(?:\?|$)/i.test(target.pathname)) {
      const origin = new URL(c.req.url).origin;
      const px = /* @__PURE__ */ __name((u) => {
        try {
          const abs = new URL(u, res.url || target.href).href;
          if (abs.includes("/proxy?url="))
            return abs;
          return `${origin}/proxy?url=${encodeURIComponent(abs)}`;
        } catch {
          return u;
        }
      }, "px");
      const playlist = await res.text();
      const rewritten = playlist.split(/\r?\n/).map((line) => {
        const t = line.trim();
        if (!t)
          return line;
        if (t.startsWith("#"))
          return line.replace(/URI="([^"]+)"/g, (_m, u) => `URI="${px(u)}"`);
        return px(t);
      }).join("\n");
      const hlsHeaders = new Headers();
      const hct = res.headers.get("content-type");
      if (hct)
        hlsHeaders.set("content-type", hct);
      hlsHeaders.set("Access-Control-Allow-Origin", "*");
      hlsHeaders.set("Cache-Control", "no-store");
      return new Response(rewritten, { status: res.status, headers: hlsHeaders });
    }
    const out = new Headers();
    for (const k of [
      "content-type",
      "content-length",
      "accept-ranges",
      "content-range",
      "etag"
    ]) {
      const v = res.headers.get(k);
      if (v)
        out.set(k, v);
    }
    out.set("Access-Control-Allow-Origin", "*");
    out.set("Cache-Control", "no-store");
    return new Response(res.body, { status: res.status, headers: out });
  } catch (e) {
    return c.json({ ok: false, error: String(e?.message ?? e) }, 502);
  }
});
app.get("/debug/names", async (c) => {
  const host = (c.req.query("host") || "all").toLowerCase();
  const apply = c.req.query("apply") === "1";
  const limit = Math.min(parseInt(c.req.query("limit") || "20", 10) || 20, 25);
  const offset = Math.max(0, parseInt(c.req.query("offset") || "0", 10) || 0);
  const skipRenamed = c.req.query("skipRenamed") === "1";
  const jobs = [];
  try {
    if (host === "all" || host === "streamtape") {
      jobs.push(...(await listStreamtape(c.env)).map((f) => ({ ...f, host: "streamtape" })));
    }
    if (host === "all" || host === "ufoload") {
      jobs.push(...(await listUfoloadUploads(c.env)).map((f) => ({ ...f, host: "ufoload" })));
    }
  } catch (e) {
    return c.json({ ok: false, error: String(e?.message ?? e) }, 500, GATE_RESOLVE_CORS);
  }
  let allJobs = skipRenamed ? jobs.filter((f) => !/^tmdb_\d+_/i.test(String(f.fileName || ""))) : jobs;
  const q = (c.req.query("q") || "").toLowerCase();
  if (q)
    allJobs = allJobs.filter((f) => String(f.fileName || "").toLowerCase().includes(q));
  const forceId = parseInt(c.req.query("forceId") || "0", 10) || 0;
  const results = [];
  for (const f of allJobs.slice(offset, offset + limit)) {
    const parsed = parseFilename(String(f.fileName || ""));
    const m = forceId ? { tmdbId: forceId, title: parsed.title || q || "Movie", type: "movie" } : await tmdbMatch(c.env, parsed);
    if (!m) {
      results.push({ host: f.host, id: f.id, old: f.fileName, match: null, renamed: false });
      continue;
    }
    const title = String(m.title || "").replace(/[^a-zA-Z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
    const ep = parsed.season != null ? `_S${String(parsed.season).padStart(2, "0")}E${String(parsed.episode ?? 1).padStart(2, "0")}` : "";
    const newName = `tmdb_${m.tmdbId}_${title || "Movie"}${ep}.mp4`;
    let renamed = false, error = "";
    if (apply) {
      try {
        if (f.host === "streamtape") {
          const login = c.env.STREAMTAPE_USER || c.env.STREAMTAPE_LOGIN || "";
          const r = await fetchJson(
            `https://api.streamtape.com/file/rename?login=${encodeURIComponent(login)}&key=${encodeURIComponent(c.env.STREAMTAPE_KEY || "")}&file=${encodeURIComponent(f.id)}&name=${encodeURIComponent(newName)}`
          );
          renamed = !!r.ok && r.json?.status === 200;
          if (!renamed)
            error = JSON.stringify(r.json || r.text || {}).slice(0, 140);
        } else {
          const fid = String(f.id || "").replace(/^ufo_/, "");
          const key2 = c.env.UFOLOAD_API_KEY || c.env.UFOLOAD_KEY || "";
          for (const body of [{ name: newName }, { title: newName }]) {
            const r = await fetch(`https://ufoload.com/api/v1/files/${fid}`, {
              method: "PATCH",
              headers: { Authorization: "Bearer " + key2, "Content-Type": "application/json" },
              body: JSON.stringify(body)
            });
            if (r.ok) {
              renamed = true;
              break;
            }
            error = `HTTP ${r.status}`;
          }
        }
      } catch (e) {
        error = String(e?.message ?? e).slice(0, 140);
      }
    }
    results.push({ host: f.host, id: f.id, old: f.fileName, new: newName, tmdbId: m.tmdbId, renamed, error });
  }
  return c.json({ ok: true, apply, scanned: allJobs.length, offset, results }, 200, GATE_RESOLVE_CORS);
});
app.get("/debug/uploads", async (c) => {
  const raw2 = parseUploadsJson(c.env);
  return c.json({ ok: true, uploads: raw2.map((f) => ({ host: f.host, id: f.id, fileName: f.fileName, pageUrl: f.pageUrl })) }, 200, GATE_RESOLVE_CORS);
});
app.get("/debug/runsync", async (c) => {
  try {
    const n = await runSync(c.env);
    return c.json({ ok: true, ingested: n, errors: lastSyncErrors.slice(0, 20) }, 200, GATE_RESOLVE_CORS);
  } catch (e) {
    return c.json({ ok: false, error: String(e?.stack || e).slice(0, 600) }, 500, GATE_RESOLVE_CORS);
  }
});
app.get("/debug/fetch", async (c) => {
  const url = c.req.query("url") || "";
  const t = gateParseExternalUrl(url);
  if (!t)
    return c.json({ ok: false, error: "bad url" }, 400);
  try {
    const r = await fetch(t.href, { headers: { "User-Agent": GATE_RESOLVE_UA, Referer: t.origin + "/", Accept: "*/*" }, redirect: "follow" });
    const text = await r.text();
    return c.json({
      ok: true,
      status: r.status,
      final: r.url,
      ct: r.headers.get("content-type"),
      size: text.length,
      getvideo: (text.match(/get_video/g) || []).length,
      relmatch: (text.match(/\/streamtape\.com\/get_video/gi) || []).length,
      snippet: text.slice(Math.max(0, text.indexOf("get_video") - 90), text.indexOf("get_video") + 160)
    }, 200, GATE_RESOLVE_CORS);
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 500);
  }
});
app.get("/gate/st/:id", async (c) => {
  const id = (c.req.param("id") || "").replace(/[^A-Za-z0-9]/g, "");
  const login = c.env.STREAMTAPE_USER || c.env.STREAMTAPE_LOGIN || "";
  const key2 = c.env.STREAMTAPE_KEY || "";
  if (!id || !login || !key2)
    return c.text("bad config", 500);
  try {
    let direct = null, lastMsg = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      const tk = await fetchJson(`https://api.streamtape.com/file/dlticket?file=${id}&login=${encodeURIComponent(login)}&key=${encodeURIComponent(key2)}`);
      const ticket = tk.json?.result?.ticket;
      if (!ticket) {
        lastMsg = "ticket: " + String(tk.json?.msg || "none");
        break;
      }
      const wait = Math.min(Number(tk.json?.result?.wait_time || 5), 8);
      await new Promise((r) => setTimeout(r, (wait + 1) * 1e3));
      const dl = await fetchJson(`https://api.streamtape.com/file/dl?file=${id}&ticket=${encodeURIComponent(ticket)}`);
      direct = dl.json?.result?.url || null;
      if (direct)
        break;
      lastMsg = "dl: " + String(dl.json?.msg || "none");
    }
    if (!direct)
      return c.text("resolve: " + lastMsg, 502);
    const range = c.req.header("Range");
    const headers = { "User-Agent": GATE_RESOLVE_UA, Referer: "https://streamtape.com/" };
    if (range)
      headers["Range"] = range;
    const res = await fetch(direct, { headers, redirect: "follow" });
    if (!res.ok && res.status !== 206)
      return c.text("upstream " + res.status, 502);
    const out = new Headers();
    for (const k of ["content-type", "content-length", "accept-ranges", "content-range", "etag"]) {
      const v = res.headers.get(k);
      if (v)
        out.set(k, v);
    }
    out.set("Access-Control-Allow-Origin", "*");
    out.set("Cache-Control", "no-store");
    return new Response(res.body, { status: res.status, headers: out });
  } catch (e) {
    return c.text("error " + String(e?.message ?? e).slice(0, 80), 502);
  }
});
app.get("/debug/rename", async (c) => {
  const host = c.req.query("host") || "";
  const id = (c.req.query("id") || "").replace(/^ufo_/, "");
  const name = c.req.query("name") || "";
  if (host !== "ufoload" || !id || !name)
    return c.json({ ok: false, error: "host=ufoload&id=&name= required" }, 400);
  const key2 = c.env.UFOLOAD_API_KEY || c.env.UFOLOAD_KEY || "";
  if (!key2)
    return c.json({ ok: false, error: "no key" }, 500);
  try {
    let ok = false, status = 0;
    for (const body of [{ name }, { title: name }]) {
      const r = await fetch(`https://ufoload.com/api/v1/files/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Authorization: "Bearer " + key2, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      status = r.status;
      if (r.ok) {
        ok = true;
        break;
      }
    }
    return c.json({ ok, status, id, name }, 200, GATE_RESOLVE_CORS);
  } catch (e) {
    return c.json({ ok: false, error: String(e).slice(0, 150) }, 500);
  }
});
app.get("/debug/clearcache", async (c) => {
  try {
    await c.env.DB.prepare("DELETE FROM sync_state WHERE key IN ('uploads_cache','uploads_cache_at','mxcooldown','sync_cursor')").run();
    return c.json({ ok: true, cleared: true }, 200, GATE_RESOLVE_CORS);
  } catch (e) {
    return c.json({ ok: false, error: String(e).slice(0, 150) }, 500);
  }
});
app.get("/catalog/ufoload.json", async (c) => {
  try {
    await ensureSchema(c.env.DB);
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM media_items WHERE is_active=1 AND ufoload_url IS NOT NULL AND ufoload_url<>'' ORDER BY updated_at DESC, id DESC LIMIT 300"
    ).all();
    const seen = /* @__PURE__ */ new Set();
    const metas = (results || []).filter((item) => {
      const key2 = `${item.tmdb_id}:${item.type}`;
      if (seen.has(key2))
        return false;
      seen.add(key2);
      return true;
    }).map((item) => ({
      id: `tmdb:${item.tmdb_id}`,
      type: item.type,
      name: item.title,
      poster: item.poster,
      posterShape: "poster",
      background: item.backdrop,
      description: item.overview || item.title,
      releaseInfo: "UFOload"
    }));
    return c.json({ metas }, 200, GATE_RESOLVE_CORS);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});
app.get("/debug/deadlink", async (c) => {
  const file = c.req.query("file") || "";
  if (!file)
    return c.json({ ok: false, error: "?file= required" }, 400);
  try {
    const idm = file.match(/tmdb_(\d+)/);
    if (!idm)
      return c.json({ ok: false, error: "no tmdb id in file name" }, 400);
    const tmdbId = parseInt(idm[1], 10);
    const r = await c.env.DB.prepare("UPDATE media_items SET streamtape_url=NULL WHERE tmdb_id=? AND streamtape_url IS NOT NULL AND streamtape_url<>''").bind(tmdbId).run();
    return c.json({ ok: true, tmdbId, changes: r?.changes ?? 0, action: "streamtape_url cleared" }, 200, GATE_RESOLVE_CORS);
  } catch (e) {
    return c.json({ ok: false, error: String(e).slice(0, 150) }, 500);
  }
});
app.get("/debug/ufolinks", async (c) => {
  const fid = c.req.query("id") || "";
  const key2 = c.env.UFOLOAD_API_KEY || c.env.UFOLOAD_KEY || "";
  if (!fid)
    return c.json({ ok: false, error: "id required" });
  try {
    const r = await fetch("https://ufoload.com/api/v1/files/" + fid + "/links", {
      method: "POST",
      headers: { Authorization: "Bearer " + key2, Accept: "application/json" }
    });
    const t = await r.text();
    return c.json({ ok: true, status: r.status, body: t.slice(0, 400) }, 200, GATE_RESOLVE_CORS);
  } catch (e) {
    return c.json({ ok: false, error: String(e).slice(0, 150) });
  }
});
app.get("/debug/cleanup-dead", async (c) => {
  const key2 = c.env.UFOLOAD_API_KEY || c.env.UFOLOAD_KEY || "";
  try {
    const rows = await c.env.DB.prepare("SELECT id, ufoload_url FROM media_items WHERE ufoload_url LIKE '%/api/v1/files/%' AND is_active=1").all();
    let checked = 0, dead = 0;
    for (const r of rows.results || []) {
      const fid = String(r.ufoload_url || "").match(/\/api\/v1\/files\/([A-Za-z0-9]+)/)?.[1];
      if (!fid)
        continue;
      checked++;
      try {
        const res = await fetch("https://ufoload.com/api/v1/files/" + fid + "/links", {
          method: "POST",
          headers: { Authorization: "Bearer " + key2, Accept: "application/json" }
        });
        if (res.status === 404 || res.status === 410) {
          await c.env.DB.prepare("UPDATE media_items SET ufoload_url='' WHERE id=?").bind(r.id).run();
          dead++;
        }
      } catch {
      }
    }
    await c.env.DB.prepare("UPDATE media_items SET is_active=0, updated_at=datetime('now') WHERE is_active=1 AND streamtape_url='' AND vidmoly_url='' AND mixdrop_url='' AND ufoload_url='' AND abyss_url='' AND byse_url='' AND earnvids_url='' AND doodstream_url='' AND is_title_only=0").run();
    return c.json({ ok: true, checked, dead }, 200, GATE_RESOLVE_CORS);
  } catch (e) {
    return c.json({ ok: false, error: String(e).slice(0, 200) });
  }
});
app.get("/catalog/mixdrop.json", async (c) => {
  try {
    await ensureSchema(c.env.DB);
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM media_items WHERE is_active=1 AND mixdrop_url IS NOT NULL AND mixdrop_url<>'' ORDER BY updated_at DESC, id DESC LIMIT 300"
    ).all();
    const seen = /* @__PURE__ */ new Set();
    const metas = (results || []).filter((item) => {
      const key2 = `${item.tmdb_id}:${item.type}`;
      if (seen.has(key2))
        return false;
      seen.add(key2);
      return true;
    }).map((item) => ({
      id: `tmdb:${item.tmdb_id}`,
      type: item.type,
      name: item.title,
      poster: item.poster,
      posterShape: "poster",
      background: item.backdrop,
      description: item.overview || item.title,
      releaseInfo: "MixDrop"
    }));
    return c.json({ metas }, 200, GATE_RESOLVE_CORS);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});
app.get("/stx/:id", async (c) => {
  const fid = (c.req.param("id") || "").replace(/[^A-Za-z0-9]/g, "");
  const login = c.env.STREAMTAPE_USER || c.env.STREAMTAPE_LOGIN || "";
  const key2 = c.env.STREAMTAPE_KEY || "";
  if (!fid || !login || !key2)
    return c.text("bad config", 500);
  try {
    const tk = await fetchJson(`https://api.streamtape.com/file/dlticket?file=${fid}&login=${encodeURIComponent(login)}&key=${encodeURIComponent(key2)}`);
    const ticket = tk.json?.result?.ticket;
    if (!ticket)
      return c.text("ticket failed", 502);
    for (let i = 0; i < 5; i++) {
      const dl = await fetchJson(`https://api.streamtape.com/file/dl?file=${fid}&ticket=${encodeURIComponent(ticket)}`);
      const url = dl.json?.result?.url;
      if (url && /^https?:/i.test(url)) {
        const h = new Headers();
        for (const k of ["content-type", "content-length", "accept-ranges", "content-range", "etag"]) {
          const v = dl.headers?.get?.(k);
          if (v)
            h.set(k, v);
        }
        h.set("Location", String(url));
        return new Response(null, { status: 302, headers: h });
      }
      if (/wait/i.test(String(dl.json?.msg || ""))) {
        await new Promise((r) => setTimeout(r, 2e3));
        continue;
      }
      break;
    }
    return c.text("resolve failed", 502);
  } catch (e) {
    return c.text("error " + String(e?.message ?? e).slice(0, 60), 502);
  }
});
app.get("/debug/mxtest", async (c) => {
  const E = encodeURIComponent(c.env.MIXDROP_EMAIL || "");
  const K = encodeURIComponent(c.env.MIXDROP_KEY || "");
  const out = [];
  for (const host of ["api.mixdrop.ag", "api.mixdrop.co", "api.mixdrop.to", "api.mixdrop.ws", "api.mxdrop.click"]) {
    try {
      const r = await fetch(`https://${host}/folderlist?email=${E}&key=${K}&id=0&page=1`, { signal: AbortSignal.timeout(12e3) });
      const t = await r.text();
      out.push({ host, status: r.status, body: t.slice(0, 120) });
    } catch (e) {
      out.push({ host, error: String(e?.message ?? e).slice(0, 60) });
    }
  }
  return c.json({ ok: true, results: out }, 200, GATE_RESOLVE_CORS);
});
app.post("/debug/addmix", async (c) => {
  const host = (c.req.query("host") || "mixdrop").toLowerCase();
  const body = await c.req.text();
  const lines = body.split("\n").map((x) => x.trim()).filter(Boolean);
  let added = 0, errors = [];
  for (const line of lines) {
    const [name, url] = line.split("|").map((x) => x?.trim());
    if (!name || !url) {
      errors.push("bad line: " + line.slice(0, 40));
      continue;
    }
    const mt = /S\d+E\d+|S01E|episode/i.test(name) ? "series" : "movie";
    const tm = name.match(/tmdb[_\s]?(\d+)/i);
    const tmdbId = tm ? parseInt(tm[1], 10) : null;
    try {
      await c.env.DB.prepare("INSERT OR IGNORE INTO watchlist (url, host, file_name, media_type, tmdb_id) VALUES (?,?,?,?,?)").bind(url, host, name, mt, tmdbId).run();
      added++;
    } catch (e) {
      errors.push(name.slice(0, 30) + ": " + String(e?.message ?? e).slice(0, 50));
    }
  }
  return c.json({ ok: true, added, errors: errors.slice(0, 10) }, 200, GATE_RESOLVE_CORS);
});
app.get("/sd/:id", async (c) => {
  const fid = (c.req.param("id") || "").replace(/[^A-Za-z0-9]/g, "");
  const login = c.env.STREAMTAPE_USER || c.env.STREAMTAPE_LOGIN || "";
  const key2 = c.env.STREAMTAPE_KEY || "";
  if (!fid || !login || !key2)
    return c.text("bad config", 500);
  try {
    let direct = null, last = "";
    for (let a = 0; a < 3; a++) {
      const tk = await fetchJson(`https://api.streamtape.com/file/dlticket?file=${fid}&login=${encodeURIComponent(login)}&key=${encodeURIComponent(key2)}`);
      const ticket = tk.json?.result?.ticket;
      if (!ticket) {
        last = "ticket " + String(tk.json?.msg || "none");
        break;
      }
      const wait = Math.min(Number(tk.json?.result?.wait_time || 5), 9);
      await new Promise((r) => setTimeout(r, (wait + 1) * 1e3));
      const dl = await fetchJson(`https://api.streamtape.com/file/dl?file=${fid}&ticket=${encodeURIComponent(ticket)}`);
      direct = dl.json?.result?.url || null;
      if (direct)
        break;
      last = "dl " + String(dl.json?.msg || "none");
    }
    if (!direct)
      return c.text("resolve " + last, 502);
    const h = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36", Referer: "https://streamtape.com/" };
    const range = c.req.header("Range");
    if (range)
      h["Range"] = range;
    const res = await fetch(direct, { headers: h, redirect: "follow" });
    if (!res.ok && res.status !== 206)
      return c.text("upstream " + res.status, 502);
    const out = new Headers();
    for (const k of ["content-type", "content-length", "accept-ranges", "content-range", "etag"]) {
      const v = res.headers.get(k);
      if (v)
        out.set(k, v);
    }
    out.set("Access-Control-Allow-Origin", "*");
    out.set("Cache-Control", "no-store");
    return new Response(res.body, { status: res.status, headers: out });
  } catch (e) {
    return c.text("error " + String(e?.message ?? e).slice(0, 70), 502);
  }
});
app.get("/debug/watchlist", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM watchlist WHERE tmdb_id=? OR file_name LIKE ? LIMIT 30").bind(127532, "%127532%").all();
  return c.json({ ok: true, rows: results }, 200, GATE_RESOLVE_CORS);
});
app.get("/debug/delwatch", async (c) => {
  const like = c.req.query("like") || "%127532%";
  const r = await c.env.DB.prepare("DELETE FROM watchlist WHERE file_name LIKE ?").bind(like).run();
  return c.json({ ok: true, changes: r.changes || 0 }, 200, GATE_RESOLVE_CORS);
});
var src_default = {
  fetch: app.fetch,
  async scheduled(_event, env, ctx) {
    if (String(env.CRON_ENABLED ?? "true") !== "true")
      return;
    try {
      ctx.waitUntil(triggerSync(env));
    } catch {
    }
  }
};
export {
  src_default as default,
  scheduled
};
//# sourceMappingURL=index.js.map
