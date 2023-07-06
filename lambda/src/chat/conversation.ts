import { Context } from "aws-lambda"
import { Configuration, OpenAIApi } from "openai"

export const handler = async (event: any, context: Context) => {
  console.log("event", event)
  console.log("context", context)

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
  })
  const openai = new OpenAIApi(configuration)

  const chatCompletion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "user", content: "You are an AI that answers like Arnold Schwarzenegger would as Terminator." },
      { role: "user", content: "Wie bekomme ich einen Nagel in die Wand?" }
    ]
  })
  return chatCompletion.data.choices[0].message
}
