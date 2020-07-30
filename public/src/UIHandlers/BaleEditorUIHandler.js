/* 
 * Date Created: 7/4/2019
 */


import * as HopBaleController from "../ctrl/BaleController.js";
import {PUBLIC as HopBale} from "../model/HopBale.js";
import {TextFieldBinder} from "../UIHandlers/TextFieldBinder.js";
//import {PUBLIC as Lot} from "../model/Lot.js";

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
class BaleEditorUIHandler
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
        
        // Model and controller
        this.model; 
        this.controller; 
    }
    
    /* Method to bind event handlers to the UI buttons allowing user control of 
     * the application */
    bindUI()
    {
        // Add event listeners to the 
        //this.__formEl.elements.namedItem("goToBale").addEventListener("click", this.gotoButtonClick.bind(this));
        this.__formEl.elements.namedItem("nwBaleButton").addEventListener("click", this.addButtonClick.bind(this));
        this.__formEl.elements.namedItem("dltBaleButton").addEventListener("click", this.deleteButtonClick.bind(this));
        this.__formEl.elements.namedItem("previous").addEventListener("click", this.previousButtonClick.bind(this));
        this.__formEl.elements.namedItem("next").addEventListener("click", this.nextButtonClick.bind(this));
       
        /* Create TextField Data Binder so that each text field can be bound to 
         * a property in the data model.*/
        let txtDataBinder = new TextFieldBinder(HopBale);
        
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
        
        // Get a reference to the lot number selector on the view
        let lotSelector = this.__formEl.elements.namedItem("lot");
        
        // Add a selector listener to drop down menu 
        lotSelector.addEventListener("change", async function (event)
        {
            // Change to the following lot when the user selects it.
            await HopBale.changeLots(event.target.value);
        });
        
        // Bind the hop variety drop down menu to the model
        let varietySelector = this.__formEl.elements.namedItem("hopVariety");
        
        varietySelector.addEventListener("change", function (event)
        {
            HopBale.set_hopVariety(event.target.value);
        });
               
        // Configure the date picker input listener 
        let dateBaled = this.__formEl.elements.namedItem("dateBaled");
        
        dateBaled.addEventListener("input", function(event)
        {
            HopBale.set_dateBaled(event.target.value);
        });
        
        // Load and set the bale for the editor.
    }
        
    // Method to be fired when text field values are found to be valid
    inputIsValid (txtFld, errLbl)
    {
        /* Return anymous function reference to to be called to execute actions
         * taken against a given text field. These actions primarily revolve 
         * around how the text field will be styled and the hidding of the error
         * message.*/
        return function(val)
        {console.log ("val: " + val);
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
        {console.log ("val: " + val);
            // Set a custom attribute that will change the style of the textfield
            txtFld.setAttribute("data-txt-validity", "invalid");
            
            // Show the error message
            errLbl.style.display = "block";
            errLbl.textContent = "The " + txtFld.id + " value is incorrect. Please revise.";
        }.bind(this); 
    }
    
    // Method to handle previous bale button click events
    async gotoButtonClick()
    {         
    }
    
    // Method to handle add ball button click events
    async addButtonClick()
    {
        await HopBaleController.createNewBale(/*this.txtFlds.namedItem("lotNumber").innerText*/);    
    }
    
    // Method to handle delete bale click events
    async deleteButtonClick()
    {
        // Remove the bale currently in the editor's view
        await HopBaleController.removeBale(this.txtFlds.namedItem("baleID").innerText);
    }
    
    // Method to handle delete bale click events
    async previousButtonClick()
    {
        // Remove the bale currently in the editor's view
        await HopBaleController.prevBale(this.txtFlds.namedItem("baleID").innerText);
    }
    
    // Method to handle delete bale click events
    async nextButtonClick()
    {
        // Remove the bale currently in the editor's view
        await HopBaleController.nextBale(this.txtFlds.namedItem("baleID").innerText);
    }
};

export async function setLotNumberOptions(lotNumbers)
{
    // Local Variable Delcaration 
    let anOption;

   // Get the lot selector element from the DOM in order to edit it.
    let lotSelector = document.getElementById("mainForm").elements.namedItem("lot");

    // Put all the lot numbers in the drop down menu
    for (let i = 0; i < lotNumbers.length; i++)
    {
        // Create an option for the select element 
        anOption = document.createElement("option");

        // Set the value of the option
        anOption.text = anOption.value = lotNumbers[i];

        // Add the option to the select element 
        lotSelector.add(anOption, null);
    }
};

export {BaleEditorUIHandler}; 