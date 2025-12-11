from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
import mysql.connector
from datetime import datetime
import ssl
import logging
import time
import paho.mqtt.client as mqtt
import re 
import paho.mqtt.client as mqtt_client
import datetime
from collections import defaultdict

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Email server setup
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
SENDER_EMAIL = "evoluzn999@gmail.com"
SENDER_NAME = "Evoluzn Team"
SENDER_PASSWORD = "xwnu aqkp plbb ybme"  # Use App Password
EMAIL_RECEIVER = ["pbhoyar622@gmail.com"]

# ============================================================
# LOGGING CONFIG
# ============================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

# ============================================================
# DATABASE SETUP
# ============================================================
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

# ============================================================
# MQTT CONFIGURATION (EVOLUZN MQTT BROKER)
# ============================================================

broker = "evoluzn.org"
port = 18889
username = "evzin_led"
password = "63I9YhMaXpa49Eb"

def connect_mqtt():
    """Connect to MQTT broker and subscribe to topic."""
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("✅ Connected to MQTT Broker!")
            client.subscribe("#", qos=1)
        else:
            print(f"❌ Connection failed with code {rc}")

    client = mqtt_client.Client()
    client.username_pw_set(username, password)
    client.on_connect = on_connect
    client.on_message = on_message

    try:
        print("Connecting to MQTT broker...")
        client.connect(broker, port)
        client.loop_start()
    except Exception as e:
        print(f"❌ Exception occurred during connection: {e}")

    return client

# ============================================================
def on_message(client, userdata, message):
    try:
        payload = message.payload.decode()
        topic = message.topic
        logging.info(f"📩 MQTT Message on '{topic}': {payload}")

        conn = connect_db()
        cursor = conn.cursor()

        match = re.search(r"device_id:([A-Za-z0-9_-]+)", payload)
        if not match:
            logging.warning("⚠️ No device_id found in payload.")
            return

        device_id = match.group(1)
        logging.info(f"🔍 Extracted device_id: {device_id}")

        cursor.execute(
            """
            SELECT product_type 
            FROM product_details 
            WHERE serial_number = %s 
            AND product_type IN ('BTB4Channel', 'Plug')
            """,
            (device_id,)
        )
        product = cursor.fetchone()

        if not product:
            logging.warning(f"🚫 Unknown serial_number: {device_id}. Ignoring MQTT message.")
            return
        
        print("Product Details:", product)

        device_type = product[0] 
        logging.info(f"✅ Device found: type: {device_type}")

            # --- Parse payload values ---
        # Remove braces {} and split by ':'
        payload_clean = payload.strip("{}")
        parts = payload_clean.split(":")

        # Initialize defaults
        voltage1 = voltage2 = voltage3 = current1 = current2 = current3 = power1 = power2 = power3 = 0.0
        relay1 = relay2 = relay3 = relay4 = 0
        load_status = ""

        if device_type == "Single_Phase":
            # Expected format: {device_id:DEVICEID:VOLTAGE:CURRENT:POWER:LOADSTATUS}
            if len(parts) >= 6:
                voltage1 = float(parts[2])
                current1 = float(parts[3])
                power1 = float(parts[4])
                load_status = parts[5]

        elif device_type == "BTB4Channel":
            if len(parts) >= 11:
                voltage1 = float(parts[2])
                current1 = float(parts[3])
                power1 = float(parts[4])
                voltage2 = float(parts[5])
                current2 = float(parts[6])
                power2 = float(parts[7])
                relay1 = int(parts[8])
                relay2 = int(parts[9])
                relay3 = int(parts[10])
                relay4 = int(parts[11])

                print(f"Parsed BTB4Channel Data - V1: {voltage1}, I1: {current1}, P1: {power1}, V2: {voltage2}, I2: {current2}, P2: {power2}, R1: {relay1}, R2: {relay2}, R3: {relay3}, R4: {relay4}")

            
       # --- Insert into phase_data (MySQL format) ---
        cursor.execute("""
            INSERT INTO phase_data (
                device_id,
                voltage1, current1, power1,
                voltage2, current2, power2,
                voltage3, current3, power3,
                relay1, relay2, relay3, relay4,
                load_status, device_type
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s
            )
        """, (
            device_id, 
            voltage1, current1, power1,
            voltage2, current2, power2,
            voltage3, current3, power3,
            relay1, relay2, relay3, relay4,
            load_status, device_type
        ))

        conn.commit()
        logging.info(f"✅ Saved phase data for serial {device_id}")

    except Exception as e:
        logging.error(f"❌ Error processing MQTT message: {e}")
    finally:
        conn.close()

# ============================================================
mqtt_client_conn = connect_mqtt()
# ============================================================
# FLASK ROUTES

# @app.route('/btb4channel', methods=['POST', 'GET'])
# def btb4channel():

#     user_name = request.args.get('user_name')
#     company_name = request.args.get('company_name')

#     print("Userr Name ",user_name, "--> Company Name ", company_name)

#     conn = connect_db()
#     cursor = conn.cursor()

#     cursor.execute("""
#         SELECT serial_number
#         FROM product_details
#         WHERE company_name = %s
#         AND product_type = 'BTB4Channel'
#         AND FIND_IN_SET(%s, REPLACE(user_access, ' ', ''))
#     """, (company_name, user_name))

#     devices = cursor.fetchall()
#     print("Devices List:", devices)

#     device_data = {}

#     # Loop correctly (only device_name returned)
#     for (device_name,) in devices:
#         cursor.execute("""
#             SELECT *
#             FROM phase_data
#             WHERE device_id = %s
#             ORDER BY created_at DESC, id DESC
#             LIMIT 1
#         """, (device_name,))
        
#         last_record = cursor.fetchone()

#         if last_record:
#             columns = [column[0] for column in cursor.description]
#             record_dict = dict(zip(columns, last_record))

#             # Use product_type manually since not selected
#             dtype_key = "BTB4Channel"

#             device_data[dtype_key] = record_dict

#     format_strings = ','.join(['%s'] * len(devices))
#     cursor.execute(f"""
#         SELECT device_id, device_status 
#         FROM device_status
#         WHERE device_id IN ({format_strings})
#     """, tuple(devices))

#     status_rows = cursor.fetchall()
        
#     device_status_dict = {row['device_id']: row['device_status'] for row in status_rows}

#     # 4️⃣ Merge status into device_data
#     for device in device_names:
#         if device in device_data_dict:
#             device_data_dict[device]['status'] = device_status_dict.get(device, 'offline') 


#     conn.close()

#     # Step 3: Send to HTML
#     return jsonify({
#                 'status': 'success',
#                 'device_data': device_data
#             })

@app.route('/btb4channel', methods=['POST', 'GET'])
def btb4channel():

    user_name = request.args.get('user_name')
    company_name = request.args.get('company_name')

    print("User Name:", user_name, "--> Company Name:", company_name)

    conn = connect_db()
    cursor = conn.cursor(dictionary=True)   # Fetch rows as dict

    # 1️⃣ Get all BTB4Channel devices for this user/company
    cursor.execute("""
        SELECT serial_number
        FROM product_details
        WHERE company_name = %s
        AND product_type = 'BTB4Channel'
        AND FIND_IN_SET(%s, REPLACE(user_access, ' ', ''))
    """, (company_name, user_name))

    devices = [row['serial_number'] for row in cursor.fetchall()]
    print("Devices:", devices)

    if not devices:
        return jsonify({"status": "no devices", "data": {}})

    device_data = {}   # final response

    # 2️⃣ Get latest data for each device
    for device_name in devices:

        cursor.execute("""
            SELECT *
            FROM phase_data
            WHERE device_id = %s
            ORDER BY created_at DESC, id DESC
            LIMIT 1
        """, (device_name,))

        last_record = cursor.fetchone()

        if last_record:
            device_data[device_name] = last_record
        else:
            device_data[device_name] = {"device_id": device_name, "message": "no data"}

    # 3️⃣ Fetch status for all devices
    format_strings = ','.join(['%s'] * len(devices))

    cursor.execute(f"""
        SELECT device_id, device_status
        FROM device_status
        WHERE device_id IN ({format_strings})
    """, tuple(devices))

    status_rows = cursor.fetchall()

    # Convert to dictionary: { device_id: status }
    device_status = {row['device_id']: row['device_status'] for row in status_rows}

    # 4️⃣ Merge status into device_data
    for device in devices:
        device_data[device]['status'] = device_status.get(device, 'offline')

    cursor.close()
    conn.close()

    # 5️⃣ Return combined response
    return jsonify({
        "status": "success",
        "device_data": device_data
    })


# ============================================================
@app.route("/handle_on_off", methods=["POST"])
def handle_on_off():
    data = request.json
    device = data.get("device")
    intensity = data.get("intensity")

    if not device or intensity is None:
        return jsonify({"error": "Missing device_name or intensity"}), 400

    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        logging.info(f"🔌 On/Off Command - Device: {device}, Intensity: {intensity}")

        # Split device_type and device_name if colon exists
        if ":" in device:
            device_type, device_name = device.split(":", 1)
        else:
            device_type = device
            device_name = None

        # Validate device_name
        if not device_name:
            return jsonify({"error": "Invalid device format"}), 400

        # Construct MQTT topic and payload
        topic = f"{device_name}/control"
        payload = ""

        if device_type == "Single_Phase":
            payload = str(intensity)
        elif device_type == "BTB4Channel":
            relay_mapping = {"BTB1": "Relay1", "BTB2": "Relay2", "BTB3": "Relay3", "BTB4": "Relay4"}
            relay_key = device_name.split(":")[-1] 
            relay_column = relay_mapping.get(relay_key, None)
            relay_name = relay_mapping.get(relay_key, "RelayAll")
            payload = f"{relay_name}:{intensity}"
        else:
            return jsonify({"error": f"Unknown device type: {device_type}"}), 400

        logging.info(f"📡 Publishing MQTT → {topic} : {payload}")

        try:
            mqtt_client.publish(topic, payload)
            logging.info("✅ MQTT Publish successful")
            db_intensity = int(intensity) // 100


            if device_type == "BTB4Channel":
            # Get last row id
                cursor.execute("""
                    SELECT id FROM phase_data
                    WHERE device_id = %s
                    ORDER BY created_at DESC, id DESC
                    LIMIT 1
                """, (device_name,))
                last_row = cursor.fetchone()
                if last_row:
                    last_id = last_row[0]

                    print("Last Row ID to update:", last_id, int(intensity))

                    if relay_column:
                        # Update only one relay
                        cursor.execute(f"""
                            UPDATE phase_data
                            SET {relay_column} = %s
                            WHERE id = %s
                        """, (db_intensity, last_id))
                    else:
                        # Update all relays
                        cursor.execute("""
                            UPDATE phase_data
                            SET relay1=%s, relay2=%s, relay3=%s, relay4=%s
                            WHERE id=%s
                        """, (db_intensity, db_intensity, db_intensity, db_intensity, last_id))
                    conn.commit()
                    logging.info(f"✅ Updated phase_data last row for {device_name}")

        except Exception as e:
            logging.error(f"❌ MQTT Publish failed: {e}")
            return jsonify({"error": f"MQTT Publish failed: {e}"}), 500

        return jsonify({"status": "success", "device": device_name, "payload": payload})

    except Exception as e:
        logging.error(f"❌ Error in handle_on_off: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()



@socketio.on('single_phase_graph_data')
def single_phase_graph_data(data):
    try:
        print("Selected Data for single-phase graph:", data)
        start_date = data.get('startDate')
        end_date = data.get('endDate')
        timeselect = data.get('timeSelect')  # "today" or "range"
        graph_type = data.get('graphSelect')  # "power", "voltage", "current"
        print('graph_type-------------', graph_type, 'timeselect----------', timeselect)

        conn = connect_db()
        cursor = conn.cursor()

        # Map selected graph type to actual database column
        column_map = {
            'power': 'power1',
            'voltage': 'voltage1',
            'current': 'current1'
        }
        selected_column = column_map.get(graph_type, 'power1')  # default to power

        # ✅ Fetch all device_ids with device_type = 'Single_Phase'
        cursor.execute("SELECT DISTINCT device_id FROM phase_data WHERE device_type = 'Single_Phase'")
        device_ids = [row[0] for row in cursor.fetchall()]

        if not device_ids:
            print("⚠️ No devices found with device_type = 'Single_Phase'")
            socketio.emit('single_phase_graph_data_response', [], room=request.sid)
            return

        # Prepare placeholders for dynamic IN clause
        placeholders = ', '.join(['?'] * len(device_ids))

        if timeselect == "today" or (start_date == end_date and timeselect == "range"):
            # 🕒 Daily query (hourly averages for one or more devices)
            query = f"""
                WITH r AS (
                    SELECT 
                        CAST(strftime('%H', created_at) AS INTEGER) AS hour,
                        DATE(created_at) AS date,
                        ROUND(AVG({selected_column}), 2) AS avg_value
                    FROM 
                        phase_data
                    WHERE 
                        DATE(created_at) BETWEEN ? AND ?
                        AND device_id IN ({placeholders})
                    GROUP BY 
                        DATE(created_at), strftime('%H', created_at)
                )
                SELECT 
                    r.hour AS hour, 
                    ROUND(AVG(r.avg_value), 2) AS value
                FROM 
                    r
                GROUP BY 
                    r.hour
                ORDER BY 
                    r.hour;
            """
            params = [start_date, end_date] + device_ids
            cursor.execute(query, params)
            results = cursor.fetchall()
            response_data = [{'hour': int(row[0]), 'value': float(row[1])} for row in results]

        elif timeselect == "range" and start_date != end_date:
            # 📅 Range query (daily averages for multiple devices)
            query = f"""
                WITH r AS (
                    SELECT 
                        DATE(created_at) AS date,
                        ROUND(AVG({selected_column}), 2) AS avg_value
                    FROM 
                        phase_data
                    WHERE 
                        DATE(created_at) BETWEEN ? AND ?
                        AND device_id IN ({placeholders})
                    GROUP BY 
                        DATE(created_at)
                )
                SELECT 
                    r.date AS date, 
                    ROUND(AVG(r.avg_value), 2) AS value
                FROM 
                    r
                GROUP BY 
                    r.date
                ORDER BY 
                    r.date ASC;
            """
            params = [start_date, end_date] + device_ids
            cursor.execute(query, params)
            results = cursor.fetchall()
            response_data = [{'date': str(row[0]), 'value': float(row[1])} for row in results]

        else:
            response_data = []

        cursor.close()
        conn.close()

        socketio.emit('single_phase_graph_data_response', response_data, room=request.sid)
        print('socket_response', response_data)

    except Exception as e:
        print("Error in single_phase_graph_data:", e)
        socketio.emit('single_phase_graph_data_response', {'error': str(e)}, room=request.sid)

@app.route("/fourchannel_graph", methods=["POST"])
def fourchannel_graph():
    try:
        data = request.get_json(force=True)
        print("[MICRO-SERVICE] Received payload:", data)

        # ---------------------------
        # Validate required fields
        # ---------------------------
        required_keys = ["device_id", "start_date", "end_date", "graph_type", "time_select"]
        missing = [k for k in required_keys if not data.get(k)]

        if missing:
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing)}"
            }), 400

        device_id = data["device_id"]
        start_date = data["start_date"]
        end_date = data["end_date"]
        graph_type = data["graph_type"]
        time_select = data["time_select"]

        print("graph_type =", graph_type, ":: time_select =", time_select)

        # ---------------------------
        # MySQL DB Connection
        # ---------------------------
        conn = connect_db()
        cursor = conn.cursor(dictionary=True)

        # Column AVG mapping
        column_map = {
            'power': '(power1 + power2) / 2.0',
            'voltage': '(voltage1 + voltage2) / 2.0',
            'current': '(current1 + current2) / 2.0'
        }
        selected_column = column_map.get(graph_type, '(power1 + power2) / 2.0')

        cursor.execute("SELECT DISTINCT device_id FROM phase_data WHERE device_type = 'BTB4Channel'")
        device_ids = [row["device_id"] for row in cursor.fetchall()]

        if not device_ids:
            return jsonify({"status": "success", "graph_data": []})

        placeholders = ", ".join(["%s"] * len(device_ids))

        # ---------------------------
        # TODAY or same start/end
        # ---------------------------
        if time_select == "today" or (start_date == end_date and time_select == "range"):

            query = f"""
                SELECT 
                    HOUR(created_at) AS hour,
                    ROUND(AVG({selected_column}), 2) AS value
                FROM phase_data
                WHERE DATE(created_at) BETWEEN %s AND %s
                AND device_id IN ({placeholders})
                GROUP BY HOUR(created_at)
                ORDER BY hour ASC;
            """

            params = [start_date, end_date] + device_ids
            cursor.execute(query, params)
            results = cursor.fetchall()

            response_data = [
                {"hour": int(row["hour"]), "value": float(row["value"])}
                for row in results
            ]

        # ---------------------------
        # DATE RANGE (multiple days)
        # ---------------------------
        elif time_select == "range" and start_date != end_date:

            query = f"""
                SELECT 
                    DATE(created_at) AS date,
                    ROUND(AVG({selected_column}), 2) AS value
                FROM phase_data
                WHERE DATE(created_at) BETWEEN %s AND %s
                AND device_id IN ({placeholders})
                GROUP BY DATE(created_at)
                ORDER BY date ASC;
            """

            params = [start_date, end_date] + device_ids
            cursor.execute(query, params)
            results = cursor.fetchall()

            response_data = [
                {"date": str(row["date"]), "value": float(row["value"])}
                for row in results
            ]

        else:
            response_data = []

        cursor.close()
        conn.close()

        # ---------------------------
        # FINAL RETURN TO GATEWAY
        # ---------------------------
        return jsonify({
            "status": "success",
            "graph_data": response_data
        })

    except Exception as e:
        print("❌ Error in microservice:", e)
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ============================================================
if __name__ == "__main__":
    mqtt_client = connect_mqtt()
    mqtt_client.loop_start()

    logging.info("🚀 Flask-SocketIO MQTT System Running...")
    socketio.run(app, host="0.0.0.0", port=5005, debug=True, use_reloader=False)
