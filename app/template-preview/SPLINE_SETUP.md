# Spline 3D Integration Setup Guide

This guide explains how to set up your Spline 3D scene to receive images from the template preview page.

## Quick Start

1. **Name your lamp objects** (e.g., "Side1", "Side2")
2. **Add Image Layers** to each side's material
3. **Export your scene** as `.splinecode` file
4. **Place the scene file** in `public/spline/` directory

## Step-by-Step Instructions

### Step 1: Get Object IDs from Spline

**Option A: Using Object IDs (Recommended - More Reliable)**

1. **Open your Spline project** with the lamp design
2. **Select the lamp object for Side 1**
3. **In the Properties panel** (right sidebar), look for the **Object ID** or **UUID**
   - This is a unique identifier like `296d26ed-52da-4238-b534-17ee7947136b`
   - Copy this ID
4. **Repeat for Side 2** - copy its Object ID

**Option B: Using Object Names (Fallback)**

1. **Select the lamp object for Side 1**
2. **In the Properties panel**, find the **Name** field
3. **Set the name** to something identifiable like `Side1` (or `LampSide1`)
4. **Repeat for Side 2** - name it `Side2` (or `LampSide2`)

**Important:** Object IDs (UUIDs) are more reliable than names. The component will try to find objects by ID first, then fall back to name if ID is not provided.

### Step 2: Add Image Layers to Materials

#### For Side 1:

1. **Select the lamp object for Side 1** (the one you named)
2. **In the Material settings panel:**
   - Click **"Add Layer"** or the **+** button
   - Select **"Image Layer"** from the layer types
   - This creates a new texture layer that can be updated programmatically
3. **Configure the Image Layer:**
   - The Image Layer will be used to display the uploaded image
   - You can adjust blending, opacity, and other properties as needed
   - **Note:** You don't need to connect variables - the code updates the layer directly

#### For Side 2:

1. **Select the lamp object for Side 2**
2. **Repeat the same process:**
   - Add an Image Layer to the material
   - Configure as needed

**Important:** Image Layers don't accept string variables directly. The component uses Spline Runtime API to update the Image Layer's `image` property programmatically.

### Step 3: Export Your Scene

1. **In Spline, export your scene:**
   - Go to **File** → **Export** → **Export for Web**
   - Or use **File** → **Export** → **Export as .splinecode**
   - This will create a `.splinecode` file

2. **Copy the exported files:**
   - Copy the `scene.splinecode` file
   - Also copy any supporting files (like `draco_decoder.wasm` and `draco_wasm_wrapper.js` if present)
   - Place them in your project's `public/spline/` directory

3. **File structure should be:**
   ```
   public/
     spline/
       scene.splinecode
       draco_decoder.wasm (if needed)
       draco_wasm_wrapper.js (if needed)
   ```

### Step 4: Configure Object IDs or Names

**Using Object IDs (Recommended):**

```tsx
<Spline3DPreview 
  image1={side1Image} 
  image2={side2Image}
  side1ObjectId="296d26ed-52da-4238-b534-17ee7947136b"  // Your Side 1 object ID
  side2ObjectId="your-side-2-object-id"  // Your Side 2 object ID
/>
```

**Using Object Names (Fallback):**

```tsx
<Spline3DPreview 
  image1={side1Image} 
  image2={side2Image}
  side1ObjectName="LampSide1"  // Your actual object name
  side2ObjectName="LampSide2"  // Your actual object name
/>
```

**Mixed (ID for one, name for other):**

```tsx
<Spline3DPreview 
  image1={side1Image} 
  image2={side2Image}
  side1ObjectId="296d26ed-52da-4238-b534-17ee7947136b"  // ID preferred
  side2ObjectName="LampSide2"  // Name as fallback
/>
```

**Note:** The component will try to find objects by ID first, then fall back to name if ID is not provided or not found.

## How It Works

The component uses Spline's Runtime API to directly update Image Layers. When you upload images:

1. Images are converted to data URLs (base64 encoded)
2. Component loads the Spline scene using `@splinetool/runtime`
3. Component finds objects by name using `findObjectByName()`
4. Component accesses each object's material and finds the Image Layer
5. Component directly updates the Image Layer's `image` property
6. Material is marked as needing update (`needsUpdate = true`)
7. The lamp displays the new images in real-time

**Code flow:**
```javascript
// Find object by name
const object = splineApp.findObjectByName("Side1")

// Access material
const material = object.material

// Find Image Layer
const imageLayer = material.layers.find(layer => layer.type === "image")

// Update image
imageLayer.image = imageDataUrl
material.needsUpdate = true
```

## Troubleshooting

### Images Not Appearing

1. **Check Object Names:**
   - Open browser DevTools Console (F12)
   - Look for `[Spline3D]` log messages
   - Check if objects are found: `Found Side 1 object:` or `Object "Side1" not found`
   - Verify object names match what you set in Spline
   - The console will show available object names if the named object isn't found

2. **Check Image Layers:**
   - Console will show: `No Image Layer found on Side 1 material`
   - Make sure you added Image Layers to the materials (not just base textures)
   - Check console for available layer types if Image Layer isn't found

3. **Check Scene Loading:**
   - Verify `scene.splinecode` is in `public/spline/` directory
   - Check Network tab in DevTools for failed file loads
   - Ensure the scene file is accessible at `/spline/scene.splinecode`

4. **Check Material Structure:**
   - Console will log material structure if issues occur
   - Verify materials have a `layers` array
   - Ensure Image Layer is in the layers array

### Data URL Issues

If Spline doesn't accept data URLs (base64 images):

1. **Option 1: Upload to Storage First**
   - Upload images to Supabase Storage or another CDN
   - Use the public URL instead of data URL

2. **Option 2: Convert to Blob URL**
   - We can modify the component to convert data URLs to blob URLs
   - Blob URLs are more compatible with some systems

3. **Option 3: Use Proxy Endpoint**
   - Create an API endpoint that serves images
   - Convert data URLs to served URLs

### Scene Not Loading

1. **Check Scene URL:**
   - Ensure the URL is correct and complete
   - Try opening the URL directly in a new browser tab
   - Verify the scene is published and accessible

2. **Check CORS/Embedding:**
   - Spline scenes should allow iframe embedding
   - Check Spline publish settings
   - Ensure "Public" or "Unlisted" is selected

3. **Check Network:**
   - Open DevTools Network tab
   - Look for failed requests to Spline
   - Check for CORS errors

### Textures Not Updating

1. **Check Image Layer Updates:**
   - Open DevTools Console
   - Look for `[Spline3D] Updated Side 1 texture` messages
   - If you see warnings about Image Layer not found, add Image Layers to materials

2. **Check Material Update:**
   - The component sets `material.needsUpdate = true`
   - If images still don't appear, try refreshing the scene
   - Some Spline versions may need different update methods

3. **Verify Image Format:**
   - Images are sent as data URLs (base64)
   - Spline Runtime should handle data URLs
   - If issues persist, try converting to blob URLs

## Advanced Configuration

### Finding Object IDs or Names

**In Spline Editor:**
1. Select the object you want to target
2. Check the Properties panel for:
   - **Object ID** or **UUID** (preferred - unique identifier)
   - **Name** (fallback - may not be unique)

**In Browser Console:**
1. Open DevTools Console (F12)
2. After the scene loads, check the console logs
3. If an object isn't found, the component will log all available objects with their IDs and names
4. Use the logged information to update your component props

**Example Console Output:**
```
[Spline3D] Object "Side1" not found in scene. {
  searchedById: false,
  searchedByName: true,
  availableObjects: [
    { id: "296d26ed-52da-4238-b534-17ee7947136b", name: "LampSide1" },
    { id: "abc123...", name: "LampSide2" }
  ]
}
```

### Testing the Integration

1. **Upload Side 1 Image:**
   - Upload an image in the "Side 1" uploader
   - Check console for `[Spline3D]` messages
   - Verify image appears on lamp side 1

2. **Upload Side 2 Image:**
   - Upload an image in the "Side 2" uploader
   - Check console for messages
   - Verify image appears on lamp side 2

3. **Rotate the Lamp:**
   - Use mouse/touch to rotate the 3D model
   - Verify both sides show the correct images

4. **Update Images:**
   - Upload new images
   - Verify they update in real-time on the lamp

## Technical Details

### Runtime API Usage

The component uses Spline's Runtime API to directly manipulate materials:

```javascript
// Load scene
const app = new Application(canvas)
await app.load("/spline/scene.splinecode")

// Find object
const object = app.findObjectByName("Side1")

// Access material and Image Layer
const material = object.material
const imageLayer = material.layers.find(layer => layer.type === "image")

// Update image
imageLayer.image = imageDataUrl
material.needsUpdate = true
```

### File Structure

```
public/
  spline/
    scene.splinecode          # Main Spline scene file
    draco_decoder.wasm        # Draco compression decoder (if needed)
    draco_wasm_wrapper.js     # Draco wrapper (if needed)
```

## Notes

- Images are sent as data URLs (base64 encoded) from the uploader
- Spline Runtime API handles data URLs directly
- The component loads the scene once and updates textures dynamically
- Image Layers are updated in real-time as images are uploaded
- No variables or postMessage needed - direct material manipulation

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify variable names match exactly (`image1`, `image2`)
3. Test with a simple public image URL first
4. Check Spline's documentation for your version
5. Ensure the scene is published and accessible
