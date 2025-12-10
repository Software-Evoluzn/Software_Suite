from flask import Flask, jsonify, make_response, request, render_template, redirect, url_for,session
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import time
from time import sleep
import os
from werkzeug.utils import secure_filename
import requests
from flask_socketio import SocketIO, emit, join_room
import socketio as socketio_client
from socketio.exceptions import ConnectionError
import paho.mqtt.client as mqtt_client
import random
from flask_cors import CORS
# from datetime import timezone
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import openpyxl
from openpyxl import Workbook		
import tempfile
from flask import send_file

# from flask_socketio import join_room

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# === SOCKET.IO CLIENT TO MICRO SERVICE ===
micro_client = socketio_client.Client()

WTS_URL = 'http://192.168.1.25:5002'
RUNNING_URL = 'http://192.168.1.19:5003'
OFFICE_URL = 'http://192.168.1.19:5004'
BTB_URL = 'http://192.168.1.25:5005'

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

    create_user_table_query = """
        CREATE TABLE IF NOT EXISTS user_table (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_name VARCHAR(255) DEFAULT NULL,
            name VARCHAR(255) DEFAULT NULL,
            email VARCHAR(100) UNIQUE,
            password VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            is_admin BOOLEAN DEFAULT FALSE,
            inserttimestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            profile_img VARCHAR(255) DEFAULT NULL,
            contact_no VARCHAR(20) DEFAULT NULL,
            unit_name VARCHAR(255) DEFAULT NULL,
            contact_number VARCHAR(20) DEFAULT NULL,
            contact_person BOOLEAN DEFAULT FALSE
        );
    """
    create_company_details_query = """
        CREATE TABLE IF NOT EXISTS company_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_name VARCHAR(255) NOT NULL,
            company_address TEXT NOT NULL,
            gst_no VARCHAR(50) NOT NULL,
            unit_name VARCHAR(255),
            unit_address TEXT,
            unit_gst VARCHAR(50) DEFAULT NULL,
            inserttimestamp DATETIME DEFAULT CURRENT_TIMESTAMP
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

    device_status_table_query = ("""
       CREATE TABLE IF NOT EXISTS device_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(50) NOT NULL,
        device_status VARCHAR(20) DEFAULT 'offline',
        last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    """)


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

    product_query = ("""
            CREATE TABLE IF NOT EXISTS product (
                product_name VARCHAR(100) NOT NULL,
                UNIQUE KEY unique_product_name (product_name)
            );
        """)
    
    product_details_query = ("""
        CREATE TABLE product_details (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_name VARCHAR(255) NOT NULL,
            product_type VARCHAR(100) NOT NULL,
            date_of_purchase DATE NOT NULL,
            warranty_period INT NOT NULL,  -- assuming this is in months; change if needed
            serial_number VARCHAR(100) NOT NULL UNIQUE,
            user_access VARCHAR(255) NOT NULL  ,
            graph_duration INT DEFAULT 60,
            inserttimestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP                   
        );
    """)

    btb4channel_query = ("""
        CREATE TABLE IF NOT EXISTS phase_data (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    device_id TEXT,
                    voltage1 REAL,
                    current1 REAL,
                    power1 REAL,
                    voltage2 REAL,
                    current2 REAL,
                    power2 REAL,
                    voltage3 REAL,
                    current3 REAL,
                    power3 REAL,
                    relay1 INTEGER,
                    relay2 INTEGER,
                    relay3 INTEGER,
                    relay4 INTEGER,
                    load_status TEXT,
                    device_type TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
         """)

    # ALTER TABLE alert_temp ADD UNIQUE unique_index (device_name, timestamp)
    conn.commit()

    try:
        # Execute the queries
        cursor.execute(create_user_table_query)
        cursor.execute(create_company_details_query) 
        cursor.execute(create_admin_table_query)
        cursor.execute(device_status_table_query)
        cursor.execute(temp_data_query)
        cursor.execute(pannel_table_query)
        cursor.execute(sensor_data_query)
        cursor.execute(btb4channel_query)
        cursor.execute(product_query)
        cursor.execute(product_details_query)
        conn.commit()
        print("Tables created successfully.")
    except mysql.connector.Error as err:
        print(f"Error creating tables: {err}")
    finally:
        cursor.close()
        conn.close()

# to create panels for devices that are not yet in the panel table
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
        return None

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
    cursor.execute("SELECT Company_name, name, is_admin FROM user_table WHERE id = %s", (user_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    if not result:
        return jsonify({'message': 'User not found'}), 404

    return {
        'user_id': user_id,
        'email': email,
        'company_name': result[0],
        'username': result[1],
        'admin': result[2]
    }

broker = "evoluzn.org"
port = 18889
username = "evzin_led"
password = "63I9YhMaXpa49Eb"  
# mqttc = mqtt.Client()


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


def on_disconnect(client, userdata, rc):
    if rc != 0:
        print("Disconnected from MQTT broker. Trying to reconnect...")
        mqttc.reconnect()

def on_message(client, userdata, message):
    print(f"Received message on topic {message.topic}: {message.payload}")
    try:
        print("on_message called")
        payload = message.payload.decode()
        print("Decoded payload:", payload)
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

        status = payload.replace("{", "").replace("}", "")

        data = status.split(":")

        if len(data) == 2:
            device_id = data[0].strip()
            status = data[1].strip().lower()   # normalize

            # print(f"📡 Parsed Data: ID={device_id}, Status={status}")

            # Check if status is online/offline
            if status in ["online", "offline"]:
                save_device_status(device_id, status)
                return
            else:
                print("⚠️ Unknown status received, ignoring...")
                    


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
                    print("Sending data to emit")
                    socketio.emit(device_type, payload_with_topic)

    except Exception as e:
        e
        print(f"Error: {e}")

mqtt_client_conn = connect_mqtt()

def save_device_status(device_id, status):
    conn = connect_db()
    cursor = conn.cursor(buffered=True)

    try:
        cursor.execute("SELECT id FROM product_details WHERE serial_number = %s", (device_id,))
        result = cursor.fetchone()

        if result is None:
            return

        # Update OR insert
        cursor.execute("""
            INSERT INTO device_status (device_id, device_status, last_update)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE
                device_status = VALUES(device_status),
                last_update = VALUES(last_update)
        """, (device_id, status, datetime.now()))

        conn.commit()
        print(f"Device {device_id} status updated to {status}")
        socketio.emit('status_update', {
            'device_id': device_id,
            'device_status': status
        })

    except mysql.connector.Error as err:
        print("MySQL Error:", err)

    finally:
        cursor.close()
        conn.close()



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
    cursor.execute("SELECT id, Company_name, password, is_admin FROM user_table WHERE email = %s", (email,))
    result = cursor.fetchone()
    conn.close()

    if result and check_password_hash(result[2], password):
        user_id = result[0]
        Company_name = result[1]
        is_admin = result[3]
        
        # Create payload with expiry
        payload = {
            'user_id': user_id,
            'CompanyName': Company_name,
            'email': email,
            'is_admin': is_admin,
            'exp': datetime.now(timezone.utc) + timedelta(days=2)
        }

        # Generate JWT token
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

        # Optionally, you can redirect to a dashboard or return a success message

        resp = make_response(jsonify({
            'status': 'success',
            'email': email,
            'is_admin': is_admin
        }))

        resp.set_cookie('token', token, max_age=2*24*60*60)  # 2 days in seconds
        return resp
    
    else:
        return jsonify({'status': 'error', 'message': 'Invalid email or password', 'redirect_url': url_for('index')}), 401

@app.route('/admin', methods=['GET', 'POST'])
def admin_page():
    return render_template('company_registration.html')

# --- Updated Flask Route ---
@app.route('/company-details', methods=['GET', 'POST'])
def insert_company_details():
    print('inside function')
    data = request.get_json()
    company_name = data.get('company_name')
    company_address = data.get('company_address')
    gst_no = data.get('gst_no')
    units = data.get('units', [])
    print("Inserting units:", units)
    users = data.get('users', [])

    if not all([company_name, company_address, gst_no]):
        return jsonify({'status': 'error', 'message': 'Company name, address, and GST No are required.'}), 400

    try:
        conn = connect_db()
        cursor = conn.cursor()

        # Insert into company_details (1 entry per unit)
        if units:
            for unit in units:
                cursor.execute("""
                    INSERT INTO company_details (company_name, company_address, gst_no, unit_name, unit_address, unit_gst)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (company_name, company_address, gst_no, unit['unit_name'], unit['unit_address'], unit['unit_gst']))

        else:
        # Insert company record with NULL for unit details
            cursor.execute("""
                INSERT INTO company_details (company_name, company_address, gst_no, unit_name, unit_address, unit_gst)
                VALUES (%s, %s, %s, NULL, NULL, NULL)
            """, (company_name, company_address, gst_no))


        # Insert users (admin + additional)
        for user in users:
            hashed_password = generate_password_hash(user['password'])

            cursor.execute("""
                INSERT INTO user_table (company_name, name, contact_no, email, password, unit_name, is_admin, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                company_name,
                user['username'],
                user['contact'],
                user['email'],
                hashed_password,
                user['unit_name'],
                False,
                True
            ))

        conn.commit()
        return jsonify({'status': 'success', 'message': 'Company and users registered successfully'}), 201

    except Exception as e:
        print("DB Error:", str(e))
        return jsonify({'status': 'error', 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@app.route('/admin_dashboard', methods=['GET'])
def admin_dashboard():
    try:
        conn = connect_db()
        cursor = conn.cursor()

        # Get distinct company names
        cursor.execute("SELECT DISTINCT company_name FROM company_details")
        companies = cursor.fetchall()  # returns list of tuples: [('AQUARELLE',), ('BOSCH',), ...]

        return render_template('admin_dashboard.html', companies=companies)

    except Exception as e:
        print("Error:", e)
        return "Error loading admin dashboard", 500

    finally:
        cursor.close()
        conn.close()
       
@app.route('/product_registration', methods=['GET', 'POST'])
def product_registration():
    company = request.args.get('company')
    print("Company name in product registration:", company)

    conn = connect_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM product")
    products = cursor.fetchall()
    cursor.execute("SELECT * from company_details where company_name = %s", (company,))
    companies=cursor.fetchall()
    cursor.execute("SELECT * from user_table where company_name = %s", (company,))
    users = cursor.fetchall()
    print("Companies in product registration:", users)
    return render_template('product_registration.html', company=company, products=products, companies=companies,users=users)

@app.route('/add_device', methods=['POST'])
def add_admin():
    data = request.get_json()
    company_name = data.get('company_name')
    product_data = data.get('product_data')

    print("Received data:", data)

    token = request.cookies.get('token')
    if not token:
        if request.is_json:
            return jsonify({"status": "error", "message": "Unauthorized: No token"}), 401
        return redirect('/')  # No token, go to login

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
         if request.is_json:
                return jsonify({"status": "error", "message": "Invalid or expired token"}), 401
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

        if not company_name or not product_data:
            return jsonify({"status": "error", "message": "Missing company name or product data"}), 400

        # --- Optional: Handle device_data here only if needed ---
        # If you no longer use deviceData, comment this block or adapt it.
        # Example placeholder:
        # device_data = data.get('device_data', [])

        # --- Step 2: Insert into product_details ---
        product_insert_query = """
            INSERT INTO product_details (company_name, product_type, date_of_purchase, warranty_period, serial_number, user_access)
            VALUES (%s, %s, %s, %s, %s, %s)
        """

        for product in product_data:
            product_type = product.get('product_type')
            date_of_purchase = product.get('date_of_purchase')
            warranty_period = product.get('warranty_period')
            serials = product.get('serials', [])

            for serial in serials:
                serial_number = serial.get('serial_number')
                user_access_list = serial.get('user_access', [])
                user_access_str = ', '.join(user_access_list)

                # Validate before inserting
                if not all([product_type, date_of_purchase, warranty_period, serial_number]):
                    continue  # Skip if any value missing

                try:
                    cursor.execute(product_insert_query, (
                        company_name,
                        product_type,
                        date_of_purchase,
                        int(warranty_period),
                        serial_number,
                        user_access_str
                    ))
                    # print("product----->" ,product_type)
                  
                    if product_type == "Wiretempsync":
                        print("product----->" ,product_type)
                        create_panels_for_devices(cursor)

                except mysql.connector.Error as err:
                    print(f"Error inserting serial '{serial_number}': {err}")
                    continue

        conn.commit()

        return jsonify({"status": "success", "message": "Products registered successfully!"})

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


def get_products_for_company(company_name, username):
    username = username.lower()

    conn = connect_db()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT product_type, user_access, serial_number
        FROM product_details 
        WHERE company_name = %s
    """
    cursor.execute(query, (company_name,))
    rows = cursor.fetchall()

    allowed_product_types = []

    for row in rows:
        access = row.get("user_access", "")

        if not access:
            continue

        # Normalize
        access_list = [u.strip().lower() for u in access.split(",")]

        if username in access_list:
            allowed_product_types.append(row["product_type"])

    cursor.close()
    conn.close()

    return allowed_product_types

@app.context_processor
def inject_user_products():
    default = {'products': [], 'company_name': 'Guest', 'username': None}
    
    token_info = get_user_name_from_token()
    if not token_info:
        return default

    company_name = token_info.get('company_name', 'Guest')
    username = token_info.get('username')
    if not username:
        return default

    product_rows = get_products_for_company(company_name, username)
    
    # Ensure it's a list
    if isinstance(product_rows, str):
        # maybe a single product name as string
        product_rows = [product_rows]
    elif not isinstance(product_rows, list):
        product_rows = []

    # If elements are dicts, extract 'product_type', else use the string directly
    product_types = []
    for p in product_rows:
        if isinstance(p, dict):
            product_types.append(p.get('product_type'))
        elif isinstance(p, str):
            product_types.append(p)

    # print("Injected products for user:", product_types, product_rows)

    return {
        'products': product_types,
        'company_name': company_name,
        'username': username
    }


# @app.route('/home')
# def home():
#     result = get_user_name_from_token()
#     print("wtstempsync page", result)
#     name = result.get('company_name', 'Guest')
#     print("Company name:", name)
#     return render_template('main_dashboard.html', name=name)

@app.route('/home')
def home():
    result = get_user_name_from_token()
    print("wtstempsync page", result)

    company_name = result.get('company_name', 'Guest')
    username = result['username']

    return render_template('main_dashboard.html', name=company_name)


def process_devices_for_merging(devices):
    
    # Count how many devices per company
    company_counts = defaultdict(int)
    for d in devices:
        company_counts[d['company_name']] += 1

    seen = set()

    for d in devices:
        cname = d['company_name']

        # Determine if this row should show company column
        if cname not in seen:
            d['show_company'] = True
            d['rowspan'] = company_counts[cname]
            seen.add(cname)
        else:
            d['show_company'] = False
            d['rowspan'] = 0

        # ***** Warranty Calculations *****
        dop = d['date_of_purchase']     # datetime.date
        warranty_months = d['warranty_period']

        # Warranty expiry date
        expiry_date = dop + timedelta(days=warranty_months * 30)

        # How many days left
        today = datetime.now().date()
        remaining_days = (expiry_date - today).days

        d['warranty_expiry'] = expiry_date.strftime("%Y-%m-%d")
        d['warranty_days_left'] = max(0, remaining_days)  # no negative values

    return devices

@app.route('/product_dashboard', methods=['GET', 'POST'])
def product_dashboard():
    token = request.cookies.get('token')
    if not token:
        return redirect('/login')

    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        token_company = data.get('CompanyName')
        email_company = data.get('email')
        is_admin = data.get('is_admin', 0)
    except jwt.ExpiredSignatureError:
        return redirect('/login')
    except jwt.InvalidTokenError:
        return redirect('/login')

    # 2️⃣ Get company from query param if exists
    company_param = request.args.get('company')

    if company_param:
        if is_admin == 1:
            company = company_param
        elif company_param == token_company:
            company = company_param
        else:
            return "Unauthorized access to product dashboard", 403
    else:
        company = token_company

    print("Company name in product dashboard:", company)
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # Get user info
        cursor.execute("SELECT * FROM product_details WHERE company_name = %s", (company,))
        devices = cursor.fetchall()

    except mysql.connector.Error as err:
        print(f"Error fetching data: {err}")
        company = "Error"
        devices = []

    finally:
        cursor.close()
        conn.close()

    # Process merging info
    devices_list = process_devices_for_merging(devices)

    return render_template(
        'profile.html',
        company_name=company,
        devices=devices_list,
        email_company=email_company,
        is_admin=is_admin
    )


# ======================= MicroService For Office Light  START ========================
try:
    micro_client.connect(OFFICE_URL)
    print("Connected to Office service.")
except ConnectionError as e:  # ✅ Use imported ConnectionError
    print(f"[WARNING] Could not connect to Office service at {OFFICE_URL}: {e}")

def get_product_list_of_user(name, company_name):
    conn = connect_db()
    cursor = conn.cursor()

    # Case-insensitive match for user_access
    query = """
        SELECT serial_number 
        FROM product_details 
        WHERE company_name = %s 
        AND LOWER(user_access) LIKE %s
    """
    # Add wildcards for partial match (e.g., "mayur deshmukh" in "Mayur Deshmukh, Prajwal Bhoyar")
    cursor.execute(query, (company_name, f"%{name.lower()}%"))

    rows = cursor.fetchall()
    conn.close()

    # Extract serial numbers into a list
    serial_numbers = [row[0] for row in rows]
    return serial_numbers

def create_xlsx_response(data, headers, filename):
    """Create and return an XLSX file response."""
    if data is None or len(data) == 0:
        return "No data to download.", 404

    workbook = Workbook()
    sheet = workbook.active
    sheet.append(headers)

    for row in data:
        # Create a list of values, filtering out None values
        values_to_append = [
            row.get('date'),
            row.get('hour'),
            row.get('power_consumption'),
            row.get('active_run_time'),
            row.get('power_saving')
        ]

        # Filter out None values
        filtered_values = [value for value in values_to_append if value is not None]

        # Append the filtered values to the sheet
        if filtered_values:  # Ensure there is at least one value to append
            sheet.append(filtered_values)

    with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as temp_file:
        workbook.save(temp_file.name)
        temp_file_name = temp_file.name

    response = send_file(temp_file_name, as_attachment=True, download_name=filename, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    # Set custom headers for cache control
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'

    return response

def get_last_intensity(id):
    try:
        conn = connect_db()
        cursor = conn.cursor()
        device_id = id.replace("/control", "")

        # Case-insensitive match for user_access
        query = """
             SELECT intensity FROM sensor_data 
                WHERE device_id = %s AND device_status = '1'
                ORDER BY inserttimestamp DESC 
                LIMIT 1
        """
        
        cursor.execute(query, (device_id,))

        result = cursor.fetchone()
        conn.close()

        if result and result[0] is not None:
            return int(result[0])

    except Exception as e:
        print(f"❌ DB Error: {e}")

    return 100  # Default fallback intensity

@app.route("/download_xlsx_individual_office_light", methods=['POST'])
def download_xlsx_individual_office_light():
    print('Inside function')
    try:
        
        result = get_user_name_from_token()
        name = result.get('name')
        company_name = result.get('company_name')
        
        data = request.json
        print('Received data:', data)
        start_date = data.get('startDate')
        end_date = data.get('endDate')
        timeselect = data.get('timeSelect')
        device_id = data.get('device_id')
        print(f"start_date: {start_date}, end_date: {end_date}")

        conn = connect_db()
        cursor = conn.cursor()

        if timeselect in ["daily", "daily-individual"] or (start_date == end_date and timeselect == "set-date-individual"):
            query = """
                WITH r AS (
                    SELECT 
                        HOUR(inserttimestamp) AS hour, 
                        DATE(inserttimestamp) AS date,  
                        COUNT(CASE WHEN POWER > 0 THEN 1 END) AS active_run_time,
                        ROUND((CASE WHEN COUNT(*) > 0 THEN (SUM(COALESCE(POWER, 0)) / 60) ELSE 0 END), 2) AS tot_power,
                        COUNT(*) AS count, 
                        device_id,
                        ROUND((48 - CASE WHEN COUNT(*) > 0 THEN (SUM(POWER) / 60) ELSE 0 END), 2) AS power_saving
                    FROM 
                        sensor_data
                    WHERE 
                        device_type = 'office'
                        AND DATE(inserttimestamp) BETWEEN %s AND %s
                        AND device_id = %s
                    GROUP BY 
                        DATE(inserttimestamp), HOUR(inserttimestamp), device_id
                )
                SELECT 
                    r.date AS date,             
                    r.hour AS hour, 
                    ROUND(SUM(r.active_run_time), 2) AS active_run_time, 
                    ROUND(SUM(r.tot_power), 2) AS power_consumption, 
                    ROUND(SUM(r.power_saving), 2) AS power_saving
                FROM 
                    r
                GROUP BY 
                    r.date,                     
                    r.hour
                ORDER BY 
                    r.date,                     
                    r.hour;                    
            """
            cursor.execute(query, (start_date, end_date, device_id))
        elif timeselect == "set-date-individual" and start_date != end_date:
            query = """
                WITH r AS (
                    SELECT 
                        DATE(inserttimestamp) AS date,
                        HOUR(inserttimestamp) AS hour,  
                        COUNT(CASE WHEN POWER > 0 THEN 1 END) AS active_run_time,
                        ROUND((CASE WHEN COUNT(*) > 0 THEN (SUM(COALESCE(POWER, 0)) / 60) ELSE 0 END), 2) AS tot_power, 
                        COUNT(*) AS count, 
                        device_id,
                        ROUND((48 - CASE WHEN COUNT(*) > 0 THEN (SUM(POWER) / 60) ELSE 0 END), 2) AS power_saving
                    FROM 
                        sensor_data
                    WHERE 
                        device_type = 'office'
                        AND DATE(inserttimestamp) BETWEEN %s AND %s
                        AND device_id = %s
                    GROUP BY 
                        DATE(inserttimestamp), HOUR(inserttimestamp), device_id
                )
                SELECT 
                    r.date AS date, 
                    ROUND(SUM(r.active_run_time), 2) AS active_run_time, 
                    ROUND(SUM(r.tot_power), 2) AS power_consumption, 
                    ROUND(SUM(r.power_saving), 2) AS power_saving
                FROM 
                    r
                GROUP BY 
                    r.date
                ORDER BY 
                    r.date ASC;
            """
            cursor.execute(query, (start_date, end_date, device_id))

        results = cursor.fetchall()
        # print('Query results:', results)

        if timeselect == "daily-individual" or (start_date == end_date and timeselect == "set-date-individual"):
            data = [{
                'date': str(row[0]), 
                'hour': int(row[1]),   
                'active_run_time': float(row[2]),  
                'power_consumption': float(row[3]), 
                'power_saving': float(row[4]),
            } for row in results]
        else:
            data = [{
                'date': str(row[0]),  
                'active_run_time': float(row[1]),
                'power_consumption': float(row[2]),  
                'power_saving': float(row[3]),
            } for row in results]

        print("Prepared data for XLSX:", data)    

        headers = (
            ["Date", "Hour", "Power Consumption", "Active Run Time", "Power Saving"]
            if start_date == end_date
            else ["Date", "Power Consumption", "Active Run Time", "Power Saving"]
        )

        cursor.close()
        conn.close()

        if not data:
            return "No data available for Office Light", 404

        return create_xlsx_response(data, headers, "office_light_individual_data.xlsx")

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/office_light', methods=['GET', 'POST'])
def office_light():
    global ids, devices
    result = get_user_name_from_token()
    name = result.get('name')
    company_name = result.get('company_name')


    # print("result-->", result)
    serial_numbers = get_product_list_of_user(name, company_name)
    print(f"Serial numbers for {name} in {company_name}: {serial_numbers}")

    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT DISTINCT device_type, device_id 
        FROM sensor_data
        WHERE device_type = 'office'
    """)
    rows = cursor.fetchall()

    # try:
    #     mqttc.publish('tubeGlobal/control', "200")
    # except Exception as e:
    #     print(f"Error publishing MQTT message: {e}")

    # Step 2: Build 'ids' dictionary
    ids = defaultdict(list)
    serial_numbers = []
    for device_type, device_id in rows:
        ids[device_type].append(device_id)
        serial_numbers.append(device_id)
        
    try:
        for device_id in serial_numbers:
            print(f"Publishing MQTT message for device_id: {device_id}")
            mqttc.publish(f'{device_id}/control', "200")
            # mqttc.publish(f'{device_id}/status', qos=1)
            # mqttc.publish(f'device_id}/auto_motion_status', qos=1)
            # mqttc.publish(f'device_id}/auto_brightness_status', qos=1)
            # mqttc.publish(f'device_id}/intensity', qos=1)
            # mqttc.publish(f'device_id}/lux', qos=1)
        # mqttc.publish('officeGlobal/control', "200")
    except Exception as e:
        print(f"Error publishing MQTT message: {e}")

    # Step 3: Prepare today's date
    today = datetime.now(timezone.utc).date()

    # Step 4: Fetch today's sensor_data for given devices
    if serial_numbers:
        placeholders = ','.join(['%s'] * len(serial_numbers))  # e.g., %s, %s
        query = f"""
            SELECT inserttimestamp, device_id, temperature 
            FROM sensor_data 
            WHERE DATE(inserttimestamp) = %s 
            AND device_type = 'office'
            AND device_id IN ({placeholders})
            ORDER BY inserttimestamp
        """
        cursor.execute(query, [today] + serial_numbers)
        rows = cursor.fetchall()
    else:
        rows = []

    # Step 5: Format as structured_data list of dicts
    structured_data = [
        {
            "timestamp": row[0].strftime("%Y-%m-%d %H:%M"),
            "device_id": row[1],
            "temperature": row[2]
        }
        for row in rows
    ]

    # print("Structured data:", structured_data)
    # print("Device IDs:", serial_numbers)
    # print("IDs dictionary:", structured_data)

    # Step 6: Return to template
    return render_template(
        'office_light.html',
        structured_data=structured_data,
        device_ids=serial_numbers,
        ids=ids
    )

# office light graph indivi -->
@socketio.on('graph_data')
def graph_data(data):
    conn = None
    cursor = None
    try:
        # Fetch and validate input data
        today = datetime.today().strftime('%Y-%m-%d')
        start_date = data.get('startDate', today)
        end_date = data.get('endDate', today)
        timeselect = data.get('timeSelect', 'daily-individual')
        graphselect = data.get('graphSelect')
        device_id = data.get('deviceId')
        selected_day = data.get('selectedWeekday')

        print("Received data for graph_data:", data)

        # Validate date inputs
        if not start_date or not end_date:
            start_date = end_date = today

        try:
            datetime.strptime(start_date, '%Y-%m-%d')
            datetime.strptime(end_date, '%Y-%m-%d')
        except ValueError:
            socketio.emit('graph_data', {'error': 'Invalid date format. Please use YYYY-MM-DD.'},room=request.sid)
            return

        print(f"Validated Start Date: {start_date}, End Date: {end_date}, Time Selection: {timeselect}, Selected Day: {selected_day}")

        # Connect to the database
        conn = connect_db()
        cursor = conn.cursor()

        weekday_filter = ""
        if selected_day != "all":
            weekday_filter = f"AND WEEKDAY(DATE(inserttimestamp)) = {selected_day}"

        # Define SQL queries based on the timeframe
        if timeselect == "daily-individual" or (start_date == end_date and timeselect == "set-date-individual"):
            query =f"""WITH RECURSIVE hours AS (
            SELECT 0 AS hour
            UNION ALL
            SELECT hour + 1 
            FROM hours 
            WHERE hour < 23)
                    SELECT 
                h.hour, 
                CURDATE() AS date,
                COALESCE(COUNT(CASE WHEN dd.POWER > 0 THEN 1 END), 0) AS active_run_time,
                COALESCE(ROUND(SUM(dd.POWER) / 60, 2), 0) AS tot_power, 
                COALESCE(COUNT(*), 0) AS count, 
                dd.device_id AS device_id,
                COALESCE(ROUND(48 - (SUM(dd.POWER) / 60), 2), 0) AS power_saving
            FROM 
                hours h
            LEFT JOIN 
                sensor_data dd ON HOUR(dd.inserttimestamp) = h.hour
				  
									
                AND DATE(dd.inserttimestamp) BETWEEN %s AND %s
                AND dd.device_type = 'office'
                AND dd.device_id = %s
            GROUP BY 
                h.hour, dd.device_id
            ORDER BY 
                h.hour;"""
        elif timeselect == "set-date-individual" and start_date != end_date:
            query = f"""
            WITH hourly_data AS (
                SELECT 
                    DATE(inserttimestamp) AS date,
                    HOUR(inserttimestamp) AS hour,  
                    COUNT(CASE WHEN POWER > 0 THEN 1 END) AS active_run_time,
                    ROUND(SUM(POWER) / 60, 2) AS tot_power, 
                    COUNT(*) AS count, 
                    device_id,
                    ROUND(48 - (SUM(POWER) / 60), 2) AS power_saving
                FROM sensor_data
                WHERE 
                    device_type = 'office'
                    AND DATE(inserttimestamp) BETWEEN %s AND %s
                    AND device_id = %s
                    {weekday_filter}
                GROUP BY DATE(inserttimestamp), HOUR(inserttimestamp), device_id
            )
            SELECT 
                date, 
                ROUND(SUM(active_run_time), 2) AS active_run_time, 
                ROUND(SUM(tot_power), 2) AS power_consumption, 
                ROUND(SUM(power_saving), 2) AS power_saving,
                device_id
            FROM hourly_data
            GROUP BY date, device_id
            ORDER BY date ASC
            """
        else:
            socketio.emit('graph_data', {'error': 'Invalid time selection. Please select a valid timeframe.'},room=request.sid)
            return

        # Execute query and fetch results
        cursor.execute(query, (start_date, end_date, device_id))
        results_graph = cursor.fetchall()

        # print("Query Results:", results_graph)

        # Process and structure results
        if timeselect == "daily-individual" or (start_date == end_date and timeselect == "set-date-individual"):
            response_data_graph = [{
                'date': str(row[1]),
                'hour': int(row[0]),
                'active_run_time': float(row[2]),
                'power_consumption': float(row[3]),
                'power_saving': float(row[6])
            } for row in results_graph]
        else:
            response_data_graph = [{
                'date': str(row[0]),
                'active_run_time': float(row[1]),
                'power_consumption': float(row[2]),
                'power_saving': float(row[3])
            } for row in results_graph]

        # print("Response Data Graph:", response_data_graph)

        # Emit structured data back to the client
        socketio.emit('graph_data', {
            'data': response_data_graph,
            'updatedData': data
        }, room=request.sid)

    except Exception as e:
        print("Database query failed:", e)
        socketio.emit('graph_data', {'error': f"An error occurred: {str(e)}"}, room=request.sid)
    finally:
        # Ensure proper resource cleanup
        if cursor:
            cursor.close()

# turnon....
@app.route('/turnMaster', methods=['POST'])
def turnMaster():
    print("Here is coming -->")
    data = request.json
    id = data.get('id')
    action = data.get('action')
    intensity = get_last_intensity(id)
    print("Turning -->", intensity)

    if action == 'turnonMaster':
        mqttc.publish(id, f"autoBrightness:0:{intensity}")
        mqttc.publish(id, "200")
        return jsonify({'message': f'Switch {id} to {intensity} turned on successfully'})
    elif action == 'turnoffMaster':
        mqttc.publish(id, "autoBrightness:0:0") 
        mqttc.publish(id, "200")
        return jsonify({'message': f'Switch {id} turned off successfully'})
    return jsonify({'message': 'Invalid action'})

# for api 6 six individual....device
@app.route('/intensity_office_individual', methods=['POST'])
def intensity_office_individual():
    try:
        data = request.get_json()
        print("Received data for intensity update:", data)
        topic = data.get('topic')
        led_intensity = data.get('ledIntensity')
        print(f"Updating intensity for topic: {topic}, intensity: {led_intensity}")
        payload = f"autoBrightness:0:{led_intensity}"
        mqttc.publish(topic, payload)
        mqttc.publish(topic, "200")
        return jsonify({'success': True, 'message': 'Intensity updated successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


# ======================= MicroService For Office Light END ========================


# ======================= WTS Microservice Integration START =======================

sid_to_email = {}

try:
    micro_client.connect(WTS_URL)
    print("Connected to WTS service.")
except ConnectionError as e:  # ✅ Use imported ConnectionError
    print(f"[WARNING] Could not connect to WTS service at {WTS_URL}: {e}")

@app.route('/wtstempsync')
def wtstempsync():
    result = get_user_name_from_token()
    email = result.get('email')
    name = result.get('company_name')

    print("wtstempsync page", email)

    # Make request to microservice
    try:
        response = requests.get(f'{WTS_URL}/wts_home', params={'email': email})
        print("Response from microservice:", response)
        micro_data = response.json()
        print("Response micro_data microservice:", micro_data)

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
    sid = request.sid  # Grab actual request SID
    sid_to_email[sid] = email

    print(f"[Main] {email} connected with SID {sid}")
    
    join_room(sid)  # SID becomes the unique room name
    micro_client.emit('start_stream', {'email': email, 'sid': sid})

@micro_client.on('micro_data')
def handle_micro_data(data):
    room = data.get('room')
    socketio.emit('update_temperature', data, room=room)

# === SOCKET.IO FOR TEMPERATURE GRAPH FRONTEND ===   

@socketio.on('temperature_graph_data')
def temperature_graph_data(data):
    print("Received temperature graph data:", data )
    email = data.get('email')
    sid = request.sid  # Grab actual request SID
    sid_to_email[sid] = email
    
    join_room(sid)  # SID becomes the unique room name
    
    data['sid'] = sid

    micro_client.emit('get_temperature_graph_data', data)

@micro_client.on('micro_graph_data')
def handle_micro_data(data):
    room = data.get('room')
    socketio.emit('send_temperature_graph_data', data, room=room)
    
@micro_client.on('micro_new_alert')
def handle_alert_data(data):
    print("[Main] Received alert data from microservice:", data)
    socketio.emit('new_alert', data)

@micro_client.event
def disconnect():
    print("[Main] Disconnected from Microservice")

# ======================= WTS Microservice Integration END =======================



# ======================= MicroService For BTB 4Channel  START ========================
try:
    micro_client.connect(BTB_URL)
    print("Connected to BTB service.")
except ConnectionError as e:  # ✅ Use imported ConnectionError
    print(f"[WARNING] Could not connect to BTB service at {BTB_URL}: {e}")

@app.route('/btb4channel')
def btb4channel():
    result = get_user_name_from_token()
    email = result.get('email')
    name = result.get('company_name')
    user_name = result.get('username')

    try:
        response = requests.get(f'{BTB_URL}/btb4channel', params={'user_name': user_name, 'company_name': name})
        print("Response from microservice:", response)
        micro_data = response.json()
        print("Response micro_data microservice:", micro_data)

        if micro_data.get('status') != 'success':
            return jsonify({'message': 'Error fetching device data'}), 500

        return render_template(
            'btb4channel.html',
            name=name,
            device_data=micro_data['device_data']
        )

    except requests.exceptions.RequestException as e:
        print(f"Request to microservice failed: {e}")
        return jsonify({'message': 'Failed to connect to microservice'}), 500


@socketio.on("toggle_device")
def toggle_device(data):
    device_id = data["device"]
    intensity = data["intensity"]

    print(f"Toggling device {device_id}, intensity {intensity}")

    # Step 1: Find which device microservice to call
    response = requests.post(f'{BTB_URL}/handle_on_off',json={
        "device": f"BTB4Channel:{device_id}",
        "intensity": intensity
    })
    print("Response from BTB microservice:", response.json())
    return {"status": "OK"}


@app.route('/btb_graph', methods=['GET'])
def btb_graph():
    result = get_user_name_from_token()
    email = result.get('email')
    name = result.get('company_name')

    result = get_user_name_from_token()
    email = result.get('email')
    name = result.get('company_name')
    user_name = result.get('username')
    
    try:
        response = requests.get(f'{BTB_URL}/btb4channel', params={'user_name': user_name, 'company_name': name})
        print("Response from microservice:", response)
        micro_data = response.json()
        print("Response micro_data microservice:", micro_data)

        if micro_data.get('status') != 'success':
            return jsonify({'message': 'Error fetching device data'}), 500
    
        return render_template('btb_graph.html', name=name,
            device_data=micro_data['device_data'])
    
    except requests.exceptions.RequestException as e:
        print(f"Request to microservice failed: {e}")
        return jsonify({'message': 'Failed to connect to microservice'}), 500

    return render_template('btb_graph.html', name=name)

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

# mqtt_connect()

def device_status_monitoring(client):
    """ Fetch all devices and send MQTT ping to check online status. """
    try:
        print("🚀 Starting Device Status Monitoring...")

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # 1. Fetch all active devices
        cursor.execute("SELECT serial_number FROM product_details")
        devices = cursor.fetchall()

        print(f"📡 Total Devices Found: {len(devices)}")

        # 2. Mark all devices OFFLINE first
        for device in devices:
            device_name = device["serial_number"]

            cursor.execute("""
                INSERT INTO device_status (device_id, device_status)
                VALUES (%s, 'offline')
                ON DUPLICATE KEY UPDATE device_status='offline'
            """, (device_name,))

        # Commit DB changes
        conn.commit()

        print("🔄 All devices marked OFFLINE in DB.")

        # 3. Publish MQTT ping for each device
        for device in devices:
            device_name = device["serial_number"]

            topic = f"{device_name}/status"   # NO WILDCARD!

            try:
                client.subscribe(topic, qos=0)
                print(f"✅ Subscribed to → {topic}")
            except Exception as e:
                print(f"❌ Failed to subscribe {topic}: {e}")

        cursor.close()
        conn.close()

        print("✅ Device status monitoring ping sent successfully!")

    except Exception as e:
        print(f"❌ Error in device_status_monitoring(): {e}")


sending_client = connect_mqtt()

device_status_monitoring(sending_client)

if __name__ == '__main__':
    create_tables()
    # app.run(debug=True)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)

