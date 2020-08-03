/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 * 
 *  Date Created: 10/17/2019
 *  Version: 1.0
 *  
 */

// Name Spaces for Public and Private Properties
export const PUBLIC = {}; 

/* Private Namespace to reference properties that will not be accessible out side
 * of this script */
const PRIVATE = {};

// Define Private Properties used in this module
PRIVATE.socket; 
PRIVATE.isConnected = false; 
PRIVATE.usrName; 

PUBLIC.connect = function(usrName)
{
    return new Promise(function (resolve, reject)
    {
        try
        {
            // Set the user name of the client using this connection
            PRIVATE.usrName = usrName;
            
            /* Initiate the web socket connection based on the parameters  
             * passed in the constructor */
            PRIVATE.socket = new WebSocket("ws://localhost:3003/" + 
                            PRIVATE.usrName);

            // Wait for the connection to be opened
            PRIVATE.socket.onopen = function (event)
            {
                // Set boolean flag
                PRIVATE.isConnected = true;

                // Once the connection is open the promise is resloved.
                resolve("Connection Established");
            };
        }
        catch (error)
        {   
            // Catch any errors that might result from opening the websocket
            reject (error.message);
        }
    }/*.bind(this)*/); // Bind the context of this execution function to this MongoSocketClientClass
};

PUBLIC.disconnect = function()
{
    return new Promise ((resolve, reject)=>
    {
        // Local Variable Declaration 
        let closeFrame = new Int8Array(8);
        try
        {
            // Tell the server client wants to close 
            //this.__socket.send()
            // Close the socket 
            PRIVATE.socket.close(1000,  "All Done");

            // Wait for the close event to be acknoweldged by the socket API
            PRIVATE.socket.onclose = function (event)
            {
                // Set boolean flag
                PRIVATE.isConnected = false; 

                // Once the connection has been disconnected this promise has been resloved
                resolve ("Connection Severed \n\tcode: " + event.code + 
                         " reason: " + event.reason + " was clean: " + 
                         event.wasClean);
            };
        }
        catch (error)
        {
            /* Catch any errors incured while shutting the connection down 
             * and reject the promise */
            reject (error.message);
        }
    }); 
};

PUBLIC.sendDBRequest = function(query)
{
    return new Promise (function (resolve, reject) 
    {
        try 
        {
            // Set the callback return function for the server response 
            PRIVATE.socket.onmessage = (messageEvent) =>
            {
                // Check for an error code
                resolve (messageEvent.data);
            };

            // Make the server request 
            PRIVATE.socket.send(query);
        }
        catch (error)
        {
            /* Reject this promise, because there was an error in the 
             * asyncronous execution thread.*/
            reject(error.message);
        }
    }/*.bind(this)*/);        
};
    
PUBLIC.createRecords = async function(...nwRcds)
{
    // Local Variable Declaration 
    let querryString = ""; 
    let response = "";

    // Create the query string  from the the data passed
    querryString = PRIVATE.usrName + "|" + "crt_rcd|" + "{\"nwdt\": "+
                                     JSON.stringify(nwRcds) +"}";

    try
    {
       /* Send the request off to the database server and get the response when 
        * its ready */
        response = await PUBLIC.sendDBRequest(querryString); 
    }
    catch (error)
    {
        // If any error occur throw them to the application layer
        throw error; 
    }

    return response;
};

/**
* TODO:
* 1. Decide how this mthod should return when there is just one record found
*    by the query. ie [].length = 1
*    
* 2. Decide what to return when the query finds no records. ie [].length = 0.
* 
* @param {String} id 
* @param {String} value
* @returns {MongoSocketClient.updateRecord@call;sendDBRequest|String} 
*/
PUBLIC.getRecord = async function(id, value)
{
   // Local Variable Declaration 
   let querryString = "";
   let response = ""; 

   // Create the query string  from the the data passed
   querryString = this.__usrName + "|get_rcd|" + "{\"qry\": "+
                                "{\"" + id + "\": \"" + value + "\"}}";

   try 
   { 
       /* Send the request off to the database server and get the response when 
        * its ready */
        response = await this.sendDBRequest(querryString); 
   }
   catch (error)
   {
       // If any error occur throw them to the application layer
       throw error; 
   }

   return response;
};

/**
* 
* @param {type} id
* @param {type} iVal
* @param {type} fld
* @param {type} fVal
* 
* @returns {MongoSocketClient.updateRecord@call;sendDBRequest|String}
*/
PUBLIC.updateRecord = async function (id, iVal, fld, fVal)
{
   // Local Variable Declaration 
   let querryString = "";
   let response = ""; 

   // Create the query string  from the the data passed
   querryString = this.__usrName + "|chng_rcd|" + "{\"qry\": "+
                                "{\"" + id + "\": \"" + iVal + "\"}, " +
                                "\"nwdt\": {\"" + fld + "\": \"" + fVal + 
                                "\"}}";

   try 
   { 
       /* Send the request off to the database server and get the response when 
        * its ready */
        response = await this.sendDBRequest(querryString); 
   }
   catch (error)
   {
       // If any error occur throw them to the application layer
       throw error; 
   }

   return response;
};

/**
* 
* @param {type} id
* @param {type} iVal
* @throws {Error} 
* @returns {MongoSocketClient.deleteRecord@call;sendDBRequest|String}
*/
 PUBLIC.deleteRecord = async function(id, iVal)
{
   // Local Variable Declaration 
   let querryString = "";
   let response = ""; 

   // Create the query string  from the the data passed
   querryString = this.__usrName + "|dlt_rcd|" + "{\"qry\": "+
                                "{\"" + id + "\": \"" + iVal + "\"}}";

   try 
   { 
       /* Send the request off to the database server and get the response when 
        * its ready */
        response = await this.sendDBRequest(querryString); 
   }
   catch (error)
   {
       // If any error occur throw them to the application layer
       throw error; 
   }

   return response;
};

/**
* 
* @param {type} rcdKey
* @param {type} rcdKeyVal
* @param {type} array
* @param {type} earpKey
* @param {type} earpKeyVal
* @param {type} earp
* 
* @returns {MongoSocketClient.getEARP@call;sendDBRequest|String}
*/
PUBLIC.getEARP = async function(rcdKey, rcdKeyVal, array, earpKey, earpKeyVal, earp)
{
    // Local Variable Declaration 
   let querryString = "";
   let response = ""; 

  // Create the query string  from the the data passed
   querryString = this.__usrName + "|do_agg|" + JSON.stringify
   (
       {
           pipeLine: [{$match: {[rcdKey]: rcdKeyVal}}, 
                      {$unwind: {path: "$" + array}}, 
                      {$match: {[array + "." + earpKey]: earpKeyVal}}, 
                      {$project : {[array + "." + earp]: 1, _id: 0} }]
       }
   );
   console.log("queryString: " + querryString);
   try 
   { 
       /* Send the request off to the database server and get the response when 
        * its ready */
        response = await this.sendDBRequest(querryString); 

        // Retrieve the value inside nested objects
        response = JSON.parse(response)[0][array][earp];
   }
   catch (error)
   {
       // If any error occur throw them to the application layer
       throw error; 
   }

   return response;
};

/**
* 
* @param {type} outterID
* @param {type} outterVal
* @param {type} earKeyID
* @param {type} earKeyVal
* @param {type} array
* @param {type} earpID
* @param {type} earpVal
* 
* @returns {String|MongoSocketClient.setEARP@call;sendDBRequest}
*/
PUBLIC.setEARP = async function(outterID, outterVal, earKeyID, earKeyVal, array, earpID, earpVal)
{
    // Local Variable Declaration 
   let querryString = "";
   let response = ""; 

  // Create the query string  from the the data passed
   querryString = this.__usrName + "|chng_rcd|" + JSON.stringify
   (
       {
           qry: {[outterID]: outterVal, [array + "." + earKeyID]: earKeyVal},
           update: {$set: {[array + ".$." + earpID]: earpVal}}
       }
   );
   console.log("queryString: " + querryString);
   try 
   { 
       /* Send the request off to the database server and get the response when 
        * its ready */
        response = await this.sendDBRequest(querryString); 
   }
   catch (error)
   {
       // If any error occur throw them to the application layer
       throw error; 
   }

   return response;
};

PUBLIC.deleteEARP = async function(outterID, outterVal, innerID, innerVal, array, newID, newVal = "")
{
   // Local Variable Declaration 
   let querryString = "";
   let response = ""; 

   // Create the query string  from the the data passed
   querryString = this.__usrName + "|chng_rcd|" + JSON.stringify
   (
       {
            qry: {[outterID]: outterVal, [array + "." + innerID]: innerVal},
           update: {$unset: {[array + ".$." + newID]: newVal}}
       }
   );

   try 
   { 
       /* Send the request off to the database server and get the response when 
        * its ready */
        response = await this.sendDBRequest(querryString); 
   }
   catch (error)
   {
       // If any error occur throw them to the application layer
       throw error; 
   }

   return response;
};

PUBLIC.createEAR = async function(outterID, outterVal, array, ...newData)
{
   // Local Variable Declaration 
   let querryString = "";
   let response = ""; 

   // Create the query string  from the the data passed
   querryString = this.__usrName + "|chng_rcd|" + JSON.stringify(
       {
          qry: {[outterID]: outterVal}, 
          update: {$push: {[array]: {$each: newData}}}
       });  
           console.log("querryString: " + querryString);
   try 
   { 
       /* Send the request off to the database server and get the response when 
        * its ready */
        response = await this.sendDBRequest(querryString); 
   }
   catch (error)
   {
       // If any error occur throw them to the application layer
       throw error; 
   }

   return response;
};

/**
* TODO: 
*      1. get rid of the Object_id in the response 
* @param {type} rcdID
* @param {type} rcdVal
* @param {type} earID
* @param {type} earVal
* @param {type} array
* 
* @returns {MongoSocketClient.getEAR@call;sendDBRequest|String}
*/
PUBLIC.getEAR = async function(rcdID, rcdVal, earID, earVal, array)
{
   // Local Variable Declaration 
   let querryString = "";
   let response = ""; 

   // Create the query string  from the the data passed
   querryString = this.__usrName + "|get_rcd|" + JSON.stringify
   (
           {
               qry: {[rcdID]: rcdVal, [array + "." + earID]: earVal},
               proj: {[array + ".$"]: 1}
           }
   );
   console.log("querryString: " + querryString);
   try 
   { 
       /* Send the request off to the database server and get the response when 
        * its ready */
        response = await this.sendDBRequest(querryString); 
   }
   catch (error)
   {
       // If any error occur throw them to the application layer
       throw error; 
   }

   return response;
};

PUBLIC.deleteEAR = async function(outterID, outterVal, array, earID, earVal)
{
   // Local Variable Declaration 
   let querryString = "";
   let response = ""; 

   // Create the query string  from the the data passed
   querryString = this.__usrName + "|chng_rcd|" + JSON.stringify(
       {
          qry: {[outterID]: outterVal}, 
          update: {$pull: {[array]: {[earID]: earVal}}}
       });  
           console.log("querryString: " + querryString);
   try 
   { 
       /* Send the request off to the database server and get the response when 
        * its ready */
        response = await this.sendDBRequest(querryString); 
   }
   catch (error)
   {
       // If any error occur throw them to the application layer
       throw error; 
   }

   return response;
};   

/**
* 
* @param {type} outterID
* @param {type} outterVal
* @param {type} array
* @returns {MongoSocketClient.getEALength@call;sendDBRequest|String}
*/
PUBLIC.getEALength = async function(outterID, outterVal, array)
{
   // Local Variable Declaration 
   let querryString = "";
   let response = ""; 
   let LPN = "count"; 

   // Create the query string  from the the data passed
   querryString = this.__usrName + "|do_agg|" + JSON.stringify(
       {
          pipeLine: [{$match: {[outterID]: outterVal}}, 
                     {$project: {[LPN]: 
                     {$size: "$" + array }, _id: 0}}]
       });  
           console.log("querryString: " + querryString);
   try 
   { 
       /* Send the request off to the database server and get the response when 
        * its ready */
        response = await this.sendDBRequest(querryString); 

        // Shuk shells surrounding the length number
        response = (JSON.parse(response)[0])[LPN]; 
   }
   catch (error)
   {
       // If any error occur throw them to the application layer
       throw error; 
   }

   return response;
};
