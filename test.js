const Koa = require('koa');
const koaBody = require('koa-body');

const lambda = require('./index.js');
const app = new Koa();


app.use(koaBody())
.use( lambda({}, app) );

app.use(async ctx => {
  ctx.body = 'Hello World';
});

app.listen(3333);