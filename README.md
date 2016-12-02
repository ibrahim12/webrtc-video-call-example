### Webrtc Sample Video Call Between Two Different Browsers

This is minimal code requried to make webrtc video call up running between two browsers. 

Steps to run. 

1. install node
2. install openssl
3. generate ssl keys
4. set network ip address in `index.js`

Install Dependecies. 

```
npm install

```

Webrtc needs a signaling server for exachanging `session descriptors` and `ice candidates`.
This example uses, `total.js`  framework for `webrtc` signaling support. You can use any signaling server you want.


This application runs over https, so you have to create your own ssl certificate. 

Follow this steps to generate `self signed` ssl certificate.

mkdir keys
cd keys

```
sudo apt-get install openssl

openssl genrsa -des3 -out server.key 2048
openssl rsa -in server.key -out server.key
openssl req -sha256 -new -key server.key -out server.csr -subj '/CN=localhost'
openssl x509 -req -sha256 -days 365 -in server.csr -signkey server.key -out server.crt

```

Configure you ip address to access the server, in `index.js` file.
```
options.ip = 'YOUR_NETWORK_IP';
```

To Run, Simply type 
```
sudo node index.js
```

#### `sudu` is required to run the application in https mode. 


