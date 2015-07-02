# PhilipsHueConnector
Philips Hue bridge connector Javascript SDK

Javascript library used on HueLabs to connect and pair the HueBridge.

# Requirements
- jQuery

# Example for known bridge

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
