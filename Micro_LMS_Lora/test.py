import serial
import time

# === Serial setup ===
try:
    ser = serial.Serial('COM14', 115200, timeout=0.05)
    ser.reset_input_buffer()
    ser.reset_output_buffer()
    print("✅ Serial port COM14 opened successfully\n")
except Exception as e:
    print("❌ Could not open COM14:", e)
    exit()

# === Read loop ===
try:
    while True:
        if ser.in_waiting > 0:                     # data available?
            raw = ser.readline()                   # read one line
            try:
                data = raw.decode('utf-8').strip() # convert bytes → string
                if data:
                    print("📡 LoRa Received:", data)
            except UnicodeDecodeError:
                pass                               # ignore garbage bytes

        time.sleep(0.01)

except KeyboardInterrupt:
    print("\n🛑 Stopped by user")

finally:
    ser.close()
    print("🔌 Serial port closed")
