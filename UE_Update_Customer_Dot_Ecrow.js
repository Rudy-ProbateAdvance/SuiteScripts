/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search'], function(record, search) {

    function afterSubmit(context) {

        try {
            var crrRcd = context.newRecord;
            crrRcd = record.load({
                type: crrRcd.type,
                id: crrRcd.id
            });
            var cust_id = crrRcd.getValue("custrecord_property_estate");
            log.debug("cust_id", cust_id);

            if (cust_id) {

                var customrecord_propertySearchObj = search.create({
                    type: "customrecord_property",
                    filters: [
                        ["custrecord_property_estate", "anyof", cust_id]
                    ],
                    columns: [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "custrecord_dot",
                            label: "DOT"
                        }),
                        search.createColumn({
                            name: "custrecord_lispendens",
                            label: "Lis Pendens"
                        }),
                        search.createColumn({
                            name: "custrecord_moi",
                            label: "MOI"
                        }),
                        search.createColumn({
                            name: "custrecord_escrow",
                            label: "Escrow"
                        })
                    ]
                });
                var searchResultCount = customrecord_propertySearchObj.runPaged().count;
                log.debug("customrecord_propertySearchObj result count", searchResultCount);
                var dot_arr = [];
                var escrow_arr = [];
                var lis_arr = [];
                var moi_arr = [];
                var count = 0;
                customrecord_propertySearchObj.run().each(function(result) {
                    var dot_obj = result.getValue('custrecord_dot');
                    log.debug("dot_obj", dot_obj);
                    var escrow_obj = result.getValue('custrecord_escrow');
                    log.debug("escrow_obj", escrow_obj);
                    var lis_obj = result.getValue('custrecord_property_lispendens');
                    log.debug("lis_obj", lis_obj);
                    var moi_obj = result.getValue('custrecord_property_moi');
                    log.debug("moi_obj", moi_obj);
                    if (dot_obj == 1 || dot_obj == 2) {
                        dot_arr.push(count);
                    }
                    if (escrow_obj == true) {
                        escrow_arr.push(count);
                    }
                    if (lis_obj == true) {
                        lis_arr.push(count);
                    }
                    if (moi_obj == true) {
                        moi_arr.push(count);
                    }

                    return true;
                });

                if (escrow_arr.length > 0 || dot_arr.length > 0 || lis_arr.length > 0 || moi_arr.length > 0) {
                    var custRecord = record.load({
                        type: record.Type.CUSTOMER,
                        id: cust_id,
                        isDynamic: true,
                    });
                    if (escrow_arr.length > 0) {
                        custRecord.setValue({
                            fieldId: 'custentity_escrow',
                            value: true
                        });
                    } else {
                        custRecord.setValue({
                            fieldId: 'custentity_escrow',
                            value: false
                        });
                    }

                    if (lis_arr.length > 0) {
                        custRecord.setValue({
                            fieldId: 'custentity_property_lispendens',
                            value: true
                        });
                    } else {
                        custRecord.setValue({
                            fieldId: 'custentity_property_lispendens',
                            value: false
                        });
                    }

                    if (moi_arr.length > 0) {
                        custRecord.setValue({
                            fieldId: 'custentity_property_moi',
                            value: true
                        });
                    } else {
                        custRecord.setValue({
                            fieldId: 'custentity_property_moi',
                            value: false
                        });
                    }

                    if (dot_arr.length > 0) {
                        custRecord.setValue({
                            fieldId: 'custentity_dot',
                            value: true
                        });
                    } else {
                        custRecord.setValue({
                            fieldId: 'custentity_dot',
                            value: false
                        });
                    }
                    var cust_obj = custRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.debug("cust_obj", cust_obj);
                } else {
                var custRecord = record.load({
                        type: record.Type.CUSTOMER,
                        id: cust_id,
                        isDynamic: true,
                    });
                    if (escrow_arr.length > 0) {
                        custRecord.setValue({
                            fieldId: 'custentity_escrow',
                            value: true
                        });
                    } else {
                        custRecord.setValue({
                            fieldId: 'custentity_escrow',
                            value: false
                        });
                    }

                    if (lis_arr.length > 0) {
                        custRecord.setValue({
                            fieldId: 'custentity_property_lispendens',
                            value: true
                        });
                    } else {
                        custRecord.setValue({
                            fieldId: 'custentity_property_lispendens',
                            value: false
                        });
                    }

                    if (moi_arr.length > 0) {
                        custRecord.setValue({
                            fieldId: 'custentity_property_moi',
                            value: true
                        });
                    } else {
                        custRecord.setValue({
                            fieldId: 'custentity_property_moi',
                            value: false
                        });
                    }

                    if (dot_arr.length > 0) {
                        custRecord.setValue({
                            fieldId: 'custentity_dot',
                            value: true
                        });
                    } else {
                        custRecord.setValue({
                            fieldId: 'custentity_dot',
                            value: false
                        });
                    }
                    var cust_obj = custRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.debug("cust_obj", cust_obj);
              }
                var customerSearchObj = search.create({
                    type: "customer",
                    filters: [
                        ["parentcustomer.internalidnumber", "equalto", cust_id]
                    ]
                });
                customerSearchObj.run().each(function(result) {
                    var custId = result.id;
                    if (escrow_arr.length > 0) {
                        record.submitFields({
                            type: record.Type.CUSTOMER,
                            id: custId,
                            values: {
                                custentity_escrow: true
                            }
                        });

                    } else {
                        record.submitFields({
                            type: record.Type.CUSTOMER,
                            id: custId,
                            values: {
                                custentity_escrow: false
                            }
                        });
                    }

                    if (lis_arr.length > 0) {
                        record.submitFields({
                            type: record.Type.CUSTOMER,
                            id: custId,
                            values: {
                                custentity_property_lispendens: true
                            }
                        });

                    } else {
                        record.submitFields({
                            type: record.Type.CUSTOMER,
                            id: custId,
                            values: {
                                custentity_property_lispendens: false
                            }
                        });
                    }

                    if (moi_arr.length > 0) {
                        record.submitFields({
                            type: record.Type.CUSTOMER,
                            id: custId,
                            values: {
                                custentity_property_moi: true
                            }
                        });

                    } else {
                        record.submitFields({
                            type: record.Type.CUSTOMER,
                            id: custId,
                            values: {
                                custentity_property_moi: false
                            }
                        });
                    }

                    if (dot_arr.length > 0) {
                        record.submitFields({
                            type: record.Type.CUSTOMER,
                            id: custId,
                            values: {
                                custentity_dot: true
                            }
                        });
                    } else {
                        record.submitFields({
                            type: record.Type.CUSTOMER,
                            id: custId,
                            values: {
                                custentity_dot: false
                            }
                        });
                    }

                    return true;
                });


            }

        } catch (error) {
            log.debug("error", error);
        }
    }

    return {
        afterSubmit: afterSubmit
    }
});