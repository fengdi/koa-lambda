let {middlewareify, compose} = require('../index');


module.exports = {

    async foo(a, b){
        console.log(a, b)
        return `foo fn: ${a} ${b}.`
    },

    bar: middlewareify((ctx, next)=>{
        console.log(ctx, next);

        ctx.body = 'AAA';
    })
}


module.exports.foo.method = 'get';
module.exports.bar.method = 'get';