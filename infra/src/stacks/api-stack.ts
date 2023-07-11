import { TerraformStack } from "cdktf"
import { Construct } from "constructs"
import { prefixedId } from "../util/names"
import { AwsProvider } from "@cdktf/provider-aws/lib/provider"
import { ApiGatewayRestApi } from "@cdktf/provider-aws/lib/api-gateway-rest-api"
import { ApiGatewayDeployment } from "@cdktf/provider-aws/lib/api-gateway-deployment"
import { ApiGatewayStage } from "@cdktf/provider-aws/lib/api-gateway-stage"
import { ApiGatewayMethod } from "@cdktf/provider-aws/lib/api-gateway-method"
import { ApiGatewayResource } from "@cdktf/provider-aws/lib/api-gateway-resource"
import { ApiGatewayIntegration } from "@cdktf/provider-aws/lib/api-gateway-integration"
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function"

interface Props {
  chatLambdaFunction: LambdaFunction
}

export class ApiStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id)

    new AwsProvider(this, prefixedId("aws-provider"), {
      region: "eu-west-1"
    })

    const api = new ApiGatewayRestApi(this, prefixedId("api"), {
      name: prefixedId("api")
    })

    this.createHelloWorldEndpoint(api)
    this.createChatEndpoint(api, props.chatLambdaFunction)

    this.createStageDeployment(api)
  }

  private createHelloWorldEndpoint(api: ApiGatewayRestApi) {
    const helloWorldResource = new ApiGatewayResource(this, prefixedId("hello-world-resource"), {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: "hello-world"
    })

    const helloWorldMethod = new ApiGatewayMethod(this, prefixedId("hello-world-method"), {
      restApiId: api.id,
      resourceId: helloWorldResource.id,
      httpMethod: "GET",
      authorization: "NONE"
    })

    new ApiGatewayIntegration(this, prefixedId("hello-world-mock-integration"), {
      restApiId: api.id,
      resourceId: helloWorldResource.id,
      httpMethod: helloWorldMethod.httpMethod,
      type: "MOCK"
    })
  }

  private createChatEndpoint(api: ApiGatewayRestApi, chatLambdaFunction: LambdaFunction) {
    const chatResource = new ApiGatewayResource(this, prefixedId("chat-resource"), {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: "chat"
    })

    const chatMethod = new ApiGatewayMethod(this, prefixedId("chat-method"), {
      restApiId: api.id,
      resourceId: chatResource.id,
      httpMethod: "POST",
      authorization: "NONE"
    })

    new ApiGatewayIntegration(this, prefixedId("chat-integration"), {
      restApiId: api.id,
      resourceId: chatResource.id,
      httpMethod: chatMethod.httpMethod,
      type: "AWS_PROXY",
      integrationHttpMethod: "POST",
      uri: chatLambdaFunction.invokeArn
    })
  }

  private createStageDeployment(api: ApiGatewayRestApi) {
    const deployment = new ApiGatewayDeployment(this, prefixedId("api-deployment"), {
      restApiId: api.id,
      triggers: {
        redeploymentTrigger: Date.now().toString() // triggers stage redeployment on every stack deployment
      },
      lifecycle: {
        createBeforeDestroy: true // delete active stages pointing to this deployment before attempting a redeployment
      }
    })

    new ApiGatewayStage(this, prefixedId("api-stage"), {
      restApiId: api.id,
      deploymentId: deployment.id,
      stageName: "latest"
    })
  }
}
