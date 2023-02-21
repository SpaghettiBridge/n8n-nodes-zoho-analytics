//setting the variable types for the credentials
export type zohoApiCredentials = {
    domain: string;
    oauthToken: string;
		email:string;

}
export type LoadedWorkspaceOptions = {
	workspaceId:string,
	workspaceName:string
}
export type LoadedViewOptions = {
	viewId:string,
	viewName:string
}
export type LoadedOrganisationOptions = {
	orgId:string,
	orgName:string
}
export type  availableColumn = {
	columnName:string,
	columnValue:string,
	columnType:string
}
