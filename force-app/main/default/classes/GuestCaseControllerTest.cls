@isTest
private class GuestCaseControllerTest {

    // Helper method to create test cases for different subRequestTypes
    private static void createCaseWithSubRequestType(String subType) {
        Map<String, String> caseDetails = new Map<String, String>{
            'requestorEmail' => 'testuser@example.com',
            'requestorName' => 'Test User',
            'orderNumber' => 'ORD123456',
            'subRequestType' => subType,
            'requestTypes' => 'Delivery Issue',
            'hubLocation' => 'Cleveland Hub',
            'ccEmailAddress' => 'ccuser@example.com',
            'customerName' => 'John Doe',
            'additionalNote' => 'Details here'
        };

        Test.startTest();
        String caseId = GuestCaseController.createCase(caseDetails);
        Test.stopTest();

        System.assertNotEquals(null, caseId, 'Expected Case to be created');

        Case c = [SELECT Id, OwnerId, SuppliedEmail, SuppliedName, Subject, Description FROM Case WHERE Id = :caseId];
        System.assertEquals('testuser@example.com', c.SuppliedEmail);
        System.assertEquals('Test User', c.SuppliedName);
        System.assert(c.Subject.contains('Delivery Issue'));
        System.assert(c.Description.contains('Requestor Name'));

        // Verify CaseComment was created
        List<CaseComment> comments = [
            SELECT Id, CommentBody FROM CaseComment WHERE ParentId = :caseId
        ];
        System.assertEquals(1, comments.size(), 'CaseComment should be created');
        System.assert(comments[0].CommentBody.contains('Requestor Email'));
    }

    @isTest static void testCaseCreation_CorpInventoryOwner() {
        createCaseWithSubRequestType('Status Change: Discounted Pricing Status (Twilight)'); // Triggers Corporate_Inventroy_Owner_ID
    }

    @isTest static void testCaseCreation_orderResolutionQ() {
        createCaseWithSubRequestType('Small Parcel Mark Out'); // Triggers Order_Resolution_Q_Id
    }

    @isTest static void testCaseCreation_StoreTransfer() {
        createCaseWithSubRequestType('Store Reverse Transfer Request'); // Triggers Store_Transfer_Shipping_Q
    }

    @isTest static void testCaseCreation_physicalQ() {
        createCaseWithSubRequestType('Batch Number Update Request'); // Triggers Physical Inventory Q
    }
    @isTest static void testCaseCreation_inventoryExcepQ() {
        createCaseWithSubRequestType('Return Transfer (RA) Request'); // Triggers Inventory Exception Q
    }

    @isTest static void testCaseCreation_OrderManagementQ() {
        createCaseWithSubRequestType('Remove from Manifest'); // Triggers Ordermanagement/DeliveryOps Q
    }

    @isTest static void testGetStoreName_ValidStore() {
        Store__c testStore = new Store__c(Name = 'Arhaus - Cleveland');
        insert testStore;

        Test.startTest();
        String name = GuestCaseController.getStoreName(testStore.Id);
        Test.stopTest();

        System.assertEquals('Arhaus - Cleveland', name);
    }

    @isTest static void testGetStoreName_UnknownStore() {
        Test.startTest();
        String name = GuestCaseController.getStoreName('001000000000000'); // Non-existent ID
        Test.stopTest();

        System.assertEquals('Unknown Store', name);
    }

    @isTest static void testGetStoreName_BlankInput() {
        Test.startTest();
        String name = GuestCaseController.getStoreName('');
        Test.stopTest();

        System.assertEquals('', name);
    }

    // Optional: Skip this edge case if label is present in org
    @isTest static void testCreateCase_BlankRecordTypeId_Label() {
        if (!String.isBlank(System.Label.Logistics_Record_Type)) {
            System.debug('Skipping test: Label is populated in org');
            return;
        }

        Map<String, String> caseDetails = new Map<String, String>{
            'requestorEmail' => 'fail@example.com',
            'requestorName' => 'Fail User',
            'orderNumber' => 'FAIL123',
            'subRequestType' => 'Remove from Manifest',
            'requestTypes' => 'Fail Type',
            'hubLocation' => 'Nowhere',
            'ccEmailAddress' => '',
            'customerName' => 'Ghost User'
        };

        Test.startTest();
        try {
            GuestCaseController.createCase(caseDetails);
            System.assert(false, 'Expected AuraHandledException for missing RecordTypeId label');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('Logistics Record Type is not defined'));
        }
        Test.stopTest();
    }
}
