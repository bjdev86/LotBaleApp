/* 
 * v. 1.0
 * 
 * @TODO
 *      1. Rewrite this with Proxies to observe the behavior of a model object,
 *         specifically the getters and setters of specific properties on the 
 *         model.
 *      
 *      2. Should this databinder keep track of how the values on each side of
 *         the binder have changed? Should each end of the binder keep track of
 *         those changes.
 */

class TextFieldBinder
{
    /**
     * Creates a TextFieldBinder channel to bind a text field to a property.
     * 
     * @param {type} model
     * 
     * @returns {undefined}
     */
    constructor(model)
    {
        // Class level members 
        this.txtObserver; 
        this.theModel = model; 
        
        /* Define the mutation observer, based on the desired mutation type,
         * which for text fields would be the characterData mutation type. The 
         * mutationObserver will call the setter method in the model for the 
         * property identified by the id attribute of the text field where the 
         * characterData event is observed. The link between the model property 
         * and the textfield div in the view is keyed on the id attribute of the 
         * textfield div in the view*/
        this.txtObserver = new MutationObserver(async function (mutationList, observer)
        {
            // Local Variable Declaration 
            let txtFldID = undefined; 
            let txtFldVal = "";
            let modelVal = "";
            
            // Run through each mutation in the list generated when an action happens
            for (const mutation of mutationList)
            {
                /* Look for characterData mutations meaning mutations occured to  
                 * the text node of the HTML element being observed. Check to  
                 * make sure the mutation target node (the text node) has a 
                 * parent element indicating that the target node is a text node. 
                 * Text nodes are removed when the all thier text data is erased,
                 * and can't be operated on nor be referenced. */
                if (mutation.type === "characterData" && mutation.target.parentElement !== null)
                {
                    // Get the text field value 
                    txtFldVal = mutation.target.textContent; 
                    console.log("Value is: " + txtFldVal);
                    
                    // Set the text field id to the id of the textfield div
                    txtFldID = mutation.target.parentElement.id;                   

                    // Get the value the model currently, has for this text field
                    modelVal = await this.theModel["get" + txtFldID]();
                    console.log("modelVal: " + modelVal);
                    console.log("charData id is: " + txtFldID);
                    /* Call the mutator method in the model associated with 
                     * the text field id if the value in the model is 
                     * different*/
                    if (txtFldVal !== modelVal)
                    {
                        await model["set_" + txtFldID](txtFldVal);
                    }                    
                }
                /* Check to see if the text node is removed ie its text content
                 * was deleted. If so then erase the value in the model. Debounce 
                 * by testing for the appendage of a text child node. Text nodes  
                 * are handled by the "characterData" case. */
                else if (mutation.type === "childList" && !mutation.target.hasChildNodes())
                {
                    // Set the text field id to the id of the textfield div
                    txtFldID = mutation.target.id;
                    console.log("has a childNode: " + mutation.target.hasChildNodes());
                    console.log("chldLst id is: " + txtFldID);
                    
                    // Get the text field value 
                    txtFldVal = mutation.target.textContent; 
                    
                    // Get the value the model currently, has for this text field
                    modelVal = await this.theModel["get" + txtFldID]();
                        
                    /* Call the mutator method in the model associated with 
                     * the text field id */
                    //if (mutation.target.hasChildNodes())
                    if (txtFldVal !== modelVal)
                    {
                        await model["set_" + txtFldID](txtFldVal);
                    }
                    
                }

            }
        }.bind(this)); 
    }
    
    /*
     * Method to bind another textField to another model property. 
     * 
     * @TODO: 
     *      1. Should the change listener convert all new values that are 
     *      undefined or should the model transform it?
     *         
     * @param {Node} txtField 
     */
    bindTextField(inputElem, onValueValid, onValueInvalid, blnkIsValid)
    {
        // Local Variable Declaration
        let observerOptions =
        {
            // Catch character events that are fired
            characterData: true,
            characterDataOldValue: true,
            
            /* Catch child node additions and subtractions needed to track when 
             * text is entered and erased*/
            childList: true,
            subtree: true
        };     
        let callBack = undefined; 
        
        // Make the MutationObserver observe the textfield passed
        this.txtObserver.observe(inputElem, observerOptions);
        
        /* Determine which callback to use based on which type of input elements
         * is being bound in this method call */
        if (inputElem instanceof HTMLDivElement) // For div elements
        {
            callBack = function(newVal, isValid)
            {
                // Convert any undefined values to the empty string
                newVal = (newVal === undefined && blnkIsValid) ? "" : newVal;
                
                /* Check to see if the value proposed for the property was valid. */
                if(isValid || (blnkIsValid && (newVal === "")))
                {
                    /* Check to make sure the value of the textfield is 
                     * different than the value coming from the model. This 
                     * ensures that an infinte loop is avoided. */
                    if (inputElem.innerText !== newVal)
                    {
                        inputElem.innerText = newVal;
                        console.log("Property Change Listener: " + newVal);
                    }
                    
                    // Fire the onValueValid callback method
                    onValueValid(newVal);
                }
                else 
                {
                    // Fire the onValueInvalid callback method
                    onValueInvalid(newVal);
                }

            };
        }
        else if (inputElem instanceof HTMLSelectElement) // for select elements
        {
            callBack = function(newVal, isValid) 
            {
                // Convert any undefined values to the empty string
                newVal = (newVal === "" && blnkIsValid) ? "---" : newVal;
                
                /* Check to see if the value proposed for the property was valid. */
                if(isValid || (blnkIsValid && (newVal === "")))
                {
                    /* Check to make sure the value of the textfield is 
                     * different than the value coming from the model. This 
                     * ensures that an infinte loop is avoided. */
                    if (inputElem.item(inputElem.selectedIndex).value !== newVal)
                    {
                        inputElem.selectedIndex = inputElem.options[newVal].index;
                        console.log("Property Change Listener: " + newVal);
                    }
                }
            };
        }
        else if (inputElem instanceof Element && inputElem.type === "datetime-local")
        {
            callBack = function(newVal, isValid) 
            {
                // Convert any undefined values to the empty string
                newVal = (newVal === "" && blnkIsValid) ? "" : newVal;
                
                /* Check to see if the value proposed for the property was valid. */
                if(isValid || (blnkIsValid && (newVal === "")))
                {
                    /* Check to make sure the value of the textfield is 
                     * different than the value coming from the model. This 
                     * ensures that an infinte loop is avoided. */
                    if (inputElem.value !== newVal)
                    {
                        inputElem.value = newVal;
                        console.log("Property Change Listener: " + newVal);
                    }
                }
            };
        }
        
        // Define the callback fired when the property in the model is set.
        this.theModel.setPropertyChangedListner(inputElem.getAttribute("id"),
                                                callBack);       
    }    
};

export {TextFieldBinder};
