import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { 
    DEFAULT_RANDOM_STRING_CHARS,
    DEFAULT_RANDOM_STRING_LENGTH,
    RandomSecureString
} from '../src/RandomSecureString';

describe('RandomSecureString', () => {

    test('props', () => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'TestStack');

        new RandomSecureString(stack, 'TestRandomSecureString1', {
            Name: '/test/randomSecureString1',
            chars: 'abc123!'
        });

        new RandomSecureString(stack, 'TestRandomSecureString2', {
            Name: '/test/randomSecureString2',
            length: 12
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('Custom::RandomSecureString', {
            Name: '/test/randomSecureString1',
            chars: 'abc123!',
            length: DEFAULT_RANDOM_STRING_LENGTH
        });

        template.hasResourceProperties('Custom::RandomSecureString', {
            Name: '/test/randomSecureString2',
            chars: DEFAULT_RANDOM_STRING_CHARS,
            length: 12
        });

        // console.log(template.findResources('Custom::RandomSecureString'));
        // console.log(template.findResources('AWS::Lambda::Function'));
    });
});