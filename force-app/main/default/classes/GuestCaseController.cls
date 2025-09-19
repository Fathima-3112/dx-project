public without sharing class GuestCaseController {

     @AuraEnabled
    public static String createCase(Map<String, String> caseDetails) {
        try {
            
            Case newCase = new Case();
            String recordTypeId = system.label.Logistics_Record_Type; // Logistics RecordType
           if (String.isBlank(recordTypeId)) {
                throw new AuraHandledException('Logistics Record Type is not defined in the system labels.');
            }
            newCase.RecordTypeId = recordTypeId;

            newCase.Origin = 'Logistics Service Portal';
            newCase.Status = 'New';
            newCase.SuppliedEmail = caseDetails.get('requestorEmail');
            newCase.SuppliedName = caseDetails.get('requestorName');
            newCase.Order_Number__c = caseDetails.get('orderNumber');
           newCase.Request_Subtype__c=caseDetails.get('subRequestType');
            
            // Set OwnerId based on Sub Request Type
        String subRequestType = caseDetails.get('subRequestType');
        Set<String> corporateInventory = new Set<String>{'Status Change: Discounted Pricing Status (Twilight)','Physical Inventory, Cycle Count & Swatch Audit Adjustments','Status Change: AS-IS to Saleable','Add or remove item(s) from a store inventory'};
        Set<String> storeTransferQ = new Set<String>{'Store Reverse Transfer Request','DC to DC'};
        set<String> orderResolutionQ = new set<String>{'Borrow Request','Order Invoice Request','Order Invoiced in Error' , 'Invoice Direct Ship Return','Small Parcel Mark Out','Employee Order CPU' , 'Status Change: Quality Hold'};
	    set<String> orderManagementQ = new set<String>{'Remove from Manifest','Validate Item Shipped','Change Ship Date','Order Correction','215_EDI'};
	    set<String> inventoryExceptionQ = new set<String>{'Return Transfer (RA) Request'};
	    set<String> physicalInventoryQ = new set<String>{'SKU Change Requests' ,'Batch Number Update Request'};

            if (corporateInventory.contains(subRequestType)) {
                String inventoryQOwnerId = system.label.Inventory_Q_Owner_ID; // Corporate Inventory Q Ownership
                if (String.isBlank(inventoryQOwnerId)) {
                   throw new AuraHandledException('Corporate Inventory Q Owner ID is not defined in the system labels.');
               }
               newCase.OwnerId = inventoryQOwnerId;
            }
            else if(orderResolutionQ.contains(subRequestType)){
                String orderResolutionId = system.label.Order_Resolution_Q_Id; //Order Resolution Queue ID
            if(String.isBlank(orderResolutionId)){
                throw new AuraHandledException('Order Resolution Owner ID is not defined in the system labels.');
            }
            newCase.OwnerId = orderResolutionId;
            }
            else if(storeTransferQ.contains(subRequestType)){
                String storeOwnerId = system.label.Store_Transfer_Shipping_Q; //Store Q ownership
                if (String.isBlank(storeOwnerId)) {
                throw new AuraHandledException('Store Transfer Shipping Owner ID is not defined in the system labels.');
            }
            newCase.OwnerId = storeOwnerId;
            } else if(orderManagementQ.contains(subRequestType)) {
                String orderManagementId = system.label.Delivery_Ops_Owner_ID; // Order Management Q Ownership
                 if (String.isBlank(orderManagementId)) {
                    throw new AuraHandledException('Order Management Q Owner ID is not defined in the system labels.');
                }
                newCase.OwnerId = orderManagementId;
            }else if(inventoryExceptionQ.contains(subRequestType)) {
                String inventoryExceptionId = system.label.Inventory_Exception_Q; //Inventory Exception Q Ownership
                 if (String.isBlank(inventoryExceptionId)) {
                    throw new AuraHandledException('Inventory Exception Q Owner ID is not defined in the system labels.');
                }
                newCase.OwnerId = inventoryExceptionId;
            }else if(physicalInventoryQ.contains(subRequestType)) {
                String physicalInventoryId = system.label.Physical_Inventory_Q; // Physcial Inventory Q Ownership
                 if (String.isBlank(physicalInventoryId)) {
                    throw new AuraHandledException('Physical Inventory Q Owner ID is not defined in the system labels.');
                }
                newCase.OwnerId = physicalInventoryId;
            }else {
                throw new AuraHandledException(
                    'No matching queue ownership found for Sub Request Type: ' + subRequestType
                );
            }
            
            // Set Subject
            newCase.Subject = caseDetails.get('requestTypes') +' - '+ subRequestType + ' - ' + caseDetails.get('orderNumber') + ' - ' + caseDetails.get('customerName');
            
            // Set Description
           newCase.Description = buildDescription(caseDetails);
            
            // Insert the Case record
            insert newCase;
            
                 //Query CaseNumber for Email reference
            Case caseRecord = [Select Id, CaseNumber, Description From Case Where Id = :newCase.Id];

           //Create Case Comment
           CaseComment newComment= new CaseComment(ParentId = newCase.Id, CommentBody = newCase.Description);
            insert newComment;
			
            String ToAddress = caseDetails.get('requestorEmail');
            String CCAddress = caseDetails.get('ccEmailAddress');
            List<String> ccList = new List<String>();

                if(!String.isBlank(CCAddress)){
                    // Split by comma and trim spaces
                    for(String email : CCAddress.split(',')){
                        if(!String.isBlank(email)){
                            ccList.add(email.trim());
                        }
                    }
                }

             //Send Email to the Requestor
            if(!String.isEmpty(ToAddress)){
                Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
                mail.setToAddresses(new String[] {ToAddress});
               
                // Set CC addresses in the email
                if(!ccList.isEmpty()){
                    mail.setCcAddresses(ccList);
                }
                mail.setSubject('Case #'+caseRecord.CaseNumber+'-'+ newCase.Subject +'-'+ newCase.SuppliedName);

                 // Generate case URL
                 String orgUrl = URL.getOrgDomainUrl().toExternalForm();
                 String caseUrl = orgUrl + '/lightning/r/Case/' + newCase.Id + '/view';
                  // Generate the threading message ID
                    String threadingMessageId = System.Cases.generateThreadingMessageId(newCase.Id);

                    // Set the References header for threading
                     mail.setInReplyTo(threadingMessageId);

                mail.setPlainTextBody('We would like to acknowledge that we have received your request and Case #' + 
                caseRecord.CaseNumber + ' has been created.\n\n' +
                'Here is the information you provided in the form: \n\n' + 
                caseRecord.Description +'\n\n'+
                'You can view your case here: ' + caseUrl + '\n\n' +
                threadingMessageId);

                //Set OrgWideEmailAddress
                OrgWideEmailAddress[] owea = [Select Id from OrgWideEmailAddress Where Address='logistics@arhaus.com' LIMIT 1];
                if(owea.Size()>0){
                    mail.setOrgWideEmailAddressId(owea[0].Id);
                }
                Messaging.sendEmail(new Messaging.SingleEmailMessage[] {mail});
            }  
            return newCase.Id;
        } catch (Exception e) {
            throw new AuraHandledException('Error creating Case: ' + e.getMessage());
        }
    }


private static String buildDescription(Map<String, String> caseDetails) {
    // Include the key fields first
    String description = 'Requestor Name: ' + safeValue(caseDetails.get('requestorName')) + '\n';
    description += 'Requestor Email: ' + safeValue(caseDetails.get('requestorEmail')) + '\n';
    description += 'Order Number: ' + safeValue(caseDetails.get('orderNumber')) + '\n';
    description += 'Sub Request Type: ' + safeValue(caseDetails.get('subRequestType')) + '\n';
    description += 'Request Type: ' + safeValue(caseDetails.get('requestTypes')) + '\n';
    description += 'Hub Location/Location Impacted: ' + safeValue(caseDetails.get('hubLocation')) + '\n\n';

       
        
    // Define keys to skip
    Set<String> skipKeys = new Set<String>{'requestorName', 'requestorEmail', 'orderNumber', 'subRequestType', 'requestTypes'};

    for (String key : caseDetails.keySet()) {
        if (!skipKeys.contains(key)) {
            String val = caseDetails.get(key);
            if (!String.isBlank(val)) {
                description += key + ': ' + capitalizeFirst(val) + '\n';
            }
        }
    }

    return description.trim();
}

@AuraEnabled(cacheable=true)
public static String getStoreName(String storeId) {
    if (String.isBlank(storeId)) {
        return '';
    }
    try {
        Store__c store = [SELECT Name FROM Store__c WHERE Id = :storeId LIMIT 1];
        return store.Name;
    } catch (Exception e) {
        return 'Unknown Store';
    }
}

// Helper method to safely return value or a placeholder
private static String safeValue(String input) {
    return String.isBlank(input) ? 'N/A' : input;
}

// Capitalize first letter only (avoid breaking numbers/codes)
private static String capitalizeFirst(String value) {
    if (String.isBlank(value)) return '';
    return value.substring(0, 1).toUpperCase() + value.substring(1);
}

}