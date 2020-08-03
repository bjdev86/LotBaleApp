/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 * 
 * Date Created: 9/5/2019
 * Version 1.0
 * 
 * TODO: 
 * 
 * 1. Handle close events and frames that come from the server.
 * 
 * 2. Look into setting up a sub protocol 
 * 
 * 3. Look at making a method that can get a single property from a document
 *    (object) in the database.
 *    
 * 4. Make the constructor take in the server name and port so that a URL can be
 *    created at connection time.
 *    
 * 5. Should the updateRecord method be made to handle updateEAR/EARP scenario.
 *    IE the mehtod would take in an object for the querry and an object for the
 *    update action.
 */


class MongoSocketClient
{
    /* Method to instansiate a MongoSocketClient object and do some preconfiguring*/
    constructor (usrName, /*server, port*/)
    {
        /* Create the websocket that data will be sent over for this client 
         * connect it to the MongoTCPServer */
        this.__socket;
        
        // Array to hold command strings to be executed
        //this.__commands = [];
        
        // Socket property
        this.__isConnected = false;
        
        // Set the user name 
        this.__usrName = usrName;

        // Set the user name 
        //this.__serverName = server;
        
        // Set the port for the connection 
        //this.__port = port;
    }
    
    connect()
    {
        return new Promise(function (resolve, reject)
        {
            try
            {
                /* Initiate the web socket connection based on the parameters  
                 * passed in the constructor. OG address: ws://localhost:3003/*/
                this.__socket = new WebSocket("ws://digitalagconsultants.com/hbtserver" /*+ 
                                this.__usrName*/);

                // Wait for the connection to be opened
                this.__socket.onopen = function (event)
                {
                    // Set boolean flag
                    this.__isConnected = true;

                    // Once the connection is open the promise is resloved.
                    resolve("Connection Established");
                };
            }
            catch (error)
            {   
                // Catch any errors that might result from opening the websocket
                reject (error.message);
            }
        }.bind(this)); // Bind the context of this execution function to this MongoSocketClientClass
    }
    
    disconnect()
    {
        return new Promise ((resolve, reject) =>
        {
            // Local Variable Declaration 
            let closeFrame = new Int8Array(8);
            try
            {
                // Tell the server client wants to close 
                //this.__socket.send()
                // Close the socket 
                this.__socket.close(1000,  "All Done");

                // Wait for the close event to be acknoweldged by the socket API
                this.__socket.onclose = function (event)
                {
                    // Set boolean flag
                    this.__isConnected = false; 

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
    }
    
    sendDBRequest(query)
    {
        return new Promise (function (resolve, reject) 
        {
            try 
            {
                // Set the callback return function for the server response 
                this.__socket.onmessage = (messageEvent) =>
                {
                    // Check for an error code
                    resolve(messageEvent.data);
                };

                // Make the server request 
                this.__socket.send(query);
            }
            catch (error)
            {
                /* Reject this promise, because there was an error in the 
                 * asyncronous execution thread.*/
                reject(error.message);
            }
        }.bind(this));        
    }
    
    async createRecords (...nwRcds)
    {
        // Local Variable Declaration 
        let querryString = ""; 
        let response = "";
        
        // Create the query string  from the the data passed
        querryString = this.__usrName + "|" + "crt_rcd|" + "{\"nwdt\": "+
                                         JSON.stringify(nwRcds) +"}";
         
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
    }
    
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
    async getRecord (id, value)
    {
        // Local Variable Declaration 
        let querryString = "";
        let response = ""; 

        // Create the query string  from the the data passed
        querryString = this.__usrName + "|get_rcd|" + JSON.stringify
        (
                {
                    qry: {[id]: value},
                    proj: {_id: 0}
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
    }
    
    /**
     * 
     * @param {type} id
     * @param {type} iVal
     * @param {type} fld
     * @param {type} fVal
     * 
     * @returns {MongoSocketClient.updateRecord@call;sendDBRequest|String}
     */
    async updateRecord (id, iVal, fld, fVal)
    {
        // Local Variable Declaration 
        let querryString = "";
        let response = ""; 

        // Create the query string  from the the data passed
        querryString = this.__usrName + "|chng_rcd|" + JSON.stringify
        (
                {
                    qry: {[id]: iVal},
                    update: {$set: {[fld]: fVal}}
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
    }
    
    /**
     * 
     * @param {type} id
     * @param {type} iVal
     * @throws {Error} 
     * @returns {MongoSocketClient.deleteRecord@call;sendDBRequest|String}
     */
    async deleteRecord (id, iVal)
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
    }
    
    /**
    * Note: the key will be compared based on an English locale. 
    * 
    * @TODO
    *       1. Create an options obj property that will allow for options such
    *          as sorting to take place on the database server. 
    *          
    * @param {String} key The name of the property id to sort on 
    * @param {Boolean} sort Flag to indicate whether sort is desired or not.
    * 
    * @returns {Array} All the records from the the database.
    */
    async getAllDocs(key, sort)
    {
        // Local Variable Declaration 
        let querryString = "";
        let response = ""; 
        let allRecords = []; 
        
        // Create the query string that will get all the documents in the collection
        querryString = this.__usrName + "|get_rcd|" + JSON.stringify
        (
            {
                qry: {},
                proj: {_id: 0}
            }
        );
  
        try 
        { 
            /* Send the request off to the database server and get the response when 
             * its ready */
             response = await this.sendDBRequest(querryString); 
             
             // Parse the array from the string
             allRecords = JSON.parse(response);            
             
             // Sort the records if that's what was desired
             if (sort)
             {
                 // Sort on the key passed as a string
                 allRecords.sort( function(a, b)
                 {
                     return a[key].toString().localeCompare(b[key].toString(),"en", 
                                                           {numeric: true});
                 });
             }
        }
        catch (error)
        {
            // If any error occur throw them to the application layer
            throw error; 
        }
        
        return allRecords;
    }
    
    /**
     * 
     * @returns {Number} The count of the amount of documents in the collection.
     */
    async docsCount()
    {
         // Local Variable Declaration 
        let querryString = "", response = "", CPN = "count"; 
        let result = 0;
                
        // Create the query string that will get all the documents in the collection
        querryString = this.__usrName + "|do_agg|" + JSON.stringify
        (
            {
                pipeLine: 
                [
                    {$count: CPN}
                ]
            }
        );
  
        try 
        { 
            /* Send the request off to the database server and get the response when 
             * its ready */
             response = await this.sendDBRequest(querryString); 
             
             // Parse the array from the string
             result = JSON.parse(response)[0][CPN];             

        }
        catch (error)
        {
            // If any error occur throw them to the application layer
            throw error; 
        }
        
        return result;
    }
    
    /**
     * 
     * @param {String} propName The name of the property who's max value
     *                        will be sought in the database
     * @returns {Number|String|Object} The value of the biggest value in the db.
     *                                 null will be returned if the property 
     *                                 name is not found in the database.
     */
    async maxPropValue(propName)
    {
        // Local Variable Declaration 
        let querryString = "", response = "", gtv = "";
        let mpn = "largest"; 
        let result = {}; 
        
        // Create the query string  from the the data passed
        querryString = this.__usrName + "|do_agg|" + JSON.stringify
        (
            {
                pipeLine: 
                [
                    {$group: {_id: null, [mpn]: {$max: "$" + propName}}},
                    {$project: {_id: 0}}
                ]
            }
        );

        try 
        { 
            /* Send the request off to the database server and get the response when 
             * its ready */
             response = await this.sendDBRequest(querryString); 
             
             // Pare the response to an object
             result = JSON.parse(response);
             
             // Get the max value for the property
             gtv = result[0][mpn];
        }
        catch (error)
        {
            // If any error occur throw them to the application layer
            throw error; 
        }
        
        return gtv;
    };
    
    /**
     * 
     * @param {String} keyName The name of the property to search on 
     * @param {Number|String} keyVal The index of the element in the database 
     *                        collection. Needs to reslove to an integer.
     * 
     * @returns {Object} the MongoDB Document (JS Object) at the given position. 
     */
    async docAt(keyName, keyVal)
    {
        // Local Variable Declaration 
        let querryString = "", response = "";
        let result = {}, theLot = {}; 
        let LPN = "aLot"; // Index Property Name
        
        // Create the querry string from the data passed
        querryString = this.__usrName + "|do_agg|" + JSON.stringify
        (
            {
                pipeLine: 
                [
                    {$sort: {[keyName]: 1}}, 
                    {$group: {_id: null, allLots: {$push: "$$ROOT"}}}, 
                    {$project: {[LPN]: {$arrayElemAt: ["$allLots", keyVal]}, 
                                _id: 0}},
                    {$project: {[LPN + "._id"]: 0}}
                ]
            }
        );
        try 
        {
            /* Send the request off to the database server and get the response when 
             * its ready */
             response = await this.sendDBRequest(querryString); 
             
             // Pare the response to an object
             result = JSON.parse(response);
             
             // Get the lot from the array returned from the server 
             theLot = result[0][LPN];
        }
        catch(error)
        {
            // If any error occurs throw it up to the application layer
            throw error;
        }
        
        return theLot;
    }
    
    /**
     * 
     * @param {String} indxName The name of the property key on which to search 
     * @param {String} indxVal The index value where the Document is located in
     *                 the collection
     * 
     * @returns {Number} The index of a Document based on the index passed and 
     *                   the name of the index for documents in the collection.
     */
    async indexOfDoc(indxName, indxVal)
    {
        // Local Variable Declaration 
        let querryString = "", response = "", IPN = "i"; // Index Property Name
        let result = {};
        let theIndex = 0; 
               
        // Create the querry string from the data passed
        querryString = this.__usrName + "|do_agg|" + JSON.stringify
        (
            {
                pipeLine: 
                [
                    {$sort: {[indxName]: 1}}, 
                    {$group: {_id: null, allLots: {$push: "$" + indxName}}}, 
                    {$project: {[IPN]: {$indexOfArray: ["$allLots", indxVal]}, 
                                _id: 0}}
                ]
            }
        );

        try 
        {
            /* Send the request off to the database server and get the response when 
             * its ready */
             response = await this.sendDBRequest(querryString); 
             
             // Pare the response to an object
             result = JSON.parse(response);
             
             // Get the lot from the array returned from the server 
             theIndex = result[0][IPN];
        }
        catch(error)
        {
            // If any error occurs throw it up to the application layer
            throw error;
        }
        
        return theIndex;
    }
    
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
    async getEARP (rcdKey, rcdKeyVal, array, earpKey, earpKeyVal, earp)
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
    }
    
    /**
     * Also creates.
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
    async setEARP(outterID, outterVal, earKeyID, earKeyVal, array, earpID, earpVal)
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
    }
    
    async deleteEARP(outterID, outterVal, innerID, innerVal, array, newID, newVal = "")
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
    }
    
    /**
     * Gets the maximum EARP value in a given document.
     * 
     * @TODO: 
     *      1. What about when there are no EARS in the collection?
     *      
     * @param {type} docKeyID
     * @param {type} docKeyVal
     * @param {type} earID
     * @param {type} earpID
     * @returns {unresolved}
     */
    async maxEARP (docKeyID, docKeyVal, earID, earpID)
    {
         // Local Variable Declaration 
        let querryString = "", response = "", mpn = "max"; // Max Property Name 
        let result = {};
        
        // Create the query string  from the the data passed
        querryString = this.__usrName + "|do_agg|" + JSON.stringify
        (
            {
                pipeLine: 
                [
                    {$match: {[docKeyID]: docKeyVal}},
                    {$unwind: "$" + earID},
                    {$group: {_id: null, [mpn]: {$max: "$" + earID + "." + 
                              earpID}}},
                    {$project: {_id: 0}}
                ]
            }
        );

        try 
        { 
            /* Send the request off to the database server and get the response when 
             * its ready */
             response = await this.sendDBRequest(querryString); 
             
             // Extract array cursor from response
             result = JSON.parse(response);
             
             // Test its length to make sure there's something inside             
             result = result.length > 0 ? result[0][mpn] : -1;
                 
             // Extract the result from the reponse JSON string from server
             //result = JSON.parse(response)[0][mpn];
        }
        catch (error)
        {
            // If any error occur throw them to the application layer
            throw error; 
        }
        
        return result;
    }
    
    async createEAR (outterID, outterVal, array, ...newData)
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
    }
    
    /**
     * TODO: 
     *      1. Should this be done with an aggregation instead?
     * @param {type} rcdID
     * @param {type} rcdVal
     * @param {type} earID
     * @param {type} earVal
     * @param {type} array
     * 
     * @returns {MongoSocketClient.getEAR@call;sendDBRequest|String}
     */
    async getEAR(rcdID, rcdVal, earID, earVal, array)
    {
        // Local Variable Declaration 
        let querryString = "";
        let response = ""; 

        // Create the query string  from the the data passed
        querryString = this.__usrName + "|get_rcd|" + JSON.stringify
        (
                {
                    qry: {[rcdID]: rcdVal, [array + "." + earID]: earVal},
                    proj:{[array + ".$"]: 1, _id: 0}
                }
        );
        console.log("querryString: " + querryString);
        try 
        { 
            /* Send the request off to the database server and get the response when 
             * its ready */
             response = await this.sendDBRequest(querryString); 
             
             // Pare out the bale as a pure object
        }
        catch (error)
        {
            // If any error occur throw them to the application layer
            throw error; 
        }
        
        return response;
    }
    
    /**
     * Method to get all the entire arry of EARS (Embedded Array Records) from a 
     * Document
     * 
     * @TODO: 
     *      1. Should this be done with an aggregation instead?
     * @param {type} rcdID
     * @param {type} rcdVal
     * @param {type} array
     * 
     * @returns {MongoSocketClient.getEAR@call;sendDBRequest|String}
     */
    async getEARS(rcdID, rcdVal, array)
    {
        // Local Variable Declaration 
        let querryString = "";
        let response = ""; 
        let result = {};
        
        // Create the query string  from the the data passed
        querryString = this.__usrName + "|get_rcd|" + JSON.stringify
        (
                {
                    qry: {[rcdID]: rcdVal},
                    proj:{[array]: 1, _id: 0}
                }
        );
        console.log("querryString: " + querryString);
        try 
        { 
            /* Send the request off to the database server and get the response when 
             * its ready */
             response = await this.sendDBRequest(querryString); 
             console.log("getEARS response: " + response);
             // Pare out the bale as a pure object
             result = JSON.parse(response)[0][array];
        }
        catch (error)
        {
            // If any error occur throw them to the application layer
            throw error; 
        }
        
        return result;
    }
    
    async deleteEAR (outterID, outterVal, earID, earVal, array)
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
    }   
    
    /**
     * Sorts EARS in ascending order.
     * 
     * @param {type} docID
     * @param {type} docVal
     * @param {type} sortKeyID
     * @returns {MongoSocketClient.sortEARS@call;sendDBRequest|String}
     */
    async sortEARS(docID, docVal, array, sortKeyID)
    {
        // Local Variable Declaration 
        let querryString = "";
        let response = ""; 

        // Create the query string  from the the data passed
        querryString = this.__usrName + "|chng_rcd|" + JSON.stringify(
            {
               qry: {[docID]: docVal}, 
               update: {$push: {[array]: {$each: [], $sort: {[sortKeyID]: 1}}}}
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
    }
    
    /**
     * 
     * @param {type} outterID
     * @param {type} outterVal
     * @param {type} array
     * @returns {MongoSocketClient.getEALength@call;sendDBRequest|String}
     */
    async getEALength(outterID, outterVal, array)
    {
        // Local Variable Declaration 
        let querryString = "";
        let response = ""; 
        let LPN = "count"; // Length Property Name
        
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
    }
    /**
     * @TODO:
     *       1. What if there are more than one indicies ie because there's more
     *          than one bales in the array with the given bale index.
     *          
     *       2. What if there is no index, becaue there is no record in the 
     *          db that matches the record value passed.
     *          
     * @param {type} rcdKeyID
     * @param {type} rcdKeyVal
     * @param {type} earKeyID
     * @param {type} earKeyVal
     * @param {type} array
     * @returns {MongoSocketClient.getEARPosition@call;sendDBRequest|String}
     */
    async getEARPosition(rcdKeyID, rcdKeyVal, earKeyID, earKeyVal, array)
    {
         // Local Variable Declaration 
        let querryString = "", srvRsp = "", IPN = "index"; // Index Property Name
        let i = -1;
        
        // Create the query string  from the the data passed
        querryString = this.__usrName + "|do_agg|" + JSON.stringify(
            {
               pipeLine: [{$match: {[rcdKeyID]: rcdKeyVal}}, 
                          {$unwind: {["path"]: "$" + array, 
                                     ["includeArrayIndex"]: IPN}},
                          {$match: {[array + "." + earKeyID]: earKeyVal}},
                          {$project: {[IPN]: 1, _id: 0}}]
            });  
        try 
        { 
            /* Send the request off to the database server and get the response when 
             * its ready */
             srvRsp = await this.sendDBRequest(querryString); 
             
             // Parse the response object 
             srvRsp = (JSON.parse(srvRsp));
             
             // Unwrap array cursor from database
             srvRsp = srvRsp[0];
             
             /* Check to make sure the IPN exsisted in the return string. Assign 
              * the index to -1 if not. */
             i = srvRsp ? srvRsp[IPN] : -1;
        }
        catch (error)
        {
            // If any error occur throw them to the application layer
            throw error; 
        }
        
        return i;
    }
    /**
     * @TODO 
     *      1. Change name to EAEAt Embedded Array Element At 
     *      
     * @param {type} rcdKeyID
     * @param {type} rcdKeyVal
     * @param {type} earKeyID
     * @param {type} earKeyPos
     * @param {type} array
     * @returns {String|MongoSocketClient.getEARAt@call;sendDBRequest}
     */
    async getEARAt(rcdKeyID, rcdKeyVal, earKeyID, earKeyPos, array)
    {
         // Local Variable Declaration 
        let querryString = "";
        let response = ""; 
        let BPN = "bale"; // Bale Property Name
        
        // Create the query string  from the the data passed
        querryString = this.__usrName + "|do_agg|" + JSON.stringify(
            { 
               pipeLine: [{$match: {[rcdKeyID]: rcdKeyVal}}, 
                          {$project: {[BPN]: 
                          {$arrayElemAt: ["$" + array, earKeyPos]},
                                            _id: 0}}]
            });  
                console.log("querryString: " + querryString);
        try 
        { 
            /* Send the request off to the database server and get the response when 
             * its ready */
             response = await this.sendDBRequest(querryString); 
             console.log("response: " + response);
             // Extract the bale out of the array sent back from the server
             response = (JSON.parse(response))[0][BPN]; 
             console.log("bale is: " + JSON.stringify(response));  
        }
        catch (error)
        {
            // If any error occur throw them to the application layer
            throw error; 
        }
        
        return response;
    }
};

export {MongoSocketClient};