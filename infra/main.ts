import { App } from "cdktf"

import { FunctionStack } from "./src/stacks/function-stack"
import { prefixedId } from "./src/util/names"
import {FrontendStack} from "./src/stacks/frontend-stack";

const app = new App()
new FunctionStack(app, prefixedId("function-stack"))
new FrontendStack(app, prefixedId('frontend-stack'))
app.synth()
