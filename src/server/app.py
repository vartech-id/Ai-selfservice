from flask import Flask, request, jsonify, send_file, render_template
import os
import csv
import uuid
import json
import urllib.request
import urllib.parse
import io
import base64
import cv2
import tempfile
import qrcode.constants
import websocket
from flask_cors import CORS
from urllib.parse import unquote
import sqlite3
import time
import configparser
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import threading
from pathlib import Path
import logging

from PIL import Image, ImageWin
import win32print
import win32ui
import win32con

# Initialize the Flask app
app = Flask(__name__)
CORS(app)

# Configuration
DATABASE = 'faceswap.db'
TABLE_NAME = 'user_table'

# Sesuaikan pathnya
BASE_ASSET_DIR = (Path(__file__).resolve().parents[1] / "assets").resolve()
SERVER_ADDRESS = "127.0.0.1:8188"
CLIENT_ID = str(uuid.uuid4())

# optional safety:
assert BASE_ASSET_DIR.exists(), f"Assets folder not found: {BASE_ASSET_DIR}"

# Set up basic logging configuration
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Printer and Hot Folder Configuration
config = configparser.ConfigParser()
CONFIG_FILE = 'config.ini'

def load_config():
    """Load configuration from file or create with defaults."""
    if os.path.exists(CONFIG_FILE):
        config.read(CONFIG_FILE)
    else:
        config['HotFolder'] = {
            'path': os.path.join(os.path.expanduser('~'), 'FaceSwapHotFolder'),
            'enabled': 'true'
        }
        config['Printer'] = {
            'default_printer': win32print.GetDefaultPrinter(),
            'default_print_size': '4x6'
        }
        save_config()
    
    # Ensure hot folder exists
    os.makedirs(config['HotFolder']['path'], exist_ok=True)
    return config

def save_config():
    """Save current configuration to file."""
    with open(CONFIG_FILE, 'w') as configfile:
        config.write(configfile)

class ImagePrinter:
    @staticmethod
    def get_print_dimensions(print_size):
        """
        Convert print size string to dimensions in inches and pixels
        Returns: tuple (width_inches, height_inches)
        """
        dimensions = {
            "4x6": (4.0, 6.0),
            "6x4": (6.0, 4.0)
        }
        return dimensions.get(print_size, (4.0, 6.0))  # Default to 4x6 if invalid size

    @staticmethod
    def print_image(image_path, printer_name, print_size="4x6", left_offset_percent=10):
        """
        Print image with adjustable left offset
        left_offset_percent: 0 to 100, where 0 is centered (default) and 100 moves image fully right
        """
        try:
            # Open the image
            img = Image.open(image_path)
            img = img.convert('RGB')  # Ensure RGB mode
            
            # Initialize printer
            hprinter = win32print.OpenPrinter(printer_name)
            printer_info = win32print.GetPrinter(hprinter, 2)
            pdc = win32ui.CreateDC()
            pdc.CreatePrinterDC(printer_name)
            
            # Get printer DPI and physical dimensions
            printer_dpi_x = pdc.GetDeviceCaps(win32con.LOGPIXELSX)
            printer_dpi_y = pdc.GetDeviceCaps(win32con.LOGPIXELSY)
            physical_width = pdc.GetDeviceCaps(win32con.PHYSICALWIDTH)
            physical_height = pdc.GetDeviceCaps(win32con.PHYSICALHEIGHT)
            
            # Get target dimensions in inches
            target_width_inch, target_height_inch = ImagePrinter.get_print_dimensions(print_size)
            
            # Convert target dimensions to pixels at printer's DPI
            target_width_px = int(target_width_inch * printer_dpi_x)
            target_height_px = int(target_height_inch * printer_dpi_y)
            
            # Calculate the scaling factors
            img_aspect = img.width / img.height
            target_aspect = target_width_px / target_height_px
            
            # Determine new dimensions while preserving aspect ratio
            if img_aspect > target_aspect:
                # Image is wider than target - fit to width
                new_width = target_width_px
                new_height = int(target_width_px / img_aspect)
            else:
                # Image is taller than target - fit to height
                new_height = target_height_px
                new_width = int(target_height_px * img_aspect)
            
            # Resize image with high-quality resampling
            resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Create a new image with the exact target size and white background
            final_img = Image.new('RGB', (target_width_px, target_height_px), 'white')
            
            # Calculate centering offsets with adjustable left offset
            max_x_offset = target_width_px - new_width
            base_x_offset = max_x_offset // 2  # This would be the centered position
            additional_offset = int((max_x_offset // 2) * (left_offset_percent / 100))
            x_offset = base_x_offset + additional_offset
            
            y_offset = (target_height_px - new_height) // 2
            
            # Paste the resized image onto the white background
            final_img.paste(resized_img, (x_offset, y_offset))
            
            # Convert to device-independent bitmap
            dib = ImageWin.Dib(final_img)
            
            # Start print job
            pdc.StartDoc(image_path)
            pdc.StartPage()
            
            # Calculate margins for centering on page
            margin_x = (physical_width - target_width_px) // 2
            margin_y = (physical_height - target_height_px) // 2
            
            # Draw the image centered on the page
            dib.draw(
                pdc.GetHandleOutput(),
                (
                    margin_x,
                    margin_y,
                    margin_x + target_width_px,
                    margin_y + target_height_px
                )
            )
            
            # Finish print job
            pdc.EndPage()
            pdc.EndDoc()
            
            return True
            
        except Exception as e:
            print(f"Printing error: {str(e)}")
            return False
            
        finally:
            if 'pdc' in locals():
                pdc.DeleteDC()
            if 'hprinter' in locals():
                win32print.ClosePrinter(hprinter)
                
class HotFolderHandler(FileSystemEventHandler):
    def __init__(self, app):
        self.app = app
        self.processing = set()
    
    def on_created(self, event):
        if not event.is_directory and event.src_path.lower().endswith(('.jpg', '.jpeg', '.png')):
            if event.src_path not in self.processing:
                self.processing.add(event.src_path)
                time.sleep(1)
                threading.Thread(target=self.process_image, args=(event.src_path,)).start()
    
    def process_image(self, image_path):
        try:
            # Process the image through face swap
            with open(image_path, 'rb') as source_file:
                template_path = os.path.join(BASE_ASSET_DIR, "templates", "default.jpg")
                
                workflow = load_workflow()
                updated_workflow = update_workflow(workflow, template_path, image_path)
                
                ws = websocket.WebSocket()
                ws.connect(f"ws://{SERVER_ADDRESS}/ws?clientId={CLIENT_ID}")
                images = get_images(ws, updated_workflow)
                
                for node_id, image_data_list in images.items():
                    if image_data_list:
                        temp_output = os.path.join(tempfile.gettempdir(), f"processed_{uuid.uuid4()}.jpg")
                        with open(temp_output, 'wb') as f:
                            f.write(image_data_list[0])
                        
                        printer_name = config['Printer'].get('default_printer')
                        print_size = config['Printer'].get('default_print_size', '4x6')
                        if ImagePrinter.print_image(temp_output, printer_name, print_size):
                            print(f"Successfully printed processed image from: {image_path}")
                        else:
                            print(f"Failed to print processed image from: {image_path}")
                        
                        os.remove(temp_output)
                        break
        except Exception as e:
            print(f"Error processing {image_path}: {str(e)}")
        finally:
            self.processing.remove(image_path)

def queue_prompt(prompt):
    p = {"prompt": prompt, "client_id": CLIENT_ID}
    data = json.dumps(p).encode('utf-8')
    req = urllib.request.Request(f"http://{SERVER_ADDRESS}/prompt", data=data)
    return json.loads(urllib.request.urlopen(req).read())

def get_image(filename, subfolder, folder_type):
    data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(data)
    with urllib.request.urlopen(f"http://{SERVER_ADDRESS}/view?{url_values}") as response:
        return response.read()

def get_history(prompt_id):
    with urllib.request.urlopen(f"http://{SERVER_ADDRESS}/history/{prompt_id}") as response:
        return json.loads(response.read())

def get_images(ws, prompt):
    prompt_id = queue_prompt(prompt)['prompt_id']
    output_images = {}

    while True:
        out = ws.recv()
        if isinstance(out, str):
            message = json.loads(out)
            if message['type'] == 'executing':
                data = message['data']
                if data['node'] is None and data['prompt_id'] == prompt_id:
                    break
                else:
                    continue

    history = get_history(prompt_id)[prompt_id]
    for node_id in history['outputs']:
        node_output = history['outputs'][node_id]
        if 'images' in node_output:
            images_output = []
            for image in node_output['images']:
                image_data = get_image(image['filename'], image['subfolder'], image['type'])
                images_output.append(image_data)
            output_images[node_id] = images_output
    return output_images

def load_workflow():
    with open("fswap.json", "r", encoding="utf-8") as f:
        return json.load(f)

def update_workflow(workflow, template_path, source_path):
    workflow["1"]["inputs"]["image"] = template_path
    workflow["3"]["inputs"]["image"] = source_path
    return workflow

def list_images(folder_path):
    if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
        return None
    return [
        f for f in os.listdir(folder_path)
        if os.path.isfile(os.path.join(folder_path, f)) and f.lower().endswith((".jpg", ".jpeg", ".png"))
    ]

# API Routes

@app.route('/api/templates', methods=['GET'])
def get_templates():
    folder = request.args.get('folder', '').strip()
    if not folder:
        return jsonify({"error": "Folder parameter is required."}), 400

    full_path = os.path.join(BASE_ASSET_DIR, *folder.split('/'))
    images = list_images(full_path)
    if images is None:
        return jsonify({"error": "Folder not found or invalid."}), 404

    return jsonify(images)

@app.route('/api/template', methods=['GET'])
def get_template():
    filepath = request.args.get('filepath', '').strip()
    if not filepath:
        return jsonify({"error": "Filepath parameter is required."}), 400

    full_path = os.path.join(BASE_ASSET_DIR, *filepath.split('/'))
    if os.path.exists(full_path) and os.path.isfile(full_path):
        return send_file(full_path, mimetype='image/jpeg')

    return jsonify({"error": "Image not found."}), 404

@app.route('/api/swap', methods=['POST'])
def swap_face():
    template = request.files.get('template')
    source = request.files.get('source')

    if not template or not source:
        app.logger.error(f'Missing files: template={template} source={source}')
        return jsonify({'error': 'Missing template or source image'}), 400

    app.logger.info(f'Received template: {template.filename}')
    app.logger.info(f'Received source: {source.filename}')

    template_path = os.path.join(BASE_ASSET_DIR, template.filename)
    source_path = os.path.join(tempfile.gettempdir(), f"source_{uuid.uuid4()}.jpg")

    template.save(template_path)
    source.save(source_path)

    workflow = load_workflow()
    updated_workflow = update_workflow(workflow, template_path, source_path)

    ws = websocket.WebSocket()
    ws.connect(f"ws://{SERVER_ADDRESS}/ws?clientId={CLIENT_ID}")
    images = get_images(ws, updated_workflow)

    os.remove(source_path)

    for node_id, image_data_list in images.items():
        if image_data_list:
            image_data = image_data_list[0]
            return jsonify({'image': base64.b64encode(image_data).decode('utf-8')})

    return jsonify({'error': 'No image generated'}), 400

@app.route('/api/printer/config', methods=['GET', 'PUT'])
def printer_config():
    if request.method == 'GET':
        printers = [printer[2] for printer in win32print.EnumPrinters(2)]
        return jsonify({
            'printers': printers,
            'default_printer': config['Printer']['default_printer'],
            'default_print_size': config['Printer'].get('default_print_size', '4x6'),
            'available_sizes': ['4x6', '6x4'],
            'hot_folder': {
                'path': config['HotFolder']['path'],
                'enabled': config['HotFolder'].getboolean('enabled')
            }
        })
    
    elif request.method == 'PUT':
        data = request.json
        if 'default_printer' in data:
            config['Printer']['default_printer'] = data['default_printer']
        if 'default_print_size' in data:
            if data['default_print_size'] in ['4x6', '6x4']:
                config['Printer']['default_print_size'] = data['default_print_size']
        if 'hot_folder' in data:
            if 'path' in data['hot_folder']:
                new_path = data['hot_folder']['path']
                if os.path.exists(new_path) or os.makedirs(new_path, exist_ok=True):
                    config['HotFolder']['path'] = new_path
            if 'enabled' in data['hot_folder']:
                config['HotFolder']['enabled'] = str(data['hot_folder']['enabled']).lower()
        
        save_config()
        return jsonify({'message': 'Configuration updated successfully'})

@app.route('/api/printer/print', methods=['POST'])
def print_image():
    logging.info('Received print request with parameters:')
    
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    image = request.files['image']
    logging.info(f"Image received: {image.filename}")
    
    printer_name = request.form.get('printer', config['Printer']['default_printer'])
    print_size = request.form.get('print_size', config['Printer'].get('default_print_size', '4x6'))
    
    # Log printer and print size
    logging.info(f"Printer: {printer_name}")
    logging.info(f"Print size: {print_size}")
    
    if print_size not in ['4x6', '6x4']:
        return jsonify({'error': 'Invalid print size'}), 400
    
    temp_path = os.path.join(tempfile.gettempdir(), f"print_{uuid.uuid4()}.jpg")
    logging.info(f"Temporary file path for saving image: {temp_path}")
    image.save(temp_path)
    
    try:
        if ImagePrinter.print_image(temp_path, printer_name, print_size):
            logging.info(f"Image printed successfully on printer {printer_name}")
            return jsonify({'message': 'Image printed successfully'})
        else:
            logging.error(f"Failed to print image on printer {printer_name}")
            return jsonify({'error': 'Failed to print image'}), 500
    finally:
        os.remove(temp_path)
        logging.info(f"Temporary file removed: {temp_path}")

@app.route('/api/save-user-data', methods=['POST'])
def save_user_data():
    try:
        user_data = request.json
        name = user_data.get('name')
        phone = str(user_data.get('phone'))
        email = user_data.get('email', '')  # Default to empty string if not provided
        
        if not name or not phone:
            return jsonify({"message": "Missing name or phone"}), 400

        # Email is required for new entries, but we'll handle empty ones for backward compatibility
        if not email:
            return jsonify({"message": "Email is required"}), 400

        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()

        cursor.execute("CREATE TABLE IF NOT EXISTS user_table (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL)")
        cursor.execute("INSERT INTO user_table (name, phone, email) VALUES (?, ?, ?)", (name, "0" + phone, email))
        conn.commit()
        conn.close()

        return jsonify({"message": "User data saved successfully!"}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Failed to save user data"}), 500

@app.route('/api/export', methods=['GET'])
def export_to_csv():
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()

        cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{TABLE_NAME}'")
        if not cursor.fetchone():
            return jsonify({"error": f"Table '{TABLE_NAME}' does not exist."}), 404

        cursor.execute(f"SELECT * FROM {TABLE_NAME}")
        rows = cursor.fetchall()
        column_names = [description[0] for description in cursor.description]

        csv_file_path = f"{TABLE_NAME}.csv"
        with open(csv_file_path, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(column_names)
            writer.writerows(rows)

        return send_file(csv_file_path, as_attachment=True)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def init_hot_folder(app):
    """Initialize hot folder monitoring"""
    config = load_config()
    if config['HotFolder'].getboolean('enabled'):
        event_handler = HotFolderHandler(app)
        observer = Observer()
        observer.schedule(event_handler, config['HotFolder']['path'], recursive=False)
        observer.start()
        app.config['hot_folder_observer'] = observer
        print(f"Hot folder monitoring started at: {config['HotFolder']['path']}")

def init_database():
    """Initialize the SQLite database"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Check if table exists and get its schema
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_table'")
        table_exists = cursor.fetchone()
        
        if table_exists:
            # Check if email column exists
            cursor.execute("PRAGMA table_info(user_table)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'email' not in columns:
                # Add email column to existing table
                cursor.execute("ALTER TABLE user_table ADD COLUMN email TEXT DEFAULT ''")
                print("Added email column to existing user_table")
        
        # Create table with email column if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_table (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT NOT NULL
            )
        """)
        conn.commit()
        conn.close()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Error initializing database: {e}")

def cleanup():
    """Cleanup resources before shutdown"""
    try:
        if 'hot_folder_observer' in app.config:
            print("Stopping hot folder observer...")
            app.config['hot_folder_observer'].stop()
            app.config['hot_folder_observer'].join()
        print("Cleanup completed")
    except Exception as e:
        print(f"Error during cleanup: {e}")

@app.before_request
def before_request():
    """Initialize necessary components before the first request"""
    init_database()

if __name__ == '__main__':
    try:
        # Initialize configurations
        load_config()
        
        # Initialize hot folder monitoring
        init_hot_folder(app)
        
        # Start the Flask application
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        print(f"Error starting application: {e}")
    finally:
        cleanup()