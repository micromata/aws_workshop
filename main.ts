import {Construct} from "constructs";
import {App, AssetType, TerraformOutput, TerraformStack} from "cdktf";
import {AwsProvider} from "@cdktf/provider-aws/lib/provider";
import {LambdaFunction} from "@cdktf/provider-aws/lib/lambda-function";
import {TerraformAsset} from "cdktf/lib";
import {IamRole} from "@cdktf/provider-aws/lib/iam-role";


class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "AWS", {
      region: "eu-west-1",
    });

    const lambdaAsset = new TerraformAsset(this, 'lambdaCode', {
      path: "lambdas/",
      type: AssetType.ARCHIVE
    })

    const executionRole = new IamRole(this, 'lambdaRole', {
      name: "lambdaBasicRole",
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
      }),
    })

    const lambda = new LambdaFunction(this, 'test', {
      functionName: "skaessinger-cdktf-lambda",
      handler: "hello_world.handler",
      runtime: 'python3.9',
      filename: lambdaAsset.path,
      role: executionRole.arn
    });

    new TerraformOutput(this, 'lambdaARN', {
      value: lambda.arn
    })
  }
}

const app = new App();
new MyStack(app, "aws_workshop");
app.synth();
