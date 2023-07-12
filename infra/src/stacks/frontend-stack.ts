import { Fn, TerraformStack } from "cdktf"
import { Construct } from "constructs"
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket"
import { prefixedId } from "../util/names"
import { S3BucketObject } from "@cdktf/provider-aws/lib/s3-bucket-object"
import * as path from "path"
import { AwsProvider } from "@cdktf/provider-aws/lib/provider"

export class FrontendStack extends TerraformStack {
  readonly frontendBucket: S3Bucket

  constructor(scope: Construct, id: string) {
    super(scope, id)

    new AwsProvider(this, prefixedId("aws-provider"), {
      region: "eu-west-1"
    })

    this.frontendBucket = new S3Bucket(this, prefixedId("frontend-bucket"), {
      bucket: prefixedId("static-website-hosting")
    })

    const resolvedPath = path.resolve("../frontend/index.html")

    new S3BucketObject(this, prefixedId("index-deployment"), {
      dependsOn: [this.frontendBucket],
      key: "index.html",
      bucket: this.frontendBucket.bucket,
      source: resolvedPath,
      contentType: "text/html",
      sourceHash: Fn.filebase64sha256(resolvedPath)
    })
  }
}
