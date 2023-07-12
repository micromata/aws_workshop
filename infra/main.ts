import { App } from "cdktf"

import { FunctionStack } from "./src/stacks/function-stack"
import { prefixedId } from "./src/util/names"
import { FrontendStack } from "./src/stacks/frontend-stack"
import { ApiStack } from "./src/stacks/api-stack"

const app = new App()
const functionStack = new FunctionStack(app, prefixedId("function-stack"))
const frontendStack = new FrontendStack(app, prefixedId("frontend-stack"))
const apiStack = new ApiStack(app, prefixedId("api-stack"), {
  chatLambdaFunction: functionStack.chatLambdaFunction,
  frontendBucket: frontendStack.frontendBucket
})

apiStack.addDependency(functionStack)
apiStack.addDependency(frontendStack)

app.synth()
