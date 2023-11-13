package main

import (
	"html/template"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"go.bug.st/serial"
)

var upgrader = websocket.Upgrader{} // use default options
var comPort serial.Port

// message type
const msgType = 1

var mode = &serial.Mode{
	BaudRate: 115200,
	Parity:   serial.NoParity,
	DataBits: 8,
	StopBits: serial.OneStopBit,
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade:", err)
		return
	}
	defer conn.Close()

	// create serial port
	if comPort == nil {
		serialPort := os.Getenv("COMPORT")
		comPort, err = serial.Open(serialPort, mode)
		if err != nil {
			log.Println("please check Serial Port: " + serialPort)
			return
		}
		defer comPort.Close()
	}

	// recieveHandler
	// must after comPort is initialized
	go receiveHandler(conn)

	// send message
	// for-loop
	buff := make([]byte, 100)
	for {
		n, err := comPort.Read(buff)
		if err != nil {
			log.Println(err)
			break
		}

		// it may take some time to read from serial port
		// so we need to check if the connection is still alive
		if conn == nil {
			return
		}

		// EOF
		if n == 0 {
			conn.WriteMessage(msgType, []byte("\nEOF"))
			break
		}

		err = conn.WriteMessage(msgType, buff[:n])
		if err != nil {
			log.Println("write:", err)
			break
		}
	}
}

func home(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	t := template.Must(template.ParseFiles("index.html"))

	t.Execute(w, "")
}

func receiveHandler(conn *websocket.Conn) {
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error in receive:", err)
			return
		}
		log.Printf("Received: %s\n", msg)

		_, err = comPort.Write(msg)
		if err != nil {
			log.Println(err)
			break
		}
	}
}

func main() {
	log.SetFlags(log.Llongfile | log.Lmicroseconds | log.Ldate)

	// load .env
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Err: %s", err)
		return
	}

	if true {
		ports, err := serial.GetPortsList()
		if err != nil {
			log.Fatal(err)
		}
		if len(ports) == 0 {
			log.Fatal("No serial ports found!")
		}
		log.Println("Found ports:")
		for _, port := range ports {
			log.Println(port)
		}
	}

	// route
	// file server...
	file := http.FileServer(http.Dir("src"))
	http.Handle("/src/", http.StripPrefix("/src/", file))
	// websocket
	http.HandleFunc("/ws", wsHandler)
	// homepage
	http.HandleFunc("/", home)

	webPort := os.Getenv("WEBPORT")
	ip := os.Getenv("IP")
	log.Printf("Available on:\n - http://localhost:%s\n - http://%s:%s\n", webPort, ip, webPort)
	// start server
	log.Fatal(http.ListenAndServe("0.0.0.0:"+webPort, nil))
}
