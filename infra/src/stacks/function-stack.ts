import { AssetType, Fn, TerraformAsset, TerraformStack } from "cdktf"
import { Construct } from "constructs"
import { AwsProvider } from "@cdktf/provider-aws/lib/provider"
import { IamRole } from "@cdktf/provider-aws/lib/iam-role"
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function"

import { prefixedId } from "../util/names"
import { LambdaLayerVersion } from "@cdktf/provider-aws/lib/lambda-layer-version"

export class FunctionStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    new AwsProvider(this, prefixedId("aws-provider"), {
      region: "eu-west-1"
    })

    const dependencyLayerAsset = new TerraformAsset(this, prefixedId("test-lambda-layer-asset"), {
      path: "../lambda/dependency-layer/",
      type: AssetType.ARCHIVE
    })
    const dependencyLayer = new LambdaLayerVersion(this, prefixedId("test-lambda-layer"), {
      layerName: prefixedId("test-lambda-layer"),
      filename: dependencyLayerAsset.path,
      sourceCodeHash: Fn.filebase64sha256(dependencyLayerAsset.path)
    })

    const lambdaAsset = new TerraformAsset(this, prefixedId("test-lambda-code"), {
      path: "../lambda/dist/",
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
      handler: "conversation.handler",
      runtime: "nodejs18.x",
      filename: lambdaAsset.path,
      layers: [dependencyLayer.arn],
      role: executionRole.arn,
      timeout: 15,
      environment: {
        variables: {
          OPENAI_API_KEY: "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"
        }
      }
    })
  }
}
