// noinspection JSVoidFunctionReturnValueUsed

function updatecust() {
    return true;
  var customerId = nlapiGetFieldValue("custpage_customer_id");
  var estateId = nlapiGetFieldValue("custpage_estate");
  console.log('update estate');
    nlapiSubmitField('customer', estateId, [
        'custentity_estate_total_property',
        'custentity_estate_total_assets',
        'custentity_estate_total_claims',
        'custentity_estate_closingcosts',
        'custentity_estate_attorneyfee',
        'custentity_estate_net_equity'
    ], [
        nlapiGetFieldValue('custpage_total_property'),
        nlapiGetFieldValue('custpage_total_assets'),
        nlapiGetFieldValue('custpage_total_claims'),
        nlapiGetFieldValue('custpage_closing_costs'),
        nlapiGetFieldValue('custpage_attorney_fees'),
        nlapiGetFieldValue('custpage_net_equity_value_1')
    ]);

  console.log('update customer');
    if(customerId) {
        nlapiSubmitField('customer', customerId, [
            'custentity_customer_residueestatedue',
            'custentity_customer_totalduefromestate',
            'custentity_customer_total_liens',
            'custentity_customer_totalassignments',
            'custentity_customer_netduefromestate',
            'custentity_customer_maxadvancesize'
        ], [
          nlapiGetFieldValue('custpage_residue_equity_due'),
          nlapiGetFieldValue('custpage_total_due'),
          nlapiGetFieldValue('custpage_liens_judgments'),
          nlapiGetFieldValue('custpage_existing_agreements'),
          nlapiGetFieldValue('custpage_net_due'),
          nlapiGetFieldValue('custpage_max_advance')
        ]);
    }
}

function clearchanged() {
    window.ischanged = false;
}

function New_Cust_App_CS_PS() {
    return true;
}

function New_Cust_App_CS_PI() {
  var customerId = nlapiGetFieldValue("custpage_customer_id");
  var estateId = nlapiGetFieldValue("custpage_estate");
    var estatestateval = nlapiGetFieldValue('custpage_estate_state');
    if (estatestateval == '9') {
        nlapiSetFieldValue('custpage_estate_state_warn', '<h3 style="color:Red">WARNING: CONNECTICUT</h3>');
    } else {
        nlapiSetFieldValue(name + 'custpage_estate_state_warn', ' ');
    }

    var stateval = nlapiGetFieldValue('custpage_state');
    if (stateval == '9') {
        nlapiSetFieldValue('custpage_state_warn', '<h3 style="color:Red">WARNING: CONNECTICUT</h3>');
    } else {
        nlapiSetFieldValue(name + 'custpage_state_warn', ' ');
    }

    calcEstateTotals();

    //calculateMonths();

    calcTotalAssignments();

    calcTotalLeins();

    calculateMaxAdvance();

    if (nlapiGetFieldValue("custpage_desired_advance") != null && nlapiGetFieldValue("custpage_desired_advance") != "")
        calculatePrice();

    setnextevent();
}

function New_Cust_App_CS_FC(type, name, linenum) {
  clearchanged();

  var customerId = nlapiGetFieldValue("custpage_customer_id");
  var estateId = nlapiGetFieldValue("custpage_estate");

//  if(estateId!=null && estateId!='') {
//    var tobeupdated=nlapiLookupField('customer', estateId, 'custentity_tobeupdated');
//    if(tobeupdated!='T')
//      nlapiSubmitField('customer', estateId, 'custentity_tobeupdated', 'T');
//  }

  if(name=='custpage_invoice_datefiled') {
    date=nlapiGetLineItemValue(type, name, linenum);
    var invintid=nlapiGetLineItemValue(type, 'custpage_invoice_internalid', linenum);
    nlapiSubmitField('invoice', invintid, 'custbody_invoice_datefiled', date);
    return true;
  }

  var fieldobj={
    custpage_percent_equity_due:{source:'custpage_percent_equity_due', target:'custentity_percent_estate_due_to_custome', type:'customer'},
    custpage_bequest_due:{source:'custpage_bequest_due', target:'custentity_specific_bequest_due_to_cust', type:'customer'},
    custpage_existing_agreements:{source:'custpage_existing_agreements', target:'custentity_customer_totalassignments', type:'customer'},
    custpage_liens_judgments:{source:'custpage_liens_judgments', target:'custentity_customer_totalliens', type:'customer'},
    custpage_adv_to_val_ratio:{source:'custpage_adv_to_val_ratio', target:'custentity_advance_to_value_ratio', type:'customer'},
    custpage_total_property:{source:'custpage_total_property', target:'custentity_estate_total_property', type:'estate'},
    custpage_total_claims:{source:'custpage_total_claims', target:'custentity_estate_total_claims', type:'estate'},
    custpage_total_assets:{source:'custpage_total_assets', target:'custentity_estate_total_assets', type:'estate'},
    custpage_specific_bequests:{source:'custpage_specific_bequests', target:'custentity_specific_bequests_due_to_heir', type:'estate'}
  };

  if(Object.keys(fieldobj).includes(name)) {
    var fldtype=fieldobj[name].type;
    var data=fldtype=='customer' ? window.custdata : window.estdata;
    var recid=fldtype=='customer' ? customerId : estateId;
    var val=nlapiGetFieldValue(name);
    var target=fieldobj[name].target;
    if(data!=null && data.hasOwnProperty(target)) {
      var origval=data[target];
      if(val!=origval)
        if(!(fldtype=='customer' && customerId) || !fldtype=='estate') {
//          alert('name: '+name+';\ntarget field: '+target+';\ntype: '+fldtype+';\nvalue: '+val);
//          nlapiSubmitField('customer', recid, target, val);
          calculateMaxAdvance();
          return true;
        }
    }
      
  }

    var customerId = nlapiGetFieldValue("custpage_customer_id");
    var estateId = nlapiGetFieldValue("custpage_estate");
    var fieldtable={
		"custpage_prinestate":{"fieldname":"custentity_pr_living_in_estate", "type":"estate"},
		"custpage_clientinestate2":{"fieldname":"custentity_client_living_in_estate", "type":"estate"},
		"custpage_heirinestate":{"fieldname":"custentity_other_heirs_living_in_estate", "type":"estate"},
		"custpage_thirdptyinestate":{"fieldname":"custentity_third_party_living_in_estate", "type":"estate"},
		"custpage_netassets":{"fieldname":"custentity_estate_net_assets", "type":"estate"},
		"custpage_estatetype":{"fieldname":"custentity_estate_type", "type":"estate"},
		"custpage_acctsecurity":{"fieldname":"custentity_estate_account_security", "type":"estate"},
		"custpage_multipleestatestrusts":{"fieldname":"custentity_estates_multiple", "type":"estate"},
		"custpage_supervisionlevel":{"fieldname":"custentity_estate_supervision_level", "type":"estate"},
		"custpage_claimsperiodend":{"fieldname":"custentity_estate_claims_period_end", "type":"estate"},
		"custpage_heirship":{"fieldname":"custentity_heirship_customer", "type":"customer"},
		"custpage_clientinestate":{"fieldname":"custentity_client_living_in_estate_rp", "type":"customer"},
    }
	if(Object.keys(fieldtable).includes(name)) {
		var custrecid=(fieldtable[name].type=='estate' ? estateId:customerId);
		nlapiSubmitField('customer', custrecid, fieldtable[name].fieldname, nlapiGetFieldValue(name));
	}


    if (name == 'custpage_state_warn' || name == 'custpage_estate_state_warn') {
        clearchanged();
    }

    if (name == 'custpage_state' || name == 'custpage_estate_state') {
        var stateval = nlapiGetFieldValue(name);
        if (stateval == '9') {
            nlapiSetFieldValue(name + '_warn', '<h3 style="color:Red">WARNING: CONNECTICUT</h3>');
        } else {
            nlapiSetFieldValue(name + '_warn', ' ');
        }
    }

    if (name == 'custpage_property_listingtype' && type == 'custpage_properties') {
        var property_id = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_id");
        var eventtype = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_listingtype")
        console.log('eventtype', eventtype);
        if (property_id)
            nlapiSubmitField("customrecord_property", property_id, ["custrecord_listing_checkbox", 'custrecord_event_type_new'], ['T', eventtype]);
    }
    if (name == 'custpage_property_preforeclosure_status' && type == 'custpage_properties') {
        var property_id = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_id");
        var preforeclosure_status = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_preforeclosure_status")
        console.log('preforeclosure_status', preforeclosure_status);
        if (property_id)
            nlapiSubmitField("customrecord_property", property_id, ["custrecord_preforeclosure_checkbox", 'custrecord_preforeclosure_status'], ['T', preforeclosure_status]);
    }
    if (name == "custpage_customer_id" || name == "custpage_estate") {
        var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
        url += "&customer=" + nlapiGetFieldValue("custpage_customer_id");
        url += "&estate=" + nlapiGetFieldValue("custpage_estate");

        window.onbeforeunload = null;
        window.location.href = url;
    } else if (name == "custpage_wa_name" || name == "custpage_wa_state_name") {
        var customerId = nlapiGetFieldValue("custpage_customer_id");
        if (customerId != null && customerId != '') {
            switch (name) {
                case "custpage_wa_name":
                    var wa_sl = nlapiGetFieldValue(name);
                    console.log('wa_sl ' + wa_sl + '_customerId ' + customerId);
                    var record_wa_cl = nlapiLoadRecord('customer', customerId)
                    record_wa_cl.setFieldValue('custentity_mmsdf_send_wf_sms', wa_sl, false, true);
                    var sl_id = nlapiSubmitRecord(record_wa_cl, true, true);
                    break;

                case "custpage_wa_state_name":
                    var wa_sl_s = nlapiGetFieldValue(name);
                    var record_sa_cl = nlapiLoadRecord('customer', customerId)
                    record_sa_cl.setFieldValue('custentity_mmsdf_stopsendingsms', wa_sl_s, false, true);
                    var sl_id_s = nlapiSubmitRecord(record_sa_cl, true, true);
                    break;
            }
        }

    } else if (name == 'custpage_followup_assinged' && type == 'custpage_followup_list') {
        var assigned = nlapiGetCurrentLineItemValue("custpage_followup_list", "custpage_followup_assinged");
        var followupId = nlapiGetCurrentLineItemValue("custpage_followup_list", "custpage_followup_id");
        if (followupId != null && followupId != "") {
            nlapiSubmitField("customrecord_customer_follow_up", followupId, "custrecord_assigned", assigned);
        }
    } else if (type == "custpage_properties" && (name == "custpage_property_value" || name == "custpage_property_mortgage" || name == "custpage_property_owned" || name == "custpage_property_note" || name == "custpage_property_sold" || name == "custpage_property_escrow" || name == "custpage_property_dot")) {
        try {
            var value = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_value");
            var mortgage = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_mortgage");
            var owned = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_owned");
            var sold = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_sold");
            var note = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_note");
            var propertieId = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_id");
            var escrow = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_escrow");
            var dot = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_dot");
            if (name == "custpage_property_escrow" && propertieId) {
                nlapiSubmitField("customrecord_property", propertieId, "custrecord_escrow", escrow);
            }
            if (name == "custpage_property_dot" && propertieId) {
                nlapiSubmitField("customrecord_property", propertieId, "custrecord_dot", dot);
            }
            if (name == "custpage_property_sold" && propertieId) {
                nlapiSubmitField("customrecord_property", propertieId, "custrecord_sold", sold);
            }
            if (name == 'custpage_property_note' || propertieId) {
                nlapiSubmitField("customrecord_property", propertieId, "custrecord_notes", note);
            }
            if (value != null && value != "" && owned != null && owned != "") {
                var equity = parseFloat(value);

                if (mortgage != null && mortgage != "") {
                    equity = equity - parseFloat(mortgage);
                }

                owned = owned.replace("%", "");
                owned = parseFloat(owned) / 100;

                var total = equity * owned;

                nlapiSetCurrentLineItemValue("custpage_properties", "custpage_property_total", total, true, true);
            }
        } catch (err) {
            nlapiLogExecution("error", "Error Calculating Total Property Value", "Details: " + err.message);
            console.log("Error Calculating Total Property Value: " + err.message);
        }
    } else if (name == "custpage_net_equity_value_1") {
        nlapiSetFieldValue("custpage_net_equity_value", nlapiGetFieldValue("custpage_net_equity_value_1"), true, true);

        calculateMaxAdvance();
    } else if (name == "custpage_percent_equity_due" || name == "custpage_bequest_due" || name == "custpage_liens_judgments" || name == "custpage_existing_agreements" || name == "custpage_adv_to_val_ratio") {
        var customerId = nlapiGetFieldValue("custpage_customer_id");
        if (customerId != null && customerId != "") {
            switch (name) {
                case "custpage_percent_equity_due":
                    nlapiSubmitField("customer", customerId, "custentity_percent_estate_due_to_custome", nlapiGetFieldValue(name));
                    break;
                case "custpage_bequest_due":
                    nlapiSubmitField("customer", customerId, "custentity_specific_bequest_due_to_cust", nlapiGetFieldValue(name));
                    break;
                case "custpage_adv_to_val_ratio":
                    nlapiSubmitField("customer", customerId, "custentity_advance_to_value_ratio", nlapiGetFieldValue(name));
                    break;
            }
        }

        calculateMaxAdvance();
    } else if (name == "custpage_price_level" || name == "custpage_desired_advance" || name == "custpage_early_rebate_1" || name == "custpage_early_rebate_2" || name == "custpage_early_rebate_3") {
        if (name == "custpage_desired_advance") {
            var desiredAdvance = nlapiGetFieldValue("custpage_desired_advance");
            var maxAdvance = nlapiGetFieldValue("custpage_max_advance");

            if (desiredAdvance != null && desiredAdvance != "" && maxAdvance != null && maxAdvance != "") {
                desiredAdvance = parseFloat(desiredAdvance);
                maxAdvance = parseFloat(maxAdvance);

                if (desiredAdvance > maxAdvance) {
                    alert("The desired advance cannot exceed the maximum advance");
                }
            }
        }

        var customerId = nlapiGetFieldValue("custpage_customer_id");
        if (customerId != null && customerId != "") {
            switch (name) {
                case "custpage_price_level":
                    nlapiSubmitField("customer", customerId, "custentity_pricing_level", nlapiGetFieldValue(name));
                    break;
                case "custpage_desired_advance":
                    nlapiSubmitField("customer", customerId, "custentity_desired_advance_size", nlapiGetFieldValue(name));
                    break;
                case "custpage_early_rebate_1":
                    nlapiSubmitField("customer", customerId, "custentity_early_rebate_option_1", convertMonths(nlapiGetFieldValue(name)));
                    break;
                case "custpage_early_rebate_2":
                    nlapiSubmitField("customer", customerId, "custentity_early_rebate_option_2", convertMonths(nlapiGetFieldValue(name)));
                    break;
                case "custpage_early_rebate_3":
                    nlapiSubmitField("customer", customerId, "custentity_early_rebate_option_3", convertMonths(nlapiGetFieldValue(name)));
                    break;
            }
        }

        calculatePrice();
    } else if (name == "custpage_estate_state") {
        calculateMonths();
        console.log("Calc'd number of months...");

        var estateId = nlapiGetFieldValue("custpage_estate");
        console.log("Estate ID: " + estateId);

        if (estateId != null && estateId != "") {
            console.log("Estate ID is not empty. will attempt to update State field.");

            nlapiSubmitField("customer", estateId, "custentity3", nlapiGetFieldValue(name));
            console.log("Estate State field updated");
        }
    } else if (name == "custpage_specific_bequests") {
        var estateId = nlapiGetFieldValue("custpage_estate");
        if (estateId != null && estateId != "") {
            nlapiSubmitField("customer", estateId, "custentity_specific_bequests_due_to_heir", nlapiGetFieldValue(name));
        }

        calcEstateTotals();
    } else if (name == "custpage_first_name" || name == "custpage_diligence_assignee" || name == "custpage_middle_initial" || name == "custpage_last_name" || name == "custpage_address" || name == "custpage_city" || name == "custpage_state" || name == "custpage_zip" || name == "custpage_phone" || name == "custpage_email" || name == "custpage_how_did_they_find_us" || name == "custpage_alt_phone") {
        var customerId = nlapiGetFieldValue("custpage_customer_id");

        if (customerId == null || customerId == "") {
            var firstName = nlapiGetFieldValue("custpage_first_name");
            var lastName = nlapiGetFieldValue("custpage_last_name");
            var diligence_assignee = nlapiGetFieldValue("custpage_diligence_assignee");
            if (firstName != null && firstName != "" && lastName != null && lastName != "") {
                var customer = nlapiCreateRecord("customer");
                customer.setFieldValue("subsidiary", "2");
                customer.setFieldValue("isperson", "T");
                customer.setFieldValue("firstname", firstName);
                customer.setFieldValue("middlename", nlapiGetFieldValue("custpage_middle_initial"));
                customer.setFieldValue("lastname", lastName);
                customer.setFieldValue("phone", nlapiGetFieldValue("custpage_phone"));
                //        customer.setFieldValue("custentity_alternate_phone_number", nlapiGetFieldValue("custpage_alt_phone"));
                customer.setFieldValue("altphone", nlapiGetFieldValue("custpage_alt_phone"));
                customer.setFieldValue("email", nlapiGetFieldValue("custpage_email"));
              var leadsource=nlapiGetFieldValue("custpage_how_did_they_find_us");
              if(leadsource=='' || leadsource==null || leadsource=='undefined')
                leadsource=null;
                customer.setFieldValue("leadsource", leadsource);
                customer.setFieldValue("category", "1");
                if (diligence_assignee != null && diligence_assignee != '' && diligence_assignee != 'undefined')
                    customer.setFieldValue("custentity_diligence_assignee", diligence_assignee);

                if (nlapiGetFieldValue("custpage_estate") == null || nlapiGetFieldValue("custpage_estate") == "") {
                    var estate = nlapiCreateRecord("customer");
                    estate.setFieldValue("subsidiary", "2");
                    estate.setFieldValue("isperson", "F");
                    estate.setFieldValue("companyname", "[TEMP] " + firstName + " " + lastName);
                    estate.setFieldValue("category", "2");
                    estateId = nlapiSubmitRecord(estate, true, true);

                    nlapiSetFieldValue("custpage_estate", estateId, false, true);
                    nlapiSetFieldValue("custpage_decedent", "[TEMP] " + firstName + " " + lastName, false, true);

                    customer.setFieldValue("parent", estateId);
                } else
                    customer.setFieldValue("parent", nlapiGetFieldValue("custpage_estate"));

                customerId = nlapiSubmitRecord(customer, true, true);

                nlapiSetFieldValue("custpage_customer_id", customerId, false, true);
            }
        } else {
            if (name == "custpage_first_name" || name == "custpage_diligence_assignee" || name == "custpage_middle_initial" || name == "custpage_last_name" || name == "custpage_phone" || name == "custpage_email" || name == "custpage_how_did_they_find_us" || name == "custpage_alt_phone") {
                switch (name) {
                    case "custpage_first_name":
                        nlapiSubmitField("customer", customerId, "firstname", nlapiGetFieldValue(name));
                        nlapiSetFieldValue("custpage_customer_id", customerId, false, true);
                        break;
                    case "custpage_middle_initial":
                        nlapiSubmitField("customer", customerId, "middlename", nlapiGetFieldValue(name));
                        nlapiSetFieldValue("custpage_customer_id", customerId, false, true);
                        break;
                    case "custpage_last_name":
                        nlapiSubmitField("customer", customerId, "lastname", nlapiGetFieldValue(name));
                        nlapiSetFieldValue("custpage_customer_id", customerId, false, true);
                        break;
                    case "custpage_alt_phone":
                        var val = nlapiGetFieldValue(name);
                        //            nlapiSubmitField("customer", customerId, "custentity_alternate_phone_number", nlapiGetFieldValue(name));
                        if (!val) {
                            val = null;
                        }
                        var rec = nlapiLoadRecord("customer", customerId);
                        rec.setFieldValue("altphone", val);
                        nlapiSubmitRecord(rec);
                        nlapiSetFieldValue("custpage_customer_id", customerId, false, true);
                        break;
                    case "custpage_diligence_assignee":
                        var diligencerep=nlapiGetFieldValue(name);
                        if(diligencerep=='' || diligencerep=='undefined' || diligencerep==null)
                          diligencerep=null;
                        nlapiSubmitField("customer", customerId, "custentity_diligence_assignee", diligencerep);
                        nlapiSetFieldValue("custpage_customer_id", customerId, false, true);
                        nlapiLogExecution("debug", "value of diligence", nlapiGetFieldValue('custpage_diligence_assignee'));
                        console.log("value of diligence: " + nlapiGetFieldValue(name));
                        var todaydate = new Date();
                        var date = nlapiDateToString(todaydate);
                        var subject = 'Assigned Diligence assignee';
                        if (nlapiGetFieldValue('custpage_diligence_assignee')) {
                            nlapiSelectNewLineItem('custpage_phonecalls')
                            //nlapiSetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_id", phonecallId, false, true);
                            nlapiSetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_message", subject, true, true);
                            nlapiSetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_title", subject, true, true);
                            nlapiSetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_owner", nlapiGetFieldValue('custpage_diligence_assignee'), true, true);
                            nlapiSetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_date", date, true, true);
                            nlapiCommitLineItem('custpage_phonecalls')
                        }
                        /*var phonecall = nlapiCreateRecord("phonecall", {
                        recordmode: "dynamic"
                        });
                        phonecall.setFieldValue("company", nlapiGetFieldValue("custpage_estate"));
                        phonecall.setFieldValue("title", subject);
                        //phonecall.setFieldValue("startdate", todaydate);
                        //phonecall.setFieldValue("phone", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_phone_number"));
                        phonecall.setFieldValue("assigned", nlapiGetFieldValue('custpage_diligence_assignee'));
                        phonecall.setFieldValue("message",  subject);
                        var phonecallId = nlapiSubmitRecord(phonecall, true, true);
                        console.log("value of diligence: "+ phonecallId );*/

                        break;

                    case "custpage_phone":
                        var phone_sl = nlapiGetFieldValue(name);
                        if (phone_sl == null || phone_sl == '') {
                            //console.log('phone_sl '+phone_sl+'_customerId '+customerId);
                            phone_sl = '';
                            phone_sl = null;
                        }

                        // nlapiSubmitField("customer", customerId, "phone", phone_sl);
                        try {
                            var record_cl = nlapiLoadRecord('customer', customerId)
                            record_cl.setFieldValue('phone', phone_sl, false, true);
                            var sl_id = nlapiSubmitRecord(record_cl, true, true);

                        } catch (e) {
                            console.log(e);
                        }
                        //var record_cl = nlapiLoadRecord('customer', customerId)
                        //record_cl.setFieldValue('phone', phone_sl, false, true);
                        //var sl_id = nlapiSubmitRecord(record_cl, true,true);

                        // console.log('phone_sl '+phone_sl+'_customerId '+customerId+' sl_id'+sl_id);
                        ///////// New Change to set marketing category vijay/////////////
                        console.log('name' + name);
                        console.log('customer id' + customerId);
                        if (nlapiGetFieldValue(name)) {
                            var filters = [];
                            filters.push(new nlobjSearchFilter("custrecord_case_status_customer", null, "is", customerId));
                            var cols = [];
                            cols.push(new nlobjSearchColumn("custrecord_case_status_status"));
                            var exchangeResults = nlapiSearchRecord("customrecord_case_status", null, filters, cols);
                            var custid;
                            if (exchangeResults && exchangeResults.length == 1) {

                                var cStatus = exchangeResults[0].getValue("custrecord_case_status_status");
                                if (cStatus == 9 || cStatus == 10) {
                                    nlapiSubmitField("customer", customerId, "custentity_marketing_categories", 1);
                                }
                            }
                        }
                        break;
                    case "custpage_email":
                        nlapiSubmitField("customer", customerId, "email", nlapiGetFieldValue(name));

                        ///////// New Change to set marketing category vijay/////////////

                        if (nlapiGetFieldValue(name)) {
                            var filters = [];
                            filters.push(new nlobjSearchFilter("custrecord_case_status_customer", null, "is", customerId));
                            var cols = [];
                            cols.push(new nlobjSearchColumn("custrecord_case_status_status"));
                            var exchangeResults = nlapiSearchRecord("customrecord_case_status", null, filters, cols);
                            var custid;
                            if (exchangeResults && exchangeResults.length == 1) {

                                var cStatus = exchangeResults[0].getValue("custrecord_case_status_status");
                                if (cStatus == 9 || cStatus == 10) {
                                    nlapiSubmitField("customer", customerId, "custentity_marketing_categories", 1);
                                }

                            }
                        }
                        break;
                    case "custpage_how_did_they_find_us":
                        var leadsource=nlapiGetFieldValue(name);
                        var campaignCategory = "";
                        if (leadsource != null && leadsource != "" && leadsource != 'undefined' && !leadsource.match('NULL')) {
                            campaignCategory = nlapiLookupField("campaign", nlapiGetFieldValue(name), "category");
                        } else {
                          leadsource=null;
                          campaignCategory=null;
                        }
                        nlapiSubmitField("customer", customerId, ["campaigncategory", "leadsource"], [campaignCategory, leadsource]);
                        break;
                }
            } else if (name == "custpage_address" || name == "custpage_city" || name == "custpage_state" || name == "custpage_zip") {
                var addressStreet = nlapiGetFieldValue("custpage_address");
                var addressCity = nlapiGetFieldValue("custpage_city");
                var addressState = nlapiGetFieldText("custpage_state");
                var addressZip = nlapiGetFieldValue("custpage_zip");

                if (addressStreet == null || addressStreet == "" || addressCity == null || addressCity == "" || addressState == null || addressState == "" || addressZip == null || addressZip == "")
                    return true;

                var stateObj = mapState(addressState);

                var url = nlapiResolveURL("SUITELET", "customscript_address_update", "customdeploy_address_update");
                url += "&rectype=customer";
                url += "&recid=" + customerId;
                url += "&street=" + addressStreet;
                url += "&city=" + addressCity;
                url += "&state=" + stateObj.abbrev;
                url += "&zip=" + addressZip;
                url += "&name=" + nlapiGetFieldValue("custpage_first_name") + " " + nlapiGetFieldValue("custpage_last_name");

                nlapiRequestURL(url);
            }
        }
    } else if (name == "custpage_decedent" || name == "custpage_case_no" || name == "custpage_estate_state" || name == "custpage_estate_county" || name == "custpage_estate_est_date_distr" || name == "custpage_est_status") {
        var estateId = nlapiGetFieldValue("custpage_estate");

        if (estateId == null || estateId == "") {
            var estate = nlapiCreateRecord("customer");
            estate.setFieldValue("subsidiary", "2");
            estate.setFieldValue("isperson", "F");
            estate.setFieldValue("companyname", nlapiGetFieldValue("custpage_decedent"));
            estate.setFieldValue("custentity1", nlapiGetFieldValue("custpage_case_no"));
            estate.setFieldValue("custentity3", nlapiGetFieldValue("custpage_estate_state"));
            estate.setFieldValue("custentity2", nlapiGetFieldValue("custpage_estate_county"));
            estate.setFieldValue("custentity_est_date_of_distribution", nlapiGetFieldValue("custpage_estate_est_date_distr"));
            estate.setFieldValue("category", "2");
            estate.setFieldValue("custentity_est_status", nlapiGetFieldValue("custpage_est_status"));
            estateId = nlapiSubmitRecord(estate, true, true);

            //Check if customer created, if so, update it with parent
            var customer = nlapiGetFieldValue("custpage_customer_id");
            if (customer != null && customer != "")
                nlapiSubmitField("customer", customer, "parent", estateId);

            nlapiSetFieldValue("custpage_estate", estateId, false, true);
        } else if (estateId != null && estateId != "") {
            switch (name) {
                case "custpage_decedent":
                    nlapiSubmitField("customer", estateId, "companyname", nlapiGetFieldValue(name));
                    nlapiSetFieldValue("custpage_estate", estateId, false, true);
                    break;
                case "custpage_case_no":
                    nlapiSubmitField("customer", estateId, "custentity1", nlapiGetFieldValue(name));
                    break;
                case "custpage_estate_state":
                    nlapiSubmitField("customer", estateId, "custentity3", nlapiGetFieldValue(name));
                    break;
                case "custpage_estate_county":
                    nlapiSubmitField("customer", estateId, "custentity2", nlapiGetFieldValue(name));
                    break;
                case "custpage_estate_est_date_distr":
                    nlapiSubmitField("customer", estateId, "custentity_est_date_of_distribution", nlapiGetFieldValue(name));
                    break;
                case "custpage_est_status":
                    nlapiSubmitField("customer", estateId, "custentity_est_status", nlapiGetFieldValue(name));
                    break;
            }
        }

        if (name == "custpage_estate_state")
            nlapiSetFieldValue("custpage_jurisdiction_state", nlapiGetFieldValue("custpage_estate_state"), false, true);

        if (name == "custpage_estate_county") {
            nlapiSetFieldValue("custpage_jurisdiction_county", nlapiGetFieldValue("custpage_estate_county"), false, true);

            if (nlapiGetFieldValue("custpage_estate_county") != null && nlapiGetFieldValue("custpage_estate_county") != "")
                county = nlapiLookupField("customrecord173", nlapiGetFieldValue("custpage_estate_county"), ["custrecord_county_pleading_title", "custrecord_county_address_of_court", "custrecord_county_court_phone_number", "custrecord_county_court_name", "custrecord_court_street_address", "custrecord_court_city", "custrecord_court_state", "custrecord_court_zip"]);
            else
                county = null;

            if (county != null && county != "") {
                nlapiSetFieldValue("custpage_jurisdiction_pleading_title", county.custrecord_county_pleading_title, false, true);
                nlapiSetFieldValue("custpage_jurisdiction_court_name", county.custrecord_county_court_name, false, true);
                //nlapiSetFieldValue("custpage_jurisdiction_address_of_court",county.custrecord_county_address_of_court.something,false,true);
                nlapiSetFieldValue("custpage_jurisdiction_court_phone", county.custrecord_county_court_phone_number, false, true);
                nlapiSetFieldValue("custpage_jurisdiction_court_address", county.custrecord_court_street_address, false, true);
                nlapiSetFieldValue("custpage_jurisdiction_court_state", county.custrecord_court_state, false, true);
                nlapiSetFieldValue("custpage_jurisdiction_court_city", county.custrecord_court_city, false, true);
                nlapiSetFieldValue("custpage_jurisdiction_court_zip", county.custrecord_court_zip, false, true);
            }
        }

    } else if (name == "custpage_jurisdiction_court_address" || name == "custpage_jurisdiction_court_city" || name == "custpage_jurisdiction_court_state" || name == "custpage_jurisdiction_court_zip" || name == "custpage_jurisdiction_pleading_title" || name == "custpage_jurisdiction_address_of_court" || name == "custpage_jurisdiction_court_phone" || name == "custpage_jurisdiction_court_name") {
        var county = nlapiGetFieldValue("custpage_jurisdiction_county");

        if (county != null && county != "") {
            switch (name) {
                case "custpage_jurisdiction_court_name":
                    nlapiSubmitField("customrecord173", county, "custrecord_county_court_name", nlapiGetFieldValue(name));
                    break;
                case "custpage_jurisdiction_pleading_title":
                    nlapiSubmitField("customrecord173", county, "custrecord_county_pleading_title", nlapiGetFieldValue(name));
                    break;
                case "custpage_jurisdiction_address_of_court":
                    nlapiSubmitField("customrecord173", county, "custrecord_county_address_of_court", nlapiGetFieldValue(name));
                    break;
                case "custpage_jurisdiction_court_phone":
                    nlapiSubmitField("customrecord173", county, "custrecord_county_court_phone_number", nlapiGetFieldValue(name));
                    break;
                case "custpage_jurisdiction_court_address":
                    nlapiSubmitField("customrecord173", county, "custrecord_court_street_address", nlapiGetFieldValue(name));
                    break;
                case "custpage_jurisdiction_court_city":
                    nlapiSubmitField("customrecord173", county, "custrecord_court_city", nlapiGetFieldValue(name));
                    break;
                case "custpage_jurisdiction_court_state":
                    nlapiSubmitField("customrecord173", county, "custrecord_court_state", nlapiGetFieldValue(name));
                    break;
                case "custpage_jurisdiction_court_zip":
                    nlapiSubmitField("customrecord173", county, "custrecord_court_zip", nlapiGetFieldValue(name));
                    break;
            }
        }
    } else if (name == "custpage_jurisdiction_county") {
        var county = nlapiGetFieldValue("custpage_jurisdiction_county");
        nlapiSetFieldValue("custpage_estate_county", county, false, true);

        if (county != null && county != "") {
            county = nlapiLookupField("customrecord173", nlapiGetFieldValue("custpage_jurisdiction_county"), ["custrecord_county_pleading_title", "custrecord_county_address_of_court", "custrecord_county_court_phone_number", "custrecord_county_court_name", "custrecord_court_street_address", "custrecord_court_city", "custrecord_court_state", "custrecord_court_zip"]);

            nlapiSetFieldValue("custpage_jurisdiction_pleading_title", county.custrecord_county_pleading_title, false, true);
            nlapiSetFieldValue("custpage_jurisdiction_court_name", county.custrecord_county_court_name, false, true);
            nlapiSetFieldValue("custpage_jurisdiction_court_phone", county.custrecord_county_court_phone_number, false, true);
            nlapiSetFieldValue("custpage_jurisdiction_court_address", county.custrecord_court_street_address, false, true);
            nlapiSetFieldValue("custpage_jurisdiction_court_state", county.custrecord_court_state, false, true);
            nlapiSetFieldValue("custpage_jurisdiction_court_city", county.custrecord_court_city, false, true);
            nlapiSetFieldValue("custpage_jurisdiction_court_zip", county.custrecord_court_zip, false, true);
        } else {
            nlapiSetFieldValue("custpage_jurisdiction_pleading_title", "", false, true);
            nlapiSetFieldValue("custpage_jurisdiction_court_name", "", false, true);
            nlapiSetFieldValue("custpage_jurisdiction_court_phone", "", false, true);
            nlapiSetFieldValue("custpage_jurisdiction_court_address", "", false, true);
            nlapiSetFieldValue("custpage_jurisdiction_court_state", "", false, true);
            nlapiSetFieldValue("custpage_jurisdiction_court_city", "", false, true);
            nlapiSetFieldValue("custpage_jurisdiction_court_zip", "", false, true);
        }
    } else if (name == "custpage_estate_filing_date") {
        calculateMonths();

        var estateId = nlapiGetFieldValue("custpage_estate");

        if (estateId != null && estateId != "")
            nlapiSubmitField("customer", estateId, "custentity_filing_date", nlapiGetFieldValue(name));
    } else if (name == "custpage_attorney_name" || name == "custpage_firm_name" || name == "custpage_attorney_address" || name == "custpage_attorney_city" || name == "custpage_attorney_state" || name == "custpage_attorney_zip" || name == "custpage_attorney_phone" || name == "custpage_attorney_email") {
        addUpdateContact("attorney", name);
    } else if (name == "custpage_personal_rep_1" || name == "custpage_personal_rep_1_address" || name == "custpage_personal_rep_1_city" || name == "custpage_personal_rep_1_state" || name == "custpage_personal_rep_1_zip" || name == "custpage_personal_rep_1_phone" || name == "custpage_personal_rep_1_email") {
        addUpdateContact("personal", name);
    } else if (name == "custpage_notes") {
        var customerId = nlapiGetFieldValue("custpage_customer_id");

        if (customerId != null && customerId != "") {
            //Create new user note
            var note = nlapiCreateRecord("note");
            note.setFieldValue("entity", customerId);
            note.setFieldValue("note", nlapiGetFieldValue("custpage_notes"));
            var noteId = nlapiSubmitRecord(note, true, true);

            //Refresh files sublist with new values
            var url = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&r=T&machine=custpage_user_notes&compid=5295340&customer=' + nlapiGetFieldValue("custpage_customer_id") + '&estate=' + nlapiGetFieldValue("custpage_estate");
            document.getElementById('server_commands').src = url;
        }
    } else if (type == "custpage_prior_quotes" && name == "custpage_quote_status") {
        console.log("In field changes for quotes sublist, status field");

        var quoteId = nlapiGetLineItemValue("custpage_prior_quotes", "custpage_quote_internalid", line);
        var quoteStatus = nlapiGetLineItemValue("custpage_prior_quotes", "custpage_quote_status", line);

        if (quoteId != null && quoteId != "") {
            console.log("Updating status on quote " + quoteId);

            nlapiSubmitField("estimate", quoteId, "custbody_quote_status", quoteStatus);
        }
    } else if (type == "custpage_prior_quotes" && name == "custpage_quote_preferred") {
        var quoteId = nlapiGetCurrentLineItemValue("custpage_prior_quotes", "custpage_quote_internalid");
        var isPreferred = nlapiGetCurrentLineItemValue("custpage_prior_quotes", "custpage_quote_preferred");

        if (quoteId != null && quoteId != "") {
            console.log("Updating status on quote " + quoteId);

            nlapiSubmitField("estimate", quoteId, "custbody_preferred_quote", isPreferred);

            for (var x = 0; x < nlapiGetLineItemCount("custpage_prior_quotes"); x++) {
                if (nlapiGetLineItemValue("custpage_prior_quotes", "custpage_quote_preferred", x + 1) == "T" && nlapiGetLineItemValue("custpage_prior_quotes", "custpage_quote_internalid", x + 1) != quoteId) {
                    nlapiSetLineItemValue("custpage_prior_quotes", "custpage_quote_preferred", x + 1, "F");
                    nlapiSubmitField("estimate", nlapiGetLineItemValue("custpage_prior_quotes", "custpage_quote_internalid", x + 1), "custbody_preferred_quote", "F");
                }
            }
        }
    }
    /*else if (name == "custpage_latest_status") {
    try {
    var caseStatus = nlapiGetFieldValue("custpage_latest_status");
    var caseStatusRec = nlapiGetFieldValue("custpage_latest_status_id");

    nlapiSubmitField("customrecord_case_status", caseStatusRec, "custrecord_case_status_status", caseStatus);
    } catch (err) {
    nlapiLogExecution("error", "Error Updating Case Status", "Details: " + err.message);
    }

    }*/
    else if (name == 'custpage_latest_status') {
        try {
            console.log(name)
            var caseNotes = nlapiGetFieldValue("custpage_latest_status_notes");
            var caseStatus = nlapiGetFieldValue("custpage_latest_status");
            var customer = nlapiGetFieldValue("custpage_customer_id");
            if (caseStatus) {
                //Create new case status note
                var caseStatusRec = nlapiCreateRecord("customrecord_case_status");
                if (caseStatus != '' && caseStatus != null)
                    caseStatusRec.setFieldValue("custrecord_case_status_status", caseStatus);
                if (caseNotes != '' && caseNotes != '')
                    caseStatusRec.setFieldValue("custrecord_case_status_notes", caseNotes);
                caseStatusRec.setFieldValue("custrecord_case_status_customer", customer);
                var caseStatusRecId = nlapiSubmitRecord(caseStatusRec, true, true);
                console.log(caseStatusRecId)
                //Update latest status ID
                nlapiSetFieldValue("custpage_latest_status_id", caseStatusRecId, true, true);
            }
        } catch (err) {
            nlapiLogExecution("error", "Error Updating Case Status Notes", "Details: " + err.message);
        }
    } else if (name == "custpage_latest_status_notes") {
        try {
            console.log(name)
            var caseNotes = nlapiGetFieldValue("custpage_latest_status_notes");
            var caseStatus = nlapiGetFieldValue("custpage_latest_status");
            var customer = nlapiGetFieldValue("custpage_customer_id");
            if (caseNotes) {
                //Create new case status note
                var caseStatusRec = nlapiCreateRecord("customrecord_case_status");
                if (caseStatus != '' && caseStatus != null)
                    caseStatusRec.setFieldValue("custrecord_case_status_status", caseStatus);
                if (caseNotes != '' && caseNotes != '')
                    caseStatusRec.setFieldValue("custrecord_case_status_notes", caseNotes);
                caseStatusRec.setFieldValue("custrecord_case_status_customer", customer);
                var caseStatusRecId = nlapiSubmitRecord(caseStatusRec, true, true);
                console.log(caseStatusRecId)
                //Update latest status ID
                nlapiSetFieldValue("custpage_latest_status_id", caseStatusRecId, true, true);
            }
        } catch (err) {
            nlapiLogExecution("error", "Error Updating Case Status Notes", "Details: " + err.message);
        }
    } else if (name == "custpage_sales_rep") {

        var customerId = nlapiGetFieldValue("custpage_customer_id");
        console.log('Enter' + name + '////////' + customerId + '//////' + nlapiGetFieldValue("custpage_sales_rep"));
        if (customerId) {
            var salesrep = nlapiGetFieldValue("custpage_sales_rep");
          if(!salesrep || salesrep=='undefined')
            salesrep=null;
            var customerId = nlapiSubmitField("customer", customerId, ["salesrep", "custentity_sales_rep"], [salesrep, salesrep]);
            //var customerId=nlapiSubmitField("customer", customerId, ["salesrep"], [salesrep]);
            console.log('submit Enter' + customerId);

        }
    } else if (name == 'custpage_followup_type') {
        var customerId = nlapiGetFieldValue("custpage_customer_id");
        if (customerId != null && customerId != "") {
            nlapiSubmitField("customer", customerId, "custentity_follow_up_type", nlapiGetFieldValue(name));
        }
    } else if (name == 'custpage_followup_completed' && type == 'custpage_followup_list') {
        var completed = nlapiGetCurrentLineItemValue("custpage_followup_list", "custpage_followup_completed");
        var followupId = nlapiGetCurrentLineItemValue("custpage_followup_list", "custpage_followup_id");
        var curruser = nlapiGetContext().user;
        if (followupId != null && followupId != "") {
            var dateVal = nlapiDateToString(new Date(), 'datetimetz');
            nlapiSubmitField("customrecord_customer_follow_up", followupId, ["custrecord_followup_completed", "custrecord_complete_date", "custrecord_followup_completedby"], [completed, dateVal, curruser]);
            //nlapiSetCurrentLineItemDateTimeValue("custpage_followup_list", "custpage_followup_completed_date",dateVal);
            nlapiSetCurrentLineItemValue("custpage_followup_list", "custpage_followup_completed_date", dateVal);
            nlapiSetCurrentLineItemValue("custpage_followup_list", "custpage_followup_completedby", curruser);
        }
    } else if (name == 'custpage_followup_completedby' && type == 'custpage_followup_list') {
        var followupId = nlapiGetCurrentLineItemValue("custpage_followup_list", "custpage_followup_id");
        var completedby = nlapiGetCurrentLineItemValue("custpage_followup_list", "custpage_followup_completedby");
        if (followupId != null && followupId != "") {
            nlapiSubmitField("customrecord_customer_follow_up", followupId, ["custrecord_followup_completedby"], [completedby]);
        }
    } else if (name == 'custpage_diligence_blocked_account_letter') {
        //alert(nlapiGetFieldValue("custpage_diligence_blocked_account_letter"));
        var customerId = nlapiGetFieldValue("custpage_customer_id");
        var estate = nlapiGetFieldValue("custpage_estate");
        if (customerId)
            nlapiSubmitField("customer", customerId, "custentity_blocked_account_letter", nlapiGetFieldValue("custpage_diligence_blocked_account_letter"));
        else if (estate)
            nlapiSubmitField("customer", estate, "custentity_blocked_account_letter", nlapiGetFieldValue("custpage_diligence_blocked_account_letter"));
    } else if (name == 'custpage_problem_case') {
        //alert(nlapiGetFieldValue("custpage_diligence_blocked_account_letter"));
        var customerId = nlapiGetFieldValue("custpage_customer_id");
        var estate = nlapiGetFieldValue("custpage_estate");
        if (customerId)
            nlapiSubmitField("customer", customerId, "custentity_problem_case", nlapiGetFieldValue("custpage_problem_case"));
        else if (estate)
            nlapiSubmitField("customer", estate, "custentity_problem_case", nlapiGetFieldValue("custpage_problem_case"));
    }
    clearchanged();
}

function attachAssignment(invoiceId) {
    var url = nlapiResolveURL("SUITELET", "customscript_document_uploader", "customdeploy_document_uploader");
    url += "&invoice=" + invoiceId;

    window.open(url, 'docUploadWin', 'dependent=yes,width=500,height=300');
}

function fileUploadCallback() {
    //Refresh files sublist with new values
    var url = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&r=T&machine=custpage_invoice_list&compid=5295340&customer=' + nlapiGetFieldValue("custpage_customer_id") + '&estate=' + nlapiGetFieldValue("custpage_estate");
    document.getElementById('server_commands').src = url;
}

function New_Cust_App_CS_VF(type, name, linenum) {
//  alert('validate_field');
    if (type == "custpage_properties" && name == "custpage_property_mortgage") {
        try {
            //Ensure mortgage is positive value
            var mortgage = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_mortgage");

            if (mortgage != null && mortgage != "" && mortgage < 0) {
                alert("Mortgage value must be positive.");
                return false;
            } else {
                return true;
            }
        } catch (err) {
            nlapiLogExecution("error", "Error Checking Mortgage Value to Be Positive", "Details: " + err.message);
            return true;
        }
    } else if (type == "custpage_claims" && name == "custpage_claims_value") {
        try {
            //Ensure claim amount is positive value
            var claim = nlapiGetCurrentLineItemValue("custpage_claims", "custpage_claims_value");

            if (claim != null && claim != "" && claim < 0) {
                alert("Claim value must be positive.");
                return false;
            } else {
                return true;
            }
        } catch (err) {
            nlapiLogExecution("error", "Error Checking Claim Value to Be Positive", "Details: " + err.message);
            return true;
        }
    } else if (name == "custpage_liens_judgments" || name == "custpage_bequest_due") {
        try {
            //Ensure amount is positive value
            var value = nlapiGetFieldValue(name);

            if (value != null && value != "" && value < 0) {
                alert("Value must be positive.");
                nlapiSetFieldValue(name, "", false, true);
                return false;
            } else {
                return true;
            }
        } catch (err) {
            nlapiLogExecution("error", "Error Checking Value to Be Positive", "Details: " + err.message);
            return true;
        }
    } else if (name == "custpage_customer_id") {
        //Verify to see if customer is customer versus estate
        var category = nlapiLookupField("customer", nlapiGetFieldValue(name), "category");

        if (category != "1") {
            alert("You have selected an Estate. Please select a Customer for this field only.");
            return false;
        }

        return true;
    } else if (name == "custpage_estate") {
        //Verify to see if customer is customer versus estate
        var category = nlapiLookupField("customer", nlapiGetFieldValue(name), "category");

        if (category != "2") {
            alert("You have selected a Customer. Please select an Estate for this field only.");
            return false;
        }

        return true;
    } else {
        return true;
    }
}

/*
  function calcEstateTotals() {
    calculateMonths();
    var customerId = nlapiGetFieldValue("custpage_customer_id");
    var estateId = nlapiGetFieldValue("custpage_estate");

    var properties = 0.00;
    var assets = 0.00;
    var claims = 0.00;

    var closing = 0.00;

    for (var x = 0; x < nlapiGetLineItemCount("custpage_properties"); x++) {
        properties += parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_total", x + 1));

        closing += (parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_value", x + 1)) * (parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_owned", x + 1)) / 100));
    }

    for (var x = 0; x < nlapiGetLineItemCount("custpage_accounts"); x++) {
        assets += parseFloat(nlapiGetLineItemValue("custpage_accounts", "custpage_accounts_value", x + 1));
    }

    for (var x = 0; x < nlapiGetLineItemCount("custpage_claims"); x++) {
        claims += parseFloat(nlapiGetLineItemValue("custpage_claims", "custpage_claims_value", x + 1));
    }

    nlapiSetFieldValue("custpage_total_property", parseInt(properties), true, true);
    nlapiSetFieldValue("custpage_total_assets", parseInt(assets), true, true);
    nlapiSetFieldValue("custpage_total_claims", parseInt(claims), true, true);

    nlapiSetFieldValue("custpage_closing_costs", parseInt(closing * 0.06), true, true);

    var attorneyFee = (properties + assets) * 0.06;
    if (attorneyFee < 3000)
        attorneyFee = 3000;

    nlapiSetFieldValue("custpage_attorney_fees", parseInt(attorneyFee), true, true);

    var total = parseFloat(properties) + parseFloat(assets) - parseFloat(claims) - parseFloat(nlapiGetFieldValue("custpage_specific_bequests")) - parseFloat(nlapiGetFieldValue("custpage_closing_costs")) - parseFloat(nlapiGetFieldValue("custpage_attorney_fees"));
    nlapiSetFieldValue("custpage_net_equity_value_1", parseInt(total), true, true);

}
*/

function calcEstateTotals() {
  if(!window.hasOwnProperty('values')){
    window.values={};
  }
    calculateMonths();
    var customerId = nlapiGetFieldValue("custpage_customer_id");
    var estateId = nlapiGetFieldValue("custpage_estate");

    var properties = 0.00;
    var assets = 0.00;
    var claims = 0.00;

    var closing = 0.00;
    window.values.properties10=0.0;

    for (var x = 0; x < nlapiGetLineItemCount("custpage_properties"); x++) {
      var propvalue=parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_value", x + 1));
      var propmort=parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_mortgage", x + 1));
      var propowned=parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_owned", x + 1));
      var proptotal=parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_total", x + 1));
        properties += proptotal;
      window.values.properties10+=(0.9*propvalue-propmort)*propowned/100||0;

        closing += (parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_value", x + 1)) * (parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_owned", x + 1)) / 100));
    }
      window.values.properties=parseFloat(properties);
      window.values.closing=parseFloat(closing)||0;

    for (var x = 0; x < nlapiGetLineItemCount("custpage_accounts"); x++) {
        assets += parseFloat(nlapiGetLineItemValue("custpage_accounts", "custpage_accounts_value", x + 1));
    }
  window.values.assets=parseFloat(assets)||0;

    for (var x = 0; x < nlapiGetLineItemCount("custpage_claims"); x++) {
        claims += parseFloat(nlapiGetLineItemValue("custpage_claims", "custpage_claims_value", x + 1));
    }
  window.values.claims=parseFloat(claims)||0;

    nlapiSetFieldValue("custpage_total_property", parseInt(properties), true, true);
    nlapiSetFieldValue("custpage_total_assets", parseInt(assets), true, true);
    nlapiSetFieldValue("custpage_total_claims", parseInt(claims), true, true);

    nlapiSetFieldValue("custpage_closing_costs", parseInt(closing * 0.06), true, true);

    var attorneyFee = (properties + assets) * 0.06;
    if (attorneyFee < 3000)
        attorneyFee = 3000;

    nlapiSetFieldValue("custpage_attorney_fees", parseInt(attorneyFee), true, true);

    var total = parseFloat(properties) + parseFloat(assets) - parseFloat(claims) - parseFloat(nlapiGetFieldValue("custpage_specific_bequests")) - parseFloat(nlapiGetFieldValue("custpage_closing_costs")) - parseFloat(nlapiGetFieldValue("custpage_attorney_fees"));
    nlapiSetFieldValue("custpage_net_equity_value_1", parseInt(total), true, true);
}

function New_Cust_App_CS_Recalc(type) {
    if (type == "custpage_properties" || type == "custpage_accounts" || type == "custpage_claims") {
        try {
            calcEstateTotals();
            calculateMonths();
        } catch (err) {
            nlapiLogExecution("error", "Error Calculating Totals", "Details: " + err.message);
            console.log("Error Calculating Totals: " + err.message);
        }
    } else if (type == "custpage_other_assignments") {
        calcTotalAssignments();
    } else if (type == "custpage_leins_judgements_list") {
        calcTotalLeins();
    }
}

function calcTotalAssignments() {
    var totalAssignments = 0.00;

    for (var x = 0; x < nlapiGetLineItemCount("custpage_other_assignments"); x++) {
        totalAssignments += parseFloat(nlapiGetLineItemValue("custpage_other_assignments", "custpage_other_assignment", x + 1));
    }

    nlapiSetFieldValue("custpage_existing_agreements", parseInt(totalAssignments), true, true);
//*
  var customerId = nlapiGetFieldValue("custpage_customer_id");
  if(customerId!=null && customerId!='') {
    var totalopeninvoices=0.0;
    var invoiceSearch = nlapiSearchRecord("invoice",null,
      [
         ["type","anyof","CustInvc"], 
         "AND", 
         ["status","anyof","CustInvc:A"], 
         "AND", 
         ["mainline","is","T"], 
         "AND", 
         ["customer.internalid","anyof",customerId], 
      ], 
      [
         new nlobjSearchColumn("amountremaining")
      ]
    );
    if(invoiceSearch) {
      invoiceSearch.forEach(function (result) {
        totalopeninvoices+=parseFloat(result.rawValues[0].value);
        return true;
      });
    }
    nlapiSetFieldValue("custpage_invoices_total_assignments", totalopeninvoices);
  }
//*/
}

function calcTotalLeins() {
    var totalLeins = 0.00;

    for (var x = 0; x < nlapiGetLineItemCount("custpage_leins_judgements_list"); x++) {
        totalLeins += parseFloat(nlapiGetLineItemValue("custpage_leins_judgements_list", "custpage_lein_judgement_amount", x + 1));
    }

    nlapiSetFieldValue("custpage_liens_judgments", parseInt(totalLeins), true, true);
}

function New_Cust_App_CS_LI(type) {
    try {
        var completed = nlapiGetCurrentLineItemValue(type, "custpage_followup_completed");
        if (completed == 'T') {
            nlapiDisableLineItemField(type, "custpage_followup_completed", true);
        } else {
            nlapiDisableLineItemField(type, "custpage_followup_completed", false);
        }
        if (completed == 'T') {
            nlapiDisableLineItemField(type, "custpage_followup_completedby", true);
        } else {
            nlapiDisableLineItemField(type, "custpage_followup_completedby", false);
        }
        if (type != "custpage_other_assignments")
            return;

        var companyname = nlapiGetCurrentLineItemValue(type, "custpage_other_company");

        if (companyname.search("Probate Advance #") != -1) {
            nlapiDisableLineItemField(type, "custpage_other_company", true);
            nlapiDisableLineItemField(type, "custpage_other_date", true);
            nlapiDisableLineItemField(type, "custpage_other_assignment", true);
            //nlapiDisableLineItemField(type, "custpage_other_priority", true);
            //jQuery('#custpage_other_assignments_addedit').prop('disabled', true);
            //custpage_other_assignments_machine.clearline(true);
        } else {
            nlapiDisableLineItemField(type, "custpage_other_company", false);
            nlapiDisableLineItemField(type, "custpage_other_date", false);
            nlapiDisableLineItemField(type, "custpage_other_assignment", false);
            //nlapiDisableLineItemField(type, "custpage_other_priority", false);
            //jQuery('#custpage_other_assignments_addedit').prop('disabled', false);
        }
    } catch (err) {
        nlapiLogExecution("error", "Error Executing Validate Line (Sublist ID: " + type + ")", "Details: " + err.message);
    }
}

function New_Cust_App_CS_VL(type) {
    try {
        if (type == "custpage_properties") {
            console.log("In properties sublist validate line function...");

            var recordId = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_id");

            if (recordId != null && recordId != "") {
                console.log("Line has a record already, updating");

                var fields = ["name", "custrecord_property_value", "custrecord_property_mortgage", "custrecord_property_percent_owned", "custrecord_property_total"];
                var data = [];
                data.push(nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_address"));
                data.push(nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_value"));
                data.push(nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_mortgage"));
                data.push(nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_owned"));
                data.push(nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_total"));

                nlapiSubmitField("customrecord_property", recordId, fields, data);
            } else {
                console.log("Creating new record");

                var property = nlapiCreateRecord("customrecord_property");
                property.setFieldValue("name", nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_address"));
                property.setFieldValue("custrecord_property_value", nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_value"));
                property.setFieldValue("custrecord_property_mortgage", nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_mortgage"));
                property.setFieldValue("custrecord_property_percent_owned", nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_owned"));
                property.setFieldValue("custrecord_property_total", nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_total"));
                property.setFieldValue("custrecord_property_estate", nlapiGetFieldValue("custpage_estate"));
                var propertyId = nlapiSubmitRecord(property, true, true);

                nlapiSetCurrentLineItemValue("custpage_properties", "custpage_property_id", propertyId, false, true);
            }
        } else if (type == "custpage_accounts") {
            var recordId = nlapiGetCurrentLineItemValue("custpage_accounts", "custpage_accounts_id");

            if (recordId != null && recordId != "") {
                var fields = ["name", "custrecord_asset_date", "custrecord_asset_value"];
                var data = [];
                data.push(nlapiGetCurrentLineItemValue("custpage_accounts", "custpage_accounts_name"));
                data.push(nlapiGetCurrentLineItemValue("custpage_accounts", "custpage_accounts_date"));
                data.push(nlapiGetCurrentLineItemValue("custpage_accounts", "custpage_accounts_value"));

                nlapiSubmitField("customrecord_asset", recordId, fields, data);
            } else {
                var account = nlapiCreateRecord("customrecord_asset");
                account.setFieldValue("name", nlapiGetCurrentLineItemValue("custpage_accounts", "custpage_accounts_name"));
                account.setFieldValue("custrecord_asset_date", nlapiGetCurrentLineItemValue("custpage_accounts", "custpage_accounts_date"));
                account.setFieldValue("custrecord_asset_value", nlapiGetCurrentLineItemValue("custpage_accounts", "custpage_accounts_value"));
                account.setFieldValue("custrecord_asset_estate", nlapiGetFieldValue("custpage_estate"));
                var accountId = nlapiSubmitRecord(account, true, true);

                nlapiSetCurrentLineItemValue("custpage_accounts", "custpage_accounts_id", accountId, false, true);
            }
        } else if (type == "custpage_claims") {
            var recordId = nlapiGetCurrentLineItemValue("custpage_claims", "custpage_claim_id");

            if (recordId != null && recordId != "") {
                var fields = ["name", "custrecord_claim_date", "custrecord_claim_value"];
                var data = [];
                data.push(nlapiGetCurrentLineItemValue("custpage_claims", "custpage_claims_name"));
                data.push(nlapiGetCurrentLineItemValue("custpage_claims", "custpage_claims_date"));
                data.push(nlapiGetCurrentLineItemValue("custpage_claims", "custpage_claims_value"));

                nlapiSubmitField("customrecord_claim", recordId, fields, data);
            } else {
                var claim = nlapiCreateRecord("customrecord_claim");
                claim.setFieldValue("name", nlapiGetCurrentLineItemValue("custpage_claims", "custpage_claims_name"));
                claim.setFieldValue("custrecord_claim_date", nlapiGetCurrentLineItemValue("custpage_claims", "custpage_claims_date"));
                claim.setFieldValue("custrecord_claim_value", nlapiGetCurrentLineItemValue("custpage_claims", "custpage_claims_value"));
                claim.setFieldValue("custrecord_claim_estate", nlapiGetFieldValue("custpage_estate"));
                var claimId = nlapiSubmitRecord(claim, true, true);

                nlapiSetCurrentLineItemValue("custpage_claims", "custpage_claim_id", claimId, false, true);
            }
        } else if (type == "custpage_other_assignments") {
            var recordId = nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_assignment_id");

            console.log("RecordId = " + recordId);
            if (recordId != null && recordId != "") {
                var fields = ["name", "custrecord_existing_assignment_date", "custrecord_existing_assignment_amount", "custrecord_existing_assignment_priority"];
                var data = [];
                data.push(nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_company"));
                data.push(nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_date"));
                data.push(nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_assignment"));
                data.push(nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_priority"));
                nlapiSubmitField("customrecord_existing_assignment", recordId, fields, data);
            } else {
                var assignment = nlapiCreateRecord("customrecord_existing_assignment");
                assignment.setFieldValue("name", nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_company"));
                assignment.setFieldValue("custrecord_existing_assignment_date", nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_date"));
                assignment.setFieldValue("custrecord_existing_assignment_amount", nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_assignment"));
                assignment.setFieldValue("custrecord_existing_assignment_estate", nlapiGetFieldValue("custpage_estate"));
                assignment.setFieldValue("custrecord_existing_assignment_customer", nlapiGetFieldValue("custpage_customer_id"));
                assignment.setFieldValue("custrecord_existing_assignment_priority", nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_priority"));
                console.log("Periority = " + nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_priority"));
                var assignmentId = nlapiSubmitRecord(assignment, true, true);

                nlapiSetCurrentLineItemValue("custpage_other_assignments", "custpage_assignment_id", assignmentId, false, true);
            }
        } else if (type == "custpage_leins_judgements_list") {
            var recordId = nlapiGetCurrentLineItemValue("custpage_leins_judgements_list", "custpage_lein_id");

            if (recordId != null && recordId != "") {
                var fields = ["name", "custrecord_lein_judgement_date", "custrecord_lein_judgement_amount"];
                var data = [];
                data.push(nlapiGetCurrentLineItemValue("custpage_leins_judgements_list", "custpage_lein_judgement_name"));
                data.push(nlapiGetCurrentLineItemValue("custpage_leins_judgements_list", "custpage_lein_judgement_date"));
                data.push(nlapiGetCurrentLineItemValue("custpage_leins_judgements_list", "custpage_lein_judgement_amount"));

                nlapiSubmitField("customrecord_lein_judgement", recordId, fields, data);
            } else {
                var lein = nlapiCreateRecord("customrecord_lein_judgement");
                lein.setFieldValue("name", nlapiGetCurrentLineItemValue("custpage_leins_judgements_list", "custpage_lein_judgement_name"));
                lein.setFieldValue("custrecord_lein_judgement_date", nlapiGetCurrentLineItemValue("custpage_leins_judgements_list", "custpage_lein_judgement_date"));
                lein.setFieldValue("custrecord_lein_judgement_amount", nlapiGetCurrentLineItemValue("custpage_leins_judgements_list", "custpage_lein_judgement_amount"));
                lein.setFieldValue("custrecord_lein_judgement_estate", nlapiGetFieldValue("custpage_estate"));
                lein.setFieldValue("custrecord_lein_judgement_customer", nlapiGetFieldValue("custpage_customer_id"));
                var leinId = nlapiSubmitRecord(lein, true, true);

                nlapiSetCurrentLineItemValue("custpage_leins_judgements_list", "custpage_lein_id", leinId, false, true);
            }
        } else if (type == "custpage_case_status_list") {
            var caseStatusId = nlapiGetCurrentLineItemValue("custpage_case_status_list", "custpage_case_status_id");
            var caseStatus = nlapiGetCurrentLineItemValue("custpage_case_status_list", "custpage_case_status_status");
            var caseStatusNotes = nlapiGetCurrentLineItemValue("custpage_case_status_list", "custpage_case_status_notes");

            if (caseStatusId == null || caseStatusId == "") {
                var statusRec = nlapiCreateRecord("customrecord_case_status");
                statusRec.setFieldValue("custrecord_case_status_status", caseStatus);
                statusRec.setFieldValue("custrecord_case_status_notes", caseStatusNotes);
                statusRec.setFieldValue("custrecord_case_status_customer", nlapiGetFieldValue("custpage_customer_id"));
                var statusRecId = nlapiSubmitRecord(statusRec, true, true);

                var timestamp = nlapiLookupField("customrecord_case_status", statusRecId, "created");
                var user = nlapiLookupField("customrecord_case_status", statusRecId, "owner", true);

                nlapiSetCurrentLineItemValue("custpage_case_status_list", "custpage_case_status_id", statusRecId, false, true);
                nlapiSetCurrentLineItemValue("custpage_case_status_list", "custpage_case_status_user", user, false, true);
                nlapiSetCurrentLineItemValue("custpage_case_status_list", "custpage_case_status_timestamp", timestamp, false, true);

                nlapiSetFieldValue("custpage_latest_status", caseStatus, false, true);
                nlapiSetFieldValue("custpage_latest_status_notes", caseStatusNotes, false, true);

            }
        } else if (type == "custpage_contacts") {
            var recordId = nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_id");

            if (recordId != null && recordId != "") {
                var fields = ["name", "jobtitle", "email", "phone"];

                var data = [];
                data.push(nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_name"));
                data.push(nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_job_title"));
                data.push(nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_email"));
                data.push(nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_phone"));

                nlapiSubmitField("contact", recordId, fields, data);
            } else {
                var contact = nlapiCreateRecord("contact", {
                    recordmode: "dynamic"
                });
                contact.setFieldValue("company", nlapiGetFieldValue("custpage_estate"));
                contact.setFieldValue("entityid", nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_name"));
                contact.setFieldValue("jobtitle", nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_job_title"));
                contact.setFieldValue("email", nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_email"));
                contact.setFieldValue("phone", nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_phone"));
                contact.setFieldValue("contactrole", nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_role"));
                var contactId = nlapiSubmitRecord(contact, true, true);

                nlapiSetCurrentLineItemValue("custpage_contacts", "custpage_contacts_id", contactId, false, true);
            }
        } else if (type == "custpage_phonecalls") {
            var recordId = nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_id");

            if (recordId != null && recordId != "") {
                var fields = ["title", "startdate", "phone", "assigned", "message"];

                var data = [];
                data.push(nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_title"));
                data.push(nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_date"));
                data.push(nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_phone_number"));
                data.push(nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_owner"));
                data.push(nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_message"));

                nlapiSubmitField("phonecall", recordId, fields, data);
            } else {
                var phonecall = nlapiCreateRecord("phonecall", {
                    recordmode: "dynamic"
                });
                phonecall.setFieldValue("company", nlapiGetFieldValue("custpage_estate"));
                phonecall.setFieldValue("title", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_title"));
                phonecall.setFieldValue("startdate", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_date"));
                phonecall.setFieldValue("phone", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_phone_number"));
                phonecall.setFieldValue("assigned", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_owner"));
                phonecall.setFieldValue("message", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_message"));
                var phonecallId = nlapiSubmitRecord(phonecall, true, true);

                nlapiSetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_id", phonecallId, false, true);

                //Update field for latest phone call
                var lastCallStr = nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_date") + " " + nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_title");
                nlapiSetFieldValue("custpage_estate_next_phonecall", lastCallStr, true, true);
            }
        } else if (type == "custpage_tasks") {
            var recordId = nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_id");

            if (recordId != null && recordId != "") {
                var fields = ["title", "startdate", "priority", "duedate"];

                var data = [];
                data.push(nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_title"));
                data.push(nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_start_date"));
                data.push(nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_priority"));
                data.push(nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_due_date"));

                nlapiSubmitField("task", recordId, fields, data);
            } else {
                var task = nlapiCreateRecord("task", {
                    recordmode: "dynamic"
                });
                task.setFieldValue("company", nlapiGetFieldValue("custpage_estate"));
                task.setFieldValue("title", nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_title"));
                task.setFieldValue("startdate", nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_start_date"));
                task.setFieldValue("priority", nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_priority"));
                task.setFieldValue("duedate", nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_due_date"));
                var taskId = nlapiSubmitRecord(task, true, true);

                nlapiSetCurrentLineItemValue("custpage_tasks", "custpage_tasks_id", taskId, false, true);
            }
        } else if (type == "custpage_events") {
            var recordId = nlapiGetCurrentLineItemValue("custpage_events", "custpage_events_id");

            if (recordId != null && recordId != "") {
                var fields = ["title", "startdate", "location", "alldayevent", "starttime", "endtime"];

                var data = [];
                data.push(nlapiGetCurrentLineItemValue("custpage_events", "custpage_events_title"));
                data.push(nlapiGetCurrentLineItemValue("custpage_events", "custpage_events_date"));
                //data.push(nlapiGetCurrentLineItemValue("custpage_events","custpage_events_location"));
                //data.push(nlapiGetCurrentLineItemValue("custpage_events","custpage_events_all_day"));
                //data.push(nlapiGetCurrentLineItemValue("custpage_events","custpage_events_start_time"));
                //data.push(nlapiGetCurrentLineItemValue("custpage_events","custpage_events_end_time"));

                nlapiSubmitField("calendarevent", recordId, fields, data);
            } else {
                var event = nlapiCreateRecord("calendarevent", {
                    recordmode: "dynamic"
                });
                event.setFieldValue("company", nlapiGetFieldValue("custpage_estate"));
                event.setFieldValue("title", nlapiGetCurrentLineItemValue("custpage_events", "custpage_events_title"));
                event.setFieldValue("startdate", nlapiGetCurrentLineItemValue("custpage_events", "custpage_events_date"));
                //event.setFieldValue("location",nlapiGetCurrentLineItemValue("custpage_events","custpage_events_location"));
                //event.setFieldValue("alldayevent",nlapiGetCurrentLineItemValue("custpage_events","custpage_events_all_day"));
                //event.setFieldValue("starttime",nlapiGetCurrentLineItemValue("custpage_events","custpage_events_start_time"));
                //event.setFieldValue("endtime",nlapiGetCurrentLineItemValue("custpage_events","custpage_events_end_time"));
                var eventId = nlapiSubmitRecord(event, true, true);

                nlapiSetCurrentLineItemValue("custpage_events", "custpage_events_id", eventId, false, true);

                //Update field for latest event
                //        var lastEventStr = nlapiGetCurrentLineItemValue("custpage_events", "custpage_events_date") + " " + nlapiGetCurrentLineItemValue("custpage_events", "custpage_events_title");
                //        nlapiSetFieldValue("custpage_estate_next_event", lastEventStr, true, true);
                // added by RM on 8/15/2023 to fix the Next Event field
                setnextevent();
            }
        }
    } catch (err) {
        nlapiLogExecution("error", "Error Executing Validate Line (Sublist ID: " + type + ")", "Details: " + err.message);
    }

    return true;
}

function calculateMaxAdvance() {
    var customerId = nlapiGetFieldValue("custpage_customer_id");
    var estateId = nlapiGetFieldValue("custpage_estate");
    var netEquity = nlapiGetFieldValue("custpage_net_equity_value");
    var percentDue = nlapiGetFieldValue("custpage_percent_equity_due");

    var residual = netEquity * (parseFloat(percentDue) / 100);
    nlapiSetFieldValue("custpage_residue_equity_due", parseInt(residual)||0, true, true);

    var bequest = nlapiGetFieldValue("custpage_bequest_due");

    var totalDueFromEstate = parseFloat(residual) + parseFloat(bequest);
    nlapiSetFieldValue("custpage_total_due", parseInt(totalDueFromEstate)||0, true, true);

    var liens = nlapiGetFieldValue("custpage_liens_judgments");
    var assignments = nlapiGetFieldValue("custpage_existing_agreements");
    var netDue = totalDueFromEstate - parseFloat(liens) - parseFloat(assignments);
    nlapiSetFieldValue("custpage_net_due", parseInt(netDue)||0, true, true);

    var advToCustRatio = nlapiGetFieldValue("custpage_adv_to_val_ratio");
    var maxAdvance = netDue * (parseFloat(advToCustRatio) / 100);
    nlapiSetFieldValue("custpage_max_advance", parseInt(maxAdvance)||0, true, true);
    calculateSensitivity();
}


function calculateSensitivity() {
  var val=window.values;
  var properties=val.properties;
  var properties10=val.properties10;
  var assets=val.assets;
  var assets10=assets*0.9;
  var claims=val.claims;
  var closing=val.closing*0.06;
  var closing10=val.closing*0.06*0.9;
  var af=(properties+assets)*0.06;
  var af10=(properties10+assets10)*0.06;
  var attyfee=af>3000?af:3000;
  var attyfee10=af10>3000?af10:3000;
  var bequesttoheirs=parseFloat(nlapiGetFieldValue("custpage_specific_bequests"));
  var totalassignments=parseFloat(nlapiGetFieldValue("custpage_existing_agreements"));
  var totalliens=parseFloat(nlapiGetFieldValue("custpage_liens_judgments"));
  var percentdue=parseFloat(nlapiGetFieldValue("custpage_percent_equity_due"))/100;
  var bequesttocust=parseFloat(nlapiGetFieldValue("custpage_bequest_due"));
  var netdue=parseFloat(nlapiGetFieldValue("custpage_net_due"));

  var estatenetvalue10=properties10+assets10-closing10-attyfee10-claims-bequesttoheirs;
  var residue10=estatenetvalue10*percentdue;
  var totaldue10=residue10+bequesttocust;
  var netdue10=Math.round(totaldue10-totalassignments-totalliens);
  var sens=(netdue10-netdue)/netdue;
  var roundedsens=Math.round(1000*sens)/10
  nlapiSetFieldValue("custpage_sensitivity_to_10percent",roundedsens+"% ($"+netdue10+")");
}

function calculatePrice() {
    var priceLevel = nlapiGetFieldValue("custpage_price_level");
    var numMonths = nlapiGetFieldValue("custpage_months_remaining");
    var advance = parseFloat(nlapiGetFieldValue("custpage_desired_advance"));
    if (priceLevel == 5) { //LEVEL 5 Starting
        var assignment_size = advance * 2;
        nlapiSetFieldValue("custpage_assignment_size", assignment_size, true, true);
        nlapiSetFieldValue("custpage_early_rebate_1", 3, false, true);
        nlapiSetFieldValue("custpage_early_rebate_2", 6, false, true);
        nlapiSetFieldValue("custpage_early_rebate_3", 9, false, true);
        var rebate_1_amt;
        var rebate_2_amt;
        var rebate_3_amt;
        var amt1 = ((advance * (1 + 0.35)) < (advance + 3000)) ? (advance + 3000) : (advance * (1 + 0.35));
        var amt2 = ((advance * (1 + 0.50)) < (advance + 6000)) ? (advance + 6000) : (advance * (1 + 0.50));
        var amt3 = ((advance * (1 + 0.75)) < (advance + 9000)) ? (advance + 9000) : (advance * (1 + 0.75));
        var rebate_1_amt = (amt1 > assignment_size) ? assignment_size : amt1;
        var rebate_2_amt = (amt2 > assignment_size) ? assignment_size : amt2;
        var rebate_3_amt = (amt3 > assignment_size) ? assignment_size : amt3;
        console.log('rebate_1_amt' + rebate_1_amt);
        if (rebate_1_amt)
            nlapiSetFieldValue("custpage_early_rebate_1_amt", rebate_1_amt, false, true);
        if (rebate_2_amt)
            nlapiSetFieldValue("custpage_early_rebate_2_amt", rebate_2_amt, false, true);
        if (rebate_3_amt)
            nlapiSetFieldValue("custpage_early_rebate_3_amt", rebate_3_amt, false, true);

    } else { //Level 5 Ending
        if (priceLevel != null && priceLevel != "" && numMonths != null && numMonths != "" && advance != null && advance != "") {
            var priceStructure = nlapiLookupField("customrecord_price_option", priceLevel, ["custrecord_fee_minimum", "custrecord_fee_percent", "custrecord_fee_return"]);

            var fee = advance * (parseFloat(priceStructure.custrecord_fee_percent) / 100);
            if (fee < parseFloat(priceStructure.custrecord_fee_minimum))
                fee = priceStructure.custrecord_fee_minimum;
            fee = parseFloat(fee);

            nlapiSetFieldValue("custpage_calculated_fee", fee, true, true);

            console.log("Fee = " + fee);

            var highAdvance = advance * 2.5;
            console.log("Advance x 2.5 = " + highAdvance);

            var rateOfReturn = parseFloat(priceStructure.custrecord_fee_return);
            console.log("Return = " + rateOfReturn);
            nlapiSetFieldValue("custpage_rate_of_return", rateOfReturn, true, true);

            var futureValue = FV(rateOfReturn, (numMonths / 12), 0, (advance + fee), 0) * -1;
            console.log("Future Value = " + futureValue);

            nlapiSetFieldValue("custpage_assignment_size", Math.ceil(futureValue / 100) * 100, true, true);

            var rebateAdvance = advance + 3000;

            var rebateOption1Months = parseInt(nlapiGetFieldValue("custpage_early_rebate_1"));
            var rebateOption2Months = parseInt(nlapiGetFieldValue("custpage_early_rebate_2"));
            var rebateOption3Months = parseInt(nlapiGetFieldValue("custpage_early_rebate_3"));

            if (rebateOption2Months == null || rebateOption2Months == "" || isNaN(rebateOption2Months))
                rebateOption2Months = 0;

            console.log("Rebate 2 Months: " + rebateOption2Months);

            var monthsBetweenRebates = rebateOption2Months - rebateOption1Months;

            console.log("monthsBetweenRebates (1): " + monthsBetweenRebates);

            if (monthsBetweenRebates < 0) {
                monthsBetweenRebates = 1;
            } else {
                monthsBetweenRebates = monthsBetweenRebates / 3 + 1;
            }

            console.log("monthsBetweenRebates (2): " + monthsBetweenRebates);

            if (nlapiGetFieldValue("custpage_early_rebate_1") != null && nlapiGetFieldValue("custpage_early_rebate_1") != "") {
                var rebateOption1 = FV((rateOfReturn + 0.025 * (monthsBetweenRebates)), (rebateOption1Months / 12), 0, (advance + fee), 0) * -1;
                if (rebateOption1 < rebateAdvance)
                    rebateOption1 = rebateAdvance;
            }

            if (nlapiGetFieldValue("custpage_early_rebate_2") != null && nlapiGetFieldValue("custpage_early_rebate_2") != "") {
                var rebateOption2 = FV((rateOfReturn + 0.025), (rebateOption2Months / 12), 0, (advance + fee), 0) * -1;
                if (rebateOption2 < rebateAdvance)
                    rebateOption2 = rebateAdvance;
            }

            if (nlapiGetFieldValue("custpage_early_rebate_3") != null && nlapiGetFieldValue("custpage_early_rebate_3") != "") {
                var rebateOption3 = FV((rateOfReturn + 0.025), (rebateOption3Months / 12), 0, (advance + fee), 0) * -1;
                if (rebateOption3 < rebateAdvance)
                    rebateOption3 = rebateAdvance;
            }

            if (nlapiGetFieldValue("custpage_early_rebate_1") != null && nlapiGetFieldValue("custpage_early_rebate_1") != "")
                nlapiSetFieldValue("custpage_early_rebate_1_amt", Math.ceil(rebateOption1 / 100) * 100, true, true);
            if (nlapiGetFieldValue("custpage_early_rebate_2") != null && nlapiGetFieldValue("custpage_early_rebate_2") != "")
                nlapiSetFieldValue("custpage_early_rebate_2_amt", Math.ceil(rebateOption2 / 100) * 100, true, true);
            if (nlapiGetFieldValue("custpage_early_rebate_3") != null && nlapiGetFieldValue("custpage_early_rebate_3") != "")
                nlapiSetFieldValue("custpage_early_rebate_3_amt", Math.ceil(rebateOption3 / 100) * 100, true, true);
        }
    }
}

function calculateMonths() {
    var estateState = nlapiGetFieldValue("custpage_estate_state");
    var totalProperty = parseFloat(nlapiGetFieldValue("custpage_total_property"));
    var totalAssets = parseFloat(nlapiGetFieldValue("custpage_total_assets"));

    var numMonths = 0;
    if (totalProperty > totalAssets)
        numMonths = 12;

    if (estateState != null && estateState != "") {
        var stateMonths = nlapiLookupField("classification", estateState, "custrecord_state_months_estimate");
        if (stateMonths != null && stateMonths != "")
            numMonths += parseInt(stateMonths);
    }

    //Check filing date, if filing date is not empty factor that into consideration
    var filingDate = nlapiGetFieldValue("custpage_estate_filing_date");
    if (filingDate != null && filingDate != '') {
        var today = new Date();
        filingDate = nlapiStringToDate(filingDate);

        var monthsBetween = monthDiff(filingDate, today);

        numMonths = numMonths - monthsBetween;
    }

    //Ensure min # of months is at least 18
    if (numMonths < 18)
        numMonths = 18;

    nlapiSetFieldValue("custpage_months_remaining", numMonths, true, true);
}

function createQuote() {
  updatecust();
    //Create quote
    try {
        //alert("Preparing to create quote");

        var filters = [];
        filters.push(new nlobjSearchFilter("entity", null, "is", nlapiGetFieldValue("custpage_customer_id")));
        filters.push(new nlobjSearchFilter("mainline", null, "is", "T"));
        //filters.push(new nlobjSearchFilter("custbody_preferred_quote",null, "is", "T"));
        var cols = [];
        cols.push(new nlobjSearchColumn("trandate"));
        cols.push(new nlobjSearchColumn("tranid"));
        cols.push(new nlobjSearchColumn("custbody_preferred_quote"));
        var results = nlapiSearchRecord("estimate", null, filters, cols);
        if (results) {
            for (var x = 0; x < results.length; x++) {
                var estimateId = results[x].id;
                if (results[x].getValue("custbody_preferred_quote") == 'T') {
                    nlapiSubmitField("estimate", estimateId, "custbody_preferred_quote", 'F');
                }
            }
        }

        var quote = nlapiCreateRecord("estimate", {
            recordmode: "dynamic"
        });
        console.log("Created estimate object...");

        quote.setFieldValue("entity", nlapiGetFieldValue("custpage_customer_id"));
        console.log("Set customer");

        var assignment = parseFloat(nlapiGetFieldValue("custpage_assignment_size"));

        var linecount = nlapiGetLineItemCount('custpage_prior_quotes');
        //if(linecount==0)
        quote.setFieldValue("custbody_preferred_quote", 'T');
        if (nlapiGetFieldValue("custpage_early_rebate_1_amt") != null && nlapiGetFieldValue("custpage_early_rebate_1_amt") != "")
            quote.setFieldValue("custbody_rebate_1_amount", assignment - parseFloat(nlapiGetFieldValue("custpage_early_rebate_1_amt")));
        if (nlapiGetFieldValue("custpage_early_rebate_2_amt") != null && nlapiGetFieldValue("custpage_early_rebate_2_amt") != "")
            quote.setFieldValue("custbody_rebate_2_amount", assignment - parseFloat(nlapiGetFieldValue("custpage_early_rebate_2_amt")));
        if (nlapiGetFieldValue("custpage_early_rebate_3_amt") != null && nlapiGetFieldValue("custpage_early_rebate_3_amt") != "")
            quote.setFieldValue("custbody_rebate_3_amount", assignment - parseFloat(nlapiGetFieldValue("custpage_early_rebate_3_amt")));

        console.log("Set rebate amount fields in header");

        if (nlapiGetFieldValue("custpage_early_rebate_1_amt") != null && nlapiGetFieldValue("custpage_early_rebate_1_amt") != "")
            quote.setFieldValue("custbody_option_1_pricing", nlapiGetFieldValue("custpage_early_rebate_1_amt"));
        if (nlapiGetFieldValue("custpage_early_rebate_2_amt") != null && nlapiGetFieldValue("custpage_early_rebate_2_amt") != "")
            quote.setFieldValue("custbody_option_2_pricing", nlapiGetFieldValue("custpage_early_rebate_2_amt"));
        if (nlapiGetFieldValue("custpage_early_rebate_3_amt") != null && nlapiGetFieldValue("custpage_early_rebate_3_amt") != "")
            quote.setFieldValue("custbody_option_3_pricing", nlapiGetFieldValue("custpage_early_rebate_3_amt"));

        console.log("Set option amount fields in header");

        if (nlapiGetFieldValue("custpage_early_rebate_1") != null && nlapiGetFieldValue("custpage_early_rebate_1") != "")
            quote.setFieldValue("custbody_rebate_1_month", convertMonths(nlapiGetFieldValue("custpage_early_rebate_1")));
        if (nlapiGetFieldValue("custpage_early_rebate_2") != null && nlapiGetFieldValue("custpage_early_rebate_2") != "")
            quote.setFieldValue("custbody_rebate_2_month", convertMonths(nlapiGetFieldValue("custpage_early_rebate_2")));
        if (nlapiGetFieldValue("custpage_early_rebate_1") != null && nlapiGetFieldValue("custpage_early_rebate_3") != "")
            quote.setFieldValue("custbody_rebate_3_month", convertMonths(nlapiGetFieldValue("custpage_early_rebate_3")));

        console.log("Set rebate month fields in header");

        quote.selectNewLineItem("item");
        quote.setCurrentLineItemValue("item", "item", "7"); //Cash Advanced to Client
        quote.setCurrentLineItemValue("item", "rate", nlapiGetFieldValue("custpage_desired_advance"));
        quote.setCurrentLineItemValue("item", "amount", nlapiGetFieldValue("custpage_desired_advance"));
        quote.commitLineItem("item");
        console.log("Set line item #1 - cash advanced to client");

        //quote.selectNewLineItem("item");
        //quote.setCurrentLineItemValue("item","item","5"); //Fixed Fee
        //quote.setCurrentLineItemValue("item","rate",nlapiGetFieldValue("custpage_calculated_fee"));
        //quote.setCurrentLineItemValue("item","amount",nlapiGetFieldValue("custpage_calculated_fee"));
        //quote.commitLineItem("item");
        //console.log("Set line item #2 - fixed fee");

        //var deferredRevenue = assignment - 1500 - parseFloat(nlapiGetFieldValue("custpage_desired_advance"));
        var deferredRevenue = assignment - parseFloat(nlapiGetFieldValue("custpage_desired_advance"));
        nlapiLogExecution("debug", "Deferred Revenue", deferredRevenue);

        quote.selectNewLineItem("item");
        quote.setCurrentLineItemValue("item", "item", "6"); //Deferred Revenue
        quote.setCurrentLineItemValue("item", "rate", deferredRevenue);
        quote.setCurrentLineItemValue("item", "amount", deferredRevenue);
        quote.commitLineItem("item");
        console.log("Set line item #3 - deferred revenue");

        quote.setFieldValue("custbody_county", nlapiGetFieldValue("custpage_estate_county"));

        quote.setFieldValue("custbody_heir_first_name", nlapiGetFieldValue("custpage_first_name"));
        quote.setFieldValue("custbody_heir_last_name", nlapiGetFieldValue("custpage_last_name"));

        quote.setFieldValue("custbody_assignment_size", nlapiGetFieldValue("custpage_assignment_size"));
        quote.setFieldValue("custbody_advance_size", nlapiGetFieldValue("custpage_desired_advance"));

        quote.setFieldValue("custbody_decedent_name", nlapiGetFieldValue("custpage_decedent"));
        quote.setFieldValue("custbody_bill_address_1", nlapiGetFieldValue("custpage_address"));
        quote.setFieldValue("custbody_bill_city", nlapiGetFieldValue("custpage_city"));
        quote.setFieldValue("custbody_bill_state", nlapiGetFieldText("custpage_state"));
        quote.setFieldValue("custbody_bill_zip_code", nlapiGetFieldValue("custpage_zip"));

        quote.setFieldValue("custbody_case_no", nlapiGetFieldValue("custpage_case_no"));

        quote.setFieldValue("custbody_attorney", nlapiGetFieldValue("custpage_attorney_id"));
        quote.setFieldValue("custbody_personal_rep", nlapiGetFieldValue("custpage_personal_rep_1_id"));

        quote.setFieldValue("custbody_state_of_case", nlapiGetFieldValue("custpage_estate_state"));

        console.log("Set other body fields");

        var repFound = false;

        //Clear sales team sublist
        for (var x = 0; x < quote.getLineItemCount("salesteam"); x++) {
            console.log("Removing line item " + (x + 1));
            quote.removeLineItem("salesteam", x + 1);
            x--;
        }

        console.log("Sales Team Line Count: " + quote.getLineItemCount("salesteam"));

        //Add sales rep as current user
        quote.selectNewLineItem("salesteam");
        quote.setCurrentLineItemValue("salesteam", "employee", nlapiGetUser());
        quote.setCurrentLineItemValue("salesteam", "salesrole", "-2"); //Sales Role = Sales Rep
        quote.setCurrentLineItemValue("salesteam", "isprimary", "T");
        quote.setCurrentLineItemValue("salesteam", "contribution", "100%");
        quote.commitLineItem("salesteam");

        /*
        for(var x=0; x < quote.getLineItemCount("salesteam"); x++){
        if(quote.getLineItemValue("salesteam","employee",x+1)==nlapiGetUser()){
        repFound = true;
        break;
        }
        }

        if(!repFound){
        //Add sales rep as current user
        quote.selectNewLineItem("salesteam");
        quote.setCurrentLineItemValue("salesteam","employee",nlapiGetUser());
        quote.setCurrentLineItemValue("salesteam","salesrole","-2"); //Sales Role = Sales Rep
        quote.setCurrentLineItemValue("salesteam","isprimary","T");
        quote.commitLineItem("salesteam");
        }
         */

        console.log("Set sales rep/sales team");

        //Build text area for attorney and personal rep
        var attorneyStr = "";
        attorneyStr += nlapiGetFieldValue("custpage_attorney_name") + "\n";
        attorneyStr += nlapiGetFieldValue("custpage_firm_name") + "\n";
        attorneyStr += nlapiGetFieldValue("custpage_attorney_address") + "\n";
        attorneyStr += nlapiGetFieldValue("custpage_attorney_city") + " " + nlapiGetFieldText("custpage_attorney_state") + " " + nlapiGetFieldValue("custpage_attorney_zip");

        quote.setFieldValue("custbody_attorney_name_address", attorneyStr);

        var personalRepStr = "";
        personalRepStr += nlapiGetFieldValue("custpage_personal_rep_1") + "\n";
        personalRepStr += nlapiGetFieldValue("custpage_personal_rep_1_address") + "\n";
        personalRepStr += nlapiGetFieldValue("custpage_personal_rep_1_city") + " " + nlapiGetFieldText("custpage_personal_rep_1_state") + " " + nlapiGetFieldValue("custpage_personal_rep_1_zip");

        quote.setFieldValue("custbody_personal_rep_name_address", personalRepStr);

        var quoteId = nlapiSubmitRecord(quote, true, true);

        //Refresh quote sublist with new values
        var url = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&r=T&machine=custpage_prior_quotes&compid=5295340&customer=' + nlapiGetFieldValue("custpage_customer_id") + '&estate=' + nlapiGetFieldValue("custpage_estate");
        document.getElementById('server_commands').src = url;
    } catch (err) {
        console.log("Error Generating Quote: " + err.message);
        alert("Error creating quote - " + err.message);
    }
}

function sendQuoteDocuSign(quote) {
    try {
        var url = nlapiResolveURL("SUITELET", "customscript_gen_docusign_estimate", "customdeploy_gen_docusign_estimate");
        url += "&quote=" + quote;

        window.open(url, 'docusignWin', 'dependent=yes,width=200,height=200');
    } catch (err) {
        console.log("Error Sending Quote via DocuSign: " + err.message);
        alert("Error Sending Quote via DocuSign: " + err.message);
    }
}

function mailMerge(quote) {
    try {
        var url = nlapiResolveURL("SUITELET", "customscript_mail_merge_csv", "customdeploy_mail_merge_csv");
        url += "&quote=" + quote;

        window.open(url, 'mailMergeWin', 'dependent=yes,width=200,height=200');
    } catch (err) {
        console.log("Error Constructing Mail Merge CSV: " + err.message);
        alert("Error Constructing Mail Merge CSV: " + err.message);
    }
}

function createInvoice(quote) {
  updatecust();
    try {
        var invoice = nlapiTransformRecord("estimate", quote, "invoice", {
            recordmode: "dynamic"
        });
        //invoice.setFieldValue("entity",nlapiGetFieldValue("custpage_estate"));
        //console.log("Updated customer to estate");

// RM 20240130 BEGIN
        var totalduefromestate = nlapiGetFieldValue('custpage_total_due');
        invoice.setFieldValue('custbody_totaldueatcreation', totalduefromestate);
try {
      var noteval=nlapiGetFieldValue('custbody_tech_notes')+'\n';
      noteval+='!!totaldueatcreation:'+ totalduefromestate+'\n' + '!!totaldueatcreation from invoice:'+ invoice.getFieldValue('custbody_totaldueatcreation');
      nlapiSetFieldValue('custpage_tech_notes', noteval);
      console.log('audit', '!!totaldueatcreation!!', totalduefromestate);
      console.log('audit', '!!totaldueatcreation from invoice!!', invoice.getFieldValue('custbody_totaldueatcreation'));
} catch(e) {
  console.log('couldn\'t save log data');
}
// RM 20240130 END

      //Populate dates
        var today = new Date();

        var option1Months = invoice.getFieldValue("custbody_rebate_1_month");
        console.log("Rebate Month 1: " + option1Months);

        if (option1Months != null && option1Months != "") {
            option1Months = convertDropdownMonths(option1Months);
            nlapiSetFieldValue("custbody_date_of_option_1_pricing", nlapiDateToString(nlapiAddMonths(today, option1Months), "date"));
        }

        var option2Months = invoice.getFieldValue("custbody_rebate_2_month");
        console.log("Rebate Month 2: " + option2Months);

        if (option2Months != null && option2Months != "") {
            option2Months = convertDropdownMonths(option2Months);
            nlapiSetFieldValue("custbody_date_of_option_2_pricing", nlapiDateToString(nlapiAddMonths(today, option2Months), "date"));
        }

        var option3Months = invoice.getFieldValue("custbody_rebate_3_month");
        console.log("Rebate Month 3: " + option3Months);

        if (option3Months != null && option3Months != "") {
            option3Months = convertDropdownMonths(option3Months);
            nlapiSetFieldValue("custbody_date_of_option_3_pricing", nlapiDateToString(nlapiAddMonths(today, option3Months), "date"));
        }

        console.log("# Line Items: " + invoice.getLineItemCount("item"));

        //var estFields = nlapiLookupField("estimate",quote,["custbody_heir_first_name","custbody_heir_last_name","",""]);

        var invoiceId = nlapiSubmitRecord(invoice, true, true);

        //Refresh invoice sublist with new values
        var url = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&r=T&machine=custpage_invoice_list&compid=5295340&customer=' + nlapiGetFieldValue("custpage_customer_id") + '&estate=' + nlapiGetFieldValue("custpage_estate");
        document.getElementById('server_commands').src = url;
    } catch (err) {
        console.log("Error Generating Invoice: " + err.message);
        alert("Error creating invoice - " + err.message);
    }

}

function addUpdateContact(type, fldChanged) {
    if (type == "attorney") {
        console.log("Type: " + type + " | Field: " + fldChanged);

        var attorneyId = nlapiGetFieldValue("custpage_attorney_id");

        if (attorneyId != null && attorneyId != "") {
            if (fldChanged == "custpage_attorney_name" || fldChanged == "custpage_firm_name" || fldChanged == "custpage_attorney_phone" || fldChanged == "custpage_attorney_email") {
                switch (fldChanged) {
                    case "custpage_attorney_name":
                        nlapiSubmitField("contact", attorneyId, "entityid", nlapiGetFieldValue(fldChanged));
                        break;
                    case "custpage_firm_name":
                        nlapiSubmitField("contact", attorneyId, "custentity_law_firm", nlapiGetFieldValue(fldChanged));
                        break;
                    case "custpage_attorney_phone":
                        nlapiSubmitField("contact", attorneyId, "phone", nlapiGetFieldValue(fldChanged));
                        break;
                    case "custpage_attorney_email":
                        nlapiSubmitField("contact", attorneyId, "email", nlapiGetFieldValue(fldChanged));
                        break;
                }

                //Refresh relationships/contact sublist with new values
                var url = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&r=T&machine=custpage_contacts&compid=5295340&customer=' + nlapiGetFieldValue("custpage_customer_id") + '&estate=' + nlapiGetFieldValue("custpage_estate");
                document.getElementById('server_commands').src = url;
            } else {
                //Address field change handling, ensure complete address
                var addressStreet = nlapiGetFieldValue("custpage_attorney_address");
                var addressCity = nlapiGetFieldValue("custpage_attorney_city");
                var addressState = nlapiGetFieldText("custpage_attorney_state");
                var addressZip = nlapiGetFieldValue("custpage_attorney_zip");

                console.log("Address State: " + addressState);

                if (addressStreet != null && addressStreet != "" && addressCity != null && addressCity != "" && addressState != null && addressState != "" && addressZip != null && addressZip != "") {
                    if (addressStreet == null || addressStreet == "" || addressCity == null || addressCity == "" || addressState == null || addressState == "" || addressZip == null || addressZip == "")
                        return true;

                    var stateObj = mapState(addressState);
                    console.log("Address State Abbreviation: " + stateObj.abbrev);

                    var url = nlapiResolveURL("SUITELET", "customscript_address_update", "customdeploy_address_update");
                    url += "&rectype=contact";
                    url += "&recid=" + attorneyId;
                    url += "&street=" + addressStreet;
                    url += "&city=" + addressCity;
                    url += "&state=" + stateObj.abbrev;
                    url += "&zip=" + addressZip;
                    url += "&name=" + nlapiGetFieldValue("custpage_attorney_name");

                    nlapiRequestURL(url);
                }
            }
        } else {
            if (fldChanged == "custpage_attorney_name") {
                var contact = nlapiCreateRecord("contact");
                contact.setFieldValue("entityid", nlapiGetFieldValue("custpage_attorney_name"));
                contact.setFieldValue("company", nlapiGetFieldValue("custpage_estate"));
                contact.setFieldValue("category", "1");
                var contactId = nlapiSubmitRecord(contact, true, true);

                nlapiSetFieldValue("custpage_attorney_id", contactId, true, true);

                //Refresh relationships/contact sublist with new values
                var url = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&r=T&machine=custpage_contacts&compid=5295340&customer=' + nlapiGetFieldValue("custpage_customer_id") + '&estate=' + nlapiGetFieldValue("custpage_estate");
                document.getElementById('server_commands').src = url;
            }
        }
    } else if (type == "personal") {
        var personalRepId = nlapiGetFieldValue("custpage_personal_rep_1_id");

        if (personalRepId != null && personalRepId != "") {
            if (fldChanged == "custpage_personal_rep_1" || fldChanged == "custpage_personal_rep_1_phone" || fldChanged == "custpage_personal_rep_1_email") {
                switch (fldChanged) {
                    case "custpage_personal_rep_1":
                        nlapiSubmitField("contact", personalRepId, "entityid", nlapiGetFieldValue(fldChanged));
                        break;
                    case "custpage_personal_rep_1_phone":
                        nlapiSubmitField("contact", personalRepId, "phone", nlapiGetFieldValue(fldChanged));
                        break;
                    case "custpage_personal_rep_1_email":
                        nlapiSubmitField("contact", personalRepId, "email", nlapiGetFieldValue(fldChanged));
                        break;
                }

                //Refresh relationships/contact sublist with new values
                var url = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&r=T&machine=custpage_contacts&compid=5295340&customer=' + nlapiGetFieldValue("custpage_customer_id") + '&estate=' + nlapiGetFieldValue("custpage_estate");
                document.getElementById('server_commands').src = url;
            } else {
                //Address field change handling, ensure complete address
                var addressStreet = nlapiGetFieldValue("custpage_personal_rep_1_address");
                var addressCity = nlapiGetFieldValue("custpage_personal_rep_1_city");
                var addressState = nlapiGetFieldText("custpage_personal_rep_1_state");
                var addressZip = nlapiGetFieldValue("custpage_personal_rep_1_zip");

                if (addressStreet != null && addressStreet != "" && addressCity != null && addressCity != "" && addressState != null && addressState != "" && addressZip != null && addressZip != "") {
                    if (addressStreet == null || addressStreet == "" || addressCity == null || addressCity == "" || addressState == null || addressState == "" || addressZip == null || addressZip == "")
                        return true;

                    var stateObj = mapState(addressState);

                    var url = nlapiResolveURL("SUITELET", "customscript_address_update", "customdeploy_address_update");
                    url += "&rectype=contact";
                    url += "&recid=" + personalRepId;
                    url += "&street=" + addressStreet;
                    url += "&city=" + addressCity;
                    url += "&state=" + stateObj.abbrev;
                    url += "&zip=" + addressZip;
                    url += "&name=" + nlapiGetFieldValue("custpage_personal_rep_1");

                    nlapiRequestURL(url);
                }
            }
        } else {
            if (fldChanged == "custpage_personal_rep_1") {
                var contact = nlapiCreateRecord("contact");
                contact.setFieldValue("entityid", nlapiGetFieldValue("custpage_personal_rep_1"));
                contact.setFieldValue("company", nlapiGetFieldValue("custpage_estate"));
                contact.setFieldValue("category", "2");
                var contactId = nlapiSubmitRecord(contact, true, true);

                nlapiSetFieldValue("custpage_personal_rep_1_id", contactId, true, true);

                //Refresh relationships/contact sublist with new values
                var url = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&r=T&machine=custpage_contacts&compid=5295340&customer=' + nlapiGetFieldValue("custpage_customer_id") + '&estate=' + nlapiGetFieldValue("custpage_estate");
                document.getElementById('server_commands').src = url;
            }
        }
    }
}

function FV(rate, nper, pmt, pv, type) {
    var pow = Math.pow(1 + rate, nper),
        fv;

    if (rate) {
        fv = (pmt * (1 + rate * type) * (1 - pow) / rate) - pv * pow;
    } else {
        fv = -1 * (pv + pmt * nper);
    }

    return fv.toFixed(2);
}

function monthDiff(d1, d2) {
    var months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth() + 1;
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
}

function mapState(fullName) {
    var country = "";
    var stateAbbrev = "";

    switch (fullName) {
        case "Alabama":
            stateAbbrev = "AL";
            country = "US";
            break;
        case "Alaska":
            stateAbbrev = "AK";
            country = "US";
            break;
        case "Arizona":
            stateAbbrev = "AZ";
            country = "US";
            break;
        case "Arkansas":
            stateAbbrev = "AR";
            country = "US";
            break;
        case "California":
            stateAbbrev = "CA";
            country = "US";
            break;
        case "Colorado":
            stateAbbrev = "CO";
            country = "US";
            break;
        case "Connecticut":
            stateAbbrev = "CT";
            country = "US";
            break;
        case "Delaware":
            stateAbbrev = "DE";
            country = "US";
            break;
        case "District of Columbia":
            stateAbbrev = "DC";
            country = "US";
            break;
        case "Florida":
            stateAbbrev = "FL";
            country = "US";
            break;
        case "Georgia":
            stateAbbrev = "GA";
            country = "US";
            break;
        case "Hawaii":
            stateAbbrev = "HI";
            country = "US";
            break;
        case "Idaho":
            stateAbbrev = "ID";
            country = "US";
            break;
        case "Illinois":
            stateAbbrev = "IL";
            country = "US";
            break;
        case "Indiana":
            stateAbbrev = "IN";
            country = "US";
            break;
        case "Iowa":
            stateAbbrev = "IA";
            country = "US";
            break;
        case "Kansas":
            stateAbbrev = "KS";
            country = "US";
            break;
        case "Kentucky":
            stateAbbrev = "KY";
            country = "US";
            break;
        case "Louisiana":
            stateAbbrev = "LA";
            country = "US";
            break;
        case "Maine":
            stateAbbrev = "ME";
            country = "US";
            break;
        case "Maryland":
            stateAbbrev = "MD";
            country = "US";
            break;
        case "Massachusetts":
            stateAbbrev = "MA";
            country = "US";
            break;
        case "Michigan":
            stateAbbrev = "MI";
            country = "US";
            break;
        case "Minnesota":
            stateAbbrev = "MN";
            country = "US";
            break;
        case "Mississippi":
            stateAbbrev = "MS";
            country = "US";
            break;
        case "Missouri":
            stateAbbrev = "MO";
            country = "US";
            break;
        case "Montana":
            stateAbbrev = "MT";
            country = "US";
            break;
        case "Nebraska":
            stateAbbrev = "NE";
            country = "US";
            break;
        case "Nevada":
            stateAbbrev = "NV";
            country = "US";
            break;
        case "New Hampshire":
            stateAbbrev = "NH";
            country = "US";
            break;
        case "New Jersey":
            stateAbbrev = "NJ";
            country = "US";
            break;
        case "New Mexico":
            stateAbbrev = "NM";
            country = "US";
            break;
        case "New York":
            stateAbbrev = "NY";
            country = "US";
            break;
        case "North Carolina":
            stateAbbrev = "NC";
            country = "US";
            break;
        case "North Dakota":
            stateAbbrev = "ND";
            country = "US";
            break;
        case "Ohio":
            stateAbbrev = "OH";
            country = "US";
            break;
        case "Oklahoma":
            stateAbbrev = "OK";
            country = "US";
            break;
        case "Oregon":
            stateAbbrev = "OR";
            country = "US";
            break;
        case "Pennsylvania":
            stateAbbrev = "PA";
            country = "US";
            break;
        case "Rhode Island":
            stateAbbrev = "RI";
            country = "US";
            break;
        case "South Carolina":
            stateAbbrev = "SC";
            country = "US";
            break;
        case "South Dakota":
            stateAbbrev = "SD";
            country = "US";
            break;
        case "Tennessee":
            stateAbbrev = "TN";
            country = "US";
            break;
        case "Texas":
            stateAbbrev = "TX";
            country = "US";
            break;
        case "Utah":
            stateAbbrev = "UT";
            country = "US";
            break;
        case "Vermont":
            stateAbbrev = "VT";
            country = "US";
            break;
        case "Virginia":
            stateAbbrev = "VA";
            country = "US";
            break;
        case "Washington":
            stateAbbrev = "WA";
            country = "US";
            break;
        case "West Virginia":
            stateAbbrev = "WV";
            country = "US";
            break;
        case "Wisconsin":
            stateAbbrev = "WI";
            country = "US";
            break;
        case "Wyoming":
            stateAbbrev = "WY";
            country = "US";
            break;
        case "Alberta":
            stateAbbrev = "AB";
            country = "CA";
            break;
        case "British Columbia":
            stateAbbrev = "BC";
            country = "CA";
            break;
        case "Manitoba":
            stateAbbrev = "MB";
            country = "CA";
            break;
        case "New Brunswick":
            stateAbbrev = "NB";
            country = "CA";
            break;
        case "Newfoundland and Labrador":
            stateAbbrev = "NL";
            country = "CA";
            break;
        case "Northwest Territories":
            stateAbbrev = "NT";
            country = "CA";
            break;
        case "Nova Scotia":
            stateAbbrev = "NS";
            country = "CA";
            break;
        case "Nunavut":
            stateAbbrev = "NU";
            country = "CA";
            break;
        case "Ontario":
            stateAbbrev = "ON";
            country = "CA";
            break;
        case "Prince Edward Island":
            stateAbbrev = "PE";
            country = "CA";
            break;
        case "Quebec":
            stateAbbrev = "QC";
            country = "CA";
            break;
        case "Saskatchewan":
            stateAbbrev = "SK";
            country = "CA";
            break;
        case "Yukon Territory":
            stateAbbrev = "YT";
            country = "CA";
            break;
    }

    return {
        abbrev: stateAbbrev,
        country: country
    }
}

function updateCaseStatus() {
    var caseStatus = nlapiGetFieldValue("custpage_update_case_status");
    var caseStatusNotes = nlapiGetFieldValue("custpage_update_case_status_notes");

    if (caseStatus == null || caseStatus == "") {
        alert("Please select a Case Status before updating.");
        return true;
    }

    var statusRec = nlapiCreateRecord("customrecord_case_status");
    statusRec.setFieldValue("custrecord_case_status_status", caseStatus);
    statusRec.setFieldValue("custrecord_case_status_notes", caseStatusNotes);
    statusRec.setFieldValue("custrecord_case_status_customer", nlapiGetFieldValue("custpage_customer_id"));
    var statusRecId = nlapiSubmitRecord(statusRec, true, true);

    nlapiSetFieldValue("custpage_latest_status", caseStatus, false, true);
    nlapiSetFieldValue("custpage_latest_status_notes", caseStatusNotes, false, true);

    nlapiSetFieldValue("custpage_update_case_status", "", false, true);
    nlapiSetFieldValue("custpage_update_case_status_notes", "", false, true);

    var url = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&r=T&machine=custpage_case_status_list&compid=5295340&customer=' + nlapiGetFieldValue("custpage_customer_id") + '&estate=' + nlapiGetFieldValue("custpage_estate");
    document.getElementById('server_commands').src = url;
}

function convertMonths(suiteletValue) {
    var netsuiteId = "";

    switch (suiteletValue) {
        case "3":
            netsuiteId = "1";
            break;
        case "6":
            netsuiteId = "2";
            break;
        case "9":
            netsuiteId = "3";
            break;
        case "12":
            netsuiteId = "4";
            break;
        case "18":
            netsuiteId = "5";
            break;
        case "24":
            netsuiteId = "6";
            break;
    }

    return netsuiteId;
}

function convertDropdownMonths(fieldValue) {
    var numMonths = null;

    switch (fieldValue) {
        case "1":
            numMonths = 3;
            break;
        case "2":
            numMonths = 6;
            break;
        case "3":
            numMonths = 9;
            break;
        case "4":
            numMonths = 12;
            break;
        case "5":
            numMonths = 18;
            break;
        case "6":
            numMonths = 24;
            break;
    }

    return numMonths;
}

function searchTransactions(customerid) {

    var transactionSearch = nlapiSearchRecord("transaction", null,
        [
            ["type", "anyof", "CustPymt", "CashRfnd", "CashSale", "CustCred", "CustDep", "CustRfnd", "CustInvc", "SalesOrd", "Estimate"],
            "AND",
            ["name", "anyof", customerid]
        ],
        [
            new nlobjSearchColumn("internalid"),
        ]);

    return transactionSearch && transactionSearch.length > 0;

}

function searchChildRecords(estateId, childCustId) {
    if (estateId) {

        var filters = [];
        filters.push(new nlobjSearchFilter("parent", null, "anyof", estateId));

        var cols = [];
        cols.push(new nlobjSearchColumn("internalid"));

        var results = nlapiSearchRecord("customer", null, filters, cols);
        if (results) {
            var ids = [];
            for (var x = 0; x < results.length; x++) {
                var customerid = results[x].getId();
                if (childCustId) {
                    if (childCustId != customerid) {
                        ids.push(customerid);
                    }
                } else {
                    ids.push(customerid);
                }

            }
            nlapiLogExecution('DEBUG', 'Child Records', 'Child ids--' + JSON.stringify(ids));
            return ids;
        } else {
            return [];
        }
    } else {
        return [];
    }
}

function DeleteCustomer() {
    try {

        // alert("In Customer Delete");

        var customerid = nlapiGetFieldValue("custpage_customer_id");
        if (customerid) {
            //check if the customer has a parent ...
            var customerObj = nlapiLoadRecord("customer", customerid);
            var estateId = customerObj.getFieldValue("parent");
            //alert("customerObj--"+customerObj);
            // alert("estateId--"+estateId);


            var estateObj = nlapiLoadRecord("customer", estateId);
            var isEstateInactive = estateObj.getFieldValue("isinactive");

            if (isEstateInactive == 'T') {

                var hasTransactions = searchTransactions(customerid);
                nlapiLogExecution("debug", "In delete Customer has transactions --" + hasTransactions);
                if (hasTransactions) {
                    // Throw error as there is a related transactions....
                    // Throw error as there is a related transactions....
                    // alert(" Customer  can not be inactivated--");
                    var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
                    url += "&exceptionflag=T&message=LinkedTransaction";
                    window.onbeforeunload = null;
                    window.location.href = url;

                } else {
                    // alert("point 1 Customer is inactivated--");
                    customerObj.setFieldValue("isinactive", 'T');
                    customerObj.setFieldValue('custentity_date_inactivted', new Date());
                    var estateRecSaved = nlapiSubmitRecord(customerObj, true, true);
                    var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
                    url += "&exceptionflag=T&message=Deleted";
                    window.onbeforeunload = null;
                    window.location.href = url;
                }
            } else {
                //chec if the customer has any other child customers...
                var customerlist = searchChildRecords(estateId);
                customerlist.push(estateId);
                if (customerlist && customerlist.length > 0) {

                    var hasTransactions = searchTransactions(customerlist);
                    nlapiLogExecution("debug", "In delete Customer has transactions --" + hasTransactions);
                    if (hasTransactions) {
                        // Throw error as there is a related transactions....
                        // alert(" Customer has transactions canbe to be deleted --");
                        // Throw error as there is a related transactions....
                        var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
                        url += "&exceptionflag=T&message=LinkedTransaction";
                        window.onbeforeunload = null;
                        window.location.href = url;

                    } else {
                        if (customerlist && customerlist.length > 0) {
                            for (var itr = 0; itr < customerlist.length; itr++) {
                                // alert('Child Getsing Deleted'+customerlist[itr]);
                                var loadCustomer = nlapiLoadRecord('customer', customerlist[itr]);
                                loadCustomer.setFieldValue('isinactive', 'T');
                                loadCustomer.setFieldValue('custentity_date_inactivted', new Date());
                                var customeridsub = nlapiSubmitRecord(loadCustomer);
                                nlapiLogExecution("debug", "Custimer Inactivated --" + customeridsub);
                            }
                        }
                        // alert(" custRecSaved --"+custRecSaved);
                        // Throw error as there is a related transactions....
                        var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
                        url += "&succesflag=T&message=Deleted";
                        window.onbeforeunload = null;
                        window.location.href = url;

                    }
                } else {

                    var list = [customerid, estateId];
                    var hasTransactions = searchTransactions(list);
                    nlapiLogExecution("debug", "In delete Customer has transactions --" + hasTransactions);
                    //alert("hasTransactionsn--"+hasTransactions);
                    if (hasTransactions) {

                        // alert("customer has linked transacion--");
                        // Throw error as there is a related transactions....
                        var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
                        url += "&exceptionflag=T&message=LinkedTransaction";
                        window.onbeforeunload = null;
                        window.location.href = url;

                    } else {
                        customerObj.setFieldValue("isinactive", 'T');
                        customerObj.setFieldValue('custentity_date_inactivted', new Date());
                        estateObj.setFieldValue("isinactive", 'T');
                        estateObj.setFieldValue('custentity_date_inactivted', new Date());

                        var estateRecSaved = nlapiSubmitRecord(estateObj, true, true);
                        var customerRecordsaved = nlapiSubmitRecord(customerObj, true, true);

                        // alert("estateRecSaved--"+estateRecSaved);
                        // alert("customerRecordsaved--"+customerRecordsaved);


                        // Throw error as there is a related transactions....
                        var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
                        url += "&succesflag=T&message=Deleted";
                        window.onbeforeunload = null;
                        window.location.href = url;

                    }
                }
            }
        }
    } catch (e) {

        // alert("Exceptio in Customer--"+e.message);

        var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
        url += "&exceptionflag=T&message=" + e.message;
        window.onbeforeunload = null;
        window.location.href = url;
    }
}

function Customerreminder() {
    var url = nlapiResolveURL("SUITELET", "customscript_sl_customer_reminders", "customdeploy_sl_customer_reminders");
    url += "&customer=" + nlapiGetFieldValue("custpage_customer_id");
    url += "&phone=" + nlapiGetFieldValue("custpage_phone");
    url += "&emailId=" + nlapiGetFieldValue("custpage_email");

    window.open(url, 'docUploadWin', 'dependent=yes,width=1500%,height=1500%');
    //'dependent=yes,width=500,height=300'
}

function Conversations() {
    var url = nlapiResolveURL("SUITELET", "customscript_mmsdf_sl_conversations_ui", "customdeploy_mmsdf_sl_conversations_ui");
    url += "&recordId=" + nlapiGetFieldValue("custpage_customer_id") + "&recordType=customer&smsSender=1090342";
    window.open(url, 'docUploadWin', 'dependent=yes,width=1500%,height=1500%');
    //'dependent=yes,width=500,height=300'
}

function DeleteEstate() {
    try {

        var estateid = nlapiGetFieldValue("custpage_estate");
        if (estateid) {

            //chec if the customer has any other child customers...
            var customerlist = searchChildRecords(estateid);
            customerlist.push(estateid);
            if (customerlist && customerlist.length > 0) {

                var hasTransactions = searchTransactions(customerlist);
                nlapiLogExecution("debug", "In delete Customer has transactions --" + hasTransactions);
                if (hasTransactions) {

                    // Throw error as there is a related transactions....
                    var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
                    url += "&exceptionflag=T&message=LinkedTransaction";
                    window.onbeforeunload = null;
                    window.location.href = url;

                } else {
                    // Throw error as there is a related transactions....
                    if (customerlist && customerlist.length > 0) {
                        for (var itr = 0; itr < customerlist.length; itr++) {
                            // alert('Child Getsing Deleted'+customerlist[itr]);
                            var loadCustomer = nlapiLoadRecord('customer', customerlist[itr]);
                            loadCustomer.setFieldValue('isinactive', 'T');
                            loadCustomer.setFieldValue('custentity_date_inactivted', new Date());
                            var customeridsub = nlapiSubmitRecord(loadCustomer);
                            nlapiLogExecution("debug", "Custimer Inactivated --" + customeridsub);
                        }
                    }

                    // Throw error as there is a related transactions....
                    var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
                    url += "&succesflag=T&message=Deleted";
                    window.onbeforeunload = null;
                    window.location.href = url;

                }
            }
        }
    } catch (e) {
        var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
        url += "&exceptionflag=T&message=" + e.message;
        window.onbeforeunload = null;
        window.location.href = url;
    }
}

function redirecttoSuitelet() {

    var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
    url += "&customer=" + nlapiGetFieldValue("custpage_customer_id");
    url += "&estate=" + nlapiGetFieldValue("custpage_estate");

    window.onbeforeunload = null;
    window.location.href = url;

}

function New_Cust_App_CS_VD(type) {
    try {
        var sublistId = type;

        var recordInternalId = null;
        var recordType = null;

        switch (sublistId) {
            case "custpage_properties":
                recordInternalId = "custpage_property_id";
                recordType = "customrecord_property";
                break;
            case "custpage_accounts":
                recordInternalId = "custpage_accounts_id";
                recordType = "customrecord_asset";
                break;
            case "custpage_claims":
                recordInternalId = "custpage_claim_id";
                recordType = "customrecord_claim";
                break;
            case "custpage_other_assignments":
                recordInternalId = "custpage_assignment_id";
                recordType = "customrecord_existing_assignment";
                break;
            case "custpage_leins_judgements_list":
                recordInternalId = "custpage_lein_id";
                recordType = "customrecord_lein_judgement";
                break;
            case "custpage_phonecalls":
                recordInternalId = "custpage_phonecalls_id";
                recordType = "phonecall";
                break;
            case "custpage_events":
                recordInternalId = "custpage_events_id";
                recordType = "calendarevent";
                break;
            case "custpage_user_notes":
                recordInternalId = "custpage_user_notes_internalid";
                recordType = "note";
                break;
        }

        if (recordType != null && recordInternalId != null)
            nlapiDeleteRecord(recordType, nlapiGetCurrentLineItemValue(type, recordInternalId));

        return true;
    } catch (err) {
        console.log("Error in Validate Delete Function (sublistid: " + type + ") - " + err.message);
        return true;
    }

}

function onAutoSoIfBtnClick(custId) {
    var soUrl = nlapiResolveURL("SUITELET", "customscript_auto_so_and_fulfillment", "customdeploy_auto_so_and_fulfillment") + '&custpage_customer=' + custId;

    window.location.href = soUrl;
}

function setnextevent() {
    //    if(user=nlapiGetContext().getUser()==2299863) {
    var lc = nlapiGetLineItemCount('custpage_events');
    next = -1;
    todaydate = new Date();
    for (i = 1; i <= lc; i++) {
        d = new Date(nlapiGetLineItemValue('custpage_events', 'custpage_events_date', i))
        if (d >= todaydate) {
            if (next == -1) {
                next = i;
            } else {
                if (d <= new Date(nlapiGetLineItemValue('custpage_events', 'custpage_events_date', next))) {
                    next = i;
                }
            }
        }
    }
    var nextEventDate = nlapiGetLineItemValue("custpage_events", "custpage_events_date", next);
    var nextEventTitle = nlapiGetLineItemValue("custpage_events", "custpage_events_title", next);
    var nextEventStr;
    if (next == -1) { //nextEventDate==null || nextEventTitle==null) {
        nextEventStr = 'No upcoming events';
    } else {
        nextEventStr = nextEventDate + " " + nextEventTitle;
    }
    //    alert(next + ' ' + nextEventStr);
    nlapiSetFieldValue("custpage_estate_next_event", nextEventStr, true, true);
    //  }
    return true;
}

