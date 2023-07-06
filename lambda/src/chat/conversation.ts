import {Context} from "aws-lambda";

export const handler = async (event: any, context: Context) => {
  console.log("event", event)
  console.log("context", context)

  return "Hello World"
}