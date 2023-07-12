import { App } from "cdktf"

import { prefixedId } from "./src/util/names"
import { FrontendStack } from "./src/stacks/frontend-stack"
import { FunctionStack } from "./src/stacks/function-stack"

const app = new App()
new FrontendStack(app, prefixedId("frontend-stack"))
new FunctionStack(app, prefixedId("function-stack"))

app.synth()
