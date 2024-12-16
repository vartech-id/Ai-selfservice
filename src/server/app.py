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
import websocket
from flask_cors import CORS
from urllib.parse import unquote

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
    with open("main.json", "r", encoding="utf-8") as f:
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
@app.route('/api/images', methods=['GET'])
def get_images():
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
@app.route('/api/image', methods=['GET'])
def get_image():
    filepath = request.args.get('filepath', '').strip()
    if not filepath:
        return jsonify({"error": "Filepath parameter is required."}), 400

    # Construct the full path to the image
    full_path = os.path.join(BASE_ASSET_DIR, *filepath.split('/'))

    if os.path.exists(full_path) and os.path.isfile(full_path):
        return send_file(full_path, mimetype='image/jpeg')

    return jsonify({"error": "Image not found."}), 404

# Flask route to handle the face swap operation
@app.route('/api/swap', methods=['POST'])
def swap_face():
    """Perform the face swap operation."""
    # Retrieve the template, source image, and template path from the request
    template = request.form.get('template')
    source = request.files.get('source')
    template_path = request.form.get('template_path')  # Full path to the template directory

    # Validate that the necessary data is present
    if not template or not source or not template_path:
        return jsonify({'error': 'Missing template or source image'}), 400  # Return an error if data is missing

    # Construct the full path to the template image
    template_full_path = os.path.join(BASE_ASSET_DIR, template_path, template)
    
    # Save the uploaded source image to a temporary file
    temp_dir = tempfile.gettempdir()
    source_path = os.path.join(temp_dir, f"source_{uuid.uuid4()}.jpg")
    source.save(source_path)  # Save the source image to a temporary file

    # Load the workflow configuration
    workflow = load_workflow()
    # Update the workflow with the selected template and source image paths
    updated_workflow = update_workflow(workflow, template_full_path, source_path)

    # Establish a WebSocket connection to the backend server
    ws = websocket.WebSocket()
    ws.connect(f"ws://{SERVER_ADDRESS}/ws?clientId={CLIENT_ID}")
    
    # Retrieve the generated images from the backend
    images = get_images(ws, updated_workflow)

    # Clean up by removing the temporary source image file
    os.remove(source_path)

    # If images are returned, return the first generated image as a base64-encoded string
    for node_id, image_data_list in images.items():
        if image_data_list:
            image_data = image_data_list[0]  # Get the first image in the list
            return jsonify({'image': base64.b64encode(image_data).decode('utf-8')})  # Return the image as base64

    return jsonify({'error': 'No image generated'}), 400  # If no image is generated, return an error

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True)