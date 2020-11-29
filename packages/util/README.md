# `@node-pigpio/util`

> TODO: description

## Usage

```
var { usingAsync } = require("@node-pigpio/util")


class Closable {
   use() {
   console.log('use')
   }
   close() {
   console.log('closed')
   }
}

await usingAsync(new Closable, (c)=>{
   c.use()
})

// output:
// use
// closed
```
