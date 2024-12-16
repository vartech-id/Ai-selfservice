from flask import Flask, request, jsonify, send_file, render_template
import os
import uuid
import json
import urllib.request
import urllib.parse
from pathlib import Path
import base64
import websocket
from flask_cors import CORS

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# Base directory for template assets
TEMPLATE_DIR = r"C:\Users\PHOTOBOOTH\Downloads\faceswap_ai\src\assets"

# Function to get directory structure
def get_directory_structure():
    """Return the complete directory structure as a nested dictionary."""
    structure = {}
    base_path = Path(TEMPLATE_DIR)
    
    # Iterate over each category directory in the base path
    for category in base_path.iterdir():
        if category.is_dir():
            structure[category.name] = {
                'men': [],  # List for men's templates
                'women': {  # Dictionary for women's templates by type
                    'hijab': [],
                    'non_hijab': []
                }
            }
            
            # Get men's templates
            men_path = category / 'men'
            if men_path.exists():
                structure[category.name]['men'] = [
                    f.name for f in men_path.iterdir() 
                    if f.suffix.lower() in ('.jpg', '.jpeg', '.png')
                ]
            
            # Get women's templates
            women_path = category / 'women'
            if women_path.exists():
                # Get hijab templates
                hijab_path = women_path / 'hijab'
                if hijab_path.exists():
                    structure[category.name]['women']['hijab'] = [
                        f.name for f in hijab_path.iterdir() 
                        if f.suffix.lower() in ('.jpg', '.jpeg', '.png')
                    ]
                
                # Get non-hijab templates
                non_hijab_path = women_path / 'non_hijab'
                if non_hijab_path.exists():
                    structure[category.name]['women']['non_hijab'] = [
                        f.name for f in non_hijab_path.iterdir() 
                        if f.suffix.lower() in ('.jpg', '.jpeg', '.png')
                    ]
    
    return structure

# API endpoint to get all available categories
@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Return all available categories."""
    structure = get_directory_structure()
    return jsonify(list(structure.keys()))

# API endpoint to get structure for a specific category
@app.route('/api/templates/<category>', methods=['GET'])
def get_category_structure(category):
    """Return the structure for a specific category."""
    structure = get_directory_structure()
    if category in structure:
        return jsonify(structure[category])
    return jsonify({'error': 'Category not found'}), 404

# API endpoint to get templates for a specific gender in a category
@app.route('/api/templates/<category>/<gender>', methods=['GET'])
def get_gender_templates(category, gender):
    """Return templates for a specific category and gender."""
    structure = get_directory_structure()
    if category not in structure:
        return jsonify({'error': 'Category not found'}), 404
    
    if gender == 'men':
        return jsonify(structure[category]['men'])
    elif gender == 'women':
        return jsonify(structure[category]['women'])
    return jsonify({'error': 'Gender not found'}), 404

# API endpoint to get templates for women's specific type (hijab/non-hijab)
@app.route('/api/templates/<category>/women/<type>', methods=['GET'])
def get_women_templates(category, type):
    """Return templates for women's specific type (hijab/non-hijab)."""
    structure = get_directory_structure()
    if category not in structure:
        return jsonify({'error': 'Category not found'}), 404
    
    if type in ['hijab', 'non_hijab']:
        return jsonify(structure[category]['women'][type])
    return jsonify({'error': 'Type not found'}), 404

# API endpoint to retrieve a specific template image by path
@app.route('/api/template/<category>/<path:template_path>', methods=['GET'])
def get_template(category, template_path):
    """Return a specific template image."""
    full_path = os.path.join(TEMPLATE_DIR, category, template_path)
    if os.path.exists(full_path) and os.path.isfile(full_path):
        return send_file(full_path, mimetype='image/jpeg')
    return jsonify({'error': 'Template not found'}), 404

# Queue prompt for processing
def queue_prompt(prompt):
    p = {"prompt": prompt, "client_id": CLIENT_ID}
    data = json.dumps(p).encode('utf-8')
    req = urllib.request.Request(f"http://{SERVER_ADDRESS}/prompt", data=data)
    return json.loads(urllib.request.urlopen(req).read())

# Function to retrieve image by filename and folder type
def get_image(filename, subfolder, folder_type):
    data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(data)
    with urllib.request.urlopen(f"http://{SERVER_ADDRESS}/view?{url_values}") as response:
        return response.read()

# Function to retrieve processing history for a specific prompt ID
def get_history(prompt_id):
    with urllib.request.urlopen(f"http://{SERVER_ADDRESS}/history/{prompt_id}") as response:
        return json.loads(response.read())

# Connect to WebSocket and retrieve generated images based on prompt
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

# Load workflow configuration from file
def load_workflow():
    with open("fswap.json", "r", encoding="utf-8") as f:
        return json.load(f)

# Update workflow with specific template and source image paths
def update_workflow(workflow, template_path, source_path):
    workflow["1"]["inputs"]["image"] = template_path
    workflow["3"]["inputs"]["image"] = source_path
    return workflow

# API endpoint to perform face swap
@app.route('/api/swap', methods=['POST'])
def swap_face():
    """Perform the face swap operation with updated template path handling."""
    template_path = request.form.get('template_path')
    source = request.files.get('source')

    if not template_path or not source:
        app.logger.error(f'Missing data: template_path={template_path} source={source}')
        return jsonify({'error': 'Missing template path or source image'}), 400

    # Verify if the template path exists
    full_template_path = os.path.join(TEMPLATE_DIR, template_path)
    if not os.path.exists(full_template_path):
        return jsonify({'error': 'Template not found'}), 404

    # Save the source image
    source_path = os.path.join(tempfile.gettempdir(), f"source_{uuid.uuid4()}.jpg")
    source.save(source_path)

    # Load and update workflow
    workflow = load_workflow()
    updated_workflow = update_workflow(workflow, full_template_path, source_path)

    # Connect to WebSocket
    ws = websocket.WebSocket()
    ws.connect(f"ws://{SERVER_ADDRESS}/ws?clientId={CLIENT_ID}")
    
    # Retrieve and return processed images
    images = get_images(ws, updated_workflow)

    # Return the first image in the output
    for node_id, image_data_list in images.items():
        if image_data_list:
            image_data = image_data_list[0]
            return jsonify({'image': base64.b64encode(image_data).decode('utf-8')})

    return jsonify({'error': 'No image generated'}), 400

# Main entry point for running the app
if __name__ == '__main__':
    # Configuration parameters
    SERVER_ADDRESS = "127.0.0.1:8188"
    CLIENT_ID = str(uuid.uuid4())
    app.run(debug=True)