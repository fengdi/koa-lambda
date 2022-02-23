
const hookify = require("@fengdi-spore/hookify");
const requireAll = require("require-all");
const qs = require('qs');
const compose = require('koa-compose');

const useParameters = hookify.useParameters;

const useContext = function(){
    let param = useParameters();
    return param[0];
};
const useNext = function(){
    let param = useParameters();
    return param[1];
};

const param = function(ctx){

    if (ctx.request.method === 'GET') {
      ctx.request.body = qs.parse(ctx.request.querystring, { plainObjects: true });
    }

    if(!ctx.request.body){
      throw new Error('ctx.request.body is null, use bodyparser before')
    }

    let body = ctx.request.body;

    return (body&&body.args) ? body.args : []; 
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
const lambda = function(fn){

    
    return hookify(async (...args)=>{
        
        let ctx = useContext();
        let next = useNext();

        if (
          !fn ||
          !fn instanceof Function ||
          fn.method.toLowerCase() !== ctx.request.method.toLowerCase()
        ){
            return await next();
        }

        if (fn.aop == "after") {
            await next();
        }
        let ret = await fn(...args);

        if (ret !== void 0) {
            ctx.body = ret;
        }
        if (fn.aop == "before") {
            await next();
        }
    }, param);
};



//middleware => fn
const middlewareify = function(middleware){
  
  return function(){

  }
};



module.exports = function(options, app){

    options = Object.assign({handlerAopDefault:'', source:'src', root:''}, options)


    if(!app || !app.middleware){
        throw new Error('require app');
    }

    let fnRouters = routersTreeTraverse(
        requireAll({
          dirname: __dirname + "/" + (options.source || "src"),
          filter: /(.+)\.fn\.js$/,
        }),
        options.root || ""
      );
    
      Object.keys(fnRouters).map((path) => {
        let handler = fnRouters[path];
        handler.aop =
          handler.aop === void 0 ? options.handlerAopDefault : handler.aop;
        handler.method = handler.method === void 0 ? "post" : handler.method;
          
        let middleware = lambda(handler);
        middleware.handler = handler;
        fnRouters[path] = middleware;
      });
    
      console.log("loadRouter:", Object.keys(fnRouters));
    
    
      app.fnRouters = fnRouters;


      return async function (ctx, next) {

        let middleware = fnRouters[ctx.request.path];
        
        console.log(ctx.request.querystring, ctx.request.path);
        
        if(middleware){
            return middleware(ctx, next);
        }
      };
};


Object.assign(module.exports, {
    useContext,
    useNext
});