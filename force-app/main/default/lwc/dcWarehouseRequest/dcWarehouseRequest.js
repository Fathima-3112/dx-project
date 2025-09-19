import { LightningElement, track, api } from 'lwc';
import getHubLocations from '@salesforce/apex/HubController.getHubLocations';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createCase from '@salesforce/apex/GuestCaseController.createCase';
import getStoreName from '@salesforce/apex/GuestCaseController.getStoreName';

export default class DcWarehouseRequest extends LightningElement {
    @api requestorName;
    @api requestorEmail;
    @api ccEmailAddress;
    @api requestType;
    @api subRequestType;

    @track orderNumber ='';
    @track hubLocation = '';
    @track hubLocationId = '';
    @track customerName = '';
    @track sku = '';
    @track transferDate='';
    @track transferNumber='';
    @track lps='';
    @track locationImpacted='';
    @track actionNeeded='';
    @track reasonDCValue='';
   
    @track isModalOpen = false;
    @track willAttachFiles = '';
    @track isLoading = false;

    relatedRecordId;
    relatedRecordBool = false;

     fileAttachmentOptions = [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' }
    ];

    neededAction=[{label:'Print Delivery Ticket', value:'Print Delivery Ticket'},
        {label:'Invoice if the order does not auto-complete', value:'Invoice if the order does not auto-complete'}
    ];

    get reasonDc(){
        return[
            { label: 'Initiate movement', value: 'Initiate movement' },
            { label: 'ETA', value: 'ETA' },
            { label: 'Confirm arrival', value: 'Confirm arrival' }
        ]
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

get showBanner(){
    return this.subRequestType !== '';
 }

get showEmployeeOrder(){
    return this.subRequestType ==='Employee Order CPU'
}

get showQualityHold(){
    return this.subRequestType ==='Status Change: Quality Hold'
}

get showSKUChange(){
    return this.subRequestType ==='SKU Change Requests'
}

get showBatchNumber(){
    return this.subRequestType ==='Batch Number Update Request'
}

get showDc()
{
    return this.subRequestType ==='DC to DC'
}

handleFileAttachmentChange(event) {
    this.willAttachFiles = event.detail.value;
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
       sku:this.sku,
       reasonDCValue:this.reasonDCValue,
       transferDate:this.transferDate,
       transferNumber:this.transferNumber,
       lps:this.lps,
       locationImpacted:this.locationImpacted,
       actionNeeded:this.actionNeeded,
       willAttachFiles: this.willAttachFiles,
       hubLocationId:this.hubLocationId,
       hubLocation:this.hubLocation

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