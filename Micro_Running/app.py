from flask import Flask, render_template, jsonify, request,session, url_for, redirect,make_response,session, flash
import threading
import mysql.connector
import time
import datetime
import random
from paho.mqtt import client as mqtt_client
import paho.mqtt.client as mqtt
import logging
from flask_socketio import SocketIO,emit
import socket
import json

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="http://evoluzn.org:5003",  manage_session=False)
app.secret_key = "Evoluzn@999"



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True)