/*
 * Date created: 6-12-2019
 * 
 * Class to created the HopBaleController. The HopBaleController will be responsible for controlling the 
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
import {PUBLIC as BaleLot} from "../model/Lot.js";
import {PUBLIC as HopBale} from "../model/HopBale.js";
import {MongoSocketClient} from "../model/MongoSocketClient.js";

/* Define some constants used as errorcode string delimiters*/
const ENTRY_DELIM = "|";  // Used between key value pairs entries
const KV_DELIM = "="; // Used beteween each key and each value.
const DATA_STRING_FILTER = /=|\|/; // Used to parse incoming data strings


/* Method immeadiatly invoked when this script is imported. This method will 
 * tell the HopBaleInterface to connect with the database. This is kinda like 
 * 'main' from your average Java program. */
(async function()
{
    // Create a database connection 
    let dbCon = new MongoSocketClient("guest");
    
    // Connect the database
    console.log("Bale Lot: " + await dbCon.connect()); 
    
    /* Pass the database client to the HopBale model so that it can connect to 
     * the db server */
    HopBale.setMDBC(dbCon); 
    BaleLot.setDBConnection(dbCon);
    
    // Initialze app
    await init();
})();

/** 
 * Method to initialize this controller and the app in general 
 *
 * @TODO
 *      1. Hum...when firstLot's lot number needs to be checked we reach inside
 *      this temp object to get the property, should the model be an object or
 *      and interface?
 */
export async function init()
{
    // Local Variable Declaration 
    let firstLot = {};
    
    // Get the first lot from persistence. Skip the 0th lot since its the temp lot 
    firstLot = await BaleLot.loadLotAt(1);
    
    // Check and see if it's the temp lot 
    if (firstLot !== {})
    {
        // Display the first lot. 
        await displayLot(firstLot);        
    }
    else
    {
        // Create a new lot 
        await createNewLot();
    }
}

/* Method to disconnect the HopBale interface from the database. Usually called
 * when the application is shutting down or there is an error. */
export async function disconnectDB ()
{
    await BaleLot.disconnectDB();
}

export async function prevLot(lotNumber)
{
    // Local Variable Declaration 
    let i, lotCount;
    let prevLot;
    
    // Fetch lot position 
    i = await BaleLot.indexOfLot(lotNumber);
 
    // Get the amount of lots in the colletion 
    lotCount = await BaleLot.getLotCount();
    
    /* Compare the index of the where the next lot should be to the amount of 
     * lots in persistence. If the previous lot's index is greater than or equal 
     * to 0 then start over with the lot at the last index in the collection, 
     * avoiding the lot at index 0 since that is the temporary lot. */
    i = --i > 0 ? i : (lotCount - 1);
    
    // Fetch the lot at the previous position 
    prevLot = await BaleLot.loadLotAt(i); 
    
    // Display lot at that position
    await displayLot(prevLot);
};

export async function nxtLot(lotNumber)
{
    // Local Variable Declaration 
    let i, lotCount;
    let nxtLot;
    
    // Fetch lot position 
    i = await BaleLot.indexOfLot(lotNumber);
    
    // Get the amout of lots in the collection 
    lotCount = await BaleLot.getLotCount(); 
    
    /* Compare the index of the where the next lot should be to the amount of 
     * lots in persistence. If the next lot's index is greater than or equal to
     * the amount of lots in the database then start over with the lot at index 
     * 1, avoiding the lot at index 0 since that is the temporary lot. */
    i = ++i < lotCount ? i :1; 
    
    // Fetch the lot at the next position 
    nxtLot = await BaleLot.loadLotAt(i); 
    
    // Display lot at that position
    await displayLot(nxtLot);
};

export async function displayLot(aLot)
{
    // Make sure the lot is not the temp lot 
    if (aLot.lotNumber !== BaleLot.TMP_LOT_NUM)
    {
        // Reset the lot properties, which will update the view
        BaleLot.displayLot(aLot);
    }
}

export async function createNewLot()
{
    // Create a new lot storing it's lotNumber
    let newLotNum = await BaleLot.createLot();
    
    // Fetch the new lot
    let newLot = await BaleLot.loadLot(newLotNum);
    
    // Display the new lot
    await displayLot(newLot);
}

export async function removeLot(lotNumber) 
{
    // Display the previous lot
    await prevLot(lotNumber);
    
    // Delete the lot at the lotNumber
    await BaleLot.deleteLot(lotNumber);
}

export async function editBale(baleID)
{
    
}

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
    encodedString = BaleLot.toCustomDelimString(bale, KV_DELIM, ENTRY_DELIM); 

    // Search for a trailing entry delimiter 
    lastEDPos = encodedString.lastIndexOf(ENTRY_DELIM); 

    // Remove any trailing entry deliminator 
    if (lastEDPos > -1)
    {
        encodedString = encodedString.slice(0, (lastEDPos-1));
    }

    return encodedString;
}


