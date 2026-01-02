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


def on_message(client, userdata, message):
    conn = None
    try:
        payload = message.payload.decode().strip()
        logging.info(f"📩 MQTT Message: {payload}")

        # ---------------- DB Connection ----------------
        conn = connect_db()
        cursor = conn.cursor()

        # ---------------- Clean & Split Payload ----------------
        payload_clean = payload.strip("{}")
        parts = payload_clean.split(":")

        if len(parts) < 5:
            logging.warning("⚠️ Invalid payload format")
            return

        device_id = parts[1]
        temperature = float(parts[2])
        humidity = float(parts[3])
        pressure = float(parts[4])

        logging.info(
            f"🌡 Temp:{temperature}, 💧 Hum:{humidity}, 🔽 Pressure:{pressure}"
        )

        # ---------------- Get device_type ----------------
        cursor.execute(
            """
            SELECT product_type
            FROM product_details
            WHERE serial_number = %s
            """,
            (device_id,)
        )
        result = cursor.fetchone()

        if not result:
            logging.warning(f"🚫 Unknown device: {device_id}")
            return

        device_type = result[0]

        # ---------------- Insert into thdp_data ----------------
        cursor.execute(
            """
            INSERT INTO thdp_data (
                device_type,
                device_id,
                temperature,
                humidity,
                pressure,
                created_time
            )
            VALUES (%s, %s, %s, %s, %s, NOW())
            """,
            (
                device_type,
                device_id,
                temperature,
                humidity,
                pressure
            )
        )

        conn.commit()
        logging.info(f"✅ Data inserted for {device_id}")

    except Exception as e:
        logging.error(f"❌ MQTT Error: {e}")

    finally:
        if conn:
            conn.close()


mqtt_client_conn = connect_mqtt()


@app.route('/thdp', methods=['GET'])
def thdp():
    conn = None
    cursor = None

    try:
        user_name = request.args.get('user_name')
        company_name = request.args.get('company_name')

        if not user_name or not company_name:
            return jsonify({"status": "error", "message": "Missing parameters"}), 400

        conn = connect_db()
        cursor = conn.cursor(dictionary=True)

        # 1️⃣ Get devices
        cursor.execute("""
            SELECT serial_number
            FROM product_details
            WHERE company_name = %s
            AND product_type = 'thdp'
            AND FIND_IN_SET(%s, REPLACE(IFNULL(user_access,''), ' ', ''))
        """, (company_name, user_name))

        devices = [row['serial_number'] for row in cursor.fetchall()]

        if not devices:
            return jsonify({"status": "no devices", "data": {}})

        device_data = {}

        # 2️⃣ Latest data
        for device_name in devices:
            cursor.execute("""
                SELECT *
                FROM thdp_data
                WHERE device_id = %s
               ORDER BY created_time DESC, id DESC
                LIMIT 1
            """, (device_name,))

            record = cursor.fetchone()
            device_data[device_name] = record if record else {
                "device_id": device_name,
                "message": "no data"
            }

        # 3️⃣ Status fetch
        format_strings = ','.join(['%s'] * len(devices))
        cursor.execute(f"""
            SELECT device_id, device_status
            FROM device_status
            WHERE device_id IN ({format_strings})
        """, tuple(devices))

        status_map = {row['device_id']: row['device_status'] for row in cursor.fetchall()}

        # 4️⃣ Merge status
        for device in devices:
            device_data[device]['status'] = status_map.get(device, 'offline')

        return jsonify({
            "status": "success",
            "device_data": device_data
        })

    except Exception as e:
        print("❌ Microservice /thdp error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route("/thdp_graph", methods=["POST"])
def thdp_graph():
    try:
        data = request.get_json(force=True)
        payload = request.get_json(force=True)
        device_id = payload.get("device_id")
        print("[MICRO] device_id:", device_id)

        print("[THDP MICRO] Payload received:", data)
        print("[THDP MICRO] Payload received:", payload)

        if not device_id:
            return jsonify({"status": "error", "message": "device_id missing"}), 400

        conn = connect_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT device_id, temperature, humidity, pressure, created_time
            FROM thdp_data
            WHERE device_id = %s
            ORDER BY created_time DESC
            LIMIT 1
        """, (device_id,))

        row = cursor.fetchone()


        cursor.close()
        conn.close()

        print(f"[THDP MICRO] Rows fetched: {len(row)}")

        return jsonify({
            "status": "success",
            "data": row
        })

    except Exception as e:
        print("❌ Error in THDP microservice:", e)
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500



# ============================================================
if __name__ == "__main__":
    mqtt_client = connect_mqtt()
    mqtt_client.loop_start()

    logging.info("🚀 Flask-SocketIO MQTT System Running...")
    socketio.run(app, host="0.0.0.0", port=5003, debug=True, use_reloader=False)

