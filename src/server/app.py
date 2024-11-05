# app.py
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

app = Flask(__name__)
CORS(app)

# Configuration
TEMPLATE_DIR = r"C:\Users\Kei\Downloads\faceswap_ai\src\assets"
SERVER_ADDRESS = "127.0.0.1:8188"
CLIENT_ID = str(uuid.uuid4())

#Function
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

# Routes

@app.route('/admin', methods=['GET'])
def admin_page():
    """Serve the admin HTML page."""
    return render_template('admin.html')

@app.route('/api/templates', methods=['GET'])
def get_templates():
    """Return a list of available templates."""
    templates = [f for f in os.listdir(TEMPLATE_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    return jsonify(templates)

@app.route('/api/template/<filename>', methods=['GET'])
def get_template(filename):
    """Return a specific template image."""
    filepath = os.path.join(TEMPLATE_DIR, filename)
    return send_file(filepath, mimetype='image/jpeg')

@app.route('/api/swap', methods=['POST'])
def swap_face():
    """Perform the face swap operation."""
    template = request.form.get('template')
    source = request.files.get('source')

    if not template or not source:
        return jsonify({'error': 'Missing template or source image'}), 400

    template_path = os.path.join(TEMPLATE_DIR, template)
    
    # Save the uploaded source image to a temporary file
    temp_dir = tempfile.gettempdir()
    source_path = os.path.join(temp_dir, f"source_{uuid.uuid4()}.jpg")
    source.save(source_path)

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

if __name__ == '__main__':
    app.run(debug=True)