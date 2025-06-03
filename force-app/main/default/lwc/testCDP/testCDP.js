import { api, LightningElement, wire } from 'lwc';
import { getRecord, getFieldValue, getRecordNotifyChange } from 'lightning/uiRecordApi';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import MAGIC_NUMBER_FIELD from '@salesforce/schema/Opportunity.Magic_Number__c';
//import MAGIC_NUMBER_FIELD from '@salesforce/schema/Opportunity.Name';


export default class TestCDP extends LightningElement {
    @api recordId;
    @api height;
    @wire(getRecord, { recordId: '$recordId', fields:[MAGIC_NUMBER_FIELD]})
    opportunity;

    channelName = '/data/OpportunityChangeEvent';
    subscription = {}; // holds subscription, used for unsubscribe

    connectedCallback() {
        this.registerErrorListener();
        this.registerSubscribe();
        console.log('TestCDP connectedCallback called',this.height);
    }

    disconnectedCallback() {
        unsubscribe(this.subscription, () => console.log('Unsubscribed to change events.'));
    }

    // Called by connectedCallback()
    registerErrorListener() {
        onError(error => {
            console.error('Salesforce error', JSON.stringify(error));
        });
    }

    // Called by connectedCallback()
    registerSubscribe() {
        const changeEventCallback = changeEvent => {
            this.processChangeEvent(changeEvent);
        };

        // Sets up subscription and callback for change events
        subscribe(this.channelName, -1, changeEventCallback).then(subscription => {
            this.subscription = subscription;
        });
    }

    // Called by registerSubscribe()
    processChangeEvent(changeEvent) {
        try {
            const recordIds = changeEvent.data.payload.ChangeEventHeader.recordIds; // avoid deconstruction
            if (recordIds.includes(this.recordId)) getRecordNotifyChange([{ recordId: this.recordId }]); // Refresh all components
        } catch (err) {
            console.error(err);
        }
    }

    get magicNumber() {
        return getFieldValue(this.opportunity.data, MAGIC_NUMBER_FIELD) || 42;
    }
}