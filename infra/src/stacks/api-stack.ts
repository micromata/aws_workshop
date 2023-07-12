import { ITerraformDependable, TerraformStack } from "cdktf"
import { Construct } from "constructs"
import { prefixedId } from "../util/names"
import { AwsProvider } from "@cdktf/provider-aws/lib/provider"
import { ApiGatewayRestApi } from "@cdktf/provider-aws/lib/api-gateway-rest-api"
import { ApiGatewayStage } from "@cdktf/provider-aws/lib/api-gateway-stage"
import { ApiGatewayDeployment } from "@cdktf/provider-aws/lib/api-gateway-deployment"

export class ApiStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    new AwsProvider(this, prefixedId("aws-provider"), {
      region: "eu-west-1"
    })

    const api = new ApiGatewayRestApi(this, prefixedId("api"), {
      name: prefixedId("api")
    })

    const helloWorld = this.createHelloWorldEndpoint(api)
    this.createStageDeployment(api, helloWorld)
  }

  private createHelloWorldEndpoint(api: ApiGatewayRestApi) {
    // TODO: Create a resource, a method and a mock integration for the endpoint
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
