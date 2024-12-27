from flask import Flask, request, jsonify, send_file, render_template
import os
import uuid
import json
import urllib.request
import urllib.parse
from PIL import Image
import io
import base64
import cv2
import tempfile
import qrcode.constants
import websocket
from flask_cors import CORS
from urllib.parse import unquote
import sqlite3
import qrcode

# Initialize the Flask app
app = Flask(__name__)
CORS(app)

# Configuration
BASE_ASSET_DIR = r"C:\Users\Kei\Downloads\faceswap_general\src\assets"  # Directory to store assets like images
SERVER_ADDRESS = "127.0.0.1:8188"  # Address of the backend server that handles face swapping
CLIENT_ID = str(uuid.uuid4())  # Unique identifier for each client (this will be sent to the backend to track the session)

# Function to queue a prompt for processing
def queue_prompt(prompt):
    # Creates a dictionary containing the prompt and client ID, then sends it to the backend server.
    p = {"prompt": prompt, "client_id": CLIENT_ID}
    data = json.dumps(p).encode('utf-8')  # Convert the data into JSON and encode it in UTF-8
    req = urllib.request.Request(f"http://{SERVER_ADDRESS}/prompt", data=data)  # Create a request to the backend
    return json.loads(urllib.request.urlopen(req).read())  # Send the request and return the response as a Python dictionary

# Function to retrieve an image from the backend server
def get_image(filename, subfolder, folder_type):
    # Constructs a query to retrieve an image based on the filename, subfolder, and type
    data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(data)  # Encodes the data into URL format
    # Makes a request to the backend server to get the image
    with urllib.request.urlopen(f"http://{SERVER_ADDRESS}/view?{url_values}") as response:
        return response.read()  # Returns the image data

# Function to get the history of a specific prompt
def get_history(prompt_id):
    # Makes a request to the backend server to retrieve the history of the prompt by its ID
    with urllib.request.urlopen(f"http://{SERVER_ADDRESS}/history/{prompt_id}") as response:
        return json.loads(response.read())  # Parses the response JSON and returns it

# Function to retrieve the images based on the prompt
def get_images(ws, prompt):
    # First, queue the prompt to the backend
    prompt_id = queue_prompt(prompt)['prompt_id']
    output_images = {}  # Dictionary to store the images

    # Infinite loop to receive responses from the WebSocket
    while True:
        out = ws.recv()  # Wait for a message from the WebSocket server
        if isinstance(out, str):
            message = json.loads(out)  # Parse the message as JSON
            # Check if the prompt is being executed and if the node output is available
            if message['type'] == 'executing':
                data = message['data']
                if data['node'] is None and data['prompt_id'] == prompt_id:
                    break  # Break the loop when the execution is complete
                else:
                    continue  # Continue checking until the execution completes

    # Get the history of the prompt to find the generated images
    history = get_history(prompt_id)[prompt_id]
    for node_id in history['outputs']:
        node_output = history['outputs'][node_id]
        # Check if images exist in the output of this node
        if 'images' in node_output:
            images_output = []
            for image in node_output['images']:
                # For each image in the node's output, retrieve the image data from the backend
                image_data = get_image(image['filename'], image['subfolder'], image['type'])
                images_output.append(image_data)
            output_images[node_id] = images_output  # Store the images in the output dictionary
    return output_images  # Return the images

# Function to load the workflow configuration
def load_workflow():
    with open("fswap.json", "r", encoding="utf-8") as f:
        return json.load(f)  # Loads the workflow from a JSON file and returns it as a Python dictionary

# Function to update the workflow with the selected template and source image paths
def update_workflow(workflow, template_path, source_path):
    # Update the inputs of nodes in the workflow based on the provided paths
    workflow["1"]["inputs"]["image"] = template_path  # Set the template image path
    workflow["3"]["inputs"]["image"] = source_path    # Set the source image path
    return workflow  # Return the updated workflow

# Helper function to validate and list images in a folder
def list_images(folder_path):
    if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
        return None
    return [
        f for f in os.listdir(folder_path)
        if os.path.isfile(os.path.join(folder_path, f)) and f.lower().endswith((".jpg", ".jpeg", ".png"))
    ]
    
# API endpoint to list images in a specific folder
@app.route('/api/templates', methods=['GET'])
def get_templates():
    folder = request.args.get('folder', '').strip()
    if not folder:
        return jsonify({"error": "Folder parameter is required."}), 400

    # Construct the full path to the folder
    full_path = os.path.join(BASE_ASSET_DIR, *folder.split('/'))

    # Get the list of images
    images = list_images(full_path)
    if images is None:
        return jsonify({"error": "Folder not found or invalid."}), 404

    return jsonify(images)

# API endpoint to fetch a specific image
@app.route('/api/template', methods=['GET'])
def get_template():
    filepath = request.args.get('filepath', '').strip()
    if not filepath:
        return jsonify({"error": "Filepath parameter is required."}), 400

    # Construct the full path to the image
    full_path = os.path.join(BASE_ASSET_DIR, *filepath.split('/'))

    if os.path.exists(full_path) and os.path.isfile(full_path):
        return send_file(full_path, mimetype='image/jpeg')

    return jsonify({"error": "Image not found."}), 404

@app.route('/api/swap', methods=['POST'])
def swap_face():
    """Perform the face swap operation."""
    template = request.files.get('template')
    source = request.files.get('source')
    print(f"Allowed methods: {request.url_rule.methods}") 

    # Log the details to ensure Flask is receiving the files
    if not template or not source:
        app.logger.error(f'Missing files: template={template} source={source}')
        return jsonify({'error': 'Missing template or source image'}), 400

    # Log file details
    app.logger.info(f'Received template: {template.filename}')
    app.logger.info(f'Received source: {source.filename}')

    # Save files (temporary path)
    template_path = os.path.join(BASE_ASSET_DIR, template.filename)
    source_path = os.path.join(tempfile.gettempdir(), f"source_{uuid.uuid4()}.jpg")

    # Save the files to disk
    template.save(template_path)
    source.save(source_path)

    # Log the paths where the files are saved
    app.logger.info(f'Template saved at: {template_path}')
    app.logger.info(f'Source saved at: {source_path}')

    workflow = load_workflow()
    updated_workflow = update_workflow(workflow, template_path, source_path)

    ws = websocket.WebSocket()
    ws.connect(f"ws://{SERVER_ADDRESS}/ws?clientId={CLIENT_ID}")
    images = get_images(ws, updated_workflow)

    # For simplicity, we'll just return the first image
    for node_id, image_data_list in images.items():
        if image_data_list:
            image_data = image_data_list[0]
            return jsonify({'image': base64.b64encode(image_data).decode('utf-8')})

    return jsonify({'error': 'No image generated'}), 400

# Save user data to SQLite Database
@app.route('/api/save-user-data', methods=['POST'])
def save_user_data():
    try:
        user_data = request.json
        name = user_data.get('name')
        phone = user_data.get('phone')
        
        app.logger.info(f'user data: {user_data}')
        app.logger.info(f'name: {name}')
        app.logger.info(f'phone: {phone}')
        
        if not name or not phone:
            return jsonify({"message": "Missing name or email"}), 400

        # Connect to SQLite database
        conn = sqlite3.connect('faceswap.db')
        cursor = conn.cursor()

        # Insert user data into the database
        cursor.execute("CREATE TABLE IF NOT EXISTS user_table (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone INTEGER NOT NULL)")
        cursor.execute("INSERT INTO user_table (name, phone) VALUES (?, ?)", (name, phone))
        conn.commit()

        # Close the connection
        conn.close()

        return jsonify({"message": "User data saved successfully!"}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Failed to save user data"}), 500
    
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=4
)

img = qr.add_data("https://blog.metaco.gg/wp-content/uploads/2023/07/gusion-mobile-legends.jpg")
img = qr.make_image()

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True)