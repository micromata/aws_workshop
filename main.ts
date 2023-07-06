import {App} from "cdktf";
import {FunctionStack} from "./src/stacks/function-stack";
import {prefixedId} from "./src/util/names";

const app = new App();
new FunctionStack(app, prefixedId("function-stack"));
app.synth();
