/* 
 * Date Created: 7/4/2019
 */

import * as LotController from "../ctrl/LotController.js";
import {PUBLIC as BaleLot} from "../model/Lot.js";
import {TextFieldBinder} from "../UIHandlers/TextFieldBinder.js";

// THIS IS JUST FOR DEMO PURPOSES THESE GLOBAL SHOULD BE DELETED LATER
let baleCount = 0; 
let baleIndex = 0; 

const FORM_INPUTS = {};
const FORM_ERR_LBLS = {};

/* Class to handle the UI operations for the main editor form on the dataEditor
 * view. This UIHandler will act as an intermediary between the main hop bale 
 * controller and the html view the user will interact with. This class is acting
 * as the "code behind" the UI to handle click events and render errors sent back
 * by the controller after user data has been processed. This UIHandler will 
 * eventually be responsible for error event processing and rendering in the view. 
 * */
class LotEditorUIHandler
{
    // Class constructor that will consume a form element from the view HTML. 
    constructor (formEl)
    {
        // Class data members
        this.__formEl = formEl; 
        
        // Get the all the input text fields 
        this.txtFlds = document.getElementsByClassName("txtfld");
        
        // Get all the Error labels
        this.errLbls = document.getElementsByClassName("errorMsg");
        
        // Get the select field 
        this.baleSelect = document.getElementById("bales");
    }
    
    /* Method to bind event handlers to the UI buttons allowing user control of 
     * the application */
    bindUI()
    {
        // Add event listeners to the 
        this.__formEl.elements.namedItem("prevLot").addEventListener("click", this.prevButtonClick.bind(this));
        this.__formEl.elements.namedItem("nxtLot").addEventListener("click", this.nxtButtonClick.bind(this));
        this.__formEl.elements.namedItem("baleEditor").addEventListener("click", this.editorButtonClick.bind(this));
        this.__formEl.elements.namedItem("addLotButton").addEventListener("click", this.addButtonClick.bind(this));
        this.__formEl.elements.namedItem("dltLotButton").addEventListener("click", this.deleteButtonClick.bind(this));
       
        /* Create TextField Data Binder so that each text field can be bound to 
         * a property in the data model.*/
        let txtDataBinder = new TextFieldBinder(BaleLot);
        
        // Loop through all the text fields and bind them to the model
        for (let i = 0; i < this.txtFlds.length; i++)
        {
            // Bind the baleID textfield to the model 
            txtDataBinder.bindTextField
            (
                this.txtFlds[i],
                this.inputIsValid(this.txtFlds[i], this.errLbls[i]),
                this.inputIsInValid(this.txtFlds[i], this.errLbls[i]),
                true
            );
        }
        
        // Set a property change listener for when bales are loaded with the lot
        BaleLot.setPropertyChangedListner("bales", function (bales)
        {
            let anOption;
            
            // Remove all the bales in the list 
            for (let i = this.baleSelect.length; i >= 0; i--)
            {
                this.baleSelect.remove(i);
            }
            
            // Add in the new bales from the incomin data.
            for (let i = 0; i < bales.length; i++)
            { 
                anOption = document.createElement("option");
                anOption.text = "baleID: " + bales[i].baleID;
                this.baleSelect.add(anOption);
            }
        }.bind(this));
        
        // Set an input listener for the datepicker for the date shipped
        let dateShipped = this.__formEl.elements.namedItem("dateShipped");
        
        dateShipped.addEventListener("input", function(event)
        {
            BaleLot.set_dateShipped(event.target.value);
        });
    }
    
    
    
//    
//    // Method to initialize the application 
//    async init()
//    {
//        await LotController.init();
//    }
        
    // Method to be fired when text field values are found to be valid
    inputIsValid (txtFld, errLbl)
    {
        /* Return anymous function reference to to be called to execute actions
         * taken against a given text field. This actions primarily revolve 
         * around how the text field will be styled and the hidding of the error
         * message.*/
        return function(val)
        {console.log ("Valid val: " + val);
            // Set a custom attribute that will change the style of the textfield
            txtFld.setAttribute("data-txt-validity", "valid");
            
            // Hide the error message
            errLbl.style.display = "none";
        }.bind(this); 
    }
    
    // Method to handle value is invalid events on input text fields 
    inputIsInValid (txtFld, errLbl)
    {
        /* Return anymous function reference to to be called to execute actions
         * taken against a given text field. This actions primarily revolve 
         * around how the text field will be styled and the displaying of the 
         * error message.*/
        return function(val)
        {console.log ("Invalid val: " + val);
            // Set a custom attribute that will change the style of the textfield
            txtFld.setAttribute("data-txt-validity", "invalid");
            
            // Hide the error message
            errLbl.style.display = "block";
            errLbl.textContent = "The " + txtFld.id + " value is incorrect. Please revise.";
        }.bind(this); 
    }
    
    // Method to handle previous bale button click events
    async prevButtonClick()
    {
        // Route the click event to the controller 
        await LotController.prevLot(this.txtFlds.namedItem("lotNumber").innerText);
    }
    
    // Method to handle next bale button click events
    async nxtButtonClick()
    {
        // Route the click event to the controller 
        await LotController.nxtLot(this.txtFlds.namedItem("lotNumber").innerText);
    }
    
    // Method to handle previous bale button click events
    async addButtonClick ()
    {
        // Route the click event to the controller
        await LotController.createNewLot();
    }
    
    // Method to handle previous bale button click events
    async deleteButtonClick ()
    {
        // Remove the bale currently in the editor's view
        await LotController.removeLot(this.txtFlds.namedItem("lotNumber").innerText);
    }
    
    // Method to handle the bale editor click event 
    async editorButtonClick()
    {
        
    }
};

export {LotEditorUIHandler}; 