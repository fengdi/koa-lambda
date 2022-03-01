let {middleware, lambda, useNext, useContext} = require('../index');


module.exports = {

    hello(){
        return 'hello world'
    },
    foo2: middleware(lambda(async(a, b)=>{
        return {sum: a + b}
    })),
    a:{
        b:{
          c(a, b){
             return a + b
          }
        }
    },

    async foo(a, b){
        console.log(a, b)
        return `foo fn: ${a} ${b}.`
    },

    bar: middleware(
        
        async (ctx, next)=>{
            console.log('a');

            ctx.body = 'AAA';
            await next();
        }, 
        async (ctx, next)=>{
            console.log('b')
            await next();
        },
        lambda(async (a, b)=>{
            const next = useNext();
            const ctx = useContext();

            await next();
            ctx.body = 'CCC';
            console.log('c', a, b)

            return 'DDDD'
        }),
        async (ctx, next)=>{
            console.log('d', next)
            ctx.body = 'A';
            // await next();
        }
        
    )
}


// module.exports.foo.method = 'get';
// module.exports.bar.method = 'get';