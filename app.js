// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyDsFwMDU206MYGfW8saLfatHKmNFyn3-Ig",
    authDomain: "tracking-b2010.firebaseapp.com",
    projectId: "tracking-b2010",
    storageBucket: "tracking-b2010.appspot.com",
    messagingSenderId: "934539990542",
    appId: "1:934539990542:web:3b92136d41e4a7b1024e5f"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const ADMIN_KEY = "ViaAdmin2026!";

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = "dytzpxabq";
const CLOUDINARY_UPLOAD_PRESET = "Fedex-tracking";

// --- UTILS ---
const generateTrackingID = () => {
    return "FDX-" + Math.floor(1000 + Math.random() * 9000) + "-" + Math.floor(1000 + Math.random() * 9000);
};

// --- MOBILE MENU TOGGLE ---
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.getElementById('sidebar');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    }
});

// --- AUTH LOGIC ---
const loginBtn = document.getElementById('admin-login-btn');
const adminPassInput = document.getElementById('admin-pass');
const adminPanel = document.getElementById('admin-panel');
const adminLoginDiv = document.getElementById('admin-login');

if (loginBtn) {
    loginBtn.onclick = () => {        if (adminPassInput.value === ADMIN_KEY) {
            adminLoginDiv.style.display = 'none';
            adminPanel.style.display = 'block';
            document.body.classList.add('admin-active');
            loadAdminList();
            alert("Access Granted. Welcome, Logistics Manager.");
        } else {
            alert("Unauthorized Access: Invalid Security Key.");
        }
    };
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.onclick = () => location.reload();
}

// --- CLOUDINARY IMAGE UPLOAD ---
const imageInput = document.getElementById('package-image-input');
const uploadStatus = document.getElementById('upload-status');
const imagePreview = document.getElementById('image-preview');
let uploadedImageUrl = '';

if (imageInput) {
    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            uploadStatus.textContent = 'Please upload an image file';
            uploadStatus.style.color = '#dc3545';
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);

        // Upload to Cloudinary
        uploadStatus.textContent = 'Uploading image...';
        uploadStatus.style.color = 'var(--fedex-purple)';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.secure_url) {
                uploadedImageUrl = data.secure_url;
                uploadStatus.textContent = '✓ Image uploaded successfully!';
                uploadStatus.style.color = 'var(--success-green)';
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            uploadStatus.textContent = '✗ Upload failed. Please try again.';
            uploadStatus.style.color = '#dc3545';
        }
    });
}

// --- TRACKING LOGIC (INDEX.HTML) ---
const trackBtn = document.getElementById('track-btn');
if (trackBtn) {
    // Check if ID is passed in URL via the Admin "VIEW" button
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');
    if (idFromUrl) {
        document.getElementById('track-input').value = idFromUrl;
        setTimeout(() => trackBtn.click(), 500);
    }

    trackBtn.onclick = async () => {
        const code = document.getElementById('track-input').value.trim().toUpperCase();
        if (!code) return alert("Please enter a Tracking ID.");

        const originalBtnText = trackBtn.innerHTML;
        trackBtn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> TRACKING...";
        
        try {
            const doc = await db.collection('shipments').doc(code).get();
            if (doc.exists) {
                displayResults(code, doc.data());
            } else {
                alert("Tracking ID not found. Please check the number and try again.");
            }
        } catch (error) {            console.error("Error fetching shipment:", error);
            alert("Error fetching tracking information.");
        }
        trackBtn.innerHTML = originalBtnText;
    };
}

function displayResults(code, data) {
    const resultSection = document.getElementById('tracking-result');
    resultSection.style.display = 'block';
    
    // Basic Details
    document.getElementById('tracking-number-display').innerText = `ID: ${code}`;
    document.getElementById('status-badge').innerText = data.status || "N/A";
    
    // Sender & Receiver Names and Addresses
    document.getElementById('sender-name').innerText = data.senderName || "Not provided";
    document.getElementById('sender-address').innerText = data.senderAddress || "Origin Processing Center";
    document.getElementById('receiver-name').innerText = data.receiverName || "Not provided";
    document.getElementById('receiver-address').innerText = data.receiverAddress || "Destination Address";
    
    // Package Details
    document.getElementById('package-weight').innerText = data.weight || "Standard Weight";
    document.getElementById('package-type').innerText = data.packageType || "Package";
    
    // Asset Value and Fee
    document.getElementById('asset-value').innerText = data.assetValue || "Not specified";
    document.getElementById('fee-value').innerText = data.feeValue || "Not specified";
    
    // Delivery Date
    if (data.deliveryDate) {
        const deliveryDate = new Date(data.deliveryDate);
        document.getElementById('delivery-date').innerText = deliveryDate.toLocaleString();
    } else {
        document.getElementById('delivery-date').innerText = "To be determined";
    }
    
    // Proof Image with Modal
    const imgElement = document.getElementById('package-image');
    const imageContainer = document.getElementById('image-container');
    const noImageText = document.getElementById('no-image-text');
    
    if (data.packageImage) {
        imgElement.src = data.packageImage;
        imageContainer.style.display = 'block';
        noImageText.style.display = 'none';
        
        // Add click event for modal
        imgElement.onclick = () => openModal(data.packageImage);
    } else {        imageContainer.style.display = 'none';
        noImageText.style.display = 'block';
    }

    // Timeline History - Top to Bottom (chronological order)
    const timeline = document.getElementById('timeline');
    if (data.history && data.history.length > 0) {
        // Sort by time (oldest first for top-to-bottom display)
        const sortedHistory = [...data.history].sort((a, b) => {
            return new Date(a.time) - new Date(b.time);
        });
        
        timeline.innerHTML = sortedHistory.map(h => `
            <div class="timeline-item">
                <strong>${h.point}</strong>
                <small>${h.time}</small>
            </div>
        `).join('');
    } else {
        timeline.innerHTML = "<p style='color: #999;'>No history available for this shipment.</p>";
    }

    // Google Maps - Free Embed (No API Key Required)
    const coordsStr = data.currentCoords || "0,0";
    const coords = coordsStr.split(',').map(Number);
    
    if (document.getElementById('google-map-iframe')) {
        const lat = coords[0] || 0;
        const lng = coords[1] || 0;
        
        // Use Google Maps Embed API (free, no billing required)
        const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zwrBsJzAwLjAiTiDCsGwwMCcwMC4wIkU!5e0!3m2!1sen!2s!4v1000000000000`;
        
        document.getElementById('google-map-iframe').src = mapUrl;
    }
    
    // Smooth scroll to results
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Image Modal Functions
function openModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modal.style.display = 'block';
    modalImg.src = imageSrc;
}

function closeModal() {
    document.getElementById('imageModal').style.display = 'none';}

// Close modal when clicking X
const closeBtn = document.getElementById('closeModal');
if (closeBtn) {
    closeBtn.onclick = closeModal;
}

// Close modal when clicking outside image
window.onclick = function(event) {
    const modal = document.getElementById('imageModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// --- ADMIN DASHBOARD LOGIC ---
const saveBtn = document.getElementById('save-btn');
if (saveBtn) {
    saveBtn.onclick = async () => {
        let id = document.getElementById('edit-id').value.trim().toUpperCase();
        if (!id) id = generateTrackingID();

        const historyUpdate = document.getElementById('history-update').value.trim();
        const deliveryDateInput = document.getElementById('delivery-date').value;
        
        const shipmentData = {
            status: document.getElementById('status').value,
            senderName: document.getElementById('sender-name').value,
            senderAddress: document.getElementById('sender-address').value,
            receiverName: document.getElementById('receiver-name').value,
            receiverAddress: document.getElementById('receiver-address').value,
            packageType: document.getElementById('package-type').value,
            weight: document.getElementById('package-weight').value,
            assetValue: document.getElementById('asset-value').value || "",
            feeValue: document.getElementById('fee-value').value || "",
            deliveryDate: deliveryDateInput || "",
            currentCoords: document.getElementById('current-coords').value || "0,0",
            packageImage: uploadedImageUrl || "",
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // If history is provided, add it to the array
        if (historyUpdate) {
            shipmentData.history = firebase.firestore.FieldValue.arrayUnion({
                point: historyUpdate,
                time: new Date().toLocaleString()
            });
        }
        try {
            await db.collection('shipments').doc(id).set(shipmentData, { merge: true });
            alert(`SHIPMENT PUBLISHED!\nTracking ID: ${id}`);
            loadAdminList(); // Refresh the table
            clearForm();
        } catch (error) {
            alert("Error saving shipment.");
            console.error(error);
        }
    };
}

function clearForm() {
    document.getElementById('edit-id').value = '';
    document.getElementById('status').value = 'Label Created';
    document.getElementById('sender-name').value = '';
    document.getElementById('sender-address').value = '';
    document.getElementById('receiver-name').value = '';
    document.getElementById('receiver-address').value = '';
    document.getElementById('package-type').value = '';
    document.getElementById('package-weight').value = '';
    document.getElementById('asset-value').value = '';
    document.getElementById('fee-value').value = '';
    document.getElementById('delivery-date').value = '';
    document.getElementById('history-update').value = '';
    document.getElementById('current-coords').value = '';
    document.getElementById('package-image-input').value = '';
    document.getElementById('upload-status').textContent = '';
    document.getElementById('image-preview').innerHTML = '';
    uploadedImageUrl = '';
    document.getElementById('form-title').innerText = '<i class="fas fa-plus-circle"></i> Shipment Manifest Editor';
}

async function loadAdminList() {
    const list = document.getElementById('shipments-list');
    if (!list) return;

    const snap = await db.collection('shipments').orderBy('updatedAt', 'desc').get();
    list.innerHTML = "";
    
    snap.forEach(doc => {
        const data = doc.data();
        list.innerHTML += `
            <tr>
                <td><strong>${doc.id}</strong></td>
                <td>${data.receiverName || 'N/A'}</td>
                <td><span class="status-badge" style="font-size: 0.75rem; padding: 5px 15px;">${data.status}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn-small btn-view" onclick="viewShipment('${doc.id}')"><i class="fas fa-eye"></i></button>                        <button class="btn-small btn-edit" onclick="editShipment('${doc.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-small btn-delete" onclick="deleteShipment('${doc.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// Global functions for the buttons in the table
window.viewShipment = (id) => {
    window.open(`index.html?id=${id}`, '_blank');
};

window.editShipment = async (id) => {
    const doc = await db.collection('shipments').doc(id).get();
    const data = doc.data();
    
    document.getElementById('edit-id').value = id;
    document.getElementById('status').value = data.status || 'Label Created';
    document.getElementById('sender-name').value = data.senderName || "";
    document.getElementById('sender-address').value = data.senderAddress || "";
    document.getElementById('receiver-name').value = data.receiverName || "";
    document.getElementById('receiver-address').value = data.receiverAddress || "";
    document.getElementById('package-type').value = data.packageType || "";
    document.getElementById('package-weight').value = data.weight || "";
    document.getElementById('asset-value').value = data.assetValue || "";
    document.getElementById('fee-value').value = data.feeValue || "";
    
    if (data.deliveryDate) {
        document.getElementById('delivery-date').value = data.deliveryDate;
    }
    
    document.getElementById('current-coords').value = data.currentCoords || "";
    
    // Show image preview if exists
    if (data.packageImage) {
        uploadedImageUrl = data.packageImage;
        document.getElementById('image-preview').innerHTML = `<img src="${data.packageImage}" alt="Current Image">`;
        document.getElementById('upload-status').textContent = '✓ Current image loaded';
        document.getElementById('upload-status').style.color = 'var(--success-green)';
    }
    
    document.getElementById('form-title').innerText = "Edit Shipment: " + id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteShipment = async (id) => {
    if (confirm("Are you sure you want to delete shipment " + id + "?")) {
        await db.collection('shipments').doc(id).delete();        loadAdminList();
    }
};

// Active navigation highlighting
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && currentPath.includes(href)) {
            item.classList.add('active');
        }
    });
});