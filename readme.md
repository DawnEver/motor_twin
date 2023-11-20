# Motor Twin
Digital twin of a motor control system.

The user interface of the final exp of Course Embbed Systems.

## Tech Stack
- Golang
    - website backend
    - serial communication
    - Websocket
- Digital Twin
    - threejs
    - blender

<img src="./presentation.png">


## .env Example
Create .env in root directory
Example:
```
ROUTE = '/motor'
WEBPORT = 1145
COMPORT = '/dev/tty.usbserial-1420'
IP = "10.21.23.92"
BAUDRATE = 115200
DATABITS = 8
STOPBIT = 1
```