import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ZohoAnalyticsApiOAuth2Api implements ICredentialType {
	name = 'zohoAnalyticsApiOAuth2Api';
	extends = ['oAuth2Api'];
	displayName = 'Zoho Analytics API OAuth2 API';
	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: '={{$self["url"]}}/oauth/v2/auth',
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: '={{$self["url"]}}/oauth/v2/token',
			required: true,
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'ZohoAnalytics.fullaccess.all',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: 'access_type=offline',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
		{
			displayName: 'Country',
			name: 'country',
			type: 'options',
			default: 'eu',
			options: [
					{
							name: 'Australia',
							value: 'com.au',
					},
					{
							name: 'China',
							value: 'com.cn',
					},
					{
							name: 'Europe',
							value: 'eu',
					},
					{
							name: 'India',
							value: 'in',
					},
					{
							name: 'Japan',
							value: 'jp',
					},
					{
							name: 'United States',
							value: 'com',
					},

			],
	},
	{
			displayName: 'URL',
			name: 'url',
			type: 'hidden',
			default: '=https://accounts.zoho.{{$self["country"]}}',
	},
	{
			displayName: 'ApiURL',
			name: 'apiUrl',
			type: 'hidden',
			default: '=https://analyticsapi.zoho.{{$self["country"]}}',
	},
	];

}
