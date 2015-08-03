System.config({
  "baseURL": "/",
  "transpiler": "traceur",
  "paths": {
    "*": "*.js",
    "github:*": "jspm_packages/github/*.js",
    "npm:*": "jspm_packages/npm/*.js"
  }
});

System.config({
  "map": {
    "bootstrap": "github:twbs/bootstrap@3.3.5",
    "components/jquery": "github:components/jquery@2.1.4",
    "d3": "github:mbostock/d3@3.5.6",
    "jquery": "github:components/jquery@2.1.4",
    "lodash-node": "npm:lodash-node@3.10.0",
    "myname": "npm:underscore@1.8.3",
    "traceur": "github:jmcriffey/bower-traceur@0.0.88",
    "traceur-runtime": "github:jmcriffey/bower-traceur-runtime@0.0.88",
    "github:jspm/nodelibs-process@0.1.1": {
      "process": "npm:process@0.10.1"
    },
    "github:twbs/bootstrap@3.3.5": {
      "jquery": "github:components/jquery@2.1.4"
    },
    "npm:lodash-node@3.10.0": {
      "process": "github:jspm/nodelibs-process@0.1.1"
    }
  }
});

