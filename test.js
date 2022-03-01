const Koa = require('koa');
const koaBody = require('koa-body');

const koaLambda = require('./index.js');
const app = new Koa();


app.use(koaBody())
.use( koaLambda({
  dirname: __dirname+'/lambda/',
  // filter: /(.+)\.fn\.js$/,
  root:'/aaa'
}, app) )
.use(koaLambda({
  dirname: __dirname+'/src/',
  filter: /(.+)\.fn\.js$/,
}, app))

app.use(async ctx => {
  ctx.body = 'Hello World';
});



// console.log(app.lambdaRouters)

app.listen(3333);