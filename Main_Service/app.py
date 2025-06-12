from flask import Flask, jsonify, make_response, request, render_template, redirect, url_for,session
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from werkzeug.utils import secure_filename
import requests
from flask_socketio import SocketIO, emit
import socketio as socketio_client
from socketio.exceptions import ConnectionError
import paho.mqtt.client as mqtt
import random
from datetime import datetime

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# === SOCKET.IO CLIENT TO MICRO SERVICE ===
micro_client = socketio_client.Client()

WTS_URL = 'http://192.168.0.223:5002'
RUNNING_URL = 'http://192.168.0.223:5003'

SECRET_KEY = 'evoluzn@123'

# MySQL Database connection details
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

    # SQL queries to create tables if they don't exist
    create_user_table_query = """
        CREATE TABLE IF NOT EXISTS user_table (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_name VARCHAR(255),
            email VARCHAR(100) UNIQUE,
            password VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            is_admin BOOLEAN DEFAULT FALSE,
            inserttimestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            profile_img varchar(255) DEFAULT NULL
        );
    """

    create_admin_table_query = """
        CREATE TABLE IF NOT EXISTS device_table(
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_name VARCHAR(50) NOT NULL,
            device_type VARCHAR(255) NOT NULL,
            device_name VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            graph_duration INT DEFAULT 60,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """
    temp_data_query = ("""
        CREATE TABLE IF NOT EXISTS temp_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            device_id VARCHAR(50),
            R1 FLOAT, Y1 FLOAT, B1 FLOAT,
            R2 FLOAT, Y2 FLOAT, B2 FLOAT,
            R3 FLOAT, Y3 FLOAT, B3 FLOAT,
            N FLOAT, threshold INT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    pannel_table_query = ("""
        CREATE TABLE IF NOT EXISTS panel (
            id INT NOT NULL AUTO_INCREMENT,
            device_id VARCHAR(50) NOT NULL,
            panel_name VARCHAR(20) NOT NULL,
            phase VARCHAR(10) NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY unique_device_panel (device_id, panel_name, phase)
        )
    """)

    sensor_data_query = ("""
        CREATE TABLE IF NOT EXISTS sensor_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            device_type VARCHAR(50),
            device_id VARCHAR(50),
            device_status VARCHAR(50),
            auto_motion_status VARCHAR(50),
            intensity FLOAT,
            power FLOAT,
            temperature FLOAT,
            auto_brightness_status VARCHAR(50),
            voltage FLOAT,
            current FLOAT,
            inserttimestamp DATETIME,
            lux INT,
            UNIQUE (device_id, inserttimestamp)
        );
    """)

    # ALTER TABLE alert_temp ADD UNIQUE unique_index (device_name, timestamp)
    conn.commit()

    try:
        # Execute the queries
        cursor.execute(create_user_table_query)
        cursor.execute(create_admin_table_query)
        cursor.execute(temp_data_query)
        cursor.execute(pannel_table_query)
        cursor.execute(sensor_data_query)
        conn.commit()
        print("Tables created successfully.")
    except mysql.connector.Error as err:
        print(f"Error creating tables: {err}")
    finally:
        cursor.close()
        conn.close()


def create_panels_for_devices(cursor):
    # Get devices from temp_data that are not yet in panel table
    cursor.execute("""
        SELECT DISTINCT sd.* 
        FROM temp_data sd
        LEFT JOIN panel p ON sd.device_id = p.device_id
        WHERE p.device_id IS NULL
    """)
    sensor_rows = cursor.fetchall()

    if not sensor_rows:
        return  # No new devices needing panels

    for row in sensor_rows:
        device_id = row['device_id']

        phase_groups = {
            "Control Panel 1": ['R1', 'Y1', 'B1'],
            "Control Panel 2": ['R2', 'Y2', 'B2'],
            "Control Panel 3": ['R3', 'Y3', 'B3'],
        }

        control_panels = {}

        # Even though we expect no panels, still fetch existing (for safety)
        cursor.execute("SELECT DISTINCT panel_name, phase FROM panel WHERE device_id = %s", (device_id,))
        existing_panels = cursor.fetchall()
        existing_phases = {p['phase']: p['panel_name'] for p in existing_panels}

        for panel_name, phases in phase_groups.items():
            available_phases = [phase for phase in phases if phase in row and row[phase] is not None]
            if available_phases:
                matched_panel = next((existing_phases[phase] for phase in available_phases if phase in existing_phases), None)
                final_panel_name = matched_panel or panel_name
                control_panels.setdefault(final_panel_name, []).extend(available_phases)

        # Handle neutral line
        if 'N' in row and row['N'] is not None and control_panels:
            last_panel = list(control_panels.keys())[-1]
            control_panels[last_panel].append('N')

        # Insert panel data
        for panel_name, phases in control_panels.items():
            for phase in set(phases):
                cursor.execute("""
                    INSERT INTO panel (device_id, panel_name, phase)
                    VALUES (%s, %s, %s)
                    ON DUPLICATE KEY UPDATE device_id = device_id
                """, (device_id, panel_name, phase))

def get_user_name_from_token():
    token = request.cookies.get('token')
    if not token:
        return redirect('/')

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return redirect('/')

    user_id = payload.get('user_id')
    email = payload.get('email')
    if not user_id:
        return jsonify({'message': 'Invalid token payload'}), 400

    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT Company_name FROM user_table WHERE id = %s", (user_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    if not result:
        return jsonify({'message': 'User not found'}), 404

    return {
        'user_id': user_id,
        'email': email,
        'company_name': result[0]
    }

broker = "203.109.124.70"
port = 18889    
mqttc = mqtt.Client()

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT broker")
    else:
        print(f"Failed to connect to MQTT broker with return code {rc}")

def on_disconnect(client, userdata, rc):
    if rc != 0:
        print("Disconnected from MQTT broker. Trying to reconnect...")
        mqttc.reconnect()


def on_message(client, userdata, message):
    print(f"Received message on topic {message.topic}: {message.payload}")
    try:
        print("on_message called")
        payload = message.payload.decode()
        topic = message.topic
        conn = connect_db()
        cursor = conn.cursor()
        # Initialize all possible variables
        device_type = None
        device_id = None
        device_status = None
        auto_motion_status = None
        intensity = None
        power = None
        temperature = None
        auto_brightness_status = None
        voltage = None
        current = None
        lux = None

        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:00')

        
        if "oeeStat" in topic:
            current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            device_type = "oee"
            payload_str = payload.strip("{}")
            split_payload = payload_str.split(":")
            if len(split_payload) >= 6:
                device_id = split_payload[1]
                voltage = split_payload[2]
                current = split_payload[3]
                power = split_payload[4]
                device_status = split_payload[5]

                if device_id and device_id != '300':
                    query = """
                        INSERT INTO oee_stats (device_name, voltage, current, power, deviceStatus, inserttimestamp)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                            voltage = VALUES(voltage),
                            current = VALUES(current),
                            power = VALUES(power),
                            deviceStatus = VALUES(deviceStatus)"""
                    val = (device_id, voltage, current, power, device_status, current_time)
                    cursor.execute(query, val)
                    conn.commit()
        else:
            payload_str = payload.strip("{}")
            print("payload_str:", payload_str)
            split_payload = payload_str.split(":")
            print("split_payload:", split_payload)

            if device_type is None:
                if "highbay" in topic:
                    device_type = "highbay"
                elif "plug" in topic:
                    device_type = "plug"
                elif "office" in topic:
                    device_type = "office"
                elif "tube" in topic:
                    device_type = "tube"

            if device_type == "highbay":
                socketio.emit('highbay', split_payload)
                if len(split_payload) >= 4:
                    device_id = split_payload[1]
                    device_status = split_payload[2]
                    power = random.randint(80, 100) if int(device_status) >= 1 else 0
                    auto_motion_status = split_payload[3]

            elif device_type == "plug":            
                socketio.emit('plug', split_payload)
                if len(split_payload) >= 6:
                    device_id = split_payload[1]
                    voltage = split_payload[2]
                    current = split_payload[3]
                    power = split_payload[4]
                    device_status = split_payload[5]                           
            elif device_type in ["office", "tube"]:                                  
                if len(split_payload) >= 8:
                    device_id = split_payload[1]
                    intensity = split_payload[2]
                    device_status = split_payload[3]
                    temperature = split_payload[5]
                    auto_brightness_status = split_payload[6]
                    auto_motion_status = split_payload[7]

                    if device_type == "office":
                        power = 48 if int(device_status) == 1 else 0
                    else:
                        # power = split_payload[4]
                        lux = split_payload[8]
                        lux_diff = 1100 - int(lux)
                        print("lux_diff:", lux_diff)
                        light_int = lux_diff/900
                        print("light_int:", light_int)
                        cal_power = 48 * light_int
                        print("cal_power:", cal_power)
                        # power = ((int(cal_power) + 9) // 10) * 10
                        power = min(max(((cal_power - 1) // 5 + 1) * 5, 0), 48)
                        print("power:", power)


            if device_id and device_id != '300':
                query = """
                    INSERT INTO sensor_data (device_type, device_id, device_status, auto_motion_status, intensity, power, temperature, auto_brightness_status, voltage, current, inserttimestamp, lux) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                val = (device_type, device_id, device_status, auto_motion_status, intensity, power, temperature, auto_brightness_status, voltage, current, current_time, lux)
                cursor.execute(query, val)
                conn.commit()
                print(f"Inserted data for device_id: {device_id}")
            else:        
                topic_without_status = topic.split("/")[0]
                payload_with_topic = payload_str + ":" + topic_without_status
                                                                
                if device_type in ["highbay", "plug", "office"] or topic.startswith("tube"):
                    socketio.emit(device_type, payload_with_topic)

    except Exception as e:
        e
        print(f"Error: {e}")


mqttc.on_connect = on_connect
mqttc.on_message = on_message
    
def mqtt_connect():
    try:
        print("Connecting to MQTT broker...")
        # mqttc.username_pw_set(username,password)								  
        mqttc.connect(broker, port)
        mqttc.loop_start()
        mqttc.subscribe("#", qos=1)
    except Exception as e:
        e
        # print(f"Error connecting to MQTT broker: {e}")

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    CompanyName = data.get('full_name')
    email = data.get('email')
    password = data.get('password')
    is_active = 0
    is_admin = 0

    if not all([CompanyName, email, password]):
        return jsonify({'status': 'error', 'message': 'All fields are required'}), 400

    hashed_password = generate_password_hash(password)

    conn = connect_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
                    INSERT INTO user_table(company_name, email, password, is_active, is_admin)
                    VALUES (%s, %s, %s, %s, %s)
                """, (CompanyName, email, hashed_password, is_active, is_admin))
        
        conn.commit()
        return jsonify({'status': 'success', 'message': 'Registration successful!'}), 201
    except mysql.connector.IntegrityError:
        return jsonify({'status': 'error', 'message': 'Email already registered'}), 409
    finally:
        cursor.close()
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    print(f"Generated token for user {email}: {password}")

    if not email or not password:
        return jsonify({'status': 'error', 'message': 'Email and password are required'}), 400

    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, Company_name, password FROM user_table WHERE email = %s", (email,))
    result = cursor.fetchone()
    conn.close()

    if result and check_password_hash(result[2], password):
        user_id = result[0]
        Company_name = result[1]
        
        # Create payload with expiry
        payload = {
            'user_id': user_id,
            'CompanyName': Company_name,
            'email': email,
            'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=2)
        }

        # Generate JWT token
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

        # Optionally, you can redirect to a dashboard or return a success message

        resp = make_response(jsonify({'status': 'success', 'email': email}))

        resp.set_cookie('token', token, max_age=2*24*60*60)  # 2 days in seconds
        return resp
    
    else:
        return jsonify({'status': 'error', 'message': 'Invalid email or password', 'redirect_url': url_for('index')}), 401

@app.route('/admin', methods=['GET', 'POST'])
def admin_page():
    return render_template('admin.html')

@app.route('/add_device', methods=['POST'])
def add_admin():
    data = request.get_json()
    company_name = data.get('company_name')
    device_data = data.get('device_data')
    device_duration = data.get('device_duration')

    token = request.cookies.get('token')
    if not token:
        return redirect('/')  # No token, go to login

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return redirect('/')  # Invalid or expired token, go to login

    email = payload.get('email')

    conn = connect_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # Step 1: Validate admin
        cursor.execute(
            "SELECT company_name, is_admin FROM user_table WHERE email = %s",
            (email,)
        )
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        if not user['is_admin']:
            return jsonify({"status": "error", "message": "You are not authorized to add devices."}), 403

        if not company_name or not device_data:
            return jsonify({"status": "error", "message": "Missing company name or device data"}), 400

        # Step 2: Insert all devices
        insert_query = """
            INSERT INTO device_table (company_name, device_type, device_name, graph_duration)
            VALUES (%s, %s, %s, %s)
        """
        new_device_ids = []
        for device in device_data:
            device_type = device.get('device_type')
            device_name = device.get('device_name')

            if not device_type or not device_name:
                continue  # Skip invalid data

            cursor.execute(insert_query, (company_name, device_type, device_name, device_duration))
            new_device_ids.append(cursor.lastrowid)
            create_panels_for_devices(cursor)

        # print("radhe radhe", new_device_ids)
        conn.commit()

        return jsonify({"status": "success", "message": "Devices and panels added successfully!"})

    except mysql.connector.Error as err:
        print(f"Database Error: {err}")
        return jsonify({"status": "error", "message": "Database error occurred."}), 500

    finally:
        cursor.close()
        conn.close()

@app.route('/logout')
def logout():
    token = request.cookies.get('token')

    if not token:
        return redirect('/')  # Already logged out or never logged in

    try:
        # Optional: You can decode to verify token before logout, but not strictly needed
        jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        pass  # Token is invalid or expired — treat as logged out

    # Create a response to clear the cookie
    resp = make_response(redirect('/'))
    resp.set_cookie('token', '', expires=0)

    return resp


@app.route('/home')
def home():
    result = get_user_name_from_token()
    print("wtstempsync page", result)
    name = result.get('company_name', 'Guest')

    return render_template('main_dashboard.html', name=name)


# ======================= WTS Microservice Integration START =======================

try:
    micro_client.connect(WTS_URL)
    print("Connected to WTS service.")
except ConnectionError as e:  # ✅ Use imported ConnectionError
    print(f"[WARNING] Could not connect to WTS service at {WTS_URL}: {e}")

@app.route('/wtstempsync')
def wtstempsync():
    result = get_user_name_from_token()
    user_id = result.get('user_id')
    email = result.get('email')
    name = result.get('company_name')

    # Make request to microservice
    try:
        response = requests.get(f'{WTS_URL}/home', params={'email': email})
        micro_data = response.json()

        if micro_data.get('status') != 'success':
            return jsonify({'message': 'Error fetching device data'}), 500

        device_data = micro_data['device_data']
        result_data = micro_data['result']
        alerts = micro_data['alerts']

        print("micro_data Data", micro_data)

        print("Alerts", type(alerts))

        return render_template(
            'dashboard23.html',
            name=name,
            device_data=device_data,
            result=result_data,
            alerts=alerts
        )

    except requests.exceptions.RequestException as e:
        print(f"Request to microservice failed: {e}")
        return jsonify({'message': 'Failed to connect to microservice'}), 500

@app.route('/update_panel', methods=['POST'])
def update_panel():
    print("update panel page")
    if request.method == 'POST':
        data = request.get_json()
        print("Received data:", data)

        try:
            # Forward the request to the microservice
            response = requests.post(f'{WTS_URL}/update_panel', json=data)

            # Check if microservice responded successfully
            if response.status_code == 200:
                micro_data = response.json()
                print("micro_data -->", micro_data)
                return jsonify(micro_data), 200
            else:
                print("Microservice error:", response.text)
                return jsonify({
                    "status": "error",
                    "message": "Microservice failed",
                    "details": response.text
                }), response.status_code

        except requests.exceptions.RequestException as e:
            print("Request to microservice failed:", e)
            return jsonify({
                "status": "error",
                "message": "Failed to reach microservice",
                "details": str(e)
            }), 503
    else:
        return jsonify({"status": "error", "message": "Invalid request method"}), 405

@app.route('/graph/<device_id>', methods=['GET'])
def temperature(device_id):

    result = get_user_name_from_token()
    user_id = result.get('user_id')
    email = result.get('email')
    company_name = result.get('company_name')

    # Make request to microservice
    try:
        response = requests.get(f'{WTS_URL}/graph_page', params={'device_id': device_id})
        micro_data = response.json()

        print("micro_data Data-->", micro_data)

        if micro_data.get('status') != 'success':
            return jsonify({'message': 'Error fetching device data'}), 500

        device_id = micro_data['device_id']
        device_data = micro_data['device_data']
        alertsindivisual = micro_data['alertsindivisual']

        return render_template(
            'temperature_graph.html',
            device_id=device_id,
            device_data=device_data,
            alertsindivisual=alertsindivisual
        )

    except requests.exceptions.RequestException as e:
        print(f"Request to microservice failed: {e}")
        return jsonify({'message': 'Failed to connect to microservice'}), 500


@app.route('/publish_threshold', methods=['POST'])
def publish_threshold():
    data = request.get_json()
    print("Received data from frontend:", data)

    try:
        # Forward the request to the Micro_Service
        response = requests.post(f'{WTS_URL}/micro_publish', json=data)

        # Return the response from microservice to frontend
        return jsonify(response.json()), response.status_code

    except Exception as e:
        print(f"Error forwarding to microservice: {e}")
        return jsonify({"error": "Failed to reach microservice", "details": str(e)}), 500

@app.route('/delete_alert', methods=['POST'])
def delete_alert():
    data = request.get_json()
    print("Received data for alert deletion:", data)

    try:
        # Forward the request to the Micro_Service
        response = requests.post(f'{WTS_URL}/delete_alert', json=data)
        print("Forwarded to microservice, response:", response.text)

        # Return the response from microservice to frontend
        return jsonify(response.json()), response.status_code

    except Exception as e:
        print(f"Error forwarding to microservice: {e}")
        return jsonify({"error": "Failed to reach microservice", "details": str(e)}), 500


# === SOCKET.IO FOR DASHBOARD FRONTEND ===
@socketio.on('connect')
def on_user_connect():
    print("[Main] Frontend connected")

@socketio.on('user_connected')
def user_connected(data):
    email = data.get('email')
    print(f"[Main] User connected: {email}")
    micro_client.emit('start_stream', {'email': email})

@micro_client.on('micro_data')
def handle_micro_data(data):
    socketio.emit('update_temperature', data)

# === SOCKET.IO FOR TEMPERATURE GRAPH FRONTEND ===

@socketio.on('temperature_graph_data')
def temperature_graph_data(data):
    print("Received temperature graph data:", data )
    email = data.get('email')
    print(f"[Main] User connected: {email}")
    micro_client.emit('get_temperature_graph_data', data)

@micro_client.on('micro_graph_data')
def handle_micro_data(data):
    socketio.emit('send_temperature_graph_data', data)
    
@micro_client.on('micro_new_alert')
def handle_alert_data(data):
    print("[Main] Received alert data from microservice:", data)
    socketio.emit('new_alert', data)

@micro_client.event
def disconnect():
    print("[Main] Disconnected from Microservice")

# ======================= WTS Microservice Integration END =======================

# ======================= MicroService For Running Light  START ========================
try:
    micro_client.connect(RUNNING_URL)
    print("Connected to Running service.")
except ConnectionError as e:  # ✅ Use imported ConnectionError
    print(f"[WARNING] Could not connect to Running service at {RUNNING_URL}: {e}")



@app.route('/running_light', methods=['GET', 'POST'])
def running_light():

    return render_template('running_light.html')

# ======================= MicroService For Running Light END ========================

# Route to handle favicon.ico requests and return a 404 response
@app.route('/favicon.ico')
def favicon():
    return '', 200

mqtt_connect()

if __name__ == '__main__':
    create_tables()
    # app.run(debug=True)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)

