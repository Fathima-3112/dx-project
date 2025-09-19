import { LightningElement, track, api } from 'lwc';
import getHubLocations from '@salesforce/apex/HubController.getHubLocations';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createCase from '@salesforce/apex/GuestCaseController.createCase';
import getStoreName from '@salesforce/apex/GuestCaseController.getStoreName';

export default class FinalMileRequest extends LightningElement {
    @api requestorName;
    @api requestorEmail;
    @api ccEmailAddress;
    @api requestType;
    @api subRequestType;

    @track orderNumber ='';
    @track additionalNotes = '';
    @track customerName = '';
    @track sku = '';
    @track quantity = '';
    @track fulfillmentDate='';

    relatedRecordId;
    relatedRecordBool = false;

     fileAttachmentOptions = [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' }
    ];

    get reason215(){
        return[
            { label: 'Missing', value: 'Missing' },
            { label: 'Confirm Transmitted', value: 'Confirm Transmitted' },
            { label: 'Add to manifest for transmission purpose', value: 'Add to manifest for transmission purpose' }
        ]
    }

    get reasonValidate(){
        return[
            { label: 'Did order really ship to the hub', value: 'Did order really ship to the hub' },
            { label: 'Stock location still showing DC', value: 'Stock location still showing DC' } 
        ]
    }


    handleFileAttachmentChange(event) {
        this.willAttachFiles = event.detail.value;
    }

    get showBanner(){
        return this.subRequestType && this.subRequestType !== 'Redirect Request';
     }

    get showRedirect()
    {
        return this.subRequestType ==='Redirect Request'
    }
    get show215(){
        return this.subRequestType ==='215_EDI'
    }
    get showValidateForm(){
        return this.subRequestType === 'Validate Item Shipped';
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
           fulfillmentDate:this.fulfillmentDate,
           reason215Value:this.reason215Value,
           reasonValidateValue:this.reasonValidateValue,
           fulfillmentValue:this.fulfillmentValue,
           actionNeeded:this.actionNeeded,
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