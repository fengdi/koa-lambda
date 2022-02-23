


module.exports = {

    async foo(a, b){
        console.log(a, b)
        return `foo fn: ${a} ${b}.`
    }
}


module.exports.foo.method = 'get';