# aws-cdk-ssm-random-securestring

Construct for creating a random SSM Parameter Store SecureString.  The value does not show up in the generated CloudFormation template.

Example usage:
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RandomSecureString } from `aws-cdk-ssm-random-securestring`;

class MyStack1 extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id);

        // creates a length 32 value that should work as an RDS password
        const rss1 = new RandomSecureString(stack, 'TestRandomSecureString1', {
            Name: '/test/randomSecureString1'
        });

        // creates a length 10 value from the specified characters
        const rss2 = new RandomSecureString(stack, 'TestRandomSecureString2', {
            Name: '/test/randomSecureString2',
            chars: 'abc123!',
            length: 10
        });

        // the generated string is exposed as a resource attribute:
        new cd.aws_rds.DatabaseInstance(this, 'mydb1', {
            credentials: {
                username: 'dbguy',
                password: cdk.SecretValue.resourceAttribute(rss1.value);
            }
        });
    }
}

class MyStack2 extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id);

        // Other stacks could also use the value anywhere a SecretValue is required:
        new cd.aws_rds.DatabaseInstance(this, 'mydb2', {
            credentials: {
                username: 'dbguy',
                password: cdk.SecretValue.ssmSecure('/test/randomSecureString2');
            }
        });
    }
}
```