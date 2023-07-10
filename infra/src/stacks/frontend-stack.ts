import {TerraformStack} from "cdktf";
import {Construct} from "constructs";
import {S3Bucket} from "@cdktf/provider-aws/lib/s3-bucket";
import {prefixedId} from "../util/names";
import {S3BucketObject} from "@cdktf/provider-aws/lib/s3-bucket-object";
import * as path from "path";
import {AwsProvider} from "@cdktf/provider-aws/lib/provider";
import {
    s3BucketAcl,
    s3BucketOwnershipControls,
    s3BucketPublicAccessBlock,
    s3BucketWebsiteConfiguration
} from "@cdktf/provider-aws";

export class FrontendStack extends TerraformStack {
    constructor(scope: Construct, id: string ) {
        super(scope, id);

        new AwsProvider(this, prefixedId("aws-provider"), {
            region: "eu-west-1"
        })

        const frontendBucket = new S3Bucket(this, prefixedId('frontendBucket'), {
            bucket: prefixedId('static-website-hosting'),
            policy: `{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": [
          "s3:GetObject"
        ],
        "Resource": [
          "arn:aws:s3:::${prefixedId('static-website-hosting')}/*"
        ]
      }
    ]
  }`
        })

        new s3BucketWebsiteConfiguration.S3BucketWebsiteConfiguration(this, prefixedId('websiteConfig'), {
            bucket: frontendBucket.bucket,
            indexDocument: {
                suffix: 'index.html'
            },
            errorDocument: {
                key: 'index.html'
            }
        })

        const s3BucketOwnershipControl = new s3BucketOwnershipControls.S3BucketOwnershipControls(this, prefixedId('ownershipControls'), {
            bucket: frontendBucket.bucket,
            rule: {
                objectOwnership: 'BucketOwnerPreferred'
            }
        })

        const bucketPublicAccessBlock = new s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, prefixedId('bucketPublicAccessBlock'), {
            bucket: frontendBucket.bucket,
            blockPublicAcls: false,
            blockPublicPolicy: false,
            ignorePublicAcls: false,
            restrictPublicBuckets: false
        })

        new s3BucketAcl.S3BucketAcl(this, prefixedId('bucketACL'), {
            bucket: frontendBucket.bucket,
            acl: 'public-read',
            dependsOn: [s3BucketOwnershipControl, bucketPublicAccessBlock]
        })

        const filePath = '../frontend/index.html'

        new S3BucketObject(this, prefixedId('indexDeployment'), {
            dependsOn: [frontendBucket],
            key: 'index.html',
            bucket: frontendBucket.bucket,
            source: path.resolve(filePath),
            contentType: 'text/html'
        })
    }
}