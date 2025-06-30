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
from collections import defaultdict
import re
# from email.header import Header
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from paho.mqtt.publish import single
import os
from werkzeug.utils import secure_filename


broker = "evoluzn.org"
port = 18889
username = "evzin_led"
password = "63I9YhMaXpa49Eb"
topic = "WTS4ChannelF0BF2D/control"
topic = "WTS4ChannelF0BF2D/control"

app = Flask(__name__) 
socketio = SocketIO(app, cors_allowed_origins="http://evoluzn.org:5002",  manage_session=False)
# socketio = SocketIO(app, cors_allowed_origins="*",  manage_session=False)

app.secret_key = "Evoluzn@999"

@app.route('/debug-session', methods=['GET'])
def debug_session():
    email = session.get('email', 'No email in session')
    print("Session contents:", dict(session))  # Log to console
    return f"Email in session: {email}<br>Full session: {dict(session)}"

ALARM_TRIGGERED = False 


SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587  # TLS port  
SENDER_EMAIL = "shilpaevoluzn@gmail.com"
SENDER_NAME = "Shilpa"
SENDER_PASSWORD = "ucma aapb quiv mnos"
EMAIL_RECEIVER = ["dhoteshilpa9@gmail.com","shilpa.snable@gmail.com","pbhoyar622@gmail.com","anjali@evoluzn.in"]

# Email server setup
# SMTP_SERVER = 'smtp.gmail.com'
# SMTP_PORT = 587
# SENDER_EMAIL = "evoluzn999@gmail.com"
# SENDER_NAME = "Evoluzn Team"
# SENDER_PASSWORD = "yaek aovm maer qwhd"  # Use App Password
# EMAIL_RECEIVER = ["anjali@evoluzn.in","shilpa.snable@gmail.com", "sohan@evoluzn.in","pbhoyar622@gmail.com"]


# MySQL Database connection details
# db_config = {
#     "host": "evoluzn.org",  # Change if MySQL is hosted elsewhere
#     "user": "shilpa",       # Your MySQL username
#     "password": "Evoluzn@123",   # Your MySQL password
#     "database": "admin_portal"
# }

# # MySQL Database connection details
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "root",
    "database": "flask_auth"
}

def connect_db():
    """Connect to MySQL database."""
    return mysql.connector.connect(**db_config)

def create_tables():
    """Create tables if they don't exist."""
    conn = connect_db()
    cursor = conn.cursor()
    
    alert_temp_query =("""
        CREATE TABLE IF NOT EXISTS alert_temp (
            id INT AUTO_INCREMENT PRIMARY KEY,
			device_name VARCHAR(255) NOT NULL,
			message TEXT NOT NULL,
			timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
			mail_sent_flag TINYINT(1) DEFAULT 0,
            exceeded_phases varchar(255)
        )
    """)
    # ALTER TABLE alert_temp ADD UNIQUE unique_index (device_name, timestamp)
    conn.commit()

    try:
        cursor.execute(alert_temp_query)
        conn.commit()
    except mysql.connector.Error as err:
        print(f"Error creating tables: {err}")
    finally:
        cursor.close()
        conn.close()

# Optimize merging function
def process_devices_for_merging(devices):
    company_counts = defaultdict(int)
    for d in devices:
        company_counts[d['company_name']] += 1

    seen = set()
    for d in devices:
        cname = d['company_name']
        d['show_company'] = cname not in seen
        d['rowspan'] = company_counts[cname] if d['show_company'] else 0
        seen.add(cname)
    return devices

# MQTT Connection Function
def connect_mqtt():
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("? Connected to MQTT Broker!")
            # print("yyyy",topic)
            client.subscribe('#')
        else:
            print(f"? Failed to connect, return code {rc}")
    
    client = mqtt.Client()
    client.username_pw_set(username, password)
    client.on_connect = on_connect
    client.on_message = on_message
    
    try:
        print("Connecting to MQTT broker...")
        client.connect(broker, port)
        client.loop_start()
        return client
    except Exception as e:
        print(f"? Exception occurred during connection: {e}")

    return client    

def on_message(client, userdata, msg):
    """Handle incoming MQTT messages."""
    try:
        topic = msg.topic
        payload = msg.payload.decode().strip("{} ")

        print(f"?? Received `{payload}` from `{topic}`")

        if topic.startswith("WTSAlert"):
            payload_str = payload.decode() if isinstance(payload, bytes) else payload
            parts = payload_str.split(":", 2)  # limit to 3 parts max
            print(f"?? Received payloadthreshold: {payload_str}")
            if len(parts) == 3:
                _, device_name, message = parts
                print('device_name:::::', device_name, 'message::::', message)

                insert_alert(device_name, message)
                print(f"? Inserted alert from {device_name}: {message}")
            else:
                print(f"? Unexpected payload format: {payload_str}")
            return

        # Handle WTS data 
        if topic.startswith("WTS"):
            data = payload.split(":")    
            print(f"?? Received data: {data}")
            data_length = len(data)
            print(f"?? Data length: {data_length}")
            if len(data) <= 4:
                print(f"?? Incomplete data received: {data}")
                return

            device_id = data[1]
            if device_id == "200":
                print(f"?? Skipping insertion for device_id: {device_id}")
                return

            values = data[2:]

            # ? Clear previously assigned global variables
            for idx in range(1, 4):
                globals().pop(f"R{idx}", None)
                globals().pop(f"Y{idx}", None)
                globals().pop(f"B{idx}", None)

            R_index, Y_index, B_index = 1, 1, 1


            for i in range(0, len(values), 3):
                if i + 2 < len(values):
                    globals()[f"R{R_index}"] = float(values[i])
                    globals()[f"Y{Y_index}"] = float(values[i+1])
                    globals()[f"B{B_index}"] = float(values[i+2])

                    print(f"?? Assigned: R{R_index}={globals()[f'R{R_index}']}, Y{Y_index}={globals()[f'Y{Y_index}']}, B{B_index}={globals()[f'B{B_index}']}")
                    
                    # Increment the index for the next triplet
                    R_index += 1
                    Y_index += 1
                    B_index += 1
                else:
                    print(f"?? Incomplete triplet found at the end: {values[i:]}")
                    break
            
            # Check if there's an 'N' value
            if len(values) % 3 != 0:
                N = float(values[-1])
                print(f"?? N value: {N}")
            else:
                N = None
                print(f"?? No N value, distribution is even.")
            
            print("Sending data",device_id, globals()[f"R{R_index-1}"], globals()[f"Y{Y_index-1}"], globals()[f"B{B_index-1}"], N, 0)

            R1 = globals().get("R1", None)
            Y1 = globals().get("Y1", None)
            B1 = globals().get("B1", None)
            R2 = globals().get("R2", None)
            Y2 = globals().get("Y2", None)
            B2 = globals().get("B2", None)
            R3 = globals().get("R3", None)
            Y3 = globals().get("Y3", None)
            B3 = globals().get("B3", None)
            threshold = None

            # print(f"?? Final values: R1={R1}, Y1={Y1}, B1={B1}, R2={R2}, Y2={Y2}, B2={B2}, R3={R3}, Y3={Y3}, B3={B3}, N={N}")
            insert_data(device_id, R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, N, threshold)

    except Exception as e:
        print(f"? Error processing message: {e}")

def insert_alert(device_name, message):
    print("Inserting or updating alert...", device_name, message)
    conn = connect_db()
    cursor = conn.cursor()

    try:
        check_query = """
            SELECT id ,device_name,exceeded_phases FROM alert_temp
            WHERE device_name = %s AND message = %s
        """
        cursor.execute(check_query, (device_name, message))
        existing = cursor.fetchone()
        print('dsdsdsdsdsdsds',existing)

        current_time = datetime.datetime.now()

        actual_device_id = device_name.replace("WTSAlert", "WTS")

        # Get latest sensor data
        cursor.execute("""
            SELECT R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, N, timestamp 
            FROM temp_data 
            WHERE device_id = %s
            ORDER BY timestamp DESC 
            LIMIT 1
        """, (actual_device_id,))
        temp_row = cursor.fetchone()
        print('temp_row', temp_row)
        if not temp_row:
            print(f"⚠️ No sensor data found for {actual_device_id}")
            return

        # Extract numeric threshold from message
        match = re.search(r'(\d+)', message)
        if match:
            user_threshold_value = float(match.group(1))
        else:
            print("❌ No numeric value found in message.")
            return

        # Temperature check
        exceeded_phases = []
        for i, phase in enumerate(['R1', 'Y1', 'B1', 'R2', 'Y2', 'B2', 'R3', 'Y3', 'B3', 'N']):
            value = temp_row[i]
            if value is not None and float(value) > user_threshold_value:
                exceeded_phases.append(phase)

        if not exceeded_phases:
            print("✅ All phase temperatures are within the safe limit.")
            return

        phases_str = ', '.join(exceeded_phases)
        print('exceed_phasessss---------------',phases_str)
        if existing:
            # Update timestamp
            update_query = """
                UPDATE alert_temp
                SET timestamp = %s , exceeded_phases= %s
                WHERE id = %s
            """
            cursor.execute(update_query, (current_time, phases_str,existing[0]))
            conn.commit()
            print(f"🔄 Alert existed. Timestamp updated for {device_name}.")
        else:
            # Insert new alert
            insert_query = """
                INSERT INTO alert_temp (device_name, message, timestamp, exceeded_phases)
                VALUES (%s, %s, %s, %s)
            """
            values = (device_name, message, current_time, phases_str)
            cursor.execute(insert_query, values)
            conn.commit()
            print("✅ New alert inserted.")

        # Send email if this is a new alert
        if not existing:
            send_email_and_update_flag(device_name, message, exceeded_phases)

        alert_data = {
            'device_name': device_name,
            'message': message,
            'exceeded_phases': phases_str,
            'timestamp': current_time.strftime('%Y-%m-%d %H:%M:%S')
        }
        print("frontend:", alert_data)
        socketio.emit('micro_new_alert', alert_data)

    except mysql.connector.Error as err:
        print(f"❌ MySQL Error: {err}")
    finally:
        cursor.close()
        conn.close()


# def insert_alert(device_name, message):
#     print("Inserting or updating alert...", device_name, message)
#     conn = None
#     cursor = None

#     try:
#         conn = connect_db()
#         cursor = conn.cursor()

#         check_query = """
#             SELECT id, device_name, exceeded_phases FROM alert_temp
#             WHERE device_name = %s AND message = %s
#         """
#         cursor.execute(check_query, (device_name, message))
#         existing = cursor.fetchone()
#         print('Existing alert:', existing)

#         current_time = datetime.datetime.now()

#         actual_device_id = device_name.replace("WTSAlert", "WTS")

#         cursor.execute("""
#             SELECT R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, N, timestamp 
#             FROM temp_data 
#             WHERE device_id = %s
#             ORDER BY timestamp DESC 
#             LIMIT 1
#         """, (actual_device_id,))
#         temp_row = cursor.fetchone()
#         print('temp_row', temp_row)
#         if not temp_row:
#             print(f"⚠️ No sensor data found for {actual_device_id}")
#             return

#         match = re.search(r'(\d+)', message)
#         if match:
#             user_threshold_value = float(match.group(1))
#         else:
#             print("❌ No numeric value found in message.")
#             return

#         exceeded_phases = []
#         for i, phase in enumerate(['R1', 'Y1', 'B1', 'R2', 'Y2', 'B2', 'R3', 'Y3', 'B3', 'N']):
#             value = temp_row[i]
#             if value is not None and float(value) > user_threshold_value:
#                 exceeded_phases.append(phase)

#         if not exceeded_phases:
#             print("✅ All phase temperatures are within the safe limit.")
#             return

#         phases_str = ', '.join(exceeded_phases)
#         print('exceeded phases:', phases_str)

#         if existing:
#             update_query = """
#                 UPDATE alert_temp
#                 SET timestamp = %s, exceeded_phases = %s
#                 WHERE id = %s
#             """
#             cursor.execute(update_query, (current_time, phases_str, existing[0]))
#             conn.commit()
#             print(f"🔄 Alert existed. Timestamp updated for {device_name}.")
#         else:
#             insert_query = """
#                 INSERT INTO alert_temp (device_name, message, timestamp, exceeded_phases)
#                 VALUES (%s, %s, %s, %s)
#             """
#             cursor.execute(insert_query, (device_name, message, current_time, phases_str))
#             conn.commit()
#             print("✅ New alert inserted.")

#             # Send email only on new alert
#             send_email_and_update_flag(device_name, message, exceeded_phases)

#         alert_data = {
#             'device_name': device_name,
#             'message': message,
#             'exceeded_phases': phases_str,
#             'timestamp': current_time.strftime('%Y-%m-%d %H:%M:%S')
#         }
#         print("frontend:", alert_data)
#         socketio.emit('micro_new_alert', alert_data)

#     except mysql.connector.Error as err:
#         print(f"❌ MySQL Error: {err}")
#     except Exception as e:
#         print(f"? Error processing message: {e}")
#     finally:
#         if cursor:
#             cursor.close()
#         if conn:
#             conn.close()


def send_email_and_update_flag(alert_device_id, user_threshold, exceeded_phases):
    # conn = None
    # cursor = None
    try:
        with app.app_context():
            # Send email only if exceeded_phases is not empty
            if not exceeded_phases:
                print("ℹ️ No exceeded phases provided, skipping email.")
                return

            actual_device_id = alert_device_id.replace("WTSAlert", "WTS")

            # Render email body
            html_body = render_template("alert.html",
                                        device_name=actual_device_id,
                                        R=None, Y=None, B=None, N=None,  # optionally provide actual values
                                        threshold=user_threshold,
                                        exceeded_phases=', '.join(exceeded_phases))

            print(f"📤 Sending email to: {EMAIL_RECEIVER}")
            msg = MIMEMultipart("alternative")
            msg['From'] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
            msg['To'] = ", ".join(EMAIL_RECEIVER)
            msg['Subject'] = f"⚠️ Temperature Alert for {actual_device_id} (Phases: {', '.join(exceeded_phases)})"
            msg.attach(MIMEText(html_body, 'html'))

            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.set_debuglevel(1)
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, EMAIL_RECEIVER, msg.as_string())
            server.quit()

            print("📧 Alert email sent.")

            # Update mail_sent_flag
            conn = connect_db()
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE alert_temp 
                SET mail_sent_flag = 1,
                    exceeded_phases = %s
                WHERE device_name = %s 
                AND message = %s 
                AND mail_sent_flag = 0
            """, (', '.join(exceeded_phases), alert_device_id, user_threshold))
            conn.commit()

    except mysql.connector.Error as err:
        print(f"❌ MySQL Error: {err}")
    finally:
        # if cursor:
            cursor.close()
        # if conn:
            conn.close()




def insert_data(device_id, R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, N, threshold):
    """Insert sensor data into MySQL."""
    conn = connect_db()
    cursor = conn.cursor()

    try:
        sql = """
            INSERT INTO temp_data (device_id, R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, N, threshold, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (device_id, R1, Y1, B1, R2, Y2, B2, R3, Y3, B3, N, threshold, datetime.datetime.now() )
        cursor.execute(sql, values)
        conn.commit()
        print("? Data inserted successfully!")
    except mysql.connector.Error as err:
        print(f"? MySQL Error: {err}")
    finally:
        cursor.close()
        conn.close()

def run():
    mqtt_client = connect_mqtt()
    return mqtt_client

def alert_show(user_email):
    try:
        conn = connect_db()
        cursor = conn.cursor(dictionary=True)

        # Match device_name logic using RIGHT() and string functions
        cursor.execute("""
            SELECT 
                at.device_name, 
                at.message, 
                at.exceeded_phases, 
                MAX(at.timestamp) AS timestamp
                FROM alert_temp at
                JOIN device_table dt 
                ON RIGHT(at.device_name, LENGTH(dt.device_name) - 3) = RIGHT(dt.device_name, LENGTH(dt.device_name) - 3)
                WHERE dt.company_name = (
                SELECT company_name 
                FROM user_table 
                WHERE email = %s
            )
            GROUP BY at.device_name, at.message, at.exceeded_phases
        """, (user_email,))

        alerts = cursor.fetchall()
        print("Filtered alerts:", alerts)

        return alerts

    except mysql.connector.Error as err:
        print(f"Error fetching alerts: {err}")
        return []

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

##### SocketIO and Live Data #####
def get_latest_device_data(user_email):

    conn = connect_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # Step 1: Get company name from user
        cursor.execute("SELECT company_name FROM user_table WHERE email = %s", (user_email,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        company_name = user['company_name']
        print("Company Name:", company_name)

        # Step 2: Get all active devices for that company
        cursor.execute("""
            SELECT id AS device_id, device_name, graph_duration
            FROM device_table
            WHERE company_name = %s AND is_active = 1 AND device_type = 'Temperature Sensor'
        """, (company_name,))
        devices = cursor.fetchall()

        print("the devices data is -->", devices)

        panel_structure = {}
        final_data = {}
        result = {}

        for device in devices:
            device_name = device['device_name']
            graph_duration_data[device_name] = device['graph_duration']
            cursor.execute("""
                SELECT panel_name, phase
                FROM panel
                WHERE device_id = %s
            """, (device_name,))
            
            panel_rows = cursor.fetchall()
            
            panels = defaultdict(set)
            for row in panel_rows:
                panels[row['panel_name']].add(row['phase'])
            
            panel_structure[device_name] = dict(panels)

             # Fetch the min and max values for the current device's sensor data for the current day
            cursor.execute("""
                SELECT 
                    device_id,
                    MIN(R1) AS minR1, MAX(R1) AS maxR1,
                    MIN(R2) AS minR2, MAX(R2) AS maxR2,
                    MIN(R3) AS minR3, MAX(R3) AS maxR3,
                    MIN(Y1) AS minY1, MAX(Y1) AS maxY1,
                    MIN(Y2) AS minY2, MAX(Y2) AS maxY2,
                    MIN(Y3) AS minY3, MAX(Y3) AS maxY3,
                    MIN(B1) AS minB1, MAX(B1) AS maxB1,
                    MIN(B2) AS minB2, MAX(B2) AS maxB2,
                    MIN(B3) AS minB3, MAX(B3) AS maxB3,
                    MIN(N) AS minN, MAX(N) AS maxN
                FROM temp_data
                WHERE device_id = %s AND DATE(timestamp) = CURDATE()
            """, (device_name,))

            min_max_row = cursor.fetchone()

            if min_max_row:
                device_id = min_max_row['device_id']

                if device_id not in result:
                    result[device_id] = {}

                sensors = ['R1', 'R2', 'R3', 'Y1', 'Y2', 'Y3', 'B1', 'B2', 'B3', 'N']

                # Loop over the sensors and filter out None values
                for sensor in sensors:
                    min_value = min_max_row.get(f'min{sensor}')
                    max_value = min_max_row.get(f'max{sensor}')
                    
        
                    result[device_id][sensor] = {
                        "MIN": min_value,
                        "MAX": max_value
                    }
            
        for device_name, panels in panel_structure.items():

            default_data = {
                'id': None,
                'device_id': device_name,
                'R1': None, 'Y1': None, 'B1': None,
                'R2': None, 'Y2': None, 'B2': None,
                'R3': None, 'Y3': None, 'B3': None,
                'N': None,
                'threshold': None,
                'timestamp': None
            }
            
            # Get latest sensor row for this device
            cursor.execute("""
                 SELECT * FROM temp_data
                WHERE device_id = %s
                AND DATE(timestamp) = CURDATE()
                ORDER BY timestamp DESC
                LIMIT 1
            """, (device_name,))
            sensor_row = cursor.fetchone()

            print("sensor data is query", sensor_row)

            sensor_row = sensor_row if sensor_row else default_data

            if not sensor_row:
                continue  # No sensor data

            final_data[device_name] = {}

            for panel_name, phases in panels.items():
                phase_data = {}

                for phase in phases:
                    if phase in sensor_row:
                        phase_data[phase] = sensor_row[phase]

                final_data[device_name][panel_name] = phase_data
 
        print("graph-->", graph_duration_data)

        return (final_data, result, graph_duration_data)

    except Exception as e:
        print(f"Error: {e}")
        print("Error fetching latest device data:-->", e)
        return jsonify({'error': 'Internal server error'}), 500

    finally:
        cursor.close()
        conn.close()


@socketio.on('connect')
def on_connect():
    print("[Micro] Client connected")

@socketio.on('start_stream')
def on_start_stream(data):
    """Handle client connection with email from frontend."""
    email = data.get('email')
    sid = data.get('sid')
    print("Received email from frontend:", email)
    
    if email:
        print(f"Starting background task for {email}")
        socketio.start_background_task(send_live_data, email, room=sid)
    else:
        print("Email not received in start_stream event.")

def send_live_data(user_email, room):
    """Emit latest data to frontend every 60 seconds."""
    while True:
        received_data = get_latest_device_data(user_email)
        print("Sending from client...", received_data)
        # socketio.emit('update_temperature', {'final_data': received_data[0], 'result': received_data[1]})
        socketio.emit('micro_data', {
            'final_data': received_data[0],
            'result': received_data[1],
            'room': room
        })
        time.sleep(60)


def filter_device_data(device_Name, data):
    if device_Name in data:
        filtered_data = {device_Name: data[device_Name]}
        print(f"Filtered data: {filtered_data}")
        return filtered_data
    else:
        print("No device found to filter.")
        return {}

connected_users = {}
graph_duration_data = {}


@app.route('/dashboard', methods=['GET', 'POST'])
def dashboard():
    if 'email' not in session:
        return redirect(url_for('login'))

    conn = connect_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # Get user info
        cursor.execute("SELECT company_name, is_admin FROM user_table WHERE email = %s", (session['email'],))
        user = cursor.fetchone()

        if not user:
            return redirect(url_for('login'))

        company_name = user['company_name']
        is_admin = user['is_admin']

        # Get device data
        if is_admin:
            cursor.execute("SELECT * FROM device_table ORDER BY company_name ASC")
        else:
            cursor.execute(
                "SELECT * FROM device_table WHERE company_name = %s ORDER BY company_name ASC",
                (company_name,)
            )

        devices = cursor.fetchall()

    except mysql.connector.Error as err:
        print(f"Error fetching data: {err}")
        company_name = "Error"
        is_admin = False
        devices = []

    finally:
        cursor.close()
        conn.close()

    # Process merging info
    devices = process_devices_for_merging(devices)

    return render_template(
        'dashboard_table.html',
        email=session['email'],
        company_name=company_name,
        is_admin=is_admin,
        devices=devices
    )

@app.route('/wts_home', methods=['POST', 'GET'])
def home():
    user_email = request.args.get('email')
    
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)

    try:
        
        filtered_devices = []
        received_data = get_latest_device_data(user_email)
    
        alerts = alert_show(user_email)

        print("Received data for home page:", type(alerts)) 

        # return render_template('dashboard23.html', devices=filtered_devices, device_data=received_data[0], result=received_data[1], alerts=alerts)
        return jsonify({
            'status': 'success',
            'devices': filtered_devices,
            'device_data': received_data[0],
            'result': received_data[1],
            'alerts': alerts
        })

    except mysql.connector.Error as err:
        print(f"Error fetching data: {err}")
        return "Error fetching data", 500  # ? Add this line

    finally:
        cursor.close()
        conn.close()
    
@app.route('/update_panel', methods=['POST'])
def update_panel():
    print("update panel page")
    if request.method=='POST':
        data = request.get_json()
        device_name = data['device_name']
        panel_name = data['panel_name']
        old_panel_value = data['old_panel_value']

        conn = connect_db()
        cursor = conn.cursor()  

        try:
            # SQL query to update the panel name
            update_query = """
                UPDATE panel
                SET panel_name = %s
                WHERE panel_name = %s
                AND device_id = %s;
            """
            cursor.execute(update_query, (panel_name, old_panel_value, device_name))

            # Commit the changes
            conn.commit()
            return jsonify({"status": "success"})
        
        except Exception as e:
            # Handle exceptions (e.g., SQL errors)
            print("Error during the update:", e)
            response = {"status": "error", "message": "Failed to update panel name"}
            return jsonify(response), 500

        finally:
            # Close the cursor and connection
            cursor.close()
            conn.close()
    else:
        response = {"status": "error", "message": "Invalid request method"}

@app.route('/delete_alert', methods=['POST'])
def delete_alert():
    data = request.get_json()
    print('Data received for deletion:', data)
    alert_message = data.get('message')  # Get message from frontend
    print("Alert message to delete:", alert_message)

    try:
        conn = connect_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM alert_temp WHERE message = %s", (alert_message,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        print(f"? Error deleting alert: {e}")
        return jsonify({'success': False})


@app.route('/graph_page', methods=['GET'])
def graph_page():
    device_id = request.args.get('device_id')
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)
    print('device_id---------', device_id)

    device_data = {device_id: {}}

    try:
        # Step 1: Get all panel_name, phase pairs for the device
        cursor.execute("""
            SELECT panel_name, phase
            FROM panel
            WHERE device_id = %s
        """, (device_id,))
        panel_rows = cursor.fetchall()

        # Organize into {panel_name: [phase1, phase2, ...]}
        panel_phase_map = {}
        all_phases = set()
        for row in panel_rows:
            panel = row['panel_name']
            phase = row['phase']
            panel_phase_map.setdefault(panel, []).append(phase)
            all_phases.add(phase)

        # Step 2: Get latest sensor row for the device
        cursor.execute("""
            SELECT *
            FROM temp_data
            WHERE device_id = %s
            ORDER BY timestamp DESC
            LIMIT 1
        """, (device_id,))
        sensor_row = cursor.fetchone()

        # Step 3: Build output using column-based phase values
        for panel_name, phases in panel_phase_map.items():
            device_data[device_id][panel_name] = {}
            for phase in phases:
                value = sensor_row.get(phase) if sensor_row else None
                device_data[device_id][panel_name][phase] = value

        # Step 4: Build new device_id for alert table
        alert_device_id = device_id.replace("WTS", "WTSAlert")
        print("Alert device ID:", alert_device_id)

        # Step 5: Fetch alert data using transformed ID
        cursor.execute("""
            SELECT device_name, message, exceeded_phases, MAX(timestamp) AS timestamp
            FROM alert_temp
            WHERE device_name = %s
            GROUP BY device_name, message, exceeded_phases
        """, (alert_device_id,))
        alertsindivisual = cursor.fetchall()

        print("device_data for device:", device_data)

    # return render_template('temperature_graph.html', device_id=device_id, device_data=device_data, alertsindivisual=alertsindivisual)
        return jsonify({
            'status': 'success',
            'device_id': device_id,
            'device_data': device_data,
            'alertsindivisual': alertsindivisual
        })
    
    except mysql.connector.Error as err:
        print(f"Error fetching data: {err}")
        return "Error fetching data", 500  # ? Add this line

    finally:
        cursor.close()
        conn.close()

@app.route('/micro_publish', methods=['POST', 'GET'])
def publish_threshold():
    """Publish threshold value to MQTT and update database."""

    conn = None
    cursor = None

    try:
        data = request.get_json()
        print("Received data for threshold:", data)
        value = data.get('value')
        device_id = data.get('device_id')
        print("Received value:", value, "for device_id:", device_id)

        if value is None or not isinstance(value, int):
            return jsonify({"error": "Invalid threshold value"}), 400

        if not device_id:
            return jsonify({"error": "Missing device_id"}), 400

        if value > 100:
            value = 100  # Clamp to max 100

        # Database update
        conn = connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE temp_data SET threshold = %s WHERE device_id = %s",
            (value, device_id)
        )

        if cursor.rowcount == 0:
            return jsonify({"error": "Device not found"}), 404

        conn.commit()
        cursor.close()
        conn.close()

        # Publish to MQTT only after successful DB update
        try:
            message = f"thresholdTempForAlert:{value}"
            topic = f"{device_id}/control"
            print('message----------',message,topic)
            single(
                topic=topic,
                payload=message,
                hostname="evoluzn.org",
                port=18889,
                auth={'username': 'evzin_led', 'password': '63I9YhMaXpa49Eb'}
            )
        except Exception as mqtt_error:
            print(f"MQTT Publish Error: {mqtt_error}")
            return jsonify({"error": "MQTT publish failed", "details": str(mqtt_error)}), 500

        return jsonify({"status": "success", "value": value}), 200

    except Exception as db_error:
        if conn:
            conn.rollback()
        print(f"Database Error: {db_error}")
        return jsonify({"error": "Database update failed", "details": str(db_error)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@socketio.on('get_temperature_graph_data')
def get_temperature_graph_data(data):
    try:
        print("Selected Data for temperature_graph_data graph:", data)
        sid = data.get('sid')

        print("Socket ID:", sid)
        user_email = data.get('email', None)
        
        if user_email:
            print(f"Client with email {user_email} connected!")
        else:
            print("User not logged in.")
        
        received_data = get_latest_device_data(user_email)

        print("Sending from client...", received_data[0])

        today = datetime.datetime.today().strftime('%Y-%m-%d')
        start_date = data.get('startDate', today)
        end_date = data.get('endDate', today)
        timeselect = data.get('timeSelect', 'daily')
        controlGraph = data.get('controlGraph', 'panel-1')  # e.g., 'shilpa'
        device_id = data.get('device_id')
        device_id_from_client = received_data[0]
        graph_duration_data = received_data[2] 
        graph_duration = graph_duration_data.get(device_id, 0)

        print("controlGraph-->", controlGraph)

        # Determine time format based on graph duration
        if graph_duration < 60:
            time_format = '%H:%i:%S'  # For durations < 60 seconds (include seconds)
        else:
            time_format = '%H:%i'     # For durations >= 60 seconds (just hours and minutes)


        filtered_device_id = filter_device_data(device_id, device_id_from_client)

        print("time fiomat-->",time_format)

        print('controlGraph-------', controlGraph)
        print("Device ID:", device_id)
        print("Filtered device data:", filtered_device_id)

        conn = connect_db()
        cursor = conn.cursor()

        # Select phase columns for the given panel_name (e.g., 'shilpa')
        cursor.execute("""
            SELECT phase 
            FROM panel 
            WHERE panel_name = %s
            And device_id = %s
        """, (controlGraph,device_id))

        phases = cursor.fetchall()
        print("Phases:---------", phases)    
        if not phases:
            print(f"No phases found for panel_name '{controlGraph}'.")
            socketio.emit('micro_graph_data', {'data': [], 'room': sid})
            return

        # Extract the phase columns (e.g., 'R1', 'Y1', 'B1', etc.)
        phase_columns = [phase[0] for phase in phases]

        print("Phase columns:", phase_columns)

        if len(phase_columns) == 0:
            print("No valid phase columns found.")
            # socketio.emit('micro_graph_data', [], room=sid)
            socketio.emit('micro_graph_data', {'data': [], 'room': sid})

            return

        # Build dynamic SQL for temperature graph based on phase columns
        query = f"""
            SELECT 
                DATE_FORMAT(sd.timestamp, '{time_format}') AS time_interval,
                {', '.join([f"ROUND(AVG(sd.{col}), 2) AS avg_{col}" for col in phase_columns])}
            FROM 
                temp_data sd
            WHERE 
                DATE(sd.timestamp) BETWEEN %s AND %s
                AND sd.device_id = %s
            GROUP BY 
                time_interval
            ORDER BY 
                time_interval ASC
        """

        # Execute the query
        cursor.execute(query, (start_date, end_date, device_id))
        results = cursor.fetchall()

        query = f"""
        SELECT MAX(threshold) FROM temp_data WHERE device_id = %s
        """
        cursor.execute(query, (device_id,))
        threshold = cursor.fetchone()
       
        threshold = [threshold[0]] if threshold and threshold[0] is not None else [0]
        print("threshold -->", threshold)

        # Format and send response
        formatted_data = []
        for row in results:
            row_data = {'minute': row[0]}
            for i, phase in enumerate(phase_columns):
                row_data[f'temperature_{phase}'] = row[i + 1]
            formatted_data.append(row_data)

        print("Sending data bro:")
        socketio.emit('micro_graph_data', {'data': formatted_data, 'phase_values': filtered_device_id, 'threshold': threshold, 'graph_duration': graph_duration, 'room': sid})


    except Exception as e:
        print("Database query failed:", e)
        socketio.emit('micro_graph_data', {'data': [], 'room': sid})



connect_mqtt()

if __name__ == '__main__':
    create_tables()
    socketio.run(app, host='0.0.0.0', port=5002, debug=True)

