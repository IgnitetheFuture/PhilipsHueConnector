/**
* Philips hue Javascript SDK (Native JS OOP)
* @author Victor Angelier <victor.angelier@philips.com>
* @returns {Philips}
* @todo Extend with other part of existing library
*/
var PhilipsConnector = function(){
    this.options = {
        connected:false,
        max_retries:10,
        connect_retries:0,
        bridge_username:null,
        bridge_ipaddress:null,
        request_protocol:"http",
        connectIntervalId: null
    };
    this.bridge = null;
};
/**
 * Create a random string (for bridge usernames etc)
 * @returns {String}
 */
PhilipsConnector.prototype.randString = function(){  
    length = 10;
    var chars = "abcdefghijklmnopqrstuvwABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return "huelabs-" + result;
};
/**
 * Returns the currect bridge
 * @returns {PhilipsConnector.bridge}
 */
PhilipsConnector.prototype.getBridge = function(){
    return this.bridge;
};
/**
 * Returns the currect bridge username
 * @returns {string}
 */
PhilipsConnector.prototype.getBridgeUsername = function(){
    return this.options.bridge_username;
};
/**
 * Returns the currect bridge ipaddress
 * @returns {string}
 */
PhilipsConnector.prototype.getBridgeIP = function(){
    return this.options.bridge_ipaddress;
};
/**
* Setup a connection to the Philips Hue bridge
* @param {object} options {
*      success: function,
*      fail: function,
*      attempt function
* }
* @returns {Boolean}
*/
PhilipsConnector.prototype.connect = function(options){
    $.extend(this.options, options);
    var self = this;
    
    //If both username and bridge IP are empty (Probably returning visitor or new user)
    if(options.bridge_ipaddress === null && options.bridge_username === null){
        var ls = window.localStorage.getItem('knownBridges');
        if(ls !== null){
            bridge = JSON.parse(ls);
            if(bridge !== null){
                options.bridge_ipaddress = bridge.bridge_ipaddress;
                options.bridge_username = bridge.username;    
                $.extend(this.options, options); //Update global configation also
            }
        }
    }
    //If username is empty and bridge ip address is known (probably new user)
    if(options.bridge_username === null && options.bridge_ipaddress !== null){
        options.bridge_username = this.randString();
        $.extend(this.options, options); //Update global configation also
    }
    //Check and connect to the bridge
    if(options.bridge_ipaddress !== null && options.bridge_username !== null){
        //Validate if current does not exists/authorized
        $.getJSON(this.options.request_protocol + "://" + options.bridge_ipaddress + "/api/" + options.bridge_username, 
            function(res){                

                //Check if user is already authorized
                if(typeof(res.length) === "undefined" || typeof(res[0].error) !== "object"){
                    
                    //Clear interval
                    clearInterval(self.options.connectIntervalId);
                    
                    //We are connected
                    options.connected = true; 
                    
                    //Set bridge config
                    self.bridge = res;
                    PhilipsConnector.bridge = self.bridge;
                    
                    //Store info in localstorage
                    var ls = {
                        username: options.bridge_username,
                        bridge_ipaddress: options.bridge_ipaddress
                    };
                    window.localStorage.setItem('knownBridges', JSON.stringify(ls));

                    if(typeof(options.success) == "function"){
                        options.success(res);
                    }
                    
                }else{
                    
                    if(typeof(res[0].error) === "object" && res[0].error.description.indexOf('unauthorized') >= 0){
                        //We are not authorized. Let get authorized
                        self.options.connectIntervalId = setInterval(self._connectAttempt, 3000, self.options);
                    }else{
                        if(typeof(options.fail) == "function"){
                            options.fail(res);
                        }
                    }
                    
                }
            },
            function(res){               
                clearInterval(self.options.connectIntervalId);
                if(typeof(options.fail) === "function"){
                    options.fail("Existing user validation request failed.");
                }
            }
        );
    }else{
        if(typeof(options.fail) === "function"){
            options.fail("Bridge username or IP address not found.");
            return false;
        }
    }
};
/**
* Connect attemp
* @param {object} options
* @returns {Boolean}
*/
PhilipsConnector.prototype._connectAttempt = function(options){
   $.extend(this.options, options);
   
   var self = this;

   //Check max retries   
   if(options.connect_retries === options.max_retries){
       clearInterval(options.connectIntervalId);
       if(typeof(options.fail) === "function"){
           options.fail("Maximum retries");
       }
       return false;
   }

   //Attempt to connect
   $.ajax({
       method:"POST",
       url: options.request_protocol + "://" + options.bridge_ipaddress + "/api",
       contentType:"text/plain; charset=UTF-8",
       data: JSON.stringify({
           devicetype: "huelabs-user",
           username: options.bridge_username
       }),
       dataType:"json",
       processData: false,
       crossDomain: true
   })
   .done(function(res){
       //Response validation
       if(typeof(res[0].error) === "object"){
       }else if(typeof(res[0].success) === "object" && typeof(res[0].success.username) !== "undefined"){
           
            clearInterval(options.connectIntervalId);
           
            //Set connected
            options.connected = true;
           
            //Store in localstorage
            var ls = {
                username: options.bridge_username,
                bridge_ipaddress: options.bridge_ipaddress
            };
            window.localStorage.setItem('knownBridges', JSON.stringify(ls));            

            //Validate if current does not exists/authorized
            $.getJSON(options.request_protocol + "://" + options.bridge_ipaddress + "/api/" + options.bridge_username, 
                //Success
                function(res){  
                    //Set bridge config
                    self.bridge = res;
                    PhilipsConnector.bridge = self.bridge;  
                    
                    if(typeof(options.success) == "function"){ 
                        res.username = options.bridge_username;
                        options.success(res);                        
                    }
                },
                //Fail
                function(res){
                    if(typeof(options.fail) === "function"){
                        options.fail(JSON.stringify(res));
                    }
                }
            );
       }
   })
   .fail(function(res){
       clearInterval(self.options.connectIntervalId);
       if(typeof(options.fail) === "function"){
           options.fail(JSON.stringify(res));
       }
   })
   .always(function(res){
       if(typeof(options.attempt) === "function"){
           options.attempt(options.connect_retries);  
       }
   });

   //Next attempt
   options.connect_retries++;
};

/**
 * Scan network for bridges
 * @param {type} clientLocalIP
 * @param {type} asyncCompletedCallback
 * @param {type} onNextIpCallback
 * @param {type} onFindBridgeCallback
 * @returns {undefined}
 */
PhilipsConnector.prototype.scanBridges = function(clientLocalIP, asyncCompletedCallback, onNextIpCallback, onFindBridgeCallback){
    
    var self = this;
    
    if(clientLocalIP !== "unknown"){
         
        //Here we store bridges
        var bridges = [];
        stopBridgeScanner = false;
        clearTimeout();
         
        var scan = (function(host){
  
            //Break scanning
            if(typeof stopBridgeScanner !== undefined && stopBridgeScanner === true){ 
                clearTimeout();
                network = null;
                host = false;
                return false; 
            }

            //Host check
            if(network !== null && host !== false && (host >= 0 && host < 254)){

                //Next IP event
                onNextIpCallback(network + "." + host);

                try
                {
                    var s = document.getElementById('ipscan');
                    if(!s || s === null || typeof(s) === "undefined"){
                        s = document.createElement('iframe');
                        s.setAttribute('id', 'ipscan');
                        s.style['display'] = 'none';
                        s.style['height'] = '1px';
                        s.style['width'] = '1px';
                        document.body.appendChild(s);
                    }
                    s.onerror = function(){};
                    s.onload = function(){
                        onFindBridgeCallback(network + "." + (host-1) || 1);
                        bridges.push(network + "." + (host-1) || 1);
                    };
                    s.src = self.options.request_protocol + "://" + network  + "." + host + "/api/ipscanner/config";

                }catch(err){
                }            

                //Goto next
                host+=1;
                setTimeout(scan, 200, host);
            
            }else{
                clearTimeout();
                //Send complete event
                asyncCompletedCallback(bridges);
                network = null;
                host = false;
                return false;
            }
        }); 
        
        var parts = clientLocalIP.toString().split(".");
        var network = null;
        var host = 1;
         
        if(parts.length > 3){
            parts.splice(3,1); //Delete last part of the IP address
            
            network = parts.join(".");
            if(network !== null){
                setTimeout(scan, 100, host);
            }
            
        }else{
            asyncCompletedCallback(false);
        }

     }
     return;
};
window.PhilipsConnector = new PhilipsConnector();
