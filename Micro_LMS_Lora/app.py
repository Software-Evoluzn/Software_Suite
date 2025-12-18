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
    try:
        data = request.get_json(force=True)
        logging.info(f"[MICRO-SERVICE] Payload → {data}")

        master_id = data.get("master_id")
        slave_id = data.get("slave_id")
        light = data.get("light")       # MASTER / D1 / D2 / D3 / D4
        intensity = int(data.get("intensity", 0))

        if not master_id or not slave_id or not light:
            return {
                "status": "error",
                "message": "Invalid payload"
            }, 400

        conn = connect_db()
        cursor = conn.cursor(dictionary=True)

        # ================= FETCH LAST STATE =================
        cursor.execute("""
            SELECT D1, D2, D3, D4
            FROM intellizens_data
            WHERE master_id=%s AND slave_id=%s
            ORDER BY created_at DESC
            LIMIT 1
        """, (master_id, slave_id))

        row = cursor.fetchone()

        # ================= DEFAULT STATE =================
        if row:
            last_state = {
                "D1": row["D1"],
                "D2": row["D2"],
                "D3": row["D3"],
                "D4": row["D4"]
            }
        else:
            last_state = {
                "D1": "0",
                "D2": "0",
                "D3": "0",
                "D4": "0"
            }

        # ================= BUILD NEW STATE =================
        new_state = last_state.copy()

        if light == "MASTER":
            new_state["D1"] = str(intensity)
            new_state["D2"] = str(intensity)
            new_state["D3"] = str(intensity)
            new_state["D4"] = str(intensity)
            int_cmd = f"T:{master_id}:{slave_id}:G:{intensity}"
        else:
            new_state[light] = str(intensity)
            channel = light.replace("D", "")
            int_cmd = f"T:{master_id}:{slave_id}:{channel}:{intensity}"

        # ================= SEND TO LORA =================
        command_queue.put((1, int_cmd))

        # ================= INSERT NEW STATE =================
        cursor.execute("""
            INSERT INTO intellizens_data
            (master_id, slave_id, D1, D2, D3, D4, intensity)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
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

        logging.info(f"📡 LoRa CMD → {int_cmd}")
        logging.info(f"💾 DB STATE → {new_state}")

        cursor.close()
        conn.close()

        return {
            "status": "success",
            "command": int_cmd,
            "state": new_state
        }, 200

    except Exception as e:
        logging.error(f"❌ Error in lora_set_intensity → {e}")
        return {
            "status": "error",
            "message": str(e)
        }, 500


# =====================================================================================
# ✅ OPTIMIZED: Background Read Cycle (NON-BLOCKING)
# =====================================================================================
PAUSE_BACKGROUND = threading.Event()

def background_read_cycle():
    """Continuously send read commands while RUN_BACKGROUND_CYCLE is True"""
    while True:
        if not RUN_BACKGROUND_CYCLE:
            logging.info("⏹️ Background read cycle is disabled. Waiting 5s...")
            time.sleep(5)
            continue

        if PAUSE_BACKGROUND.is_set():
            time.sleep(0.1)
            continue

        try:
            print("Started the Data Entry-->")
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT master_id, device_name FROM device_register")
            devices = cursor.fetchall()
            cursor.close()
            conn.close()

            if not devices:
                logging.info("⚠️ No devices found. Retrying in 30s...")
                time.sleep(30)
                continue

            logging.info(f"🔁 Starting read cycle for {len(devices)} devices...")

            for master_id, slave_id in devices:

                if PAUSE_BACKGROUND.is_set():
                    break
                
                time.sleep(3)
                ser.reset_input_buffer()

                command = f"T:{master_id}:GG:S"
                print("📤 -->", command)

                success = False
                retry_count = 0

                while retry_count < 3 and not success:
                    retry_count += 1

                    if PAUSE_BACKGROUND.is_set():
                            break

                    # Send command
                    ser.reset_input_buffer()
                    ser.write((command + "\r\n").encode())
                    ser.flush()

                    logging.info(f"📤 [{master_id}] Attempt {retry_count}/3")

                    start_time = time.time()
                    got_ack = False

                    # Listen here instead of separate listen thread
                    while time.time() - start_time < 8:
                        if PAUSE_BACKGROUND.is_set():
                            logging.info("⏸️ Background paused mid-read")
                            return 
                        line = ser.readline().decode('utf-8', errors='ignore').strip()
                        if not line:
                            continue

                        print("📩 Received:", line)

                        # We only accept correct ACK for this master id
                        # if line.startswith(f"Ack- R:{master_id}:"):
                        if line.startswith((f"Ack- R:{master_id}:", f"R:{master_id}:")):
                            got_ack = True
                            valid = process_line(line)
                            if valid:
                                logging.info(f"✅ [{master_id}] Data processed successfully")
                                success = True
                            else:
                                logging.warning(f"⚠️ [{master_id}] Invalid ACK data")
                            break

                    if not got_ack:
                        logging.warning(f"⚠️ [{master_id}] No valid ACK, retrying...")
                        continue

                if not success:
                    logging.error(f"❌ [{master_id}] Skipped after 3 failed attempts.")

            logging.info("✅ Completed full read cycle. Waiting 30 seconds...")
            time.sleep(10)

        except Exception as e:
            logging.error(f"❌ Background cycle error: {e}")
            logging.error(traceback.format_exc())
            time.sleep(10)


def process_line(line):
    """Process received data line"""
    try:
        parts = line.split(":")
        if len(parts) < 10:
            return False

        if parts[0] not in ["R", "Ack- R"]:
            return False

        master_id = parts[1]
        slave_id = parts[2]

        def safe_int(v, d=None):
            try: return int(v)
            except: return d
        
        def safe_float(v, d=None):
            try: return float(v)
            except: return d

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

            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO device_data (
                    master_id, slave_id, intensity, load_status, power,
                    auto_brightness_status, auto_motion_status, lux_sensor_status,
                    lux, pir, ntc_temp, floor_lux, aht25_temp, humidity
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                master_id, slave_id, intensity, load_status, power,
                auto_brightness_status, auto_motion_status, lux_sensor_status,
                lux, pir, ntc_temp, floor_lux, aht25_temp, humidity
            ))
            conn.commit()
            inserted_id = cursor.lastrowid
            conn.close()
            
            logging.info(f"💾 Saved ID: {inserted_id}")
            
            # # ✅ Emit status update to frontend
            # socketio.emit('status_update', {
            #     'master_id': master_id,
            #     'switch': load_status,
            #     'intensity': intensity,
            #     'auto_brightness_status': auto_brightness_status,
            #     'auto_motion_status': auto_motion_status,
            #     'device_lux': lux
            # })

        return True

    except Exception as e:
        logging.error(f"❌ Process line error: {e}")
        return False


# ===================================================================================== 
if __name__ == "__main__":
    background_thread = threading.Thread(target=background_read_cycle, daemon=True)
    background_thread.start()
    threading.Thread(target=command_processor, daemon=True).start()
    socketio.run(app,host="0.0.0.0", port=5002, debug=True, use_reloader=False)
