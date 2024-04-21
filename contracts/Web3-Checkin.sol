// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0; 


contract Web3Checkin { 
   
    struct CheckinInfo{ 
        uint32 sn;
        uint64 timeStart; 
        uint64 timeEnd; 
        uint32 longitude;  // multipy 10**6  
        uint32 latitude; // multipy 10**6  
        uint32 deviation; // 
        address owner;
        string description;
        string city;
     } 
    uint public nonce; 
    mapping (uint =>CheckinInfo) public checkinInfoAt; 
    mapping (address => mapping(uint=>bool)) public checkinStatusOfAddress;


    function addCheckinInfo(
        uint64 timeStart,
        uint64 timeEnd,
        uint32 longitude, // multipy 10**6   
        uint32 latitude,  // multipy 10**6  
        uint32 deviation, // multipy 10**6
        string memory description,
        string memory city
        ) public { 

        uint _nonce = ++nonce;

        checkinInfoAt[_nonce] =  CheckinInfo(
            uint32(_nonce),  // uint32 sn;
            timeStart,  // uint64 timeStart; 
            timeEnd,  // uint64 timeEnd; 
            longitude,  // uint32 longitude;  // multipy 10**6
            latitude,  // uint32 latitude; // multipy 10**6
            deviation,  // uint32 deviation; // multipy 10**6
            msg.sender,  
            description,  // string description;
            city
        );
    } 


    function checkin(uint _nonce, uint32 _longitude, uint32 _latitude) public { 
        require(block.timestamp >= checkinInfoAt[_nonce].timeStart && block.timestamp <= checkinInfoAt[_nonce].timeEnd, "time out"); 
        require(checkinStatusOfAddress[msg.sender][_nonce] == false, "already checkin");

        uint32 longitude = checkinInfoAt[_nonce].longitude;
        uint32 latitude = checkinInfoAt[_nonce].latitude;
        uint32 deviation = checkinInfoAt[_nonce].deviation;
        
        require(longitude-deviation <= _longitude && _longitude <= longitude+deviation, "longitude is not in range");
        require(latitude-deviation <= _latitude && _latitude <= latitude+deviation, "latitude is not in range");

        checkinStatusOfAddress[msg.sender][_nonce] = true;
    } 

    
    function getBlockTimeStamp() public view returns (uint){ 
        return block.timestamp; 
    } 


    function getCheckinInfosByAddress() public view returns(bytes[] memory _list){
        uint num;
        uint _nonce = nonce;
        for(uint i=1; i<=_nonce; i++){
            if(checkinStatusOfAddress[msg.sender][i] == true) num++;
        }
        require(num > 0);
        _list = new bytes[](num);
        
        uint _index;
        for(uint i=1; i<=_nonce; i++){
            if(checkinStatusOfAddress[msg.sender][i] == true) {
                _list[_index] = abi.encode(
                    checkinInfoAt[i].sn,
                    checkinInfoAt[i].timeStart,
                    checkinInfoAt[i].timeEnd,
                    checkinInfoAt[i].longitude,  // multipy 10**6
                    checkinInfoAt[i].latitude,
                    checkinInfoAt[i].deviation, // 
                    checkinInfoAt[i].owner,
                    checkinInfoAt[i].description,
                    checkinInfoAt[i].city
                );
                _index = _index + 1;
            }
        }
    }


    function getAllCheckinPoints() public view returns(bytes[] memory _list){
        
        uint _nonce = nonce;
        require(_nonce > 0, "no points");

        _list = new bytes[](_nonce);
        
        uint _index;
        for(uint i=1; i<=_nonce; i++){
            _list[_index] = abi.encode(
                checkinInfoAt[i].sn,
                checkinInfoAt[i].timeStart,
                checkinInfoAt[i].timeEnd,
                checkinInfoAt[i].longitude,  // multipy 10**6
                checkinInfoAt[i].latitude,
                checkinInfoAt[i].deviation, // 
                checkinInfoAt[i].owner,
                checkinInfoAt[i].description,
                checkinInfoAt[i].city,
                checkinStatusOfAddress[msg.sender][i]
            );
            _index = _index + 1;
        }
    }

    

}
