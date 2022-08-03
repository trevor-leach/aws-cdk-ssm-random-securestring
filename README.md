# aws-cdk-ssm-random-securestring

Construct for creating a random SSM Parameter Store SecureString.  The value does not show up in the generated CloudFormation template.

Example usage:
```typescript
import * as cdk from 'aws-cdk-lib';
import { RandomSecureString } from `aws-cdk-ssm-random-securestring`;

class MyConstruct extends Construct {

    constructor(scope, id, props) {
        super(scope, id);

        // creates a length 32 value that should work as an RDS password
        new RandomSecureString(stack, 'TestRandomSecureString1', {
            Name: '/test/randomSecureString1'
        });

        // creates a length 10 value from the specified characters
        new RandomSecureString(stack, 'TestRandomSecureString1', {
            Name: '/test/randomSecureString32',
            chars: 'abc123!',
            length: 10
        });
    }
}
```