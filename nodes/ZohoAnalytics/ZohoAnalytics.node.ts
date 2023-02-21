import { json } from 'express';
import { IExecuteFunctions } from 'n8n-core';
import {
	IBinaryData,
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonValue,
	NodeOperationError,
} from 'n8n-workflow';

import { toOrganisationOptions, toviewOptions, toWorkspaceOptions, zohoApiRequest } from './GenericFunctions';
import { availableColumn } from './types';

export class ZohoAnalytics implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zoho Analytics',
		name: 'zohoAnalytics',
		icon: 'file:AnalyticsLogo.svg',
		group: ['transform'],
		version: 1,
		description: 'Consume the Zoho Analytics API',
		defaults: {
			name: 'Zoho Analytics',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'zohoAnalyticsApiOAuth2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Add Row',
						value: 'addRow',
						description: 'Add new row to table',
						action: 'Add new row to table',
					},
					{
						name: 'Delete Data',
						value: 'deleteData',
						description: 'Delete data in table',
						action: 'Delete data in table',
					},
					{
						name: 'Export Data',
						value: 'exportData',
						description: 'Take data out of a table',
						action: 'Take data out of a table',
					},
					{
						name: 'Import Data',
						value: 'importData',
						description: 'Add new data to existing table',
						action: 'Add new data to existing table',
					},
					{
						name: 'Import New Table',
						value: 'importNewTable',
						description: 'Add new table',
						action: 'Add new table',
					},
					{
						name: 'Update Data',
						value: 'updateData',
						description: 'Update data in a table',
						action: 'Update data in a table',
					},
				],
				default: 'addRow',
			},

			{
				displayName: 'Organisation Name or ID',
				name: 'organisation',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getOrganisations',
				},
				default: '',
				description: 'Organisations to get data from. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
			},

			{
				displayName: 'Workspace Name or ID',
				name: 'workspace',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getWorkspaces',
				},
				default: '',
				description: 'Workspace to get data from. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
			},

			{
				displayName: 'Views Name or ID',
				name: 'view',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getViews',
					loadOptionsDependsOn:['workspace','organisation'],
				},
				default: '',
				description: 'Views to get data from. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
			},



			{
				displayName: 'Modify All Rows',
				name: 'modifyAllRows',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['updateData', 'deleteData'],
					},
				},
				default: false,
				description:
					'Whether or not to modify all rows in table',
			},

			{
				displayName: 'Criteria',
				name: 'criteria',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['deleteData', 'updateData','exportData'],
					},
				},
				default: '',
				description:
					`Criteria for modifying select rows eg:(( "Region"='East' and "Sales"<1000) or ("Sales"."Region"='West' and "Sales"<2000))`,
			},

			{
				displayName: 'Column Data',
				name: 'data',
				placeholder: 'Add field data',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				default: {},
				displayOptions: {
					show: {
						operation: [
							'addRow', 'updateData',
						],
					},
				},
				options: [
					{
						name: 'columns',
						displayName: 'Columns',
						values: [
							{
								displayName: 'Column Name or ID',
								name: 'columnName',
								type: 'options',
								default: '',
								description: 'Column name to include in item. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
								typeOptions: {
									loadOptionsMethod: 'getColumns',
								},
							},
							{
								displayName: 'Data Type',
								name: 'dataType',
								type: 'options',
								default: 'string',
								description: 'Type of data in column',
								options: [
									{
										name: 'String',
										value: 'string',
									},
								],
							},
							{
								displayName: 'Column Value',
								name: 'columnValue',
								type: 'string',
								default: '',
								description: 'Value for the Column',
							},

						],
					},
				],
			},

			{
				displayName: 'Import Type',
				name: 'importType',
				displayOptions: {
					show: {
						operation: ['importData'],
					},
				},
				type: 'options',
				default: 'append',
				description: 'Type of import to perform',
				options: [
					{
						name: 'Append',
						value: 'append',
					},
					{
						name: 'Truncate Add',
						value: 'truncateadd ',
					},
					{
						name: 'Update Add',
						value: 'updateadd',
					},
				],
			},
				{
				displayName: 'Table Name',
				name: 'tableName',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['importNewTable'],

					},
				},
				default: '',
				description:
					`Name Of the New Table you wish to create`,
			},
			{
				displayName: 'JSON Data',
				name: 'jsonData',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['importData','importNewTable'],

					},
				},
				default: '',
				description:
					`JSON data to import into Table`,
			},
		],
	};

methods = {
		loadOptions: {
			async getOrganisations (this: ILoadOptionsFunctions) {
				const data = await zohoApiRequest.call(this,'GET', `/restapi/v2/orgs`);
				// console.log(data.data.ownedWorkspaces);
				return toOrganisationOptions(data.data.orgs);
			},
			async getWorkspaces(this: ILoadOptionsFunctions) {
				const data = await zohoApiRequest.call(this,'GET', `/restapi/v2/workspaces`);
				// console.log(data.data.ownedWorkspaces);
				return toWorkspaceOptions(data.data.ownedWorkspaces.concat(data.data.sharedWorkspaces));
			},
		async getViews (this: ILoadOptionsFunctions) {
			const organisationID = this.getNodeParameter('organisation', '') as string;
			const headers={'ZANALYTICS-ORGID':organisationID};
			const workspaceID = this.getNodeParameter('workspace', '') as string;
				const data = await zohoApiRequest.call(this,'GET', `/restapi/v2/workspaces/${workspaceID}/views`,headers);
				// console.log(data.data.ownedWorkspaces);
				return toviewOptions(data.data.views.filter((x: { viewType: string; })=> x.viewType ==="Table"));
			},
				async getColumns (this: ILoadOptionsFunctions) {
			// const OrganisationID = this.getNodeParameter('organisation', '') as string;
			// const headers={'ZANALYTICS-ORGID':OrganisationID};
			const qs = {CONFIG :JSON.stringify({"withInvolvedMetaInfo": true})};
			const viewID = this.getNodeParameter('view', '') as string;
				const data = await zohoApiRequest.call(this,'GET', `/restapi/v2/views/${viewID}`,{},{},qs);
				return data.data.views.columns.map((x: { columnName: string; })=>({name: x.columnName,value:x.columnName})) || [];
			},
		},
	};


	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnItems: INodeExecutionData[] = [];
		let item: INodeExecutionData;
		const operation = this.getNodeParameter('operation', 0, '') as string;
		const orgID = this.getNodeParameter('organisation', 0, '') as string;
		const workspaceID = this.getNodeParameter('workspace', 0, '') as string;
		const viewID = this.getNodeParameter('view', 0, '') as string;
		// let tableName = await zohoApiRequest.call(this,'GET', `/restapi/v2/workspaces/${workspaceID}/views/${viewID}`, {},{},{CONFIG :JSON.stringify({"withInvolvedMetaInfo": false})});
		// tableName= tableName.data.views.viewName;
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {

				item = items[itemIndex];
				if (operation === 'addRow') {
					const endpoint = `/restapi/v2/workspaces/${workspaceID}/views/${viewID}/rows`;
					const headers={'ZANALYTICS-ORGID':orgID};
					const columnData = this.getNodeParameter('data.columns', itemIndex, []) as availableColumn[];
					const columns:IDataObject = {};
					for (let i = 0; i < columnData.length; i++) {
						const element = columnData[i];
						columns[element['columnName']] = element.columnValue;
					}
					const qs = {CONFIG :JSON.stringify({"columns": columns})};
					const data = await zohoApiRequest.call(this,'POST', endpoint, headers,{},qs);
					returnItems.push(...this.helpers.returnJsonArray(data.data));
				}

				if (operation === 'deleteData') {
					const endpoint = `/restapi/v2/workspaces/${workspaceID}/views/${viewID}/rows`;
					const headers={'ZANALYTICS-ORGID':orgID};
					const criteria = this.getNodeParameter('criteria', itemIndex, "") as string;
					const modifyAll = this.getNodeParameter('modifyAllRows', itemIndex, false ) as boolean;
					let qs = {};

					if(!modifyAll){
						qs = {CONFIG :JSON.stringify({"criteria": criteria})};
					}else{
						qs = {CONFIG :JSON.stringify({"deleteAllRows": true})};
					}

					const data = await zohoApiRequest.call(this,'DELETE', endpoint, headers,{},qs);
					returnItems.push(...this.helpers.returnJsonArray(data.data));
				}

				if (operation === 'updateData') {
					const endpoint = `/restapi/v2/workspaces/${workspaceID}/views/${viewID}/rows`;
					const headers={'ZANALYTICS-ORGID':orgID};
					const criteria = this.getNodeParameter('criteria', itemIndex, "") as string;
					const modifyAll = this.getNodeParameter('modifyAllRows', itemIndex, false ) as boolean;
					const columnData = this.getNodeParameter('data.columns', itemIndex, []) as availableColumn[];
					const columns:IDataObject = {};
					for (let i = 0; i < columnData.length; i++) {
						const element = columnData[i];
						columns[element['columnName']] = element.columnValue;
					}
					let qs = {};
					if(!modifyAll){
						qs = {CONFIG :JSON.stringify({"columns": columns,"criteria": criteria})};
					}else{
						qs = {CONFIG :JSON.stringify({"columns": columns,"updateAllRows": true})};
					}

					const data = await zohoApiRequest.call(this,'PUT', endpoint, headers,{},qs);
					returnItems.push(...this.helpers.returnJsonArray(data.data));
				}


				if (operation === 'exportData') {
					const endpoint = `/restapi/v2/workspaces/${workspaceID}/views/${viewID}/data`;
					const headers={'ZANALYTICS-ORGID':orgID};
					const criteria = this.getNodeParameter('criteria', itemIndex, "") as string;
					const qs = {CONFIG :JSON.stringify({"responseFormat": "json", "criteria": criteria})};
					const data = await zohoApiRequest.call(this,'GET', endpoint, headers,{},qs);
					returnItems.push(...this.helpers.returnJsonArray(data.data));
				}


				if (operation === 'importData') {
					const endpoint = `/restapi/v2/workspaces/${workspaceID}/views/${viewID}/data`;
					const headers={'ZANALYTICS-ORGID':orgID};
					const importType = this.getNodeParameter('importType', itemIndex, "") as string;
					const jsonData = this.getNodeParameter('jsonData', itemIndex, "") as string;
					const body = {"DATA": jsonData};
					const qs = {CONFIG :JSON.stringify({"importType": importType,"fileType": "json","autoIdentify": false, "retainColumnNames":true})};
					// console.log(qs);
					// console.log(body);
					const data = await zohoApiRequest.call(this,'POST',endpoint, headers,body,qs,{},"",true);
					returnItems.push(...this.helpers.returnJsonArray(data.data));
				}
				if (operation === 'importNewTable') {
					const endpoint = `/restapi/v2/workspaces/${workspaceID}/data`;
					const headers={'ZANALYTICS-ORGID':orgID};
					const jsonData = this.getNodeParameter('jsonData', itemIndex, "") as string;
					const tableName = this.getNodeParameter('tableName', itemIndex, "") as string;
					const body = {"DATA": jsonData};
					const qs = {CONFIG :JSON.stringify({"tableName": tableName,"fileType": "json","autoIdentify": false, "retainColumnNames":true})};
					// console.log(qs);
					// console.log(body);
					const data = await zohoApiRequest.call(this,'POST',endpoint, headers,body,qs,{},"",true);
					returnItems.push(...this.helpers.returnJsonArray(data.data));
				}



			} catch (error) {
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return this.prepareOutputData(returnItems);
	}
}


