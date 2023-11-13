import { render, updateLabel, labelCurrent, labelSpeed } from "./three.js"

const output = document.getElementById("console");
const input = document.getElementById("input");
let ws;
const print = function (message) {
    let d = document.createElement("div");
    d.textContent = message;
    output.appendChild(d);
    output.scroll(0, output.scrollHeight);
};

document.getElementById("send").onclick = function (evt) {
    if (!ws) {
        return false;
    }
    var value_string = input.value;
    print("ME: " + value_string);
    ws.send(value_string);
    return false;
};

document.getElementById("clear").onclick = function (evt) {
    while (output.firstChild) {
        output.removeChild(output.firstChild);
    }
    return false;
};

const url = window.location.host;
document.getElementById("open").onclick = function () {
    if (ws) {
        return false;
    }
    ws = new WebSocket("ws://" + url + "/ws");
    ws.onopen = function () {
        print("OPEN WebSocket");
    }
    ws.onclose = function () {
        print("CLOSE WebSocket");
        ws = null;
    }
    ws.onmessage = function (evt) {
        var data_str = evt.data;
        print("STM32: " + data_str);
        if (data_str.indexOf("speed")<0){
            return false;
        }
        // "speed"+float+"#"
        // "speed"+float+"*current"+float+"#"
        var start =data_str.indexOf("speed")+5;
        var end=data_str.indexOf("@");
        var speed_str = data_str.substring(start,end);
        updateLabel(labelSpeed, "Speed(rpm): " + speed_str)
        start =data_str.indexOf("current")+7;
        end=data_str.indexOf("#");
        var current_str = data_str.substring(start,end);
        updateLabel(labelCurrent, "Current(mA): " + current_str)
    }
    ws.onerror = function (evt) {
        print("ERROR: " + evt.data);
    }
    return false;
};

document.getElementById("close").onclick = function () {
    if (!ws) {
        return false;
    }
    ws.close();
    ws = null;
    return false;
};

render();