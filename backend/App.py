# app.py
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity

app = Flask(__name__)
# Enable CORS for React frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:Pavani%40SQL@localhost/community'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads/'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)

# ============================================
# DATABASE MODELS
# ============================================

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('user', 'admin'), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    reports = db.relationship('Report', backref='user', lazy=True)

class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    contact_email = db.Column(db.String(100))
    contact_phone = db.Column(db.String(20))
    
    reports = db.relationship('Report', backref='department', lazy=True)

class Report(db.Model):
    __tablename__ = 'reports'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.String(20))
    longitude = db.Column(db.String(20))
    image_path = db.Column(db.String(255))
    status = db.Column(db.Enum('pending', 'assigned', 'in_progress', 'resolved', 'rejected'), default='pending')
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    assigned_to = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)

# ============================================
# API ROUTES - USER AUTHENTICATION
# ============================================

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password') or not data.get('name'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Hash password
        hashed_password = generate_password_hash(data['password'])
        
        # Create new user
        new_user = User(
            name=data['name'],
            email=data['email'],
            password=hashed_password,
            role=data.get('role', 'user')
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': new_user.id,
                'name': new_user.name,
                'email': new_user.email,
                'role': new_user.role
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Missing email or password'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not check_password_hash(user.password, data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        return jsonify({
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================
# API ROUTES - REPORT MANAGEMENT
# ============================================

@app.route('/api/reports', methods=['POST'])
def create_report():
    """Create a new report"""
    try:
        # Get form data
        title = request.form.get('title')
        description = request.form.get('description')
        category = request.form.get('category')
        location = request.form.get('location')
        latitude = request.form.get('latitude')
        longitude = request.form.get('longitude')
        user_id = request.form.get('user_id')
        
        # Validate required fields
        if not all([title, description, category, location, user_id]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Handle image upload
        image_path = None
        if 'image' in request.files:
            image = request.files['image']
            if image.filename:
                filename = secure_filename(f"{datetime.now().timestamp()}_{image.filename}")
                image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                image.save(image_path)
        
        # Create new report
        new_report = Report(
            title=title,
            description=description,
            category=category,
            location=location,
            latitude=latitude,
            longitude=longitude,
            image_path=image_path,
            user_id=int(user_id)
        )
        
        db.session.add(new_report)
        db.session.commit()
        
        return jsonify({
            'message': 'Report submitted successfully',
            'report_id': new_report.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports', methods=['GET'])
def get_reports():
    """Get all reports with optional filters"""
    try:
        user_id = request.args.get('user_id')
        status = request.args.get('status')
        department_id = request.args.get('department_id')
        
        query = Report.query
        
        if user_id:
            query = query.filter_by(user_id=int(user_id))
        if status:
            query = query.filter_by(status=status)
        if department_id:
            query = query.filter_by(department_id=int(department_id))
        
        reports = query.order_by(Report.created_at.desc()).all()
        
        return jsonify([{
            'id': r.id,
            'title': r.title,
            'description': r.description,
            'category': r.category,
            'location': r.location,
            'latitude': r.latitude,
            'longitude': r.longitude,
            'image_path': r.image_path,
            'status': r.status,
            'user_name': r.user.name,
            'department_name': r.department.name if r.department else None,
            'assigned_to': r.assigned_to,
            'created_at': r.created_at.isoformat(),
            'updated_at': r.updated_at.isoformat()
        } for r in reports]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/<int:report_id>', methods=['GET'])
def get_report(report_id):
    """Get a specific report by ID"""
    try:
        report = Report.query.get_or_404(report_id)
        
        return jsonify({
            'id': report.id,
            'title': report.title,
            'description': report.description,
            'category': report.category,
            'location': report.location,
            'latitude': report.latitude,
            'longitude': report.longitude,
            'image_path': report.image_path,
            'status': report.status,
            'user_name': report.user.name,
            'department_name': report.department.name if report.department else None,
            'assigned_to': report.assigned_to,
            'created_at': report.created_at.isoformat(),
            'updated_at': report.updated_at.isoformat(),
            'resolved_at': report.resolved_at.isoformat() if report.resolved_at else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================
# API ROUTES - ADMIN ACTIONS
# ============================================

@app.route('/api/reports/<int:report_id>/assign', methods=['PUT'])
def assign_report(report_id):
    """Assign report to a department (Admin only)"""
    try:
        data = request.get_json()
        report = Report.query.get_or_404(report_id)
        
        if not data.get('department_id'):
            return jsonify({'error': 'Department ID required'}), 400
        
        report.department_id = int(data['department_id'])
        report.assigned_to = data.get('assigned_to')
        report.status = 'assigned'
        
        db.session.commit()
        
        return jsonify({'message': 'Report assigned successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/<int:report_id>/status', methods=['PUT'])
def update_status(report_id):
    """Update report status (Admin only)"""
    try:
        data = request.get_json()
        report = Report.query.get_or_404(report_id)
        
        if not data.get('status'):
            return jsonify({'error': 'Status required'}), 400
        
        report.status = data['status']
        
        if data['status'] == 'resolved':
            report.resolved_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Status updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ============================================
# API ROUTES - DEPARTMENT MANAGEMENT
# ============================================

@app.route('/api/departments', methods=['GET'])
def get_departments():
    """Get all departments"""
    try:
        departments = Department.query.all()
        
        return jsonify([{
            'id': d.id,
            'name': d.name,
            'category': d.category,
            'contact_email': d.contact_email,
            'contact_phone': d.contact_phone
        } for d in departments]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/departments', methods=['POST'])
def create_department():
    """Create a new department (Admin only)"""
    try:
        data = request.get_json()
        
        if not data.get('name') or not data.get('category'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        new_dept = Department(
            name=data['name'],
            category=data['category'],
            contact_email=data.get('contact_email'),
            contact_phone=data.get('contact_phone')
        )
        
        db.session.add(new_dept)
        db.session.commit()
        
        return jsonify({
            'message': 'Department created successfully',
            'department_id': new_dept.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ============================================
# STATIC FILE SERVING
# ============================================

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    """Serve uploaded images"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ============================================
# DATABASE INITIALIZATION
# ============================================

def init_database():
    """Initialize database with tables and sample data"""
    with app.app_context():
        db.create_all()
        
        # Check if departments already exist
        if Department.query.count() == 0:
            departments = [
                Department(name='Roads & Infrastructure', category='road', contact_email='roads@city.gov', contact_phone='123-456-7890'),
                Department(name='Electricity Department', category='electricity', contact_email='power@city.gov', contact_phone='123-456-7891'),
                Department(name='Water Supply Department', category='water', contact_email='water@city.gov', contact_phone='123-456-7892'),
                Department(name='Sanitation Department', category='sanitation', contact_email='sanitation@city.gov', contact_phone='123-456-7893'),
                Department(name='Drainage Department', category='drainage', contact_email='drainage@city.gov', contact_phone='123-456-7894'),
                Department(name='Public Works - Lighting', category='street_lights', contact_email='lights@city.gov', contact_phone='123-456-7895'),
                Department(name='Public Health Department', category='public_health', contact_email='health@city.gov', contact_phone='123-456-7896')
            ]
            
            db.session.bulk_save_objects(departments)
            db.session.commit()
            print("✅ Sample departments created")
        
        # Create default admin user if doesn't exist
        if not User.query.filter_by(email='admin@city.gov').first():
            admin = User(
                name='Admin User',
                email='admin@city.gov',
                password=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
            print("✅ Admin user created: admin@city.gov / admin123")

# ============================================
# ERROR HANDLERS
# ============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

# ============================================
# RUN APPLICATION
# ============================================

if __name__ == '__main__':
    init_database()
    print("\n" + "="*50)
    print("🚀 Flask Backend Server Starting...")
    print("="*50)
    print("📍 Server: http://localhost:5000")
    print("📍 API Base: http://localhost:5000/api")
    print("👤 Admin: admin@city.gov / admin123")
    print("="*50 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000)