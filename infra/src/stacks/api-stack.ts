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
import { LambdaPermission } from "@cdktf/provider-aws/lib/lambda-permission"
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket"
import { IamRole } from "@cdktf/provider-aws/lib/iam-role"
import { apiGatewayGatewayResponse } from "@cdktf/provider-aws"
import { ApiGatewayMethodResponse } from "@cdktf/provider-aws/lib/api-gateway-method-response"
import { ApiGatewayIntegrationResponse } from "@cdktf/provider-aws/lib/api-gateway-integration-response"

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

    this.createHelloWorldEndpoint(api)
    const chatIntegration = this.createChatEndpoint(api, props.chatLambdaFunction)
    const frontendIntegration = this.createFrontendEndpoint(api, props.frontendBucket)

    this.createStageDeployment(api, chatIntegration, frontendIntegration)
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

    new LambdaPermission(this, prefixedId("chat-lambda-invoke-permission"), {
      action: "lambda:InvokeFunction",
      functionName: chatLambdaFunction.functionName,
      principal: "apigateway.amazonaws.com"
    })

    return new ApiGatewayIntegration(this, prefixedId("chat-integration"), {
      restApiId: api.id,
      resourceId: chatResource.id,
      httpMethod: chatMethod.httpMethod,
      type: "AWS_PROXY",
      integrationHttpMethod: "POST",
      uri: chatLambdaFunction.invokeArn
    })
  }

  private createFrontendEndpoint(api: ApiGatewayRestApi, frontendBucket: S3Bucket) {
    const frontendMethod = new ApiGatewayMethod(this, prefixedId("frontend-method"), {
      restApiId: api.id,
      resourceId: api.rootResourceId,
      httpMethod: "GET",
      authorization: "NONE"
    })

    new apiGatewayGatewayResponse.ApiGatewayGatewayResponse(this, prefixedId("api-gateway-response"), {
      restApiId: api.id,
      statusCode: "200",
      responseTemplates: {
        "text/html": "Empty"
      },
      responseType: "DEFAULT_5XX"
    })

    const frontendRole = new IamRole(this, prefixedId("frontend-role"), {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "apigateway.amazonaws.com"
            },
            Effect: "Allow",
            Sid: ""
          }
        ]
      }),
      inlinePolicy: [
        {
          name: "frontend-apigateway-policy",
          policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Action: ["s3:ListBucket", "s3:GetObject"],
                Effect: "Allow",
                Resource: `arn:aws:s3:::${prefixedId("static-website-hosting/index.html")}`
              }
            ]
          })
        }
      ]
    })

    const integration = new ApiGatewayIntegration(this, prefixedId("frontend-integration"), {
      restApiId: api.id,
      resourceId: api.rootResourceId,
      httpMethod: frontendMethod.httpMethod,
      credentials: frontendRole.arn,
      uri: `arn:aws:apigateway:eu-west-1:s3:path/${frontendBucket.bucket}/index.html`,
      integrationHttpMethod: "GET",
      type: "AWS"
    })

    new ApiGatewayIntegrationResponse(this, prefixedId("integration-response"), {
      restApiId: api.id,
      resourceId: api.rootResourceId,
      statusCode: "200",
      httpMethod: "GET",
      dependsOn: [integration]
    })

    new ApiGatewayMethodResponse(this, prefixedId("method-response"), {
      restApiId: api.id,
      resourceId: api.rootResourceId,
      httpMethod: "GET",
      responseModels: {
        "text/html": "Empty"
      },
      statusCode: "200",
      responseParameters: {
        "method.response.header.Content-Type": true,
        "method.response.header.Access-Control-Allow-Origin": true,
        "method.response.header.Access-Control-Allow-Credentials": true
      },
      dependsOn: [integration]
    })

    return integration
  }

  private createStageDeployment(
    api: ApiGatewayRestApi,
    chatIntegration: ApiGatewayIntegration,
    frontendIntegration: ApiGatewayIntegration
  ) {
    const deployment = new ApiGatewayDeployment(this, prefixedId("api-deployment"), {
      restApiId: api.id,
      dependsOn: [chatIntegration, frontendIntegration],
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
