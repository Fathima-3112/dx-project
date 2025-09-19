import { LightningElement, track, api, wire } from 'lwc';
import getHubLocations from '@salesforce/apex/HubController.getHubLocations';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createCase from '@salesforce/apex/GuestCaseController.createCase';
import getStoreName from '@salesforce/apex/GuestCaseController.getStoreName';

export default class CustomerOrderRequest extends LightningElement {
    @api requestorName;
    @api requestorEmail;
    @api ccEmailAddress;
    @api requestType;
    @api subRequestType;

    @track orderNumber ='';
    @track hubLocation = '';
    @track hubLocationId = '';
    @track reasonForRA = '';
    @track additionalNotes = '';
    @track customerName = '';
    @track sku = '';
    @track quantity = '';
    @track batchNumber = '';
    @track permissionGranted = '';
    @track stockLocationFrom ='';
    @track stockLocationTo ='';
    @track borrowFrom ='';
    @track borrowTo='';
    @track requestorStore='';
    @track requestedHomeDeliveryDate='';
    @track reasonShipValue='';
    @track fulfillmentDate='';
    @track reasonValidateValue='';
    @track reasonOrderCorrValue='';
    @track reasonDCValue ='';
    @track fulfillmentValue='';
    @track skuFulfillment='';
    @track manifestReason='';
    @track orderTypeValue='';
    @track returnTypeValue='';
    @track reasonForSmallParcel='';
    @track currentAddress = '';
    @track newAddress ='';
    @track reasonOrderCorrValue ='';
  
    @track isModalOpen = false;
    @track showSubRequestOptions = false;
    @track hubOptions = [];
    @track showSubForm = false;
    @track willAttachFiles = '';
    @track isLoading = false;
    @track orderCorrReason;
    @track isAddressChange = false;
  
    relatedRecordId;
    relatedRecordBool = false;

    fileAttachmentOptions = [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' }
    ];

   get raReasons() {
        return [
            { label: 'Cancelled Order', value: 'Cancelled Order' },
            { label: 'Refused', value: 'Refused' },
            { label: 'Shipped to wrong hub', value: 'Shipped to wrong hub' },
            { label: 'Committed Reverse - customer not ready / shipped too early', value: 'Committed Reverse' }
        ];
    }

    get manifestReasons() {
        return [
            { label: 'Client canceling order/Fraud', value: 'Client canceling order/Fraud' },
            { label: 'Add/Remove Sku or Product', value:'Add/Remove Sku or Product' },
            { label: 'Changing form of payment', value:'Changing form of payment' }
        ];
    }

    get orderType(){
        return[
            { label: 'Sales Order', value: 'Sales Order' },
            { label: 'Exchange', value: 'Exchange' },
            { label: 'Return', value: 'Return' }
        ]
    }

    get returnType(){
        return[
            {label:'Return to Vendor (RTV Credit)', value:'Return to Vendor (RTV Credit)'},
            {label:'Return for Damaged / Lost merchandise (Mark out)', value:'Return for Damaged / Lost merchandise (Mark out)'},
            {label:'Return via small parcel – should receive return into DC', value:'Return via small parcel – should receive return into DC'}
        ]
    }

     get parcelReason(){
        return[
            { label: 'Return not shipped back', value: 'Return not shipped back' },
            { label: 'UPS Lost', value: 'UPS Lost' },
            { label: 'Customer disposed after receiving ', value:'Customer disposed after receiving '}
        ]
    }

     get reasonShip(){
        return[
            { label: 'Earlier or Later', value: 'Earlier or Later' },
            { label: 'Not Ready', value: 'Not Ready' },
            { label: 'Escalated', value: 'Escalated' },
            { label: 'Travel plans', value: 'Travel plans' },
            { label: 'Limited delivery window', value: 'Limited delivery window' },
            { label: 'Special Event', value: 'Special Event' },
            { label:'Add Back to Original Date',value:'Add Back to Original Date'},
            { label:'Add to existing fulfillment',value:'Add to existing fulfillment'}
        ]
    }

    get reasonOrderCorr(){
        return[
            { label: 'Address Change', value: 'Address Change' },
            { label: 'Unscheduled Items (U)', value: 'Unscheduled Items (U)' },
            { label: 'WF update fulfillment/Add/Remove', value: 'WF update fulfillment/Add/Remove' },
            { label:'Rewrite Lines', value: 'Rewrite Lines'}
          
        ]
    }

    get reasonValidate(){
        return[
            { label: 'Did order really ship to the hub', value: 'Did order really ship to the hub' },
            { label: 'Stock location still showing DC', value: 'Stock location still showing DC' } 
        ]
    }

    @wire(getHubLocations)
    wiredHubs({ error, data }) {
        if (data) {
            this.hubOptions = data.map(hub => ({
                label: hub,
                value: hub
            }));
        } else if (error) {
            console.error('Error fetching hubs:', error);
        }
    }

    handleInputChange(event) {
        const { name, value } = event.target;
         this[name] = value;
    }

    

    async handleHubLocationChange(event) {
    const selectedRecord = event.detail;
    console.log('Record selected:', JSON.stringify(selectedRecord));
    
    if (selectedRecord && selectedRecord.recordId) {
        this.hubLocationId = selectedRecord.recordId;
        
        try {
            // Get store name from Apex
            const storeName = await getStoreName({ storeId: this.hubLocationId });
            this.hubLocationName = storeName;
            this.hubLocation = storeName;
            console.log('Apex - Hub Location Name:', this.hubLocationName);
        } catch (error) {
            console.error('Error getting store name:', error);
            this.hubLocationName = 'Unknown Store';
            this.hubLocation = 'Unknown Store';
        }
    } else {
        this.hubLocationId = '';
        this.hubLocationName = '';
        this.hubLocation = '';
    }
}
    

     handleAddressChange(event) {
        this.reasonOrderCorrValue = event.detail.value; 

        // Set visibility based on value selected
        this.isAddressChange = (this.reasonOrderCorrValue  === 'Address Change');
    }

    get showBanner(){
       return this.subRequestType && this.subRequestType !== 'Request for COI';
    }

    get isAddressChange(){
        return this.orderCorrReason === 'Address Change';
    }
    get showRAForm() {
        return this.subRequestType === 'Return Transfer (RA) Request';
    }
    
    get showManifestFom(){
        return this.subRequestType === 'Remove from Manifest';
    }

    get showBorrowForm(){
        return this.subRequestType === 'Borrow Request';
    }
    get showOrderInvoice(){
        return this.subRequestType === 'Order Invoice Request' || 
           this.subRequestType === 'Order Invoiced in Error';
    }

    get showDirectShip(){
        return this.subRequestType === 'Invoice Direct Ship Return';
    }
    get showParcel(){
        return this.subRequestType === 'Small Parcel Mark Out';
    }
    get showShipDate(){
        return this.subRequestType === 'Change Ship Date';
    }
    get showOrderCorr(){
        return this.subRequestType === 'Order Correction';
    }
    get showValidateForm(){
        return this.subRequestType === 'Validate Item Shipped';
    }

   /* get showFlow(){
        return this.subRequestType ==='Request for COI';
    }*/

   

      handleFileAttachmentChange(event) {
        this.willAttachFiles = event.detail.value;
    }

    handleStatusChange(event) {
        // Check if flow is finished
        if (event.detail.status === 'FINISHED') {
            // Delay for 3 seconds, then refresh
            setTimeout(() => {
                window.location.reload();
            }, 3000); 
        }
    }

    handleCreateCase() {
     // Show the spinner
     this.isLoading = true;
    const caseDetails = {
        requestorName: this.requestorName,
        requestorEmail: this.requestorEmail,
        ccEmailAddress:this.ccEmailAddress,
        requestTypes: this.requestType,
        subRequestType: this.subRequestType,
        orderNumber: this.orderNumber,
        customerName: this.customerName,
        hubLocation: this.hubLocationName,
        reason: this.reasonForRA,
        additionalNotes: this.additionalNotes,
        sku:this.sku,
        quantity:this.quantity,
        batchNumber:this.batchNumber,
        permissionGranted:this.permissionGranted,
        stockLocationFrom: this.stockLocationFrom,
        stockLocationTo: this.stockLocationTo,
        borrowFrom: this.borrowFrom ,
        borrowTo: this.borrowTo,
        requestorStore: this.requestorStore,
        confirmedDate:this.confirmedDate,
        fulfillmentDate:this.fulfillmentDate,
        reasonOrderCorrValue:this.reasonOrderCorrValue,
        reasonShipValue:this.reasonShipValue,
        reasonValidateValue:this.reasonValidateValue,
        requestedHomeDeliveryDate:this.requestedHomeDeliveryDate,
        fulfillmentValue:this.fulfillmentValue,
        skuFulfillment:this.skuFulfillment,
        manifestReason:this.manifestReason,
        orderTypeValue:this.orderTypeValue,
        returnTypeValue:this.returnTypeValue,
        reasonForSmallParcel:this.reasonForSmallParcel,
        currentAddress:this.currentAddress,
        newAddress:this.newAddress,
        willAttachFiles: this.willAttachFiles,
       
    };
     console.log('caseDetails being sent:', JSON.stringify(caseDetails));
   
   createCase({caseDetails: caseDetails})
   
        .then(result => {
            //Hide the spinner
            this.isLoading = false;
            this.relatedRecordId = result;
            this.relatedRecordBool = true;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Your case has been created successfully',
                message: 'Case ID: ' + result,
                variant: 'success'
            }));
            
             // Page refresh logic based on file attachment preference
                if (this.willAttachFiles === 'yes') {
                    this.isModalOpen = true;
                }

             // Page refresh logic based on file attachment preference
                if (this.willAttachFiles === 'no') {
                    // Refresh the page 5 seconds after file upload
                    setTimeout(function() {
                        window.location.reload();
                    }, 3000); 
                }
        })
        .catch(error => {
             this.isLoading = false;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error creating case',
                message: error.body.message,
                variant: 'error'
            }));
              
        });
}
     closeModal() {
        this.isModalOpen = false;
    }
//Upload Files
handleUploadFinished(event) {
    const uploadedFiles = event.detail.files;
    
    this.dispatchEvent(new ShowToastEvent({
        title: 'Attachments have been successfully linked to the current case record.',
        message: `${uploadedFiles.length} file(s) uploaded successfully!`,
        variant: 'success'
    }));
     this.isModalOpen = false;
   // Refresh the page 5 seconds after file upload
setTimeout(function() {
    window.location.reload();
}, 3000); 
    
}
}