/* 
 * Date created: 6-10-2019
 * 
 * Class to discribe a hop bale. The class will house the data associated with a hop bale. The class will also
 * allow CRUD methods to be preformed on the hop bale. This class will be responsible for database 
 * access. This class will also preform its own validation on the data used to create a hop bale. 
 * 
 * The this class will preform on a totally encapsulated basis. First a HopeBale must be instansiated then 
 * it can be saved into persistence, loaded from persistence. This model class will not work in a static or 
 * abstract sense so that it will not save "a HopBale" it will only save "this HopBale". 
 * 
 * TODO
 * 
 * 1. Should we opt for a property name and validation pattern direct pairing,
 *    (ex. PRIVATE.baleID = /^\d+$/) and then use a reverse lookup mechanisim to
 *    resolve the property name in the rest of this script. Memory costs vs. 
 *    speed costs.
 *    
 * 2. Should this interface allow for multiple server io error listeners?
 */

// Import Database client module so data can be stored in the db.
import {MongoSocketClient} from "../model/MongoSocketClient.js";

// Import the HopBale Lot model reference to interact with a bale lot 
import {PUBLIC as BaleLot} from "./Lot.js";

// Import the view ui handler
import {setLotNumberOptions} from "../UIHandlers/BaleEditorUIHandler.js";

// Constant used to determine the value of a new bale's baleID
//const NEW_BALE_ID = "-1";
const TMP_LOT_NUM = "OR00000000";

/* Namespace to hold a reference to all the properties and functions that this 
 * script wants to export. */
export const PUBLIC = {};

/* Namespace to hold a reference to all the properties and functions that this 
 * interface does not want to share.*/
const PRIVATE = {};

/* Namespace to hold a reference to all properties that define what a Hop Bale
 * is, but not neccesarily what it does.*/
const PROPERTIES = {}; 

/* Create a monogo db server client used to transfer data back and forth between 
 * this model and the database server */
PRIVATE.msc = new MongoSocketClient("guest");

/* The lot number used by this model to edit the properties of a hop bale as 
 * contained in this model*/
PRIVATE.thisLotNumber;

/* For each property that describes a Hop Bale create an object that specifically
 * describes the details for of that property. These are the properties that 
 * comprise and describe the Hop Bale model. */
PROPERTIES.baleID =  
{
    pattern: /^\d+$/, // String containing at least one digit
    name: "baleID", // The name of the property.
    value: 0, // The current value of this baleID proeprty
    onSet: undefined // Listener to be fired when this property is changed
};

PROPERTIES.fieldID = 
{
    pattern: /^\d{2,}$/, // two or more digits
    name: "fieldID",
    vale: "",
    onSet: undefined // Listener to be fired when this property is set or reset
}; 

PROPERTIES.facilityID = 
{
    pattern: /^\d{1,}$/, // one or more digits
    name: "facilityID",
    value: "", 
    onSet: undefined // Listener to be fired when this property is set or reset
}; 

PROPERTIES.lotNumber = 
{
    pattern: /^[a-z]{2}\d{8}$/i, // Custom pattern 2 letters followed by (exactly?) 8 numbers 
    name: "lotNumber",
    value: TMP_LOT_NUM,
    onSet: undefined // Listener to be fired when this property is set or reset
}; 

PROPERTIES.weight = 
{
    pattern: /^\d+ (lbs|kgs)$/, // ex: 100 lbs OR 100 kgs at least one digit with space between number and unit
    name: "weight",
    value: "0 lbs",
    onSet: undefined // Listener to be fired when this property is set or reset
}; 

PROPERTIES.dryMat = 
{
    pattern: /^\d{1,3}%$/, // between one and three digits followed by "%"
    name: "dryMat",
    value: "",
    onSet: undefined // Listener to be fired when this property is set or reset
}; 

PROPERTIES.hopVariety = 
{
    pattern: /(\w+|-{3})/, // None empty string or "---"
    name: "hopVariety",
    value: "",
    onSet: undefined // Listener to be fired when this property is set or reset
}; 

PROPERTIES.dateBaled = 
{
    // ISO date format:(YYYY-MM-DDTHH:MM:SSZ)
    //pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, 
    pattern: /(""|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2})$/, // The datetime-local format
    name: "dateBaled",
    value: "",
    onSet: undefined // Listener to be fired when this property is set or reset
};

PROPERTIES.notes = 
{
    pattern: /\w*/, // 0 or more characters
    name: "notes",
    value: "",
    onSet: undefined // Listener to be fired when this property is set or reset
}; 

PROPERTIES.wasRebaled = 
{
    pattern: /(true|false)/, // Test this pattern
    name: "wasRebaled",
    value: "false",
    onSet: undefined // Listener to be fired when this property is set or reset
};

PROPERTIES.chngdLots = 
{
    pattern: /(true|false)/, // Test this pattern
    name: "chngLots",
    value: "false",
    onSet: undefined // Listener to be fired when this property is set or reset
};

/* Callback reference used to notify the listener of server errors. If the 
 * database server has an error then this function will be called. This function
 * will have as its sole parameter the error object generated by the error event
 * for which this method is called.*/ 
PUBLIC.onServerError; 

/**
 * 
 * @returns {String|TMP_LOT_NUM}
 */
PUBLIC.getTempLotID = function()
{
    return TMP_LOT_NUM; 
};

// Method to iniate a connection to the database 
PUBLIC.connectDB = async function()
{
    console.log(await PRIVATE.msc.connect()); 
};

PUBLIC.setMDBC = function(mdbc)
{
    PRIVATE.msc = mdbc;
};

// Method to close the connection to the database 
PUBLIC.disconnectDB = async function ()
{
    console.log(await PRIVATE.msc.disconnect());
};

/* Method to add an event listener, for each property of this HopBale, to be 
 * fired when a property of this HopBale is changed. The listener will be fired 
 * either right after the property is changed if the proposed value is valid or
 * if the new value is invalid. The listenr should take in two parameters, the
 * first one will be the proposed value and the second value will be a boolean 
 * to determine whether that value was valid or not.*/
PUBLIC.setPropertyChangedListner = function (property, listner)
{
    PROPERTIES[property].onSet = listner;
};

/**
 * Function to change the current lot being focused on by this bale editor.
 * 
 * @param {String} lotNumber The number of the lot that will be the lot of focus
 *                           of this bale editor.
 */
PUBLIC.changeLots = async function(lotNumber)
{
    // Local Variable Declaration 
    let isValid = true; 
    
    // Validate lot number 
    isValid = PROPERTIES.lotNumber.pattern.test(lotNumber) && !/undefined/.test(lotNumber);
    
    // See if the lot number was valid
    if(isValid)
    {
        // Set the value of the lot number property, but don't set it in the db.
        PRIVATE.thisLotNumber = lotNumber;
        
        // Load the first bale for the lot number passed into the model.
        await PUBLIC.loadBaleAt(0);
    }
};

PUBLIC.populateLotNumberSelector = async function ()
{
    // Local Variable Declaration 
    let lotNumbers = []; 
    
    // Get all the lots then create an array of lot numbers
    lotNumbers = await BaleLot.getLots();
            
    lotNumbers = lotNumbers.map(lot => lot[PROPERTIES.lotNumber.name]); 
    
    // Send this array to the view ui handler 
    setLotNumberOptions(lotNumbers);
};

/* Setters for each data property. Each setter will validate the value passed before setting it as the new
 * value for the property. If the passed value can't be validated then the property will not be set. */
PUBLIC.set_wasRebaled = async function (state, baleID = PROPERTIES.baleID.value)
{
    // Local Variable Declaration
    let isValid = true;
    
    // See if the new value matches the pattern 
    isValid = PROPERTIES.wasRebaled.pattern.test(state) && !/undefined/.test(state); 
    
     // Update the property in the bale record if it was valid
    if (isValid)
    {
        try
        {
            // Save the status update to the database 
            await PRIVATE.msc.setEARP(PROPERTIES.lotNumber.name, 
                                      PRIVATE.thisLotNumber, 
                                      PROPERTIES.baleID.name, baleID,
                                      BaleLot.getBalesName(),
                                      PROPERTIES.wasRebaled.name,state); 
                                      
            // Set the value of the property
            PROPERTIES.wasRebaled.value = state;
        }
        catch (error)
        {
           /* Add an identifier for to the message of the error, so that it
             * will be easier to idtenify where the error occured*/
            //error.message = "SetBaleID Error: " + error.message;
            
            /* Catch any server IO errors and print them to a file Print error 
             * message to windows console */
            window.console.log("SetBaleID: " + error.message);
            
            /* Notify view of the error and that the connection will restart. Do
             * this via an event emission */
             PUBLIC.onServerError(error); 
             
             // Restart server connection 
             PUBLIC.disconnectDB(); 
             PUBLIC.connectDB(); 
        }
    }    
    
    return isValid;
};

PUBLIC.set_chngdLots = async function(state, baleID = PROPERTIES.baleID.value)
{
    /// Local Variable Declaration
    let isValid = true;
    
    // See if the new value matches the pattern 
    isValid = PROPERTIES.chngdLots.pattern.test(state) && !/undefined/.test(state); 
    
     // Update the property in the bale record if it was valid
    if (isValid)
    {
        try
        {
            // Save the status update to the database 
            await PRIVATE.msc.setEARP(PROPERTIES.lotNumber.name, 
                                      PRIVATE.thisLotNumber, 
                                      PROPERTIES.baleID.name, baleID,
                                      BaleLot.getBalesName(),
                                      PROPERTIES.chngdLots.name, state); 
                                      
            // Set the value of the property
            PROPERTIES.chngdLots.value = state;
        }
        catch (error)
        {
           /* Add an identifier for to the message of the error, so that it
             * will be easier to idtenify where the error occured*/
            //error.message = "SetBaleID Error: " + error.message;
            
            /* Catch any server IO errors and print them to a file Print error 
             * message to windows console */
            window.console.log("SetBaleID: " + error.message);
            
            /* Notify view of the error and that the connection will restart. Do
             * this via an event emission */
             PUBLIC.onServerError(error); 
             
             // Restart server connection 
             PUBLIC.disconnectDB(); 
             PUBLIC.connectDB(); 
        }
    }    
    
    return isValid;
};

/* Method */
/**
 * @TODO
 *      1. An error message needs to be sent to the view explaining the bale id is
 *      already saved.
 * 
 * @param {type} id
 * @param {Integer} baleID
 * @returns {isValid}
 */
PUBLIC.set_baleID = async function(id, baleID = PROPERTIES.baleID.value)
{
    // Local Variable Declaration 
    let isValid = true;
    let saved = false;
    
    // Test to see if the new proposed baleID is valid
    isValid = PROPERTIES.baleID.pattern.test(id) ? true : false;
    
    // Convert string id to int id. What if it's NaN?
    id = Number.parseInt(id);
        
    // Make sure the bale isn't already saved 
    saved = await PUBLIC.isSaved(id);
    
    /* Save the current id number passed as the current value of the baleID 
     * property if the value was valid otherwise keep the number the same. */
    PROPERTIES.baleID.value = isValid ? id : PROPERTIES.baleID.value; 
    //PROPERTIES.baleID.value = id;
    
    // Test the value passed to see if it is valid and is not already saved.
    if (isValid && !saved)
    { 
        
        try 
        {   
            // Set the baleID for the given bale in the database 
            await PRIVATE.msc.setEARP(PROPERTIES.lotNumber.name, PRIVATE.thisLotNumber, 
                                PROPERTIES.baleID.name, baleID, 
                                BaleLot.getBalesName(), PROPERTIES.baleID.name, 
                                Number.parseInt(id));
                                
            //Resort the bale IDs to keep them in order
            await PRIVATE.msc.sortEARS(PROPERTIES.lotNumber.name, 
                                       PRIVATE.thisLotNumber, 
                                       BaleLot.getBalesName(),
                                       PROPERTIES.baleID.name);
        }
        catch(error)
        {
            /* Add an identifier for to the message of the error, so that it
             * will be easier to idtenify where the error occured*/
            //error.message = "SetBaleID Error: " + error.message;
            
            /* Catch any server IO errors and print them to a file Print error 
             * message to windows console */
            window.console.log("SetBaleID: " + error.message);
            
            /* Notify view of the error and that the connection will restart. Do
             * this via an event emission */
             PUBLIC.onServerError(error); 
             
             // Restart server connection 
             PUBLIC.disconnectDB(); 
             PUBLIC.connectDB(); 
        } 
    }
    
    /* Once the new value for this property has been validated, and then either 
     * saved in the database or not execute the callback method if it has been
     * set, so that all subscribers will will be notified. */
     if (PROPERTIES["baleID"].onSet)
     {
        PROPERTIES["baleID"].onSet(id, isValid);
     }    
    
    return isValid;
};

PUBLIC.set_dateBaled = async function(dateString, baleID = PROPERTIES.baleID.value)
{
   // Local Variable Declaration 
    let isValid = true; 
    
    // Test to see if the proposed change is valid 
    isValid = PROPERTIES.dateBaled.pattern.test(dateString) ? true : false;
    
    // Test the value passed against the regular express to see if its valid
    if (isValid)
    {
        try 
        {
            // Set the baleID for the given bale in the database 
            await PRIVATE.msc.setEARP(PROPERTIES.lotNumber.name, PRIVATE.thisLotNumber, 
                                   PROPERTIES.baleID.name, baleID, 
                                   BaleLot.getBalesName(), PROPERTIES.dateBaled.name, 
                                   dateString);
                                   
            // Set the value of the property
            PROPERTIES.dateBaled.value = dateString;
        }
        catch(error)
        {        
            // Augment the error message of the error generated by the update event
            //error.message = "SetDateBaled Error: " + error.message;

            // Print error message to windows console 
            window.console.log("SetDateBale Error: " + error.message);
            
            /* Notify view of the error and that the connection will restart. Do
             * this via an event emission */
             PUBLIC.onServerError(error); 

             // Restart server connection 
             PUBLIC.disconnectDB(); 
             PUBLIC.connectDB(); 
        }
    }
    
    /* Once the new value for this property has been validated, and then either 
     * saved in the database or not execute the callback method if it has been
     * set, so that all subscribers will will be notified. */
    if (PROPERTIES["dateBaled"].onSet)
    {
        PROPERTIES["dateBaled"].onSet(dateString, isValid);
    }
        
    return isValid;
};

PUBLIC.set_fieldID = async function(num, baleID = PROPERTIES.baleID.value)
{
   // Local Variable Declaration 
    let isValid = true; 
    
    // See if the new value matches the pattern 
    isValid = PROPERTIES.fieldID.pattern.test(num); 
   
    // Test the value passed against the regular express to see if its valid
    if (isValid)
    {
       try 
       {

            // Set the fieldID for the given bale in the database 
            await PRIVATE.msc.setEARP(PROPERTIES.lotNumber.name, PRIVATE.thisLotNumber, 
                                   PROPERTIES.baleID.name, baleID, 
                                   BaleLot.getBalesName(), PROPERTIES.fieldID.name, 
                                   num);
                                   
            // Set the value of the property
            PROPERTIES.fieldID.value = num;
       }
       catch(error)
       {
           // Print error message to windows console 
           window.console.log("SetDateBale Error: " + error.message);

           /* Notify view of the error and that the connection will restart. Do
            * this via an event emission */
            PUBLIC.onServerError(error); 

            // Restart server connection 
            PUBLIC.disconnectDB(); 
            PUBLIC.connectDB();
       }
   }
   
   
    /* Once the new value for this property has been validated, and then either 
     * saved in the database or not execute the callback method if it has been
     * set, so that all subscribers will will be notified. */
    if (PROPERTIES["fieldID"].onSet)
    {
        PROPERTIES["fieldID"].onSet(num, isValid);
    }
    
   return isValid;
};

PUBLIC.set_facilityID = async function(num, baleID = PROPERTIES.baleID.value)
{
     // Local Variable Declaration 
    let isValid = true; 
    
    // See if the new value matches the pattern 
    isValid = PROPERTIES.facilityID.pattern.test(num);
    // Test the value passed against the regular express to see if its valid
    if (isValid)
    {
        try 
        {
           // Set the facilityID for the given bale in the database 
            await PRIVATE.msc.setEARP(PROPERTIES.lotNumber.name, PRIVATE.thisLotNumber, 
                                   PROPERTIES.baleID.name, baleID, 
                                   BaleLot.getBalesName(), PROPERTIES.facilityID.name, 
                                   num);
                                   
            // Set the value of the property
            PROPERTIES.facilityID.value = num;
        }
        catch(error)
        {
            // Print error message to windows console 
            window.console.log("SetDateBale Error: " + error.message);

            /* Notify view of the error and that the connection will restart. Do
             * this via an event emission */
             PUBLIC.onServerError(error); 

             // Restart server connection 
             PUBLIC.disconnectDB(); 
             PUBLIC.connectDB();
        }
    }
    
    /* Once the new value for this property has been validated, and then either 
     * saved in the database or not execute the callback method if it has been
     * set, so that all subscribers will will be notified. */
    if (PROPERTIES["facilityID"].onSet)
    {
        PROPERTIES["facilityID"].onSet(num, isValid);
    }
    
    return isValid;
};

PUBLIC.set_hopVariety = async function(val, baleID = PROPERTIES.baleID.value)
{
    // Local Variable Declaration 
    let isValid = true;
    
    // See if the new value machtes the pattern 
    isValid = PROPERTIES.hopVariety.pattern.test(val) && !/undefined/.test(val);
    
    // Test the value passed against the regular express to see if its valid
    if (isValid)
    {
        try 
        {
            // Set the hopVariety for the given bale in the database 
            await PRIVATE.msc.setEARP(PROPERTIES.lotNumber.name, PRIVATE.thisLotNumber, 
                                   PROPERTIES.baleID.name, baleID, 
                                   BaleLot.getBalesName(), PROPERTIES.hopVariety.name, 
                                   val);
                                   
            // Set the value of the property
            PROPERTIES.hopVariety.value = val;
        }
        catch(error)
        {
            // Print error message to windows console 
            window.console.log("SetHopVariety Error: " + error.message);

            /* Notify view of the error and that the connection will restart. Do
             * this via an event emission */
             PUBLIC.onServerError(error); 

             // Restart server connection 
             PUBLIC.disconnectDB(); 
             PUBLIC.connectDB();
        }
    }
    
    /* Once the new value for this property has been validated, and then either 
     * saved in the database or not execute the callback method if it has been
     * set, so that all subscribers will will be notified. */
    if (PROPERTIES["hopVariety"].onSet)
    {
        PROPERTIES["hopVariety"].onSet(val, isValid);
    }
    
    return isValid;
};

PUBLIC.set_lotNumber = async function(num, baleID = PROPERTIES.baleID.value)
{
      // Local Variable Declaration 
    let isValid = true;
    
    // See if the new value matches the pattern
    isValid = PROPERTIES.lotNumber.pattern.test(num) && !/undefined/.test(num);
    
    // Test the value passed against the regular express to see if its valid
    if (isValid)
    {
        try 
        {
        
           // Set the lotNumber for the given bale in the database 
            await PRIVATE.msc.setEARP(PROPERTIES.lotNumber.name, 
                                      PRIVATE.thisLotNumber, 
                                      PROPERTIES.baleID.name, baleID, 
                                      BaleLot.getBalesName(), 
                                      PROPERTIES.lotNumber.name, 
                                      num);
                                   
            // Move this bale to new or different lot
            //BaleLot.moveBale(PUBLIC.getBale(baleID), num);
            
            // Keep track of the lot number 
            PROPERTIES.lotNumber.value = num; 
        }
        catch(error)
        {
            // Print error message to windows console 
            window.console.log("SetLotNumber Error: " + error.message);

            /* Notify view of the error and that the connection will restart. Do
             * this via an event emission */
             PUBLIC.onServerError(error); 

             // Restart server connection 
             PUBLIC.disconnectDB(); 
             PUBLIC.connectDB();
        }
    }
    
    /* Once the new value for this property has been validated, and then either 
     * saved in the database or not execute the callback method if it has been
     * set, so that all subscribers will will be notified. */
    if (PROPERTIES["lotNumber"].onSet)
    {
        PROPERTIES["lotNumber"].onSet(num, isValid);
    }
    
    return isValid;
};

PUBLIC.set_weight = async function(num, baleID = PROPERTIES.baleID.value)
{
    // Local Variable Declaration 
    let isValid = true;
    
    // See if the new value matches the pattern
    isValid = PROPERTIES.weight.pattern.test(num);
    
    // Test the value passed against the regular express to see if its valid
    if (isValid)
    {
        try 
        {
           // Set the weight for the given bale in the database 
            await PRIVATE.msc.setEARP(PROPERTIES.lotNumber.name, PRIVATE.thisLotNumber, 
                                   PROPERTIES.baleID.name, baleID, 
                                   BaleLot.getBalesName(), PROPERTIES.weight.name, 
                                   num);
                                   
            // Set the value of the property
            PROPERTIES.wasRebaled.value = num;
        }
        catch(error)
        {
            // Print error message to windows console 
            window.console.log("SetWeigth Error: " + error.message);

            /* Notify view of the error and that the connection will restart. Do
             * this via an event emission */
             PUBLIC.onServerError(error); 

             // Restart server connection 
             PUBLIC.disconnectDB(); 
             PUBLIC.connectDB();
        }   
    }    
    
    /* Once the new value for this property has been validated, and then either 
     * saved in the database or not execute the callback method if it has been
     * set, so that all subscribers will will be notified. */
    if (PROPERTIES["weight"].onSet)
    {
        PROPERTIES["weight"].onSet(num, isValid);
    }
    
    return isValid;
};

PUBLIC.set_dryMat = async function(num, baleID = PROPERTIES.baleID.value)
{
    // Local Variable Declaration 
    let isValid = true;
    
    // See if the new value matches the pattern 
    isValid = PROPERTIES.dryMat.pattern.test(num); 
    
    // Test the value passed against the regular express to see if its valid
    if (isValid)
    {
        try 
        {
        
            // Set the baleID for the given bale in the database 
            await PRIVATE.msc.setEARP(PROPERTIES.lotNumber.name, PRIVATE.thisLotNumber, 
                                   PROPERTIES.baleID.name, baleID, 
                                   BaleLot.getBalesName(), PROPERTIES.dryMat.name, 
                                   num);
                                   
            // Set the value of the property
            PROPERTIES.dryMat.value = num;
        }
        catch(error)
        {
            // Print error message to windows console 
            window.console.log("DryMaterial Error: " + error.message);

            /* Notify view of the error and that the connection will restart. Do
             * this via an event emission */
             PUBLIC.onServerError(error); 

             // Restart server connection 
             PUBLIC.disconnectDB(); 
             PUBLIC.connectDB();
        }
    }
    
    /* Once the new value for this property has been validated, and then either 
     * saved in the database or not execute the callback method if it has been
     * set, so that all subscribers will will be notified. */
    if (PROPERTIES["dryMat"].onSet)
    {
        PROPERTIES["dryMat"].onSet(num, isValid);
    }
    
    return isValid;
};

PUBLIC.set_notes = async function(note, baleID = PROPERTIES.baleID.value)
{
    // Local Variable Declaration 
    let isValid = true;
    
    // See if the new value matches the pattern 
    isValid = PROPERTIES.notes.pattern.test(note) && !/undefined/.test(note); 
    
    // Test the value passed against the regular express to see if its valid
    if (isValid)
    {
        try 
        {
        
            // Set the baleID for the given bale in the database 
            await PRIVATE.msc.setEARP(PROPERTIES.lotNumber.name, PRIVATE.thisLotNumber, 
                                   PROPERTIES.baleID.name, baleID, 
                                   BaleLot.getBalesName(), PROPERTIES.notes.name, 
                                   note);
                                   
            // Set the value of the property
            PROPERTIES.notes.value = note;
        }
        catch(error)
        {
            // Print error message to windows console 
            window.console.log("Notes Error: " + error.message);

            /* Notify view of the error and that the connection will restart. Do
             * this via an event emission */
             PUBLIC.onServerError(error); 

             // Restart server connection 
             PUBLIC.disconnectDB(); 
             PUBLIC.connectDB();
        }
    }
    
    /* Once the new value for this property has been validated, and then either 
     * saved in the database or not execute the callback method if it has been
     * set, so that all subscribers will will be notified. */
    if (PROPERTIES["notes"].onSet)
    {
        PROPERTIES["notes"].onSet(note, isValid);
    }
    
    return isValid;
};

// Method to return the current bale ID being used by this interface


// Get an entire bale as an object to be returned.
//PUBLIC.getBale = async function(baleID, lotNumber = TMP_LOT_ID)
//{
//    // Local Variable Declaration 
//    let theBale = undefined;
//    
//    try 
//    {
//        // Ask the database server for the bale. It will come back as JSON
//        let JSONBale = await PRIVATE.msc.getEAR(PROPERTIES.lotNumber.name, 
//                                                lotNumber, 
//                                                PROPERTIES.baleID.name, baleID,
//                                                BaleLot.getBalesName());
//        
//        // Parse the JSON. Expecting the bale in an array
//        let parsedBale = JSON.parse(JSONBale);
//        
//        /* This method and indeed the whole app operates off the assumption
//         * that there cannont be two bales with the same baleID, so there should 
//         * only be one bale in the array returned */
//        if (parsedBale.length > 1)
//        {
//            throw new Error ("This bale ID refers to more than one hop bale! " +
//                             "Please revise data collection in the database.");
//        }
//        else 
//        {
//            // Get the querried bale from the array returned.
//            theBale = parsedBale[0][BaleLot.getBalesName()][0];
//        }
//    }
//    catch(error)
//    {
//        throw error;
//    }
//    
//    return theBale;
//};

// Getters for each bale property. 

/**
 * @TODO
 *      1. Should the bale's position be a property of the bale?
 *      
 * @param {type} baleID
 * @param {type} lotNumber
 * @returns {serverResponse}
 */
PUBLIC.getBaleIndex = async function (baleID, lotNumber = PRIVATE.thisLotNumber)
{
    // Local Variable Declaration 
    let serverResponse = {}; 
    let isValid = true; 
    
    // Convert the baleID to an integer
    baleID = Number.parseInt(baleID);
    
    // Make suere the baleID and lotNumber are valid 
    isValid = (PROPERTIES.baleID.pattern.test(baleID) && 
               PROPERTIES.lotNumber.pattern.test(lotNumber)) ? 
               true : false; 
    
    // Make sure the baleID and lotNumber passed were valid
    if (isValid)
    {
        try
        {
            /* Attempt to get the position of the requested baleID in the collection 
             * in the lot record in the database */
            serverResponse = await PRIVATE.msc.getEARPosition(
                                               PROPERTIES.lotNumber.name, lotNumber, 
                                               PROPERTIES.baleID.name, baleID, 
                                               BaleLot.getBalesName());                                       
        }
        catch (error)
        {
            /* Add an identifier for to the message of the error, so that it
            * will be easier to idtenify where the error occured*/
           //error.message = "SetBaleID Error: " + error.message;

           /* Catch any server IO errors and print them to a file Print error 
            * message to windows console */
           window.console.log("Get Bale Index: " + error.message);

           /* Notify view of the error and that the connection will restart. Do
            * this via an event emission */
            PUBLIC.onServerError(error); 

            // Restart server connection 
            PUBLIC.disconnectDB(); 
            PUBLIC.connectDB(); 
        }
    }
    
    return serverResponse;
};

PUBLIC.getMaxBaleID = async function(lotNumber = PRIVATE.thisLotNumber)
{
    return Number.parseInt(await PRIVATE.msc.maxEARP(
                    PROPERTIES.lotNumber.name, lotNumber, 
                    BaleLot.getBalesName(), PROPERTIES.baleID.name));
};

/**
 * Method to get thisLotNumber.
 * 
 * @returns {String} The lot number being currently used by this model to access
 *                   hop bales.
 */
PUBLIC.getThisLotNumber = function()
{
    return PRIVATE.thisLotNumber;
};

/**
 * 
 * @returns {String}
 */
PUBLIC.getbaleID = function()
{
    return PROPERTIES.baleID.value;
};

PUBLIC.gethopVariety = function()
{
    return PROPERTIES.hopVariety.value;
};

PUBLIC.getdateBaled = function()
{
    return PROPERTIES.dateBaled.value;
};

PUBLIC.getdryMat = function()
{
    return PROPERTIES.dryMat.value;
};

PUBLIC.getlotNumber = function()
{
   return PROPERTIES.lotNumber.value;
};

PUBLIC.getfieldID = function()
{
    return PROPERTIES.fieldID.value; 
};

PUBLIC.getfacilityID = function()
{
    return PROPERTIES.facilityID.value;
};

PUBLIC.getweight = function()
{
    return PROPERTIES.weight.value;
};

PUBLIC.getnotes = function ()
{
    return PROPERTIES.notes.value;
};

PUBLIC.getwasRebaled = function()
{
    return PROPERTIES.wasRebaled.value;
};

PUBLIC.getchgdLots = function()
{
    return PROPERTIES.chngdLots.value;
};

/** 
 *@TODO:
 *      1. What if the bale object passed doesn't have an id property?
 *      
 *@param {Object} baleProperties The properties to set for a given bale. 
 *
 */ 
PRIVATE.setAll = async function(baleProperties)
{    
    /* Loop through all the properties of the baleProperties and set each 
     * property so that each one will be set in the view via two-way binding. */
    for(const balProp in PROPERTIES)
    {
        /* Skip the lot number property since it's not allowed to be set except 
         * when changing lots. */
        //if(balProp === PROPERTIES.lotNumber.name) {continue;}
        
        /* Set the value. If the value is invalid then set the value to the 
         * empty string */
        PROPERTIES[balProp].value = baleProperties[balProp] ? 
                              baleProperties[balProp] : "";
    }
};

/**
 * Method to publish the mutations of all properties. This is done for the text
 * field binding listener, which is listening to the 'onSet' funciton to be 
 * called. 
 */
PRIVATE.emitAll = function()
{
    for (const prop in PROPERTIES)
    {
        // Only all the mutation publisher if there is one to call
        if (PROPERTIES[prop].onSet)
        {
           PROPERTIES[prop].onSet(PROPERTIES[prop].value, true);
        }
    }
};

/** 
 *
 * 
 * @TODO 
 *      1. Should the bales be sorted by baleID when a new bale is added?
 * 
 *      2. How should duplicate baleIDs be handled?
 *      
 *      3. Hardcoded
 * 
 *  @param {String} lotNumber -
 **/
PUBLIC.createBale = async function(lotNumber = PRIVATE.thisLotNumber)
{
     // Local Variable Declaration 
    let isValid = true;
    let maxBaleID = 0; 
        
    // Test to see if the new proposed lotNumber is valid
    isValid = PROPERTIES.lotNumber.pattern.test(lotNumber) ? true : false; 
   
    // Test the value passed to see if it is valid
    if (isValid)
    { 
        try 
        {
            // Get maximum baleID for the lot 
            maxBaleID = await PUBLIC.getMaxBaleID();
                    
            // FIX THIS LATER If the maxBale ID is -1 (ie no bales in the lot) 
            // make it 1
            maxBaleID = maxBaleID === -1 ? 0 : maxBaleID;
            
            /* Create and add a new bale in the lot's bale's collection at the
             * end, taking care to increment the maxBaleID. Also insert the current
             * lot number assuming that that's what the user wants. */
            await PRIVATE.msc.createEAR(PROPERTIES.lotNumber.name, lotNumber, 
                                BaleLot.getBalesName(), 
                                {[PROPERTIES.baleID.name]: (++maxBaleID), 
                                 [PROPERTIES.lotNumber.name]:
                                  PRIVATE.thisLotNumber});
                                
            // Sort the bales in the lot
            await PRIVATE.msc.sortEARS(PROPERTIES.lotNumber.name, lotNumber, 
                                       BaleLot.getBalesName(), PROPERTIES.baleID.name);
        }
        catch(error)
        {
            /* Add an identifier for to the message of the error, so that it
             * will be easier to idtenify where the error occured*/
            //error.message = "SetBaleID Error: " + error.message;
            
            /* Catch any server IO errors and print them to a file Print error 
             * message to windows console */
            window.console.log("CreateBale: " + error.message);
            
            /* Notify view of the error and that the connection will restart. Do
             * this via an event emission */
             PUBLIC.onServerError(error); 
             
             // Restart server connection 
             PUBLIC.disconnectDB(); 
             PUBLIC.connectDB(); 
        }
    }

    return maxBaleID;
};



/**
 *  Method to load a bale from persistence. The method takes in a bale id and returns a HopBale object
 * with that id and associated data. If the bale is not found in persistence then null is returned
 *
 * @TODO: 
 *       1. Clean up how the bale is parsed in the MongoSocketClient. It should 
 *       come back as just a pure object not nested in an array.
 */
PUBLIC.loadBale = async function(baleID, lotNumber = PRIVATE.thisLotNumber)
{
    // Local Variable Declaration 
    let theBale = undefined;
    let isValid = true;
    
      // Convert the baleID to a number 
    baleID = Number.parseInt(baleID);
    
     // Test to see if the new proposed lotNumber is valid
    isValid = PROPERTIES.lotNumber.pattern.test(lotNumber) ? true : false; 
   
    // Test the value passed to see if it is valid
    if (isValid)
    { 
        try 
        {
            // Ask the database server for the bale. It will come back as JSON.
            let JSONBale = await PRIVATE.msc.getEAR(PROPERTIES.lotNumber.name,
                                                    lotNumber, 
                                                    PROPERTIES.baleID.name, 
                                                    baleID, 
                                                    BaleLot.getBalesName());
            
            // Parse the JSON. Expecting the bale in an array.
            let parsedBale = JSON.parse(JSONBale);

            /* This method and indeed the whole app operates off the assumption
             * that there cannont be two bales with the same baleID, so there should 
             * only be one bale in the array returned */
            if (parsedBale.length !== 1)
            {
                throw new Error ("This bale ID, " + baleID + ", refers to either "+ 
                                 "more than one hop bale, or no hop bale at all! "+ 
                                 "Please revise data collection in the database.");
            }
            else 
            {
                // Get the querried bale from the array returned.
                theBale = parsedBale[0][BaleLot.getBalesName()][0];
                console.log("theBale: " + theBale);
                
                /* If the lot number is blank then set it as the temporary lot 
                 * number. Should it be saved?*/
                theBale[PROPERTIES.lotNumber.name] = 
                    theBale[PROPERTIES.lotNumber.name] ? 
                    theBale[PROPERTIES.lotNumber.name] : PRIVATE.thisLotNumber; 
                
                /* Set all the PROPERTIES of this interface with the property 
                 * values from the just loaded bale */
                PRIVATE.setAll(theBale);
                
                /* Emit property mutation events for all the PROPERTIES in this 
                 * interface */
                PRIVATE.emitAll();
            }
        }
        catch(error)
        {
           /* Add an identifier for to the message of the error, so that it
            * will be easier to idtenify where the error occured*/
           //error.message = "SetBaleID Error: " + error.message;

           /* Catch any server IO errors and print them to a file Print error 
            * message to windows console */
           window.console.log("Load Bale: " + error.message);

           /* Notify view of the error and that the connection will restart. Do
            * this via an event emission */
            PUBLIC.onServerError(error); 

            // Restart server connection 
            PUBLIC.disconnectDB(); 
            PUBLIC.connectDB(); 
        }
    }
    return theBale;
};

/**
 * 
 * @TODO:
 *       1. Should this method unwind the bale from the array returned by the 
 *          server. 
 *          
 * @param {type} index
 * @param {type} lotNumber
 * @returns {theBale}
 */
PUBLIC.loadBaleAt = async function(index, lotNumber = PRIVATE.thisLotNumber)
{
     // Local Variable Declaration 
    let theBale = {baleID: "3"};
    let isValid = true;
    
     // Test to see if the new proposed lotNumber is valid
    isValid = PROPERTIES.lotNumber.pattern.test(lotNumber) ? true : false; 
   
    // Test the value passed to see if it is valid
    if (isValid)
    { 
        try 
        {
            // Ask the database server for the bale. It will come back as an Object.
            theBale = await PRIVATE.msc.getEARAt(PROPERTIES.lotNumber.name,
                                                    lotNumber, 
                                                    PROPERTIES.baleID.name, 
                                                    index, 
                                                    BaleLot.getBalesName());

            /* There needs to be a way to test to make sure there was only one 
             * bale returned */
            if (!theBale)
            {
                throw new Error ("This bale ID, " + theBale.baleID + ", refers to either "+ 
                                 "more than one hop bale, or no hop bale at all! "+ 
                                 "Please revise data collection in the database.");
            }
            else 
            {
               /* If the lot number is blank then set it as the lot number for 
                * this current lot.*/
                theBale[PROPERTIES.lotNumber.name] = 
                    theBale[PROPERTIES.lotNumber.name] ? 
                    theBale[PROPERTIES.lotNumber.name] : PRIVATE.thisLotNumber; 
                    
                /* Set all the PROPERTIES of this interface with the property 
                 * values from the just loaded bale */
                PRIVATE.setAll(theBale);
                
                /* Emit property mutation events for all the PROPERTIES in this 
                 * interface */
                PRIVATE.emitAll();
            }
        }
        catch(error)
        {
           /* Add an identifier for to the message of the error, so that it
            * will be easier to idtenify where the error occured*/
           //error.message = "SetBaleID Error: " + error.message;

           /* Catch any server IO errors and print them to a file Print error 
            * message to windows console */
           window.console.log("Load Bale: " + error.message);

           /* Notify view of the error and that the connection will restart. Do
            * this via an event emission */
            if(PUBLIC.onServerError) 
            {
                PUBLIC.onServerError(error);
            } 

            // Restart server connection 
//            PUBLIC.disconnectDB(); 
//            PUBLIC.connectDB(); 
        }
    }
    return theBale;
};

/* Method to delete a bale from persistence. The method will take in the bale id number and then 
 * delete the bale at that number*/
PUBLIC.deleteBale = async function(baleID, lotNumber = PRIVATE.thisLotNumber)
{
    // Local Varaible Declaration 
    let isValid = true; 
    
    // Convert the baleID to a number 
    baleID = Number.parseInt(baleID);
    
    // Test to see if the new proposed lotNumber is valid
    isValid = PROPERTIES.lotNumber.pattern.test(lotNumber) ? true : false; 
   
    // Test the value passed to see if it is valid
    if (isValid)
    { 
        try 
        {
            await PRIVATE.msc.deleteEAR(PROPERTIES.lotNumber.name, lotNumber,
                                        PROPERTIES.baleID.name, baleID,
                                        BaleLot.getBalesName());
        }
        catch(error)
        {
           /* Add an identifier for to the message of the error, so that it
            * will be easier to idtenify where the error occured*/
           //error.message = "SetBaleID Error: " + error.message;

           /* Catch any server IO errors and print them to a file Print error 
            * message to windows console */
           window.console.log("Delete Bale: " + error.message);

           /* Notify view of the error and that the connection will restart. Do
            * this via an event emission */
            PUBLIC.onServerError(error); 

            // Restart server connection 
            PUBLIC.disconnectDB(); 
            PUBLIC.connectDB(); 
        }
    }
};

/* Method to check and see if a bale with a given bale id is already saved in persistence. Returns 
 * boolean if the bale is already saved.*/
PUBLIC.isSaved = async function (baleID, lotNumber = PRIVATE.thisLotNumber)
{
    // Local Variable Declaration 
    let saved = false; 
    
    // Convert the baleID to the an integer
    baleID = Number.parseInt(baleID);
    
    try 
    {
        saved = (await PRIVATE.msc.getEAR(PROPERTIES.lotNumber.name, lotNumber,
                                          PROPERTIES.baleID.name, baleID, 
                                          BaleLot.getBalesName())) === "[]" ? 
                                          false : true; 
    }
    catch (error)
    {
       /* Add an identifier for to the message of the error, so that it
        * will be easier to idtenify where the error occured*/
       //error.message = "SetBaleID Error: " + error.message;

       /* Catch any server IO errors and print them to a file Print error 
        * message to windows console */
       window.console.log("Delete Bale: " + error.message);

       /* Notify view of the error and that the connection will restart. Do
        * this via an event emission */
        PUBLIC.onServerError(error); 

        // Restart server connection 
        PUBLIC.disconnectDB(); 
        PUBLIC.connectDB(); 
    }
    
    return saved;
};

/*Method to validate an indivual property of a HopBale according to the standards this class. */
function isPropValid()
{

}

/* Method to create a string representation of a HopBale*/
function toString ()
{
    let baleString = "";
    let fieldNames = Object.keys(PROPERTIES);

    // Loop through the fieldNames and build the string 
    for (let name of fieldNames)
    {
        baleString += name + ":" + this[name] +";";
    }

    return baleString;
}

/* Overloaded toString method to create a string representation of the hopbale data. This version 
 * seeks to create a searlized version of the HopBale data and allow the caller to set cutsom delimiters
 * for the key/value pairs of this object. */
PUBLIC.toCustomDelimString = function(baleObj, keyDelim = "=", entryDelim = "|")
{
    let baleString = "";
    let fieldNames = Object.keys(PROPERTIES);

    // Loop through the fieldNames and build the string 
    for (let name of fieldNames)
    {
        baleString += name + keyDelim + baleObj[name] + entryDelim;
    }

    return baleString;
};

/**
 * Method to create an Object Shell of this interface. The object returned will 
 * have all the keys that make up the PROPERTIES of this interface. The value 
 * for each key will be the empty string.
 * 
 * @param {Object} baleProperties The properties of a bale that will serve as a 
 *                                basis for the shell bale being produced here.
 *                                
 * @returns {Object} - Shell object containing all the keys in the PROPERTIES 
 *                     namesapce.
 */
//PUBLIC.createPartialObjShell = function (baleProperties)
//{
//    // Local Variable Declaration 
//    let shell = {};
//    
//    // Loop through all the properties in this interface 
//    for (const key in PROPERTIES)
//    {
//        // Set each key from the PROPERTIES namespace as a key for object shell
//        shell[key] = baleProperties[key] ? baleProperties[key] : ""; 
//    }
//    
//    return shell;
//};


