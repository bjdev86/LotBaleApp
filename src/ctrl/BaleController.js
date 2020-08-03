/*
 * Date created: 6-12-2019
 * 
 * Interface to define the HopBaleController. The HopBaleController will be responsible for controlling the 
 * creation, reading/writting and deletion of HopBale data. Specifically this controller will be responsible for 
 * processing requests regarding HopBales from a view UI Handler. The controller will control the flow of 
 * the program as it relates to a single HopBale. Specifically, this controller will recieve HopBale data and
 * parse it, and prepare it to be utilized by the model (HopBale.js) that this controller is working with. The
 * controller will defer to the model to validate the data it recieves. This controller will also use the model's
 * store and fetch capabilities to store and fetch HopBale data to and from persistence.  The controller will 
 * direct the flow of control from view to view as the user interacts with the application. However, it will 
 * probably be that there will only be on view for editing a HopBale's data. 
 * 
 * The controller will take in a data string and attempt to preform
 * the action requested by a view. A coded string will be returned detailing if the operation was successful
 * and if the operation was not successful then the return string will contain and error code to tell the 
 * calling view what the errors were (most likely in the input data string). The coded string will be in the 
 * form of: DataCode=1{OR}0|DataCode=1{OR}0|....DataCode=1{OR}0|. Where the DataCode as 
 * definded in the model is one of the names of the data members (properties) of the model class and 
 * 1{OR}0 refers to a binary boolean true or false regarding weather the property was valid or not. 
 * 
 * The controller will only accept data strings formatted as follows: DataCode=value|DataCode=value|....
 * DataCode=value|. The DataCode will be one of those codes listed in DataCods.js file in the model 
 * folder, and the value will be the value obtained from the data source (form or other connected data 
 * source). 
 */

// Import Data codes and regex patterns so that they can be used in this controller
//import * as DataFilters from "../model/Hop Data Standards/DataPatterns.js";
//import * as DataNames from "../model/Hop Data Standards/DataCodes.js";
//import * as HopBale from "../model/HopBaleInterface.js";
import {PUBLIC as HopBale} from "../model/HopBale.js";
import {PUBLIC as Lot} from "../model/Lot.js";
import {MongoSocketClient} from "../model/MongoSocketClient.js";

/* Define some constants used as errorcode string delimiters*/
const ENTRY_DELIM = "|";  // Used between key value pairs entries
const KV_DELIM = "="; // Used beteween each key and each value.
const DATA_STRING_FILTER = /=|\|/; // Used to parse incoming data strings

// Constants used to add to the error code returned from this controller
const ID_MISMATCH = "idMismatch";
const ISSAVED = "isSaved";

/* Method immeadiatly invoked when this script is imported. This method will 
 * tell the HopBaleInterface to connect with the database. This is kinda like 
 * 'main' from your average Java program. */
(async function()
{
    // Create a database connection 
    let dbCon = new MongoSocketClient("guest");
    
    // Connect the database
    console.log("Hop Bale: " + await dbCon.connect()); 
    
    /* Pass the database client to the HopBale model so that it can connect to 
     * the db server */
    HopBale.setMDBC(dbCon); 
    Lot.setDBConnection(dbCon);
    
    // Initialize the application
    await init();
})();

/** 
 * Method to initialize this controller and the app in general.
 */
export async function init()
{
    // Set the bale lot number to load first 
    await HopBale.changeLots("OR00000000" /*HopBale.getTempLotID()*/);
    
    // Set all the lots in the lot selector
    await HopBale.populateLotNumberSelector();
}

/* Method to disconnect the HopBale interface from the database. Usually called
 * when the application is shutting down or there is an error. */
export async function disconnectDB ()
{
    await HopBale.disconnectDB();
}

/**
 * 
 * 
 */
export async function createNewBale()
{
    // Tell the Bale model to add a new bale to the lot's bale collection 
    let baleId = await HopBale.createBale();
    
    // Fetch the bale just created from persistence
    await HopBale.loadBale(baleId);    
};

export async function getBaleData(baleID)
{
    // Local Variable Delcaration 
    let baleData = "undefined"; 
    let loadedBale = null; 

    /* Fetch the bale object from persistence*/
    loadedBale = await HopBale.loadBale(baleID); 

    // See whether the bale fetched was null ie didn't exsist 
    if (loadedBale !== undefined)
    {
        // Create a data string containing the data values of the hop bale
        baleData = serializeBale(loadedBale);
    }

    return baleData;
}

/* Method to retrieve all the bales for a given lot number */
/* Method to remove the bale, currently referenced by this controller, from persistence. After the bale is
 * removed a new, default HopBale will be created and set as the bale referenced by this controller.
 * @TODO decide if this method should take in a new bale to set as the bale
 * being controlled by this controller. */
export async function removeBale(baleID)
{ 
    // Set the values of the editor with the values of the next bale
    await prevBale(baleID); 
  
    // Remove the bale, referenced by this controller, from persistence
    await HopBale.deleteBale(baleID);       
};

/**
 * @param {String} baleID 
 * @returns {undefined}
 */
export async function prevBale(baleID)
{
    // Local Variable Declaration 
    let i = 0; 
    
    // Get the current bale index
    i = await HopBale.getBaleIndex(baleID);
    
    // Get the previous bale 
    await HopBale.loadBaleAt(--i);
};

/**
 * @TODO
 *      1. Should the Lot model be interacted with here?
 *      
 * @param {String} baleID 
 * @returns {undefined}
 */
export async function nextBale(baleID)
{
     // Local Variable Declaration 
    let i = 0, baleCount; 
   
    // Get the current bale index
    i = await HopBale.getBaleIndex(baleID); 
    
    // Get the amount of bales in the current lot being looked at
    baleCount = await Lot.getbaleCount(HopBale.getThisLotNumber());
    
    /* Look at the index of the next bale. If the index is greater than the 
     * amount of bales in the lot then go back to the first bale. */
    i = (++i < baleCount) ? i : 0;
    
    // Load the next bale from persistence.
    await HopBale.loadBaleAt(i);
};

/* Method to display a hop bale in the view. The method calls on the model to 
 * reset all the properties in the database. Finally the values for each property
 * are set in the view through two-way binding.*/
//export async function displayBale(aBale)
//{
//    await HopBale.setAll(aBale);
//}

/* Method to encode a HopBale object in a string. The method seeks to take the fields and thier values
 * and make a string delimited for each field(key) and its value and then between each entry, that is a 
 * key/value pair. The delimiter between each key and value will be "=" by default. The delimiter 
 * between each entry will be "|". The final string will be formatted as follows 
 * key(dataCode)=value|key(dataCode)=value|....|key(dataCode)=value
 * */
function serializeBale(bale)
{
    // Local Variable Declaration 
    let encodedString = ""; 
    let keyDelim = "=", entryDelim = "|";
    let lastEDPos = -1; 

    /* Get the encoded string from the HopBale class using "=" to delimit a key from its associated value
     * and "|" delimiting key/value pairs */
    encodedString = HopBale.toCustomDelimString(bale, KV_DELIM, ENTRY_DELIM); 

    // Search for a trailing entry delimiter 
    lastEDPos = encodedString.lastIndexOf(ENTRY_DELIM); 

    // Remove any trailing entry deliminator 
    if (lastEDPos > -1)
    {
        encodedString = encodedString.slice(0, (lastEDPos-1));
    }

    return encodedString;
}


