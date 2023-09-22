import { ITerraformDependable, TerraformStack } from "cdktf"
import { Construct } from "constructs"
import { AwsProvider } from "@cdktf/provider-aws/lib/provider"
import { ApiGatewayRestApi } from "@cdktf/provider-aws/lib/api-gateway-rest-api"
import { ApiGatewayDeployment } from "@cdktf/provider-aws/lib/api-gateway-deployment"
import { ApiGatewayStage } from "@cdktf/provider-aws/lib/api-gateway-stage"
import { ApiGatewayMethod } from "@cdktf/provider-aws/lib/api-gateway-method"
import { ApiGatewayResource } from "@cdktf/provider-aws/lib/api-gateway-resource"
import { ApiGatewayIntegration } from "@cdktf/provider-aws/lib/api-gateway-integration"
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function"
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket"

import { prefixedId } from "../util/names"

interface Props {
  chatLambdaFunction: LambdaFunction
  frontendBucket: S3Bucket
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

    const helloWorld = this.createHelloWorldEndpoint(api)
    const chatIntegration = this.createChatEndpoint(api, props.chatLambdaFunction)

    this.createStageDeployment(api, helloWorld, chatIntegration)
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

    return new ApiGatewayIntegration(this, prefixedId("hello-world-mock-integration"), {
      restApiId: api.id,
      resourceId: helloWorldResource.id,
      httpMethod: helloWorldMethod.httpMethod,
      type: "MOCK"
    })
  }

  private createChatEndpoint(api: ApiGatewayRestApi, chatLambdaFunction: LambdaFunction) {
    // TODO: create /chat path with a POST method that invokes the chatLambdaFunction
  }

  private createStageDeployment(api: ApiGatewayRestApi, ...dependencies: ITerraformDependable[]) {
    const deployment = new ApiGatewayDeployment(this, prefixedId("api-deployment"), {
      restApiId: api.id,
      dependsOn: [...dependencies],
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
