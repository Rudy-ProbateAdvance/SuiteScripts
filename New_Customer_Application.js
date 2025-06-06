function New_Customer_Application(request,response)
{
	if(request.getMethod()=="GET")
	{
		try
		{
			var form = nlapiCreateForm("New Customer Application");
			
			form.setScript("customscript_new_cust_app_cs");
			
			var fld;
			var fldGroup;
			
			form.addFieldGroup("customer","Customer Information");
			form.addFieldGroup("estate","Estate Information");
			form.addFieldGroup("diligence","Diligence Information");
			
			form.addTab("financials","Estate Financials");
			
			//Field Groups under Customer Quotes subtab
			form.addTab("quotes","Customer Quotes");
			fldGroup = form.addFieldGroup("sizing","Sizing","quotes");
			fldGroup.setSingleColumn(true);
			
			fldGroup = form.addFieldGroup("pricing","Pricing","quotes");
			fldGroup.setSingleColumn(true);
			
			fldGroup = form.addFieldGroup("case_status","Update Case Status","quotes");
			fldGroup.setSingleColumn(true);
			
			fldGroup = form.addFieldGroup("temp","Temporary for Validation","quotes");
			fldGroup.setSingleColumn(true);
			
			fldGroup = form.addFieldGroup("getquote","Get Quote","quotes");
			fldGroup.setSingleColumn(true);
			
			//Additional subtabs
			form.addTab("communication","Communication");
			form.addSubTab("phonecalls","Phone Calls","communication");
			form.addSubTab("tasks","Tasks","communication");
			form.addSubTab("events","Events","communication");
			form.addSubTab("usernotes","User Notes","communication");
			
			
			form.addTab("relationships","Relationships");
			form.addTab("jurisdiction","Jurisdiction");
			//form.addTab("documents","Documents");
			form.addTab("marketing","Marketing");
			form.addTab("invoices","Invoices");
			
			var customer = null;
			var customerId = null;
			var estate = null;
			var estateId = null;
			
			if(request.getParameter("customer")!=null && request.getParameter("customer")!="")
			{
				customerId = request.getParameter("customer");
				customer = nlapiLoadRecord("customer",customerId);
				
				estateId = customer.getFieldValue("parent");
				if(estateId!=null && estateId!="")
					estate = nlapiLoadRecord("customer",estateId);
				else
					estateId = null;
			}
			if(request.getParameter("estate")!=null && request.getParameter("estate")!="")
			{
				estateId = request.getParameter("estate");
				estate = nlapiLoadRecord("customer",estateId);
			}
			
			nlapiLogExecution("debug","Estate ID",estateId);
			nlapiLogExecution("debug","Customer ID",customerId);
			
			if((estateId==null || estateId=="") && (customerId==null || customerId==""))
			{
				//Create temp estate + customer
				var estate = nlapiCreateRecord("customer");
				estate.setFieldValue("subsidiary","2");
				estate.setFieldValue("isperson","F");
				estate.setFieldValue("companyname","[TEMP] NEW CUSTOMER");
				estate.setFieldValue("category","2");
				estateId = nlapiSubmitRecord(estate,true,true);
					
				var customer = nlapiCreateRecord("customer");
				customer.setFieldValue("subsidiary","2");
				customer.setFieldValue("isperson","T");
				customer.setFieldValue("firstname","NEW");
				customer.setFieldValue("lastname","CUSTOMER");
				customer.setFieldValue("category","1");
				customer.setFieldValue("parent",estateId);
				customerId = nlapiSubmitRecord(customer,true,true);
			}
			
			fld = form.addField("custpage_customer_id","select","Customer (Existing)","customer","customer");
			fld.setLayoutType("normal","startcol");
			if(customerId!=null && customerId!="")
				fld.setDefaultValue(customerId);
			fld = form.addField("custpage_first_name","text","First Name",null,"customer");
			if(customer!=null)
				fld.setDefaultValue(customer.getFieldValue("firstname"));
			fld = form.addField("custpage_middle_initial","text","MI",null,"customer");
			if(customer!=null)
				fld.setDefaultValue(customer.getFieldValue("middlename"));
			fld = form.addField("custpage_last_name","text","Last Name",null,"customer");
			if(customer!=null)
				fld.setDefaultValue(customer.getFieldValue("lastname"));
			
			fld = form.addField("custpage_address","text","Address",null,"customer");
			fld.setLayoutType("normal","startcol");
			if(customer!=null)
				fld.setDefaultValue(customer.getFieldValue("billaddr1"));
			fld = form.addField("custpage_city","text","City",null,"customer");
			if(customer!=null)
				fld.setDefaultValue(customer.getFieldValue("billcity"));
			fld = form.addField("custpage_state","select","State","classification","customer");
			if(customer!=null)
				fld.setDefaultValue(mapState(customer.getFieldValue("billstate")));
			fld = form.addField("custpage_zip","text","Zip",null,"customer");
			if(customer!=null)
				fld.setDefaultValue(customer.getFieldValue("billzip"));
			
			fld = form.addField("custpage_phone","phone","Phone Number",null,"customer");
			fld.setLayoutType("normal","startcol");
			if(customer!=null)
				fld.setDefaultValue(customer.getFieldValue("phone"));
			fld = form.addField("custpage_email","email","Email",null,"customer");
			if(customer!=null)
				fld.setDefaultValue(customer.getFieldValue("email"));
			fld = form.addField("custpage_how_did_they_find_us","select","How Did They Find Us","campaign","customer");
			if(customer!=null)
				fld.setDefaultValue(customer.getFieldValue("leadsource"));
				
			var latestStatus = null;
			var latestStatusId = null;
			var latestStatusNotes = null;
			
			if(customerId!=null)
			{
				var filters = [];
				filters.push(new nlobjSearchFilter("custrecord_case_status_customer",null,"is",customerId));
				var cols = [];
				cols.push(new nlobjSearchColumn("custrecord_case_status_status"));
				cols.push(new nlobjSearchColumn("custrecord_case_status_notes"));
				cols.push(new nlobjSearchColumn("internalid").setSort(true));
				var results = nlapiSearchRecord("customrecord_case_status",null,filters,cols);
				if(results)
				{
					latestStatusId = results[0].getId();
					latestStatus = results[0].getValue("custrecord_case_status_status");
					latestStatusNotes = results[0].getValue("custrecord_case_status_notes");
				}
			}
			
			fld = form.addField("custpage_latest_status_id","select","Latest Status Record","customrecord_case_status","customer");
			fld.setDisplayType("hidden");
			if(latestStatusId!=null)
				fld.setDefaultValue(latestStatusId);
			
			fld = form.addField("custpage_latest_status","select","Latest Status","customlist_case_statuses","customer");
			//fld.setDisplayType("inline");
			if(latestStatus!=null)
				fld.setDefaultValue(latestStatus);
			
			fld = form.addField("custpage_notes","textarea","Notes from Customer Contact",null,"customer");
			fld.setLayoutType("normal","startcol");
			fld.setDisplaySize("70","6");
			
			fld = form.addField("custpage_latest_status_notes","textarea","Latest Status Notes",null,"customer");
			//fld.setDisplayType("inline");
			if(latestStatusNotes!=null)
				fld.setDefaultValue(latestStatusNotes);
			
			fld = form.addField("custpage_estate","select","Decedent Name (Existing)","customer","estate");
			fld.setLayoutType("normal","startcol");
			if(estateId!=null && estateId!="")
				fld.setDefaultValue(estateId);
			fld = form.addField("custpage_decedent","text","Decedent Name (New)",null,"estate");
			if(estate!=null)
				fld.setDefaultValue(estate.getFieldValue("companyname"));
			fld = form.addField("custpage_case_no","text","Case File No",null,"estate");
			if(estate!=null)
				fld.setDefaultValue(estate.getFieldValue("custentity1"));
			fld = form.addField("custpage_estate_state","select","State","classification","estate");
			if(estate!=null)
				fld.setDefaultValue(estate.getFieldValue("custentity3"));
			fld = form.addField("custpage_estate_county","select","County","customrecord173","estate");
			if(estate!=null)
				fld.setDefaultValue(estate.getFieldValue("custentity2"));
			
			fld = form.addField("custpage_estate_est_date_distr","date","Estimated Date of Distribution",null,"estate");
			if(estate!=null)
				fld.setDefaultValue(estate.getFieldValue("custentity_est_date_of_distribution"));
			
			fld = form.addField("custpage_estate_filing_date","date","Filing Date",null,"estate");
			if(estate!=null)
				fld.setDefaultValue(estate.getFieldValue("custentity_filing_date"));
				
			var nextEventFld = form.addField("custpage_estate_next_event","text","Next Event",null,"estate");
			nextEventFld.setDisplayType("inline");
			
			var nextCallFld = form.addField("custpage_estate_next_phonecall","text","Last Phone Call",null,"estate");
			nextCallFld.setDisplayType("inline");
			
			var attorneyFlds = null;
			
			if(estateId!=null && estateId!="")
			{
				var filters = [];
				filters.push(new nlobjSearchFilter("company",null,"is",estateId));
				filters.push(new nlobjSearchFilter("category",null,"is","1")); //Contact Category = Attorney
				var cols = [];
				cols.push(new nlobjSearchColumn("custentity_law_firm"));
				cols.push(new nlobjSearchColumn("entityid"));
				cols.push(new nlobjSearchColumn("email"));
				cols.push(new nlobjSearchColumn("phone"));
				cols.push(new nlobjSearchColumn("billaddress1"));
				cols.push(new nlobjSearchColumn("billcity"));
				cols.push(new nlobjSearchColumn("billstate"));
				cols.push(new nlobjSearchColumn("billzipcode"));
				var results = nlapiSearchRecord("contact",null,filters,cols);
				if(results)
				{
					attorneyFlds = results[0];
				}
			}
			
			fld = form.addField("custpage_attorney_name","text","Attorney Name",null,"estate");
			fld.setLayoutType("normal","startcol");
			if(attorneyFlds!=null)
				fld.setDefaultValue(attorneyFlds.getValue("entityid"));
			fld = form.addField("custpage_firm_name","text","Firm Name",null,"estate");
			if(attorneyFlds!=null)
				fld.setDefaultValue(attorneyFlds.getValue("custentity_law_firm"));
			fld = form.addField("custpage_attorney_address","text","Address",null,"estate");
			if(attorneyFlds!=null)
				fld.setDefaultValue(attorneyFlds.getValue("billaddress1"));
			fld = form.addField("custpage_attorney_city","text","City",null,"estate");
			if(attorneyFlds!=null)
				fld.setDefaultValue(attorneyFlds.getValue("billcity"));
			fld = form.addField("custpage_attorney_state","select","State","classification","estate");
			if(attorneyFlds!=null)
				fld.setDefaultValue(mapState(attorneyFlds.getValue("billstate")));
			fld = form.addField("custpage_attorney_zip","text","Zip",null,"estate");
			if(attorneyFlds!=null)
				fld.setDefaultValue(attorneyFlds.getValue("billzipcode"));
			fld = form.addField("custpage_attorney_phone","phone","Phone",null,"estate");
			if(attorneyFlds!=null)
				fld.setDefaultValue(attorneyFlds.getValue("phone"));
			fld = form.addField("custpage_attorney_email","email","Email",null,"estate");
			if(attorneyFlds!=null)
				fld.setDefaultValue(attorneyFlds.getValue("email"));
			fld = form.addField("custpage_attorney_id","select","Attorney Contact ID","contact","estate");
			if(attorneyFlds!=null)
				fld.setDefaultValue(attorneyFlds.getId());
			
			nlapiLogExecution("debug","Added Attorney");
			
			var personalRepFlds = null;
			
			if(estateId!=null && estateId!="")
			{
				var filters = [];
				filters.push(new nlobjSearchFilter("company",null,"is",estateId));
				filters.push(new nlobjSearchFilter("category",null,"is","2")); //Contact Category = Personal Representative
				var cols = [];
				cols.push(new nlobjSearchColumn("entityid"));
				cols.push(new nlobjSearchColumn("email"));
				cols.push(new nlobjSearchColumn("phone"));
				cols.push(new nlobjSearchColumn("billaddress1"));
				cols.push(new nlobjSearchColumn("billcity"));
				cols.push(new nlobjSearchColumn("billstate"));
				cols.push(new nlobjSearchColumn("billzipcode"));
				var results = nlapiSearchRecord("contact",null,filters,cols);
				if(results)
				{
					personalRepFlds = results[0];
				}
			}
			
			fld = form.addField("custpage_personal_rep_1","text","Personal Representative 1",null,"estate");
			fld.setLayoutType("normal","startcol");
			if(personalRepFlds!=null)
				fld.setDefaultValue(personalRepFlds.getValue("entityid"));
			fld = form.addField("custpage_personal_rep_1_address","text","Address",null,"estate");
			if(personalRepFlds!=null)
				fld.setDefaultValue(personalRepFlds.getValue("billaddress1"));
			fld = form.addField("custpage_personal_rep_1_city","text","City",null,"estate");
			if(personalRepFlds!=null)
				fld.setDefaultValue(personalRepFlds.getValue("billcity"));
			fld = form.addField("custpage_personal_rep_1_state","select","State","classification","estate");
			if(personalRepFlds!=null)
				fld.setDefaultValue(mapState(personalRepFlds.getValue("billstate")));
			fld = form.addField("custpage_personal_rep_1_zip","text","Zip",null,"estate");
			if(personalRepFlds!=null)
				fld.setDefaultValue(personalRepFlds.getValue("billzipcode"));
			fld = form.addField("custpage_personal_rep_1_phone","phone","Phone",null,"estate");
			if(personalRepFlds!=null)
				fld.setDefaultValue(personalRepFlds.getValue("phone"));
			fld = form.addField("custpage_personal_rep_1_email","email","Email",null,"estate");
			if(personalRepFlds!=null)
				fld.setDefaultValue(personalRepFlds.getValue("email"));
			fld = form.addField("custpage_personal_rep_1_id","select","Personal Rep 1 Contact ID","contact","estate");
			if(personalRepFlds!=null)
				fld.setDefaultValue(personalRepFlds.getId());
				
			nlapiLogExecution("debug","Added Personal Rep");
			
			fld = form.addField("custpage_total_property","integer","Total Value of Real Property",null,"financials");
			fld.setDisplayType("inline");
			fld.setDefaultValue(0.00);
			fld = form.addField("custpage_total_assets","integer","Total Assets",null,"financials");
			fld.setDisplayType("inline");
			fld.setDefaultValue(0.00);
			fld = form.addField("custpage_total_claims","integer","Total Claims",null,"financials");
			fld.setDisplayType("inline");
			fld.setDefaultValue(0.00);
			fld = form.addField("custpage_specific_bequests","integer","Specific Bequests due to Heirs",null,"financials");
			if(estate!=null && estate.getFieldValue("custentity_specific_bequests_due_to_heir")!=null && estate.getFieldValue("custentity_specific_bequests_due_to_heir")!="")
				fld.setDefaultValue(estate.getFieldValue("custentity_specific_bequests_due_to_heir"));
			else
				fld.setDefaultValue(0.00);
			fld = form.addField("custpage_closing_costs","integer","Real Estate Closing Costs",null,"financials");
			fld.setDisplayType("inline");
			fld.setDefaultValue(0.00);
			fld = form.addField("custpage_attorney_fees","integer","Attorney's Fees",null,"financials");
			fld.setDisplayType("inline");
			fld.setDefaultValue(0.00);
			fld = form.addField("custpage_net_equity_value_1","integer","Net Equity Value of Estate",null,"financials");
			fld.setDisplayType("inline");
			fld.setDefaultValue(0.00);
			
			var properties = form.addSubList("custpage_properties","inlineeditor","Real Properties","financials");
			properties.addField("custpage_property_address","text","Property");
			fld = properties.addField("custpage_property_value","integer","Value");
			fld.setMandatory(true);
			properties.addField("custpage_property_mortgage","integer","Mortgage");
			fld = properties.addField("custpage_property_owned","percent","% Owned");
			fld.setDefaultValue("100%");
			fld = properties.addField("custpage_property_total","integer","Total");
			fld.setDisplayType("disabled");
			fld = properties.addField("custpage_property_id","select","Property ID","customrecord_property");
			fld.setDisplayType("hidden");
			
			if(estate!=null)
			{
				var filters = [];
				filters.push(new nlobjSearchFilter("custrecord_property_estate",null,"is",estateId));
				var cols = [];
				cols.push(new nlobjSearchColumn("name"));
				cols.push(new nlobjSearchColumn("custrecord_property_value"));
				cols.push(new nlobjSearchColumn("custrecord_property_mortgage"));
				cols.push(new nlobjSearchColumn("custrecord_property_percent_owned"));
				cols.push(new nlobjSearchColumn("custrecord_property_total"));
				var results = nlapiSearchRecord("customrecord_property",null,filters,cols);
				if(results)
				{
					var lines = [];
					for(var x=0; x < results.length; x++)
					{
						lines.push({
							custpage_property_id : results[x].getId(),
							custpage_property_address : results[x].getValue("name"),
							custpage_property_value : results[x].getValue("custrecord_property_value"),
							custpage_property_mortgage : results[x].getValue("custrecord_property_mortgage"),
							custpage_property_owned : results[x].getValue("custrecord_property_percent_owned"),
							custpage_property_total : results[x].getValue("custrecord_property_total")
						});
					}
					properties.setLineItemValues(lines);
				}
			}
			
			nlapiLogExecution("debug","Added Properties");
			
			var accounts = form.addSubList("custpage_accounts","inlineeditor","Cash Accounts/Other Assets","financials");
			accounts.addField("custpage_accounts_name","text","Cash Account/Other Asset");
			accounts.addField("custpage_accounts_date","date","Date");
			fld = accounts.addField("custpage_accounts_value","integer","Value");
			fld.setMandatory(true);
			fld = accounts.addField("custpage_accounts_id","select","Account/Asset ID","customrecord_asset");
			fld.setDisplayType("hidden");
			
			if(estate!=null)
			{
				var filters = [];
				filters.push(new nlobjSearchFilter("custrecord_asset_estate",null,"is",estateId));
				var cols = [];
				cols.push(new nlobjSearchColumn("name"));
				cols.push(new nlobjSearchColumn("custrecord_asset_date"));
				cols.push(new nlobjSearchColumn("custrecord_asset_value"));
				var results = nlapiSearchRecord("customrecord_asset",null,filters,cols);
				if(results)
				{
					var lines = [];
					for(var x=0; x < results.length; x++)
					{
						lines.push({
							custpage_accounts_id : results[x].getId(),
							custpage_accounts_name : results[x].getValue("name"),
							custpage_accounts_date : results[x].getValue("custrecord_asset_date"),
							custpage_accounts_value : results[x].getValue("custrecord_asset_value")
						});
					}
					accounts.setLineItemValues(lines);
				}
			}
			
			nlapiLogExecution("debug","Added Assets");
			
			var claims = form.addSubList("custpage_claims","inlineeditor","Creditor Claims","financials");
			claims.addField("custpage_claims_name","text","Claim Name");
			claims.addField("custpage_claims_date","date","Date");
			fld = claims.addField("custpage_claims_value","integer","Value");
			fld.setMandatory(true);
			fld = claims.addField("custpage_claim_id","select","Claim ID","customrecord_claim");
			fld.setDisplayType("hidden");
			
			if(estateId!=null)
			{
				var filters = [];
				filters.push(new nlobjSearchFilter("custrecord_claim_estate",null,"is",estateId));
				var cols = [];
				cols.push(new nlobjSearchColumn("name"));
				cols.push(new nlobjSearchColumn("custrecord_claim_date"));
				cols.push(new nlobjSearchColumn("custrecord_claim_value"));
				var results = nlapiSearchRecord("customrecord_claim",null,filters,cols);
				if(results)
				{
					var lines = [];
					for(var x=0; x < results.length; x++)
					{
						lines.push({
							custpage_claim_id : results[x].getId(),
							custpage_claims_name : results[x].getValue("name"),
							custpage_claims_date : results[x].getValue("custrecord_claim_date"),
							custpage_claims_value : results[x].getValue("custrecord_claim_value")
						});
					}
					claims.setLineItemValues(lines);
				}
			}
			
			nlapiLogExecution("debug","Added Claims");
			
			fld = form.addField("custpage_net_equity_value","integer","Net Equity Value of the Estate",null,"sizing");
			fld.setDisplayType("inline");
			fld.setLayoutType("startrow","startcol");
			fld = form.addField("custpage_percent_equity_due","percent","Percent of Estate due to Customer",null,"sizing");
			fld.setLayoutType("startrow","none");
			if(customer!=null && customer.getFieldValue("custentity_percent_estate_due_to_custome")!=null && customer.getFieldValue("custentity_percent_estate_due_to_custome")!="")
				fld.setDefaultValue(customer.getFieldValue("custentity_percent_estate_due_to_custome"));
			else
				fld.setDefaultValue("100%");
			fld = form.addField("custpage_residue_equity_due","integer","Residue of Estate due to Customer",null,"sizing");
			fld.setDisplayType("inline");
			fld.setLayoutType("startrow","none");
			fld = form.addField("custpage_bequest_due","integer","Specific Bequest due to Customer",null,"sizing");
			fld.setLayoutType("startrow","none");
			if(customer!=null && customer.getFieldValue("custentity_specific_bequest_due_to_cust")!=null && customer.getFieldValue("custentity_specific_bequest_due_to_cust")!="")
				fld.setDefaultValue(customer.getFieldValue("custentity_specific_bequest_due_to_cust"));
			else
				fld.setDefaultValue(0);
			fld = form.addField("custpage_total_due","integer","Total Due to Customer from Estate",null,"sizing");
			fld.setDisplayType("inline");
			fld.setLayoutType("startrow","none");
			fld = form.addField("custpage_liens_judgments","integer","Liens and Judgments",null,"sizing");
			fld.setLayoutType("startrow","none");
			fld.setDefaultValue(0);
			fld.setDisplayType("inline");
			fld = form.addField("custpage_existing_agreements","integer","Existing Assignments",null,"sizing");
			fld.setLayoutType("startrow","none");
			fld.setDefaultValue(0);
			fld.setDisplayType("inline");
			fld = form.addField("custpage_net_due","integer","Net due to Customer",null,"sizing");
			fld.setDisplayType("inline");
			fld.setLayoutType("startrow","none");
			fld = form.addField("custpage_adv_to_val_ratio","percent","Advance to Value Ratio",null,"sizing");
			fld.setLayoutType("startrow","none");
			if(customer!=null && customer.getFieldValue("custentity_advance_to_value_ratio")!=null && customer.getFieldValue("custentity_advance_to_value_ratio")!="")
				fld.setDefaultValue(customer.getFieldValue("custentity_advance_to_value_ratio"));
			else
				fld.setDefaultValue("33%");
			fld = form.addField("custpage_max_advance","integer","Maximum Advance Size",null,"sizing");
			fld.setDisplayType("inline");
			fld.setLayoutType("startrow","none");
			
			fld = form.addField("custpage_desired_advance","integer","Desired Advance Size",null,"pricing");
			fld.setLayoutType("startrow","none");
			if(customer!=null && customer.getFieldValue("custentity_desired_advance_size")!=null && customer.getFieldValue("custentity_desired_advance_size")!="")
				fld.setDefaultValue(customer.getFieldValue("custentity_desired_advance_size"));
				
			fld = form.addField("custpage_price_level","select","Pricing Level","customrecord_price_option","pricing");
			fld.setLayoutType("startrow","none");
			if(customer!=null && customer.getFieldValue("custentity_pricing_level")!=null && customer.getFieldValue("custentity_pricing_level")!="")
				fld.setDefaultValue(customer.getFieldValue("custentity_pricing_level"));
			else
				fld.setDefaultValue("3");
				
			fld = form.addField("custpage_months_remaining","float","Guess of Months Remaining",null,"pricing");
			fld.setLayoutType("startrow","none");
			//fld.setDisplayType("inline");
			fld.setDefaultValue(18);
			
			fld = form.addField("custpage_early_rebate_1","select","Early Rebate Option 1 (Months)",null,"pricing");
			fld.setLayoutType("normal","startcol");
			fld.addSelectOption("","",true);
			fld.addSelectOption("3","3",false);
			fld.addSelectOption("6","6",false);
			fld.addSelectOption("9","9",false);
			fld.addSelectOption("12","12",false);
			fld.addSelectOption("18","18",false);
			fld.addSelectOption("24","24",false);
			if(customer!=null && customer.getFieldValue("custentity_early_rebate_option_1")!=null && customer.getFieldValue("custentity_early_rebate_option_1")!="")
				fld.setDefaultValue(customer.getFieldValue("custentity_early_rebate_option_1"));
			
			fld = form.addField("custpage_early_rebate_2","select","Early Rebate Option 2 (Months)",null,"pricing");
			fld.addSelectOption("","",true);
			fld.addSelectOption("3","3",false);
			fld.addSelectOption("6","6",false);
			fld.addSelectOption("9","9",false);
			fld.addSelectOption("12","12",false);
			fld.addSelectOption("18","18",false);
			fld.addSelectOption("24","24",false);
			if(customer!=null && customer.getFieldValue("custentity_early_rebate_option_2")!=null && customer.getFieldValue("custentity_early_rebate_option_2")!="")
				fld.setDefaultValue(customer.getFieldValue("custentity_early_rebate_option_2"));
			
			fld = form.addField("custpage_early_rebate_3","select","Early Rebate Option 3 (Months)",null,"pricing");
			fld.addSelectOption("","",true);
			fld.addSelectOption("3","3",false);
			fld.addSelectOption("6","6",false);
			fld.addSelectOption("9","9",false);
			fld.addSelectOption("12","12",false);
			fld.addSelectOption("18","18",false);
			fld.addSelectOption("24","24",false);
			if(customer!=null && customer.getFieldValue("custentity_early_rebate_option_3")!=null && customer.getFieldValue("custentity_early_rebate_option_3")!="")
				fld.setDefaultValue(customer.getFieldValue("custentity_early_rebate_option_3")); 
			
			fld = form.addField("custpage_assignment_size","integer","Assignment Size",null,"pricing");
			fld.setLayoutType("startrow","none");
			
			fld = form.addField("custpage_early_rebate_1_amt","integer","Option 1 Pricing",null,"pricing");
			fld.setLayoutType("normal","startcol");
			fld = form.addField("custpage_early_rebate_2_amt","integer","Option 2 Pricing",null,"pricing");
			fld = form.addField("custpage_early_rebate_3_amt","integer","Option 3 Pricing",null,"pricing");
			
			//Get quote button
			var fld = form.addField("custpage_get_quote","inlinehtml","Get Quote",null,"pricing");
			fld.setDefaultValue("<input type='button' name='getquote' id='getquote' value='Get Quote' onclick='createQuote();'/>");
			
			
			fld = form.addField("custpage_calculated_fee","currency","Calculated Fee",null,"temp");
			fld.setDisplayType("hidden");
			
			fld = form.addField("custpage_rate_of_return","float","Rate of Return",null,"temp");
			fld.setDisplayType("hidden");
			
			//fld = form.addField("custpage_update_case_status","select","Case Status","customlist_case_statuses","case_status");
			//fld = form.addField("custpage_update_case_status_notes","textarea","Case Status Notes",null,"case_status");
			//fld = form.addField("custpage_update_case_status_button","inlinehtml","Update Case Status Button",null,"case_status");
			//fld.setDefaultValue("<input type='button' name='updatecasestatus' id='updatecasestatus' value='Update Case Status' onclick='updateCaseStatus();'/>");
			
			var priorQuotes = form.addSubList("custpage_prior_quotes","list","Prior Quotes","quotes");
			priorQuotes.addField("custpage_quote_link","text","View Quote");
			priorQuotes.addField("custpage_quote_preferred","checkbox","Preferred?");
			priorQuotes.addField("custpage_quote_tranid","text","Quote #");
			priorQuotes.addField("custpage_quote_salesrep","text","Sales Person");
			priorQuotes.addField("custpage_quote_status","select","Status","customlist_quote_status");
			priorQuotes.addField("custpage_quote_date","date","Date");
			priorQuotes.addField("custpage_quote_advance","currency","Advance");
			priorQuotes.addField("custpage_quote_assignment","currency","Assignment");
			
			priorQuotes.addField("custpage_quote_option_1","currency","Option 1");
			priorQuotes.addField("custpage_quote_option_2","currency","Option 2");
			priorQuotes.addField("custpage_quote_option_3","currency","Option 3");
			
			priorQuotes.addField("custpage_quote_rebate_1","currency","Rebate 1");
			priorQuotes.addField("custpage_quote_rebate_2","currency","Rebate 2");
			priorQuotes.addField("custpage_quote_rebate_3","currency","Rebate 3");
			
			priorQuotes.addField("custpage_quote_time_1","integer","Time 1");
			priorQuotes.addField("custpage_quote_time_2","integer","Time 2");
			priorQuotes.addField("custpage_quote_time_3","integer","Time 3");
			fld = priorQuotes.addField("custpage_quote_internalid","select","Quote ID","estimate");
			fld.setDisplayType("hidden");
			
			priorQuotes.addField("custpage_quote_mail_merge","text","Mail Merge");
			priorQuotes.addField("custpage_quote_create_invoice","text","Create Invoice");
			
			if(request.getParameter("customer")!=null && request.getParameter("customer")!="")
			{
				var filters = [];
				filters.push(new nlobjSearchFilter("entity",null,"is",request.getParameter("customer")));
				filters.push(new nlobjSearchFilter("mainline",null,"is","T"));
				var cols = [];
				cols.push(new nlobjSearchColumn("salesrep"));
				cols.push(new nlobjSearchColumn("trandate"));
				cols.push(new nlobjSearchColumn("tranid"));
				cols.push(new nlobjSearchColumn("custbody_assignment_size"));
				cols.push(new nlobjSearchColumn("custbody_advance_size"));
				cols.push(new nlobjSearchColumn("custbody_rebate_1_month"));
				cols.push(new nlobjSearchColumn("custbody_rebate_2_month"));
				cols.push(new nlobjSearchColumn("custbody_rebate_3_month"));
				cols.push(new nlobjSearchColumn("custbody_rebate_1_amount"));
				cols.push(new nlobjSearchColumn("custbody_rebate_2_amount"));
				cols.push(new nlobjSearchColumn("custbody_rebate_3_amount"));
				cols.push(new nlobjSearchColumn("custbody_option_1_pricing"));
				cols.push(new nlobjSearchColumn("custbody_option_2_pricing"));
				cols.push(new nlobjSearchColumn("custbody_option_3_pricing"));
				cols.push(new nlobjSearchColumn("custbody_quote_status"));
				cols.push(new nlobjSearchColumn("custbody_preferred_quote"));
				cols.push(new nlobjSearchColumn("internalid").setSort(true));
				var results = nlapiSearchRecord("estimate",null,filters,cols);
				if(results)
				{
					var lines = [];
					
					for(var x=0; x < results.length; x++)
					{
						lines.push({
							custpage_quote_internalid : results[x].getId(),
							custpage_quote_link : "<a href='/app/accounting/transactions/estimate.nl?id=" + results[x].getId() + "' target='_blank'>View Quote</a>",
							custpage_quote_tranid : results[x].getValue("tranid"),
							custpage_quote_salesrep : results[x].getText("salesrep"),
							custpage_quote_status : results[x].getValue("custbody_quote_status"),
							custpage_quote_date : results[x].getValue("trandate"),
							custpage_quote_advance : results[x].getValue("custbody_advance_size"),
							custpage_quote_assignment : results[x].getValue("custbody_assignment_size"),
							custpage_quote_rebate_1 : results[x].getValue("custbody_rebate_1_amount"),
							custpage_quote_rebate_2 : results[x].getValue("custbody_rebate_2_amount"),
							custpage_quote_rebate_3 : results[x].getValue("custbody_rebate_3_amount"),
							custpage_quote_time_1 : results[x].getText("custbody_rebate_1_month"),
							custpage_quote_time_2 : results[x].getText("custbody_rebate_2_month"),
							custpage_quote_time_3 : results[x].getText("custbody_rebate_3_month"),
							custpage_quote_option_1 : results[x].getValue("custbody_option_1_pricing"),
							custpage_quote_option_2 : results[x].getValue("custbody_option_2_pricing"),
							custpage_quote_option_3 : results[x].getValue("custbody_option_3_pricing"),
							custpage_quote_preferred : results[x].getValue("custbody_preferred_quote"),
							custpage_quote_create_invoice : "<input type='button' name='newinvoice' id='newInvoice" + results[x].getId() + "' value='Create Invoice' onclick='createInvoice(" + results[x].getId() + ");'/>",
							custpage_quote_mail_merge : "<input type='button' name='mailmerge' id='mailmerge" + results[x].getId() + "' value='Mail Merge' onclick='mailMerge(" + results[x].getId() + ");'/>"
						});
					}
					
					priorQuotes.setLineItemValues(lines);
				}
			}
			
			nlapiLogExecution("debug","Added Prior Quotes");
			
			var caseStatus = form.addSubList("custpage_case_status_list","inlineeditor","Case Status","quotes");
			fld = caseStatus.addField("custpage_case_status_id","select","Case Status Internal ID","customrecord_case_status");
			fld.setDisplayType("hidden");
			fld = caseStatus.addField("custpage_case_status_status","select","Status","customlist_case_statuses");
			caseStatus.addField("custpage_case_status_notes","textarea","Notes");
			caseStatus.addField("custpage_case_status_timestamp","text","Date/Time Updated");
			caseStatus.addField("custpage_case_status_user","text","Updated By");
			//caseStatus.addRefreshButton();
			
			if(request.getParameter("customer")!=null && request.getParameter("customer")!="")
			{
				var filters = [];
				filters.push(new nlobjSearchFilter("custrecord_case_status_customer",null,"is",request.getParameter("customer")));
				var cols = [];
				cols.push(new nlobjSearchColumn("custrecord_case_status_status"));
				cols.push(new nlobjSearchColumn("custrecord_case_status_notes"));
				cols.push(new nlobjSearchColumn("created"));
				cols.push(new nlobjSearchColumn("owner"));
				cols.push(new nlobjSearchColumn("internalid").setSort(true));
				var results = nlapiSearchRecord("customrecord_case_status",null,filters,cols);
				if(results)
				{
					var lines = [];
					
					for(var x=0; x < results.length; x++)
					{
						lines.push({
							custpage_case_status_id : results[x].getId(),
							custpage_case_status_status : results[x].getValue("custrecord_case_status_status"),
							custpage_case_status_notes : results[x].getValue("custrecord_case_status_notes"),
							custpage_case_status_timestamp : results[x].getValue("created"),
							custpage_case_status_user : results[x].getText("owner")
						});
					}
					
					caseStatus.setLineItemValues(lines);
				}
			}
			
			nlapiLogExecution("debug","Added Case Statuses");
			
			var otherAssignments = form.addSubList("custpage_other_assignments","inlineeditor","Assignments Done with Other Companies","quotes");
			otherAssignments.addField("custpage_other_company","text","Advance Company");
			otherAssignments.addField("custpage_other_date","date","Date");
			fld = otherAssignments.addField("custpage_other_assignment","integer","Assignment");
			fld.setMandatory(true);
			fld = otherAssignments.addField("custpage_assignment_id","select","Assignment ID","customrecord_existing_assignment");
			fld.setDisplayType("hidden");
			
			if(customerId!=null)
			{
				var filters = [];
				filters.push(new nlobjSearchFilter("custrecord_existing_assignment_customer",null,"is",customerId));
				var cols = [];
				cols.push(new nlobjSearchColumn("name"));
				cols.push(new nlobjSearchColumn("custrecord_existing_assignment_date"));
				cols.push(new nlobjSearchColumn("custrecord_existing_assignment_amount"));
				var results = nlapiSearchRecord("customrecord_existing_assignment",null,filters,cols);
				if(results)
				{
					var lines = [];
					
					for(var x=0; x < results.length; x++)
					{
						lines.push({
							custpage_assignment_id : results[x].getId(),
							custpage_other_company : results[x].getValue("name"),
							custpage_other_date : results[x].getValue("custrecord_existing_assignment_date"),
							custpage_other_assignment : results[x].getValue("custrecord_existing_assignment_amount"),
						});
					}
					
					otherAssignments.setLineItemValues(lines);
				}
			}
			
			nlapiLogExecution("debug","Added Assignments");
			
			var leinsJudgments = form.addSubList("custpage_leins_judgements_list","inlineeditor","Leins/Judgements","quotes");
			leinsJudgments.addField("custpage_lein_judgement_name","text","Lein/Judgement");
			leinsJudgments.addField("custpage_lein_judgement_date","date","Date");
			fld = leinsJudgments.addField("custpage_lein_judgement_amount","integer","Amount");
			fld.setMandatory(true);
			fld = leinsJudgments.addField("custpage_lein_id","select","Lein/Judgement ID","customrecord_lein_judgement");
			fld.setDisplayType("hidden");
			
			if(customerId!=null)
			{
				var filters = [];
				filters.push(new nlobjSearchFilter("custrecord_lein_judgement_customer",null,"is",customerId));
				var cols = [];
				cols.push(new nlobjSearchColumn("name"));
				cols.push(new nlobjSearchColumn("custrecord_lein_judgement_date"));
				cols.push(new nlobjSearchColumn("custrecord_lein_judgement_amount"));
				var results = nlapiSearchRecord("customrecord_lein_judgement",null,filters,cols);
				if(results)
				{
					var lines = [];
					
					for(var x=0; x < results.length; x++)
					{
						lines.push({
							custpage_lein_id : results[x].getId(),
							custpage_lein_judgement_name : results[x].getValue("name"),
							custpage_lein_judgement_date : results[x].getValue("custrecord_lein_judgement_date"),
							custpage_lein_judgement_amount : results[x].getValue("custrecord_lein_judgement_amount"),
						});
					}
					
					leinsJudgments.setLineItemValues(lines);
				}
			}
			
			nlapiLogExecution("debug","Added Leins/Judgments");
			
			var phonecalls = form.addSubList("custpage_phonecalls","inlineeditor","Phone Calls","phonecalls");
			fld = phonecalls.addField("custpage_phonecalls_title","text","Subject");
			fld.setMaxLength(255);
			fld.setMandatory(true);
			fld = phonecalls.addField("custpage_phonecalls_message","textarea","Message");
			fld = phonecalls.addField("custpage_phonecalls_phone_number","phone","Phone Number");
			fld = phonecalls.addField("custpage_phonecalls_owner","select","Organizer","employee");
			fld = phonecalls.addField("custpage_phonecalls_date","date","Date");
			fld = phonecalls.addField("custpage_phonecalls_id","text","Activity ID");
			fld.setDisplayType("hidden");
			
			if(estate!=null)
			{
				var filters = [];
				filters.push(new nlobjSearchFilter("company",null,"is",estateId));
				var cols = [];
				cols.push(new nlobjSearchColumn("title"));
				cols.push(new nlobjSearchColumn("startdate").setSort(true));
				cols.push(new nlobjSearchColumn("assigned"));
				cols.push(new nlobjSearchColumn("phone"));
				cols.push(new nlobjSearchColumn("message"));
				var results = nlapiSearchRecord("phonecall",null,filters,cols);
				if(results)
				{
					var lines = [];
					for(var x=0; x < results.length; x++)
					{
						if(x==0)
						{
							nextCallFld.setDefaultValue(results[x].getValue("startdate") + " " + results[x].getValue("title"));
						}
						
						lines.push({
							custpage_phonecalls_id : results[x].getId(),
							custpage_phonecalls_title : results[x].getValue("title"),
							custpage_phonecalls_date : results[x].getValue("startdate"),
							custpage_phonecalls_phone_number : results[x].getValue("phone"),
							custpage_phonecalls_owner : results[x].getValue("assigned"),
							custpage_phonecalls_message : results[x].getValue("message")
						});
					}
					
					phonecalls.setLineItemValues(lines);
				}
			}
			
			nlapiLogExecution("debug","Added Phone Calls");
			
			var events = form.addSubList("custpage_events","inlineeditor","Events","events");
			fld = events.addField("custpage_events_title","text","Title");
			fld.setDisplaySize(50);
			fld = events.addField("custpage_events_date","date","Date");
			fld = events.addField("custpage_events_id","text","Event ID");
			fld.setDisplayType("hidden");
			
			if(estate!=null)
			{
				var filters = [];
				filters.push(new nlobjSearchFilter("attendee",null,"is",estateId));
				var cols = [];
				cols.push(new nlobjSearchColumn("title"));
				cols.push(new nlobjSearchColumn("startdate").setSort(true));
				cols.push(new nlobjSearchColumn("starttime"));
				cols.push(new nlobjSearchColumn("location"));
				cols.push(new nlobjSearchColumn("endtime"));
				var results = nlapiSearchRecord("calendarevent",null,filters,cols);
				if(results)
				{
					var lines = [];
					for(var x=0; x < results.length; x++)
					{
						if(x==0)
						{
							nextEventFld.setDefaultValue(results[x].getValue("startdate") + " " + results[x].getValue("title"));
						}
						
						lines.push({
							custpage_events_id : results[x].getId(),
							custpage_events_title : results[x].getValue("title"),
							custpage_events_date : results[x].getValue("startdate"),
							custpage_events_location : results[x].getValue("location"),
							custpage_events_start_time : results[x].getValue("starttime"),
							custpage_events_end_time : results[x].getValue("endtime")
						});
					}
					
					events.setLineItemValues(lines);
				}
			}
			
			nlapiLogExecution("debug","Added Events");
			
			var usernotes = form.addSubList("custpage_user_notes","list","User Notes","usernotes");
			fld = usernotes.addField("custpage_user_notes_author","text","Title");
			//fld.setDisplaySize(50);
			fld = usernotes.addField("custpage_user_notes_datetime","text","Date/Time");
			fld = usernotes.addField("custpage_user_notes_note","textarea","Note");
			fld = usernotes.addField("custpage_user_notes_internalid","text","Note Internal ID");
			fld.setDisplayType("hidden");
			
			if(customerId!=null)
			{
				var filters = [];
				filters.push(new nlobjSearchFilter("internalid","customer","is",customerId));
				var cols = [];
				cols.push(new nlobjSearchColumn("author"));
				cols.push(new nlobjSearchColumn("notedate").setSort(true));
				cols.push(new nlobjSearchColumn("note"));
				var results = nlapiSearchRecord("note",null,filters,cols);
				if(results)
				{
					var lines = [];
					for(var x=0; x < results.length; x++)
					{
						lines.push({
							custpage_user_notes_internalid : results[x].getId(),
							custpage_user_notes_author : results[x].getText("author"),
							custpage_user_notes_datetime : results[x].getValue("notedate"),
							custpage_user_notes_note : results[x].getValue("note")
						});
					}
					
					usernotes.setLineItemValues(lines);
				}
			}
			
			nlapiLogExecution("debug","Added User Notes");
			
			var contacts = form.addSubList("custpage_contacts","inlineeditor","Contacts","relationships");
			contacts.addField("custpage_contacts_name","text","Contact");
			contacts.addField("custpage_contacts_job_title","text","Job Title");
			contacts.addField("custpage_contacts_email","text","Email");
			contacts.addField("custpage_contacts_phone","text","Main Phone");
			//contacts.addField("custpage_contacts_law_firm","text","Law Firm");
			contacts.addField("custpage_contacts_role","text","Role");
			fld = contacts.addField("custpage_contacts_id","text","Contact ID");
			fld.setDisplayType("hidden");
			
			if(estate!=null)
			{
				var filters = [];
				filters.push(new nlobjSearchFilter("company",null,"is",estateId));
				var cols = [];
				cols.push(new nlobjSearchColumn("jobtitle"));
				cols.push(new nlobjSearchColumn("phone"));
				cols.push(new nlobjSearchColumn("email"));
				cols.push(new nlobjSearchColumn("custentity_law_firm"));
				cols.push(new nlobjSearchColumn("role"));
				cols.push(new nlobjSearchColumn("entityid"));
				var results = nlapiSearchRecord("contact",null,filters,cols);
				if(results)
				{
					var lines = [];
					for(var x=0; x < results.length; x++)
					{
						lines.push({
							custpage_contacts_id : results[x].getId(),
							custpage_contacts_name : results[x].getValue("entityid"),
							custpage_contacts_job_title : results[x].getValue("jobtitle"),
							custpage_contacts_phone : results[x].getValue("phone"),
							custpage_contacts_email : results[x].getValue("email"),
							custpage_contacts_role : results[x].getText("role"),
							custpage_contacts_law_firm : results[x].getValue("custentity_law_firm")
						});
					}
					contacts.setLineItemValues(lines);
				}
			}
			
			nlapiLogExecution("debug","Added Contacts");
			
			//Jurisdiction Tab
			fld = form.addField("custpage_jurisdiction_county","select","County","customrecord173","jurisdiction");
			if(estate!=null)
				fld.setDefaultValue(estate.getFieldValue("custentity2"));
				
			var county = null;
			if(estate!=null && estate.getFieldValue("custentity2")!=null && estate.getFieldValue("custentity2")!="")
				county = nlapiLookupField("customrecord173",estate.getFieldValue("custentity2"),["custrecord_county_pleading_title","custrecord_county_address_of_court","custrecord_county_court_phone_number","custrecord_county_court_name","custrecord_court_street_address","custrecord_court_city","custrecord_court_state","custrecord_court_zip"]);
			
			fld = form.addField("custpage_jurisdiction_pleading_title","textarea","Pleading Title",null,"jurisdiction");
			if(county!=null)
				fld.setDefaultValue(county.custrecord_county_pleading_title);
			
			fld = form.addField("custpage_jurisdiction_court_name","text","Court Name",null,"jurisdiction");
			if(county!=null)
				fld.setDefaultValue(county.custrecord_county_court_name);
				
			fld = form.addField("custpage_jurisdiction_court_address","text","Court Address",null,"jurisdiction");
			if(county!=null)
				fld.setDefaultValue(county.custrecord_court_street_address);
				
			fld = form.addField("custpage_jurisdiction_court_city","text","Court City",null,"jurisdiction");
			if(county!=null)
				fld.setDefaultValue(county.custrecord_court_city);
				
			fld = form.addField("custpage_jurisdiction_court_state","text","Court State",null,"jurisdiction");
			if(county!=null)
				fld.setDefaultValue(county.custrecord_court_state);
				
			fld = form.addField("custpage_jurisdiction_court_zip","text","Court Zip Code",null,"jurisdiction");
			if(county!=null)
				fld.setDefaultValue(county.custrecord_court_zip);
				
			fld = form.addField("custpage_jurisdiction_court_phone","text","Court Phone Number",null,"jurisdiction");
			if(county!=null)
				fld.setDefaultValue(county.custrecord_county_court_phone_number);
				
			nlapiLogExecution("debug","Set Justification Tab...");
			
			var invoiceList = form.addSubList("custpage_invoice_list","list","Invoices","invoices");
			invoiceList.addField("custpage_invoice_link","text","View Invoice");
			invoiceList.addField("custpage_invoice_tranid","text","Invoice Number");
			invoiceList.addField("custpage_invoice_po","text","PO/Check #");
			invoiceList.addField("custpage_invoice_date","date","Date");
			invoiceList.addField("custpage_invoice_advance","currency","Advance Amount");
			invoiceList.addField("custpage_invoice_amount","currency","Invoice Amount");
			invoiceList.addField("custpage_invoice_rebate_1","currency","Option 1 Pricing");
			invoiceList.addField("custpage_invoice_time_1","date","Date of Option 1 Pricing");
			invoiceList.addField("custpage_invoice_rebate_2","currency","Option 2 Pricing");
			invoiceList.addField("custpage_invoice_time_2","date","Date of Option 2 Pricing");
			invoiceList.addField("custpage_invoice_rebate_3","currency","Option 3 Pricing");
			invoiceList.addField("custpage_invoice_time_3","date","Date of Option 3 Pricing");
			invoiceList.addField("custpage_invoice_assignment","currency","Total Assignment Size");
			invoiceList.addField("custpage_invoice_attach","text","Attach Assignment");
			//invoiceList.addField("custpage_invoice_assignment_packet","text","Assignment Packet");
			//invoiceList.addField("custpage_invoice_signed_assignment","text","Signed Assignment");
			invoiceList.addField("custpage_invoice_stamped_assignment","text","Stamped Assignment");
			fld = invoiceList.addField("custpage_invoice_internalid","select","Invoice ID","invoice");
			fld.setDisplayType("hidden");
			
			nlapiLogExecution("debug","Created Invoice Sublist");
			
			if(customerId!=null && customerId!="")
			{
				var filters = [];
				filters.push(new nlobjSearchFilter("entity",null,"is",customerId));
				filters.push(new nlobjSearchFilter("mainline",null,"is","T"));
				var cols = [];
				cols.push(new nlobjSearchColumn("tranid"));
				cols.push(new nlobjSearchColumn("trandate"));
				cols.push(new nlobjSearchColumn("amount"));
				cols.push(new nlobjSearchColumn("custbody_assignment_size"));
				cols.push(new nlobjSearchColumn("custbody_advance_size"));
				cols.push(new nlobjSearchColumn("custbody_date_of_option_1_pricing"));
				cols.push(new nlobjSearchColumn("custbody_date_of_option_2_pricing"));
				cols.push(new nlobjSearchColumn("custbody_date_of_option_3_pricing"));
				cols.push(new nlobjSearchColumn("custbody_rebate_1_amount"));
				cols.push(new nlobjSearchColumn("custbody_rebate_2_amount"));
				cols.push(new nlobjSearchColumn("custbody_rebate_3_amount"));
				cols.push(new nlobjSearchColumn("otherrefnum"));
				cols.push(new nlobjSearchColumn("custbody_assignment_packet"));
				cols.push(new nlobjSearchColumn("custbody_signed_assignment"));
				cols.push(new nlobjSearchColumn("custbody_stamped_assignment"));
				cols.push(new nlobjSearchColumn("custbody_option_1_pricing"));
				cols.push(new nlobjSearchColumn("custbody_option_2_pricing"));
				cols.push(new nlobjSearchColumn("custbody_option_3_pricing"));
				cols.push(new nlobjSearchColumn("internalid").setSort(true));
				var results = nlapiSearchRecord("invoice",null,filters,cols);
				if(results)
				{
					var lines = [];
					
					for(var x=0; x < results.length; x++)
					{
						lines.push({
							custpage_invoice_internalid : results[x].getId(),
							custpage_invoice_link : "<a href='/app/accounting/transactions/custinvc.nl?id=" + results[x].getId() + "' target='_blank'>View Invoice</a>",
							custpage_invoice_tranid : results[x].getValue("tranid"),
							custpage_invoice_amount : results[x].getValue("amount"),
							custpage_invoice_po : results[x].getValue("otherrefnum"),
							custpage_invoice_date : results[x].getValue("trandate"),
							custpage_invoice_advance : results[x].getValue("custbody_advance_size"),
							custpage_invoice_assignment : results[x].getValue("custbody_assignment_size"),
							custpage_invoice_rebate_1 : results[x].getValue("custbody_option_1_pricing"),
							custpage_invoice_rebate_2 : results[x].getValue("custbody_option_2_pricing"),
							custpage_invoice_rebate_3 : results[x].getValue("custbody_option_3_pricing"),
							custpage_invoice_time_1 : results[x].getText("custbody_date_of_option_1_pricing"),
							custpage_invoice_time_2 : results[x].getText("custbody_date_of_option_2_pricing"),
							custpage_invoice_time_3 : results[x].getText("custbody_date_of_option_3_pricing"),
							custpage_invoice_stamped_assignment : results[x].getText("custbody_stamped_assignment"),
							custpage_invoice_attach : "<input type='button' name='attachAssignment" + results[x].getId() + "' id='attachAssignment" + results[x].getId() + "' value='Attach Assignment' onclick='attachAssignment(" + results[x].getId() + ");'/>",
						});
					}
					
					invoiceList.setLineItemValues(lines);
				}
			}
			
			nlapiLogExecution("debug","Created Invoice Sublist DATA");
			
			if(estateId!=null && estateId!="")
			{
				form.addTab("custpage_create_box_subtab","Documents");
				fld = form.addField("custpage_box_frame_new","inlinehtml","Frame",null,"custpage_create_box_subtab");
				
				nlapiLogExecution("debug","Added Box Subtab");
				
				var frame_url = nlapiResolveURL("SUITELET","customscript_box_client","customdeploy_box_client");
				frame_url += "&record_id=" + estateId + "&record_type=customer";
				
				nlapiLogExecution("debug","frame_url",frame_url);
				
				var content = '<iframe id="boxnet_widget_frame" src="' + frame_url + '" align="center" style="width: 100%; height:600px; margin:0; border:0; padding:0" frameborder="0"></iframe>';
				fld.setDefaultValue(content);
				
				nlapiLogExecution("debug","Added default value to field");
			}

			//form.addSubmitButton("Submit Application");
			
			response.writePage(form);
		}
		catch(err)
		{
			nlapiLogExecution("error","Error Showing Customer Application","Details: " + err.message);
		}
	}
	else
	{
		//Create estate (if none selected)
		if(request.getParameter("custpage_estate")==null || request.getParameter("custpage_estate")=="")
		{
			var estate = nlapiCreateRecord("customer");
			estate.setFieldValue("isperson","F");
			estate.setFieldValue("companyname",request.getParameter("custpage_decedent"));
			estate.setFieldValue("custentity1",request.getParameter("custpage_case_no"));
			estate.setFieldValue("custentity3",request.getParameter("custpage_estate_state"));
			estate.setFieldValue("custentity2",request.getParameter("custpage_estate_county"));
			var estateId = nlapiSubmitRecord(estate,true,true);
		}
		else
		{
			var estate = nlapiLoadRecord("customer",request.getParameter("custpage_estate"));
			estate.setFieldValue("companyname",request.getParameter("custpage_decedent"));
			estate.setFieldValue("custentity1",request.getParameter("custpage_case_no"));
			estate.setFieldValue("custentity3",request.getParameter("custpage_estate_state"));
			estate.setFieldValue("custentity2",request.getParameter("custpage_estate_county"));
			var estateId = nlapiSubmitRecord(estate,true,true);
		}
		
		//Create new customer record (sub-record of estate)
		var customer = nlapiCreateRecord("customer");
		customer.setFieldValue("isperson","T");
		customer.setFieldValue("firstname",request.getParameter("custpage_first_name"));
		customer.setFieldValue("lastname",request.getParameter("custpage_last_name"));
		customer.setFieldValue("email",request.getParameter("custpage_email"));
		customer.setFieldValue("phone",request.getParameter("custpage_phone"));
		customer.setFieldValue("leadsource",request.getParameter("custpage_how_did_they_find_us"));
		customer.setFieldValue("leadsource",customerId);
		var customerId = nlapiSubmitRecord(customer,true,true);
		
		//Create new user note if notes are populated
		if(request.getParameter("custpage_notes")!=null && request.getParameter("custpage_notes")!="")
		{
			var userNote = nlapiCreateRecord("note");
			userNote.setFieldValue("note",request.getParameter("custpage_notes"));
			userNote.setFieldValue("entity",customerId);
			nlapiSubmitRecord(userNote,true,true);
		}
		
		//Create property records
		for(var x=0; x < request.getParameter("custpage_properties"); x++)
		{
			if(request.getLineItemValue("custpage_properties","custpage_property_id",x+1)!=null && request.getLineItemValue("custpage_properties","custpage_property_id",x+1)!=null)
				var property = nlapiLoadRecord("customrecord_property",request.getLineItemValue("custpage_properties","custpage_property_id",x+1));
			else
				var property = nlapiCreateRecord("customrecord_property");
				
			property.setFieldValue("name",request.getLineItemValue("custpage_properties","custpage_property_address",x+1));
			property.setFieldValue("custrecord_property_value",request.getLineItemValue("custpage_properties","custpage_property_value",x+1));
			property.setFieldValue("custrecord_property_mortgage",request.getLineItemValue("custpage_properties","custpage_property_mortgage",x+1));
			property.setFieldValue("custrecord_property_percent_owned",request.getLineItemValue("custpage_properties","custpage_property_owned",x+1));
			property.setFieldValue("custrecord_property_total",request.getLineItemValue("custpage_properties","custpage_property_total",x+1));
			propertyId = nlapiSubmitRecord(property,true,true);
		}
		
		//Create asset records
		for(var x=0; x < request.getParameter("custpage_accounts"); x++)
		{
			if(request.getLineItemValue("custpage_accounts","custpage_accounts_id",x+1)!=null && request.getLineItemValue("custpage_accounts","custpage_accounts_id",x+1)!=null)
				var asset = nlapiLoadRecord("customrecord_asset",request.getLineItemValue("custpage_accounts","custpage_accounts_id",x+1));
			else
				var asset = nlapiCreateRecord("customrecord_asset");
				
			asset.setFieldValue("name",request.getLineItemValue("custpage_accounts","custpage_accounts_name",x+1));
			asset.setFieldValue("custrecord_asset_date",request.getLineItemValue("custpage_accounts","custpage_accounts_date",x+1));
			asset.setFieldValue("custrecord_asset_value",request.getLineItemValue("custpage_accounts","custpage_accounts_value",x+1));
			asset.setFieldValue("custrecord_asset_estate",estateId);
			assetId = nlapiSubmitRecord(asset,true,true);
		}
		
		//Create claim records
		for(var x=0; x < request.getParameter("custpage_claims"); x++)
		{
			if(request.getLineItemValue("custpage_claims","custpage_claims_id",x+1)!=null && request.getLineItemValue("custpage_claims","custpage_claims_id",x+1)!=null)
				var claims = nlapiLoadRecord("customrecord_claim",request.getLineItemValue("custpage_claims","custpage_claims_id",x+1));
			else
				var claims = nlapiCreateRecord("customrecord_claim");
				
			claims.setFieldValue("name",request.getLineItemValue("custpage_claims","custpage_claims_name",x+1));
			claims.setFieldValue("custrecord_asset_date",request.getLineItemValue("custpage_claims","custpage_claims_date",x+1));
			claims.setFieldValue("custrecord_asset_value",request.getLineItemValue("custpage_claims","custpage_claims_value",x+1));
			claims.setFieldValue("custrecord_asset_estate",estateId);
			claimsId = nlapiSubmitRecord(claims,true,true);
		}
		
		//Create quote
		var quote = nlapiTransformRecord("customer",customerId,"estimate");
		quote.setFieldValue("custbody_rebate_1_month",request.getParameter("custpage_early_rebate_1"));
		quote.setFieldValue("custbody_rebate_2_month",request.getParameter("custpage_early_rebate_2"));
		quote.setFieldValue("custbody_rebate_3_month",request.getParameter("custpage_early_rebate_3"));
		quote.setFieldValue("custbody_rebate_1_amount",request.getParameter("custpage_early_rebate_1_amt"));
		quote.setFieldValue("custbody_rebate_2_amount",request.getParameter("custpage_early_rebate_2_amt"));
		quote.setFieldValue("custbody_rebate_3_amount",request.getParameter("custpage_early_rebate_3_amt"));
		
		quote.selectNewLineItem("item");
		quote.setCurrentLineItemValue("item","item","7"); //Cash Advanced to Client
		quote.setCurrentLineItemValue("item","rate",request.getParameter("custpage_desired_advance"));
		quote.setCurrentLineItemValue("item","amount",request.getParameter("custpage_desired_advance"));
		quote.commitLineItem("item");
		
		quote.selectNewLineItem("item");
		quote.setCurrentLineItemValue("item","item","5"); //Fixed Fee
		quote.setCurrentLineItemValue("item","rate",request.getParameter("custpage_desired_advance"));
		quote.setCurrentLineItemValue("item","amount",request.getParameter("custpage_desired_advance"));
		quote.commitLineItem("item");
		
		quote.selectNewLineItem("item");
		quote.setCurrentLineItemValue("item","item","6"); //Deferred Revenue
		quote.setCurrentLineItemValue("item","rate",request.getParameter("custpage_desired_advance"));
		quote.setCurrentLineItemValue("item","amount",request.getParameter("custpage_desired_advance"));
		quote.commitLineItem("item");
		
		var quoteId = nlapiSubmitRecord(quote,true,true);
		
		response.sendRedirect("RECORD","estimate",quote);
	}
}

function mapState(stateAbbrev)
{
	var classId = "";
	
	switch(stateAbbrev)
	{
		case "AL":
			classId = "4";
			break;
		case "AK":
			classId = "5";
			break;
		case "AZ":
			classId = "6";
			break;
		case "AR":
			classId = "7";
			break;
		case "CA":
			classId = "1";
			break;
		case "CO":
			classId = "8";
			break;
		case "CT":
			classId = "9";
			break;
		case "DE":
			classId = "10";
			break;
		case "FL":
			classId = "3";
			break;
		case "GA":
			classId = "11";
			break;
		case "HI":
			classId = "12";
			break;
		case "ID":
			classId = "13";
			break;
		case "IL":
			classId = "14";
			break;
		case "IN":
			classId = "15";
			break;
		case "IA":
			classId = "16";
			break;
		case "KS":
			classId = "17";
			break;
		case "KY":
			classId = "18";
			break;
		case "LA":
			classId = "19";
			break;
		case "ME":
			classId = "20";
			break;
		case "MD":
			classId = "21";
			break;
		case "MA":
			classId = "22";
			break;
		case "MI":
			classId = "23";
			break;
		case "MN":
			classId = "24";
			break;
		case "MS":
			classId = "25";
			break;
		case "MO":
			classId = "26";
			break;
		case "MT":	
			classId = "27";
			break;
		case "NE":
			classId = "28";
			break;
		case "NV":
			classId = "29";
			break;
		case "NH":
			classId = "30";
			break;
		case "NJ":
			classId = "31";
			break;
		case "NM":
			classId = "32";
			break;
		case "NY":
			classId = "2";
			break;
		case "NC":
			classId = "33";
			break;
		case "ND":
			classId = "34";
			break;
		case "OH":
			classId = "35";
			break;
		case "OK":
			classId = "36";
			break;
		case "OR":
			classId = "37";
			break;
		case "PA":
			classId = "38";
			break;
		case "RI":
			classId = "39";
			break;
		case "SC":
			classId = "40";
			break;
		case "SD":
			classId = "41";
			break;
		case "TN":
			classId = "42";
			break;
		case "TX":
			classId = "43";
			break;
		case "UT":
			classId = "44";
			break;
		case "VT":
			classId = "45";
			break;
		case "VA":
			classId = "46";
			break;
		case "WA":
			classId = "47";
			break;
		case "WV":
			classId = "48";
			break;
		case "WI":
			classId = "49";
			break;
		case "WY":
			classId = "50";
			break;
	}
	
	return classId;
}