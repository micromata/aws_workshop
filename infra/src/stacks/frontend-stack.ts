import { TerraformStack } from "cdktf"
import { Construct } from "constructs"
import { prefixedId } from "../util/names"
import { AwsProvider } from "@cdktf/provider-aws/lib/provider"

export class FrontendStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    new AwsProvider(this, prefixedId("aws-provider"), {
      region: "eu-west-1"
    })
  }
}
