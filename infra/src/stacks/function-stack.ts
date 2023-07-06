import { AssetType, TerraformAsset, TerraformStack } from "cdktf"
import { Construct } from "constructs"
import { AwsProvider } from "@cdktf/provider-aws/lib/provider"
import { IamRole } from "@cdktf/provider-aws/lib/iam-role"
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function"

import { prefixedId } from "../util/names"

export class FunctionStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    new AwsProvider(this, prefixedId("aws-provider"), {
      region: "eu-west-1"
    })

    const lambdaAsset = new TerraformAsset(this, prefixedId("test-lambda-code"), {
      path: "../lambda/",
      type: AssetType.ARCHIVE
    })

    const executionRole = new IamRole(this, prefixedId("test-lambda-role"), {
      name: prefixedId("test-lambda-role"),
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "lambda.amazonaws.com"
            },
            Effect: "Allow",
            Sid: ""
          }
        ]
      })
    })

    new LambdaFunction(this, prefixedId("test-function"), {
      functionName: prefixedId("test-function"),
      handler: "hello_world.handler",
      runtime: "python3.9",
      filename: lambdaAsset.path,
      role: executionRole.arn
    })
  }
}
