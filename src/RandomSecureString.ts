import path from 'path';
import {
    aws_iam as iam,
    aws_lambda as lambda,
    aws_logs as logs,
    custom_resources as cr,
    CustomResource,
    Duration,
    Stack,
    RemovalPolicy
} from 'aws-cdk-lib';
import { SSM } from 'aws-sdk';
import { Construct } from 'constructs';

export const DEFAULT_RANDOM_STRING_LENGTH = 32;
/** 
 * Set characters that work for RDS passwords.
 * @see [RDS naming constraints](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Limits.html#RDS_Limits.Constraints)
 * */
export const DEFAULT_RANDOM_STRING_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!-#$%^&*-_=+(){}[]<>;:\\.,|\'';

export type RandomStringProps = {
    /** The length of the random string to generate. Defaults to {@link DEFAULT_RANDOM_STRING_LENGTH}. */
    length?: number,
    /** 
     * The set of characters from which to generate the random string.
     * Defaults to {@link DEFAULT_RANDOM_STRING_CHARS}.
    */
    chars?: string
};

export type UnvaluedPutParameterRequest = Omit<SSM.Types.PutParameterRequest, 'Value' | 'Type'>;
export type RandomSecureStringProps = UnvaluedPutParameterRequest & RandomStringProps;

export class RandomSecureString extends Construct {

    private static getProvider(
        scope: Construct,
        onEventHandler: lambda.SingletonFunction
    ): cr.Provider {

        const stack = Stack.of(scope);
        const id = 'aws-cdk-ssm-random-securestring-provider';

        return <cr.Provider> stack.node.tryFindChild(id) ??
            new cr.Provider(stack, id, { onEventHandler });
    };

    private readonly customResource: CustomResource;

    /**
     * The generated value that was stored in the SSM Parameter Store.
     *
     * @returns — a token for Fn::GetAtt encoded as a string.
     **/
    public get value() {
        return this.customResource.getAttString('Value');
    }

    public constructor(scope: Construct, id: string, props: RandomSecureStringProps) {
        super(scope, id);

        props.length ??= DEFAULT_RANDOM_STRING_LENGTH;
        props.chars  ||= DEFAULT_RANDOM_STRING_CHARS;

        const onEventHandler = new lambda.SingletonFunction(this, `${id}-handler`, {
            uuid: '84d03fee-4028-4fdd-aa73-af04171f6474',
            lambdaPurpose: 'RandomSecureStringHandler',
            code: lambda.Code.fromAsset(__dirname),
            handler: 'RandomSecureStringHandler.onEvent',
            timeout: Duration.seconds(300),
            runtime: lambda.Runtime.NODEJS_14_X,
            initialPolicy: [
                new iam.PolicyStatement({
                    actions: ['ssm:*'],
                    resources: [
                        `arn:aws:ssm:${Stack.of(scope).region}:${Stack.of(scope).account}:parameter/*`,
                    ],
                }),
            ],
            logRetention: logs.RetentionDays.ONE_MONTH
        });

        this.customResource = new CustomResource(this, `${id}-cr`, {
            serviceToken: RandomSecureString.getProvider(this, onEventHandler).serviceToken,
            resourceType: 'Custom::RandomSecureString',
            removalPolicy: RemovalPolicy.DESTROY,
            properties: props
        });
    }
}
