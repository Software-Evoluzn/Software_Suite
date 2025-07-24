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

broker = "203.109.124.70"
port = 18889    
mqttc = mqtt.Client()

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*",  manage_session=False)
app.secret_key = "Evoluzn@999"

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


@app.route('/running_home', methods=['GET', 'POST'])
def running_home():
    company_name = request.args.get('company_name')
    name = request.args.get('name')
    print("Company Name:", company_name)
    print("Name:", name)


    

    return jsonify({
                'status': 'success',
                'name': name,
                'company_name': company_name
            })

# @app.route('/running_light', methods=['GET', 'POST'])
# def running_light():
#     global ids, devices
#     conn = connect_db()
    
#     try:
#         cursor = conn.cursor()

#         # Check if user is logged in, otherwise redirect to index
#         if 'user_id' not in session:
#             return redirect(url_for('index'))
        
#         user_id = session['user_id']
        
#         # Get distinct device IDs for 'tube' type devices, excluding some IDs
#         cursor.execute("""
#             SELECT DISTINCT device_id 
#             FROM device 
#             WHERE device_type='tube' 
#               AND device_id NOT IN ('tubeF0BE99', 'tubeF0BE98', 'tubeF0BF04') 
#               AND user_id = %s;
#         """, (user_id,))
#         tube_id = cursor.fetchall()

#         # If no ids or devices are available, redirect to the home page
#         if not ids or not devices:
#             return redirect(url_for('home', user_id=user_id))

#         # Publish MQTT message to control the tube
#         try:
#             mqttc.publish('tubeGlobal/control', "200")
#         except Exception as e:
#             print(f"Error publishing MQTT message: {e}")
        
#         # Render the template with the necessary data
#         return render_template('running_light.html', 
#                                active_page='running_light', 
#                                ids=ids, 
#                                devices=devices, 
#                                tube_id=tube_id)
    
#     except Exception as e:
#         print(f"Error in /running_light route: {e}")
#         return redirect(url_for('home', user_id=user_id))
    
#     finally:
#         # Ensure the database resources are properly closed
#         cursor.close()
#         conn.close()




@socketio.on('running_light_graph_data')
def running_light_graph_data(data):
    try:
        print("Selected Data for running graph:", data)
        start_date = data.get('startDate')
        end_date = data.get('endDate')
        timeselect = data.get('timeSelect')
        graphselect = data.get('graphSelect')
        selected_day = data.get('daySelect')  # Fetch selected day
        print("selected_day", selected_day)
        conn = connect_db()
        cursor = conn.cursor()

        weekday_filter = ""
        if selected_day != "all":  # Add weekday filter only if not "all"
            weekday_filter = f"AND WEEKDAY(DATE(inserttimestamp)) = {selected_day}"
        
        if (timeselect == "daily" or (start_date == end_date and timeselect == "set-date-running")):
																											 
            query = f"""
            WITH r AS (
            SELECT 
            HOUR(inserttimestamp) AS hour, 
            DATE(inserttimestamp) AS date,  
            COUNT(CASE WHEN POWER > 0 THEN 1 END) AS active_run_time,
            ROUND((CASE WHEN COUNT(*) > 0 THEN (SUM(POWER) / 60) ELSE 0 END), 2) AS tot_power, 
            COUNT(*) AS count, 
            device_id,
            ROUND((48 - CASE WHEN COUNT(*) > 0 THEN (SUM(POWER) / 60) ELSE 0 END), 2) AS power_saving
            FROM 
            device_data
            WHERE 
            device_type = 'tube'
            AND DATE(inserttimestamp) BETWEEN %s AND %s 
            AND device_id IN ('tubeF0BF05', 'tubeF0BF11', 'tubeF0BF07', 'tubeF0BF03', 'tubeF0BF02', 'tubeF0BF04')
            GROUP BY 
            DATE(inserttimestamp), HOUR(inserttimestamp), device_id
            ORDER BY 
            hour ASC
            )
            SELECT 
            r.hour AS hour, 
            round(SUM(r.active_run_time),2) AS active_run_time, 
            round(SUM(r.tot_power),2) AS power_consumption, 
            round(SUM(r.power_saving),2) AS power_saving
            FROM 
            r
            GROUP BY 
            r.hour
            ORDER BY 
            r.hour;
            """
            cursor.execute(query, (start_date, end_date))
            results = cursor.fetchall()
						  
																																		  
            data = [{
                'hour': float(row[0]),
                'power_consumption': float(row[2]),
                'active_run_time': float(row[1]),
                'power_saving': float(row[3])
            } for row in results]
        elif (timeselect == "set-date-running" and start_date != end_date):
																											
            query = f"""
            WITH r AS (
            SELECT 
            DATE(inserttimestamp) AS date,
            HOUR(inserttimestamp) AS hour,  
            COUNT(CASE WHEN POWER > 0 THEN 1 END) AS active_run_time,
            ROUND((CASE WHEN COUNT(*) > 0 THEN (SUM(POWER) / 60) ELSE 0 END), 2) AS tot_power, 
            COUNT(*) AS count, 
            device_id,
            ROUND((48 - CASE WHEN COUNT(*) > 0 THEN (SUM(POWER) / 60) ELSE 0 END), 2) AS power_saving
            FROM 
            device_data
            WHERE 
            device_type = 'tube'
            AND DATE(inserttimestamp) BETWEEN %s AND %s
            AND device_id IN ('tubeF0BE98', 'tubeF0BE99','tubeF0BF05', 'tubeF0BF11', 'tubeF0BF07', 'tubeF0BF03', 'tubeF0BF02', 'tubeF0BF04')
            {weekday_filter}  -- Add weekday filter here
            GROUP BY 
            DATE(inserttimestamp), HOUR(inserttimestamp), device_id
            )
            SELECT 
            r.date AS date, 
            round(SUM(r.active_run_time),2) AS active_run_time, 
            round(SUM(r.tot_power),2) AS power_consumption, 
            round(SUM(r.power_saving),2) AS power_saving
            FROM 
            r
            GROUP BY 
            r.date
            ORDER BY 
            r.date ASC;
            """
            cursor.execute(query, (start_date, end_date))
            results = cursor.fetchall()
						  
																																		  
            data = [{
                'date': str(row[0]),
                'power_consumption': float(row[2]),
                'active_run_time': float(row[1]),
                'power_saving': float(row[3])
            } for row in results]

        cursor.close()
        conn.close()
        socketio.emit('running_light_graph_data_response', data, room=request.sid)

        print("Emitted running light data:", data)


    except Exception as e:
        print("Database query failed:", e)
        socketio.emit('running_light_graph_data_response', [],room=request.sid)  # Emit an empty list on error


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True)