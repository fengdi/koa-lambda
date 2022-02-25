

# koa-lambda-middleware


## usage

```javascript
const Koa = require('koa');
const koaBody = require('koa-body');
const koaLambda = require('koa-lambda-middleware');
const app = new Koa();


app.use(koaBody())
    .use(koaLambda({}, app));

app.listen(3333);
```



### file /src/foo.js

```javascript
const { useContext, useNext } = require('koa-lambda-middleware');

module.exports = {

    /*
        POST http://localhost:3333/foo/bar HTTP/1.1
        content-type: application/json
        {
            "args":[
                2,
                3
            ]
        }
    */

    bar(a, b){
        return {
            c : a + b;
        }
    },

    

    /*
        POST http://localhost:3333/foo/baz HTTP/1.1
        content-type: application/json
    */
    async baz(){
        // use hooks
        let ctx = useContext(); //koa ctx
        let next = useNext();   //koa next

        ctx.body = 'baz ok!'

        await next();
    }
}
```