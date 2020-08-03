/** 
 * Date created: 9-27-2019
 * 
 * Interface to discribe a Hop Bale Lot. The interface will describe the data 
 * associated with a hop bale lot. The interface will also provide CRUD methods 
 * that will allow basic control of hop bale lots. This class will be responsible 
 * for database access. This inteface will also preform its own validation on 
 * the data used to create a hop bale lot as it is being put into the database. 
 * 
 * This interface will act as an independent unit. The data properties of a 
 * HopBale Lot are updated and retrieve strainght from persistence. This model 
 * interface will not store any of the Lot property data locally, but will 
 * instead hand data off between the database and the caller. This interface will
 * primarily act as a filter for data going into the database, the gate keeper. 
 *  
 * @TODO
 * 
 * 1. Should we opt for a property name and validation pattern direct pairing,
 *    (ex. PRIVATE.baleID = /^\d+$/) and then use a reverse lookup mechanisim to
 *    resolve the property name in the rest of this script. Memory costs vs. 
 *    speed costs.
 *    
 * 2. Should this interface allow for multiple server io error listeners?
 * 
 * 3. Should this interface be a class? It's behaving like one.
 * 
 * 4. All property patterns need to test false (invalid) if "undefined" is found
 *    in them.
 *    
 * 5. Remove thisLotID and replace it with a PROPERTIES.lotNumber.value.
 * 
 * 6. Should character strings be allowed to be the empty string? Adjust regexs?
 */

// Import the websocket client so that this model can connect to the database.
import {MongoSocketClient} from "../model/MongoSocketClient.js";

/* Import the public methods from the HopBale so that this model can keep it up 
 * to date. */
import {PUBLIC as HopBale} from "./HopBale.js";

// Constant used to determine the value of a new bale's baleID
const TMP_LOT_NUM = "OR00000000";

/** 
 * Namespace to hold a reference to all the properties and functions that this 
 * script wants to export. */
export const PUBLIC = {};

/** 
 * Namespace to hold a reference to all the properties and functions that this 
 * interface does not want to share.*/
const PRIVATE = {};

/** 
 * Create a monogo db server client used to transfer data back and forth between 
 * this model and the database server */
PRIVATE.msc = new MongoSocketClient("guest");

/* Namespace to hold a reference to all properties that define what a Hop Bale
 * is, but not neccesarily what it does.*/
const PROPERTIES = {}; 

/* For each property that describes a Hop Bale create an object that specifically
 * describes the details for of that property. These are the properties that 
 * comprise and describe the Hop Bale model. */
PROPERTIES.baleCount =  
{
    pattern: /^\d*$/, // String containing at least one digit
    name: "baleCount", // The name of the property.
    value: 0,           // Current Value
    onSet: undefined // Listener to be fired when this property is changed
};

PROPERTIES.buyer = 
{
    pattern: /\w*/, // Allow the empty string
    name: "buyer",
    value: "",      // Current value
    onSet: undefined // Listener to be fired when this property is set or reset
};

PROPERTIES.dateShipped = 
{
    // ISO date format:(YYYY-MM-DDTHH:MM:SSZ)
    //pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, 
    pattern: /(""|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2})$/, // The datetime-local format
    name: "dateShipped",
    value: new Date().toString(),   // Current Value
    onSet: undefined // Listener to be fired when this property is set or reset
};

/*
 * @TODO 
 *      1.  Should the empty string be allowed here?
 * @type type
 */
PROPERTIES.lotNumber = 
{
    pattern: /^[a-z]{2}\d{8}$/i, // Custom pattern 2 letters followed by (exactly?) 8 numbers
    name: "lotNumber",
    digiCount: 8,
    value: TMP_LOT_NUM,
    onSet: undefined // Listener to be fired when this property is set or reset
};

PROPERTIES.notes = 
{
    pattern: /\w*/, // Allow the empty string
    name: "notes",
    value: "",           // Current Value
    onSet: undefined // Listener to be fired when this property is set or reset
};

PROPERTIES.owner = 
{
    pattern: /\w*/, // Allow the empty string
    name: "owner",
    value: "",           // Current Value
    onSet: undefined // Listener to be fired when this property is set or reset
}; 

PROPERTIES.rejectBaleCount =  
{
    pattern: /^\d*$/, // String containing at least one digit
    name: "rejectBaleCount", // The name of the property.
    value: "0",                 // Current Value.
    onSet: undefined, // Listener to be fired when this property is change
};

PROPERTIES.bales =
{
    name: "bales",
    value: [],
    onSet: undefined,
    get y () {},
    set y(val) {this.name = val;},
};


// List of bale ids that are a part of this lot.
PRIVATE.baleList = [""];

// Export the temporary lot number
PUBLIC.TMP_LOT_NUM = TMP_LOT_NUM;

/* Callback reference used to notify the listener of server errors. If the 
 * database server has an error then this function will be called. This function
 * will have as its sole parameter the error object generated by the error event
 * for which this method is called.*/ 
PUBLIC.onServerError; 

// Method to iniate a connection to the database 
PUBLIC.connectDB = async function()
{
    console.log(await PRIVATE.msc.connect()); 
};

// Method to close the connection to the database 
PUBLIC.disconnectDB = async function ()
{
    console.log(await PRIVATE.msc.disconnect());
};

PUBLIC.setDBConnection = function(mdbc)
{
    PRIVATE.msc = mdbc;
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

/* Setters for each data property. Each setter will validate the value passed before setting it as the new
 * value for the property. If the passed value can't be validated then the property will not be set. */

PUBLIC.set_bales = async function (bales, lotNum = PROPERTIES.lotNumber.value)
{
    // Local Variable Declaration 
    let isValid = true; 
    let balesStr = "";
    
    try
    {
        // Test the bales to for validity
        
        // Logic to set the entire bales collection for the lot in persistence
        await PRIVATE.msc.updateRecord(PROPERTIES.lotNumber.name, lotNum,
                                       PROPERTIES.bales.name, bales);
        // Get all the bales from the database for this lot
        //PROPERTIES.bales.value = await PUBLIC.getAllBales(lotNum);
        //bales = await PUBLIC.getAllBales(lotNum);

        // Keep the local value up to date 
        PROPERTIES.bales.value = bales; 
    }
    catch (error)
    {
       /* Catch any server IO errors and print them to a file Print error 
        * message to windows console */
       window.console.log("SetBaleCount: " + error.message);

       /* Notify view of the error and that the connection will restart. Do
        * this via an event emission */
        PUBLIC.onServerError(error); 

        // Restart server connection 
        PUBLIC.disconnectDB(); 
        PUBLIC.connectDB(); 
    }
    
    /* Once the new value for this property has been validated, and then either 
     * saved in the database or not execute the callback method if it has been
     * set, so that all subscribers will will be notified. */
    if (PROPERTIES["bales"].onSet)
    {
        PROPERTIES["bales"].onSet(bales, true);
    }
};

/**
 * @TODO 
 *      1. This is really a computed value and should not be settable (mutable). Make that
 *         so in the future. 
 *         
 * @param {type} count
 * @param {type} lotNum
 * @returns {isValid}
 */
PUBLIC.set_baleCount = async function(count, lotNum = PROPERTIES.lotNumber.value)
{
    // Local Variable Declaration 
    let isValid = true;
   
    // Test to see if the new proposed baleID is valid
    isValid = PROPERTIES.baleCount.pattern.test(count) ? true : false; 
   
    // Test the value passed to see if it is valid
    if (isValid)
    { 
        try 
        {   
            // Set the field for the given bale in the database 
            await PRIVATE.msc.updateRecord(PROPERTIES.lotNumber.name, lotNum, 
                                   PROPERTIES.baleCount.name, count);
                                   
            PROPERTIES.baleCount.value = count; 
        }
        catch(error)
        {
            /* Add an identifier for to the message of the error, so that it
             * will be easier to idtenify where the error occured*/
            //error.message = "SetBaleID Error: " + error.message;
            
            /* Catch any server IO errors and print them to a file Print error 
             * message to windows console */
            window.console.log("SetBaleCount: " + error.message);
            
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
    if (PROPERTIES["baleCount"].onSet)
    {console.log("Set Bale Count");
        PROPERTIES["baleCount"].onSet(count, isValid);
    }
    
    return isValid;
};

PUBLIC.set_buyer = async function(buyer, lotNum = PROPERTIES.lotNumber.value)
{
    // Local Variable Declaration 
    let isValid = true;
   
    // Test to see if the new proposed baleID is valid
    isValid = PROPERTIES.buyer.pattern.test(buyer) && !/undefined/.test(buyer);
   
    // Test the value passed to see if it is valid
    if (isValid)
    { console.log("Set Buyer");
        try 
        {
            // Set the field for the given bale in the database 
            await PRIVATE.msc.updateRecord(PROPERTIES.lotNumber.name, lotNum, 
                                   PROPERTIES.buyer.name, buyer);
                                   
            PROPERTIES.buyer.value = buyer;
        }
        catch(error)
        {
            /* Add an identifier for to the message of the error, so that it
             * will be easier to idtenify where the error occured*/
            //error.message = "SetBaleID Error: " + error.message;
            
            /* Catch any server IO errors and print them to a file Print error 
             * message to windows console */
            window.console.log("SetBaleCount: " + error.message);
            
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
    if (PROPERTIES["buyer"].onSet)
    {console.log("Set Buyer View");
        PROPERTIES["buyer"].onSet(buyer, isValid);
    }
    
    return isValid;
};

PUBLIC.set_dateShipped = async function(dateString, lotNum = PROPERTIES.lotNumber.value)
{
   // Local Variable Declaration 
    let isValid = true; 
    
    // Test to see if the proposed change is valid 
    isValid = PROPERTIES.dateShipped.pattern.test(dateString) ? true : false;
    
    // Test the value passed against the regular express to see if its valid
    if (isValid)
    {
        try 
        {console.log("Set Date Shipped");
            // Set the field for the given bale in the database 
            await PRIVATE.msc.updateRecord(PROPERTIES.lotNumber.name, lotNum, 
                                   PROPERTIES.dateShipped.name, dateString);
                                   
            PROPERTIES.dateShipped.value = dateString;
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
    if (PROPERTIES["dateShipped"].onSet)
    {console.log("Set Date Shipped View");
        PROPERTIES["dateShipped"].onSet(dateString, isValid);
    }
        
    return isValid;
};

PUBLIC.set_lotNumber = async function(num, lotNum = PROPERTIES.lotNumber.value)
{
      // Local Variable Declaration 
    let isValid = true;
    let saved = false; 
    
    // See if the new value matches the pattern
    isValid = PROPERTIES.lotNumber.pattern.test(num) && !/undefined/.test(num);
    
    // See if the lotNumber is already saved
    saved = await PUBLIC.isSaved(num); 
    
    
    /* Save the current lot number passed as the current value of the lotNumber
     * property if the value was valid otherwise keep the number the same. */
    PROPERTIES.lotNumber.value = isValid ? num : PROPERTIES.lotNumber.value; 
    
    // Test the value passed against the regular express to see if its valid
    if(isValid && !saved)
    {
        try 
        {console.log("set lotNumber");        
            // Set the field for the given bale in the database 
            await PRIVATE.msc.updateRecord(PROPERTIES.lotNumber.name, lotNum, 
                                   PROPERTIES.lotNumber.name, num);
            
            // Update all the bales in this lot.
            //PUBLIC.setBalesProperty(PROPERTIES.lotNumber.name, num);
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
    {console.log("Set Lot Number View");
        PROPERTIES["lotNumber"].onSet(num, isValid);
    }
    
    return isValid;
};

PUBLIC.set_notes = async function(note, lotNum = PROPERTIES.lotNumber.value)
{
   // Local Variable Declaration 
    let isValid = true; 
    
    // Test to see if the proposed change is valid 
    isValid = PROPERTIES.notes.pattern.test(note) && !/undefined/.test(note);
    
    // Test the value passed against the regular express to see if its valid
    if (isValid)
    {
        try 
        {console.log("Set notes");
            // Set the field for the given bale in the database 
            await PRIVATE.msc.updateRecord(PROPERTIES.lotNumber.name, lotNum, 
                                   PROPERTIES.notes.name, note);
                                   
            PROPERTIES.notes.value = note;
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
    if (PROPERTIES["notes"].onSet)
    { console.log("Set Notes View");
        PROPERTIES["notes"].onSet(note, isValid);
    }
        
    return isValid;
};

PUBLIC.set_owner = async function(owner, lotNum = PROPERTIES.lotNumber.value)
{
    // Local Variable Declaration 
    let isValid = true;
    
    // See if the new value machtes the pattern 
    isValid = PROPERTIES.owner.pattern.test(owner)  && !/undefined/.test(owner);
    
    // Test the value passed against the regular express to see if its valid
    if (isValid)
    {
        try 
        {console.log("set owner");
            // Set the field for the given bale in the database 
            await PRIVATE.msc.updateRecord(PROPERTIES.lotNumber.name, lotNum, 
                                   PROPERTIES.owner.name, owner);
                                   
            PROPERTIES.owner.value = owner;
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
    if (PROPERTIES["owner"].onSet)
    {console.log("Set Owner View");
        PROPERTIES["owner"].onSet(owner, isValid);
    }
    
    return isValid;
};

PUBLIC.set_rejectBaleCount = async function(count, lotNum = PROPERTIES.lotNumber.value)
{
    // Local Variable Declaration 
    let isValid = true;
    
    // See if the new value machtes the pattern 
    isValid = PROPERTIES.rejectBaleCount.pattern.test(count);
    
    // Test the value passed against the regular express to see if its valid
    if (isValid)
    {
        try 
        {console.log("set reject bale count");
            // Set the field for the given bale in the database 
            await PRIVATE.msc.updateRecord(PROPERTIES.lotNumber.name, lotNum, 
                                   PROPERTIES.rejectBaleCount.name, count);
                                   
            PROPERTIES.rejectBaleCount.value = count; 
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
    if (PROPERTIES["rejectBaleCount"].onSet)
    {console.log("Set RBC View");
        PROPERTIES["rejectBaleCount"].onSet(count, isValid);
    }
    
    return isValid;
};


// Method to return the current bale ID being used by this interface
PUBLIC.getThisLotNum = function()
{
    return PROPERTIES.lotNumber.value;
};

// Method to the return the name of the collection that holds all the bales
PUBLIC.getBalesName = function()
{
    return PROPERTIES.bales.name; 
};

// Method to get all the bales for a lot form persistence as an array.
PUBLIC.getAllBales = async function(lotNum = PROPERTIES.lotNumber.value)
{
    // Local Variable Declaration 
    let bales = []; 
    
    try
    {
        bales = await PRIVATE.msc.getEARS(PROPERTIES.lotNumber.name, lotNum, 
                                          PROPERTIES.bales.name);
    }
    catch(error)
    {
        console.log("Get All Bales: " + error.message );
    }
    
    return bales;
};

// Get all the lots in sorted order by Lot Number from the database
PUBLIC.getLots = async function()
{
    // Local Variable Declaration
    let lots = [];
    
    try 
    {
        lots = await PRIVATE.msc.getAllDocs("lotNumber", true);
    }
    catch(error)
    {
        console.log("Get Lots: " + error);
    }
    
    return lots;
};

// Get an entire lot as an object to be returned.
PUBLIC.getLot = async function(lotNum = PROPERTIES.lotNumber.value)
{
    // Local Variable Declaration 
    let theLot = undefined;
    
    try 
    {
        // Ask the database server for the lot. It will come back as JSON
        let JSONLot = await PRIVATE.msc.getRecord(PROPERTIES.lotNumber.name, lotNum);
        
        // Parse the JSON. Expecting the bale in an array
        let parsedLot = JSON.parse(JSONLot);
        
        /* This method and indeed the whole app operates off the assumption
         * that there cannont be two lots with the same lotNum, so there should 
         * only be one lot in the array returned */
        if (parsedLot.length > 1)
        {
            throw new Error ("This lot num refers to more than one hop bale! " +
                             "Please revise data collection in the database.");
        }
        else 
        {
            // Get the querried lot from the array returned.
            theLot = parsedLot[0];
        }
    }
    catch(error)
    {
        throw error;
    }
    
    return theLot;
};

// Getters for each bale property. 
PUBLIC.getbaleCount = async function(lotNum = PROPERTIES.lotNumber.value)
{
    // Local Variable Declaration 
    let serverResponse = "";
    
    // Attempt to get lot from the database 
    try 
    {
        // Get the lot property requested.
        serverResponse = await PRIVATE.msc.getEALength(PROPERTIES.lotNumber.name, lotNum, 
                                               PROPERTIES.bales.name);
    }
    catch(error)
    {
        // Catch any server io error here and Print the error to the log 
        window.console.log("Get BaleCount: " + error.message);

        /* Call the registered error call back method to notify listeners that
         * a server io error has occured.*/
         PUBLIC.onServerError(error); 

         // Restart server connection 
         PUBLIC.disconnectDB(); 
         PUBLIC.connectDB();
    }
    
    return serverResponse;
};

PUBLIC.getbuyer = function()
{
    return PROPERTIES.buyer.value;
};

PUBLIC.getdateShipped = function()
{
   return PROPERTIES.dateShipped.value;
};

PUBLIC.getlotNumber = function()
{
    return PROPERTIES.lotNumber.value;
};

PUBLIC.getnotes = function()
{
   return PROPERTIES.notes.value;
};

PUBLIC.getowner = function()
{    
    return PROPERTIES.owner.value;
};

PUBLIC.getrejectBaleCount = function()
{
    return PROPERTIES.rejectBaleCount.value;
};

PUBLIC.getbales = function ()
{
    return PROPERTIES.bales.value;
};

PUBLIC.getLotCount = async function()
{
    // Local Variable Declaration 
    let docCount = "";
    
    // Attempt to get the bales object objects from the database
    try
    {
        docCount = await PRIVATE.msc.docsCount();
    }
    catch(error)
    {
        // Catch any server io error here and Print the error to the log 
        window.console.log("Get Lot Count: " + error.message);

        /* Call the registered error call back method to notify listeners that
         * a server io error has occured.*/
         PUBLIC.onServerError(error); 

         // Restart server connection 
         PUBLIC.disconnectDB(); 
         PUBLIC.connectDB();
    }
    
    return docCount;
};

/**
 * 
 * @param {type} prop
 * @param {type} value
 * @returns {undefined}
 */
//PUBLIC.setBalesProperty = function(prop, value)
//{
//    // Local Variable Declaration 
//    let bales;
//            
//    // Get all the bales for this lot.
//    bales = PUBLIC.getBales();
//    
//    // Loop through all the bales and set the property desired
//    for (const bale of bales)
//    {
//        HopBale["set__" + prop](value, bale.baleID);
//    }
//};

/**
 * 
 * @param {type} bale
 * @param {type} destination
 * @returns {undefined}
 */
PUBLIC.moveBale = function (bale, destination)
{
    // Local Variable Declaration 
    
    if (destination)
    {
        // Move the bale in the database through db command.
        
    }
    else 
    {
        // Create a new lot
        PUBLIC.createLot(TMP_LOT_NUM);
        
        // Move the bale to the new lot through db command.
        
    }
};

///**
// * Method to add a hop bale's id to the array of bale ids that comprise this lot.
// * 
// * @param {type} baleID The id of a bale to be added to this lot's baleID list.
// * 
// * @returns {undefined}
// */
//PUBLIC.addBale = function(baleID)
//{
//   PRIVATE.baleList.push(baleID); 
//};
//
///**
// * Method to remove a bale id from the list of bale ids that are a part of this
// * HopBale lot. The id will only be removed if it exsists. 
// * 
// * @param {type} baleID id of the bale to be rmoved from the list. 
// * @returns {undefined}
// */
//PUBLIC.removeBale = function(baleID)
//{
//    // Only delete the bale index if it exsists in the lot.
//    if (PRIVATE.baleList.includes(baleID))
//    {
//       PRIVATE.baleList.splice(PRIVATE.baleList.indexOf(baleID), 1);
//    }
//};
//
///**
// * Method to return a baleID at a given index in the list of bale Ids in this 
// * lot.
// * 
// * @param {type} index The index of the baleID to be returned
// * @returns {String} The baleID at index, or undefined if it doesn't exsist.
// */
//PUBLIC.getBale = function(index)
//{
//    return PRIVATE.baleList[index];
//};

/** 
 * Method to set multiple (if not all) the properties of a Lot object from a 
 * given set of data.  
 * @TODO
 *      1. This is WRONG! Somehow we shouldn't have to reset the lot number 
 *      twice every time.
 * @param {Object} lotProperties Object containing the values that will be set/
 *                               updated for each of the properties of a Lot. 
 *                               The properties of a lot should corespond one to
 *                               one with the properties of this passed object.
 **/ 
PUBLIC.setAll = async function(lotProperties)
{
    // Local Variable Declaration 
    let lotNumber = lotProperties[PROPERTIES.lotNumber.name];
    
    // Set the lotNumber first 
    await PUBLIC["set_lotNumber"](lotProperties["lotNumber"], lotNumber);
    
    /* Loop through all the properties of the baleProperties and set each 
     * property so that each one will be set in the view via two-way binding. */
    for(const lotProp in PROPERTIES)
    {
        await PUBLIC[("set_" + lotProp)](lotProperties[lotProp], lotNumber);
    }
};

/**
 * 
 * @param {type} lot
 * @returns {undefined}
 */
PUBLIC.displayLot = function(lot)
{
    // Local Variable Declaration 
    let aProp; 
    
    // Loop through the properties of the lot that was passed 
    for (const prop in PROPERTIES)
    {
        // Make sure the lot property is valid 
        aProp = lot[prop] ? lot[prop] : "";
        
        // Set the value for each property passed
        PROPERTIES[prop].value = aProp;
        
        /* Let the databinder know that the property was updated here, so it 
         * will be updated in the view */
        PROPERTIES[prop].onSet(aProp, true);
    }
};

/** 
 * Method to create a new hop bale lot in persistence. 
 * 
 * @TODO 
 *      1. Is there a better way to determine how many zero should be padded on
 *         the beginning of lotNumber when its converted back into a string. 
 *         
 *      2. The lot number string has hard coded elements!!! Fix it!
 *      
 *      3. What about when there are no lots? 
 */
PUBLIC.createLot = async function()
{
     // Local Variable Declaration 
    let lotNumStr = ""; // Lot Number String
    let lotNum = 0; 
    
    try 
    {
        // Get the maximum lotNumber for the db collection 
        lotNumStr = await PRIVATE.msc.maxPropValue(PROPERTIES.lotNumber.name);
        
        // Parse out the number as an integer. Only extract the integer part
        lotNum = Number.parseInt(lotNumStr.slice(lotNumStr.search(/\d/g)));
    
        // Increment lotNumber and convert it to a valid lotNumber string
        lotNumStr = "OR" + (++lotNum).toString().padStart(PROPERTIES.lotNumber.digiCount, "0");
        
        // Set the field for the given bale in the database 
        await PRIVATE.msc.createRecords(
        {
            [PROPERTIES.lotNumber.name]: lotNumStr,
            [PROPERTIES.bales.name]: []
        });
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

    return lotNumStr;
};

/* Method to load a bale from persistence. The method takes in a bale id and returns a HopBale object
 * with that id and associated data. If the bale is not found in persistence then null is returned*/
PUBLIC.loadLot = async function(lotNumber)
{
    // Local Variable Declaration 
    let theLot = undefined;
    let JSONLot = "";
    
    try 
    {
        // Ask the database server for the bale. It will come back as JSON.
        JSONLot = await PRIVATE.msc.getRecord(PROPERTIES.lotNumber.name, 
                                                     lotNumber);
        
        /* Check to make sure a single lot was returned*/
        if (JSONLot === "{}")
        {
            throw new Error ("This lot number, " + lotNumber + ", refers to either "+ 
                             "more than one lot, or no lot at all! "+ 
                             "Please revise data collection in the database.");
        }
        else 
        {
            // Get the querried bale from the array returned.
            theLot = JSON.parse(JSONLot)[0];
        }
    }
    catch(error)
    {
        window.console.log("Load Bale Error: " + error.message);
        throw error;
        PUBLIC.onServerError(error);
    }
    
    return theLot;
};

/** 
 * Method to delete a bale from persistence. The method will take in the bale id number and then 
 * delete the bale at that number
 *
 *@param {String} lotNumber The lot number of the lot to delete.
 *
 *@returns {undefined} Void 
 */
PUBLIC.deleteLot = async function(lotNumber)
{
    //  Use sessionStorage space.
    try
    {
        await PRIVATE.msc.deleteRecord(PROPERTIES.lotNumber.name, lotNumber);
    }
    catch(error)
    {
        window.console.log(error);
        throw error; 
        PUBLIC.onServerError(error);
    }
};

/* Method to check and see if a lot with a given lot number is already saved in 
 * persistence. */
PUBLIC.isSaved = async function (lotNumber)
{
    // Local Variable Declaration 
    let saved = false; 
    
    try 
    {
        saved = (await PRIVATE.msc.getRecord(PROPERTIES.lotNumber.name, lotNumber)) === "[]" ? false : true;
    }
    catch (error)
    {
        window.console.log(error);
        //throw error;
        PUBLIC.onServerError(error);
    }
    
    return saved;
};

/**
 * The method loads a lot at a given index position from persistence. Lots will
 * be sorted by lot id before a lot is retrieved, so the index refers to the 
 * position of the lots in sorted order.
 * 
 * @param {Number|String} index The index of the record in persistence.
 * 
 * @returns {Object} The lot found at the index position in database collection.
 */
PUBLIC.loadLotAt = function(index)
{
    return PRIVATE.msc.docAt(PROPERTIES.lotNumber.name, index);
};

/**
 * Method to retrieve the position of a lot identified by the lotNumber in the 
 * database. 
 * 
 * @param {String} lotNumber The lot number to search for in the database.
 * 
 * @returns {Number} The index of the lot in the database.
 */
PUBLIC.indexOfLot = function(lotNumber)
{
    // Get the lot index for the lotNumber 
    return PRIVATE.msc.indexOfDoc(PROPERTIES.lotNumber.name, lotNumber);
};

/* Method to create a string representation of a HopBale*/
function toString()
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
 




