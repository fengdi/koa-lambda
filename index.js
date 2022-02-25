const hookify = require("@fengdi-spore/hookify");
const requireAll = require("require-all");
const qs = require("qs");
const compose = require("koa-compose");

const useParameters = hookify.useParameters;

const useContext = function () {
  let param = useParameters();
  return param[0];
};
const useNext = function () {
  let param = useParameters();
  return param[1];
};

//ctx, next  =>  arg[]
const requestParams = function (ctx, next) {
  if (ctx.request.method === "GET") {
    ctx.request.body = qs.parse(ctx.request.querystring, {
      plainObjects: true,
    });
  }

  if (!ctx.request.body) {
    throw new Error(
      "ctx.request.body is null, please use bodyparser middleware before."
    );
  }

  let body = ctx.request.body;

  return body && body.args ? body.args : [];
};

let routersTreeTraverse = function (routers, path = "", res = {}) {
  if (routers instanceof Function) {
    routers.fid = path;
    // routers.aop = ''; // '' | 'before' | 'after'
    res[path] = routers;
  } else if (typeof routers == "object") {
    for (const key in routers) {
      if (Object.hasOwnProperty.call(routers, key)) {
        routersTreeTraverse(routers[key], path + "/" + key, res);
      }
    }
  }
  return res;
};

//fn => middleware
const lambda = function (handler, options = {}) {
  handler.aop =
    handler.aop === void 0 ? options.handlerAopDefault : handler.aop;
  handler.method = handler.method === void 0 ? "post" : handler.method;

  return hookify(async (...args) => {
    let ctx = useContext();
    let next = useNext();

    if (
      !handler ||
      !handler instanceof Function ||
      handler.method.toLowerCase() !== ctx.request.method.toLowerCase()
    ) {
      return await next();
    }

    if (handler.aop == "after") {
      await next();
    }
    let ret = await handler(...args);

    if (ret !== void 0) {
      ctx.body = ret;
    }
    if (handler.aop == "before") {
      await next();
    }
  }, lambdaMiddleware.requestParams);
};

//middleware => fn or middleware[] => fn
const middleware = function (mware) {
  if (Array.isArray(mware)) {
    mware = compose(mware);
  }
  return async function () {
    let ctx = useContext();
    let next = useNext();
    return await mware(ctx, next);
  };
};

const lambdaMiddleware = function (options, app) {
  options = Object.assign(
    { handlerAopDefault: "", root: "", dirname: __dirname + "/src" },
    options
  );

  if (!app || !app.middleware) {
    throw new Error("The second parameter is required to be koa app instance.");
  }

  let lambdaRouters = routersTreeTraverse(
    requireAll({
      ...options,
    }),
    options.root || ""
  );

  Object.keys(lambdaRouters).map((path) => {
    let handler = lambdaRouters[path];
    let mware = lambda(handler, options);
    mware.handler = handler;
    lambdaRouters[path] = mware;
  });

  // console.log("loadRouter:", Object.keys(lambdaRouters));

  app.lambdaRouters = (app.lambdaRouters || []).concat(lambdaRouters);

  return async function (ctx, next) {
    let mware = lambdaRouters[ctx.request.path];

    if (mware) {
      return mware(ctx, next);
    } else {
      await next();
    }
  };
};

Object.assign(lambdaMiddleware, {
  useContext,
  useNext,
  middleware,
  compose,
  lambda,
  requestParams,
});

module.exports = lambdaMiddleware;
