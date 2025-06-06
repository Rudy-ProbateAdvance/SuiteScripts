/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 02 2021     Administrator
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

function suitelet ( request, response ) {
	try {
		if ( request.getMethod() == 'GET' ) {
			var sel_action = request.getParameter( 'sel_action' );

			var form = nlapiCreateForm( 'Borrowing Base Report' );
			form.addSubmitButton( 'Search' );
			form.addButton( 'custpage_download_xls', 'Download Excel', "onDownload()" );

            var actions = form.addField('custpage_action', 'select', 'Report By');
            actions.addSelectOption(1, "Invoice");
            actions.addSelectOption(2, "Customer");
            actions.addSelectOption(3, "Estate");
            actions.addSelectOption(4, "State");
            actions.defaultValue = sel_action;
            var customers = [];
            var parents = [];
            //
            search = nlapiCreateSearch("invoice",
                [
                    ['amountremainingisabovezero', 'is', 'T'], 'and', ['mainline', 'is', 'T']
                    //,
                    //'and',["customer.internalidnumber","equalto","602190"]

                ],
                [
                    new nlobjSearchColumn("internalid", null, null),
                    new nlobjSearchColumn("entity", null, null),
                    new nlobjSearchColumn("parent", 'customer', null),

                ]
            ) || [];
            searchResults = search.runSearch();
            resultIndex = 0;
            resultStep = 1000, rowIndex = 1;
            tmp = [];
            do {
                tmp = searchResults.getResults(resultIndex, resultIndex + resultStep);
                for (var j = 0; j < tmp.length; j++) {
                    var id = tmp[j].getValue('entity');
                    var parent = tmp[j].getValue("parent", 'customer');
                    customers.push(id);
                    customers.push(parent);
                    parents.push(parent)
                }
                resultIndex = resultIndex + resultStep;
            } while (tmp.length > 0);

			// get all estate
			var estates = [];
			var filters = [];
			if ( customers && customers.length > 0 ) {
                filters = [
                    ['category', 'is', '2'], 'and', ["internalid", "anyof", customers]
                ];
            } else {
                filters = [
                    ['category', 'is', '2']
                ]
			}
			search = nlapiCreateSearch( "customer", filters,
				[
					new nlobjSearchColumn( "internalid", null, null ),
					new nlobjSearchColumn( "entityid", null, null ),
					new nlobjSearchColumn( "firstname", null, null ),
					new nlobjSearchColumn( "lastname", null, null ),
					new nlobjSearchColumn( "billstate", null, null ),
					new nlobjSearchColumn( "custentity_specific_bequests_due_to_heir", null, null ),
					new nlobjSearchColumn( "custentity_specific_bequest_due_to_cust", null, null ),
					new nlobjSearchColumn( "custentity_advance_to_value_ratio", null, null ),
					new nlobjSearchColumn( "custentity_percent_estate_due_to_custome", null, null ),
				]
			) || [];
			searchResults = search.runSearch();
			nlapiLogExecution( "debug", "First Search=" + searchResults );
            resultIndex = 0;
            resultStep = 1000, rowIndex = 1;
            tmp = [];
			do {
				tmp = searchResults.getResults( resultIndex, resultIndex + resultStep );
				for ( var j = 0; j < tmp.length; j++ ) {
					var id = parseInt( tmp[ j ].getValue( 'internalid' ) );
					var due_to_heir = tmp[ j ].getValue( 'custentity_specific_bequests_due_to_heir' );
					//nlapiLogExecution("debug","First due_to_heir="+id,due_to_heir);
					var billstate = tmp[ j ].getValue( 'billstate' );
                    if (billstate && due_to_heir) {
                        var estateobj = {
                            "billstate": billstate,
                            "duetoheir": due_to_heir
                        };
                        estates[id] = estateobj;
                    }
                    if (billstate) {
                        var estateobj = {
                            "billstate": billstate,
                            "duetoheir": ''
                        };
                        estates[id] = estateobj;
                    } else if (due_to_heir) {
                        var estateobj = {
                            "billstate": '',
                            "duetoheir": due_to_heir
                        };
                        estates[id] = estateobj;
                    } else {
                        var estateobj = {
                            "billstate": '',
                            "duetoheir": ''
                        };
                        estates[id] = estateobj;
                    }
                }
                resultIndex = resultIndex + resultStep;
            } while (tmp.length > 0);

            //nlapiLogExecution("debug","estates",JSON.stringify(estates));

			// calculate property, accounts, claims
            var properties = [],
                assets = [],
                claims = [],
                c_leins = [],
                e_leins = [],
                c_existing_assignments = [],
                c_existing_assignments1 = [],
                e_existing_assignments = [];
            var propertiesfilter = [];
            var assign_properties = {};
            if (customers && customers.length > 0) {
                propertiesfilter = [
                    ["custrecord_existing_assignment_customer", "anyof", customers]
                ]
			}
			search = nlapiCreateSearch( "customrecord_existing_assignment",
				propertiesfilter,
				[
					new nlobjSearchColumn( "custrecord_existing_assignment_customer", null, null ).setSort(),
					new nlobjSearchColumn( "custrecord_existing_assignment_estate", null, null ),
					new nlobjSearchColumn( "internalid", "custrecord_existing_assignment_invoice", null ),
					new nlobjSearchColumn( "custrecord_existing_assignment_amount", null, null ),
					new nlobjSearchColumn( "custrecord_existing_assignment_priority", null, null ).setSort(),
					new nlobjSearchColumn( "custrecord_existing_assignment_date", null, null ).setSort(),
				]
			) || [];
			searchResults = search.runSearch();
			nlapiLogExecution( "debug", "second Search=" + searchResults );
            resultIndex = 0;
            resultStep = 1000, rowIndex = 1;
            tmp = [];
			do {
				tmp = searchResults.getResults( resultIndex, resultIndex + resultStep );
				for ( var j = 0; j < tmp.length; j++ ) {
					var customer = tmp[ j ].getValue( 'custrecord_existing_assignment_customer' );
					if ( !( customer in c_existing_assignments ) ) {
						c_existing_assignments[ customer ] = [];
					}
					var assign_obj = {
						invoice: tmp[ j ].getValue( 'internalid', 'custrecord_existing_assignment_invoice' ),
						date: tmp[ j ].getValue( 'custrecord_existing_assignment_date' ),
						priority: tmp[ j ].getValue( 'custrecord_existing_assignment_priority' ),
						amount: tmp[ j ].getValue( 'custrecord_existing_assignment_amount' )
					};

					c_existing_assignments[ customer ].push( assign_obj );
				}
				resultIndex = resultIndex + resultStep;
			} while ( tmp.length > 0 );
			
			
			/////// Newly Added for the competitor_sum
			
			
			search = nlapiCreateSearch( "customrecord_existing_assignment",
				propertiesfilter,
				[
					new nlobjSearchColumn( "custrecord_existing_assignment_customer", null, "GROUP" ).setSort(),
					new nlobjSearchColumn( "custrecord_existing_assignment_estate", null, "GROUP" ),
					new nlobjSearchColumn( "internalid", "custrecord_existing_assignment_invoice", "GROUP" ),
					new nlobjSearchColumn( "custrecord_existing_assignment_amount", null, "GROUP" ),
					new nlobjSearchColumn( "custrecord_existing_assignment_priority", null, "GROUP" ).setSort(),
					new nlobjSearchColumn( "custrecord_existing_assignment_date", null, "GROUP" ).setSort(),
					new nlobjSearchColumn( "name", null, "GROUP")
				]
			) || [];
			searchResults = search.runSearch();
			nlapiLogExecution( "debug", "second Search=" + searchResults );
            resultIndex = 0;
            resultStep = 1000, rowIndex = 1;
            tmp = [];
			do {
				tmp = searchResults.getResults( resultIndex, resultIndex + resultStep );
				for ( var j = 0; j < tmp.length; j++ ) {
					var customer = tmp[ j ].getValue( 'custrecord_existing_assignment_customer', null, 'group' );
					if ( !( customer in c_existing_assignments1 ) ) {
						c_existing_assignments1[ customer ] = [];
					}
					
					var assign_obj = {
						invoice: tmp[ j ].getValue( 'internalid', 'custrecord_existing_assignment_invoice', 'group'),
						date: tmp[ j ].getValue( 'custrecord_existing_assignment_date' , null, 'group'),
						priority: tmp[ j ].getValue( 'custrecord_existing_assignment_priority' , null, 'group'),
						amount: tmp[ j ].getValue( 'custrecord_existing_assignment_amount', null, 'group' ),
						name:tmp[ j ].getValue( 'name' , null, 'group'),
						customer:tmp[ j ].getValue( 'custrecord_existing_assignment_customer', null, 'group' )
						
					};

					c_existing_assignments1[ customer ].push( assign_obj );
				}
				resultIndex = resultIndex + resultStep;
			} while ( tmp.length > 0 );
			///////////////////////////////////////////
			//nlapiLogExecution("debug","c_existing_assignments Claim",JSON.stringify(c_existing_assignments));

			//nlapiLogExecution("debug","Calc Existing Assignment");
			var estatefilter = [];
			if ( customers && customers.length > 0 ) {
                estatefilter = [
                    ["custrecord_property_estate", "anyof", customers]
                ];
			}

            totalFld = new nlobjSearchColumn("custrecord_property_total", null, 'sum');
            estateFld = new nlobjSearchColumn("custrecord_property_estate", null, 'group');
            search = nlapiCreateSearch("customrecord_property", estatefilter, [estateFld, totalFld]) || [];
            searchResults = search.runSearch();
            nlapiLogExecution("debug", "third Search=" + searchResults);
            resultIndex = 0;
            resultStep = 1000, rowIndex = 1;
            tmp = [];
            do {
                tmp = searchResults.getResults(resultIndex, resultIndex + resultStep);
                for (var j = 0; j < tmp.length; j++) {
                    var estate = tmp[j].getValue(estateFld);
                    properties[estate] = {
                        total: tmp[j].getValue(totalFld)
                    };
                }
                resultIndex = resultIndex + resultStep;
            } while (tmp.length > 0);
            //added by 
            var assignestate = [];
            if (customers && customers.length > 0) {
                assignestate = [
                    ["custrecord_property_estate", "anyof", customers]
                ];
            }

            valueFld = new nlobjSearchColumn("custrecord_property_value", null, null);
            ownedFld = new nlobjSearchColumn("custrecord_property_percent_owned", null, null);
            estateFld = new nlobjSearchColumn("custrecord_property_estate", null, null);
            search = nlapiCreateSearch("customrecord_property", assignestate, [estateFld, valueFld, ownedFld]) || [];
            searchResults = search.runSearch();
            resultIndex = 0;
            resultStep = 1000, rowIndex = 1;
            tmp = [];
            do {
                tmp = searchResults.getResults(resultIndex, resultIndex + resultStep);
                for (var j = 0; j < tmp.length; j++) {
                    var estate = tmp[j].getValue(estateFld);
                    var pvalue = tmp[j].getValue(valueFld) || 0;
                    var owned = tmp[j].getValue(ownedFld) || 0;
                    owned = owned && owned.replace('%', "");
                    var assignamt = (Number(pvalue) * Number(owned)) / 100;
                    //nlapiLogExecution( "debug", "assignamt" ,assignamt+'////'+pvalue+'/////'+owned);

                      if( typeof assign_properties[estate] === 'undefined'){
                      assign_properties[estate] = assignamt;
                      }else{
                     assign_properties[estate] += assignamt;
                      }
					//assign_properties.push({'estate':estate,'assignamt':assignamt});  ;
				}
				resultIndex = resultIndex + resultStep;
			} while ( tmp.length > 0 );
	
			//end 
			nlapiLogExecution( "debug", "assign_properties" ,JSON.stringify(assign_properties ));

            var assetfilter = [];
            if (customers && customers.length > 0) {
                assetfilter = [
                    ["custrecord_asset_estate", "anyof", customers]
                ];
            }

            totalFld = new nlobjSearchColumn("custrecord_asset_value", null, 'sum');
            estateFld = new nlobjSearchColumn("custrecord_asset_estate", null, 'group');
            search = nlapiCreateSearch("customrecord_asset", assetfilter, [estateFld, totalFld]) || [];
            searchResults = search.runSearch();
            //nlapiLogExecution( "debug", "fourth Search=" + searchResults );
            resultIndex = 0;
            resultStep = 1000, rowIndex = 1;
            tmp = [];
            do {
                tmp = searchResults.getResults(resultIndex, resultIndex + resultStep);
                for (var j = 0; j < tmp.length; j++) {
                    var estate = tmp[j].getValue(estateFld);
                    assets[estate] = {
                        value: tmp[j].getValue(totalFld)
                    };
                }
                resultIndex = resultIndex + resultStep;
            } while (tmp.length > 0);
            //nlapiLogExecution("debug","Calc Asset",assets);
            var claimfilter = [];
            if (customers && customers.length > 0) {
                claimfilter = [
                    ["custrecord_claim_estate", "anyof", customers]
                ];
            }

            totalFld = new nlobjSearchColumn("custrecord_claim_value", null, 'sum');
            estateFld = new nlobjSearchColumn("custrecord_claim_estate", null, 'group');
            search = nlapiCreateSearch("customrecord_claim", claimfilter, [estateFld, totalFld]) || [];
            searchResults = search.runSearch();
            nlapiLogExecution("debug", "fifth Search=" + searchResults);
            resultIndex = 0;
            resultStep = 1000, rowIndex = 1;
            tmp = [];
            do {
                tmp = searchResults.getResults(resultIndex, resultIndex + resultStep);
                for (var j = 0; j < tmp.length; j++) {
                    var estate = tmp[j].getValue(estateFld);
                    claims[estate] = {
                        value: tmp[j].getValue(totalFld)
                    };
                }
                resultIndex = resultIndex + resultStep;
            } while (tmp.length > 0);
            //nlapiLogExecution("debug","Calc Claim");
            var leinfilter = [];
            if (customers && customers.length > 0) {
                leinfilter = [
                    ["custrecord_lein_judgement_customer", "anyof", customers]
                ];
            }

            totalFld = new nlobjSearchColumn("custrecord_lein_judgement_amount", null, 'sum');
            customerFld = new nlobjSearchColumn("custrecord_lein_judgement_customer", null, 'group');
            search = nlapiCreateSearch("customrecord_lein_judgement", leinfilter, [totalFld, customerFld]) || [];
            searchResults = search.runSearch();
            //nlapiLogExecution( "debug", "sixth Search=" );
            resultIndex = 0;
            resultStep = 1000, rowIndex = 1;
            tmp = [];
            do {
                tmp = searchResults.getResults(resultIndex, resultIndex + resultStep);
                for (var j = 0; j < tmp.length; j++) {
                    var customer = tmp[j].getValue(customerFld);
                    //nlapiLogExecution("debug","customer",customer +"==="+tmp[ j ].getValue( totalFld ));
                    c_leins[customer] = {
                        value: tmp[j].getValue(totalFld)
                    };
                }
                resultIndex = resultIndex + resultStep;
            } while (tmp.length > 0);


            nlapiLogExecution("debug", "c_leins Claim", JSON.stringify(c_leins));
            var estates_bill_states = {};
                      nlapiLogExecution("debug", "customers ", customers);

            if (parents && parents.length > 0) {
                var filters = [];
                filters = [
                    ["internalid", "anyof", parents]
                ];
                var bill_state_search = nlapiCreateSearch("customer", filters,
                    [
                        new nlobjSearchColumn("internalid", null, null),
                        new nlobjSearchColumn("custentity3", null, null)
                    ]
                ) || [];
                searchResults = bill_state_search.runSearch();
                nlapiLogExecution("debug", "First Search=" + searchResults);
                resultIndex = 0;
                resultStep = 1000, rowIndex = 1;
                tmp = [];
                do {
                    tmp = searchResults.getResults(resultIndex, resultIndex + resultStep);
                    for (var j = 0; j < tmp.length; j++) {
                        var id = parseInt(tmp[j].getValue('internalid'));
                        var billstate = tmp[j].getText('custentity3');
                      if(billstate)
                        estates_bill_states[id] = billstate;
                    }
                    resultIndex = resultIndex + resultStep;
                } while (tmp.length > 0);

            }
                    nlapiLogExecution("debug", "estates_bill_states",JSON.stringify(estates_bill_states));

            // ---------------------------------------------------------------
            var total_due_pres = [];
            var today = new Date();
            var reportSublist = form.addSubList('custpage_reportsublist', 'list', 'Borrowing Base');
            if (sel_action == null || sel_action == '' || sel_action == 1) {

                reportSublist.addField('custpage_invoice_num', 'text', 'Invoice Number', 'invoice_num').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_invoice_date', 'text', 'Date of Invoice', 'invoice_date').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_advance', 'text', 'Advance Amount', 'advance_amount').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_assignment', 'text', 'Assignment Amount', 'assign_amount').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_outstanding', 'text', 'Outstanding Invoice Amount', 'out_amount').setDisplayType('inline').setDisplaySize(50);
                //reportSublist.addField('custpage_estate_num', 'text', 'Estate Number', 'estate_num').setDisplayType('inline');
                //reportSublist.addField('custpage_customer_num', 'text', 'Customer Number', 'customer_num').setDisplayType('inline');
                reportSublist.addField('custpage_estate_name', 'text', 'Estate Name', 'estate_name').setDisplayType('inline').setDisplaySize(200);
                reportSublist.addField('custpage_customer_name', 'text', 'Customer Name', 'customer_name').setDisplayType('inline').setDisplaySize(200);
                reportSublist.addField('custpage_state', 'text', 'State', 'state').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_customer_advance', 'integer', 'Total Advanced to Customer Through This Invoice', '').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_estate_advance', 'integer', 'Total Advanced to Estate Through This Invoice', '').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_due', 'integer', 'Total Due to Customer From Estate Pre-Assignments', '').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_competitor', 'integer', 'Competitor Assignments Ahead of Invoice', '').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_net', 'integer', 'Net Size of Inheritance', '').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_borrowing_multi', 'text', 'Borrowing Base Multiple', '').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_borrowing_allowed', 'integer', 'Allowed Under Borrowing Base', '').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_prior', 'integer', 'Total Prior Probate Advance Fundings', '').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_ltv', 'integer', 'Ineligable - LTV', '').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_48m', 'integer', 'Ineligable - Aged>48M', '').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_cust_conc', 'integer', 'Ineligable - Cust Conc.', '').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_est_conc', 'integer', 'Ineligable - Est Conc.', '').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_holdback', 'text', 'Ineligable - Holdback', '').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_est_default', 'text', 'Ineligable - Est. Default', '').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_in_receivable', 'integer', 'Total Ineligable Receivable', '').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_el_receivable', 'integer', 'Eligible Receivable', '').setDisplayType('inline').setDisplaySize(50);
                reportSublist.addField('custpage_payment', 'float', 'Partial Payment', '').setDisplayType('inline').setDisplaySize(50);
                //, 'and',["customer.internalidnumber","equalto","602190"]
                search = nlapiCreateSearch("invoice",
                    [
                        ['amountremainingisabovezero', 'is', 'T'], 'and', ['mainline', 'is', 'T'],
                       // 'and',["customer.internalidnumber","equalto","602190"]
                    ],
                    [
                        new nlobjSearchColumn("internalid", null, null),
                        new nlobjSearchColumn("tranid", null, null),
                        new nlobjSearchColumn("trandate", null, null),
                        new nlobjSearchColumn("entity", null, null),
                        new nlobjSearchColumn("custbody_advance_size", null, null),
                        new nlobjSearchColumn("custbody_assignment_size", null, null),
                        new nlobjSearchColumn("custbody_assignment_size", null, null),
                        new nlobjSearchColumn("amountpaid", null, null),
                        new nlobjSearchColumn("amountremaining", null, null),
                        new nlobjSearchColumn("custbody_estimated_default", null, null),
                        new nlobjSearchColumn("custbody_holdback", null, null),

                        new nlobjSearchColumn("parent", 'customer', null),
                        new nlobjSearchColumn("entityid", 'customer', null),
                        new nlobjSearchColumn("billstate", 'customer', null),
                        new nlobjSearchColumn("custentity_specific_bequest_due_to_cust", 'customer', null),
                        new nlobjSearchColumn("custentity_advance_to_value_ratio", 'customer', null),
                        new nlobjSearchColumn("custentity_percent_estate_due_to_custome", 'customer', null),
                    ]
                ) || [];
                nlapiLogExecution("debug", "seventh Search=");
                var totals = [],
                    customer_advance = [],
                    estate_advance = [];
                searchResults = search.runSearch();
                resultIndex = 0;
                resultStep = 1000, rowIndex = 1;
                var invs = [];
                lines = [];
                do {
                    invs = searchResults.getResults(resultIndex, resultIndex + resultStep);
                    for (var j = 0; j < invs.length; j++) {
                        var id = invs[j].getValue('internalid');
                        //nlapiLogExecution( "debug", "id" ,id);
                        var customer = invs[j].getValue('entity');
                        var estate = invs[j].getValue('parent', 'customer');
                        estate = estate.toString();
                        // calc Total Due to Customer From Estate Pre-Assignments

						if ( !( customer in total_due_pres ) ) {
							specific_bequests_due_to_heir = estates[ estate ].duetoheir;//getValue('custentity_specific_bequests_due_to_heir');
							specific_bequest_due_to_cust = invs[ j ].getValue( 'custentity_specific_bequest_due_to_cust', 'customer' );	//customer
							advance_to_value_ratio = invs[ j ].getValue( 'custentity_advance_to_value_ratio', 'customer' );				//customer
                     //     nlapiLogExecution("debug","Customer", 'advance_to_value_ratio = '+advance_to_value_ratio);
							percent_estate_due_to_custome = invs[ j ].getValue( 'custentity_percent_estate_due_to_custome', 'customer' );	//customer


							if ( specific_bequests_due_to_heir == "" || specific_bequests_due_to_heir == null ) specific_bequests_due_to_heir = 0;
							if ( specific_bequest_due_to_cust == "" || specific_bequest_due_to_cust == null ) specific_bequest_due_to_cust = 0;
							if ( advance_to_value_ratio == "" || advance_to_value_ratio == null )
								advance_to_value_ratio = 33;
							else
								advance_to_value_ratio = parseFloat( advance_to_value_ratio );
							//nlapiLogExecution("debug","Customer", 'advance_to_value_ratio = '+advance_to_value_ratio);

							if ( percent_estate_due_to_custome == "" || percent_estate_due_to_custome == null )
								percent_estate_due_to_custome = 100;
							else
								percent_estate_due_to_custome = parseFloat( percent_estate_due_to_custome );

						//	nlapiLogExecution("debug","Customer", 'Customer = '+customer);
						//	nlapiLogExecution("debug","Calcing", 'specific_bequests_due_to_heir='+specific_bequests_due_to_heir+', specific_bequest_due_to_cust='+specific_bequest_due_to_cust+', advance_to_value_ratio='+advance_to_value_ratio+', percent_estate_due_to_custome='+percent_estate_due_to_custome);

							if ( estate in properties ) {
								property_sum = properties[ estate ].total;
							} else {
								property_sum = 0;
							}
							if ( estate in assets )
								asset_sum = assets[ estate ].value;
							else
								asset_sum = 0;

							if ( estate in claims )
								claim_sum = claims[ estate ].value;
							else
								claim_sum = 0;

							if ( customer in e_leins )//e_leins
								lein_sum = c_leins[ customer ].value;
							else
								lein_sum = 0;

						//	nlapiLogExecution("debug","Calcing", 'property_sum='+property_sum+', asset_sum='+asset_sum+', claim_sum='+claim_sum+', lein_sum='+lein_sum);

							attorneyFee = parseInt( ( parseInt( property_sum ) + parseInt( asset_sum ) ) * 0.06 );
							if ( attorneyFee < 3000 ) attorneyFee = 3000;
                            var assign_sun=assign_properties[estate]||0;
                           //nlapiLogExecution("debug","assign_sun", assign_sun);
							net_equity_value = parseInt( property_sum ) + parseInt( asset_sum ) - parseInt( claim_sum ) - parseInt( specific_bequests_due_to_heir ) - parseInt( parseInt( assign_sun ) * 0.06 ) - parseInt( attorneyFee );
							residue_equity_due = parseInt( net_equity_value * percent_estate_due_to_custome / 100 );
							total_due = parseInt( residue_equity_due ) + parseInt( specific_bequest_due_to_cust );
							total_due_pres[ customer ] = parseInt( total_due ) - parseInt( lein_sum );
							total_due_pre = total_due_pres[ customer ];
						} else
							total_due_pre = total_due_pres[ customer ];

						//nlapiLogExecution("debug","Calcing", 'attorneyFee='+attorneyFee+', net_equity_value='+net_equity_value+', residue_equity_due='+residue_equity_due+', total_due='+total_due+', total_due_pres[ customer ]='+total_due_pres[ customer ]+', total_due_pre='+total_due_pre);
						// nlapiLogExecution("debug","total_due_pre", total_due_pres+'>>>>>>>'+total_due_pre);

						// calc total of customer advance, old of customer advance 
						if ( !( customer in customer_advance ) ) {
							old_advance = 0;
							customer_advance[ customer ] = parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );
						} else {
							old_advance = parseInt( customer_advance[ customer ] );
							customer_advance[ customer ] = parseInt( customer_advance[ customer ] ) + parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );
						}
						// calc total of estate advance
						if ( !( estate in estate_advance ) ) {
							estate_advance[ estate ] = parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );
						} else
							estate_advance[ estate ] = parseInt( estate_advance[ estate ] ) + parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );

						competitor_sum = 0;
						var leinAmount=0;
                        if (customer in c_existing_assignments1) {
                            sel_priority = 0;
                            /*
                            	for ( var i in c_existing_assignments[ customer ] ) {
                            		assign_invoice = Math.abs( c_existing_assignments[ customer ][ i ].invoice );
                            		assign_priority = Math.abs( c_existing_assignments[ customer ][ i ].priority );
                            		if ( assign_invoice == id && assign_invoice ) {
                            			sel_priority = assign_priority;
                            			//nlapiLogExecution("debug","Calcing", 'assign_invoice='+assign_invoice+', assign_priority='+assign_priority+', sel_priority='+sel_priority);
                            		}
                            	}*/
                            //nlapiLogExecution("debug","Calcing", 'sel_priority = '+sel_priority);

                            var invoiceDate = "";

                            for (var ii in c_existing_assignments1[customer]) {
                                //nlapiLogExecution("debug","ii", ii);
                                assign_invoice1 = Math.abs(c_existing_assignments1[customer][ii].invoice);
                                assign_priority1 = Math.abs(c_existing_assignments1[customer][ii].priority);
                                assign_date1 = c_existing_assignments1[customer][ii].date;
                                assign_amount1 = Math.abs(c_existing_assignments1[customer][ii].amount);
                                assign_name1 = c_existing_assignments1[customer][ii].name;
                                customer_lein1 = c_existing_assignments1[customer][ii].customer;


                                if (assign_invoice1 && assign_invoice1 == id) {
                                    invoiceDate = assign_date1;

                                    /*if(customer_lein1=="602190")
                                    {
                                    	nlapiLogExecution("debug","invoiceDate", invoiceDate);
                                    	nlapiLogExecution("debug","assign_invoice1", assign_invoice1);
                                    }*/

                                    for (var i in c_existing_assignments1[customer]) {

                                        //nlapiLogExecution("debug","i", i);
                                        //nlapiLogExecution("debug", "c_existing_assignments1[ customer ][ i ].name", c_existing_assignments1[customer][i].name)
                                       // nlapiLogExecution("debug", "c_existing_assignments1[ customer ][ i ].amount", c_existing_assignments1[customer][i].amount)

                                        assign_invoice = Math.abs(c_existing_assignments1[customer][i].invoice);
                                        assign_priority = Math.abs(c_existing_assignments1[customer][i].priority);
                                        assign_date = c_existing_assignments1[customer][i].date;
                                        assign_amount = parseFloat(c_existing_assignments1[customer][i].amount); ///Math.abs( c_existing_assignments1[ customer ][ i ].amount )
                                        assign_name = c_existing_assignments1[customer][i].name;
                                        customer_lein = c_existing_assignments1[customer][i].customer;

                                        /*	
                                        g1 = new Date( assign_date );
                                        g2 = new Date( invs[ j ].getValue( 'trandate' ) );
                                        */

                                        if (new Date(invoiceDate) >= new Date(assign_date) && !assign_invoice && assign_name.indexOf("Probate") < 0 && !assign_name.match(/PA #/i) && !assign_name.match(/PA /i) && !assign_name.match(/PA\d/i) && !assign_name.match(/^PA$/i) && !assign_name.match(/^Probate/i)) {
                                            /*if(customer_lein1=="602190")
								{
									nlapiLogExecution("debug","assign_amount", assign_amount);
								}*/
											
											competitor_sum += assign_amount;
											//break;
										}
		/*
										if ( sel_priority && sel_priority >= assign_priority && !assign_invoice && assign_name.indexOf("Probate Advance")<0) {
											
											competitor_sum += assign_amount;
											//nlapiLogExecution("debug","Calcing", 'assign_invoice='+assign_invoice+', assign_priority='+assign_priority+', sel_priority='+sel_priority+', competitor_sum='+competitor_sum+', assign_amount='+assign_amount);
										} else
											if ( !sel_priority && g2.getTime() > g1.getTime() && !assign_invoice && assign_name.indexOf("Probate Advance")<0) {
												
												competitor_sum += assign_amount;
												
												//nlapiLogExecution("debug","Calcing", 'assign_invoice='+assign_invoice+', g2='+g2.getTime()+', g1='+g1.getTime()+', sel_priority='+sel_priority+', competitor_sum='+competitor_sum+', assign_amount='+assign_amount);
											}*/
									}
									//break;
								}
						}
							}
                        if (c_leins[invs[j].getValue('entity')]) {
                            leinAmount = c_leins[invs[j].getValue('entity')].value;
                            competitor_sum = Number(competitor_sum) + Number(leinAmount);
                        }


						//calc Net Size of Inheritance
						net_size = total_due_pre - competitor_sum;
						//calc allowed
						borrowing_allowed = parseInt( net_size * 0.6 );
						//calc ltv
						ltv_val = parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );
						ltv_val = ltv_val - Math.min( ltv_val, borrowing_allowed - old_advance );
						//calc 48M
						var invoice_date = new Date( invs[ j ].getValue( 'trandate' ) );
						var diff_time = today.getTime() - invoice_date.getTime();
						var diff_days = diff_time / ( 1000 * 3600 * 24 );
						if ( diff_days > 1460 )
							val_48M = invs[ j ].getValue( 'custbody_advance_size' )
						else
							val_48M = 0;

						//calc conc
						cust_conc = Math.min( Math.max( 0, customer_advance[ customer ] - 500000 ), parseInt( invs[ j ].getValue( 'custbody_advance_size' ) ) );
						est_conc = Math.min( Math.max( 0, estate_advance[ estate ] - 1000000 ), parseInt( invs[ j ].getValue( 'custbody_advance_size' ) ) );

						if ( invs[ j ].getValue( 'custbody_estimated_default' ) == '' || invs[ j ].getValue( 'custbody_estimated_default' ) == null )
							estimated_defaul = 0;
						else
							estimated_defaul = invs[ j ].getValue( 'custbody_estimated_default' );

						in_rcv = Math.max( ltv_val, estimated_defaul );
						//el_rcv = parseInt( invs[ j ].getValue( 'custbody_advance_size' ) ) - in_rcv;
						
						/////// Update in eligible Invoice Amount ////////
						
                        if (Number(invs[j].getValue('amountremaining')) < Math.max(0, Number(invs[j].getValue('custbody_advance_size')) - Number(in_rcv))) {
                            el_rcv = Number(invs[j].getValue('amountremaining'));
                        } else {
                            el_rcv = Math.max(0, Number(invs[j].getValue('custbody_advance_size')) - Number(in_rcv))
                        }
                        if (el_rcv < 0) el_rcv = 0;


                        if (isNaN(customer_advance[customer])) {
                            //nlapiLogExecution("debug","Test 12",customer_advance[ customer ]);
                            customer_advance[customer] = 0;
                        }
                        if (isNaN(estate_advance[estate])) {
                            //nlapiLogExecution("debug","Test 12",customer_advance[ customer ]);
                            estate_advance[estate] = 0;
                        }
                        if (isNaN(ltv_val)) {
                            //nlapiLogExecution("debug","Test 12",customer_advance[ customer ]);
                            ltv_val = 0;
                        }
                        if (isNaN(cust_conc)) {
                            //nlapiLogExecution("debug","Test 12",customer_advance[ customer ]);
                            cust_conc = 0;
                        }

                        if (isNaN(est_conc)) {
                            //nlapiLogExecution("debug","Test 12",customer_advance[ customer ]);
                            est_conc = 0;
                        }

                        if (isNaN(in_rcv)) {
                            //nlapiLogExecution("debug","Test 12",customer_advance[ customer ]);
                            in_rcv = 0;
                        }

                        if (isNaN(el_rcv)) {
                            //nlapiLogExecution("debug","Test 12",customer_advance[ customer ]);
                            el_rcv = 0;
                        }

                        if (isNaN(val_48M)) {
                            //nlapiLogExecution("debug","Test 12",customer_advance[ customer ]);
                            val_48M = 0;
                        }

                        if (isNaN(old_advance)) {
                            //nlapiLogExecution("debug","Test 12",customer_advance[ customer ]);
                            old_advance = 0;
                        }

                        if (isNaN(borrowing_allowed)) {
                            //nlapiLogExecution("debug","Test 12",customer_advance[ customer ]);
                            borrowing_allowed = 0;
                        }

                        if (isNaN(total_due_pre)) {
                            //nlapiLogExecution("debug","Test 12",customer_advance[ customer ]);
                            total_due_pre = 0;
                        }


                        if (isNaN(net_size)) {
                            //nlapiLogExecution("debug","Test 12",customer_advance[ customer ]);
                            net_size = 0;
                        }
                        var estateId = invs[j].getValue('parent', 'customer');
                        var billingstate=estates_bill_states[estateId] ? estates_bill_states[estateId] : '';
                      nlapiLogExecution("debug","billingstate",billingstate+'///'+estateId);

                        //Set LineItem
                        lines.push({
                            custpage_invoice_num: invs[j].getValue('tranid'),
                            custpage_invoice_date: invs[j].getValue('trandate'),
                            //reportSublist.setLineItemValue('custpage_customer_num', rowIndex,  invs[j].getValue('entityid', 'customer'));
                            custpage_estate_name: invs[j].getText('parent', 'customer'),
                            custpage_customer_name: invs[j].getText('entity'),
                            custpage_state: billingstate, //invs[ j ].getText( 'billstate', 'customer' ),
                            custpage_advance: invs[j].getValue('custbody_advance_size'),
                            custpage_assignment: invs[j].getValue('custbody_assignment_size'),
                            custpage_outstanding: invs[j].getValue('amountremaining'),
                            custpage_customer_advance: Math.floor(customer_advance[customer]).toFixed(0),
                            custpage_estate_advance: Math.floor(estate_advance[estate]).toFixed(0),
                            custpage_net: Math.floor(net_size).toFixed(0),
                            custpage_due: Math.floor(total_due_pre).toFixed(0),
                            custpage_competitor: competitor_sum.toFixed(0),
                            custpage_borrowing_multi: '60%',
                            custpage_borrowing_allowed: Math.floor(borrowing_allowed).toFixed(0),
                            custpage_prior: Math.floor(old_advance).toFixed(0),
                            custpage_ltv: Math.floor(ltv_val).toFixed(0) != NaN ? Math.floor(ltv_val).toFixed(0) : 0,
                            custpage_48m: Math.floor(val_48M).toFixed(0),
                            custpage_cust_conc: Math.floor(cust_conc).toFixed(0),
                            custpage_est_conc: Math.floor(est_conc).toFixed(0),
                            custpage_holdback: invs[j].getValue('custbody_holdback'),
                            custpage_est_default: invs[j].getValue('custbody_estimated_default'),
                            custpage_in_receivable: Math.floor(in_rcv).toFixed(0),
                            custpage_el_receivable: Math.floor(el_rcv).toFixed(0),
                            custpage_payment: invs[j].getValue('amountpaid')
                        });
                        rowIndex++;
                    }
                    resultIndex = resultIndex + resultStep;
                } while (invs.length > 0);
                reportSublist.setLineItemValues(lines);
            } else
            if (sel_action == 2) {
                reportSublist.addField('custpage_estate_name', 'text', 'Estate Name', 'estate_name').setDisplayType('inline').setDisplaySize(200);
                reportSublist.addField('custpage_customer_name', 'text', 'Customer Name', 'customer_name').setDisplayType('inline').setDisplaySize(200);
                reportSublist.addField('custpage_state', 'text', 'State', 'state').setDisplayType('inline');
                reportSublist.addField('custpage_assignment', 'float', 'Assignment Amount', 'assign_amount').setDisplayType('inline');
                reportSublist.addField('custpage_outstanding', 'float', 'Outstanding Amount', 'out_amount').setDisplayType('inline');
                reportSublist.addField('custpage_customer_advance', 'integer', 'Total Advanced to Customer', '').setDisplayType('inline');
                reportSublist.addField('custpage_estate_advance', 'integer', 'Total Advanced to Estate', '').setDisplayType('inline');
                reportSublist.addField('custpage_due', 'integer', 'Total Due to Customer From Estate Pre-Assignments', '').setDisplayType('inline');
                reportSublist.addField('custpage_competitor', 'integer', 'Competitor Assignments Ahead of Invoice', '').setDisplayType('inline');
                reportSublist.addField('custpage_net', 'integer', 'Net Size of Inheritance', '').setDisplayType('inline');
                reportSublist.addField('custpage_borrowing_multi', 'text', 'Borrowing Base Multiple', '').setDisplayType('inline');
                reportSublist.addField('custpage_borrowing_allowed', 'integer', 'Allowed Under Borrowing Base', '').setDisplayType('inline');
                reportSublist.addField('custpage_prior', 'integer', 'Total Prior Probate Advance Fundings', '').setDisplayType('inline');
                reportSublist.addField('custpage_ltv', 'integer', 'Ineligable - LTV', '').setDisplayType('inline');
                reportSublist.addField('custpage_48m', 'integer', 'Ineligable - Aged>48M', '').setDisplayType('inline');
                reportSublist.addField('custpage_cust_conc', 'integer', 'Ineligable - Cust Conc.', '').setDisplayType('inline');
                reportSublist.addField('custpage_est_conc', 'integer', 'Ineligable - Est Conc', '').setDisplayType('inline');
                reportSublist.addField('custpage_holdback', 'integer', 'Ineligable - Holdback', '').setDisplayType('inline');
                reportSublist.addField('custpage_est_default', 'integer', 'Ineligable - Est. Default', '').setDisplayType('inline');
                reportSublist.addField('custpage_in_receivable', 'integer', 'Total Ineligable Receivable', '').setDisplayType('inline');
                reportSublist.addField('custpage_el_receivable', 'integer', 'Eligible Receivable', '').setDisplayType('inline');
                reportSublist.addField('custpage_payment', 'float', 'Partial Payment', '').setDisplayType('inline');

                search = nlapiCreateSearch("invoice",
                    [
                        ['amountremainingisabovezero', 'is', 'T'], 'and', ['mainline', 'is', 'T']
                    ],
                    [
                        new nlobjSearchColumn("internalid", null, null),
                        new nlobjSearchColumn("tranid", null, null),
                        new nlobjSearchColumn("trandate", null, null),
                        new nlobjSearchColumn("entity", null, null),
                        new nlobjSearchColumn("custbody_advance_size", null, null),
                        new nlobjSearchColumn("custbody_assignment_size", null, null),
                        new nlobjSearchColumn("custbody_assignment_size", null, null),
                        new nlobjSearchColumn("amountpaid", null, null),
                        new nlobjSearchColumn("amountremaining", null, null),
                        new nlobjSearchColumn("custbody_estimated_default", null, null),
                        new nlobjSearchColumn("custbody_holdback", null, null),

                        new nlobjSearchColumn("parent", 'customer', null),
                        new nlobjSearchColumn("entityid", 'customer', null),
                        new nlobjSearchColumn("billstate", 'customer', null),
                        new nlobjSearchColumn("custentity_specific_bequest_due_to_cust", 'customer', null),
                        new nlobjSearchColumn("custentity_advance_to_value_ratio", 'customer', null),
                        new nlobjSearchColumn("custentity_percent_estate_due_to_custome", 'customer', null),
                    ]
                ) || [];

                var totals = [],
                    customer_advance = [],
                    estate_advance = [];
                searchResults = search.runSearch();
                nlapiLogExecution("debug", "8 Search=");
                resultIndex = 0;
                resultStep = 1000, rowIndex = 1;
                var invs = [];
                do {
                    invs = searchResults.getResults(resultIndex, resultIndex + resultStep);
                    for (var j = 0; j < invs.length; j++) {
                        var id = invs[j].getValue('internalid');
                        var customer = invs[j].getValue('entity');
                        var estate = invs[j].getValue('parent', 'customer');
                        estate = estate.toString();

							// calc Total Due to Customer From Estate Pre-Assignments
							if ( !( customer in total_due_pres ) ) {
								specific_bequests_due_to_heir = estates[ estate ].duetoheir;//getValue('custentity_specific_bequests_due_to_heir');
								specific_bequest_due_to_cust = invs[ j ].getValue( 'custentity_specific_bequest_due_to_cust', 'customer' );	//customer
								advance_to_value_ratio = invs[ j ].getValue( 'custentity_advance_to_value_ratio', 'customer' );	//customer
								percent_estate_due_to_custome = invs[ j ].getValue( 'custentity_percent_estate_due_to_custome', 'customer' );	//customer

								if ( specific_bequests_due_to_heir == "" || specific_bequests_due_to_heir == null ) specific_bequests_due_to_heir = 0;
								if ( specific_bequest_due_to_cust == "" || specific_bequest_due_to_cust == null ) specific_bequest_due_to_cust = 0;
								if ( advance_to_value_ratio == "" || advance_to_value_ratio == null )
									advance_to_value_ratio = 33;
								else
									advance_to_value_ratio = parseFloat( advance_to_value_ratio );

								if ( percent_estate_due_to_custome == "" || percent_estate_due_to_custome == null )
									percent_estate_due_to_custome = 100;
								else
									percent_estate_due_to_custome = parseFloat( percent_estate_due_to_custome );

								if ( estate in properties ) {
									property_sum = properties[ estate ].total;
								} else {
									property_sum = 0;
								}
								if ( estate in assets )
									asset_sum = assets[ estate ].value;
								else
									asset_sum = 0;

								if ( estate in claims )
									claim_sum = claims[ estate ].value;
								else
									claim_sum = 0;

								if ( customer in e_leins )//e_leins
									lein_sum = c_leins[ customer ].value;
								else
									lein_sum = 0;

								attorneyFee = parseInt( ( parseInt( property_sum ) + parseInt( asset_sum ) ) * 0.06 );
								if ( attorneyFee < 3000 ) attorneyFee = 3000;

								net_equity_value = parseInt( property_sum ) + parseInt( asset_sum ) - parseInt( claim_sum ) - parseInt( specific_bequests_due_to_heir ) - parseInt( parseInt( property_sum ) * 0.06 ) - parseInt( attorneyFee );
								residue_equity_due = parseInt( net_equity_value * percent_estate_due_to_custome / 100 );
								total_due = parseInt( residue_equity_due ) + parseInt( specific_bequest_due_to_cust );
								total_due_pres[ customer ] = parseInt( total_due ) - parseInt( lein_sum );
								total_due_pre = total_due_pres[ customer ];
							} else
								total_due_pre = total_due_pres[ customer ];

							// calc total of customer advance, old of customer advance 
							if ( !( customer in customer_advance ) ) {
								old_advance = 0;
								customer_advance[ customer ] = parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );
							} else {
								old_advance = parseInt( customer_advance[ customer ] );
								customer_advance[ customer ] = parseInt( customer_advance[ customer ] ) + parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );
							}
							// calc total of estate advance
							if ( !( estate in estate_advance ) ) {
								estate_advance[ estate ] = parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );
							} else
								estate_advance[ estate ] = parseInt( estate_advance[ estate ] ) + parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );

							competitor_sum = 0;
							if ( customer in c_existing_assignments ) {
								sel_priority = 0;
								for ( var i in c_existing_assignments[ customer ] ) {
									assign_invoice = Math.abs( c_existing_assignments[ customer ][ i ].invoice );
									assign_priority = Math.abs( c_existing_assignments[ customer ][ i ].priority );
									if ( assign_invoice == id && assign_invoice ) {
										sel_priority = assign_priority;
									}
								}
								//nlapiLogExecution("debug","Calcing", 'sel_priority = '+sel_priority);
								for ( var i in c_existing_assignments[ customer ] ) {
									assign_invoice = Math.abs( c_existing_assignments[ customer ][ i ].invoice );
									assign_priority = Math.abs( c_existing_assignments[ customer ][ i ].priority );
									assign_date = Math.abs( c_existing_assignments[ customer ][ i ].date );
									assign_amount = Math.abs( c_existing_assignments[ customer ][ i ].amount );

									g1 = new Date( assign_date );
									g2 = new Date( invs[ j ].getValue( 'trandate' ) );

									//if ( sel_priority && sel_priority > assign_priority && !assign_invoice ) {
										//competitor_sum += assign_amount;
									//} else !sel_priority && 
										if (g2.getTime() > g1.getTime() && !assign_invoice ) {
											competitor_sum += assign_amount;
										}
								}
								//nlapiLogExecution("debug","Calcing", 'competitor_sum = '+competitor_sum);
							}

							//calc Net Size of Inheritance
							net_size = total_due_pre - competitor_sum;
							//calc allowed
							borrowing_allowed = parseInt( net_size * 0.6 );
							//calc ltv
							ltv_val = parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );
							ltv_val = ltv_val - Math.min( ltv_val, borrowing_allowed - old_advance );
							//calc 48M
							var invoice_date = new Date( invs[ j ].getValue( 'trandate' ) );
							var diff_time = today.getTime() - invoice_date.getTime();
							var diff_days = diff_time / ( 1000 * 3600 * 24 );
							if ( diff_days > 1460 )
								val_48M = invs[ j ].getValue( 'custbody_advance_size' )
							else
								val_48M = 0;
							//nlapiLogExecution("debug","customer_advance",customer_advance[customer]+'<>>>>'+invs[j].getValue('custbody_advance_size'));

							//calc conc
							cust_conc = Math.min( Math.max( 0, customer_advance[ customer ] - 350000 ), parseInt( invs[ j ].getValue( 'custbody_advance_size' ) ) );
							est_conc = Math.min( Math.max( 0, estate_advance[ estate ] - 600000 ), parseInt( invs[ j ].getValue( 'custbody_advance_size' ) ) );
							//nlapiLogExecution("debug","Calcing",Math.max(0, customer_advance[customer]-500000)+'>>>>>'+parseInt(invs[j].getValue('custbody_advance_size')));

							if ( invs[ j ].getValue( 'custbody_estimated_default' ) == '' || invs[ j ].getValue( 'custbody_estimated_default' ) == null )
								estimated_defaul = 0;
							else
								estimated_defaul = invs[ j ].getValue( 'custbody_estimated_default' );

							in_rcv = Math.max( ltv_val, estimated_defaul );
							el_rcv = parseInt( invs[ j ].getValue( 'custbody_advance_size' ) ) - in_rcv;
							if ( el_rcv < 0 ) el_rcv = 0;

                        if (!(customer in totals)) {
                            totals[customer] = {
                                name: invs[j].getText('entity'),
                                estate: invs[j].getText('parent', 'customer'),
                                estateId:invs[j].getValue('parent', 'customer'),
                                state: invs[j].getText('billstate', 'customer'),
                                outstanding: invs[j].getValue('amountremaining'),
                                assign: (invs[j].getValue('custbody_assignment_size') ? invs[j].getValue('custbody_assignment_size') : 0),
                                customer_advance: customer_advance[customer],
                                estate_advance: estate_advance[estate],
                                net: net_size,
                                due: total_due_pre,
                                competitor: competitor_sum,
                                borrowing_allowed: borrowing_allowed,
                                prior: '',
                                ltv: ltv_val,
                                four_val: val_48M,
                                cust_conc: cust_conc,
                                est_conc: est_conc,
                                holdback: (invs[j].getValue('custbody_holdback') ? invs[j].getValue('custbody_holdback') : 0),
                                estimated_defaul: (invs[j].getValue('custbody_estimated_default') ? invs[j].getValue('custbody_estimated_default') : 0),
                                in_rcv: in_rcv,
                                el_rcv: el_rcv,
                                payment: invs[j].getValue('amountpaid')
                            };
                        } else {
                            totals[customer].outstanding = parseFloat(totals[customer].outstanding) + parseFloat(invs[j].getValue('amountremaining'));
                            totals[customer].assign = parseInt(totals[customer].assign) + parseInt((invs[j].getValue('custbody_assignment_size') ? invs[j].getValue('custbody_assignment_size') : 0));
                            totals[customer].customer_advance = customer_advance[customer];
                            totals[customer].estate_advance = estate_advance[estate];
                            totals[customer].net = parseInt(totals[customer].net) + parseInt(net_size);
                            totals[customer].due = parseInt(totals[customer].due) + parseInt(total_due_pre);
                            totals[customer].competitor = parseInt(totals[customer].competitor) + parseInt(competitor_sum);
                            totals[customer].borrowing_allowed = parseInt(totals[customer].borrowing_allowed) + parseInt(borrowing_allowed);
                            totals[customer].ltv = parseInt(totals[customer].ltv) + parseInt(ltv_val);
                            totals[customer].four_val = parseInt(totals[customer].four_val) + parseInt(val_48M);
                            totals[customer].cust_conc = parseInt(totals[customer].cust_conc) + parseInt(cust_conc);
                            totals[customer].est_conc = parseInt(totals[customer].est_conc) + parseInt(est_conc);
                            totals[customer].holdback = parseInt(totals[customer].holdback) + parseInt((invs[j].getValue('custbody_estimated_default') ? invs[j].getValue('custbody_estimated_default') : 0));
                            totals[customer].estimated_defaul = parseInt(totals[customer].estimated_defaul) + parseInt((invs[j].getValue('custbody_estimated_default') ? invs[j].getValue('custbody_estimated_default') : 0));
                            totals[customer].in_rcv = parseInt(totals[customer].in_rcv) + parseInt(in_rcv);
                            totals[customer].el_rcv = parseInt(totals[customer].el_rcv) + parseInt(el_rcv);
                            totals[customer].payment = parseFloat(totals[customer].payment) + parseFloat(invs[j].getValue('amountpaid'));
                        }
                    }
                    resultIndex = resultIndex + resultStep;
                } while (invs.length > 0);

                for (var c in totals) {
                    var estateId = totals[c].estateId;
                    var billingstate=estates_bill_states[estateId] ? estates_bill_states[estateId] : '';
          
                    //Set LineItem
                    if (totals[c].estate)
                        reportSublist.setLineItemValue('custpage_estate_name', rowIndex, totals[c].estate);
                    if (totals[c].name)
                        reportSublist.setLineItemValue('custpage_customer_name', rowIndex, totals[c].name);
                  //  if (totals[c].state)
                    //    reportSublist.setLineItemValue('custpage_state', rowIndex, totals[c].state);
                    if(billingstate)
                    reportSublist.setLineItemValue('custpage_state', rowIndex, billingstate);

                    
                    if (totals[c].outstanding)
                        reportSublist.setLineItemValue('custpage_outstanding', rowIndex, totals[c].outstanding);
                    if (totals[c].assign)
                        reportSublist.setLineItemValue('custpage_assignment', rowIndex, totals[c].assign);
                    nlapiLogExecution("debug", "customer_adv", totals[c].customer_advance);
                    if (totals[c].customer_advance) {

                        reportSublist.setLineItemValue('custpage_customer_advance', rowIndex, Math.floor(totals[c].customer_advance).toFixed(0));
                    }
                    if (totals[c].estate_advance)
                        reportSublist.setLineItemValue('custpage_estate_advance', rowIndex, Math.floor(totals[c].estate_advance).toFixed(0));
                    if (totals[c].net)
                        reportSublist.setLineItemValue('custpage_net', rowIndex, Math.floor(totals[c].net).toFixed(0));
                    if (totals[c].due)
                        reportSublist.setLineItemValue('custpage_due', rowIndex, Math.floor(totals[c].due).toFixed(0));
                    if (totals[c].competitor)
                        reportSublist.setLineItemValue('custpage_competitor', rowIndex, Math.floor(totals[c].competitor).toFixed(0));
                    reportSublist.setLineItemValue('custpage_borrowing_multi', rowIndex, '60%');
                    if (totals[c].borrowing_allowed)
                        reportSublist.setLineItemValue('custpage_borrowing_allowed', rowIndex, Math.floor(totals[c].borrowing_allowed).toFixed(0));
                    reportSublist.setLineItemValue('custpage_prior', rowIndex, Math.floor(0).toFixed(0));
                    if (totals[c].ltv)
                        reportSublist.setLineItemValue('custpage_ltv', rowIndex, Math.floor(totals[c].ltv).toFixed(0));
                    if (totals[c].four_val)
                        reportSublist.setLineItemValue('custpage_48m', rowIndex, Math.floor(totals[c].four_val).toFixed(0));
                    if (totals[c].cust_conc)
                        reportSublist.setLineItemValue('custpage_cust_conc', rowIndex, Math.floor(totals[c].cust_conc).toFixed(0));
                    if (totals[c].est_conc)
                        reportSublist.setLineItemValue('custpage_est_conc', rowIndex, Math.floor(totals[c].est_conc).toFixed(0));
                    if (totals[c].holdback)
                        reportSublist.setLineItemValue('custpage_holdback', rowIndex, Math.floor(totals[c].holdback).toFixed(0));
                    if (totals[c].estimated_defaul)
                        reportSublist.setLineItemValue('custpage_est_default', rowIndex, Math.floor(totals[c].estimated_defaul).toFixed(0));
                    if (totals[c].in_rcv)
                        reportSublist.setLineItemValue('custpage_in_receivable', rowIndex, Math.floor(totals[c].in_rcv).toFixed(0));
                    if (totals[c].el_rcv)
                        reportSublist.setLineItemValue('custpage_el_receivable', rowIndex, Math.floor(totals[c].el_rcv).toFixed(0));
                    if (totals[c].payment)
                        reportSublist.setLineItemValue('custpage_payment', rowIndex, totals[c].payment);

						rowIndex++;
					}

				} else
					if ( sel_action == 3 ) {
						reportSublist.addField( 'custpage_estate_name', 'text', 'Estate Name', 'estate_name' ).setDisplayType( 'inline' ).setDisplaySize( 200 );
						reportSublist.addField( 'custpage_state', 'text', 'state', 'state' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_assignment', 'float', 'Assignment Amount', 'assign_amount' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_outstanding', 'float', 'Outstanding Amount', 'out_amount' ).setDisplayType( 'inline' );
						//reportSublist.addField('custpage_customer_advance', 'text', 'Total Advanced to Customer', '').setDisplayType('inline');
						reportSublist.addField( 'custpage_estate_advance', 'integer', 'Total Advanced to Estate', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_due', 'integer', 'Total Due to Customer From Estate Pre-Assignments', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_competitor', 'integer', 'Competitor Assignments Ahead of Invoice', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_net', 'integer', 'Net Size of Inheritance', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_borrowing_multi', 'text', 'Borrowing Base Multiple', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_borrowing_allowed', 'integer', 'Allowed Under Borrowing Base', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_prior', 'integer', 'Total Prior Probate Advance Fundings', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_ltv', 'integer', 'Ineligable - LTV', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_48m', 'integer', 'Ineligable - Aged>48M', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_cust_conc', 'integer', 'Ineligable - Cust Conc.', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_est_conc', 'integer', 'Ineligable - Est Conc', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_holdback', 'integer', 'Ineligable - Holdback', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_est_default', 'integer', 'Ineligable - Est. Default', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_in_receivable', 'integer', 'Total Ineligable Receivable', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_el_receivable', 'integer', 'Eligible Receivable', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_payment', 'float', 'Partial Payment', '' ).setDisplayType( 'inline' );

                search = nlapiCreateSearch("invoice",
                    [
                        ['amountremainingisabovezero', 'is', 'T'], 'and', ['mainline', 'is', 'T']
                    ],
                    [
                        new nlobjSearchColumn("internalid", null, null),
                        new nlobjSearchColumn("tranid", null, null),
                        new nlobjSearchColumn("trandate", null, null),
                        new nlobjSearchColumn("entity", null, null),
                        new nlobjSearchColumn("custbody_advance_size", null, null),
                        new nlobjSearchColumn("custbody_assignment_size", null, null),
                        new nlobjSearchColumn("custbody_assignment_size", null, null),
                        new nlobjSearchColumn("amountpaid", null, null),
                        new nlobjSearchColumn("amountremaining", null, null),
                        new nlobjSearchColumn("custbody_estimated_default", null, null),
                        new nlobjSearchColumn("custbody_holdback", null, null),

								new nlobjSearchColumn( "parent", 'customer', null ),
								new nlobjSearchColumn( "entityid", 'customer', null ),
								new nlobjSearchColumn( "billstate", 'customer', null ),
								new nlobjSearchColumn( "custentity_specific_bequest_due_to_cust", 'customer', null ),
								new nlobjSearchColumn( "custentity_advance_to_value_ratio", 'customer', null ),
								new nlobjSearchColumn( "custentity_percent_estate_due_to_custome", 'customer', null ),
							]
						) || [];

                var totals = [],
                    customer_advance = [],
                    estate_advance = [];
                searchResults = search.runSearch();
                nlapiLogExecution("debug", "9 Search=");
                resultIndex = 0;
                resultStep = 1000, rowIndex = 1;
                var invs = [];
                do {
                    invs = searchResults.getResults(resultIndex, resultIndex + resultStep);
                    for (var j = 0; j < invs.length; j++) {
                        var id = invs[j].getValue('internalid');
                        var customer = invs[j].getValue('entity');
                        var estate = invs[j].getValue('parent', 'customer');
                        estate = estate.toString();
                        // calc Total Due to Customer From Estate Pre-Assignments
                        if (!(customer in total_due_pres)) {
                            specific_bequests_due_to_heir = estates[estate].duetoheir; //estates[estate].getValue('custentity_specific_bequests_due_to_heir');
                            specific_bequest_due_to_cust = invs[j].getValue('custentity_specific_bequest_due_to_cust', 'customer'); //customer
                            advance_to_value_ratio = invs[j].getValue('custentity_advance_to_value_ratio', 'customer'); //customer
                            percent_estate_due_to_custome = invs[j].getValue('custentity_percent_estate_due_to_custome', 'customer'); //customer

									if ( specific_bequests_due_to_heir == "" || specific_bequests_due_to_heir == null ) specific_bequests_due_to_heir = 0;
									if ( specific_bequest_due_to_cust == "" || specific_bequest_due_to_cust == null ) specific_bequest_due_to_cust = 0;
									if ( advance_to_value_ratio == "" || advance_to_value_ratio == null )
										advance_to_value_ratio = 33;
									else
										advance_to_value_ratio = parseFloat( advance_to_value_ratio );

									if ( percent_estate_due_to_custome == "" || percent_estate_due_to_custome == null )
										percent_estate_due_to_custome = 100;
									else
										percent_estate_due_to_custome = parseFloat( percent_estate_due_to_custome );

									if ( estate in properties ) {
										property_sum = properties[ estate ].total;
									} else {
										property_sum = 0;
									}
									if ( estate in assets )
										asset_sum = assets[ estate ].value;
									else
										asset_sum = 0;

									if ( estate in claims )
										claim_sum = claims[ estate ].value;
									else
										claim_sum = 0;

									if ( customer in e_leins )//e_leins
										lein_sum = c_leins[ customer ].value;
									else
										lein_sum = 0;

									attorneyFee = parseInt( ( parseInt( property_sum ) + parseInt( asset_sum ) ) * 0.06 );
									if ( attorneyFee < 3000 ) attorneyFee = 3000;

									net_equity_value = parseInt( property_sum ) + parseInt( asset_sum ) - parseInt( claim_sum ) - parseInt( specific_bequests_due_to_heir ) - parseInt( parseInt( property_sum ) * 0.06 ) - parseInt( attorneyFee );
									residue_equity_due = parseInt( net_equity_value * percent_estate_due_to_custome / 100 );
									total_due = parseInt( residue_equity_due ) + parseInt( specific_bequest_due_to_cust );
									total_due_pres[ customer ] = parseInt( total_due ) - parseInt( lein_sum );
									total_due_pre = total_due_pres[ customer ];
								} else
									total_due_pre = total_due_pres[ customer ];

								// calc total of customer advance, old of customer advance 
								if ( !( customer in customer_advance ) ) {
									old_advance = 0;
									customer_advance[ customer ] = parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );
								} else {
									old_advance = parseInt( customer_advance[ customer ] );
									customer_advance[ customer ] = parseInt( customer_advance[ customer ] ) + parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );
								}
								// calc total of estate advance
								if ( !( estate in estate_advance ) ) {
									estate_advance[ estate ] = parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );
								} else
									estate_advance[ estate ] = parseInt( estate_advance[ estate ] ) + parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );

								competitor_sum = 0;
								if ( customer in c_existing_assignments ) {
									sel_priority = 0;
									for ( var i in c_existing_assignments[ customer ] ) {
										assign_invoice = Math.abs( c_existing_assignments[ customer ][ i ].invoice );
										assign_priority = Math.abs( c_existing_assignments[ customer ][ i ].priority );
										if ( assign_invoice == id && assign_invoice ) {
											sel_priority = assign_priority;
										}
									}
									//nlapiLogExecution("debug","Calcing", 'sel_priority = '+sel_priority);
									for ( var i in c_existing_assignments[ customer ] ) {
										assign_invoice = Math.abs( c_existing_assignments[ customer ][ i ].invoice );
										assign_priority = Math.abs( c_existing_assignments[ customer ][ i ].priority );
										assign_date = Math.abs( c_existing_assignments[ customer ][ i ].date );
										assign_amount = Math.abs( c_existing_assignments[ customer ][ i ].amount );

										g1 = new Date( assign_date );
										g2 = new Date( invs[ j ].getValue( 'trandate' ) );

										if ( sel_priority && sel_priority > assign_priority && !assign_invoice ) {
											competitor_sum += assign_amount;
										} else
											if ( !sel_priority && g2.getTime() > g1.getTime() && !assign_invoice ) {
												competitor_sum += assign_amount;
											}
									}
									//nlapiLogExecution("debug","Calcing", 'competitor_sum = '+competitor_sum);
								}

								//calc Net Size of Inheritance
								net_size = total_due_pre - competitor_sum;
								//calc allowed
								borrowing_allowed = parseInt( net_size * 0.6 );
								//calc ltv
								ltv_val = parseFloat( invs[ j ].getValue( 'custbody_advance_size' ) );
								ltv_val = ltv_val - Math.min( ltv_val, borrowing_allowed - old_advance );
								//calc 48M
								var invoice_date = new Date( invs[ j ].getValue( 'trandate' ) );
								var diff_time = today.getTime() - invoice_date.getTime();
								var diff_days = diff_time / ( 1000 * 3600 * 24 );
								if ( diff_days > 1460 )
									val_48M = invs[ j ].getValue( 'custbody_advance_size' )
								else
									val_48M = 0;

								//calc conc
								cust_conc = Math.min( Math.max( 0, customer_advance[ customer ] - 350000 ), parseInt( invs[ j ].getValue( 'custbody_advance_size' ) ) );
								est_conc = Math.min( Math.max( 0, estate_advance[ estate ] - 600000 ), parseInt( invs[ j ].getValue( 'custbody_advance_size' ) ) );

								if ( invs[ j ].getValue( 'custbody_estimated_default' ) == '' || invs[ j ].getValue( 'custbody_estimated_default' ) == null )
									estimated_defaul = 0;
								else
									estimated_defaul = invs[ j ].getValue( 'custbody_estimated_default' );

								in_rcv = Math.max( ltv_val, estimated_defaul );
								el_rcv = parseFloat( invs[ j ].getValue( 'custbody_advance_size' ) ) - in_rcv;
								if ( el_rcv < 0 ) el_rcv = 0;

                        if (!(estate in totals)) {
                            totals[estate] = {
                                name: invs[j].getText('entity'),
                                estate: invs[j].getText('parent', 'customer'),
                                estateId: invs[j].getValue('parent', 'customer'),
                                //state: invs[j].getText('billstate', 'customer'),
                                outstanding: invs[j].getValue('amountremaining'),
                                assign: (invs[j].getValue('custbody_assignment_size') ? invs[j].getValue('custbody_assignment_size') : 0),
                                //customer_advance: customer_advance[customer],
                                estate_advance: estate_advance[estate],
                                net: net_size,
                                due: total_due_pre,
                                competitor: competitor_sum,
                                borrowing_allowed: borrowing_allowed,
                                prior: '',
                                ltv: ltv_val,
                                four_val: val_48M,
                                cust_conc: cust_conc,
                                est_conc: est_conc,
                                holdback: (invs[j].getValue('custbody_holdback') ? invs[j].getValue('custbody_holdback') : 0),
                                estimated_defaul: (invs[j].getValue('custbody_estimated_default') ? invs[j].getValue('custbody_estimated_default') : 0),
                                in_rcv: in_rcv,
                                el_rcv: el_rcv,
                                payment: invs[j].getValue('amountpaid')
                            };
                        } else {
                            totals[estate].outstanding = parseFloat(totals[estate].outstanding) + parseFloat(invs[j].getValue('amountremaining'));
                            totals[estate].assign = parseFloat(totals[estate].assign) + parseFloat((invs[j].getValue('custbody_assignment_size') ? invs[j].getValue('custbody_assignment_size') : 0));
                            //totals[estate].customer_advance = customer_advance[customer];
                            totals[estate].estate_advance = estate_advance[estate];
                            totals[estate].net = parseInt(totals[estate].net) + parseInt(net_size);
                            totals[estate].due = parseInt(totals[estate].due) + parseInt(total_due_pre);
                            totals[estate].competitor = parseInt(totals[estate].competitor) + parseInt(competitor_sum);
                            totals[estate].borrowing_allowed = parseInt(totals[estate].borrowing_allowed) + parseInt(borrowing_allowed);
                            totals[estate].ltv = parseInt(totals[estate].ltv) + parseInt(ltv_val);
                            totals[estate].four_val = parseInt(totals[estate].four_val) + parseInt(val_48M);
                            totals[estate].cust_conc = parseInt(totals[estate].cust_conc) + parseInt(cust_conc);
                            totals[estate].est_conc = parseInt(totals[estate].est_conc) + parseInt(est_conc);
                            totals[estate].holdback = parseInt(totals[estate].holdback) + parseInt((invs[j].getValue('custbody_estimated_default') ? invs[j].getValue('custbody_estimated_default') : 0));
                            totals[estate].estimated_defaul = parseInt(totals[estate].estimated_defaul) + parseInt((invs[j].getValue('custbody_estimated_default') ? invs[j].getValue('custbody_estimated_default') : 0));
                            totals[estate].in_rcv = parseInt(totals[estate].in_rcv) + parseInt(in_rcv);
                            totals[estate].el_rcv = parseInt(totals[estate].el_rcv) + parseInt(el_rcv);
                            totals[estate].payment = parseFloat(totals[estate].payment) + parseFloat(invs[j].getValue('amountpaid'));
                        }
                    }
                    resultIndex = resultIndex + resultStep;
                } while (invs.length > 0);

                for (var c in totals) {
                    if (c in estates) {
                        state = estates[c].billstate; //getText('billstate');

                    } else
                        state = '';
                        var estateId = totals[c].estateId;
                        var billingstate=estates_bill_states[estateId] ? estates_bill_states[estateId] : '';
              
                    //Set LineItem
                    if (totals[c].estate)
                        reportSublist.setLineItemValue('custpage_estate_name', rowIndex, totals[c].estate);
                    //reportSublist.setLineItemValue('custpage_customer_name', rowIndex,  totals[c].name);
                    if (billingstate)
                        reportSublist.setLineItemValue('custpage_state', rowIndex, billingstate);
                    if (totals[c].outstanding)
                        reportSublist.setLineItemValue('custpage_outstanding', rowIndex, totals[c].outstanding);
                    if (totals[c].assign)
                        reportSublist.setLineItemValue('custpage_assignment', rowIndex, totals[c].assign);
                    //reportSublist.setLineItemValue('custpage_customer_advance', rowIndex,  totals[c].customer_advance);
                    if (totals[c].estate_advance)
                        reportSublist.setLineItemValue('custpage_estate_advance', rowIndex, Math.floor(totals[c].estate_advance).toFixed(0));
                    if (totals[c].net)
                        reportSublist.setLineItemValue('custpage_net', rowIndex, Math.floor(totals[c].net).toFixed(0));
                    if (totals[c].due)
                        reportSublist.setLineItemValue('custpage_due', rowIndex, Math.floor(totals[c].due).toFixed(0));
                    if (totals[c].competitor)
                        reportSublist.setLineItemValue('custpage_competitor', rowIndex, Math.floor(totals[c].competitor).toFixed(0));
                    reportSublist.setLineItemValue('custpage_borrowing_multi', rowIndex, '60%');
                    if (totals[c].borrowing_allowed)
                        reportSublist.setLineItemValue('custpage_borrowing_allowed', rowIndex, Math.floor(totals[c].borrowing_allowed).toFixed(0));
                    reportSublist.setLineItemValue('custpage_prior', rowIndex, Math.floor(0).toFixed(0));
                    if (totals[c].ltv)
                        reportSublist.setLineItemValue('custpage_ltv', rowIndex, Math.floor(totals[c].ltv).toFixed(0));
                    if (totals[c].four_val)
                        reportSublist.setLineItemValue('custpage_48m', rowIndex, Math.floor(totals[c].four_val).toFixed(0));
                    if (totals[c].cust_conc)
                        reportSublist.setLineItemValue('custpage_cust_conc', rowIndex, Math.floor(totals[c].cust_conc).toFixed(0));
                    if (totals[c].est_conc)
                        reportSublist.setLineItemValue('custpage_est_conc', rowIndex, Math.floor(totals[c].est_conc).toFixed(0));
                    if (totals[c].holdback)
                        reportSublist.setLineItemValue('custpage_holdback', rowIndex, Math.floor(totals[c].holdback).toFixed(0));
                    if (totals[c].estimated_defaul)
                        reportSublist.setLineItemValue('custpage_est_default', rowIndex, Math.floor(totals[c].estimated_defaul).toFixed(0));
                    if (totals[c].in_rcv)
                        reportSublist.setLineItemValue('custpage_in_receivable', rowIndex, Math.floor(totals[c].in_rcv).toFixed(0));
                    if (totals[c].el_rcv)
                        reportSublist.setLineItemValue('custpage_el_receivable', rowIndex, Math.floor(totals[c].el_rcv).toFixed(0));
                    if (totals[c].payment)
                        reportSublist.setLineItemValue('custpage_payment', rowIndex, totals[c].payment);

							rowIndex++;
						}
					} else {
						//reportSublist.addField('custpage_estate_name', 'text', 'Estate Name', 'estate_name').setDisplayType('inline').setDisplaySize(200);
						//reportSublist.addField('custpage_customer_name', 'text', 'Customer Name', 'customer_name').setDisplayType('inline').setDisplaySize(200);
						reportSublist.addField( 'custpage_state', 'text', 'state', 'state' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_assignment', 'float', 'Assignment Amount', 'assign_amount' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_outstanding', 'float', 'Outstanding Amount', 'out_amount' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_customer_advance', 'integer', 'Total Advanced to Customer', '' ).setDisplayType( 'inline' );
						//reportSublist.addField('custpage_estate_advance', 'text', 'Total Advanced to Estate', '').setDisplayType('inline');
						reportSublist.addField( 'custpage_due', 'integer', 'Total Due to Customer From Estate Pre-Assignments', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_competitor', 'integer', 'Competitor Assignments Ahead of Invoice', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_net', 'integer', 'Net Size of Inheritance', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_borrowing_multi', 'text', 'Borrowing Base Multiple', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_borrowing_allowed', 'integer', 'Allowed Under Borrowing Base', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_prior', 'integer', 'Total Prior Probate Advance Fundings', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_ltv', 'integer', 'Ineligable - LTV', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_48m', 'integer', 'Ineligable - Aged>48M', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_cust_conc', 'integer', 'Ineligable - Cust Conc.', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_est_conc', 'integer', 'Ineligable - Est Conc', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_holdback', 'integer', 'Ineligable - Holdback', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_est_default', 'integer', 'Ineligable - Est. Default', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_in_receivable', 'integer', 'Total Ineligable Receivable', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_el_receivable', 'integer', 'Eligible Receivable', '' ).setDisplayType( 'inline' );
						reportSublist.addField( 'custpage_payment', 'float', 'Partial Payment', '' ).setDisplayType( 'inline' );

                search = nlapiCreateSearch("invoice",
                    [
                        ['amountremainingisabovezero', 'is', 'T'], 'and', ['mainline', 'is', 'T']
                    ],
                    [
                        new nlobjSearchColumn("internalid", null, null),
                        new nlobjSearchColumn("tranid", null, null),
                        new nlobjSearchColumn("trandate", null, null),
                        new nlobjSearchColumn("entity", null, null),
                        new nlobjSearchColumn("custbody_advance_size", null, null),
                        new nlobjSearchColumn("custbody_assignment_size", null, null),
                        new nlobjSearchColumn("custbody_assignment_size", null, null),
                        new nlobjSearchColumn("amountpaid", null, null),
                        new nlobjSearchColumn("amountremaining", null, null),
                        new nlobjSearchColumn("custbody_estimated_default", null, null),
                        new nlobjSearchColumn("custbody_holdback", null, null),

								new nlobjSearchColumn( "parent", 'customer', null ),
								new nlobjSearchColumn( "entityid", 'customer', null ),
								new nlobjSearchColumn( "billstate", 'customer', null ),
								new nlobjSearchColumn( "custentity_specific_bequest_due_to_cust", 'customer', null ),
								new nlobjSearchColumn( "custentity_advance_to_value_ratio", 'customer', null ),
								new nlobjSearchColumn( "custentity_percent_estate_due_to_custome", 'customer', null ),
							]
						) || [];

                var totals = [],
                    customer_advance = [],
                    estate_advance = [];
                searchResults = search.runSearch();
                nlapiLogExecution("debug", "10 Search=");
                resultIndex = 0;
                resultStep = 1000, rowIndex = 1;
                var invs = [];
                do {
                    invs = searchResults.getResults(resultIndex, resultIndex + resultStep);
                    for (var j = 0; j < invs.length; j++) {
                        var id = invs[j].getValue('internalid');
                        var customer = invs[j].getValue('entity');
                        var estate = invs[j].getValue('parent', 'customer');
                        var state = invs[j].getValue('billstate', 'customer');
                        estate = estate.toString();
                        // calc Total Due to Customer From Estate Pre-Assignments
                        if (!(customer in total_due_pres)) {
                            specific_bequests_due_to_heir = estates[estate].duetoheir //getValue('custentity_specific_bequests_due_to_heir');
                            specific_bequest_due_to_cust = invs[j].getValue('custentity_specific_bequest_due_to_cust', 'customer'); //customer
                            advance_to_value_ratio = invs[j].getValue('custentity_advance_to_value_ratio', 'customer'); //customer
                            percent_estate_due_to_custome = invs[j].getValue('custentity_percent_estate_due_to_custome', 'customer'); //customer

									if ( specific_bequests_due_to_heir == "" || specific_bequests_due_to_heir == null ) specific_bequests_due_to_heir = 0;
									if ( specific_bequest_due_to_cust == "" || specific_bequest_due_to_cust == null ) specific_bequest_due_to_cust = 0;
									if ( advance_to_value_ratio == "" || advance_to_value_ratio == null )
										advance_to_value_ratio = 33;
									else
										advance_to_value_ratio = parseFloat( advance_to_value_ratio );

									if ( percent_estate_due_to_custome == "" || percent_estate_due_to_custome == null )
										percent_estate_due_to_custome = 100;
									else
										percent_estate_due_to_custome = parseFloat( percent_estate_due_to_custome );

									if ( estate in properties ) {
										property_sum = properties[ estate ].total;
									} else {
										property_sum = 0;
									}
									if ( estate in assets )
										asset_sum = assets[ estate ].value;
									else
										asset_sum = 0;

									if ( estate in claims )
										claim_sum = claims[ estate ].value;
									else
										claim_sum = 0;

									if ( customer in e_leins )//e_leins
										lein_sum = c_leins[ customer ].value;
									else
										lein_sum = 0;

									attorneyFee = parseInt( ( parseInt( property_sum ) + parseInt( asset_sum ) ) * 0.06 );
									if ( attorneyFee < 3000 ) attorneyFee = 3000;

									net_equity_value = parseInt( property_sum ) + parseInt( asset_sum ) - parseInt( claim_sum ) - parseInt( specific_bequests_due_to_heir ) - parseInt( parseInt( property_sum ) * 0.06 ) - parseInt( attorneyFee );
									residue_equity_due = parseInt( net_equity_value * percent_estate_due_to_custome / 100 );
									total_due = parseInt( residue_equity_due ) + parseInt( specific_bequest_due_to_cust );
									total_due_pres[ customer ] = parseInt( total_due ) - parseInt( lein_sum );
									total_due_pre = total_due_pres[ customer ];
								} else
									total_due_pre = total_due_pres[ customer ];

								// calc total of customer advance, old of customer advance 
								if ( !( customer in customer_advance ) ) {
									old_advance = 0;
									customer_advance[ customer ] = parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );
								} else {
									old_advance = parseInt( customer_advance[ customer ] );
									customer_advance[ customer ] = parseInt( customer_advance[ customer ] ) + parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );
								}
								// calc total of estate advance
								if ( !( estate in estate_advance ) ) {
									estate_advance[ estate ] = parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );
								} else
									estate_advance[ estate ] = parseInt( estate_advance[ estate ] ) + parseInt( invs[ j ].getValue( 'custbody_advance_size' ) );

								competitor_sum = 0;
								if ( customer in c_existing_assignments ) {
									sel_priority = 0;
									for ( var i in c_existing_assignments[ customer ] ) {
										assign_invoice = Math.abs( c_existing_assignments[ customer ][ i ].invoice );
										assign_priority = Math.abs( c_existing_assignments[ customer ][ i ].priority );
										if ( assign_invoice == id && assign_invoice ) {
											sel_priority = assign_priority;
										}
									}
									//nlapiLogExecution("debug","Calcing", 'sel_priority = '+sel_priority);
									for ( var i in c_existing_assignments[ customer ] ) {
										assign_invoice = Math.abs( c_existing_assignments[ customer ][ i ].invoice );
										assign_priority = Math.abs( c_existing_assignments[ customer ][ i ].priority );
										assign_date = Math.abs( c_existing_assignments[ customer ][ i ].date );
										assign_amount = Math.abs( c_existing_assignments[ customer ][ i ].amount );

										g1 = new Date( assign_date );
										g2 = new Date( invs[ j ].getValue( 'trandate' ) );

										if ( sel_priority && sel_priority > assign_priority && !assign_invoice ) {
											competitor_sum += assign_amount;
										} else
											if ( !sel_priority && g2.getTime() > g1.getTime() && !assign_invoice ) {
												competitor_sum += assign_amount;
											}
									}
									//nlapiLogExecution("debug","Calcing", 'competitor_sum = '+competitor_sum);
								}

								//calc Net Size of Inheritance
								net_size = total_due_pre - competitor_sum;
								//calc allowed
								borrowing_allowed = parseInt( net_size * 0.6 );
								//calc ltv
								ltv_val = parseFloat( invs[ j ].getValue( 'custbody_advance_size' ) );
								ltv_val = ltv_val - Math.min( ltv_val, borrowing_allowed - old_advance );
								//calc 48M
								var invoice_date = new Date( invs[ j ].getValue( 'trandate' ) );
								var diff_time = today.getTime() - invoice_date.getTime();
								var diff_days = diff_time / ( 1000 * 3600 * 24 );
								if ( diff_days > 1460 )
									val_48M = invs[ j ].getValue( 'custbody_advance_size' )
								else
									val_48M = 0;

								//calc conc
								cust_conc = Math.min( Math.max( 0, customer_advance[ customer ] - 350000 ), parseInt( invs[ j ].getValue( 'custbody_advance_size' ) ) );
								est_conc = Math.min( Math.max( 0, estate_advance[ estate ] - 600000 ), parseInt( invs[ j ].getValue( 'custbody_advance_size' ) ) );

								if ( invs[ j ].getValue( 'custbody_estimated_default' ) == '' || invs[ j ].getValue( 'custbody_estimated_default' ) == null )
									estimated_defaul = 0;
								else
									estimated_defaul = invs[ j ].getValue( 'custbody_estimated_default' );

								in_rcv = Math.max( ltv_val, estimated_defaul );
								el_rcv = parseFloat( invs[ j ].getValue( 'custbody_advance_size' ) ) - in_rcv;
								if ( el_rcv < 0 ) el_rcv = 0;

                        if (!(state in totals)) {
                            var estateId =invs[j].getValue('billstate', 'customer')
                            var billingstate=estates_bill_states[estateId] ? estates_bill_states[estateId] : '';
                  
                            totals[state] = {
                                //name: invs[j].getText('entity'),  
                                //estate: invs[j].getText('parent', 'customer'),
                                state: billingstate,//invs[j].getText('billstate', 'customer'),
                                outstanding: invs[j].getValue('amountremaining'),
                                assign: (invs[j].getValue('custbody_assignment_size') ? invs[j].getValue('custbody_assignment_size') : 0),
                                customer_advance: (invs[j].getValue('custbody_advance_size') ? invs[j].getValue('custbody_advance_size') : 0),
                                //estate_advance:  estate_advance[estate],
                                net: net_size,
                                due: total_due_pre,
                                competitor: competitor_sum,
                                borrowing_allowed: borrowing_allowed,
                                prior: '',
                                ltv: ltv_val,
                                four_val: val_48M,
                                cust_conc: cust_conc,
                                est_conc: est_conc,
                                holdback: (invs[j].getValue('custbody_holdback') ? invs[j].getValue('custbody_holdback') : 0),
                                estimated_defaul: (invs[j].getValue('custbody_estimated_default') ? invs[j].getValue('custbody_estimated_default') : 0),
                                in_rcv: in_rcv,
                                el_rcv: el_rcv,
                                payment: invs[j].getValue('amountpaid')
                            };
                        } else {
                            totals[state].outstanding = parseFloat(totals[state].outstanding) + parseFloat(invs[j].getValue('amountremaining'));
                            totals[state].assign = parseFloat(totals[state].assign) + parseFloat((invs[j].getValue('custbody_assignment_size') ? invs[j].getValue('custbody_assignment_size') : 0));
                            totals[state].customer_advance = parseInt(totals[state].customer_advance) + parseInt((invs[j].getValue('custbody_advance_size') ? invs[j].getValue('custbody_advance_size') : 0));
                            //totals[customer].estate_advance = estate_advance[estate];
                            totals[state].net = parseInt(totals[state].net) + parseInt(net_size);
                            totals[state].due = parseInt(totals[state].due) + parseInt(total_due_pre);
                            totals[state].competitor = parseInt(totals[state].competitor) + parseInt(competitor_sum);
                            totals[state].borrowing_allowed = parseInt(totals[state].borrowing_allowed) + parseInt(borrowing_allowed);
                            totals[state].ltv = parseInt(totals[state].ltv) + parseInt(ltv_val);
                            totals[state].four_val = parseInt(totals[state].four_val) + parseInt(val_48M);
                            totals[state].cust_conc = parseInt(totals[state].cust_conc) + parseInt(cust_conc);
                            totals[state].est_conc = parseInt(totals[state].est_conc) + parseInt(est_conc);
                            totals[state].holdback = parseInt(totals[state].holdback) + parseInt((invs[j].getValue('custbody_estimated_default') ? invs[j].getValue('custbody_estimated_default') : 0));
                            totals[state].estimated_defaul = parseInt(totals[state].estimated_defaul) + parseInt((invs[j].getValue('custbody_estimated_default') ? invs[j].getValue('custbody_estimated_default') : 0));
                            totals[state].in_rcv = parseInt(totals[state].in_rcv) + parseInt(in_rcv);
                            totals[state].el_rcv = parseInt(totals[state].el_rcv) + parseInt(el_rcv);
                            totals[state].payment = parseFloat(totals[state].payment) + parseFloat(invs[j].getValue('amountpaid'));
                        }
                    }
                    resultIndex = resultIndex + resultStep;
                } while (invs.length > 0);

                for (var c in totals) {
                    //Set LineItem
                    //reportSublist.setLineItemValue('custpage_estate_name', rowIndex,  totals[c].estate);
                    //reportSublist.setLineItemValue('custpage_customer_name', rowIndex,  totals[c].name);
                   
                    if (totals[c].state)
                        reportSublist.setLineItemValue('custpage_state', rowIndex, totals[c].state);
                    if (totals[c].outstanding)
                        reportSublist.setLineItemValue('custpage_outstanding', rowIndex, totals[c].outstanding);
                    if (totals[c].assign)
                        reportSublist.setLineItemValue('custpage_assignment', rowIndex, totals[c].assign);
                    nlapiLogExecution("debug", "customer_adv", totals[c].customer_advance);
                    if (totals[c].customer_advance) {

                        reportSublist.setLineItemValue('custpage_customer_advance', rowIndex, Math.floor(totals[c].customer_advance).toFixed(0));

                    } //reportSublist.setLineItemValue('custpage_estate_advance', rowIndex,  totals[c].estate_advance);
                    if (totals[c].net)
                        reportSublist.setLineItemValue('custpage_net', rowIndex, Math.floor(totals[c].net).toFixed(0));
                    if (totals[c].due)
                        reportSublist.setLineItemValue('custpage_due', rowIndex, Math.floor(totals[c].due).toFixed(0));
                    if (totals[c].competitor)
                        reportSublist.setLineItemValue('custpage_competitor', rowIndex, Math.floor(totals[c].competitor).toFixed(0));
                    reportSublist.setLineItemValue('custpage_borrowing_multi', rowIndex, '60%');
                    if (totals[c].borrowing_allowed)
                        reportSublist.setLineItemValue('custpage_borrowing_allowed', rowIndex, Math.floor(totals[c].borrowing_allowed).toFixed(0));
                    reportSublist.setLineItemValue('custpage_prior', rowIndex, Math.floor(0).toFixed(0));
                    if (totals[c].ltv)
                        reportSublist.setLineItemValue('custpage_ltv', rowIndex, Math.floor(totals[c].ltv).toFixed(0));
                    if (totals[c].four_val)
                        reportSublist.setLineItemValue('custpage_48m', rowIndex, Math.floor(totals[c].four_val).toFixed(0));
                    if (totals[c].cust_conc)
                        reportSublist.setLineItemValue('custpage_cust_conc', rowIndex, Math.floor(totals[c].cust_conc).toFixed(0));
                    if (totals[c].est_conc)
                        reportSublist.setLineItemValue('custpage_est_conc', rowIndex, Math.floor(totals[c].est_conc).toFixed(0));
                    if (totals[c].holdback)
                        reportSublist.setLineItemValue('custpage_holdback', rowIndex, Math.floor(totals[c].holdback).toFixed(0));
                    if (totals[c].estimated_defaul)
                        reportSublist.setLineItemValue('custpage_est_default', rowIndex, Math.floor(totals[c].estimated_defaul).toFixed(0));
                    if (totals[c].in_rcv)
                        reportSublist.setLineItemValue('custpage_in_receivable', rowIndex, Math.floor(totals[c].in_rcv).toFixed(0));
                    if (totals[c].el_rcv)
                        reportSublist.setLineItemValue('custpage_el_receivable', rowIndex, Math.floor(totals[c].el_rcv).toFixed(0));
                    if (totals[c].payment)
                        reportSublist.setLineItemValue('custpage_payment', rowIndex, totals[c].payment);

							rowIndex++;
						}
					}

			//form.setScript('customscript_borrowingreport_ue');
			form.setScript( 'customscript_borrowingreport_cs' );
			response.writePage( form );
		} else {
			var sel_action = request.getParameter( 'custpage_action' );
			var url = nlapiResolveURL( 'SUITELET', 'customscript_borrowingreport_sl', 'customdeploy_borrowingreport_sl', false ) + "&sel_action=" + sel_action;
			nlapiSetRedirectURL( 'EXTERNAL', url, null, false );
		}
	} catch ( e ) {
		nlapiLogExecution( "error", 'ERROR info', e );
	}
}