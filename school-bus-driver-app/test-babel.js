const babel = require('@babel/core');
const config = require('./babel.config.js')({ cache: () => {} });

try {
  babel.transformSync('console.log("hello")', config);
  console.log("Parse SUCCESS");
} catch(e) {
  console.error("Parse ERROR:", e.message);
}
