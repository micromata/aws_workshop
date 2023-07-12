import { App } from "cdktf"

import { prefixedId } from "./src/util/names"
import { FrontendStack } from "./src/stacks/frontend-stack"

const app = new App()
new FrontendStack(app, prefixedId("frontend-stack"))

app.synth()
