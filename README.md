# PhilipsHueConnector
Philips Hue bridge connector Javascript SDK

Javascript library used on HueLabs to connect and pair the HueBridge.

# Requirements
- jQuery

# Example for KNOWN/Returning bridges

    var currentBridgeIP = null;
    var bridgeUserName = null;
    var isConnected = null;
    
    PhilipsConnector.connect({
        bridge_username: null,
        bridge_ipaddress: null,
        success: function(res){
    
            //Set variables
            currentBridgeIP = res.config.ipaddress;
            bridgeUserName = PhilipsConnector.getBridgeUsername();                        
    
            isConnected = true;
        },
        fail: function(res){
    
            //Set variables
            currentBridgeIP = null;
            bridgeUserName = null;
            
            isConnected = false;
        },
        attempt: function(attempt){
            //Connection / pair attempt
        }
    });

# Example for NEW bridges

    PhilipsConnector.connect({
        bridge_username: 'MySecretUsername',
        bridge_ipaddress: '192.168.0.1', //The IP address of the bridge
        success: function(res){
            
            if(typeof(res) === "object" && typeof(res.username) !== "undefined"){
            
                //Set variables
                currentBridgeIP = res.config.ipaddress;
                bridgeUserName = PhilipsConnector.getBridgeUsername();
                
                isConnected = true;
            }

        },
        fail: function(res){
        
            isConnected = false;

            //Set variables
            currentBridgeIP = null;
            bridgeUserName = null;
        },
        attempt: function(attempt){
            //Attempt number 
        }
    });
