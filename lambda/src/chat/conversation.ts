import { Context } from "aws-lambda"
import { Configuration, OpenAIApi } from "openai"
import { SecretsManager } from "@aws-sdk/client-secrets-manager"

export const handler = async (event: any, context: Context) => {
  console.log("event", event)
  console.log("context", context)

  const secretsManager = new SecretsManager({ region: process.env.REGION })
  const openAiApiKey = await secretsManager.getSecretValue({
    SecretId: process.env.OPENAI_API_KEY_SECRET_ARN
  })

  const configuration = new Configuration({
    apiKey: openAiApiKey.SecretString
  })
  const openai = new OpenAIApi(configuration)

  const chatCompletion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "Answer each question like the Terminator would. You answer in brisk and powerful words, you are extremely sarcastic, and include one catchphrase of the Terminator in each response."
      },
      { role: "user", content: "Wie bekomme ich einen Nagel in die Wand?" }
    ]
  })
  return chatCompletion.data.choices[0].message
}
