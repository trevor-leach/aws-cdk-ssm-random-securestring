import {
    type CdkCustomResourceEvent,
    type Context
} from 'aws-lambda';
import AWS from 'aws-sdk';
import {
    type DeleteParameterRequest,
    type PutParameterRequest
} from 'aws-sdk/clients/ssm';
import { mock, restore, setSDKInstance } from 'jest-aws-sdk-mock';
import {
    DEFAULT_RANDOM_STRING_CHARS,
    DEFAULT_RANDOM_STRING_LENGTH
} from '../src/RandomSecureString';
import { onEvent } from '../src/RandomSecureStringHandler';

setSDKInstance(AWS);

const context: Context = {} as unknown as Context;
const makeEvent = (event: Partial<CdkCustomResourceEvent>): CdkCustomResourceEvent => {
    return Object.assign({}, {
        ResourceType: 'Custom::RandomSecureString',
        RequestId: 'testRequestId',
        StackId: 'testStackId',
        ServiceToken: 'testServicetoken',
        LogicalResourceId: 'testLogicalResourceId',
        ResponseURL: 'testResponseURL',
        RequestType: 'Create',
        ResourceProperties: {},
        OldResourceProperties: {},
        PhysicalResourceId: ''
    }, event);
}

describe('RandomSecureStringHandler', () => {

    const SSM_PARAM_NAME = '/test/paramName1';

    test('Delete', async () => {
        const mocked = mock('SSM', 'deleteParameter', (params: DeleteParameterRequest, callback: Function) => {
            callback(null, {});
        });

        const response = await onEvent(makeEvent({
            RequestType: 'Delete',
            PhysicalResourceId: SSM_PARAM_NAME
        }), context);

        expect(response).toEqual({PhysicalResourceId: SSM_PARAM_NAME});
        expect(mocked.mock).toHaveBeenCalledTimes(1);

        restore('SSM', 'deleteParameter');
    });

    test('Create', async () => {
        const mocked = mock('SSM', 'putParameter', (params: PutParameterRequest, callback: Function) => {
            callback(null, {
                Version: 1,
                Tier: params.Tier || 'Standard'
            });
        });

        const response = await onEvent(makeEvent({
            RequestType: 'Create',
        //@ts-ignore
            ResourceProperties: {
                Name: SSM_PARAM_NAME,
                length: 10,
                chars: 'abcdef'
            }
        }), context);

        expect(mocked.mock).toHaveBeenCalledTimes(1);
        expect(response.PhysicalResourceId).toEqual(SSM_PARAM_NAME);
        expect(response.NoEcho).toBe(true);
        expect(response.Data?.Value).toMatch(/[a-f]{10}/);

        restore('SSM', 'putParameter');
    });

    test('Update', async () => {
        const mocked = mock('SSM', 'putParameter', (params: PutParameterRequest, callback: Function) => {
            callback(null, {
                Version: 1,
                Tier: params.Tier || 'Standard'
            });
        });

        const response = await onEvent(makeEvent({
            RequestType: 'Update',
        //@ts-ignore
            ResourceProperties: {
                Name: SSM_PARAM_NAME,
                length: DEFAULT_RANDOM_STRING_LENGTH,
                chars: DEFAULT_RANDOM_STRING_CHARS
            }
        }), context);

        expect(mocked.mock).toHaveBeenCalledTimes(1);
        expect(response.PhysicalResourceId).toEqual(SSM_PARAM_NAME);
        expect(response.NoEcho).toBe(true);
        expect(response.Data?.Value).toMatch(/[^ @"/]+/);
        expect(response.Data?.Value?.length).toBe(DEFAULT_RANDOM_STRING_LENGTH);

        restore('SSM', 'putParameter');
    });
});