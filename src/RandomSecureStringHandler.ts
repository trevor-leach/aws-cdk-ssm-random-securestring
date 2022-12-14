import crypto from 'crypto';
import AWS from 'aws-sdk';
import { type AsyncHandler } from 'aws-lambda-consumer';
import { 
    type CdkCustomResourceEvent,
    type CdkCustomResourceHandler,
    type CdkCustomResourceResponse
} from 'aws-lambda';
import {
    type UnvaluedPutParameterRequest,
    type RandomStringProps,
} from './RandomSecureString'

type RandomSecureStringHandlerEventResourceProps =
    UnvaluedPutParameterRequest & Required<RandomStringProps> & {
        ServiceToken: string;
        Type?: 'SecureString';
    }

let ssm: AWS.SSM;

/**
 * This is the`onEvent` handler part of the CustomResource implementation of
 * the `RandomSecureString` Construct.
 * 
 * @see [CDK docs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.custom_resources-readme.html#handling-lifecycle-events-onevent)
 *      for descriptions of event and return type.
 * 
 * @param event CdkCustomResourceEvent, with a `ResourceProperties` containing
 *      the AWS SDK PutParameterRequest and string generation configuration.
 * 
 * @returns CdkCustomResourceResponse.  The `Data.Value` property will contain
 *      the generated string, making it available as a resource attribute.
 */
export const onEvent: AsyncHandler<CdkCustomResourceHandler> = async (
    event: CdkCustomResourceEvent
): Promise<CdkCustomResourceResponse> => {

    console.log(event)
    ssm ??= new AWS.SSM();

    if (event.RequestType === 'Delete') {

        await ssm.deleteParameter({
            Name: event.PhysicalResourceId
        }).promise();

        console.log(`deleted SSM parameter '${event.PhysicalResourceId}'`);

        return {
            PhysicalResourceId: event.PhysicalResourceId
        };
    }

    // Create or Update
    const { length, chars, ServiceToken:_, ...ppProps } =
        event.ResourceProperties as RandomSecureStringHandlerEventResourceProps;
    ppProps.Type = 'SecureString';

    const Value = Array.from(crypto.randomFillSync(new Uint32Array(length)))
        .map((x) => chars[x % chars.length])
        .join('');

    await ssm.putParameter({ Value, ...ppProps }).promise();

    console.log(`wrote SSM parameter '${ppProps.Name}' with new random value`);

    return {
        PhysicalResourceId: ppProps.Name,
        NoEcho: true,
        Data: { Value }
    };
}
