from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import serial
import mysql.connector
from time import sleep
import time
import sqlite3
import threading
import logging
import datetime
from collections import defaultdict
import queue
import traceback
import serial
import serial.tools.list_ports
import logging

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# === Database setup ===
DB_PATH = "expo_project.db"

serial_lock = threading.Lock()
command_queue = queue.PriorityQueue()
RUN_BACKGROUND_CYCLE = True
PAUSE_BACKGROUND = threading.Event()

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

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')


# ========================================= Dynamic Port Find =========================================
def find_serial_port():
    """
    Find LoRa USB serial port only
    """
    ports = serial.tools.list_ports.comports()

    for p in ports:
        desc = p.description.lower()
        hwid = p.hwid.lower()

        # 🔥 Allow only real USB serial devices
        if (
            "usb" in desc
            or "ch340" in desc
            or "cp210" in desc
            or "arduino" in desc
            or "silicon labs" in desc
        ):
            # logging.info(f"✅ Using Serial: {p.device} - {p.description}")
            return p.device

    return None


port = find_serial_port()

if not port:
    logging.error("❌ No serial device found")
    exit()

try:
    ser = serial.Serial(port, 115200, timeout=0.05)
    ser.reset_input_buffer()
    ser.reset_output_buffer()
    logging.info(f"✅ Serial port {port} opened successfully")
except Exception as e:
    logging.error(f"❌ Could not open {port}: {e}")
    exit()

# =====================================================================================================
def send_command_strict(command, wait_time=3.0):
    """
    Send serial command and wait strictly for proper ACK or timeout.
    Prevents overlapping with background thread.
    """
    try:
        with serial_lock:
            ser.reset_input_buffer()
            ser.write((command + "\r\n").encode())
            ser.flush()
            logging.info(f"📡 SENT: {command}")

            start = time.time()
            response = ""

            while time.time() - start < wait_time:  # wait up to X seconds
                if ser.in_waiting:
                    chunk = ser.read(ser.in_waiting).decode('utf-8', errors='ignore')
                    response += chunk
                    if '\n' in chunk:
                        break
                time.sleep(0.05)

            response = response.strip()
            if response:
                logging.info(f"📩 ACK: {response}")
            else:
                logging.warning("⚠️ No ACK received (timeout)")

            return response
    except Exception as e:
        logging.error(f"❌ Serial send error: {e}")
        return ""


background_thread = None  # Global reference

def command_processor():
    """Run user commands with full pause on background read."""
    global background_thread
    while True:
        try:
            priority, command = command_queue.get(timeout=1)

            # 🚫 Pause background completely
            PAUSE_BACKGROUND.set()
            logging.info("⏸️ Background paused for manual command")

            # 🔒 Send and wait for ACK (up to 3 sec)
            response = send_command_strict(command, wait_time=3.0)

            if response:
                logging.info("✅ Manual command executed successfully")
            else:
                logging.warning("⚠️ No ACK for manual command")

            # 🕐 Short delay to ensure Arduino is stable again
            time.sleep(5)

            # ▶️ Resume background safely
            PAUSE_BACKGROUND.clear()
            logging.info("▶️ Background resumed")

            # ♻️ Restart background if it exited
            if not background_thread.is_alive():
                logging.info("🔄 Restarting background thread after pause...")
                time.sleep(3)
                background_thread = threading.Thread(target=background_read_cycle, daemon=True)
                background_thread.start()

            command_queue.task_done()

        except queue.Empty:
            continue
        except Exception as e:
            logging.error(f"Command processor error: {e}")

def safe_int(x):
    try:
        return int(x)
    except (TypeError, ValueError):
        return 0

@app.route('/lora_set_intensity', methods=['POST'])
def lora_set_intensity():
    conn = None
    cursor = None

    try:
        data = request.get_json(force=True)
        logging.info(f"[MICRO-SERVICE] Payload → {data}")

        master_id = data.get("master_id")
        slave_id = data.get("slave_id")
        light_type = data.get("light_type")
        light_control = data.get("light_control") 
        intensity = int(data.get("intensity", 0))

        # ================= VALIDATION =================
        if not all([master_id, slave_id, light_type, light_control]):
            return {"status": "error", "message": "Invalid payload"}, 400

        if not 0 <= intensity <= 100:
            return {"status": "error", "message": "Invalid intensity"}, 400

        conn = connect_db()
        cursor = conn.cursor(dictionary=True)

        # ================= INTELLIZENS =================
        if light_type == "IntelliZENS":
            channels = ["D1", "D2", "D3", "D4"]

            cursor.execute("""
                SELECT D1, D2, D3, D4
                FROM intellizens_data
                WHERE master_id=%s AND slave_id=%s
                ORDER BY created_at DESC
                LIMIT 1
            """, (master_id, slave_id))

            row = cursor.fetchone()

            last_state = {ch: row[ch] if row else "0" for ch in channels}
            new_state = last_state.copy()

            if light_control == "MASTER":
                for ch in channels:
                    new_state[ch] = str(intensity)
                int_cmd = f"T:{master_id}:{slave_id}:G:{intensity}"
            else:
                if light_control not in channels:
                    return {"status": "error", "message": "Invalid channel"}, 400

                new_state[light_control] = str(intensity)
                channel_no = light_control.replace("D", "")
                int_cmd = f"T:{master_id}:{slave_id}:{channel_no}:{intensity}"

            # ================= SEND TO LORA =================
            command_queue.put((1, int_cmd))

            # ================= DB INSERT =================
            cursor.execute("""
                INSERT INTO intellizens_data
                (master_id, slave_id, D1, D2, D3, D4, intensity)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
            """, (
                master_id,
                slave_id,
                new_state["D1"],
                new_state["D2"],
                new_state["D3"],
                new_state["D4"],
                intensity
            ))

            conn.commit()

        # ================= RUNNING =================
        elif light_type == "Running":
            logging.info("⚙ Running LoRa control not implemented yet", master_id,slave_id,  intensity)
            int_cmd = f"T:{master_id}:{slave_id}:I:0:{intensity}"

            # ================= SEND TO LORA =================
            command_queue.put((1, int_cmd))
            return {"status": "pending", "message": "Running LoRa not implemented"}, 501

        else:
            return {"status": "error", "message": "Unknown light_type"}, 400

        logging.info(f"📡 LoRa CMD → {int_cmd}")
        logging.info(f"💾 DB STATE → {new_state}")

        return {
            "status": "success",
            "command": int_cmd,
            "state": new_state
        }, 200

    except Exception as e:
        logging.exception("❌ Error in lora_set_intensity")
        return {"status": "error", "message": str(e)}, 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/lora_set_auto', methods=['POST'])
def lora_set_auto():
    conn = None
    cursor = None

    try:
        data = request.get_json(force=True)
        logging.info(f"[MICRO-SERVICE] AUTO Payload → {data}")

        master_id = data.get("master_id")
        slave_id = data.get("slave_id")
        light_type = data.get("light_type")
        feature = data.get("feature")      # auto_motion / auto_brightness
        value = int(data.get("value", 0))  # 0 / 1

        # ================= VALIDATION =================
        if not master_id or not slave_id or not light_type or not feature:
            return {"status": "error", "message": "Invalid payload"}, 400

        if value not in (0, 1):
            return {"status": "error", "message": "Invalid value"}, 400

        if light_type != "Running":
            return {"status": "error", "message": "Unsupported light_type"}, 400

        # ================= BUILD LORA COMMAND =================
        if feature == "auto_motion":
            int_cmd = f"T:{master_id}:{slave_id}:M:{value}"

        elif feature == "auto_brightness":
            int_cmd = f"T:{master_id}:{slave_id}:B:{value}"

        else:
            return {"status": "error", "message": "Invalid auto feature"}, 400

        # ================= SEND TO LORA =================
        command_queue.put((1, int_cmd))
        logging.info(f"📡 LoRa CMD → {int_cmd}")

        # ================= OPTIONAL: SAVE STATE =================
        conn = connect_db()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO lms_lora
            (master_id, slave_id, auto_motion_status, auto_brightness_status)
            VALUES (%s, %s,
                    %s,
                    %s)
        """, (
            master_id,
            slave_id,
            value if feature == "auto_motion" else None,
            value if feature == "auto_brightness" else None
        ))

        conn.commit()

        return {
            "status": "success",
            "command": int_cmd,
            "feature": feature,
            "value": value
        }, 200

    except Exception as e:
        logging.exception("❌ Error in lora_set_auto")
        return {"status": "error", "message": str(e)}, 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# =====================================================================================
# ✅ OPTIMIZED: Background Read Cycle (NON-BLOCKING)
# =====================================================================================
PAUSE_BACKGROUND = threading.Event()

def get_lora_devices():
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT serial_number
        FROM product_details
        WHERE LOWER(connection_type) = 'lora'
          AND LOWER(product_type) != 'intellizens lora'
    """)

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    devices = {}

    for row in rows:
        serial = row["serial_number"]  # Example: T:02:01

        try:
            _, master_id, slave_id = serial.split(":")
        except ValueError:
            continue  # skip invalid serial format

        devices.setdefault(master_id, []).append(slave_id)

    return devices



def background_read_cycle():
    """Continuously send read commands for all LoRa masters/slaves"""

    while True:

        if not RUN_BACKGROUND_CYCLE:
            logging.info("⏹️ Background read cycle disabled. Waiting 5s...")
            time.sleep(5)
            continue

        if PAUSE_BACKGROUND.is_set():
            time.sleep(0.1)
            continue

        try:
            logging.info("🔁 Fetching LoRa devices...")
            lora_devices = get_lora_devices()

            if not lora_devices:
                logging.warning("⚠️ No LoRa devices found. Retrying in 30s...")
                time.sleep(30)
                continue

            logging.info(f"📡 Found {len(lora_devices)} LoRa masters")

            for master_id, slave_ids in lora_devices.items():

                for slave_id in slave_ids:

                    if PAUSE_BACKGROUND.is_set():
                        break

                    command = f"T:{master_id}:GG:S"
                    retry_count = 0
                    success = False

                    while retry_count < 3 and not success:
                        retry_count += 1

                        ser.reset_input_buffer()
                        ser.write((command + "\r\n").encode())
                        ser.flush()

                        logging.info(
                            f"📤 [{master_id}:{slave_id}] Attempt {retry_count}/3 → {command}"
                        )

                        start_time = time.time()

                        while time.time() - start_time < 8:
                            if PAUSE_BACKGROUND.is_set():
                                return

                            line = ser.readline().decode("utf-8", errors="ignore").strip()
                            if not line:
                                continue

                            print("📩 Received:", line)

                            if line.startswith((f"Ack- R:{master_id}:", f"R:{master_id}:")):
                                valid = process_line(line)
                                if valid:
                                    logging.info(f"✅ [{master_id}:{slave_id}] Data OK")
                                    success = True
                                else:
                                    logging.warning(
                                        f"⚠️ [{master_id}:{slave_id}] Invalid data"
                                    )
                                break

                        if not success:
                            logging.warning(
                                f"🔄 [{master_id}:{slave_id}] Retry {retry_count}"
                            )

                    if not success:
                        logging.error(
                            f"❌ [{master_id}:{slave_id}] Failed after 3 attempts"
                        )

                    time.sleep(2)  # throttle per slave

            logging.info("✅ Completed LoRa read cycle. Sleeping 10s...")
            time.sleep(10)

        except Exception as e:
            logging.error("❌ Background cycle error", exc_info=True)
            time.sleep(10)


def process_line(line):
    try:
        parts = line.split(":")
        if len(parts) < 9:
            return False

        if parts[0] not in ["R", "Ack- R"]:
            return False

        master_id = parts[1]
        slave_id = parts[2]

        def safe_int(v, d=0):
            try:
                return int(v)
            except:
                return d

        def safe_float(v, d=0.0):
            try:
                return float(v)
            except:
                return d

        if parts[3] == "S":
            intensity = safe_int(parts[4])
            load_status = safe_int(parts[5])
            power = safe_float(parts[6])
            auto_brightness_status = safe_int(parts[7])
            auto_motion_status = safe_int(parts[8])
            lux_sensor_status = parts[9] if len(parts) > 9 else None
            lux = safe_float(parts[10]) if len(parts) > 10 else None
            pir = safe_int(parts[11]) if len(parts) > 11 else None
            ntc_temp = safe_float(parts[12]) if len(parts) > 12 else None
            floor_lux = safe_float(parts[13]) if len(parts) > 13 else None
            aht25_temp = safe_float(parts[14]) if len(parts) > 14 else None
            humidity = safe_float(parts[15]) if len(parts) > 15 else None

            raw_data = line

            conn = connect_db()
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO lms_lora (
                    master_id, slave_id, intensity, load_status, power,
                    auto_brightness_status, auto_motion_status,
                    lux_sensor_status, lux, pir, ntc_temp,
                    floor_lux, aht25_temp, humidity, raw_data
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                master_id, slave_id, intensity, load_status, power,
                auto_brightness_status, auto_motion_status,
                lux_sensor_status, lux, pir, ntc_temp,
                floor_lux, aht25_temp, humidity, raw_data
            ))

            conn.commit()
            cursor.close()
            conn.close()

            logging.info(f"💾 MySQL Saved → {master_id}:{slave_id}")

        return True

    except Exception as e:
        logging.error(f"❌ Process line error: {e}", exc_info=True)
        return False

# ===================================================================================== 
if __name__ == "__main__":
    background_thread = threading.Thread(target=background_read_cycle, daemon=True)
    background_thread.start()
    threading.Thread(target=command_processor, daemon=True).start()
    socketio.run(app,host="0.0.0.0", port=5002, debug=True, use_reloader=False)
