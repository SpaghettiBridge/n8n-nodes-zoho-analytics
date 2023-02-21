import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	OptionsWithUri,
} from 'request';

import {
	IDataObject,
	IExecuteSingleFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	IOAuth2Options,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

import {
	LoadedOrganisationOptions,
	LoadedViewOptions,
	LoadedWorkspaceOptions,
	zohoApiCredentials,
} from './types';
import { listenerCount } from 'process';

//create any functions in here that will be useful within your node

//Generic API Request


//function to load the file and make an api request with that file ( binary data not necessarily JSON)
export async function zohoApiRequest(
	this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: string,
	endpoint: string,
	headers: IDataObject = {},
	body: IDataObject = {},
	qs: IDataObject = {},
	option: IDataObject = {},
	nextPageUrl = '',
	isFormData = false,
	// tslint:disable-next-line:no-any
): Promise<any> {
	const credentials = await this.getCredentials('zohoAnalyticsApiOAuth2Api');
	const options: OptionsWithUri = {
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
		method,
		body,
		qs,
		uri: `${credentials.apiUrl}${endpoint}`,
		json: true,
		//@ts-ignore
		resolveWithFullResponse: false,
	};
	if(nextPageUrl!==''){
		options.uri = nextPageUrl;
	}

	if(isFormData){
		//@ts-ignore
		options.headers['Content-Type'] = 'multipart/form-data';
	}
// console.log(options.qs);

	try {
		if (Object.keys(body).length === 0) {
			delete options.body;
		}

		const oAuth2Options: IOAuth2Options = {
			includeCredentialsOnRefreshOnBody: true,
		};

		//@ts-ignore
		const response = await this.helpers.requestOAuth2.call(this, 'zohoAnalyticsApiOAuth2Api', options, oAuth2Options);
		//@ts-ignore
		return response;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error);
	}
}

export const toWorkspaceOptions = (items: LoadedWorkspaceOptions[]) =>
	items.map(({ workspaceId, workspaceName }) => ({ name:workspaceName, value:workspaceId }));

	export const toviewOptions = (items: LoadedViewOptions[]) =>
	items.map(({ viewId, viewName }) => ({ name:viewName, value:viewId }));

		export const toOrganisationOptions = (items: LoadedOrganisationOptions[]) =>
	items.map(({ orgId, orgName }) => ({ name:orgName, value:orgId }));
